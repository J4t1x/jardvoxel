// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Fishing System — SPEC-054
// Fishing rod, bobber, catches, cooking
// ═══════════════════════════════════════════════════════════

// MC_BLOCKS values inlined to avoid circular dependency with mesher.js

// New block IDs for fishing items
export const FISHING_BLOCKS = {
  FISHING_ROD: 105,
  RAW_FISH: 106,
  COOKED_FISH: 107,
  PUFFERFISH: 108,
  INK_SAC: 109,
};

export const FISHING_BLOCK_COLORS = {
  105: [0.45, 0.35, 0.20],
  106: [0.70, 0.60, 0.40],
  107: [0.85, 0.75, 0.50],
  108: [0.80, 0.70, 0.10],
  109: [0.10, 0.10, 0.10],
};

export const FISHING_BLOCK_NAMES = {
  105: 'Fishing Rod',
  106: 'Raw Fish',
  107: 'Cooked Fish',
  108: 'Pufferfish',
  109: 'Ink Sac',
};

export const FISHING_BLOCK_HARDNESS = {
  105: 0.1,
  106: 0.1,
  107: 0.1,
  108: 0.1,
  109: 0.1,
};

export const FISHING_PLACEABLE_BLOCKS = [];

// Fishing catch table — weighted
export const FISHING_CATCHES = [
  { block: 106, weight: 60, name: 'Raw Fish' },
  { block: 108, weight: 15, name: 'Pufferfish' },
  { block: 68, weight: 10, name: 'Bones' },
  { block: 109, weight: 8, name: 'Ink Sac' },
  { block: 71, weight: 5, name: 'String' },
  { block: 54, weight: 2, name: 'Leather' },
];

// Fishing rod crafting recipe
export const FISHING_RECIPES = [
  // Fishing Rod: 3 sticks diagonal + 2 string
  { type: 'shaped', pattern: [
    [null, null, 'stick'],
    [null, 'stick', 'string'],
    ['stick', null, null],
  ], output: { block: 105, count: 1 } },
];

// Cooking recipes for fish (added to furnace)
export const FISH_COOKING = {
  106: 107, // raw fish → cooked fish
};

// Fishing state machine
export const FISHING_STATE = {
  IDLE: 0,
  CASTING: 1,
  WAITING: 2,
  BITING: 3,
  REELING: 4,
};

export class FishingManager {
  constructor(scene) {
    this.scene = scene;
    this.state = FISHING_STATE.IDLE;
    this.bobberMesh = null;
    this.bobberPos = null;
    this.castTime = 0;
    this.waitTime = 0;
    this.biteTime = 0;
    this.reelTime = 0;
    this.targetWaterY = 0;
  }

  // Cast the rod — returns true if cast into water
  cast(playerPos, world, camera) {
    if (this.state !== FISHING_STATE.IDLE) return false;

    // Raycast forward to find water
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const origin = camera.getWorldPosition(new THREE.Vector3());

    // Simple raycast — step forward until we hit water or max distance
    let hitX, hitY, hitZ;
    for (let i = 0; i < 30; i++) {
      const x = Math.floor(origin.x + dir.x * i);
      const y = Math.floor(origin.y + dir.y * i);
      const z = Math.floor(origin.z + dir.z * i);
      const block = world.getBlock(x, y, z);
      if (block === 5) { // water
        hitX = x + 0.5;
        hitY = y + 0.9;
        hitZ = z + 0.5;
        break;
      }
      if (block !== 0 && block !== 5) break; // hit solid block
    }

    if (hitX === undefined) return false;

    this.state = FISHING_STATE.CASTING;
    this.castTime = 0;
    this.bobberPos = { x: hitX, y: hitY, z: hitZ };
    this.targetWaterY = hitY;

    // Create bobber mesh
    const geo = new THREE.SphereGeometry(0.1, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.bobberMesh = new THREE.Mesh(geo, mat);
    this.bobberMesh.position.set(playerPos.x, playerPos.y + 1.5, playerPos.z);
    this.scene.add(this.bobberMesh);

    return true;
  }

  update(dt, playerPos, world) {
    if (!this.bobberMesh) return;

    switch (this.state) {
      case FISHING_STATE.CASTING:
        this.castTime += dt;
        // Animate bobber flying to target
        const t = Math.min(this.castTime / 0.5, 1);
        const startX = playerPos.x;
        const startY = playerPos.y + 1.5;
        const startZ = playerPos.z;
        this.bobberMesh.position.x = startX + (this.bobberPos.x - startX) * t;
        this.bobberMesh.position.y = startY + (this.bobberPos.y - startY) * t - Math.sin(t * Math.PI) * 2;
        this.bobberMesh.position.z = startZ + (this.bobberPos.z - startZ) * t;
        if (t >= 1) {
          this.state = FISHING_STATE.WAITING;
          this.waitTime = 0;
          // Random wait time 3-15 seconds
          this.biteThreshold = 3 + Math.random() * 12;
        }
        break;

      case FISHING_STATE.WAITING:
        this.waitTime += dt;
        // Bobber bobs slightly
        this.bobberMesh.position.y = this.targetWaterY + Math.sin(this.waitTime * 3) * 0.05;
        if (this.waitTime >= this.biteThreshold) {
          this.state = FISHING_STATE.BITING;
          this.biteTime = 0;
        }
        break;

      case FISHING_STATE.BITING:
        this.biteTime += dt;
        // Bobber dips down
        this.bobberMesh.position.y = this.targetWaterY - 0.2 + Math.sin(this.biteTime * 15) * 0.1;
        // Player has 1.5 seconds to reel
        if (this.biteTime > 1.5) {
          // Missed the bite
          this._reel(playerPos);
        }
        break;

      case FISHING_STATE.REELING:
        this.reelTime += dt;
        const rt = Math.min(this.reelTime / 0.3, 1);
        this.bobberMesh.position.x = this.bobberPos.x + (playerPos.x - this.bobberPos.x) * rt;
        this.bobberMesh.position.y = this.bobberPos.y + (playerPos.y + 1.5 - this.bobberPos.y) * rt;
        this.bobberMesh.position.z = this.bobberPos.z + (playerPos.z - this.bobberPos.z) * rt;
        if (rt >= 1) {
          this._cleanup();
        }
        break;
    }
  }

  // Reel in — returns catch if biting, null otherwise
  reel() {
    if (this.state === FISHING_STATE.BITING) {
      const catch_item = this._rollCatch();
      this.state = FISHING_STATE.REELING;
      this.reelTime = 0;
      return catch_item;
    }
    if (this.state === FISHING_STATE.WAITING || this.state === FISHING_STATE.CASTING) {
      this.state = FISHING_STATE.REELING;
      this.reelTime = 0;
      return null;
    }
    return null;
  }

  _reel(playerPos) {
    this.state = FISHING_STATE.REELING;
    this.reelTime = 0;
  }

  _rollCatch() {
    const totalWeight = FISHING_CATCHES.reduce((sum, c) => sum + c.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const catch_item of FISHING_CATCHES) {
      roll -= catch_item.weight;
      if (roll <= 0) return catch_item;
    }
    return FISHING_CATCHES[0];
  }

  _cleanup() {
    if (this.bobberMesh) {
      this.scene.remove(this.bobberMesh);
      this.bobberMesh.geometry.dispose();
      this.bobberMesh.material.dispose();
      this.bobberMesh = null;
    }
    this.state = FISHING_STATE.IDLE;
    this.bobberPos = null;
  }

  isFishing() {
    return this.state !== FISHING_STATE.IDLE;
  }

  isBiting() {
    return this.state === FISHING_STATE.BITING;
  }

  serialize() {
    return {
      state: this.state,
      bobberPos: this.bobberPos ? { x: this.bobberPos.x, y: this.bobberPos.y, z: this.bobberPos.z } : null,
      targetWaterY: this.targetWaterY,
    };
  }

  deserialize(data) {
    if (!data) return;
    // Reset to idle on load — can't restore mid-fishing session reliably
    this._cleanup();
    this.state = FISHING_STATE.IDLE;
    this.bobberPos = null;
  }
}
