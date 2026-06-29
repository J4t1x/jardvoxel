import { describe, it, expect } from 'vitest';
import {
  STRUCTURE_TYPES,
  VILLAGE_VARIANTS,
  generateStructureHistory,
  getVillageVariant,
  getLootForStructure,
  hasTraps,
  hasHostileMobs,
  hasProceduralBooks,
  getStructureRarity,
  shouldGenerateStructure,
  generateNarrativeStructure,
  generateVillageName,
  getStructureDescription,
} from '../core/jardvoxel-survival-narrative-structures.js';
import { PRNG } from '../core/jardvoxel-survival-engine.js';

function makeRng(seed = 42) {
  return new PRNG(seed);
}

describe('Narrative Structures — SPEC-080', () => {
  it('should define 10 structure types', () => {
    expect(Object.keys(STRUCTURE_TYPES).length).toBe(10);
  });

  it('should include 5 new structure types', () => {
    expect(STRUCTURE_TYPES.LIBRARY).toBe('library');
    expect(STRUCTURE_TYPES.OBSERVATORY).toBe('observatory');
    expect(STRUCTURE_TYPES.CAMP).toBe('camp');
    expect(STRUCTURE_TYPES.CASTLE_RUINS).toBe('castle_ruins');
    expect(STRUCTURE_TYPES.ARCHAEOLOGICAL_SITE).toBe('archaeological_site');
  });

  it('should define 4 village variants', () => {
    expect(Object.keys(VILLAGE_VARIANTS).length).toBe(4);
    expect(VILLAGE_VARIANTS.FISHING).toBe('fishing');
    expect(VILLAGE_VARIANTS.FARMING).toBe('farming');
    expect(VILLAGE_VARIANTS.MINING).toBe('mining');
    expect(VILLAGE_VARIANTS.TRADING).toBe('trading');
  });

  it('should generate structure history with founding, decline, and notable figure', () => {
    const rng = makeRng();
    const history = generateStructureHistory(STRUCTURE_TYPES.VILLAGE, rng);
    expect(history.foundingEvent).toBeDefined();
    expect(history.declineEvent).toBeDefined();
    expect(history.notableFigure).toBeDefined();
    expect(history.type).toBe(STRUCTURE_TYPES.VILLAGE);
  });

  it('should generate temple lore with deity, ritual, and curse', () => {
    const rng = makeRng();
    const history = generateStructureHistory(STRUCTURE_TYPES.ANCIENT_TEMPLE, rng);
    expect(history.deity).toBeDefined();
    expect(history.ritual).toBeDefined();
    expect(history.curse).toBeDefined();
  });

  it('should generate library lore with sage and topic', () => {
    const rng = makeRng();
    const history = generateStructureHistory(STRUCTURE_TYPES.LIBRARY, rng);
    expect(history.sage).toBeDefined();
    expect(history.topic).toBeDefined();
  });

  it('should generate observatory lore with astronomer and discovery', () => {
    const rng = makeRng();
    const history = generateStructureHistory(STRUCTURE_TYPES.OBSERVATORY, rng);
    expect(history.astronomer).toBeDefined();
    expect(history.discovery).toBeDefined();
  });

  it('should generate camp lore with occupant type and purpose', () => {
    const rng = makeRng();
    const history = generateStructureHistory(STRUCTURE_TYPES.CAMP, rng);
    expect(history.occupantType).toBeDefined();
    expect(history.occupantPurpose).toBeDefined();
  });

  it('should generate castle ruins lore with kingdom and battle', () => {
    const rng = makeRng();
    const history = generateStructureHistory(STRUCTURE_TYPES.CASTLE_RUINS, rng);
    expect(history.kingdom).toBeDefined();
    expect(history.battle).toBeDefined();
  });

  it('should generate archaeological site lore with civilization and artifact', () => {
    const rng = makeRng();
    const history = generateStructureHistory(STRUCTURE_TYPES.ARCHAEOLOGICAL_SITE, rng);
    expect(history.civilization).toBeDefined();
    expect(history.artifact).toBeDefined();
  });

  it('should generate shipwreck lore with route and storm', () => {
    const rng = makeRng();
    const history = generateStructureHistory(STRUCTURE_TYPES.SHIPWRECK, rng);
    expect(history.route).toBeDefined();
    expect(history.storm).toBeDefined();
  });

  it('should return village variant from rng', () => {
    const rng = makeRng();
    const variant = getVillageVariant(rng);
    expect(Object.values(VILLAGE_VARIANTS)).toContain(variant);
  });

  it('should return loot for each structure type', () => {
    for (const type of Object.values(STRUCTURE_TYPES)) {
      const rng = makeRng();
      const loot = getLootForStructure(type, rng);
      expect(loot.length).toBeGreaterThan(0);
    }
  });

  it('should have traps for temples and castle ruins', () => {
    expect(hasTraps(STRUCTURE_TYPES.ANCIENT_TEMPLE)).toBe(true);
    expect(hasTraps(STRUCTURE_TYPES.CASTLE_RUINS)).toBe(true);
    expect(hasTraps(STRUCTURE_TYPES.VILLAGE)).toBe(false);
    expect(hasTraps(STRUCTURE_TYPES.LIBRARY)).toBe(false);
  });

  it('should have hostile mobs for mineshafts, temples, and castle ruins', () => {
    expect(hasHostileMobs(STRUCTURE_TYPES.MINESHAFT)).toBe(true);
    expect(hasHostileMobs(STRUCTURE_TYPES.ANCIENT_TEMPLE)).toBe(true);
    expect(hasHostileMobs(STRUCTURE_TYPES.CASTLE_RUINS)).toBe(true);
    expect(hasHostileMobs(STRUCTURE_TYPES.VILLAGE)).toBe(false);
  });

  it('should have procedural books for libraries, observatories, and archaeological sites', () => {
    expect(hasProceduralBooks(STRUCTURE_TYPES.LIBRARY)).toBe(true);
    expect(hasProceduralBooks(STRUCTURE_TYPES.OBSERVATORY)).toBe(true);
    expect(hasProceduralBooks(STRUCTURE_TYPES.ARCHAEOLOGICAL_SITE)).toBe(true);
    expect(hasProceduralBooks(STRUCTURE_TYPES.VILLAGE)).toBe(false);
  });

  it('should return rarity for each structure type', () => {
    for (const type of Object.values(STRUCTURE_TYPES)) {
      const rarity = getStructureRarity(type);
      expect(rarity).toBeGreaterThan(0);
      expect(rarity).toBeLessThan(0.1);
    }
  });

  it('should have rarer structures with lower rarity', () => {
    expect(getStructureRarity(STRUCTURE_TYPES.VILLAGE)).toBeGreaterThan(getStructureRarity(STRUCTURE_TYPES.CASTLE_RUINS));
    expect(getStructureRarity(STRUCTURE_TYPES.CASTLE_RUINS)).toBeGreaterThan(getStructureRarity(STRUCTURE_TYPES.ARCHAEOLOGICAL_SITE));
  });

  it('should generate narrative structure with all fields', () => {
    const structure = generateNarrativeStructure(STRUCTURE_TYPES.VILLAGE, 10, 20, 0);
    expect(structure.type).toBe(STRUCTURE_TYPES.VILLAGE);
    expect(structure.history).toBeDefined();
    expect(structure.loot).toBeDefined();
    expect(structure.traps).toBe(false);
    expect(structure.hostileMobs).toBe(false);
  });

  it('should generate village with variant, name, age, and npc count', () => {
    const structure = generateNarrativeStructure(STRUCTURE_TYPES.VILLAGE, 10, 20, 0);
    expect(structure.variant).toBeDefined();
    expect(structure.history.variant).toBeDefined();
    expect(structure.history.npcCount).toBeGreaterThanOrEqual(3);
    expect(structure.history.npcCount).toBeLessThanOrEqual(8);
    expect(structure.history.villageName).toBeDefined();
    expect(structure.history.villageAge).toBeGreaterThanOrEqual(50);
  });

  it('should generate camp with occupant count and hostile flag', () => {
    const structure = generateNarrativeStructure(STRUCTURE_TYPES.CAMP, 5, 10, 0);
    expect(structure.history.occupantCount).toBeGreaterThanOrEqual(1);
    expect(structure.history.occupantCount).toBeLessThanOrEqual(3);
  });

  it('should generate castle ruins with traps and hostile mobs', () => {
    const structure = generateNarrativeStructure(STRUCTURE_TYPES.CASTLE_RUINS, 5, 10, 0);
    expect(structure.traps).toBe(true);
    expect(structure.hostileMobs).toBe(true);
  });

  it('should generate temple with traps and hostile mobs', () => {
    const structure = generateNarrativeStructure(STRUCTURE_TYPES.ANCIENT_TEMPLE, 5, 10, 0);
    expect(structure.traps).toBe(true);
    expect(structure.hostileMobs).toBe(true);
  });

  it('should generate library with books', () => {
    const structure = generateNarrativeStructure(STRUCTURE_TYPES.LIBRARY, 5, 10, 0);
    expect(structure.books).toBe(true);
  });

  it('should generate village name', () => {
    const rng = makeRng();
    const name = generateVillageName(rng);
    expect(name).toBeTypeOf('string');
    expect(name.length).toBeGreaterThan(4);
  });

  it('should generate structure description', () => {
    const structure = generateNarrativeStructure(STRUCTURE_TYPES.VILLAGE, 10, 20, 0);
    const desc = getStructureDescription(structure);
    expect(desc).toBeTypeOf('string');
    expect(desc.length).toBeGreaterThan(20);
  });

  it('should generate description for all structure types', () => {
    for (const type of Object.values(STRUCTURE_TYPES)) {
      const structure = generateNarrativeStructure(type, 10, 20, 0);
      const desc = getStructureDescription(structure);
      expect(desc).toBeTypeOf('string');
      expect(desc.length).toBeGreaterThan(10);
    }
  });

  it('should be deterministic for same chunk and seed', () => {
    const s1 = generateNarrativeStructure(STRUCTURE_TYPES.VILLAGE, 10, 20, 42);
    const s2 = generateNarrativeStructure(STRUCTURE_TYPES.VILLAGE, 10, 20, 42);
    expect(s1.history.foundingEvent).toBe(s2.history.foundingEvent);
    expect(s1.history.villageName).toBe(s2.history.villageName);
  });

  it('should be different for different chunks', () => {
    const s1 = generateNarrativeStructure(STRUCTURE_TYPES.VILLAGE, 10, 20, 0);
    const s2 = generateNarrativeStructure(STRUCTURE_TYPES.VILLAGE, 11, 20, 0);
    expect(s1.history.foundingEvent).not.toBe(s2.history.foundingEvent);
  });
});
