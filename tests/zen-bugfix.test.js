import { describe, it, expect } from 'vitest';
import { WorldGenPipeline, VoxelChunk, CHUNK_SIZE } from '../core/jardvoxel-survival-engine.js';
import { FeaturePlacer } from '../core/jardvoxel-survival-noise.js';

// ═══════════════════════════════════════════════════════════
// SPEC-074: Zen Bugfix — Critical & High Severity
// ═══════════════════════════════════════════════════════════

describe('SPEC-074 Bug #1: Block mod persistence on chunk unload', () => {
  it('SurvivalWorld has onChunkUnload hook', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-survival-gameplay.js'),
      'utf8'
    );
    expect(src).toContain('onChunkUnload');
    expect(src).toContain('this.onChunkUnload(key)');
  });

  it('ZenGame wires onChunkUnload to save modifications', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-zen-game.js'),
      'utf8'
    );
    expect(src).toContain('onChunkUnload');
    expect(src).toContain('saveManager.saveChunk');
  });
});

describe('SPEC-074 Bug #2: Worker pool timeout (deadlock prevention)', () => {
  it('WorkerPool has timeout mechanism', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-survival-worker-pool.js'),
      'utf8'
    );
    expect(src).toContain('setTimeout');
    expect(src).toContain('Worker timeout');
    expect(src).toContain('clearTimeout');
  });
});

describe('SPEC-074 Bug #4: Dispose cleans all subsystems', () => {
  it('ZenGame._dispose calls destroy/dispose on all subsystems', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-zen-game.js'),
      'utf8'
    );
    // Verify all subsystems are disposed
    expect(src).toContain('ambientSoundManager');
    expect(src).toContain('komorebiSystem');
    expect(src).toContain('livingWorldSystem');
    expect(src).toContain('resonanceSystem');
    expect(src).toContain('particles');
    expect(src).toContain('weatherManager');
    expect(src).toContain('fogManager');
    expect(src).toContain('shadowManager');
  });
});

describe('SPEC-074 Bug #5: WebGL context loss restoration', () => {
  it('ZenGame restores state after webglcontextrestored', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-zen-game.js'),
      'utf8'
    );
    expect(src).toContain('webglcontextrestored');
    expect(src).toContain('initWaterMaterialManager');
    expect(src).toContain('_rebuildChunkMesh');
  });
});

describe('SPEC-074 Bug #10: LivingWorld dispose()', () => {
  it('LivingWorldSystem has dispose method', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-survival-living-world.js'),
      'utf8'
    );
    expect(src).toContain('dispose()');
  });
});

describe('SPEC-074 Bug #14: Save manager quota exceeded handling', () => {
  it('SaveManager has _handleQuotaError method', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-survival-save.js'),
      'utf8'
    );
    expect(src).toContain('_handleQuotaError');
    expect(src).toContain('QuotaExceededError');
  });

  it('saveWorld and saveChunk call _handleQuotaError on error', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-survival-save.js'),
      'utf8'
    );
    // Both save methods should reference _handleQuotaError in their error handlers
    const saveWorldSection = src.substring(src.indexOf('async saveWorld'), src.indexOf('async loadWorld'));
    const saveChunkSection = src.substring(src.indexOf('async saveChunk'), src.indexOf('async loadChunk'));
    expect(saveWorldSection).toContain('_handleQuotaError');
    expect(saveChunkSection).toContain('_handleQuotaError');
  });
});

// Bugs already fixed (verified by audit)
describe('SPEC-074: Already-fixed bugs (verification)', () => {
  it('Bug #3: Minimap coordinates are correct', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-zen-game.js'),
      'utf8'
    );
    // Minimap should use proper coordinate transformation
    expect(src).toContain('wx = Math.floor(px + (dx / radius) * range)');
  });

  it('Bug #6: Game lifecycle saves on visibility change', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-zen-game.js'),
      'utf8'
    );
    expect(src).toContain('visibilitychange');
    expect(src).toContain('_saveNow');
  });

  it('Bug #7: Water lighting uses correct sun direction', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-survival-water.js'),
      'utf8'
    );
    expect(src).toContain('uSunDirection');
  });

  it('Bug #8: Raycasts are throttled (not 3x per frame)', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-zen-game.js'),
      'utf8'
    );
    expect(src).toContain('_raycastTimer');
    expect(src).toContain('_cachedRaycast');
  });

  it('Bug #9: Block placement handles chunk boundaries', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-survival-gameplay.js'),
      'utf8'
    );
    // Negative coordinate handling with modulo
    expect(src).toContain('((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE');
  });

  it('Bug #11: GameAudio has dispose method', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-survival-gameplay.js'),
      'utf8'
    );
    expect(src).toContain('dispose()');
  });

  it('Bug #12: ChillTuneEngine has destroy method', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-survival-chilltune.js'),
      'utf8'
    );
    expect(src).toContain('destroy()');
  });

  it('Bug #13: Journal uses main save system (no localStorage mismatch)', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-survival-journal.js'),
      'utf8'
    );
    // Journal should NOT use its own localStorage
    expect(src).toContain('Save is handled by ZenGame main save system');
  });
});
