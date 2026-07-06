import { describe, it, expect } from 'vitest';
import { UniverseIdentity, ArchipelagoGenerator, GardenIdentity } from '../core/jardvoxel-survival-archipelago.js';

describe('UniverseIdentity', () => {
  it('generates deterministic parameters from seed', () => {
    const u1 = new UniverseIdentity(12345);
    const u2 = new UniverseIdentity(12345);
    expect(u1.islandCount).toBe(u2.islandCount);
    expect(u1.oceanCharacter).toBe(u2.oceanCharacter);
    expect(u1.worldMood).toBe(u2.worldMood);
    expect(u1.archipelagoName).toBe(u2.archipelagoName);
  });

  it('generates 8-16 islands', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const u = new UniverseIdentity(seed);
      expect(u.islandCount).toBeGreaterThanOrEqual(8);
      expect(u.islandCount).toBeLessThanOrEqual(16);
    }
  });

  it('has valid ocean character', () => {
    const valid = ['calm', 'mystical', 'tempestuous', 'frozen'];
    const u = new UniverseIdentity(42);
    expect(valid).toContain(u.oceanCharacter);
  });

  it('has valid world mood', () => {
    const valid = ['serene', 'mysterious', 'melancholic', 'vibrant'];
    const u = new UniverseIdentity(42);
    expect(valid).toContain(u.worldMood);
  });

  it('has island spacing in range 800-1200', () => {
    const u = new UniverseIdentity(42);
    expect(u.islandSpacing).toBeGreaterThanOrEqual(800);
    expect(u.islandSpacing).toBeLessThanOrEqual(1200);
  });

  it('has ocean depth in range 40-60', () => {
    const u = new UniverseIdentity(42);
    expect(u.oceanDepth).toBeGreaterThanOrEqual(40);
    expect(u.oceanDepth).toBeLessThanOrEqual(60);
  });

  it('generates a name', () => {
    const u = new UniverseIdentity(42);
    expect(u.archipelagoName).toBeTruthy();
    expect(u.archipelagoName.length).toBeGreaterThan(3);
  });
});

describe('ArchipelagoGenerator', () => {
  it('generates correct number of islands', () => {
    const universe = new UniverseIdentity(12345);
    const arch = new ArchipelagoGenerator(12345, universe);
    expect(arch.islands.length).toBe(universe.islandCount);
  });

  it('islands have valid radii (200-600)', () => {
    const universe = new UniverseIdentity(12345);
    const arch = new ArchipelagoGenerator(12345, universe);
    for (const island of arch.islands) {
      expect(island.radius).toBeGreaterThanOrEqual(200);
      expect(island.radius).toBeLessThanOrEqual(600);
    }
  });

  it('islands respect minimum spacing', () => {
    const universe = new UniverseIdentity(999);
    const arch = new ArchipelagoGenerator(999, universe);
    const minSpacing = universe.islandSpacing * 0.7; // allow some tolerance
    for (let i = 0; i < arch.islands.length; i++) {
      for (let j = i + 1; j < arch.islands.length; j++) {
        const dx = arch.islands[i].centerX - arch.islands[j].centerX;
        const dz = arch.islands[i].centerZ - arch.islands[j].centerZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        expect(dist).toBeGreaterThan(minSpacing);
      }
    }
  });

  it('getIslandAt returns island within radius', () => {
    const universe = new UniverseIdentity(12345);
    const arch = new ArchipelagoGenerator(12345, universe);
    const island = arch.islands[0];
    const result = arch.getIslandAt(island.centerX, island.centerZ);
    expect(result).not.toBeNull();
    expect(result.gardenId).toBe(island.gardenId);
  });

  it('getIslandAt returns null for ocean positions', () => {
    const universe = new UniverseIdentity(12345);
    const arch = new ArchipelagoGenerator(12345, universe);
    // Position very far from any island
    const result = arch.getIslandAt(99999, 99999);
    expect(result).toBeNull();
  });

  it('getNearestIsland returns closest island', () => {
    const universe = new UniverseIdentity(12345);
    const arch = new ArchipelagoGenerator(12345, universe);
    const { island, distance } = arch.getNearestIsland(arch.islands[0].centerX, arch.islands[0].centerZ);
    expect(island).not.toBeNull();
    expect(distance).toBeLessThan(100);
  });

  it('getOceanProperties returns valid data for ocean positions', () => {
    const universe = new UniverseIdentity(12345);
    const arch = new ArchipelagoGenerator(12345, universe);
    const props = arch.getOceanProperties(99999, 99999);
    expect(props).toHaveProperty('character');
    expect(props).toHaveProperty('depth');
    expect(props).toHaveProperty('currentDirection');
    expect(props).toHaveProperty('shoreProximity');
    expect(props.shoreProximity).toBeGreaterThanOrEqual(0);
    expect(props.shoreProximity).toBeLessThanOrEqual(1);
  });

  it('getOceanProperties returns shoreProximity 1 on island', () => {
    const universe = new UniverseIdentity(12345);
    const arch = new ArchipelagoGenerator(12345, universe);
    const island = arch.islands[0];
    const props = arch.getOceanProperties(island.centerX, island.centerZ);
    expect(props.shoreProximity).toBe(1);
  });

  it('isOcean returns true for ocean positions', () => {
    const universe = new UniverseIdentity(12345);
    const arch = new ArchipelagoGenerator(12345, universe);
    expect(arch.isOcean(99999, 99999)).toBe(true);
  });

  it('isOcean returns false for island positions', () => {
    const universe = new UniverseIdentity(12345);
    const arch = new ArchipelagoGenerator(12345, universe);
    const island = arch.islands[0];
    expect(arch.isOcean(island.centerX, island.centerZ)).toBe(false);
  });

  it('travel routes are pre-computed', () => {
    const universe = new UniverseIdentity(12345);
    const arch = new ArchipelagoGenerator(12345, universe);
    const routes = arch.getTravelRoutes(0);
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.length).toBeLessThanOrEqual(3);
    // Routes should be sorted by distance
    for (let i = 1; i < routes.length; i++) {
      expect(routes[i].distance).toBeGreaterThanOrEqual(routes[i - 1].distance);
    }
  });
});

describe('GardenIdentity', () => {
  it('has valid mood', () => {
    const valid = ['serene', 'mysterious', 'grand', 'cozy', 'ancient'];
    const g = new GardenIdentity(12345, 0, 0, 0, 300);
    expect(valid).toContain(g.mood);
  });

  it('has valid restoration state', () => {
    const valid = ['pristine', 'fading', 'dormant', 'forgotten'];
    const g = new GardenIdentity(12345, 0, 0, 0, 300);
    expect(valid).toContain(g.restorationState);
  });

  it('has biome bias with common, rare, signature', () => {
    const g = new GardenIdentity(12345, 0, 0, 0, 300);
    expect(g.biomeBias).toHaveProperty('common');
    expect(g.biomeBias).toHaveProperty('rare');
    expect(g.biomeBias).toHaveProperty('signature');
    expect(g.biomeBias.common.length).toBeGreaterThan(0);
  });

  it('has a signature landmark', () => {
    const g = new GardenIdentity(12345, 0, 0, 0, 300);
    expect(g.signatureLandmark).toBeTruthy();
  });

  it('has history events', () => {
    const g = new GardenIdentity(12345, 0, 0, 0, 300);
    expect(g.history.length).toBeGreaterThanOrEqual(2);
    expect(g.history.length).toBeLessThanOrEqual(3);
  });

  it('has endemic species', () => {
    const g = new GardenIdentity(12345, 0, 0, 0, 300);
    expect(g.endemicSpecies).toHaveProperty('tree');
    expect(g.endemicSpecies).toHaveProperty('flower');
    expect(g.endemicSpecies).toHaveProperty('fauna');
  });

  it('has a discovery quote', () => {
    const g = new GardenIdentity(12345, 0, 0, 0, 300);
    expect(g.discoveryQuote).toBeTruthy();
    expect(g.discoveryQuote.length).toBeGreaterThan(10);
  });

  it('has a name', () => {
    const g = new GardenIdentity(12345, 0, 0, 0, 300);
    expect(g.name).toBeTruthy();
    expect(g.name.length).toBeGreaterThan(3);
  });

  it('getContinentProperties returns ocean for far positions', () => {
    const g = new GardenIdentity(12345, 0, 0, 0, 300);
    const props = g.getContinentProperties(99999, 99999);
    expect(props.isOcean).toBe(true);
  });

  it('getContinentProperties returns island for center position', () => {
    const g = new GardenIdentity(12345, 0, 0, 0, 300);
    const props = g.getContinentProperties(0, 0);
    expect(props.isOcean).toBe(false);
    expect(props.garden).toBe(g);
  });

  it('is deterministic with same seed', () => {
    const g1 = new GardenIdentity(12345, 0, 0, 0, 300);
    const g2 = new GardenIdentity(12345, 0, 0, 0, 300);
    expect(g1.name).toBe(g2.name);
    expect(g1.mood).toBe(g2.mood);
    expect(g1.restorationState).toBe(g2.restorationState);
  });
});
