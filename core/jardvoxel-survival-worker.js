// JardVoxel Survival Worker — chunk generation offloading
// SPEC-118: Feature generation (trees/structures/vegetation) now runs in worker
import { WorldGenPipeline, VoxelChunk } from './jardvoxel-survival-engine.js';
import { NetherGenerator } from './jardvoxel-survival-nether.js';
import { PatagoniaProfile, applyPatagoniaToGenerator } from './jardvoxel-patagonia.js';
import { generateChunkWithFeatures } from './jardvoxel-survival-features.js';

let world = null;
let netherGen = null;
let dimension = 'overworld';

function applyTerrainSettings(settings) {
  if (!world) return;
  world._useVoronoiBiomes = settings.voronoiBiomes !== false;
  world._useCellularNoise = settings.cellularNoise !== false;
  if (world.hierarchy) {
    world.hierarchy._useRidgedNoise = settings.ridgedNoise !== false;
    world.hierarchy._useCellularNoise = settings.cellularNoise !== false;
    if (world.hierarchy.hydrology) {
      world.hierarchy.hydrology.enabled = settings.hydrology !== false;
    }
  }
}

self.onmessage = (e) => {
  if (e.data.type === 'init') {
    world = new WorldGenPipeline(e.data.seed);
    world.setWorldMode(e.data.worldMode || 'survival');
    if (e.data.useHierarchy) world.enableHierarchy({ archipelagoMode: e.data.archipelagoMode });
    if (e.data.patagonia) {
      const pat = new PatagoniaProfile(e.data.seed);
      applyPatagoniaToGenerator(world, pat);
    }
    netherGen = new NetherGenerator();
    // SPEC-118: Feature functions expect world.generator (the WorldGenPipeline) and world.dimension
    world.generator = world;
    world.dimension = dimension;
    // Apply terrain settings from init message
    applyTerrainSettings(e.data.terrainSettings || {});
    return;
  }
  if (e.data.type === 'updateSettings') {
    applyTerrainSettings(e.data.settings || {});
    // Clear caches so new settings take effect on next chunk
    if (world) {
      world.cache.clear();
      if (world._biomeCache) world._biomeCache.clear();
      if (world._heightCache) world._heightCache.clear();
      if (world.hierarchy) world.hierarchy.clearCache();
    }
    return;
  }
  if (e.data.type === 'setDimension') {
    dimension = e.data.dimension;
    if (world) world.dimension = dimension;
    return;
  }
  const { cx, cz } = e.data;
  if (!world) return;
  const chunk = new VoxelChunk(cx, cz, world);
  if (dimension === 'nether' && netherGen) {
    const data = netherGen.generateChunk(cx, cz);
    const size = data.size;
    const height = data.height;
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        for (let y = 0; y < height && y < chunk.blocks.length / (size * size); y++) {
          const idx = x + z * size + y * size * size;
          chunk.blocks[idx] = data.blocks[x + z * size + y * size * size];
        }
      }
    }
    chunk.generated = true;
  } else {
    chunk.generate();
  }
  // SPEC-118: Run feature generation (ores, trees, decoration, structures, hydrology) in worker
  // For nether chunks, generateChunkWithFeatures detects world.dimension === 'nether' and skips
  // (chunk is already generated). For overworld, chunk.generate() is a no-op since already done,
  // then features are applied to the blocks typed array.
  generateChunkWithFeatures(chunk, world);
  self.postMessage({
    cx, cz,
    blocks: chunk.blocks.buffer,
    minContentY: chunk.minContentY ?? 0,
    maxContentY: chunk.maxContentY ?? 0,
    narrativeStructures: chunk.narrativeStructures || null,
  }, [chunk.blocks.buffer]);
};
