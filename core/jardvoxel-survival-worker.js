// JardVoxel Survival Worker — chunk generation offloading
import { WorldGenPipeline, VoxelChunk } from './jardvoxel-survival-engine.js';
import { NetherGenerator } from './jardvoxel-survival-nether.js';
import { PatagoniaProfile, applyPatagoniaToGenerator } from './jardvoxel-patagonia.js';

let world = null;
let netherGen = null;
let dimension = 'overworld';

self.onmessage = (e) => {
  if (e.data.type === 'init') {
    world = new WorldGenPipeline(e.data.seed);
    if (e.data.useHierarchy) world.enableHierarchy();
    if (e.data.patagonia) {
      const pat = new PatagoniaProfile(e.data.seed);
      applyPatagoniaToGenerator(world, pat);
    }
    netherGen = new NetherGenerator();
    return;
  }
  if (e.data.type === 'setDimension') {
    dimension = e.data.dimension;
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
          const idx = x + z * 16 + y * 16 * 16;
          chunk.blocks[idx] = data.blocks[x + z * size + y * size * size];
        }
      }
    }
    chunk.generated = true;
  } else {
    chunk.generate();
  }
  self.postMessage({
    cx, cz,
    blocks: chunk.blocks.buffer,
    minContentY: chunk.minContentY ?? 0,
    maxContentY: chunk.maxContentY ?? 0,
  }, [chunk.blocks.buffer]);
};
