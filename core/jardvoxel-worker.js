// JardVoxel Worker — chunk generation offloading for the legacy engine (jardvoxel.html)
// SPEC-CHUNK-OPT: ChunkManager (jardvoxel-engine.js) has referenced this file since
// SPEC-037, but it never existed — new Worker(...) always threw, onerror fired, and
// every chunk silently fell back to synchronous main-thread generation, which is
// what was hitching the render loop on every new chunk. This is the actual worker.
import { WorldGenerator, VoxelChunk } from './jardvoxel-engine.js';

let world = null;

self.onmessage = (e) => {
  if (e.data.type === 'init') {
    world = new WorldGenerator(e.data.seed);
    return;
  }
  const { cx, cz } = e.data;
  if (!world) return;
  const chunk = new VoxelChunk(cx, cz, world);
  chunk.generate();
  self.postMessage({ cx, cz, blocks: chunk.blocks.buffer }, [chunk.blocks.buffer]);
};
