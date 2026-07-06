// ═══════════════════════════════════════════════════════════
// JardVoxel 9.0 — Garden Restoration System
// SPEC-113: Restoration points, discovery, visual effects, persistence
// ═══════════════════════════════════════════════════════════

import { GardenIdentity } from './jardvoxel-survival-archipelago.js';

// Restoration point types
const RESTORATION_POINT_TYPES = {
  ANCIENT_TREE: {
    name: 'Ancient Tree',
    description: 'A slumbering tree that awakens with restored energy',
    visualEffect: 'bloom_burst',
    audioCue: 'crystal_chime',
    radius: 80,
  },
  STONE_SHRINE: {
    name: 'Stone Shrine',
    description: 'Weathered stones that remember ancient prayers',
    visualEffect: 'light_beam',
    audioCue: 'deep_bell',
    radius: 60,
  },
  SPRING: {
    name: 'Hidden Spring',
    description: 'A dried spring waiting to flow again',
    visualEffect: 'water_burst',
    audioCue: 'water_flow',
    radius: 50,
  },
  FLOWER_CIRCLE: {
    name: 'Flower Circle',
    description: 'A ring of dormant flowers beneath the soil',
    visualEffect: 'petal_bloom',
    audioCue: 'wind_chime',
    radius: 40,
  },
};

const RESTORATION_VISUAL_EFFECTS = {
  bloom_burst: {
    particleType: 'petals',
    duration: 5.0,
    colorShift: 0.15,
    saturationBoost: 0.3,
  },
  light_beam: {
    particleType: 'dust',
    duration: 4.0,
    colorShift: 0.1,
    saturationBoost: 0.2,
    lightIntensity: 1.5,
  },
  water_burst: {
    particleType: 'mist',
    duration: 3.0,
    colorShift: 0.05,
    saturationBoost: 0.15,
  },
  petal_bloom: {
    particleType: 'petals',
    duration: 6.0,
    colorShift: 0.2,
    saturationBoost: 0.4,
  },
};

export class RestorationSystem {
  constructor(archipelago) {
    this.archipelago = archipelago;
    this._restorationPoints = new Map(); // gardenId → array of points
    this._activatedPoints = new Set(); // "gardenId:pointIdx" → true
    this._discoveredGardens = new Set(); // gardenId → true
    this._gardenProgress = new Map(); // gardenId → 0.0-1.0
    this._activeEffects = []; // currently playing visual effects
    this._initRestorationPoints();
  }

  _initRestorationPoints() {
    for (const island of this.archipelago.islands) {
      const points = [];
      const pointCount = 3 + Math.floor(Math.random() * 3); // 3-5 points per garden

      const types = Object.keys(RESTORATION_POINT_TYPES);
      for (let i = 0; i < pointCount; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const angle = (i / pointCount) * Math.PI * 2 + Math.random() * 0.5;
        const dist = island.radius * (0.2 + Math.random() * 0.5);
        points.push({
          id: `${island.gardenId}_rp_${i}`,
          gardenId: island.gardenId,
          type,
          x: island.centerX + Math.cos(angle) * dist,
          z: island.centerZ + Math.sin(angle) * dist,
          activated: false,
          index: i,
        });
      }
      this._restorationPoints.set(island.gardenId, points);
      this._gardenProgress.set(island.gardenId, 0.0);
    }
  }

  // Check if player is near a restoration point
  checkProximity(playerX, playerZ, activationRadius = 5) {
    const island = this.archipelago.getIslandAt(playerX, playerZ);
    if (!island) return null;

    const points = this._restorationPoints.get(island.gardenId) || [];
    for (const point of points) {
      if (point.activated) continue;
      const dx = playerX - point.x;
      const dz = playerZ - point.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < activationRadius) {
        return { point, island, distance: dist };
      }
    }
    return null;
  }

  // Activate a restoration point
  activatePoint(point, island) {
    const key = `${point.gardenId}:${point.index}`;
    if (this._activatedPoints.has(key)) return false;

    point.activated = true;
    this._activatedPoints.add(key);

    // Update garden progress
    const points = this._restorationPoints.get(island.gardenId) || [];
    const totalPoints = points.length;
    const activatedCount = points.filter(p => p.activated).length;
    const progress = activatedCount / totalPoints;
    this._gardenProgress.set(island.gardenId, progress);

    // Update garden restoration state
    if (progress >= 1.0) {
      island.restorationState = 'pristine';
    } else if (progress >= 0.66) {
      island.restorationState = 'fading';
    } else if (progress >= 0.33) {
      island.restorationState = 'dormant';
    }

    // Trigger visual effect
    const effectConfig = RESTORATION_VISUAL_EFFECTS[RESTORATION_POINT_TYPES[point.type].visualEffect];
    if (effectConfig) {
      this._activeEffects.push({
        type: RESTORATION_POINT_TYPES[point.type].visualEffect,
        x: point.x,
        z: point.z,
        startTime: performance.now(),
        duration: effectConfig.duration * 1000,
        config: effectConfig,
      });
    }

    return {
      pointType: point.type,
      pointName: RESTORATION_POINT_TYPES[point.type].name,
      description: RESTORATION_POINT_TYPES[point.type].description,
      gardenName: island.name,
      gardenProgress: progress,
      visualEffect: RESTORATION_POINT_TYPES[point.type].visualEffect,
      audioCue: RESTORATION_POINT_TYPES[point.type].audioCue,
    };
  }

  // Discover a garden (first visit)
  discoverGarden(island) {
    if (this._discoveredGardens.has(island.gardenId)) return null;

    this._discoveredGardens.add(island.gardenId);

    return {
      gardenName: island.name,
      mood: island.mood,
      climateType: island.climateType,
      discoveryQuote: island.discoveryQuote,
      signatureLandmark: island.signatureLandmark,
      endemicSpecies: island.endemicSpecies,
    };
  }

  // Check if a garden has been discovered
  isDiscovered(gardenId) {
    return this._discoveredGardens.has(gardenId);
  }

  // Get restoration progress for a garden
  getGardenProgress(gardenId) {
    return this._gardenProgress.get(gardenId) || 0.0;
  }

  // Get overall restoration progress across all gardens
  getOverallProgress() {
    if (this._gardenProgress.size === 0) return 0.0;
    let total = 0;
    for (const progress of this._gardenProgress.values()) {
      total += progress;
    }
    return total / this._gardenProgress.size;
  }

  // Get restoration points for a garden
  getRestorationPoints(gardenId) {
    return this._restorationPoints.get(gardenId) || [];
  }

  // Get all discovered gardens
  getDiscoveredGardens() {
    return Array.from(this._discoveredGardens);
  }

  // Update active visual effects (call every frame)
  updateEffects(dt) {
    const now = performance.now();
    this._activeEffects = this._activeEffects.filter(effect => {
      return now - effect.startTime < effect.duration;
    });
    return this._activeEffects;
  }

  // Get active effects for rendering
  getActiveEffects() {
    return this._activeEffects;
  }

  // Serialize for save
  serialize() {
    const restorationData = {};
    for (const [gardenId, points] of this._restorationPoints) {
      restorationData[gardenId] = points.map(p => ({
        id: p.id,
        type: p.type,
        x: p.x,
        z: p.z,
        activated: p.activated,
        index: p.index,
      }));
    }

    const progressData = {};
    for (const [gardenId, progress] of this._gardenProgress) {
      progressData[gardenId] = progress;
    }

    return {
      restorationPoints: restorationData,
      activatedPoints: Array.from(this._activatedPoints),
      discoveredGardens: Array.from(this._discoveredGardens),
      gardenProgress: progressData,
    };
  }

  // Deserialize from save
  deserialize(data) {
    if (!data) return;

    // Restore restoration points
    if (data.restorationPoints) {
      for (const [gardenId, points] of Object.entries(data.restorationPoints)) {
        this._restorationPoints.set(gardenId, points);
      }
    }

    // Restore activated points
    if (data.activatedPoints) {
      this._activatedPoints = new Set(data.activatedPoints);
    }

    // Restore discovered gardens
    if (data.discoveredGardens) {
      this._discoveredGardens = new Set(data.discoveredGardens);
    }

    // Restore garden progress
    if (data.gardenProgress) {
      for (const [gardenId, progress] of Object.entries(data.gardenProgress)) {
        this._gardenProgress.set(gardenId, progress);
      }
    }
  }

  // Get minimap markers for discovered gardens
  getMinimapMarkers() {
    const markers = [];
    for (const gardenId of this._discoveredGardens) {
      const island = this.archipelago.islands.find(i => i.gardenId === gardenId);
      if (island) {
        markers.push({
          x: island.centerX,
          z: island.centerZ,
          label: island.name,
          type: 'garden',
          progress: this.getGardenProgress(gardenId),
        });
      }
    }
    return markers;
  }
}

export { RESTORATION_POINT_TYPES, RESTORATION_VISUAL_EFFECTS };
