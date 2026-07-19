// ═══════════════════════════════════════════════════════════
// JardVoxel 7.0 — Hierarchical Streaming (SPEC-107)
// Pre-warms hierarchy levels (region/zone) ahead of chunk generation
// and boosts chunk priority based on hierarchical context.
// ═══════════════════════════════════════════════════════════

import { CHUNK_SIZE } from './jardvoxel-survival-world-hierarchy.js';

// Boost weights — chunks sharing the player's region/zone get a priority
// discount (lower = generated sooner) so terrain coheres as the player moves.
const SAME_REGION_BOOST = 0.6;
const SAME_ZONE_BOOST = 0.4;
const SAME_CONTINENT_BOOST = 0.2;

export class HierarchicalStreaming {
  constructor(hierarchy) {
    this.hierarchy = hierarchy;
    // Pre-warmed region/zone keys per chunk coord, keyed by "cx,cz"
    this._prewarmed = new Map();
    this._maxPrewarm = 2048;
    // Player's current hierarchy context (updated on chunk boundary crossing)
    this._playerContext = null;
  }

  // Pre-warm hierarchy caches for all chunks within `radius` of (pcx, pcz).
  // This is cheap (region/zone lookups are cached) and avoids the first
  // chunk-gen frame paying for hierarchy traversal synchronously.
  prewarm(pcx, pcz, radius) {
    const r = Math.max(1, Math.min(radius, 32));
    let warmed = 0;
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > r) continue;
        const cx = pcx + dx;
        const cz = pcz + dz;
        const key = `${cx},${cz}`;
        if (this._prewarmed.has(key)) continue;
        const ox = cx * CHUNK_SIZE + (CHUNK_SIZE >> 1);
        const oz = cz * CHUNK_SIZE + (CHUNK_SIZE >> 1);
        // Touch hierarchy caches — these calls populate the underlying
        // continent/region/zone caches so subsequent chunk gen is instant.
        try {
          this.hierarchy.regionGen.getRegion(ox, oz);
          this.hierarchy.zoneGen.getZone(ox, oz);
        } catch (_) { /* hierarchy not enabled — skip silently */ }
        this._prewarmed.set(key, { cx, cz, t: performance.now() });
        warmed++;
        if (this._prewarmed.size > this._maxPrewarm) this._evictOldest();
      }
    }
    return warmed;
  }

  // Update the player's current hierarchy context (call on chunk-boundary cross).
  setPlayerChunk(cx, cz) {
    const ox = cx * CHUNK_SIZE + (CHUNK_SIZE >> 1);
    const oz = cz * CHUNK_SIZE + (CHUNK_SIZE >> 1);
    try {
      const continent = this.hierarchy.continentGen.getContinentProperties(ox, oz);
      const region = this.hierarchy.regionGen.getRegion(ox, oz);
      const zone = this.hierarchy.zoneGen.getZone(ox, oz);
      this._playerContext = {
        cx, cz,
        continentId: continent.id,
        regionType: region.type,
        zoneType: zone.type,
      };
    } catch (_) {
      this._playerContext = null;
    }
    return this._playerContext;
  }

  // Returns a priority boost (negative discount) for a chunk based on how
  // much hierarchy context it shares with the player's current context.
  // Add this to the existing chunkGenPriority result (lower = sooner).
  priorityBoost(cx, cz) {
    if (!this._playerContext) return 0;
    const ox = cx * CHUNK_SIZE + (CHUNK_SIZE >> 1);
    const oz = cz * CHUNK_SIZE + (CHUNK_SIZE >> 1);
    let boost = 0;
    try {
      const continent = this.hierarchy.continentGen.getContinentProperties(ox, oz);
      if (continent.id === this._playerContext.continentId && continent.id !== -1) {
        boost -= SAME_CONTINENT_BOOST;
      }
      const region = this.hierarchy.regionGen.getRegion(ox, oz);
      if (region.type === this._playerContext.regionType) {
        boost -= SAME_REGION_BOOST;
      }
      const zone = this.hierarchy.zoneGen.getZone(ox, oz);
      if (zone.type === this._playerContext.zoneType) {
        boost -= SAME_ZONE_BOOST;
      }
    } catch (_) { /* hierarchy not ready */ }
    return boost;
  }

  // Evict oldest prewarm entries when the cache is full.
  _evictOldest() {
    let oldestKey = null;
    let oldestT = Infinity;
    for (const [k, v] of this._prewarmed) {
      if (v.t < oldestT) { oldestT = v.t; oldestKey = k; }
    }
    if (oldestKey) this._prewarmed.delete(oldestKey);
  }

  clear() {
    this._prewarmed.clear();
    this._playerContext = null;
  }

  get prewarmCount() { return this._prewarmed.size; }
  get playerContext() { return this._playerContext; }
}

export const STREAMING_BOOSTS = { SAME_REGION_BOOST, SAME_ZONE_BOOST, SAME_CONTINENT_BOOST };
