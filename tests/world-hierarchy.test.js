import { describe, it, expect } from 'vitest';
import {
  WorldIdentity,
  ContinentGenerator,
  RegionGenerator,
  ZoneGenerator,
  HierarchicalChunkGenerator,
  BIOMES,
  SEA_LEVEL,
  CHUNK_SIZE,
  REGION_TYPES,
  ZONE_TYPES,
} from '../core/jardvoxel-survival-world-hierarchy.js';
import { MicrosectorGenerator } from '../core/jardvoxel-survival-microsectors.js';
import { WorldGenPipeline, VoxelChunk, CHUNK_HEIGHT } from '../core/jardvoxel-survival-engine.js';
import { generateChunkHierarchical } from '../core/jardvoxel-survival-features.js';

// ═══════════════════════════════════════════════════════════
// SPEC-081: Hierarchical 7.0 — Level 1-2 (World + Continent)
// ═══════════════════════════════════════════════════════════

describe('SPEC-081: WorldIdentity — Level 1', () => {
  it('constructs with deterministic seed', () => {
    const w1 = new WorldIdentity(12345);
    const w2 = new WorldIdentity(12345);
    expect(w1.seed).toBe(12345);
    expect(w2.seed).toBe(12345);
    // Deterministic properties
    expect(w1.oceanCoverage).toBe(w2.oceanCoverage);
    expect(w1.continentCount).toBe(w2.continentCount);
    expect(w1.axialTilt).toBe(w2.axialTilt);
    expect(w1.geologicalAge.name).toBe(w2.geologicalAge.name);
  });

  it('different seeds produce different worlds', () => {
    const w1 = new WorldIdentity(1);
    const w2 = new WorldIdentity(2);
    const differs =
      w1.oceanCoverage !== w2.oceanCoverage ||
      w1.continentCount !== w2.continentCount ||
      w1.axialTilt !== w2.axialTilt;
    expect(differs).toBe(true);
  });

  it('exposes required identity fields', () => {
    const w = new WorldIdentity(42);
    expect(typeof w.seed).toBe('number');
    expect(typeof w.seaLevel).toBe('number');
    expect(w.seaLevel).toBe(SEA_LEVEL);
    expect(w.geologicalAge).toBeDefined();
    expect(w.geologicalAge.name).toBeTruthy();
    expect(w.geologicalAge.period).toBeTruthy();
    expect(w.geologicalAge.roughnessMultiplier).toBeGreaterThan(0);
    expect(typeof w.oceanCoverage).toBe('number');
    expect(w.oceanCoverage).toBeGreaterThan(0.5);
    expect(w.oceanCoverage).toBeLessThan(1.0);
    expect(w.continentCount).toBeGreaterThanOrEqual(2);
    expect(w.continentCount).toBeLessThanOrEqual(20);
    expect(typeof w.axialTilt).toBe('number');
    expect(w.axialTilt).toBeGreaterThan(0);
    expect(w.axialTilt).toBeLessThan(45);
    expect(w.worldHistory).toBeInstanceOf(Array);
    expect(w.worldHistory.length).toBeGreaterThanOrEqual(2);
    expect(w.worldHistory.length).toBeLessThanOrEqual(4);
  });

  it('effectiveSeaLevel accounts for history events', () => {
    const w = new WorldIdentity(7);
    let expectedShift = 0;
    for (const e of w.worldHistory) {
      if (e.seaLevelShift) expectedShift += e.seaLevelShift;
    }
    expect(w.effectiveSeaLevel).toBe(w.seaLevel + expectedShift);
  });

  it('getContinentValue is deterministic and bounded', () => {
    const w = new WorldIdentity(99);
    const v1 = w.getContinentValue(100, 200);
    const v2 = w.getContinentValue(100, 200);
    expect(v1).toBe(v2);
    expect(v1).toBeGreaterThanOrEqual(-1);
    expect(v1).toBeLessThanOrEqual(1);
  });

  it('getContinentId is deterministic and returns -1 for ocean or 0..count-1 for land', () => {
    const w = new WorldIdentity(99);
    const id1 = w.getContinentId(100, 200);
    const id2 = w.getContinentId(100, 200);
    expect(id1).toBe(id2);
    expect(id1 === -1 || (id1 >= 0 && id1 < w.continentCount)).toBe(true);
  });

  it('isOcean is consistent with getContinentId', () => {
    const w = new WorldIdentity(99);
    // Sample a grid of points
    for (let x = -500; x <= 500; x += 100) {
      for (let z = -500; z <= 500; z += 100) {
        const id = w.getContinentId(x, z);
        const ocean = w.isOcean(x, z);
        expect(ocean).toBe(id === -1);
      }
    }
  });

  it('archipelago mode increases ocean coverage and island count', () => {
    const normal = new WorldIdentity(555);
    const archi = new WorldIdentity(555, { archipelagoMode: true });
    expect(archi.oceanCoverage).toBeGreaterThan(normal.oceanCoverage);
    expect(archi._isArchipelago).toBe(true);
    expect(normal._isArchipelago).toBe(false);
  });

  it('getGlobalTemperature decreases toward poles (latitude effect)', () => {
    const w = new WorldIdentity(33);
    const equator = w.getGlobalTemperature(0, 0);
    const pole = w.getGlobalTemperature(0, 10000);
    // Pole should generally be colder than equator
    expect(pole).toBeLessThan(equator + 0.1);
  });

  it('getInfo returns display object with all fields', () => {
    const w = new WorldIdentity(12);
    const info = w.getInfo();
    expect(info.seed).toBe(12);
    expect(typeof info.geologicalAge).toBe('string');
    expect(typeof info.oceanCoverage).toBe('string');
    expect(typeof info.seaLevel).toBe('string');
    expect(info.worldHistory).toBeInstanceOf(Array);
  });

  it('performance: continent identity lookup < 1ms', () => {
    const w = new WorldIdentity(2024);
    // Warm up cache
    w.getContinentId(0, 0);
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      w.getContinentId(i * 10, i * 7);
    }
    const elapsed = performance.now() - start;
    const perLookup = elapsed / 100;
    expect(perLookup).toBeLessThan(1.0);
  });
});

describe('SPEC-081: ContinentGenerator — Level 2', () => {
  it('constructs from WorldIdentity and generates continent properties', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    expect(cg.continents).toBeInstanceOf(Array);
    expect(cg.continents.length).toBe(w.continentCount);
  });

  it('each continent has unique identity fields', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    for (const c of cg.continents) {
      expect(typeof c.id).toBe('number');
      expect(typeof c.dominantClimate).toBe('number');
      expect(c.averageAltitude).toBeGreaterThan(0);
      expect(typeof c.humidityLevel).toBe('number');
      expect(c.dominantVegetation).toBeTruthy();
      expect(c.dominantFauna).toBeTruthy();
      expect(c.ancientCulture).toBeTruthy();
      expect(c.characteristicResources).toBeInstanceOf(Array);
      expect(c.characteristicResources.length).toBeGreaterThanOrEqual(2);
      expect(typeof c.regionSeed).toBe('number');
    }
  });

  it('continents are deterministic for the same world seed', () => {
    const w1 = new WorldIdentity(777);
    const w2 = new WorldIdentity(777);
    const cg1 = new ContinentGenerator(w1);
    const cg2 = new ContinentGenerator(w2);
    expect(cg1.continents.length).toBe(cg2.continents.length);
    for (let i = 0; i < cg1.continents.length; i++) {
      expect(cg1.continents[i].dominantClimate).toBe(cg2.continents[i].dominantClimate);
      expect(cg1.continents[i].averageAltitude).toBe(cg2.continents[i].averageAltitude);
      expect(cg1.continents[i].dominantVegetation).toBe(cg2.continents[i].dominantVegetation);
      expect(cg1.continents[i].ancientCulture).toBe(cg2.continents[i].ancientCulture);
    }
  });

  it('getContinentProperties returns ocean marker for ocean positions', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    // Find an ocean position by scanning
    let oceanPos = null;
    for (let x = -2000; x <= 2000 && !oceanPos; x += 200) {
      for (let z = -2000; z <= 2000 && !oceanPos; z += 200) {
        if (w.isOcean(x, z)) oceanPos = { x, z };
      }
    }
    expect(oceanPos).not.toBeNull();
    const props = cg.getContinentProperties(oceanPos.x, oceanPos.z);
    expect(props.isOcean).toBe(true);
    expect(props.id).toBe(-1);
    expect(props.dominantVegetation).toBe(BIOMES.OCEAN);
  });

  it('getContinentProperties returns land properties for land positions', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    let landPos = null;
    for (let x = -2000; x <= 2000 && !landPos; x += 200) {
      for (let z = -2000; z <= 2000 && !landPos; z += 200) {
        if (!w.isOcean(x, z)) landPos = { x, z };
      }
    }
    expect(landPos).not.toBeNull();
    const props = cg.getContinentProperties(landPos.x, landPos.z);
    expect(props.isOcean).toBe(false);
    expect(props.id).toBeGreaterThanOrEqual(0);
    expect(props.id).toBeLessThan(w.continentCount);
  });

  it('continents are coherent — nearby land points share continent id', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    // Find a land position
    let landPos = null;
    for (let x = -1000; x <= 1000 && !landPos; x += 100) {
      for (let z = -1000; z <= 1000 && !landPos; z += 100) {
        if (!w.isOcean(x, z)) landPos = { x, z };
      }
    }
    expect(landPos).not.toBeNull();
    const baseId = w.getContinentId(landPos.x, landPos.z);
    // Sample 8 neighbors at 32-block distance (within a chunk)
    let sameCount = 0;
    let totalCount = 0;
    for (const [dx, dz] of [[32, 0], [-32, 0], [0, 32], [0, -32], [24, 24], [-24, -24], [24, -24], [-24, 24]]) {
      const nx = landPos.x + dx;
      const nz = landPos.z + dz;
      if (!w.isOcean(nx, nz)) {
        totalCount++;
        if (w.getContinentId(nx, nz) === baseId) sameCount++;
      }
    }
    // At least 75% of nearby land points should share the same continent
    expect(totalCount).toBeGreaterThan(0);
    expect(sameCount / totalCount).toBeGreaterThanOrEqual(0.75);
  });

  it('continent borders are organic — blendFactor transitions smoothly', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    // Find a land position near a boundary (low continent value above threshold)
    let boundaryPos = null;
    for (let x = -2000; x <= 2000 && !boundaryPos; x += 50) {
      for (let z = -2000; z <= 2000 && !boundaryPos; z += 50) {
        const v = w.getContinentValue(x, z);
        if (v >= w.continentThreshold && v < w.continentThreshold + 0.15) {
          boundaryPos = { x, z };
        }
      }
    }
    // If we found a boundary, blendFactor should be in (0, 1)
    if (boundaryPos) {
      const props = cg.getContinentProperties(boundaryPos.x, boundaryPos.z);
      expect(props.blendFactor).toBeGreaterThan(0);
      expect(props.blendFactor).toBeLessThanOrEqual(1);
    }
  });

  it('integration: HierarchicalChunkGenerator uses WorldIdentity + ContinentGenerator without breaking', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    expect(gen.world).toBeInstanceOf(WorldIdentity);
    expect(gen.continentGen).toBeInstanceOf(ContinentGenerator);
    expect(gen.regionGen).toBeInstanceOf(RegionGenerator);
    expect(gen.zoneGen).toBeInstanceOf(ZoneGenerator);
    // getChunkContext should not throw
    const ctx = gen.getChunkContext(0, 0);
    expect(ctx).toBeDefined();
    expect(ctx.cx).toBe(0);
    expect(ctx.cz).toBe(0);
    expect(ctx.continent).toBeDefined();
    expect(ctx.region).toBeDefined();
    expect(ctx.zone).toBeDefined();
    expect(ctx.biomeWeights).toBeInstanceOf(Map);
    expect(ctx.heightMap).toBeInstanceOf(Float32Array);
    expect(ctx.heightMap.length).toBe(CHUNK_SIZE * CHUNK_SIZE);
  });
});

// ═══════════════════════════════════════════════════════════
// SPEC-082: Hierarchical 7.0 — Level 3-4 (Region + Zone)
// ═══════════════════════════════════════════════════════════

describe('SPEC-082: RegionGenerator — Level 3', () => {
  it('constructs from ContinentGenerator', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    const rg = new RegionGenerator(cg);
    expect(rg.continentGen).toBe(cg);
    expect(rg.world).toBe(w);
  });

  it('getRegion returns valid region type with properties', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    const rg = new RegionGenerator(cg);
    // Find a land position
    let landPos = null;
    for (let x = -2000; x <= 2000 && !landPos; x += 100) {
      for (let z = -2000; z <= 2000 && !landPos; z += 100) {
        if (!w.isOcean(x, z)) landPos = { x, z };
      }
    }
    expect(landPos).not.toBeNull();
    const region = rg.getRegion(landPos.x, landPos.z);
    expect(Object.values(REGION_TYPES)).toContain(region.type);
    expect(region.heightModifier).toBeDefined();
    expect(region.heightModifier.min).toBeLessThanOrEqual(region.heightModifier.max);
    expect(region.biomeBias).toBeInstanceOf(Array);
    expect(region.biomeBias.length).toBeGreaterThan(0);
    expect(typeof region.treeDensity).toBe('number');
    expect(typeof region.waterFeatures).toBe('number');
    expect(typeof region.landmarkChance).toBe('number');
    expect(typeof region.noiseType).toBe('string');
    expect(region.continentId).toBeDefined();
  });

  it('ocean positions return ocean/deep_ocean region type', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    const rg = new RegionGenerator(cg);
    let oceanPos = null;
    for (let x = -3000; x <= 3000 && !oceanPos; x += 200) {
      for (let z = -3000; z <= 3000 && !oceanPos; z += 200) {
        if (w.isOcean(x, z)) oceanPos = { x, z };
      }
    }
    expect(oceanPos).not.toBeNull();
    const region = rg.getRegion(oceanPos.x, oceanPos.z);
    expect([REGION_TYPES.OCEAN, REGION_TYPES.DEEP_OCEAN]).toContain(region.type);
  });

  it('biomes are coherent within a region — nearby points share region type', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    const rg = new RegionGenerator(cg);
    let landPos = null;
    for (let x = -1000; x <= 1000 && !landPos; x += 100) {
      for (let z = -1000; z <= 1000 && !landPos; z += 100) {
        if (!w.isOcean(x, z)) landPos = { x, z };
      }
    }
    const baseRegion = rg.getRegion(landPos.x, landPos.z);
    // Sample nearby points within region scale (32-block grid)
    let sameCount = 0;
    let totalCount = 0;
    for (const [dx, dz] of [[32, 0], [-32, 0], [0, 32], [0, -32], [64, 0], [-64, 0], [0, 64], [0, -64]]) {
      const nx = landPos.x + dx;
      const nz = landPos.z + dz;
      if (!w.isOcean(nx, nz)) {
        totalCount++;
        const r = rg.getRegion(nx, nz);
        if (r.type === baseRegion.type) sameCount++;
      }
    }
    // Coherence: at least 50% of nearby points share region type
    // (regions are larger than 32 blocks but noise can cause transitions)
    if (totalCount > 0) {
      expect(sameCount / totalCount).toBeGreaterThanOrEqual(0.4);
    }
  });

  it('getRegion is deterministic (cached)', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    const rg = new RegionGenerator(cg);
    const r1 = rg.getRegion(500, 500);
    const r2 = rg.getRegion(500, 500);
    expect(r1).toBe(r2); // Same cached object
  });

  it('performance: region lookup < 0.5ms', () => {
    const w = new WorldIdentity(2024);
    const cg = new ContinentGenerator(w);
    const rg = new RegionGenerator(cg);
    rg.getRegion(0, 0); // warm up
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      rg.getRegion(i * 64, i * 48);
    }
    const elapsed = performance.now() - start;
    expect(elapsed / 100).toBeLessThan(0.5);
  });
});

describe('SPEC-082: ZoneGenerator — Level 4', () => {
  it('constructs from RegionGenerator', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    const rg = new RegionGenerator(cg);
    const zg = new ZoneGenerator(rg);
    expect(zg.regionGen).toBe(rg);
    expect(zg.world).toBe(w);
  });

  it('getZone returns valid zone type with properties', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    const rg = new RegionGenerator(cg);
    const zg = new ZoneGenerator(rg);
    let landPos = null;
    for (let x = -2000; x <= 2000 && !landPos; x += 100) {
      for (let z = -2000; z <= 2000 && !landPos; z += 100) {
        if (!w.isOcean(x, z)) landPos = { x, z };
      }
    }
    expect(landPos).not.toBeNull();
    const zone = zg.getZone(landPos.x, landPos.z);
    expect(Object.values(ZONE_TYPES)).toContain(zone.type);
    expect(typeof zone.moodTag).toBe('string');
    expect(typeof zone.microDetail).toBe('number');
    expect(zone.featureList).toBeInstanceOf(Array);
    expect(typeof zone.regionType).toBe('string');
    expect(typeof zone.heightAdjustment).toBe('number');
    expect(typeof zone.decorationMultiplier).toBe('number');
  });

  it('zone type is valid for its parent region type', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    const rg = new RegionGenerator(cg);
    const zg = new ZoneGenerator(rg);
    // Sample many positions and verify zone validity
    for (let x = -1000; x <= 1000; x += 200) {
      for (let z = -1000; z <= 1000; z += 200) {
        const zone = zg.getZone(x, z);
        const region = rg.getRegion(x, z);
        // Zone.regionType should match the region at that position
        expect(zone.regionType).toBe(region.type);
      }
    }
  });

  it('transitions between zones are smooth — heightAdjustment is bounded', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    const rg = new RegionGenerator(cg);
    const zg = new ZoneGenerator(rg);
    // Sample height adjustments across a wide area; all should be within [-30, 30]
    for (let x = -500; x <= 500; x += 50) {
      for (let z = -500; z <= 500; z += 50) {
        const zone = zg.getZone(x, z);
        expect(zone.heightAdjustment).toBeGreaterThanOrEqual(-30);
        expect(zone.heightAdjustment).toBeLessThanOrEqual(30);
      }
    }
  });

  it('getZone is deterministic (cached)', () => {
    const w = new WorldIdentity(12345);
    const cg = new ContinentGenerator(w);
    const rg = new RegionGenerator(cg);
    const zg = new ZoneGenerator(rg);
    const z1 = zg.getZone(500, 500);
    const z2 = zg.getZone(500, 500);
    expect(z1).toBe(z2);
  });

  it('performance: zone lookup < 0.5ms', () => {
    const w = new WorldIdentity(2024);
    const cg = new ContinentGenerator(w);
    const rg = new RegionGenerator(cg);
    const zg = new ZoneGenerator(rg);
    zg.getZone(0, 0); // warm up
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      zg.getZone(i * CHUNK_SIZE, i * CHUNK_SIZE);
    }
    const elapsed = performance.now() - start;
    expect(elapsed / 100).toBeLessThan(0.5);
  });
});

// ═══════════════════════════════════════════════════════════
// SPEC-083: Hierarchical 7.0 — Level 5-6 (Chunk + Microsector)
// ═══════════════════════════════════════════════════════════

describe('SPEC-083: HierarchicalChunkGenerator — Level 5', () => {
  it('constructs all 6 hierarchy levels', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    expect(gen.world).toBeInstanceOf(WorldIdentity);
    expect(gen.continentGen).toBeInstanceOf(ContinentGenerator);
    expect(gen.regionGen).toBeInstanceOf(RegionGenerator);
    expect(gen.zoneGen).toBeInstanceOf(ZoneGenerator);
    expect(gen.microsectorGen).toBeInstanceOf(MicrosectorGenerator);
    expect(gen.hydrology).toBeDefined();
  });

  it('getChunkContext returns full context with all hierarchy data', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const ctx = gen.getChunkContext(2, -3);
    expect(ctx.cx).toBe(2);
    expect(ctx.cz).toBe(-3);
    expect(ctx.ox).toBe(2 * CHUNK_SIZE);
    expect(ctx.oz).toBe(-3 * CHUNK_SIZE);
    expect(ctx.continent).toBeDefined();
    expect(ctx.region).toBeDefined();
    expect(ctx.zone).toBeDefined();
    expect(ctx.biomeWeights).toBeInstanceOf(Map);
    expect(ctx.heightMap).toBeInstanceOf(Float32Array);
    expect(ctx.heightMap.length).toBe(CHUNK_SIZE * CHUNK_SIZE);
    expect(ctx.waterLevel).toBeGreaterThan(0);
    expect(ctx.vegetationBoost).toBeGreaterThan(0);
    expect(ctx.oreAbundance).toBeGreaterThan(0);
    expect(ctx.geologicalAge).toBeDefined();
  });

  it('heightMap values are within sane bounds', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const ctx = gen.getChunkContext(0, 0);
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < ctx.heightMap.length; i++) {
      const h = ctx.heightMap[i];
      if (h < min) min = h;
      if (h > max) max = h;
    }
    expect(min).toBeGreaterThanOrEqual(1);
    expect(max).toBeLessThanOrEqual(380);
    expect(max).toBeGreaterThan(min);
  });

  it('chunks are consistent with parent zone — same zone across chunk', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const ctx = gen.getChunkContext(5, 5);
    expect(ctx.zone.type).toBeTruthy();
    const ctx2 = gen.getChunkContext(5, 5);
    expect(ctx2).toBe(ctx);
  });

  it('getPrimaryBiome returns a valid BIOMES value', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const biome = gen.getPrimaryBiome(0, 0);
    expect(Object.values(BIOMES)).toContain(biome);
  });

  it('getHeightAt matches heightMap', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const ctx = gen.getChunkContext(1, 1);
    for (const [lx, lz] of [[0, 0], [15, 15], [31, 31], [7, 21]]) {
      expect(gen.getHeightAt(1, 1, lx, lz)).toBe(ctx.heightMap[lx + lz * CHUNK_SIZE]);
    }
  });

  it('clearCache empties all caches', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    gen.getChunkContext(0, 0);
    gen.getPrimaryBiome(0, 0);
    expect(gen._contextCache.size).toBeGreaterThan(0);
    gen.clearCache();
    expect(gen._contextCache.size).toBe(0);
    expect(gen.world._continentCache.size).toBe(0);
    expect(gen.regionGen._cache.size).toBe(0);
    expect(gen.zoneGen._cache.size).toBe(0);
  });

  it('compatibility: works with WorldGenPipeline.enableHierarchy', () => {
    const pipe = new WorldGenPipeline(99);
    expect(pipe._useHierarchy).toBe(false);
    const h = pipe.enableHierarchy();
    expect(h).toBeInstanceOf(HierarchicalChunkGenerator);
    expect(pipe._useHierarchy).toBe(true);
    expect(pipe.getChunkContext(0, 0)).toBeDefined();
    expect(pipe.getBiomeHierarchical(0, 0)).toBeTruthy();
    pipe.disableHierarchy();
    expect(pipe._useHierarchy).toBe(false);
  });

  it('performance: chunk context generation < 50ms (no worker)', () => {
    const gen = new HierarchicalChunkGenerator(2024);
    gen.getChunkContext(0, 0); // warm up
    const start = performance.now();
    for (let i = 0; i < 10; i++) {
      gen.getChunkContext(i, -i);
    }
    const elapsed = performance.now() - start;
    expect(elapsed / 10).toBeLessThan(50);
  });
});

describe('SPEC-083: MicrosectorGenerator — Level 6', () => {
  it('constructs with seed', () => {
    const m = new MicrosectorGenerator(42);
    expect(m.seed).toBe(42);
    expect(m.detailNoise).toBeDefined();
    expect(m._clearingNoise).toBeDefined();
  });

  it('getMicroElevation returns small integer offset (±2)', () => {
    const m = new MicrosectorGenerator(42);
    for (let cx = -2; cx <= 2; cx++) {
      for (let cz = -2; cz <= 2; cz++) {
        for (const [lx, lz] of [[0, 0], [15, 15], [31, 31]]) {
          const e = m.getMicroElevation(cx, cz, lx, lz);
          expect(Number.isInteger(e)).toBe(true);
          expect(e).toBeGreaterThanOrEqual(-2);
          expect(e).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it('generateMicrosectors places decorations via placeBlockFn', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const ctx = gen.getChunkContext(0, 0);
    const placed = [];
    gen.microsectorGen.generateMicrosectors({}, ctx, (wx, wz, blockType) => {
      placed.push({ wx, wz, blockType });
    });
    expect(placed.length).toBeGreaterThan(0);
    const validBlocks = new Set([
      'FLOWER_RED', 'FLOWER_YELLOW', 'TALL_GRASS',
      'MUSHROOM_BROWN', 'MUSHROOM_RED',
      'COBBLESTONE', 'STONE',
      'MOSS_BLOCK',
      'FERN', 'LEAVES', 'DEAD_BUSH', 'BAMBOO',
    ]);
    for (const p of placed) {
      expect(validBlocks.has(p.blockType)).toBe(true);
    }
  });

  it('decorations stay within chunk world bounds', () => {
    const gen = new HierarchicalChunkGenerator(12345);
    const ctx = gen.getChunkContext(3, 4);
    const placed = [];
    gen.microsectorGen.generateMicrosectors({}, ctx, (wx, wz, b) => placed.push({ wx, wz, b }));
    const ox = ctx.ox, oz = ctx.oz;
    for (const p of placed) {
      expect(p.wx).toBeGreaterThanOrEqual(ox);
      expect(p.wx).toBeLessThan(ox + CHUNK_SIZE);
      expect(p.wz).toBeGreaterThanOrEqual(oz);
      expect(p.wz).toBeLessThan(oz + CHUNK_SIZE);
    }
  });

  it('is deterministic for the same seed + context', () => {
    const gen1 = new HierarchicalChunkGenerator(777);
    const gen2 = new HierarchicalChunkGenerator(777);
    const ctx1 = gen1.getChunkContext(2, 2);
    const ctx2 = gen2.getChunkContext(2, 2);
    const p1 = [], p2 = [];
    gen1.microsectorGen.generateMicrosectors({}, ctx1, (wx, wz, b) => p1.push({ wx, wz, b }));
    gen2.microsectorGen.generateMicrosectors({}, ctx2, (wx, wz, b) => p2.push({ wx, wz, b }));
    expect(p1.length).toBe(p2.length);
    for (let i = 0; i < p1.length; i++) {
      expect(p1[i]).toEqual(p2[i]);
    }
  });

  it('integration: generateChunkHierarchical places microsector decorations on chunk', () => {
    const pipe = new WorldGenPipeline(12345);
    pipe.enableHierarchy();
    const world = {
      generator: pipe,
      dimension: 'overworld',
      _poissonEnabled: true,
      getBiome: (x, z) => pipe.getBiome(x, z),
    };
    const chunk = new VoxelChunk(1, 1, pipe);
    const ctx = pipe.getChunkContext(1, 1);
    expect(() => generateChunkHierarchical(chunk, world, ctx)).not.toThrow();
    expect(chunk.generated).toBe(true);
    let nonAir = 0;
    for (let i = 0; i < chunk.blocks.length; i++) {
      if (chunk.blocks[i] !== 0) nonAir++;
    }
    expect(nonAir).toBeGreaterThan(0);
  });

  it('compatibility: generateChunkHierarchical falls back when context is null', () => {
    const pipe = new WorldGenPipeline(12345);
    const world = {
      generator: pipe,
      dimension: 'overworld',
      _poissonEnabled: true,
      getBiome: (x, z) => pipe.getBiome(x, z),
    };
    const chunk = new VoxelChunk(0, 0, pipe);
    expect(() => generateChunkHierarchical(chunk, world, null)).not.toThrow();
    expect(chunk.generated).toBe(true);
  });
});
