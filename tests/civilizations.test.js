import { describe, it, expect, beforeEach } from 'vitest';
import { AncientCivilizationSystem } from '../core/jardvoxel-survival-civilizations.js';

describe('Ancient Civilizations — SPEC-090', () => {
  let system;

  beforeEach(() => {
    system = new AncientCivilizationSystem(12345);
  });

  describe('Civilization Generation', () => {
    it('should generate 1-3 civilizations', () => {
      const civs = system.generate();
      expect(civs.length).toBeGreaterThanOrEqual(1);
      expect(civs.length).toBeLessThanOrEqual(3);
    });

    it('should only generate once', () => {
      const first = system.generate();
      const second = system.generate();
      expect(second).toBe(first);
    });

    it('should be deterministic with same seed', () => {
      const sys1 = new AncientCivilizationSystem(12345);
      const sys2 = new AncientCivilizationSystem(12345);
      const civs1 = sys1.generate();
      const civs2 = sys2.generate();
      expect(civs1.length).toBe(civs2.length);
      expect(civs1[0].name).toBe(civs2[0].name);
    });

    it('should differ with different seeds', () => {
      const sys1 = new AncientCivilizationSystem(111);
      const sys2 = new AncientCivilizationSystem(222);
      const civs1 = sys1.generate();
      const civs2 = sys2.generate();
      // Names should likely differ (not guaranteed but very likely)
      const names1 = civs1.map(c => c.name).join(',');
      const names2 = civs2.map(c => c.name).join(',');
      expect(names1).not.toEqual(names2);
    });

    it('should have name for each civilization', () => {
      const civs = system.generate();
      for (const civ of civs) {
        expect(civ.name).toBeTruthy();
        expect(civ.name.length).toBeGreaterThan(2);
      }
    });

    it('should have era (stone, bronze, or magic)', () => {
      const civs = system.generate();
      const validEras = ['age_of_stone', 'age_of_bronze', 'age_of_magic'];
      for (const civ of civs) {
        expect(validEras).toContain(civ.era);
      }
    });

    it('should have culture (builders, warriors, scholars, mystics)', () => {
      const civs = system.generate();
      const validCultures = ['builders', 'warriors', 'scholars', 'mystics'];
      for (const civ of civs) {
        expect(validCultures).toContain(civ.culture);
      }
    });

    it('should have decline reason (war, plague, cataclysm, mystery)', () => {
      const civs = system.generate();
      const validReasons = ['war', 'plague', 'cataclysm', 'mystery'];
      for (const civ of civs) {
        expect(validReasons).toContain(civ.declineReason);
      }
    });

    it('should have structures distributed in appropriate biomes', () => {
      const civs = system.generate();
      for (const civ of civs) {
        expect(civ.structures.length).toBeGreaterThan(0);
        for (const struct of civ.structures) {
          expect(civ.preferredBiomes).toContain(struct.biome);
        }
      }
    });

    it('should have artifacts', () => {
      const civs = system.generate();
      for (const civ of civs) {
        expect(civ.artifacts.length).toBeGreaterThan(0);
      }
    });

    it('should have history with founding, goldenAge, decline, legacy', () => {
      const civs = system.generate();
      for (const civ of civs) {
        expect(civ.history.founding).toBeTruthy();
        expect(civ.history.goldenAge).toBeTruthy();
        expect(civ.history.decline).toBeTruthy();
        expect(civ.history.legacy).toBeTruthy();
      }
    });

    it('should have recipes', () => {
      const civs = system.generate();
      for (const civ of civs) {
        expect(civ.recipes.length).toBeGreaterThan(0);
        for (const recipe of civ.recipes) {
          expect(recipe.name).toBeTruthy();
          expect(recipe.unlocked).toBe(false);
        }
      }
    });
  });

  describe('Discovery System', () => {
    it('should discover structure', () => {
      system.generate();
      const civ = system.getCivilizations()[0];
      const lore = system.discoverStructure(civ.id, 0);
      expect(lore).not.toBeNull();
      expect(lore.title).toContain(civ.name);
      expect(civ.structures[0].discovered).toBe(true);
    });

    it('should return null for invalid structure index', () => {
      system.generate();
      const civ = system.getCivilizations()[0];
      expect(system.discoverStructure(civ.id, 999)).toBeNull();
    });

    it('should discover artifact', () => {
      system.generate();
      const artifacts = system.getAllArtifacts();
      const artifact = artifacts[0];
      const result = system.discoverArtifact(artifact.id);
      expect(result).not.toBeNull();
      expect(result.discovered).toBe(true);
    });

    it('should return null for unknown artifact', () => {
      expect(system.discoverArtifact('nonexistent')).toBeNull();
    });

    it('should track discovery progress', () => {
      system.generate();
      const civ = system.getCivilizations()[0];
      const progress = system.getDiscoveryProgress(civ.id);
      expect(progress.total).toBeGreaterThan(0);
      expect(progress.discovered).toBe(0);
      expect(progress.progress).toBe(0);

      system.discoverStructure(civ.id, 0);
      const progress2 = system.getDiscoveryProgress(civ.id);
      expect(progress2.discovered).toBe(1);
      expect(progress2.progress).toBeGreaterThan(0);
    });

    it('should count discoveries per civilization', () => {
      system.generate();
      const civ = system.getCivilizations()[0];
      expect(system.getDiscoveredCount(civ.id)).toBe(0);
      system.discoverStructure(civ.id, 0);
      expect(system.getDiscoveredCount(civ.id)).toBe(1);
    });
  });

  describe('Artifact Combination', () => {
    it('should combine 3+ artifacts from same civilization', () => {
      system.generate();
      const civ = system.getCivilizations()[0];
      const artifactIds = civ.artifacts.slice(0, 3);
      const result = system.combineArtifacts(artifactIds);
      expect(result).not.toBeNull();
      expect(result.title).toContain(civ.name);
      expect(result.unlocked).toBe(true);
    });

    it('should not combine fewer than 3 artifacts', () => {
      system.generate();
      const civ = system.getCivilizations()[0];
      const result = system.combineArtifacts(civ.artifacts.slice(0, 2));
      expect(result).toBeNull();
    });

    it('should not combine artifacts from different civilizations', () => {
      system.generate();
      const civs = system.getCivilizations();
      if (civs.length < 2) return; // skip if only 1 civ
      const ids = [civs[0].artifacts[0], civs[0].artifacts[1], civs[1].artifacts[0]];
      const result = system.combineArtifacts(ids);
      expect(result).toBeNull();
    });

    it('should mark artifacts as combined', () => {
      system.generate();
      const civ = system.getCivilizations()[0];
      const ids = civ.artifacts.slice(0, 3);
      system.combineArtifacts(ids);
      for (const id of ids) {
        expect(system.getArtifact(id).combined).toBe(true);
      }
    });
  });

  describe('Ancient Recipes', () => {
    it('should unlock recipe', () => {
      system.generate();
      const civ = system.getCivilizations()[0];
      const result = system.unlockRecipe(civ.id, 0);
      expect(result).toBe(true);
      expect(civ.recipes[0].unlocked).toBe(true);
    });

    it('should track unlocked recipes', () => {
      system.generate();
      const civ = system.getCivilizations()[0];
      system.unlockRecipe(civ.id, 0);
      const unlocked = system.getUnlockedRecipes();
      expect(unlocked.length).toBe(1);
      expect(unlocked[0]).toBe(civ.recipes[0].name);
    });

    it('should return false for invalid recipe index', () => {
      system.generate();
      const civ = system.getCivilizations()[0];
      expect(system.unlockRecipe(civ.id, 999)).toBe(false);
    });
  });

  describe('Artifacts', () => {
    it('should have non-craftable artifacts', () => {
      system.generate();
      const artifacts = system.getAllArtifacts();
      for (const a of artifacts) {
        expect(a.craftable).toBe(false);
      }
    });

    it('should have artifacts with type (tool, weapon, ornament, text, fossil)', () => {
      system.generate();
      const validTypes = ['tool', 'weapon', 'ornament', 'text', 'fossil'];
      const artifacts = system.getAllArtifacts();
      for (const a of artifacts) {
        expect(validTypes).toContain(a.type);
      }
    });

    it('should have artifacts connected to civilization', () => {
      system.generate();
      const artifacts = system.getAllArtifacts();
      const civIds = new Set(system.getCivilizations().map(c => c.id));
      for (const a of artifacts) {
        expect(civIds).toContain(a.civId);
      }
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize', () => {
      system.generate();
      const civ = system.getCivilizations()[0];
      system.discoverStructure(civ.id, 0);

      const data = system.serialize();
      const newSystem = new AncientCivilizationSystem(12345);
      newSystem.deserialize(data);

      expect(newSystem.getCivilizations().length).toBe(system.getCivilizations().length);
      expect(newSystem.getDiscoveredCount(civ.id)).toBe(1);
    });
  });

  describe('Queries', () => {
    it('should get civilization by ID', () => {
      system.generate();
      const civ = system.getCivilizations()[0];
      expect(system.getCivilization(civ.id)).toBe(civ);
    });

    it('should return null for unknown civilization ID', () => {
      expect(system.getCivilization('nonexistent')).toBeNull();
    });

    it('should get artifact by ID', () => {
      system.generate();
      const artifact = system.getAllArtifacts()[0];
      expect(system.getArtifact(artifact.id)).toBe(artifact);
    });

    it('should return null for unknown artifact ID', () => {
      expect(system.getArtifact('nonexistent')).toBeNull();
    });
  });
});
