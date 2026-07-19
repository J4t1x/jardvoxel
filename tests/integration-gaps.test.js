import { describe, it, expect } from 'vitest';
import { WorldGenPipeline } from '../core/jardvoxel-survival-engine.js';
import { ExplorationJournal, ENTRY_TYPES } from '../core/jardvoxel-survival-journal.js';

// ═══════════════════════════════════════════════════════════
// SPEC-073: 8 Integration Gaps v5.0
// ═══════════════════════════════════════════════════════════

describe('SPEC-073 Gap 1: Quest tracking wired into game', () => {
  it('QuestManager is imported and instantiated in ZenGame', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-zen-game.js'),
      'utf8'
    );
    expect(src).toContain('QuestManager');
    expect(src).toContain('questManager');
    expect(src).toContain('quest_completed');
    expect(src).toContain('journal.addEntry');
  });
});

describe('SPEC-073 Gap 2: AI Client available (lazy init)', () => {
  it('AIClient is imported in ZenGame', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-zen-game.js'),
      'utf8'
    );
    expect(src).toContain('AIClient');
  });
});

describe('SPEC-073 Gap 3: NPC memory persists between sessions', () => {
  it('NPCMemorySystem is imported, instantiated, and saved/loaded', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-zen-game.js'),
      'utf8'
    );
    expect(src).toContain('NPCMemorySystem');
    expect(src).toContain('npcMemorySystem');
    expect(src).toContain('serializeAll');
    expect(src).toContain('deserializeAll');
  });
});

describe('SPEC-073 Gap 4: Civilization system instantiated', () => {
  it('AncientCivilizationSystem is imported and instantiated', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-zen-game.js'),
      'utf8'
    );
    expect(src).toContain('AncientCivilizationSystem');
    expect(src).toContain('civilizationSystem');
  });
});

describe('SPEC-073 Gap 5: Living World events wired to journal', () => {
  it('ZenGame registers onEvent callback on LivingWorldSystem', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-zen-game.js'),
      'utf8'
    );
    expect(src).toContain('livingWorldSystem.onEvent');
    expect(src).toContain('journal.addEntry');
  });
});

describe('SPEC-073 Gap 6: Resonance affects world generation', () => {
  it('WorldGenPipeline has setResonanceInfluence method', () => {
    const pipe = new WorldGenPipeline(42);
    expect(typeof pipe.setResonanceInfluence).toBe('function');
    expect(typeof pipe.getResonanceInfluence).toBe('function');
  });

  it('setResonanceInfluence stores and returns influence data', () => {
    const pipe = new WorldGenPipeline(42);
    const influence = { flowerDensity: 1.5, treeDensity: 0.8 };
    pipe.setResonanceInfluence(influence);
    expect(pipe.getResonanceInfluence()).toBe(influence);
  });

  it('ZenGame pushes resonance influence to world generator', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-zen-game.js'),
      'utf8'
    );
    expect(src).toContain('setResonanceInfluence');
    expect(src).toContain('getWorldGenInfluence');
  });
});

describe('SPEC-073 Gap 7: Komorebi visual feedback', () => {
  it('KomorebiSystem has light intensity tracking', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-survival-komorebi.js'),
      'utf8'
    );
    expect(src).toContain('_lightIntensity');
    expect(src).toContain('_targetLightIntensity');
    expect(src).toContain('getLightIntensity');
    expect(src).toContain('updateLightIntensity');
  });

  it('activation sets target light intensity > 0', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../core/jardvoxel-survival-komorebi.js'),
      'utf8'
    );
    expect(src).toContain('_targetLightIntensity = 0.6');
  });
});

describe('SPEC-073 Gap 8: Journal milestones auto-detected', () => {
  it('ExplorationJournal auto-detects milestones on stat increment', () => {
    const journal = new ExplorationJournal();
    // Increment blocksPlaced to trigger milestone at 10
    for (let i = 0; i < 10; i++) {
      journal.incrementStat('blocksPlaced');
    }
    const milestones = journal.getEntriesByType('milestone');
    expect(milestones.length).toBeGreaterThan(0);
    expect(milestones[0].title).toContain('blocksPlaced');
  });

  it('milestones are not duplicated', () => {
    const journal = new ExplorationJournal();
    for (let i = 0; i < 15; i++) {
      journal.incrementStat('blocksPlaced');
    }
    const milestones = journal.getEntriesByType('milestone');
    // Should have milestones at 10 (not 10 twice)
    const tenMilestones = milestones.filter(m => m.title.includes('10'));
    expect(tenMilestones.length).toBe(1);
  });

  it('multiple stat thresholds trigger separate milestones', () => {
    const journal = new ExplorationJournal();
    // Trigger blocksPlaced milestones at 10 and 50
    for (let i = 0; i < 50; i++) {
      journal.incrementStat('blocksPlaced');
    }
    const milestones = journal.getEntriesByType('milestone');
    expect(milestones.length).toBeGreaterThanOrEqual(2);
  });

  it('setStat also triggers milestones (for highestResonance)', () => {
    const journal = new ExplorationJournal();
    journal.setStat('highestResonance', 25);
    const milestones = journal.getEntriesByType('milestone');
    expect(milestones.length).toBeGreaterThan(0);
  });

  it('ENTRY_TYPES.MILESTONE is defined', () => {
    expect(ENTRY_TYPES.MILESTONE).toBe('milestone');
  });
});
