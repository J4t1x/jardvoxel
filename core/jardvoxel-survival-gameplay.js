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
  MC_BLOCKS, BLOCK,
  ALL_BLOCK_COLORS as MC_BLOCK_COLORS,
  ALL_BLOCK_NAMES as MC_BLOCK_NAMES,
  ALL_BLOCK_HARDNESS as MC_BLOCK_HARDNESS,
  ALL_PLACEABLE_BLOCKS as MC_PLACEABLE_BLOCKS,
} from './blocks-registry.js';
import {
  buildChunkMesh, buildWaterMesh,
} from './jardvoxel-survival-mesher.js';
import { generateChunkWithFeatures } from './jardvoxel-survival-features.js';
import { NetherGenerator, NETHER_BLOCKS } from './jardvoxel-survival-nether.js';
import { CharacterGenerator, CharacterAnimator } from './jardvoxel-survival-character.js';
import { ThirdPersonCamera } from './jardvoxel-survival-thirdperson.js';
import { WaterMaterialManager, WATER_COLORS } from './jardvoxel-survival-water.js';
import { InstancedFeatureRenderer } from './jardvoxel-survival-instanced.js';
import { WorkerPool } from './jardvoxel-survival-worker-pool.js';

// Non-solid blocks that players and mobs can walk through
const NON_SOLID_BLOCKS = new Set([
  BLOCK.AIR, BLOCK.WATER, BLOCK.LAVA,
  MC_BLOCKS.TORCH, MC_BLOCKS.LANTERN,
  MC_BLOCKS.FLOWER_RED, MC_BLOCKS.FLOWER_YELLOW,
  MC_BLOCKS.TALL_GRASS, MC_BLOCKS.FERN, MC_BLOCKS.DEAD_BUSH,
  MC_BLOCKS.BAMBOO, MC_BLOCKS.MOSS,
]);

function isBlockSolid(blockId) {
  return !NON_SOLID_BLOCKS.has(blockId);
}

// ═══════════════════════════════════════════════════════════
// World — manages chunks, block access, meshing
// ═══════════════════════════════════════════════════════════

export class SurvivalWorld {
  constructor(scene, seed, renderDistance = 6, useHierarchy = false, usePatagonia = false) {
    this.scene = scene;
    this.seed = seed;
    this.generator = new WorldGenPipeline(seed);
    if (useHierarchy) this.generator.enableHierarchy();
    this.renderDistance = renderDistance;
    this._adaptiveEnabled = true;
    this._targetRenderDist = renderDistance;
    this._minRenderDist = 16;
    this._initialLoadBurst = 0;
    this._usePatagonia = usePatagonia;
    this.chunks = new Map();
    this.meshes = new Map();
    this.waterMeshes = new Map();
    this.pendingChunks = new Set();
    this.chunkPool = [];
    this.maxPoolSize = 1200; // Increased pool for larger render distances
    this.worker = null;
    this.workerSupported = typeof Worker !== 'undefined';
    this.dimension = 'overworld';
    this.netherGenerator = new NetherGenerator();
    this.redstoneManager = null;
    // SPEC-CHUNK-OPT: Frustum culling + heightmap occlusion
    this._frustum = new THREE.Frustum();
    this._projScreenMatrix = new THREE.Matrix4();
    this._heightmaps = new Map();
    this._camera = null;
    this.waterMaterialManager = null;
    // Shared materials by LOD level (avoid per-chunk allocation)
    this._lodMaterials = null;
    // PRD G-05: Instanced feature renderer for vegetation
    this._instancedRenderer = new InstancedFeatureRenderer(scene);
    this._poissonEnabled = true;
    // PRD P-04: Multi-worker pool (replaces single worker)
    this._workerPool = null;
    this._useWorkerPool = false;
    this._initWorker();
  }

  initWaterMaterialManager(renderer, camera) {
    this.waterMaterialManager = new WaterMaterialManager(renderer, this.scene, camera);
    return this.waterMaterialManager;
  }

  _initLodMaterials() {
    if (this._lodMaterials) return;
    this._lodMaterials = {
      near: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0.0, flatShading: true, side: THREE.FrontSide }),
      far: new THREE.MeshLambertMaterial({ vertexColors: true }),
    };
  }

  async _initWorker() {
    if (!this.workerSupported) return;
    try {
      // PRD P-04: Use WorkerPool with up to 2 workers (mobile-friendly)
      const numWorkers = Math.min(2, navigator.hardwareConcurrency || 2);
      this._workerPool = new WorkerPool(
        new URL('./jardvoxel-survival-worker.js', import.meta.url),
        numWorkers
      );
      const count = await this._workerPool.init({
        seed: this.seed,
        useHierarchy: this.generator._useHierarchy,
        patagonia: this._usePatagonia,
      });
      if (count > 0) {
        this._useWorkerPool = true;
        this.worker = null; // Clear legacy single worker
      } else {
        this._workerPool = null;
        this.workerSupported = false;
      }
    } catch (err) {
      console.warn('WorkerPool init failed, falling back to sync:', err);
      this._workerPool = null;
      this._useWorkerPool = false;
      this.workerSupported = false;
    }
  }

  // Called when a worker finishes generating a chunk
  _onWorkerChunkDone(cx, cz, blocks, minContentY, maxContentY) {
    const chunk = this._getOrCreateChunk(cx, cz);
    chunk.blocks = new Uint8Array(blocks);
    chunk.generated = true;
    if (minContentY !== undefined) {
      chunk.minContentY = minContentY;
      chunk.maxContentY = maxContentY;
    }
    generateChunkWithFeatures(chunk, this);
    if (this.onChunkGenerated) this.onChunkGenerated(cx, cz);
    this.pendingChunks.delete(this._chunkKey(cx, cz));
    this._rebuildChunkMesh(cx, cz);
    if (this._initialLoadBurst > 0) {
      if (!this._pendingNeighborRebuilds) this._pendingNeighborRebuilds = new Set();
      this._pendingNeighborRebuilds.add(`${cx-1},${cz}`);
      this._pendingNeighborRebuilds.add(`${cx+1},${cz}`);
      this._pendingNeighborRebuilds.add(`${cx},${cz-1}`);
      this._pendingNeighborRebuilds.add(`${cx},${cz+1}`);
    } else {
      this._rebuildChunkMesh(cx - 1, cz);
      this._rebuildChunkMesh(cx + 1, cz);
      this._rebuildChunkMesh(cx, cz - 1);
      this._rebuildChunkMesh(cx, cz + 1);
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

    if (this._useWorkerPool && this._workerPool) {
      // PRD P-04: Dispatch to worker pool with distance-based priority
      const priority = this._playerChunkX !== undefined
        ? Math.sqrt((cx - this._playerChunkX) ** 2 + (cz - this._playerChunkZ) ** 2)
        : 0;
      this._workerPool.generateChunk(cx, cz, priority).then(data => {
        this._onWorkerChunkDone(data.cx, data.cz, data.blocks, data.minContentY, data.maxContentY);
      }).catch(err => {
        console.warn('WorkerPool chunk generation failed, falling back to sync:', err);
        generateChunkWithFeatures(chunk, this);
        if (this.onChunkGenerated) this.onChunkGenerated(cx, cz);
        this.pendingChunks.delete(key);
        this._rebuildChunkMesh(cx, cz);
        this._rebuildChunkMesh(cx - 1, cz);
        this._rebuildChunkMesh(cx + 1, cz);
        this._rebuildChunkMesh(cx, cz - 1);
        this._rebuildChunkMesh(cx, cz + 1);
      });
    } else if (this.worker) {
      this.worker.postMessage({ cx, cz });
    } else {
      generateChunkWithFeatures(chunk, this);
      if (this.onChunkGenerated) this.onChunkGenerated(cx, cz);
      this.pendingChunks.delete(key);
      this._rebuildChunkMesh(cx, cz);
      // Rebuild neighbors to fix border faces (skip during burst)
      if (this._initialLoadBurst > 0) {
        if (!this._pendingNeighborRebuilds) this._pendingNeighborRebuilds = new Set();
        this._pendingNeighborRebuilds.add(`${cx-1},${cz}`);
        this._pendingNeighborRebuilds.add(`${cx+1},${cz}`);
        this._pendingNeighborRebuilds.add(`${cx},${cz-1}`);
        this._pendingNeighborRebuilds.add(`${cx},${cz+1}`);
      } else {
        this._rebuildChunkMesh(cx - 1, cz);
        this._rebuildChunkMesh(cx + 1, cz);
        this._rebuildChunkMesh(cx, cz - 1);
        this._rebuildChunkMesh(cx, cz + 1);
      }
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

    // SPEC-CHUNK-OPT: 5-level LOD based on distance to player chunk
    let lod = 0;
    if (this._playerChunkX !== undefined) {
      const dx = cx - this._playerChunkX;
      const dz = cz - this._playerChunkZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= 4) lod = 0;
      else if (dist <= 8) lod = 1;
      else if (dist <= 16) lod = 2;
      else if (dist <= 28) lod = 3;
      else lod = 4;
    }

    // SPEC-CHUNK-OPT: Build heightmap for occlusion culling
    this._buildHeightmap(cx, cz, chunk);

    // Aggressive LOD: distant chunks get simplified geometry
    const meshData = buildChunkMesh(chunk, this, lod);
    if (meshData.positions.length === 0) return;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(meshData.colors, 3));
    geometry.setIndex(meshData.indices);
    
    // Skip vertex normals for LOD 2+ to save performance
    if (lod < 2) {
      geometry.computeVertexNormals();
    }

    // Low-poly look: flatShading for near chunks (LOD 0-1), Lambert for distant
    this._initLodMaterials();
    const material = lod <= 1 ? this._lodMaterials.near : this._lodMaterials.far;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = lod === 0; // Only near chunks cast shadows
    mesh.receiveShadow = lod <= 1;
    mesh.frustumCulled = true;
    mesh.userData.chunkKey = key;
    mesh.userData.lod = lod;
    this.scene.add(mesh);
    this.meshes.set(key, mesh);

    // Water mesh (skip for LOD 3+ — too far for water detail)
    if (lod < 3) {
    const waterData = buildWaterMesh(chunk, this);
    if (waterData.positions.length > 0) {
      const wGeo = new THREE.BufferGeometry();
      wGeo.setAttribute('position', new THREE.Float32BufferAttribute(waterData.positions, 3));
      wGeo.setAttribute('color', new THREE.Float32BufferAttribute(waterData.colors, 3));
      if (waterData.uvs && waterData.uvs.length > 0) {
        wGeo.setAttribute('uv', new THREE.Float32BufferAttribute(waterData.uvs, 2));
      }
      wGeo.setIndex(waterData.indices);
      wGeo.computeVertexNormals();

      const wMat = this.waterMaterialManager
        ? this.waterMaterialManager.getMaterial()
        : new THREE.MeshStandardMaterial({
            vertexColors: true, transparent: true, opacity: 0.72, depthWrite: false,
            roughness: 0.15, metalness: 0.3, side: THREE.DoubleSide,
            emissive: 0x112244, emissiveIntensity: 0.15,
          });
      const wMesh = new THREE.Mesh(wGeo, wMat);
      wMesh.frustumCulled = true;
      wMesh.userData.chunkKey = key;
      this.scene.add(wMesh);
      this.waterMeshes.set(key, wMesh);
    }
    } // end if lod < 3

    // PRD G-05: Build instanced feature meshes (flowers, grass, mushrooms, rocks)
    if (lod < 3) {
      this._instancedRenderer.buildForChunk(cx, cz, chunk, lod);
    }
  }

  // SPEC-CHUNK-OPT: Build heightmap for a chunk (occlusion culling)
  _buildHeightmap(cx, cz, chunk) {
    const heights = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
    let sum = 0;
    // Use stored maxContentY to limit scan range (avoids scanning 384 levels)
    const maxY = chunk.maxContentY !== undefined
      ? Math.min(CHUNK_HEIGHT - 1, chunk.maxContentY + 1)
      : Math.min(CHUNK_HEIGHT - 1, SEA_LEVEL + 131 - WORLD_MIN_Y);
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        let topY = 0;
        for (let y = maxY; y >= 0; y--) {
          const b = chunk.getBlock(x, y, z);
          if (b !== BLOCK.AIR && b !== BLOCK.WATER) {
            topY = y;
            break;
          }
        }
        heights[x + z * CHUNK_SIZE] = topY;
        sum += topY;
      }
    }
    this._heightmaps.set(this._chunkKey(cx, cz), {
      heights,
      avgHeight: sum / (CHUNK_SIZE * CHUNK_SIZE),
    });
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

  isBlockSolidForCamera(worldX, worldY, worldZ) {
    if (worldY < WORLD_MIN_Y || worldY >= WORLD_MIN_Y + CHUNK_HEIGHT) return false;
    const cx = Math.floor(worldX / CHUNK_SIZE);
    const cz = Math.floor(worldZ / CHUNK_SIZE);
    const key = this._chunkKey(cx, cz);
    if (!this.chunks.has(key)) return false;
    const chunk = this.chunks.get(key);
    if (!chunk.generated) return false;
    const lx = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = worldY - WORLD_MIN_Y;
    const block = chunk.getBlock(lx, ly, lz);
    return block !== BLOCK.AIR && block !== BLOCK.WATER;
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

  update(playerX, playerZ, fps = 60, camera = null, dt = 0.016) {
    const pcx = Math.floor(playerX / CHUNK_SIZE);
    const pcz = Math.floor(playerZ / CHUNK_SIZE);
    this._playerChunkX = pcx;
    this._playerChunkZ = pcz;
    this._camera = camera;

    // Adaptive render distance
    if (this._adaptiveEnabled) {
      if (fps < 35 && this.renderDistance > this._minRenderDist) {
        this.renderDistance = Math.max(this._minRenderDist, this.renderDistance - 1);
      } else if (fps > 50 && this.renderDistance < this._targetRenderDist) {
        this.renderDistance = Math.min(this._targetRenderDist, this.renderDistance + 1);
      }
    }
    
    // Altitude-based render distance boost: when flying high, load more chunks
    // This reduces the visible gap between loaded terrain and the skydome
    let altitudeBoost = 0;
    if (this._camera && this._camera.position.y > 80) {
      const altitudeFactor = Math.min(1, (this._camera.position.y - 80) / 120);
      altitudeBoost = Math.floor(altitudeFactor * 24); // Up to +24 chunks at high altitude
    }
    
    const rd = this.renderDistance + altitudeBoost;

    // SPEC-CHUNK-OPT: Camera direction for view-direction loading
    let cameraYaw = 0;
    if (camera) {
      if (!this._tmpCamDir) this._tmpCamDir = new THREE.Vector3();
      camera.getWorldDirection(this._tmpCamDir);
      cameraYaw = Math.atan2(this._tmpCamDir.x, this._tmpCamDir.z);
    }
    const PI = Math.PI;
    const frontArc = PI / 3;
    const sideArc = PI * 0.6;

    // SPEC-CHUNK-OPT: Priority queue — distance-based (simplified to avoid blocking)
    // Load all chunks within render distance, prioritizing closest to player
    const toGen = [];
    
    for (let dx = -rd; dx <= rd; dx++) {
      for (let dz = -rd; dz <= rd; dz++) {
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > rd) continue;
        const cx = pcx + dx, cz = pcz + dz;
        const key = this._chunkKey(cx, cz);
        if (this.chunks.has(key) && this.chunks.get(key).generated) continue;
        if (this.pendingChunks.has(key)) continue;

        toGen.push({ cx, cz, dist });
      }
    }
    // Sort by distance only - simplest and most reliable
    toGen.sort((a, b) => a.dist - b.dist);

    // SPEC-CHUNK-OPT: Generate up to N per frame (budget-conscious)
    // Surface-first: fewer chunks per frame = smoother FPS, terrain appears faster
    // because each chunk generates surface band only (not full 384 depth)
    const burstActive = this._initialLoadBurst > 0;
    const maxPerFrame = burstActive ? 4 : (fps < 45 ? 3 : (camera ? 2 : 2));
    if (burstActive) this._initialLoadBurst--;
    for (let i = 0; i < Math.min(maxPerFrame, toGen.length); i++) {
      this.generateChunk(toGen[i].cx, toGen[i].cz);
    }

    // Process pending neighbor rebuilds after burst loading
    if (!burstActive && this._pendingNeighborRebuilds && this._pendingNeighborRebuilds.size > 0) {
      let processed = 0;
      for (const nkey of this._pendingNeighborRebuilds) {
        if (processed >= 4) break;
        const [ncx, ncz] = nkey.split(',').map(Number);
        this._rebuildChunkMesh(ncx, ncz);
        this._pendingNeighborRebuilds.delete(nkey);
        processed++;
      }
      if (this._pendingNeighborRebuilds.size === 0) this._pendingNeighborRebuilds = null;
    }

    // LOD re-meshing: rebuild chunks whose LOD no longer matches their distance
    // Throttled to every 0.5s to avoid iterating all meshes every frame
    this._lodCheckTimer = (this._lodCheckTimer || 0) + dt;
    if (this._lodCheckTimer >= 0.5) {
      this._lodCheckTimer = 0;
    let lodUpgrades = 0, lodDowngrades = 0;
    const maxUpgrades = 3, maxDowngrades = 2;
    for (const [key, mesh] of this.meshes) {
      if (lodUpgrades >= maxUpgrades && lodDowngrades >= maxDowngrades) break;
      const parts = key.split(',');
      const cx = parseInt(parts[0]);
      const cz = parseInt(parts[1]);
      const dx = cx - pcx, dz = cz - pcz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      let targetLod;
      if (dist <= 4) targetLod = 0;
      else if (dist <= 8) targetLod = 1;
      else if (dist <= 16) targetLod = 2;
      else if (dist <= 28) targetLod = 3;
      else targetLod = 4;
      const currentLod = mesh.userData.lod ?? 0;
      if (targetLod < currentLod && lodUpgrades < maxUpgrades) {
        this._rebuildChunkMesh(cx, cz, true);
        lodUpgrades++;
      } else if (targetLod > currentLod && lodDowngrades < maxDowngrades) {
        this._rebuildChunkMesh(cx, cz, true);
        lodDowngrades++;
      }
    }
    } // end throttled LOD check

    // Unload distant chunks
    for (const [key, chunk] of this.chunks) {
      const dx = chunk.cx - pcx;
      const dz = chunk.cz - pcz;
      if (Math.sqrt(dx * dx + dz * dz) > rd + 3) {
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
        this._instancedRenderer.disposeChunk(key);
        this.chunks.delete(key);
        this._heightmaps.delete(key);
      }
    }

    // SPEC-CHUNK-OPT: Frustum culling + heightmap occlusion + aggressive unloading
    // Throttled to every 0.15s to avoid iterating all meshes every frame
    this._frustumTimer = (this._frustumTimer || 0) + dt;
    if (camera && this._frustumTimer >= 0.15) {
      this._frustumTimer = 0;
      this._projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      this._frustum.setFromProjectionMatrix(this._projScreenMatrix);
      if (!this._tmpVec) this._tmpVec = new THREE.Vector3();
      const tmpVec = this._tmpVec;
      
      const unloadDist = rd * 2.5; // Unload chunks 2.5x beyond render distance
      const keysToRemove = [];
      
      for (const [key, mesh] of this.meshes) {
        const [cx, cz] = key.split(',').map(Number);
        const chunkCenterX = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
        const chunkCenterZ = cz * CHUNK_SIZE + CHUNK_SIZE / 2;
        const dx = chunkCenterX - playerX;
        const dz = chunkCenterZ - playerZ;
        const chunkDist = Math.sqrt(dx * dx + dz * dz);
        
        // Aggressive unloading for memory management
        if (chunkDist > unloadDist) {
          keysToRemove.push(key);
          continue;
        }
        
        if (chunkDist < CHUNK_SIZE * 2) {
          mesh.visible = true;
        } else {
          tmpVec.set(chunkCenterX, CHUNK_HEIGHT / 2, chunkCenterZ);
          const inFrustum = this._frustum.containsPoint(tmpVec);
          if (!inFrustum) {
            mesh.visible = false;
          } else {
            mesh.visible = this._checkOcclusion(cx, cz, pcx, pcz, chunkDist);
          }
        }
      }
      
      // Remove distant chunks to free memory
      for (const key of keysToRemove) {
        this._removeChunk(key);
      }
      
      for (const [key, wmesh] of this.waterMeshes) {
        wmesh.visible = this.meshes.get(key) ? this.meshes.get(key).visible : true;
      }

      // PRD G-05: Sync instanced feature visibility with chunk mesh visibility
      for (const [key, mesh] of this.meshes) {
        this._instancedRenderer.setChunkVisible(key, mesh.visible);
      }
    }
  }

  // SPEC-CHUNK-OPT: Heightmap occlusion culling
  _checkOcclusion(cx, cz, pcx, pcz, chunkDist) {
    if (chunkDist < CHUNK_SIZE * 4) return true;
    const key = this._chunkKey(cx, cz);
    const hm = this._heightmaps.get(key);
    if (!hm) return true;
    const dx = cx - pcx;
    const dz = cz - pcz;
    const steps = Math.max(Math.abs(dx), Math.abs(dz));
    if (steps <= 1) return true;
    for (let s = 1; s < steps; s++) {
      const ix = pcx + Math.round(dx * s / steps);
      const iz = pcz + Math.round(dz * s / steps);
      const iKey = this._chunkKey(ix, iz);
      const iHm = this._heightmaps.get(iKey);
      if (!iHm) continue;
      if (iHm.avgHeight > hm.avgHeight + 5) return false;
    }
    return true;
  }

  getLoadedChunkCount() {
    return this.meshes.size;
  }

  _removeChunk(key) {
    if (this.meshes.has(key)) {
      const m = this.meshes.get(key);
      this.scene.remove(m);
      m.geometry.dispose();
      this.meshes.delete(key);
    }
    if (this.waterMeshes && this.waterMeshes.has(key)) {
      const wm = this.waterMeshes.get(key);
      this.scene.remove(wm);
      wm.geometry.dispose();
      this.waterMeshes.delete(key);
    }
    this._instancedRenderer.disposeChunk(key);
    this.chunks.delete(key);
    this._heightmaps.delete(key);
  }

  clearAllChunks() {
    for (const key of Array.from(this.chunks.keys())) {
      this._removeChunk(key);
    }
    this.pendingChunks.clear();
  }

  dispose() {
    // Clean up all meshes and workers
    for (const key of Array.from(this.chunks.keys())) {
      this._removeChunk(key);
    }
    if (this._workerPool) {
      this._workerPool.dispose();
      this._workerPool = null;
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this._instancedRenderer) {
      this._instancedRenderer.dispose();
    }
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
    this.body = null;
    this.viewMode = 'first';
    this.animator = null;
    this.characterSeed = 0;
    this._mining = false;
    this.thirdPersonCamera = new ThirdPersonCamera();
    // Pre-allocated temp vectors to avoid GC pressure in hot paths
    this._tmpForward = new THREE.Vector3();
    this._tmpRight = new THREE.Vector3();
    this._tmpMoveDir = new THREE.Vector3();
    this._tmpOrigin = new THREE.Vector3();
    this._tmpDir = new THREE.Vector3();
    this._tmpPos = new THREE.Vector3();
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
    const speedMult = this.speedMultiplier || 1.0;
    const speed = (this.flying ? this.flySpeed : (keys.shift ? this.runSpeed : this.moveSpeed)) * speedMult;
    const forward = this._tmpForward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = this._tmpRight.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const moveDir = this._tmpMoveDir.set(0, 0, 0);
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

    if (this.viewMode === 'third' && this.thirdPersonCamera) {
      this.thirdPersonCamera.update(this.camera, this, this.world);
    } else {
      this.camera.position.copy(this.position);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    }

    if (this.animator && this.body) {
      this.animator.update(dt, this, this.body);
    }
  }

  initBody(scene, seed) {
    this.characterSeed = seed || Math.floor(Math.random() * 2147483647);
    this.body = CharacterGenerator.generate(this.characterSeed);
    this.animator = new CharacterAnimator();
    if (scene) scene.add(this.body);
    this._updateBodyVisibility();
  }

  toggleView() {
    this.viewMode = this.viewMode === 'first' ? 'third' : 'first';
    this._updateBodyVisibility();
  }

  _updateBodyVisibility() {
    if (!this.body) return;
    const ud = this.body.userData;
    if (this.viewMode === 'first') {
      // First person: hide the whole body so it never clips into the camera.
      if (ud.head) ud.head.visible = true; // reset for third-person toggle
      this.body.visible = false;
    } else {
      // Third person: show everything
      if (ud.head) ud.head.visible = true;
      this.body.visible = true;
    }
  }

  _moveAxis(axis, amount) {
    if (amount === 0) return;
    const pos = this._tmpPos.copy(this.position);
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
          if (isBlockSolid(block)) {
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
    const origin = this._tmpOrigin.copy(this.position);
    const dir = this._tmpDir.set(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );

    // DDA voxel traversal — ~10x faster than 0.05-step raymarch
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);
    const stepX = dir.x > 0 ? 1 : -1;
    const stepY = dir.y > 0 ? 1 : -1;
    const stepZ = dir.z > 0 ? 1 : -1;
    const tDeltaX = Math.abs(1 / dir.x);
    const tDeltaY = Math.abs(1 / dir.y);
    const tDeltaZ = Math.abs(1 / dir.z);
    let tMaxX = ((dir.x > 0 ? (x + 1 - origin.x) : (origin.x - x)) * tDeltaX);
    let tMaxY = ((dir.y > 0 ? (y + 1 - origin.y) : (origin.y - y)) * tDeltaY);
    let tMaxZ = ((dir.z > 0 ? (z + 1 - origin.z) : (origin.z - z)) * tDeltaZ);
    let prevX = x, prevY = y, prevZ = z;
    let t = 0;
    while (t < maxDist) {
      const block = this.world.getBlock(x, y, z);
      if (block !== BLOCK.AIR && block !== BLOCK.WATER) {
        return { x, y, z, block, face: { dx: prevX - x, dy: prevY - y, dz: prevZ - z } };
      }
      prevX = x; prevY = y; prevZ = z;
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        x += stepX; t = tMaxX; tMaxX += tDeltaX;
      } else if (tMaxY < tMaxZ) {
        y += stepY; t = tMaxY; tMaxY += tDeltaY;
      } else {
        z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ;
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

// SPEC-BIOME-OVERHAUL: Biome sky color configurations
const BIOME_SKY_COLORS = {
  ocean: {
    dayTop: 0x6680F0, dayBottom: 0xB0D8F8,
    sunsetTop: 0x4A5080, sunsetBottom: 0xFF9A6D,
    nightTop: 0x050510, nightBottom: 0x0A1A30,
  },
  deep_ocean: {
    dayTop: 0x4A60D0, dayBottom: 0x90C0E8,
    sunsetTop: 0x3A4070, sunsetBottom: 0xFF8A5D,
    nightTop: 0x050510, nightBottom: 0x081528,
  },
  beach: {
    dayTop: 0x72C0E8, dayBottom: 0xC0E0F8,
    sunsetTop: 0x4A5080, sunsetBottom: 0xFF9A6D,
    nightTop: 0x050510, nightBottom: 0x0A1520,
  },
  plains: {
    dayTop: 0x72C0E8, dayBottom: 0xC0E0F8,
    sunsetTop: 0x4A5080, sunsetBottom: 0xFF9A6D,
    nightTop: 0x050510, nightBottom: 0x0A1520,
  },
  forest: {
    dayTop: 0x5AC0E0, dayBottom: 0xC0E0F0,
    sunsetTop: 0x4A6080, sunsetBottom: 0xFF8A5D,
    nightTop: 0x050510, nightBottom: 0x0A1520,
  },
  jungle: {
    dayTop: 0x66B2A8, dayBottom: 0xA8D8C0,
    sunsetTop: 0x4A7070, sunsetBottom: 0xFF9A7D,
    nightTop: 0x050A08, nightBottom: 0x0F1A15,
  },
  desert: {
    dayTop: 0xD9B380, dayBottom: 0xFAD999,
    sunsetTop: 0xD98050, sunsetBottom: 0xFFB070,
    nightTop: 0x1A0A05, nightBottom: 0x3A2010,
  },
  savanna: {
    dayTop: 0xCBA070, dayBottom: 0xF0D0A0,
    sunsetTop: 0xC07040, sunsetBottom: 0xFFA060,
    nightTop: 0x150A05, nightBottom: 0x2A1810,
  },
  taiga: {
    dayTop: 0x80B0D0, dayBottom: 0xC0D8E8,
    sunsetTop: 0x506080, sunsetBottom: 0xFF9A80,
    nightTop: 0x080A12, nightBottom: 0x101828,
  },
  snowy_plains: {
    dayTop: 0xD8E8FA, dayBottom: 0xF0F8FF,
    sunsetTop: 0xA0B0C0, sunsetBottom: 0xFFB8A0,
    nightTop: 0x0A0F15, nightBottom: 0x1A2530,
  },
  mountains: {
    dayTop: 0x80A0C0, dayBottom: 0xB0C8D8,
    sunsetTop: 0x506070, sunsetBottom: 0xFF9080,
    nightTop: 0x080A12, nightBottom: 0x101825,
  },
  snowy_peaks: {
    dayTop: 0xD0E0F5, dayBottom: 0xE8F0FA,
    sunsetTop: 0xA0B0C5, sunsetBottom: 0xFFB0A0,
    nightTop: 0x0A0F18, nightBottom: 0x182030,
  },
  stony_peaks: {
    dayTop: 0x90A0B0, dayBottom: 0xB8C0C8,
    sunsetTop: 0x606870, sunsetBottom: 0xFF9870,
    nightTop: 0x0A0A10, nightBottom: 0x151820,
  },
  meadow: {
    dayTop: 0x70B8E0, dayBottom: 0xB8E0F0,
    sunsetTop: 0x4A5878, sunsetBottom: 0xFF9A6D,
    nightTop: 0x050810, nightBottom: 0x0A1218,
  },
  cherry_grove: {
    dayTop: 0xE8A0C0, dayBottom: 0xF8D0E0,
    sunsetTop: 0xC060A0, sunsetBottom: 0xFFA0B0,
    nightTop: 0x100510, nightBottom: 0x200A20,
  },
  swamp: {
    dayTop: 0x708880, dayBottom: 0xA0B8A8,
    sunsetTop: 0x405040, sunsetBottom: 0xFF8060,
    nightTop: 0x050805, nightBottom: 0x0A120A,
  },
  river: {
    dayTop: 0x80B0D0, dayBottom: 0xB0D8E8,
    sunsetTop: 0x4A5070, sunsetBottom: 0xFF9A6D,
    nightTop: 0x050810, nightBottom: 0x0A1520,
  },
  mystic_grove: {
    dayTop: 0x8060C0, dayBottom: 0xB8A0E0,
    sunsetTop: 0x503080, sunsetBottom: 0xFF70A0,
    nightTop: 0x0A0515, nightBottom: 0x150A25,
  },
  autumn_forest: {
    dayTop: 0xD0A060, dayBottom: 0xF0C898,
    sunsetTop: 0xA06030, sunsetBottom: 0xFF8050,
    nightTop: 0x100805, nightBottom: 0x201008,
  },
  default: {
    dayTop: 0x5AB8FF, dayBottom: 0xA8D8FF,      // Azul cielo brillante
    sunsetTop: 0x8B5CF6, sunsetBottom: 0xFFB366, // Púrpura-naranja vibrante
    nightTop: 0x0A0E1A, nightBottom: 0x1A1428,   // Azul noche profundo
  },
  // SPEC-099: Wellness biomes - Cielos zen premium
  zen_garden: {
    dayTop: 0xB8D4E8, dayBottom: 0xE8F0F8,      // Azul sereno suave
    sunsetTop: 0xD4A8C8, sunsetBottom: 0xFFD8B8, // Rosa-dorado zen
    nightTop: 0x1A1828, nightBottom: 0x2A2438,   // Púrpura noche zen
  },
  bamboo_grove: {
    dayTop: 0x88D8A8, dayBottom: 0xC8F0D8,      // Verde bambú fresco
    sunsetTop: 0x78A898, sunsetBottom: 0xFFB888, // Verde-naranja cálido
    nightTop: 0x0A1410, nightBottom: 0x1A2420,   // Verde noche oscuro
  },
  aurora_tundra: {
    dayTop: 0xA8C8FF, dayBottom: 0xD8E8FF,      // Azul aurora claro
    sunsetTop: 0xC8A8FF, sunsetBottom: 0xFFB8D8, // Púrpura-rosa aurora
    nightTop: 0x1A1A2A, nightBottom: 0x2A2A3A,   // Azul noche aurora
  },
};

// SPEC-BIOME-OVERHAUL: Biome light tints
const BIOME_LIGHT_TINTS = {
  ocean: { r: 0.9, g: 0.95, b: 1.1 },
  deep_ocean: { r: 0.85, g: 0.92, b: 1.15 },
  beach: { r: 1.0, g: 1.0, b: 1.0 },
  plains: { r: 1.0, g: 1.0, b: 1.0 },
  forest: { r: 0.95, g: 1.08, b: 0.95 },
  jungle: { r: 0.95, g: 1.1, b: 1.05 },
  desert: { r: 1.15, g: 1.1, b: 0.9 },
  savanna: { r: 1.1, g: 1.05, b: 0.92 },
  taiga: { r: 0.95, g: 0.98, b: 1.1 },
  snowy_plains: { r: 0.9, g: 0.95, b: 1.15 },
  mountains: { r: 0.98, g: 0.98, b: 1.02 },
  snowy_peaks: { r: 0.88, g: 0.93, b: 1.18 },
  stony_peaks: { r: 0.95, g: 0.95, b: 1.0 },
  meadow: { r: 1.0, g: 1.05, b: 0.98 },
  cherry_grove: { r: 1.05, g: 0.95, b: 1.0 },
  swamp: { r: 0.95, g: 1.05, b: 0.95 },
  river: { r: 0.95, g: 0.98, b: 1.05 },
  mystic_grove: { r: 0.9, g: 0.85, b: 1.15 },
  autumn_forest: { r: 1.1, g: 1.0, b: 0.9 },
  default: { r: 1.0, g: 1.0, b: 1.0 },
};

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
    this.currentBiome = 'default';
    this._initLights();
    this._initStars();
    this._initSkyDome();
    this._initClouds();
  }

  // SPEC-BIOME-OVERHAUL: Set current biome for sky/light coloring
  setBiome(biome) {
    this.currentBiome = biome;
  }

  // SPEC-BIOME-OVERHAUL: Get sky colors for current biome
  getBiomeSkyColors() {
    return BIOME_SKY_COLORS[this.currentBiome] || BIOME_SKY_COLORS.default;
  }

  // SPEC-BIOME-OVERHAUL: Get light tint for current biome
  getBiomeLightTint() {
    return BIOME_LIGHT_TINTS[this.currentBiome] || BIOME_LIGHT_TINTS.default;
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
    const geo = new THREE.SphereGeometry(4000, 64, 32);
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

  // SPEC-BIOME-OVERHAUL: Improved volumetric clouds with 3 independent layers
  _initClouds() {
    const cloudLayers = [
      { height: 55, density: 0.55, speed: 0.0003, opacity: 0.6 },
      { height: 58, density: 0.50, speed: 0.0005, opacity: 0.4 },
      { height: 61, density: 0.45, speed: 0.0008, opacity: 0.3 },
    ];

    for (const layer of cloudLayers) {
      const texture = this._generateCloudTexture(layer.density);
      const geo = new THREE.PlaneGeometry(1000, 1000);
      const mat = new THREE.MeshBasicMaterial({
        map: texture, transparent: true, opacity: layer.opacity,
        depthWrite: false, fog: false, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = layer.height;
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      this.cloudPlanes.push({ mesh, texture, speed: layer.speed });
    }
    this.clouds = this.cloudPlanes;
  }

  // SPEC-BIOME-OVERHAUL: Generate cloud texture with adjustable density
  _generateCloudTexture(threshold) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let n = 0;
        n += Math.sin(x * 0.015 + y * 0.020) * 0.5;
        n += Math.sin(x * 0.030 + y * 0.025) * 0.25;
        n += Math.sin(x * 0.060 + y * 0.050) * 0.125;
        n += Math.sin(x * 0.120 + y * 0.100) * 0.0625;
        n = (n + 1) / 2;
        const alpha = n > threshold ? Math.min(255, (n - threshold) * 500) : 0;
        const idx = (y * size + x) * 4;
        imgData.data[idx] = 255;
        imgData.data[idx + 1] = 255;
        imgData.data[idx + 2] = 255;
        imgData.data[idx + 3] = alpha;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
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

    // SPEC-BIOME-OVERHAUL: Sky dome colors using biome-specific palette
    const skyColors = this.getBiomeSkyColors();
    const dayTop = new THREE.Color(skyColors.dayTop);
    const dayBottom = new THREE.Color(skyColors.dayBottom);
    const nightTop = new THREE.Color(skyColors.nightTop);
    const nightBottom = new THREE.Color(skyColors.nightBottom);
    const sunsetTop = new THREE.Color(skyColors.sunsetTop);
    const sunsetBottom = new THREE.Color(skyColors.sunsetBottom);

    const topColor = dayTop.clone().lerp(nightTop, 1 - dayFactor);
    topColor.lerp(sunsetTop, horizonFactor * 0.5);
    const bottomColor = dayBottom.clone().lerp(nightBottom, 1 - dayFactor);
    bottomColor.lerp(sunsetBottom, horizonFactor * 0.6);

    this.skyDome.material.uniforms.topColor.value.copy(topColor);
    this.skyDome.material.uniforms.bottomColor.value.copy(bottomColor);

    // Background color follows horizon
    this.scene.background = bottomColor.clone();

    // Dynamic fog color — only for linear Fog, not FogExp2 (managed by VolumetricFog)
    if (this.scene.fog && this.scene.fog.isFog) {
      this.scene.fog.color.copy(bottomColor);
    }

    // SPEC-BIOME-OVERHAUL: Apply biome light tint to sun and ambient light
    const tint = this.getBiomeLightTint();
    this.sunLight.color.setRGB(
      Math.min(1, tint.r), Math.min(1, tint.g), Math.min(1, tint.b)
    );
    this.ambientLight.color.setRGB(
      Math.min(1, tint.r * 0.9), Math.min(1, tint.g * 0.9), Math.min(1, tint.b * 0.9)
    );

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
