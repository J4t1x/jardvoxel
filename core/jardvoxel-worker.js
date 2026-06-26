// SPEC-037: Web Worker for chunk generation offloading
import { WorldGenerator, VoxelChunk, CHUNK_SIZE, CHUNK_HEIGHT, BLOCKS } from './jardvoxel-engine.js';

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
  // Transfer the underlying ArrayBuffer for zero-copy
  self.postMessage({ cx, cz, blocks: chunk.blocks.buffer }, [chunk.blocks.buffer]);
};
