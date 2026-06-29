// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Mesher — Full greedy meshing + AO + water
// SPEC-002: Advanced mesher for voxel-style engine
// ═══════════════════════════════════════════════════════════

import {
  CHUNK_SIZE, CHUNK_HEIGHT, WORLD_MIN_Y, SEA_LEVEL,
  BIOMES, BIOME_COLORS,
} from './jardvoxel-survival-engine.js';
import {
  BLOCK, MC_BLOCKS,
  ALL_BLOCK_COLORS as MC_BLOCK_COLORS,
  ALL_BLOCK_NAMES as MC_BLOCK_NAMES,
  ALL_BLOCK_HARDNESS as MC_BLOCK_HARDNESS,
  ALL_PLACEABLE_BLOCKS as MC_PLACEABLE_BLOCKS,
} from './blocks-registry.js';

// Re-export for backward compatibility
export { BLOCK, MC_BLOCKS } from './blocks-registry.js';
export { MC_BLOCK_COLORS, MC_BLOCK_NAMES, MC_BLOCK_HARDNESS, MC_PLACEABLE_BLOCKS };

const TRANSPARENT_BLOCKS = new Set([
  BLOCK.AIR, BLOCK.WATER, MC_BLOCKS.OAK_LEAVES, MC_BLOCKS.BIRCH_LEAVES,
  MC_BLOCKS.SPRUCE_LEAVES, MC_BLOCKS.JUNGLE_LEAVES, MC_BLOCKS.GLASS,
  MC_BLOCKS.TORCH, MC_BLOCKS.FLOWER_RED, MC_BLOCKS.FLOWER_YELLOW,
  MC_BLOCKS.TALL_GRASS, MC_BLOCKS.FERN, MC_BLOCKS.DEAD_BUSH,
  MC_BLOCKS.BAMBOO, MC_BLOCKS.MOSS,
  MC_BLOCKS.WHEAT_CROP,
  116, // Nether portal block
  120, // Redstone dust
  121, // Redstone torch
  122, // Lever
  125, // Redstone repeater
]);

const EMISSIVE_BLOCKS = new Set([BLOCK.LAVA, MC_BLOCKS.TORCH, MC_BLOCKS.LANTERN, 113, 116, 121]);

// Redstone block IDs for visual checks
const RS_LAMP = 124;
const RS_DUST = 120;

const FACES = [
  { dir: [0, 1, 0], corners: [[0,1,0],[0,1,1],[1,1,1],[1,1,0]], shade: 1.0 },
  { dir: [0,-1, 0], corners: [[0,0,1],[0,0,0],[1,0,0],[1,0,1]], shade: 0.6 },
  { dir: [1, 0, 0], corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], shade: 0.8 },
  { dir: [-1,0, 0], corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], shade: 0.8 },
  { dir: [0, 0, 1], corners: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]], shade: 0.7 },
  { dir: [0, 0,-1], corners: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]], shade: 0.7 },
];

const FACE_AXES = [
  { du: [0,0,1], dv: [1,0,0] },
  { du: [0,0,1], dv: [1,0,0] },
  { du: [0,1,0], dv: [0,0,1] },
  { du: [0,1,0], dv: [0,0,1] },
  { du: [1,0,0], dv: [0,1,0] },
  { du: [1,0,0], dv: [0,1,0] },
];

function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function colorVariation(x, y, z, baseColor) {
  const v = (hash3(x, y, z) - 0.5) * 0.08;
  return [
    Math.max(0, Math.min(1, baseColor[0] + v)),
    Math.max(0, Math.min(1, baseColor[1] + v)),
    Math.max(0, Math.min(1, baseColor[2] + v)),
  ];
}

function getGrassFaceColor(face, baseColor, cornerY) {
  if (face.dir[1] > 0) return [0.35, 0.72, 0.25];
  if (face.dir[1] < 0) return [0.55, 0.40, 0.25];
  if (cornerY >= 1) return [0.38, 0.66, 0.22];
  return [0.52, 0.38, 0.24];
}

function getVertexAO(chunk, world, x, y, z, dir, corner, ox, oz) {
  const dx = dir[0], dy = dir[1], dz = dir[2];
  const cx = corner[0], cy = corner[1], cz = corner[2];

  function isSolid(lx, ly, lz) {
    if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE || ly < 0 || ly >= CHUNK_HEIGHT) {
      const wx = ox + lx, wy = ly + WORLD_MIN_Y, wz = oz + lz;
      const ncx = Math.floor(wx / CHUNK_SIZE);
      const ncz = Math.floor(wz / CHUNK_SIZE);
      const nkey = ncx + ',' + ncz;
      const nchunk = world.chunks.get(nkey);
      if (!nchunk || !nchunk.generated) return false;
      return world.getBlock(wx, wy, wz) !== BLOCK.AIR;
    }
    const b = chunk.getBlock(lx, ly, lz);
    return b !== BLOCK.AIR && b !== BLOCK.WATER;
  }

  const sx = x + dx, sy = y + dy, sz = z + dz;
  const s1 = isSolid(sx + (cx === 0 ? -1 : 1), sy, sz) ? 1 : 0;
  const s2 = isSolid(sx, sy, sz + (cz === 0 ? -1 : 1)) ? 1 : 0;
  const c = isSolid(sx + (cx === 0 ? -1 : 1), sy, sz + (cz === 0 ? -1 : 1)) ? 1 : 0;

  if (s1 && s2) return 0.5;
  return 0.5 + 0.5 * (3 - (s1 + s2 + c)) / 3;
}

// SPEC-CHUNK-OPT: Simplified mesh for distant chunks (LOD 2/3/4) — survival version
function _buildSimplifiedMeshSurvival(chunk, world, lodLevel, ox, oz) {
  const positions = [];
  const colors = [];
  const indices = [];
  let vertexCount = 0;

  const mergeSize = lodLevel >= 4 ? 1 : lodLevel >= 3 ? 4 : 2;

  for (let bx = 0; bx < CHUNK_SIZE; bx += mergeSize) {
    for (let bz = 0; bz < CHUNK_SIZE; bz += mergeSize) {
      let topY = -1;
      let topBlock = BLOCK.AIR;
      let colorSum = [0, 0, 0];
      let colorCount = 0;

      for (let mx = 0; mx < mergeSize && bx + mx < CHUNK_SIZE; mx++) {
        for (let mz = 0; mz < mergeSize && bz + mz < CHUNK_SIZE; mz++) {
          for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
            const b = chunk.getBlock(bx + mx, y, bz + mz);
            if (b !== BLOCK.AIR && b !== BLOCK.WATER) {
              if (y > topY) { topY = y; topBlock = b; }
              const bc = MC_BLOCK_COLORS[b] || [0.5, 0.5, 0.5];
              colorSum[0] += bc[0]; colorSum[1] += bc[1]; colorSum[2] += bc[2];
              colorCount++;
              break;
            }
          }
        }
      }

      if (topY < 0 || topBlock === BLOCK.AIR) continue;

      const avgColor = colorCount > 0
        ? [colorSum[0] / colorCount, colorSum[1] / colorCount, colorSum[2] / colorCount]
        : (MC_BLOCK_COLORS[topBlock] || [0.5, 0.5, 0.5]);

      let r = avgColor[0], g = avgColor[1], b = avgColor[2];

      // LOD 4 — blend with fog color
      if (lodLevel >= 4) {
        const fogR = 0x87 / 255, fogG = 0xCE / 255, fogB = 0xEB / 255;
        r = r * 0.4 + fogR * 0.6;
        g = g * 0.4 + fogG * 0.6;
        b = b * 0.4 + fogB * 0.6;
      }

      const x0 = ox + bx, z0 = oz + bz;
      const x1 = ox + bx + mergeSize, z1 = oz + bz + mergeSize;
      const y = topY + 1 + WORLD_MIN_Y;

      positions.push(x0, y, z0, x0, y, z1, x1, y, z1, x1, y, z0);
      colors.push(r, g, b, r, g, b, r, g, b, r, g, b);
      indices.push(vertexCount, vertexCount + 1, vertexCount + 2, vertexCount, vertexCount + 2, vertexCount + 3);
      vertexCount += 4;

      // LOD 2: side faces for height differences
      if (lodLevel === 2) {
        const neighbors = [
          { dir: [-1, 0] }, { dir: [1, 0] }, { dir: [0, -1] }, { dir: [0, 1] },
        ];
        for (const n of neighbors) {
          let neighborTopY = -1;
          const nwx = ox + bx + n.dir[0] * mergeSize;
          const nwz = oz + bz + n.dir[1] * mergeSize;
          if (nwx >= 0 && nwz >= 0) {
            for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
              const wb = world.getBlock(nwx, y + WORLD_MIN_Y, nwz);
              if (wb !== BLOCK.AIR && wb !== BLOCK.WATER) { neighborTopY = y; break; }
            }
          }
          if (neighborTopY < topY - 1) {
            const sideY0 = neighborTopY < 0 ? 0 : neighborTopY + 1 + WORLD_MIN_Y;
            const sideY1 = topY + 1 + WORLD_MIN_Y;
            const sr = r * 0.8, sg = g * 0.8, sb = b * 0.8;
            if (n.dir[0] === -1) {
              positions.push(x0, sideY0, z0, x0, sideY0, z1, x0, sideY1, z1, x0, sideY1, z0);
            } else if (n.dir[0] === 1) {
              positions.push(x1, sideY0, z0, x1, sideY1, z0, x1, sideY1, z1, x1, sideY0, z1);
            } else if (n.dir[1] === -1) {
              positions.push(x0, sideY0, z0, x0, sideY1, z0, x1, sideY1, z0, x1, sideY0, z0);
            } else {
              positions.push(x0, sideY0, z1, x1, sideY0, z1, x1, sideY1, z1, x0, sideY1, z1);
            }
            colors.push(sr, sg, sb, sr, sg, sb, sr, sg, sb, sr, sg, sb);
            indices.push(vertexCount, vertexCount + 1, vertexCount + 2, vertexCount, vertexCount + 2, vertexCount + 3);
            vertexCount += 4;
          }
        }
      }
    }
  }

  return { positions, colors, indices };
}

export function buildChunkMesh(chunk, world, lodLevel = 0) {
  chunk.generate();
  const positions = [];
  const colors = [];
  const indices = [];
  let vertexCount = 0;

  const ox = chunk.cx * CHUNK_SIZE;
  const oz = chunk.cz * CHUNK_SIZE;

  // Pre-scan: find actual Y range with non-air blocks to skip empty slices
  let minY = CHUNK_HEIGHT, maxY = 0;
  const blocks = chunk.blocks;
  const stride = CHUNK_SIZE * CHUNK_SIZE;
  for (let y = 0; y < CHUNK_HEIGHT; y++) {
    const base = y * stride;
    let hasContent = false;
    for (let i = 0; i < stride; i++) {
      if (blocks[base + i] !== BLOCK.AIR) { hasContent = true; break; }
    }
    if (hasContent) {
      if (y < minY) minY = y;
      maxY = y;
    }
  }
  if (minY > maxY) return { positions, colors, indices }; // entirely empty

  // SPEC-CHUNK-OPT: LOD 2/3/4 — Simplified meshing for distant chunks
  if (lodLevel >= 2) {
    return _buildSimplifiedMeshSurvival(chunk, world, lodLevel, ox, oz);
  }

  // Expand by 1 for face boundaries
  const yStart = Math.max(0, minY - 1);
  const yEnd = Math.min(CHUNK_HEIGHT - 1, maxY + 1);

  function getNeighborBlock(x, y, z, dir) {
    const nx = x + dir[0], ny = y + dir[1], nz = z + dir[2];
    if (nx < 0 || nx >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE || ny < 0 || ny >= CHUNK_HEIGHT) {
      const wx = ox + nx, wy = ny + WORLD_MIN_Y, wz = oz + nz;
      const ncx = Math.floor(wx / CHUNK_SIZE);
      const ncz = Math.floor(wz / CHUNK_SIZE);
      const nkey = ncx + ',' + ncz;
      const nchunk = world.chunks.get(nkey);
      if (!nchunk || !nchunk.generated) return BLOCK.AIR;
      return world.getBlock(wx, wy, wz);
    }
    return chunk.getBlock(nx, ny, nz);
  }

  // Reusable mask buffer (max size: CHUNK_HEIGHT * CHUNK_SIZE)
  const maskBuf = new Int32Array(CHUNK_HEIGHT * CHUNK_SIZE);

  for (let f = 0; f < FACES.length; f++) {
    const face = FACES[f];
    const dir = face.dir;
    const axes = FACE_AXES[f];
    const du = axes.du, dv = axes.dv;
    const faceShade = face.shade;

    let uSize, vSize, sRange, sStart, sEnd, uStart, uEnd, vStart, vEnd;
    if (dir[0] !== 0) {
      // X faces: s=x, u=y, v=z
      uSize = CHUNK_HEIGHT; vSize = CHUNK_SIZE; sRange = CHUNK_SIZE;
      sStart = 0; sEnd = sRange;
      uStart = yStart; uEnd = yEnd + 1;
      vStart = 0; vEnd = vSize;
    } else if (dir[1] !== 0) {
      // Y faces: s=y, u=x, v=z
      uSize = CHUNK_SIZE; vSize = CHUNK_SIZE; sRange = CHUNK_HEIGHT;
      sStart = yStart; sEnd = yEnd + 1;
      uStart = 0; uEnd = uSize;
      vStart = 0; vEnd = vSize;
    } else {
      // Z faces: s=z, u=x, v=y
      uSize = CHUNK_SIZE; vSize = CHUNK_HEIGHT; sRange = CHUNK_SIZE;
      sStart = 0; sEnd = sRange;
      uStart = 0; uEnd = uSize;
      vStart = yStart; vEnd = yEnd + 1;
    }

    for (let s = sStart; s < sEnd; s++) {
      const mask = maskBuf;
      mask.fill(0, 0, uSize * vSize);

      for (let u = uStart; u < uEnd; u++) {
        const uOff = u * vSize;
        for (let v = vStart; v < vEnd; v++) {
          let x, y, z;
          if (dir[0] !== 0) { x = s; y = u; z = v; }
          else if (dir[1] !== 0) { y = s; x = u; z = v; }
          else { z = s; x = u; y = v; }

          const block = chunk.getBlock(x, y, z);
          if (block === BLOCK.AIR || block === BLOCK.WATER) {
            const nb = getNeighborBlock(x, y, z, dir);
            if (nb !== BLOCK.AIR && nb !== BLOCK.WATER) {
              continue;
            }
          } else {
            const nb = getNeighborBlock(x, y, z, dir);
            const isTrans = TRANSPARENT_BLOCKS.has(block);
            if (lodLevel >= 2 && isTrans) continue;
            const neighborIsAir = nb === BLOCK.AIR || nb === BLOCK.WATER;
            const neighborIsTransparent = TRANSPARENT_BLOCKS.has(nb);
            if (neighborIsAir || (neighborIsTransparent && !isTrans) || (isTrans && nb !== block)) {
              mask[uOff + v] = block;
            }
          }
        }
      }

      // Greedy merge (bounded to active range)
      for (let u = uStart; u < uEnd; u++) {
        const uOff2 = u * vSize;
        let v = vStart;
        while (v < vEnd) {
          const blockType = mask[uOff2 + v];
          if (blockType === 0) { v++; continue; }

          let vEnd2 = v + 1;
          while (vEnd2 < vEnd && mask[uOff2 + vEnd2] === blockType) vEnd2++;

          let uEnd2 = u + 1;
          outer: for (; uEnd2 < uEnd; uEnd2++) {
            const uOff3 = uEnd2 * vSize;
            for (let vv = v; vv < vEnd2; vv++) {
              if (mask[uOff3 + vv] !== blockType) break outer;
            }
          }

          const offset = dir[0] > 0 || dir[1] > 0 || dir[2] > 0 ? 1 : 0;
          const isEmissive = EMISSIVE_BLOCKS.has(blockType);
          const isGrass = blockType === BLOCK.GRASS;
          let baseColor = MC_BLOCK_COLORS[blockType] || BIOME_COLORS[BIOMES.PLAINS] || [0.5, 0.5, 0.5];

          // Compute block world position for redstone visual checks
          let blkWX, blkWY, blkWZ;
          if (dir[0] !== 0) { blkWX = ox + s; blkWY = WORLD_MIN_Y + u; blkWZ = oz + v; }
          else if (dir[1] !== 0) { blkWX = ox + u; blkWY = WORLD_MIN_Y + s; blkWZ = oz + v; }
          else { blkWX = ox + u; blkWY = WORLD_MIN_Y + v; blkWZ = oz + s; }

          // Redstone lamp lit state — bright yellow when powered
          if (blockType === RS_LAMP && world.redstoneManager && world.redstoneManager.isLampLit(blkWX, blkWY, blkWZ)) {
            baseColor = [1.0, 0.9, 0.4];
          }
          // Redstone dust — brightness varies with power level
          if (blockType === RS_DUST && world.redstoneManager) {
            const brightness = world.redstoneManager.getDustBrightness(blkWX, blkWY, blkWZ);
            baseColor = [0.3 + brightness * 0.5, 0.05 + brightness * 0.1, 0.05 + brightness * 0.1];
          }

          // Compute 4 corner positions inline
          function toXYZ(uu, vv, off) {
            if (dir[0] !== 0) return [ox + s + off, uu + WORLD_MIN_Y, oz + vv];
            if (dir[1] !== 0) return [ox + uu, s + off + WORLD_MIN_Y, oz + vv];
            return [ox + uu, vv + WORLD_MIN_Y, oz + s + off];
          }

          const c0 = toXYZ(u, v, offset);
          const c1 = toXYZ(u, vEnd2, offset);
          const c2 = toXYZ(uEnd2, vEnd2, offset);
          const c3 = toXYZ(uEnd2, v, offset);

          function blockAt(uu, vv) {
            if (dir[0] !== 0) return [s, uu, vv];
            if (dir[1] !== 0) return [uu, s, vv];
            return [uu, vv, s];
          }

          const aoBlocks = [blockAt(u, v), blockAt(u, vEnd2 - 1), blockAt(uEnd2 - 1, vEnd2 - 1), blockAt(uEnd2 - 1, v)];
          const aoCorners = face.corners;

          for (let ci = 0; ci < 4; ci++) {
            const corner = ci === 0 ? c0 : ci === 1 ? c1 : ci === 2 ? c2 : c3;
            let vc;
            if (isGrass) {
              const corner = aoCorners[ci];
              vc = getGrassFaceColor(face, baseColor, corner[1]);
            } else {
              vc = colorVariation(corner[0], corner[1], corner[2], baseColor);
            }

            let r = vc[0] * faceShade;
            let g = vc[1] * faceShade;
            let b = vc[2] * faceShade;

            if (isEmissive) {
              r = Math.min(1, vc[0] * 1.5);
              g = Math.min(1, vc[1] * 1.5);
              b = Math.min(1, vc[2] * 1.5);
            }

            if (!isEmissive && lodLevel === 0) {
              const bk = aoBlocks[ci];
              const ao = getVertexAO(chunk, world, bk[0], bk[1], bk[2], dir, aoCorners[ci], ox, oz);
              r *= ao; g *= ao; b *= ao;
            }

            positions.push(corner[0], corner[1], corner[2]);
            colors.push(r, g, b);
          }

          const reverseWinding = dir[1] < 0 || dir[0] > 0 || dir[2] > 0;
          if (reverseWinding) {
            indices.push(vertexCount, vertexCount + 2, vertexCount + 1, vertexCount, vertexCount + 3, vertexCount + 2);
          } else {
            indices.push(vertexCount, vertexCount + 1, vertexCount + 2, vertexCount, vertexCount + 2, vertexCount + 3);
          }
          vertexCount += 4;

          for (let uu = u; uu < uEnd2; uu++) {
            const uuOff = uu * vSize;
            for (let vv = v; vv < vEnd2; vv++) {
              mask[uuOff + vv] = 0;
            }
          }

          v = vEnd2;
        }
      }
    }
  }

  return { positions, colors, indices };
}

export function buildWaterMesh(chunk, world) {
  chunk.generate();
  const positions = [];
  const colors = [];
  const uvs = [];
  const indices = [];
  let vertexCount = 0;

  const ox = chunk.cx * CHUNK_SIZE;
  const oz = chunk.cz * CHUNK_SIZE;

  // Find Y range with water blocks
  let minWY = CHUNK_HEIGHT, maxWY = 0;
  const wblocks = chunk.blocks;
  const wstride = CHUNK_SIZE * CHUNK_SIZE;
  for (let y = 0; y < CHUNK_HEIGHT; y++) {
    const base = y * wstride;
    for (let i = 0; i < wstride; i++) {
      if (wblocks[base + i] === BLOCK.WATER) {
        if (y < minWY) minWY = y;
        maxWY = y;
        break;
      }
    }
  }
  if (minWY > maxWY) return { positions, colors, uvs, indices };

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let y = minWY; y <= maxWY; y++) {
        const block = chunk.getBlock(x, y, z);
        if (block !== BLOCK.WATER) continue;
        const above = chunk.getBlock(x, y + 1, z);
        if (above === BLOCK.WATER) continue;

        const worldX = ox + x;
        const worldY = y + WORLD_MIN_Y;
        const worldZ = oz + z;
        const surfaceY = worldY + 0.9;

        const below = chunk.getBlock(x, y - 1, z);
        const isShallow = below === BLOCK.SAND || below === BLOCK.GRASS;
        const depthFactor = Math.min(1, (SEA_LEVEL - worldY) / 20);
        const r = 0.15 + (1 - depthFactor) * 0.15;
        const g = 0.40 + (1 - depthFactor) * 0.20;
        const b = 0.70 + (1 - depthFactor) * 0.10;
        const boost = isShallow ? 0.12 : 0;

        positions.push(worldX, surfaceY, worldZ, worldX + 1, surfaceY, worldZ, worldX + 1, surfaceY, worldZ + 1, worldX, surfaceY, worldZ + 1);
        colors.push(r + boost, g + boost, b + boost, r + boost, g + boost, b + boost, r + boost, g + boost, b + boost, r + boost, g + boost, b + boost);
        uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
        indices.push(vertexCount, vertexCount + 1, vertexCount + 2, vertexCount, vertexCount + 2, vertexCount + 3);
        vertexCount += 4;
      }
    }
  }

  return { positions, colors, uvs, indices };
}
