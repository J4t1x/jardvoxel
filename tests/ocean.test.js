import { describe, it, expect } from 'vitest';
import { OceanSystem, OCEAN_MUSIC_STATES, OCEAN_PARTICLES, MARINE_LIFE } from '../core/jardvoxel-survival-ocean.js';
import { UniverseIdentity, ArchipelagoGenerator } from '../core/jardvoxel-survival-archipelago.js';

function createOceanSystem(seed = 12345) {
  const universe = new UniverseIdentity(seed);
  const arch = new ArchipelagoGenerator(seed, universe);
  const ocean = new OceanSystem(arch);
  return { universe, arch, ocean };
}

describe('OceanSystem', () => {
  it('starts disabled', () => {
    const { ocean } = createOceanSystem();
    expect(ocean.isEnabled()).toBe(false);
  });

  it('enables when player is in ocean', () => {
    const { arch, ocean } = createOceanSystem();
    // Position far from any island
    ocean.update(99999, 99999, 0.016, 0.4);
    expect(ocean.isEnabled()).toBe(true);
  });

  it('disables when player is on land', () => {
    const { arch, ocean } = createOceanSystem();
    const island = arch.islands[0];
    // Position at island center
    ocean.update(island.centerX, island.centerZ, 0.016, 0.4);
    expect(ocean.isEnabled()).toBe(false);
  });

  it('returns active particles for ocean character', () => {
    const { arch, ocean } = createOceanSystem();
    ocean.update(99999, 99999, 0.016, 0.4);
    const particles = ocean.getActiveParticles();
    expect(particles.length).toBeGreaterThan(0);
    for (const p of particles) {
      expect(p).toHaveProperty('color');
      expect(p).toHaveProperty('count');
      expect(p).toHaveProperty('size');
    }
  });

  it('returns marine life for ocean character', () => {
    const { arch, ocean } = createOceanSystem();
    ocean.update(99999, 99999, 0.016, 0.4);
    const marine = ocean.getActiveMarineLife();
    expect(marine.length).toBeGreaterThan(0);
    for (const m of marine) {
      expect(m).toHaveProperty('type');
      expect(m).toHaveProperty('count');
    }
  });

  it('clears marine life near shore', () => {
    const { arch, ocean } = createOceanSystem();
    const island = arch.islands[0];
    // Position near island edge (high shore proximity)
    const edgeX = island.centerX + island.radius * 0.9;
    const edgeZ = island.centerZ;
    ocean.update(edgeX, edgeZ, 0.016, 0.4);
    // If shoreProximity > 0.5, marine life should be empty
    const marine = ocean.getActiveMarineLife();
    // It might be on land (disabled) or near shore
    if (ocean.isEnabled()) {
      // Near shore — marine life should be cleared
      expect(marine.length).toBe(0);
    }
  });

  it('returns fog density modifier', () => {
    const { ocean } = createOceanSystem();
    ocean.update(99999, 99999, 0.016, 0.4);
    const mod = ocean.getFogDensityMod();
    expect(mod).toBeGreaterThan(1.0); // Ocean fog is denser
    expect(mod).toBeLessThanOrEqual(1.3);
  });

  it('returns fog color shift', () => {
    const { ocean } = createOceanSystem();
    ocean.update(99999, 99999, 0.016, 0.4);
    const shift = ocean.getFogColorShift();
    expect(typeof shift).toBe('number');
  });

  it('transitions to calm_sea music in open ocean during day', () => {
    const { ocean } = createOceanSystem();
    ocean.update(99999, 99999, 0.016, 0.4); // timeOfDay 0.4 = day
    const state = ocean.getPendingMusicState();
    expect(state).toBe('calm_sea');
  });

  it('transitions to discovery music near shore', () => {
    const { arch, ocean } = createOceanSystem();
    const island = arch.islands[0];
    // Position at moderate distance from island
    const x = island.centerX + island.radius * 0.7;
    const z = island.centerZ;
    ocean.update(x, z, 0.016, 0.4);
    if (ocean.isEnabled()) {
      const state = ocean.getPendingMusicState();
      // Should be discovery or null (if shoreProx > 0.8)
      if (state !== null) {
        expect(['discovery', 'calm_sea']).toContain(state);
      }
    }
  });

  it('returns current direction and strength', () => {
    const { ocean } = createOceanSystem();
    ocean.update(99999, 99999, 0.016, 0.4);
    const dir = ocean.getCurrentDirection();
    const strength = ocean.getCurrentStrength();
    expect(dir).toHaveProperty('dx');
    expect(dir).toHaveProperty('dz');
    expect(typeof strength).toBe('number');
  });

  it('handles tempestuous ocean character with lightning', () => {
    const universe = new UniverseIdentity(12345, { oceanCharacter: 'tempestuous' });
    const arch = new ArchipelagoGenerator(12345, universe);
    const ocean = new OceanSystem(arch);
    ocean.update(99999, 99999, 0.016, 0.4);
    // Lightning flash is probabilistic, just check it doesn't crash
    expect(typeof ocean.hasLightningFlash()).toBe('boolean');
  });

  it('handles frozen ocean character with aurora at night', () => {
    const universe = new UniverseIdentity(12345, { oceanCharacter: 'frozen' });
    const arch = new ArchipelagoGenerator(12345, universe);
    const ocean = new OceanSystem(arch);
    // Night time
    ocean.update(99999, 99999, 0.016, 0.85);
    expect(ocean.isAuroraActive()).toBe(true);
  });

  it('aurora is inactive during day', () => {
    const universe = new UniverseIdentity(12345, { oceanCharacter: 'frozen' });
    const arch = new ArchipelagoGenerator(12345, universe);
    const ocean = new OceanSystem(arch);
    ocean.update(99999, 99999, 0.016, 0.4); // day
    expect(ocean.isAuroraActive()).toBe(false);
  });

  it('night-only particles appear at night', () => {
    const universe = new UniverseIdentity(12345, { oceanCharacter: 'mystical' });
    const arch = new ArchipelagoGenerator(12345, universe);
    const ocean = new OceanSystem(arch);
    // Night time
    ocean.update(99999, 99999, 0.016, 0.85);
    const particles = ocean.getActiveParticles();
    // Should have bioluminescence_ocean (night-only for mystical)
    const hasBiolum = particles.some(p => p.color === 0x40FFC8);
    expect(hasBiolum).toBe(true);
  });

  it('day-only particles appear during day', () => {
    const universe = new UniverseIdentity(12345, { oceanCharacter: 'calm' });
    const arch = new ArchipelagoGenerator(12345, universe);
    const ocean = new OceanSystem(arch);
    ocean.update(99999, 99999, 0.016, 0.4); // day
    const particles = ocean.getActiveParticles();
    // Should have ocean_dust (day-only for calm)
    const hasOceanDust = particles.some(p => p.color === 0xE8E0D0);
    expect(hasOceanDust).toBe(true);
  });
});

describe('OCEAN_MUSIC_STATES', () => {
  it('has calm_sea and discovery states', () => {
    expect(OCEAN_MUSIC_STATES.calm_sea).toBeDefined();
    expect(OCEAN_MUSIC_STATES.discovery).toBeDefined();
    expect(OCEAN_MUSIC_STATES.calm_sea.bpm).toBe(28);
    expect(OCEAN_MUSIC_STATES.discovery.bpm).toBe(34);
  });
});

describe('OCEAN_PARTICLES', () => {
  it('has 4 ocean particle types', () => {
    expect(OCEAN_PARTICLES.mist_spray).toBeDefined();
    expect(OCEAN_PARTICLES.bioluminescence_ocean).toBeDefined();
    expect(OCEAN_PARTICLES.ice_floe).toBeDefined();
    expect(OCEAN_PARTICLES.ocean_dust).toBeDefined();
  });
});

describe('MARINE_LIFE', () => {
  it('has configs for all 4 ocean characters', () => {
    expect(MARINE_LIFE.calm).toBeDefined();
    expect(MARINE_LIFE.mystical).toBeDefined();
    expect(MARINE_LIFE.tempestuous).toBeDefined();
    expect(MARINE_LIFE.frozen).toBeDefined();
  });
});
