// ═══════════════════════════════════════════════════════════
// JardVoxel 7.2 — Instanced Feature Renderer (PRD G-05)
// Reduces draw calls for vegetation by 80%+ using THREE.InstancedMesh
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import {
  CHUNK_SIZE, CHUNK_HEIGHT, WORLD_MIN_Y, SEA_LEVEL,
} from './jardvoxel-survival-engine.js';
import {
  BLOCK, MC_BLOCKS, VEGETATION_BLOCKS, TREE_DETAIL_BLOCKS,
  ALL_BLOCK_COLORS as MC_BLOCK_COLORS,
} from './blocks-registry.js';

// Feature types to instance — block IDs that are small decorative elements
const FEATURE_BLOCKS = new Set([
  MC_BLOCKS.FLOWER_RED, MC_BLOCKS.FLOWER_YELLOW,
  MC_BLOCKS.TALL_GRASS, MC_BLOCKS.FERN, MC_BLOCKS.DEAD_BUSH,
  MC_BLOCKS.BAMBOO, MC_BLOCKS.MOSS,
  MC_BLOCKS.CACTUS,
  VEGETATION_BLOCKS.FLOWER_BLUE, VEGETATION_BLOCKS.FLOWER_WHITE,
  VEGETATION_BLOCKS.FLOWER_PURPLE, VEGETATION_BLOCKS.FLOWER_ORANGE,
  VEGETATION_BLOCKS.FLOWER_PINK, VEGETATION_BLOCKS.FLOWER_LILY,
  VEGETATION_BLOCKS.FLOWER_TULIP, VEGETATION_BLOCKS.FLOWER_SUNFLOWER,
  VEGETATION_BLOCKS.MUSHROOM_RED, VEGETATION_BLOCKS.MUSHROOM_BROWN,
  VEGETATION_BLOCKS.BERRY_BUSH, VEGETATION_BLOCKS.VINES,
  VEGETATION_BLOCKS.LILY_PAD,
  TREE_DETAIL_BLOCKS.BUSH,
]);

// Blocks that should NOT be instanced (they're part of tree structures handled by mesher)
const TREE_STRUCTURE_BLOCKS = new Set([
  MC_BLOCKS.OAK_LOG, MC_BLOCKS.OAK_LEAVES,
  MC_BLOCKS.BIRCH_LOG, MC_BLOCKS.BIRCH_LEAVES,
  MC_BLOCKS.SPRUCE_LOG, MC_BLOCKS.SPRUCE_LEAVES,
  MC_BLOCKS.JUNGLE_LOG, MC_BLOCKS.JUNGLE_LEAVES,
  TREE_DETAIL_BLOCKS.DARK_OAK_LEAVES, TREE_DETAIL_BLOCKS.ROOT,
  TREE_DETAIL_BLOCKS.AUTUMN_LEAVES_ORANGE, TREE_DETAIL_BLOCKS.AUTUMN_LEAVES_RED,
  TREE_DETAIL_BLOCKS.MOSS_LOG,
]);

// Simple geometry cache per block type
const _geoCache = new Map();

function _getFeatureGeometry(blockId) {
  if (_geoCache.has(blockId)) return _geoCache.get(blockId);
  // Small cross-plane geometry for plants (like vanilla Minecraft)
  // Two crossed quads forming an X shape
  const geo = new THREE.BufferGeometry();
  const s = 0.45;
  const positions = [
    // Quad 1
    -s, 0, -s,  s, 0,  s,  s, 1,  s,
    -s, 0, -s,  s, 1,  s, -s, 1, -s,
    // Quad 2
    -s, 0,  s,  s, 0, -s,  s, 1, -s,
    -s, 0,  s,  s, 1, -s, -s, 1,  s,
  ];
  const indices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7];
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  _geoCache.set(blockId, geo);
  return geo;
}

function _getRockGeometry() {
  if (_geoCache.has('rock')) return _geoCache.get('rock');
  const geo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
  _geoCache.set('rock', geo);
  return geo;
}

function _getFeatureColor(blockId) {
  const c = MC_BLOCK_COLORS[blockId];
  if (c) return new THREE.Color(c[0], c[1], c[2]);
  return new THREE.Color(0.5, 0.5, 0.5);
}

export class InstancedFeatureRenderer {
  constructor(scene) {
    this.scene = scene;
    this._enabled = true;
    // Map: chunkKey -> Map: blockId -> InstancedMesh
    this._chunkMeshes = new Map();
    this._maxInstancesPerType = 256;
    // Shared materials per block type (vertex-colored)
    this._materials = new Map();
  }

  setEnabled(enabled) {
    this._enabled = enabled;
    if (!enabled) {
      for (const meshes of this._chunkMeshes.values()) {
        for (const mesh of meshes.values()) mesh.visible = false;
      }
    } else {
      for (const meshes of this._chunkMeshes.values()) {
        for (const mesh of meshes.values()) mesh.visible = true;
      }
    }
  }

  _getMaterial(blockId) {
    if (this._materials.has(blockId)) return this._materials.get(blockId);
    const color = _getFeatureColor(blockId);
    const mat = new THREE.MeshLambertMaterial({
      color: color,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    });
    this._materials.set(blockId, mat);
    return mat;
  }

  // Scan chunk for feature blocks and build instanced meshes
  buildForChunk(cx, cz, chunk, lodLevel = 0) {
    if (!this._enabled) return;
    const key = `${cx},${cz}`;
    // Remove old instances for this chunk
    this.disposeChunk(key);

    if (lodLevel >= 3) return; // Too far for feature detail

    // LOD-based instance culling ratio
    const cullRatio = lodLevel === 0 ? 1.0 : lodLevel === 1 ? 0.7 : 0.4;

    // Collect instances per block type
    const instances = new Map(); // blockId -> [{x, y, z, rot, scale}]
    const ox = cx * CHUNK_SIZE;
    const oz = cz * CHUNK_SIZE;

    const minY = chunk.minContentY ?? 0;
    const maxY = chunk.maxContentY ?? CHUNK_HEIGHT - 1;
    const yStart = Math.max(0, minY - 1);
    const yEnd = Math.min(CHUNK_HEIGHT - 1, maxY + 2);

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let y = yStart; y <= yEnd; y++) {
          const block = chunk.getBlock(x, y, z);
          if (block === BLOCK.AIR || block === BLOCK.WATER) continue;
          if (!FEATURE_BLOCKS.has(block)) continue;

          // Hash-based deterministic culling for LOD
          const hash = ((x * 374761393 + y * 668265263 + z * 2147483647) ^ (cx * 99991 + cz * 100003)) & 0x7FFFFFFF;
          if ((hash / 0x7FFFFFFF) > cullRatio) continue;

          if (!instances.has(block)) instances.set(block, []);
          instances.get(block).push({
            x: ox + x + 0.5,
            y: y + WORLD_MIN_Y,
            z: oz + z + 0.5,
            rot: (hash / 0x7FFFFFFF) * Math.PI * 2,
            scale: 0.8 + (hash % 100) / 100 * 0.4,
          });
        }
      }
    }

    // Also detect cobblestone rocks (small formations on surface)
    const rockInstances = [];
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let y = yStart; y <= yEnd; y++) {
          const block = chunk.getBlock(x, y, z);
          if (block === MC_BLOCKS.COBBLESTONE) {
            // Check if it's a surface rock (air above)
            const above = chunk.getBlock(x, y + 1, z);
            if (above === BLOCK.AIR) {
              const hash = ((x * 374761393 + z * 668265263) ^ (cx * 99991 + cz * 100003)) & 0x7FFFFFFF;
              if ((hash / 0x7FFFFFFF) > cullRatio) continue;
              rockInstances.push({
                x: ox + x + 0.5,
                y: y + WORLD_MIN_Y,
                z: oz + z + 0.5,
                rot: (hash / 0x7FFFFFFF) * Math.PI * 2,
                scale: 0.7 + (hash % 100) / 100 * 0.3,
              });
            }
          }
        }
      }
    }

    const chunkMeshes = new Map();
    const dummy = new THREE.Object3D();

    // Build InstancedMesh per feature block type
    for (const [blockId, positions] of instances) {
      if (positions.length === 0) continue;
      const geo = _getFeatureGeometry(blockId);
      const mat = this._getMaterial(blockId);
      const mesh = new THREE.InstancedMesh(geo, mat, positions.length);
      mesh.frustumCulled = true;
      mesh.userData.chunkKey = key;

      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(0, p.rot, 0);
        dummy.scale.set(p.scale, p.scale, p.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = false;
      mesh.receiveShadow = lodLevel <= 1;
      this.scene.add(mesh);
      chunkMeshes.set(blockId, mesh);
    }

    // Build rock InstancedMesh
    if (rockInstances.length > 0) {
      const geo = _getRockGeometry();
      const mat = new THREE.MeshLambertMaterial({ color: 0x85858d });
      const mesh = new THREE.InstancedMesh(geo, mat, rockInstances.length);
      mesh.frustumCulled = true;
      mesh.userData.chunkKey = key;

      for (let i = 0; i < rockInstances.length; i++) {
        const p = rockInstances[i];
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(0, p.rot, 0);
        dummy.scale.set(p.scale, p.scale, p.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = false;
      mesh.receiveShadow = lodLevel <= 1;
      this.scene.add(mesh);
      chunkMeshes.set('rock', mesh);
    }

    this._chunkMeshes.set(key, chunkMeshes);
  }

  disposeChunk(key) {
    const meshes = this._chunkMeshes.get(key);
    if (!meshes) return;
    for (const [, mesh] of meshes) {
      this.scene.remove(mesh);
      mesh.dispose();
    }
    this._chunkMeshes.delete(key);
  }

  // Set visibility based on frustum culling (called from update)
  setChunkVisible(key, visible) {
    const meshes = this._chunkMeshes.get(key);
    if (!meshes) return;
    for (const [, mesh] of meshes) {
      mesh.visible = visible;
    }
  }

  dispose() {
    for (const [key] of this._chunkMeshes) {
      this.disposeChunk(key);
    }
    for (const [, mat] of this._materials) {
      mat.dispose();
    }
    this._materials.clear();
    for (const [, geo] of _geoCache) {
      geo.dispose();
    }
    _geoCache.clear();
  }

  getDrawCallCount() {
    let count = 0;
    for (const [, meshes] of this._chunkMeshes) {
      count += meshes.size;
    }
    return count;
  }

  getInstanceCount() {
    let count = 0;
    for (const [, meshes] of this._chunkMeshes) {
      for (const [, mesh] of meshes) {
        count += mesh.count;
      }
    }
    return count;
  }
}
