// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Gameplay — Player, block interaction, inventory
// SPEC-002: Gameplay systems for voxel-style engine
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import {
  CHUNK_SIZE, CHUNK_HEIGHT, WORLD_MIN_Y, SEA_LEVEL,
  BIOMES, WorldGenPipeline, VoxelChunk,
} from './jardvoxel-survival-engine.js';
import {
  MC_BLOCKS, MC_BLOCK_COLORS, MC_BLOCK_NAMES, MC_BLOCK_HARDNESS,
  MC_PLACEABLE_BLOCKS, BLOCK,
  buildChunkMesh, buildWaterMesh,
} from './jardvoxel-survival-mesher.js';
import { generateChunkWithFeatures } from './jardvoxel-survival-features.js';
import { NetherGenerator, NETHER_BLOCKS } from './jardvoxel-survival-nether.js';

// ═══════════════════════════════════════════════════════════
// World — manages chunks, block access, meshing
// ═══════════════════════════════════════════════════════════

export class SurvivalWorld {
  constructor(scene, seed, renderDistance = 3) {
    this.scene = scene;
    this.seed = seed;
    this.generator = new WorldGenPipeline(seed);
    this.renderDistance = renderDistance;
    this._adaptiveEnabled = true;
    this._targetRenderDist = renderDistance;
    this.chunks = new Map();
    this.meshes = new Map();
    this.waterMeshes = new Map();
    this.pendingChunks = new Set();
    this.chunkPool = [];
    this.maxPoolSize = 50;
    this.worker = null;
    this.workerSupported = typeof Worker !== 'undefined';
    this.dimension = 'overworld';
    this.netherGenerator = new NetherGenerator();
    this.redstoneManager = null;
    this._initWorker();
  }

  _initWorker() {
    if (!this.workerSupported) return;
    try {
      this.worker = new Worker(new URL('./jardvoxel-survival-worker.js', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e) => {
        const { cx, cz, blocks } = e.data;
        const chunk = this._getOrCreateChunk(cx, cz);
        chunk.blocks = new Uint8Array(blocks);
        chunk.generated = true;
        // Apply features on main thread (they need chunk modification)
        generateChunkWithFeatures(chunk, this);
        if (this.onChunkGenerated) this.onChunkGenerated(cx, cz);
        this.pendingChunks.delete(this._chunkKey(cx, cz));
        this._rebuildChunkMesh(cx, cz);
        // Rebuild neighbors to fix border faces
        this._rebuildChunkMesh(cx - 1, cz);
        this._rebuildChunkMesh(cx + 1, cz);
        this._rebuildChunkMesh(cx, cz - 1);
        this._rebuildChunkMesh(cx, cz + 1);
      };
      this.worker.postMessage({ type: 'init', seed: this.seed });
    } catch (err) {
      console.warn('Worker init failed, falling back to sync:', err);
      this.worker = null;
      this.workerSupported = false;
    }
  }

  _chunkKey(cx, cz) { return `${cx},${cz}`; }

  _getOrCreateChunk(cx, cz) {
    const key = this._chunkKey(cx, cz);
    if (this.chunks.has(key)) return this.chunks.get(key);
    const chunk = new VoxelChunk(cx, cz, this.generator);
    this.chunks.set(key, chunk);
    return chunk;
  }

  generateChunk(cx, cz) {
    const key = this._chunkKey(cx, cz);
    if (this.pendingChunks.has(key)) return;
    if (this.chunks.has(key) && this.chunks.get(key).generated) return;

    this.pendingChunks.add(key);
    const chunk = this._getOrCreateChunk(cx, cz);

    if (this.worker) {
      this.worker.postMessage({ cx, cz });
    } else {
      generateChunkWithFeatures(chunk, this);
      if (this.onChunkGenerated) this.onChunkGenerated(cx, cz);
      this.pendingChunks.delete(key);
      this._rebuildChunkMesh(cx, cz);
      // Rebuild neighbors to fix border faces
      this._rebuildChunkMesh(cx - 1, cz);
      this._rebuildChunkMesh(cx + 1, cz);
      this._rebuildChunkMesh(cx, cz - 1);
      this._rebuildChunkMesh(cx, cz + 1);
    }
  }

  _rebuildChunkMesh(cx, cz, skipNeighbors = false) {
    const key = this._chunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk || !chunk.generated) return;

    // Remove old mesh
    if (this.meshes.has(key)) {
      const old = this.meshes.get(key);
      this.scene.remove(old);
      old.geometry.dispose();
      this.meshes.delete(key);
    }
    if (this.waterMeshes.has(key)) {
      const old = this.waterMeshes.get(key);
      this.scene.remove(old);
      old.geometry.dispose();
      this.waterMeshes.delete(key);
    }

    // Determine LOD level based on distance to player chunk
    let lod = 0;
    if (this._playerChunkX !== undefined) {
      const dist = Math.max(Math.abs(cx - this._playerChunkX), Math.abs(cz - this._playerChunkZ));
      if (dist > this.renderDistance * 0.6) lod = 1;
      if (dist > this.renderDistance * 0.8) lod = 2;
    }

    const meshData = buildChunkMesh(chunk, this, lod);
    if (meshData.positions.length === 0) return;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(meshData.colors, 3));
    geometry.setIndex(meshData.indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = true;
    mesh.userData.chunkKey = key;
    this.scene.add(mesh);
    this.meshes.set(key, mesh);

    // Water mesh
    const waterData = buildWaterMesh(chunk, this);
    if (waterData.positions.length > 0) {
      const wGeo = new THREE.BufferGeometry();
      wGeo.setAttribute('position', new THREE.Float32BufferAttribute(waterData.positions, 3));
      wGeo.setAttribute('color', new THREE.Float32BufferAttribute(waterData.colors, 3));
      wGeo.setIndex(waterData.indices);
      wGeo.computeVertexNormals();

      const wMat = new THREE.MeshLambertMaterial({
        vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false,
      });
      const wMesh = new THREE.Mesh(wGeo, wMat);
      wMesh.frustumCulled = true;
      wMesh.userData.chunkKey = key;
      this.scene.add(wMesh);
      this.waterMeshes.set(key, wMesh);
    }
  }

  getBlock(worldX, worldY, worldZ) {
    if (worldY < WORLD_MIN_Y || worldY >= WORLD_MIN_Y + CHUNK_HEIGHT) return BLOCK.AIR;
    const cx = Math.floor(worldX / CHUNK_SIZE);
    const cz = Math.floor(worldZ / CHUNK_SIZE);
    const key = this._chunkKey(cx, cz);
    if (!this.chunks.has(key)) return BLOCK.STONE;
    const chunk = this.chunks.get(key);
    if (!chunk.generated) return BLOCK.STONE;
    const lx = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = worldY - WORLD_MIN_Y;
    return chunk.getBlock(lx, ly, lz);
  }

  setBlock(worldX, worldY, worldZ, block) {
    if (worldY < WORLD_MIN_Y || worldY >= WORLD_MIN_Y + CHUNK_HEIGHT) return;
    const cx = Math.floor(worldX / CHUNK_SIZE);
    const cz = Math.floor(worldZ / CHUNK_SIZE);
    const key = this._chunkKey(cx, cz);
    if (!this.chunks.has(key)) return;
    const chunk = this.chunks.get(key);
    if (!chunk.generated) return;
    const lx = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = worldY - WORLD_MIN_Y;
    chunk.setBlock(lx, ly, lz, block);
    this._rebuildChunkMesh(cx, cz);
    // Rebuild neighbors if on edge
    if (lx === 0) this._rebuildChunkMesh(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this._rebuildChunkMesh(cx + 1, cz);
    if (lz === 0) this._rebuildChunkMesh(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this._rebuildChunkMesh(cx, cz + 1);
  }

  getBiome(worldX, worldZ) {
    return this.generator.getBiome(worldX, worldZ);
  }

  update(playerX, playerZ, fps = 60) {
    const pcx = Math.floor(playerX / CHUNK_SIZE);
    const pcz = Math.floor(playerZ / CHUNK_SIZE);
    this._playerChunkX = pcx;
    this._playerChunkZ = pcz;

    // Adaptive render distance
    if (this._adaptiveEnabled) {
      if (fps < 30 && this.renderDistance > 2) {
        this.renderDistance = Math.max(2, this.renderDistance - 1);
        this._targetRenderDist = this.renderDistance;
      } else if (fps > 55 && this.renderDistance < this._targetRenderDist) {
        this.renderDistance = Math.min(this._targetRenderDist, this.renderDistance + 1);
      }
    }
    const rd = this.renderDistance;

    // Generate nearby chunks (limit to 2 per frame to avoid stutter)
    let generated = 0;
    const maxPerFrame = 2;
    for (let ring = 0; ring <= rd && generated < maxPerFrame; ring++) {
      for (let dx = -ring; dx <= ring && generated < maxPerFrame; dx++) {
        for (let dz = -ring; dz <= ring && generated < maxPerFrame; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > rd) continue;
          const cx = pcx + dx;
          const cz = pcz + dz;
          const key = this._chunkKey(cx, cz);
          if (!this.chunks.has(key) || !this.chunks.get(key).generated) {
            this.generateChunk(cx, cz);
            generated++;
          }
        }
      }
    }

    // Unload distant chunks
    for (const [key, chunk] of this.chunks) {
      const dx = chunk.cx - pcx;
      const dz = chunk.cz - pcz;
      if (Math.sqrt(dx * dx + dz * dz) > rd + 2) {
        if (this.meshes.has(key)) {
          const m = this.meshes.get(key);
          this.scene.remove(m);
          m.geometry.dispose();
          this.meshes.delete(key);
        }
        if (this.waterMeshes.has(key)) {
          const m = this.waterMeshes.get(key);
          this.scene.remove(m);
          m.geometry.dispose();
          this.waterMeshes.delete(key);
        }
        this.chunks.delete(key);
      }
    }
  }

  getLoadedChunkCount() {
    return this.meshes.size;
  }
}

// ═══════════════════════════════════════════════════════════
// Player Controller — first-person, collision, raycast
// ═══════════════════════════════════════════════════════════

export class PlayerController {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;
    this.velocity = new THREE.Vector3();
    this.onGround = false;
    this.flying = false;
    this.inWater = false;
    this.wasInWater = false;
    this.wasOnGround = true;
    this.justJumped = false;
    this.justLanded = false;
    this.justSplashed = false;
    this.fallStartY = 0;
    this.fallDistance = 0;
    this.moveSpeed = 4.3;
    this.runSpeed = 7.0;
    this.flySpeed = 10.0;
    this.gravity = 24;
    this.jumpVel = 8;
    this.playerHeight = 1.8;
    this.playerWidth = 0.3;
    this.position = new THREE.Vector3(0, 80, 0);
    this.yaw = 0;
    this.pitch = 0;
  }

  spawn() {
    // Find surface height at origin
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      const block = this.world.getBlock(0, WORLD_MIN_Y + y, 0);
      if (block !== BLOCK.AIR && block !== BLOCK.WATER) {
        this.position.set(0.5, WORLD_MIN_Y + y + 2, 0.5);
        this.camera.position.copy(this.position);
        return;
      }
    }
    this.position.set(0.5, 80, 0.5);
    this.camera.position.copy(this.position);
  }

  update(dt, keys, touchInput = null) {
    const speed = this.flying ? this.flySpeed : (keys.shift ? this.runSpeed : this.moveSpeed);
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const moveDir = new THREE.Vector3();
    if (touchInput && touchInput.moveX !== null && touchInput.moveY !== null) {
      const mx = touchInput.moveX, my = touchInput.moveY;
      const mag = Math.sqrt(mx * mx + my * my);
      if (mag > 0.01) {
        moveDir.addScaledVector(forward, -my).addScaledVector(right, mx);
        moveDir.normalize().multiplyScalar(speed * Math.min(1, mag));
      }
    } else {
      if (keys.w) moveDir.add(forward);
      if (keys.s) moveDir.sub(forward);
      if (keys.a) moveDir.sub(right);
      if (keys.d) moveDir.add(right);
      if (moveDir.lengthSq() > 0) moveDir.normalize().multiplyScalar(speed);
    }

    if (this.flying) {
      this.velocity.x = moveDir.x;
      this.velocity.z = moveDir.z;
      this.velocity.y = 0;
      if (keys.space) this.velocity.y = speed;
      if (keys.shift) this.velocity.y = -speed;
    } else {
      this.velocity.x = moveDir.x;
      this.velocity.z = moveDir.z;
      // Check if in water
      const feetBlock = this.world.getBlock(
        Math.floor(this.position.x),
        Math.floor(this.position.y - 0.1),
        Math.floor(this.position.z)
      );
      this.inWater = feetBlock === BLOCK.WATER;
      if (this.inWater && !this.wasInWater) this.justSplashed = true;
      this.wasInWater = this.inWater;

      if (this.inWater) {
        this.velocity.y -= this.gravity * 0.3 * dt;
        this.velocity.y = Math.max(this.velocity.y, -3);
        if (keys.space) this.velocity.y = 3;
      } else {
        this.velocity.y -= this.gravity * dt;
        if (keys.space && this.onGround) {
          this.velocity.y = this.jumpVel;
          this.onGround = false;
          this.justJumped = true;
        }
      }
    }

    // Apply velocity with collision
    this._moveAxis('x', this.velocity.x * dt);
    this._moveAxis('z', this.velocity.z * dt);
    this._moveAxis('y', this.velocity.y * dt);

    this.camera.position.copy(this.position);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  _moveAxis(axis, amount) {
    if (amount === 0) return;
    const pos = this.position.clone();
    pos[axis] += amount;

    const minX = Math.floor(pos.x - this.playerWidth);
    const maxX = Math.floor(pos.x + this.playerWidth);
    const minY = Math.floor(pos.y - this.playerHeight);
    const maxY = Math.floor(pos.y);
    const minZ = Math.floor(pos.z - this.playerWidth);
    const maxZ = Math.floor(pos.z + this.playerWidth);

    let collision = false;
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const block = this.world.getBlock(x, y, z);
          if (block !== BLOCK.AIR && block !== BLOCK.WATER) {
            collision = true;
            break;
          }
        }
        if (collision) break;
      }
      if (collision) break;
    }

    if (collision) {
      if (axis === 'y') {
        if (amount < 0) {
          // Track fall damage
          if (this.fallDistance > 3 && !this.flying) {
            this.lastFallDistance = this.fallDistance;
          }
          this.onGround = true;
          this.fallDistance = 0;
          if (!this.wasOnGround) this.justLanded = true;
          this.wasOnGround = true;
        }
        this.velocity.y = 0;
      }
    } else {
      this.position[axis] = pos[axis];
      if (axis === 'y' && amount > 0) this.onGround = false;
      if (axis === 'y' && !this.flying && !this.inWater) {
        this.fallDistance += Math.abs(amount);
      }
    }
  }

  // Raycast for block targeting
  raycast(maxDist = 5) {
    const origin = this.position.clone();
    const dir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );

    const step = 0.05;
    for (let d = 0; d < maxDist; d += step) {
      const x = Math.floor(origin.x + dir.x * d);
      const y = Math.floor(origin.y + dir.y * d);
      const z = Math.floor(origin.z + dir.z * d);
      const block = this.world.getBlock(x, y, z);
      if (block !== BLOCK.AIR && block !== BLOCK.WATER) {
        // Determine face
        const prevX = Math.floor(origin.x + dir.x * (d - step));
        const prevY = Math.floor(origin.y + dir.y * (d - step));
        const prevZ = Math.floor(origin.z + dir.z * (d - step));
        return { x, y, z, block, face: { dx: prevX - x, dy: prevY - y, dz: prevZ - z } };
      }
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// Inventory System
// ═══════════════════════════════════════════════════════════

export class Inventory {
  constructor() {
    this.hotbar = new Array(9).fill(null);
    this.main = new Array(27).fill(null);
    this.selectedSlot = 0;
    this.creativeMode = true;
  }

  addToHotbar(slot, blockId) {
    this.hotbar[slot] = { block: blockId, count: this.creativeMode ? -1 : 64 };
  }

  getSelected() {
    return this.hotbar[this.selectedSlot];
  }

  setSelected(slot) {
    this.selectedSlot = Math.max(0, Math.min(8, slot));
  }

  addBlock(blockId) {
    if (this.creativeMode) return;
    for (let i = 0; i < this.hotbar.length; i++) {
      if (this.hotbar[i] && this.hotbar[i].block === blockId) {
        this.hotbar[i].count++;
        return true;
      }
    }
    for (let i = 0; i < this.hotbar.length; i++) {
      if (!this.hotbar[i]) {
        this.hotbar[i] = { block: blockId, count: 1 };
        return true;
      }
    }
    for (let i = 0; i < this.main.length; i++) {
      if (this.main[i] && this.main[i].block === blockId) {
        this.main[i].count++;
        return true;
      }
    }
    for (let i = 0; i < this.main.length; i++) {
      if (!this.main[i]) {
        this.main[i] = { block: blockId, count: 1 };
        return true;
      }
    }
    return false;
  }

  removeSelected() {
    const item = this.hotbar[this.selectedSlot];
    if (!item) return null;
    if (!this.creativeMode) {
      item.count--;
      if (item.count <= 0) this.hotbar[this.selectedSlot] = null;
    }
    return item.block;
  }
}

// ═══════════════════════════════════════════════════════════
// Day/Night Cycle
// ═══════════════════════════════════════════════════════════

export class DayNightCycle {
  constructor(scene) {
    this.scene = scene;
    this.time = 0.3;
    this.cycleDuration = 1200; // 20 minutes
    this.sun = null;
    this.moon = null;
    this.ambientLight = null;
    this.sunLight = null;
    this.stars = null;
    this.skyDome = null;
    this.clouds = null;
    this.cloudPlanes = [];
    this._initLights();
    this._initStars();
    this._initSkyDome();
    this._initClouds();
  }

  _initLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.sunLight.position.set(50, 100, 50);
    this.scene.add(this.sunLight);

    // Sun mesh
    const sunGeo = new THREE.SphereGeometry(5, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    this.sun = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sun);

    // Moon mesh
    const moonGeo = new THREE.SphereGeometry(3, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    this.moon = new THREE.Mesh(moonGeo, moonMat);
    this.scene.add(this.moon);
  }

  _initStars() {
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      const r = 400;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness * (0.9 + Math.random() * 0.1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 1.5, sizeAttenuation: false, vertexColors: true,
      transparent: true, opacity: 0, depthWrite: false,
    });
    this.stars = new THREE.Points(geo, mat);
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);
  }

  _initSkyDome() {
    const geo = new THREE.SphereGeometry(450, 32, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x2a6df4) },
        bottomColor: { value: new THREE.Color(0xb8d4f0) },
        offset: { value: 0.0 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          float t = max(pow(max(h, 0.0), exponent), 0.0);
          gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
        }
      `,
    });
    this.skyDome = new THREE.Mesh(geo, mat);
    this.skyDome.frustumCulled = false;
    this.scene.add(this.skyDome);
  }

  _initClouds() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(256, 256);
    for (let x = 0; x < 256; x++) {
      for (let y = 0; y < 256; y++) {
        let n = 0;
        let amp = 1;
        let freq = 0.02;
        for (let o = 0; o < 4; o++) {
          n += Math.sin(x * freq + y * freq * 0.7) * amp;
          n += Math.cos(y * freq * 1.3 + x * freq * 0.5) * amp;
          amp *= 0.5;
          freq *= 2;
        }
        n = (n + 4) / 8;
        n = Math.max(0, Math.min(1, (n - 0.45) * 3));
        const idx = (x + y * 256) * 4;
        imgData.data[idx] = 255;
        imgData.data[idx + 1] = 255;
        imgData.data[idx + 2] = 255;
        imgData.data[idx + 3] = Math.floor(n * 180);
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    const cloudHeights = [55, 58, 61];
    for (let i = 0; i < cloudHeights.length; i++) {
      const ctex = texture.clone();
      ctex.needsUpdate = true;
      const geo = new THREE.PlaneGeometry(800, 800);
      const mat = new THREE.MeshBasicMaterial({
        map: ctex, transparent: true, opacity: 0.5,
        depthWrite: false, fog: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = cloudHeights[i];
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      this.cloudPlanes.push({ mesh, texture: ctex, speed: 0.0003 + i * 0.0001 });
    }
    this.clouds = this.cloudPlanes;
  }

  update(dt, playerPos) {
    this.time += dt / this.cycleDuration;
    if (this.time >= 1) this.time -= 1;

    const angle = this.time * Math.PI * 2;
    const sunX = Math.cos(angle) * 200;
    const sunY = Math.sin(angle) * 200;
    const sunZ = 50;

    this.sun.position.set(sunX, sunY, sunZ);
    this.moon.position.set(-sunX, -sunY, sunZ);
    this.sunLight.position.set(sunX, sunY, sunZ);

    // Light intensity based on sun height
    const dayFactor = Math.max(0, Math.sin(angle));
    const nightFactor = Math.max(0, -Math.sin(angle));

    // Sunset factor: peaks near horizon (sunY near 0)
    const horizonFactor = Math.max(0, 1 - Math.abs(sunY) / 80);

    this.sunLight.intensity = 0.2 + dayFactor * 0.8;
    this.ambientLight.intensity = 0.15 + dayFactor * 0.35 + nightFactor * 0.05;

    // Sky dome colors with sunset interpolation
    const dayTop = new THREE.Color(0x2a6df4);
    const dayBottom = new THREE.Color(0xb8d4f0);
    const nightTop = new THREE.Color(0x0a0a20);
    const nightBottom = new THREE.Color(0x1a1a3a);
    const sunsetTop = new THREE.Color(0x4a2090);
    const sunsetBottom = new THREE.Color(0xff7a3d);

    const topColor = dayTop.clone().lerp(nightTop, 1 - dayFactor);
    topColor.lerp(sunsetTop, horizonFactor * 0.5);
    const bottomColor = dayBottom.clone().lerp(nightBottom, 1 - dayFactor);
    bottomColor.lerp(sunsetBottom, horizonFactor * 0.6);

    this.skyDome.material.uniforms.topColor.value.copy(topColor);
    this.skyDome.material.uniforms.bottomColor.value.copy(bottomColor);

    // Background color follows horizon
    this.scene.background = bottomColor.clone();

    // Dynamic fog color
    if (this.scene.fog) {
      this.scene.fog.color.copy(bottomColor);
    }

    // Stars: fade in at night
    if (this.stars) {
      this.stars.material.opacity = nightFactor * 0.9;
      if (playerPos) {
        this.stars.position.set(playerPos.x, 0, playerPos.z);
      }
    }

    // Sky dome follows player
    if (playerPos && this.skyDome) {
      this.skyDome.position.set(playerPos.x, 0, playerPos.z);
    }

    // Clouds: move with wind, color shift, follow player
    for (const cp of this.cloudPlanes) {
      cp.texture.offset.x += cp.speed * dt * 60;
      cp.texture.offset.y += cp.speed * 0.5 * dt * 60;
      // Cloud color: white → pink sunset → grey night
      const cloudColor = new THREE.Color(0xffffff);
      cloudColor.lerp(new THREE.Color(0xff9966), horizonFactor * 0.4);
      cloudColor.lerp(new THREE.Color(0x444466), nightFactor * 0.5);
      cp.mesh.material.color = cloudColor;
      cp.mesh.material.opacity = 0.3 + dayFactor * 0.3;
      if (playerPos) {
        cp.mesh.position.x = playerPos.x;
        cp.mesh.position.z = playerPos.z;
      }
    }

    // Sun/moon visibility
    this.sun.visible = sunY > -10;
    this.moon.visible = sunY < 10;
  }

  getTimeString() {
    const hours = Math.floor(this.time * 24);
    const minutes = Math.floor((this.time * 24 - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

// ═══════════════════════════════════════════════════════════
// Audio System — procedural Web Audio API
// ═══════════════════════════════════════════════════════════

export class GameAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.masterGain = null;
    this.volume = 0.5;
    this.sfxVolume = 0.8;
    this.ambientVolume = 0.3;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
      this.enabled = true;
    } catch (e) {
      console.warn('Audio not available');
    }
  }

  setVolume(v) {
    this.volume = v;
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  playBreak(blockId) {
    if (!this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const freq = 100 + (blockId % 20) * 20;
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(gain).connect(this.masterGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playPlace() {
    if (!this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.value = 200;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain).connect(this.masterGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playStep() {
    if (!this.enabled) return;
    const noise = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, 1024, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < 1024; i++) data[i] = (Math.random() - 0.5) * 0.3;
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    noise.connect(gain).connect(this.masterGain || this.ctx.destination);
    noise.start();
  }

  playSplash() {
    if (!this.enabled) return;
    const noise = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, 4096, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < 4096; i++) data[i] = (Math.random() - 0.5) * 0.5;
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.3);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    noise.connect(filter).connect(gain).connect(this.masterGain || this.ctx.destination);
    noise.start();
  }

  playJump() {
    if (!this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.1);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain).connect(this.masterGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playLand() {
    if (!this.enabled) return;
    const noise = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, 2048, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < 2048; i++) data[i] = (Math.random() - 0.5) * 0.4;
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    noise.connect(filter).connect(gain).connect(this.masterGain || this.ctx.destination);
    noise.start();
  }

  playAmbientCave() {
    if (!this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    osc.frequency.setValueAtTime(40 + Math.random() * 30, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30 + Math.random() * 20, this.ctx.currentTime + 2);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
    osc.connect(filter).connect(gain).connect(this.masterGain || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 2);
  }
}
