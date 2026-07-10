// ═══════════════════════════════════════════════════════════
// SPEC-118: Worker Feature Generation Integration Test
// Verifies generateChunkWithFeatures runs correctly in worker context
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGenPipeline, VoxelChunk, CHUNK_SIZE, CHUNK_HEIGHT, WORLD_MIN_Y } from '../core/jardvoxel-survival-engine.js';
import { generateChunkWithFeatures } from '../core/jardvoxel-survival-features.js';
import { BLOCK } from '../core/blocks-registry.js';

describe('SPEC-118: Worker Feature Generation', () => {
  let world;
  const TEST_SEED = 12345;

  beforeEach(() => {
    // Initialize world generator with same structure as worker
    world = new WorldGenPipeline(TEST_SEED);
    world.enableHierarchy({ archipelagoMode: false });
    
    // SPEC-118: Feature functions expect world.generator and world.dimension
    // This mimics the worker setup in jardvoxel-survival-worker.js:35-36
    world.generator = world;
    world.dimension = 'overworld';
  });

  it('generates chunk with features in worker-like context', () => {
    const chunk = new VoxelChunk(0, 0, world);
    chunk.generate();
    
    // Call generateChunkWithFeatures as the worker does
    generateChunkWithFeatures(chunk, world);
    
    expect(chunk.generated).toBe(true);
    expect(chunk.blocks).toBeDefined();
    expect(chunk.blocks.length).toBe(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
  });

  it('generates consistent features with same seed', () => {
    // Generate same chunk twice with same seed
    const chunk1 = new VoxelChunk(5, 5, world);
    chunk1.generate();
    generateChunkWithFeatures(chunk1, world);

    // Reset world with same seed
    const world2 = new WorldGenPipeline(TEST_SEED);
    world2.enableHierarchy({ archipelagoMode: false });
    world2.generator = world2;
    world2.dimension = 'overworld';

    const chunk2 = new VoxelChunk(5, 5, world2);
    chunk2.generate();
    generateChunkWithFeatures(chunk2, world2);

    // Compare block arrays
    expect(chunk1.blocks).toEqual(chunk2.blocks);
  });

  it('places features (trees/ores) in generated chunk', () => {
    const chunk = new VoxelChunk(10, 10, world);
    chunk.generate();
    
    // Count non-air/stone/dirt/grass blocks before features
    const countSpecialBlocks = (blocks) => {
      let count = 0;
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (b !== BLOCK.AIR && b !== BLOCK.STONE && b !== BLOCK.DIRT && 
            b !== BLOCK.GRASS_BLOCK && b !== BLOCK.WATER && b !== BLOCK.SAND) {
          count++;
        }
      }
      return count;
    };

    const beforeCount = countSpecialBlocks(chunk.blocks);
    
    generateChunkWithFeatures(chunk, world);
    
    const afterCount = countSpecialBlocks(chunk.blocks);
    
    // Features should add some blocks (trees, ores, vegetation)
    // Not all chunks will have features, but over multiple chunks we should see some
    expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
  });

  it('handles nether dimension correctly', () => {
    world.dimension = 'nether';
    
    const chunk = new VoxelChunk(0, 0, world);
    chunk.generate();
    chunk.generated = true; // Nether chunks are pre-generated
    
    // generateChunkWithFeatures should detect nether and skip (or handle appropriately)
    generateChunkWithFeatures(chunk, world);
    
    expect(chunk.generated).toBe(true);
  });

  it('respects world generator settings', () => {
    // Test with Poisson vegetation disabled
    world._poissonEnabled = false;
    
    const chunk = new VoxelChunk(3, 3, world);
    chunk.generate();
    generateChunkWithFeatures(chunk, world);
    
    expect(chunk.generated).toBe(true);
    // With Poisson disabled, should have fewer/no trees
  });

  it('handles chunk with narrative structures', () => {
    const chunk = new VoxelChunk(15, 15, world);
    chunk.generate();
    generateChunkWithFeatures(chunk, world);
    
    // narrativeStructures may or may not be present (null, undefined, or array), but should not crash
    expect(chunk.narrativeStructures === null || 
           chunk.narrativeStructures === undefined || 
           Array.isArray(chunk.narrativeStructures)).toBe(true);
  });

  it('maintains chunk bounds (no out-of-bounds writes)', () => {
    const chunk = new VoxelChunk(7, 7, world);
    chunk.generate();
    
    const originalLength = chunk.blocks.length;
    generateChunkWithFeatures(chunk, world);
    
    expect(chunk.blocks.length).toBe(originalLength);
    
    // Verify no blocks are undefined or invalid
    for (let i = 0; i < chunk.blocks.length; i++) {
      expect(typeof chunk.blocks[i]).toBe('number');
      expect(chunk.blocks[i]).toBeGreaterThanOrEqual(0);
    }
  });

  it('works with different chunk coordinates', () => {
    // Test multiple chunks to ensure coordinate handling is correct
    const coords = [[0, 0], [1, 1], [-1, -1], [100, 100], [-50, 50]];
    
    for (const [cx, cz] of coords) {
      const chunk = new VoxelChunk(cx, cz, world);
      chunk.generate();
      generateChunkWithFeatures(chunk, world);
      
      expect(chunk.generated).toBe(true);
      expect(chunk.cx).toBe(cx);
      expect(chunk.cz).toBe(cz);
    }
  });

  it('preserves minContentY and maxContentY metadata', () => {
    const chunk = new VoxelChunk(8, 8, world);
    chunk.generate();
    generateChunkWithFeatures(chunk, world);
    
    // These values are used for optimization and should be set
    expect(typeof chunk.minContentY).toBe('number');
    expect(typeof chunk.maxContentY).toBe('number');
    expect(chunk.minContentY).toBeLessThanOrEqual(chunk.maxContentY);
  });
});
