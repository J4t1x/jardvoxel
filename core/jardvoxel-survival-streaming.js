// ═══════════════════════════════════════════════════════════
// JardVoxel 7.0 — Intelligent Streaming (4-Tier LOD)
// SPEC-107: Progressive chunk loading with 4 distance tiers
// ═══════════════════════════════════════════════════════════

import { LOAD_PRIORITY } from './jardvoxel-survival-layers.js';
import { CHUNK_SIZE } from './jardvoxel-survival-engine.js';

// Streaming tiers
export const STREAMING_TIERS = {
  NEAR: 0,       // 0-3 chunks: all 9 layers, full meshes, shadows, fauna
  MEDIUM: 1,     // 3-8 chunks: layers 1-6, simplified trees, no fauna
  FAR: 2,        // 8-14 chunks: layers 1-2 only, basic geometry
  HORIZON: 3,    // 14+ chunks: heightmap representation only
};

const TIER_DISTANCES = {
  [STREAMING_TIERS.NEAR]: 3,
  [STREAMING_TIERS.MEDIUM]: 8,
  [STREAMING_TIERS.FAR]: 14,
  [STREAMING_TIERS.HORIZON]: Infinity,
};

// Max layers to load per tier
const TIER_MAX_PRIORITY = {
  [STREAMING_TIERS.NEAR]: LOAD_PRIORITY.LOW,      // All layers
  [STREAMING_TIERS.MEDIUM]: LOAD_PRIORITY.MEDIUM, // Layers 1-6
  [STREAMING_TIERS.FAR]: LOAD_PRIORITY.IMMEDIATE, // Layers 1-2 only
  [STREAMING_TIERS.HORIZON]: -1,                   // No layers (heightmap only)
};

export class StreamingManager {
  constructor(chunkManager, layerSystem) {
    this.chunkManager = chunkManager;
    this.layerSystem = layerSystem;
    this._tierCache = new Map(); // chunkKey → tier
    // SPEC-114: Archipelago LOD bias
    this._archipelagoMode = false;
    this._archipelago = null;
  }

  // SPEC-114: Enable archipelago LOD bias
  setArchipelago(archipelago) {
    this._archipelago = archipelago;
    this._archipelagoMode = archipelago !== null;
  }

  // Determine tier for a chunk based on distance from player
  getTierForChunk(cx, cz, playerCX, playerCZ) {
    const dx = Math.abs(cx - playerCX);
    const dz = Math.abs(cz - playerCZ);
    const dist = Math.max(dx, dz); // Chebyshev distance — natural for chunk grids

    // SPEC-114: In archipelago mode, bias ocean chunks to HORIZON
    if (this._archipelagoMode && this._archipelago) {
      const worldX = cx * 32 + 16;
      const worldZ = cz * 32 + 16;
      const isOcean = this._archipelago.isOcean(worldX, worldZ);

      if (isOcean) {
        // Ocean chunks: bias to HORIZON unless very close
        if (dist <= TIER_DISTANCES[STREAMING_TIERS.NEAR]) return STREAMING_TIERS.NEAR;
        // Ocean chunks skip MEDIUM and FAR — go straight to HORIZON
        return STREAMING_TIERS.HORIZON;
      } else {
        // Island chunks: prioritize for full detail (extend NEAR range)
        if (dist <= TIER_DISTANCES[STREAMING_TIERS.NEAR] + 2) return STREAMING_TIERS.NEAR;
        if (dist <= TIER_DISTANCES[STREAMING_TIERS.MEDIUM] + 2) return STREAMING_TIERS.MEDIUM;
        if (dist <= TIER_DISTANCES[STREAMING_TIERS.FAR]) return STREAMING_TIERS.FAR;
        return STREAMING_TIERS.HORIZON;
      }
    }

    if (dist <= TIER_DISTANCES[STREAMING_TIERS.NEAR]) return STREAMING_TIERS.NEAR;
    if (dist <= TIER_DISTANCES[STREAMING_TIERS.MEDIUM]) return STREAMING_TIERS.MEDIUM;
    if (dist <= TIER_DISTANCES[STREAMING_TIERS.FAR]) return STREAMING_TIERS.FAR;
    return STREAMING_TIERS.HORIZON;
  }

  // Get max layer priority for a tier
  getMaxLayerPriority(tier) {
    return TIER_MAX_PRIORITY[tier] ?? LOAD_PRIORITY.LOW;
  }

  // Check if a chunk needs tier upgrade (more layers)
  needsUpgrade(cx, cz, playerCX, playerCZ) {
    const key = (cx + 32768) * 65536 + (cz + 32768);
    const entry = this._tierCache.get(key);
    if (!entry) return true;
    const targetTier = this.getTierForChunk(cx, cz, playerCX, playerCZ);
    return targetTier < entry.tier; // Lower tier number = more detail
  }

  // Check if a chunk needs tier downgrade (fewer layers)
  needsDowngrade(cx, cz, playerCX, playerCZ) {
    const key = (cx + 32768) * 65536 + (cz + 32768);
    const entry = this._tierCache.get(key);
    if (!entry) return false;
    const targetTier = this.getTierForChunk(cx, cz, playerCX, playerCZ);
    return targetTier > entry.tier; // Higher tier number = less detail
  }

  // Update tier tracking for a chunk
  setChunkTier(cx, cz, tier) {
    this._tierCache.set((cx + 32768) * 65536 + (cz + 32768), { tier, cx, cz });
  }

  // Get current tier for a chunk
  getChunkTier(cx, cz) {
    const entry = this._tierCache.get((cx + 32768) * 65536 + (cz + 32768));
    return entry ? entry.tier : STREAMING_TIERS.NEAR;
  }

  // Remove chunk from tracking
  removeChunk(cx, cz) {
    this._tierCache.delete((cx + 32768) * 65536 + (cz + 32768));
  }

  // Update streaming for all loaded chunks
  update(playerX, playerZ, camera) {
    const pcx = Math.floor(playerX / CHUNK_SIZE);
    const pcz = Math.floor(playerZ / CHUNK_SIZE);

    const upgrades = [];
    const downgrades = [];

    for (const [key, entry] of this._tierCache) {
      const cx = entry.cx;
      const cz = entry.cz;
      const currentTier = entry.tier;
      const targetTier = this.getTierForChunk(cx, cz, pcx, pcz);

      if (targetTier < currentTier) {
        upgrades.push({ cx, cz, from: currentTier, to: targetTier });
      } else if (targetTier > currentTier) {
        downgrades.push({ cx, cz, from: currentTier, to: targetTier });
      }
    }

    return { upgrades, downgrades };
  }

  // Get tier info for display/debug
  getTierInfo() {
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
    for (const tier of this._tierCache.values()) {
      counts[tier] = (counts[tier] || 0) + 1;
    }
    return {
      near: counts[0],
      medium: counts[1],
      far: counts[2],
      horizon: counts[3],
      total: this._tierCache.size,
    };
  }
}
