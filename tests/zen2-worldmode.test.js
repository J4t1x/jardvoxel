import { describe, it, expect } from 'vitest';
import {
  WorldGenPipeline, WORLD_MIN_Y, SEA_LEVEL, CHUNK_SIZE, CHUNK_HEIGHT,
  ZEN2_HEIGHT_SCALE, ZEN2_MAX_ELEVATION,
} from '../core/jardvoxel-survival-engine.js';
import { generateOres } from '../core/jardvoxel-survival-features.js';
import { BLOCK } from '../core/blocks-registry.js';

describe('Zen2 flat world mode (SPEC: jardvoxel-zen2)', () => {
  it('defaults to survival mode — zero behavior change unless opted in', () => {
    const gen = new WorldGenPipeline(42);
    expect(gen.isFlatMode()).toBe(false);
  });

  it('setWorldMode toggles flat mode, unknown modes fall back to survival', () => {
    const gen = new WorldGenPipeline(42);
    gen.setWorldMode('zen2');
    expect(gen.isFlatMode()).toBe(true);
    gen.setWorldMode('survival');
    expect(gen.isFlatMode()).toBe(false);
    gen.setWorldMode('nonsense');
    expect(gen.isFlatMode()).toBe(false);
  });

  it('compresses terrain height toward sea level and caps peak elevation in zen2 mode', () => {
    const survivalGen = new WorldGenPipeline(1234);
    const zenGen = new WorldGenPipeline(1234);
    zenGen.setWorldMode('zen2');

    let sawVariance = false;
    for (let i = 0; i < 40; i++) {
      const x = i * 137;
      const z = i * 251;
      const hSurvival = survivalGen.getBaseHeight(x, z);
      const hZen = zenGen.getBaseHeight(x, z);

      expect(hZen).toBeLessThanOrEqual(SEA_LEVEL + ZEN2_MAX_ELEVATION + 0.001);
      if (hSurvival > SEA_LEVEL) {
        // Compression pulls height down toward sea level, never pushes it higher.
        expect(hZen).toBeLessThanOrEqual(hSurvival + 0.001);
      }
      if (Math.abs(hSurvival - SEA_LEVEL) > 1) sawVariance = true;
    }
    expect(sawVariance).toBe(true); // sanity check: survival terrain actually varies at these samples
  });

  it('hierarchical height path also compresses in zen2 mode', () => {
    const gen = new WorldGenPipeline(55);
    gen.enableHierarchy();
    gen.setWorldMode('zen2');
    for (let i = 0; i < 10; i++) {
      const h = gen.getBaseHeight(i * 300, i * 400);
      expect(h).toBeLessThanOrEqual(SEA_LEVEL + ZEN2_MAX_ELEVATION + 0.001);
    }
  });

  it('skips cave carving entirely in zen2 mode, even deep underground', () => {
    const gen = new WorldGenPipeline(99);
    gen.setWorldMode('zen2');
    for (let i = 0; i < 50; i++) {
      const x = i * 17, y = WORLD_MIN_Y + 20, z = i * 31;
      const density = 0.5;
      expect(gen.applyCaves(x, y, z, density)).toBe(density);
    }
  });

  it('carves caves normally in survival mode (regression: default behavior unchanged)', () => {
    const gen = new WorldGenPipeline(99);
    let carvedAny = false;
    for (let i = 0; i < 200; i++) {
      const x = i * 3, y = WORLD_MIN_Y + 20, z = i * 5;
      if (gen.applyCaves(x, y, z, 0.5) === -1) carvedAny = true;
    }
    expect(carvedAny).toBe(true);
  });

  it('generateOres is a no-op in zen2 mode but places ores in survival mode', () => {
    const makeStoneChunk = () => {
      const chunk = { cx: 3, cz: -2, blocks: new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE) };
      chunk.blocks.fill(BLOCK.STONE);
      return chunk;
    };

    const survivalGen = new WorldGenPipeline(7);
    const survivalChunk = makeStoneChunk();
    generateOres(survivalChunk, { generator: survivalGen });
    expect(survivalChunk.blocks.some((b) => b !== BLOCK.STONE)).toBe(true);

    const zenGen = new WorldGenPipeline(7);
    zenGen.setWorldMode('zen2');
    const zenChunk = makeStoneChunk();
    generateOres(zenChunk, { generator: zenGen });
    expect(zenChunk.blocks.every((b) => b === BLOCK.STONE)).toBe(true);
  });

  it('ZEN2_HEIGHT_SCALE is a real compression factor (0 < scale < 1)', () => {
    expect(ZEN2_HEIGHT_SCALE).toBeGreaterThan(0);
    expect(ZEN2_HEIGHT_SCALE).toBeLessThan(1);
  });
});
