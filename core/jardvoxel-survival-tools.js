// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Tools & Armor — SPEC-051
// Tools (pickaxe, axe, shovel, sword) + Armor (helmet, chest, legs, boots)
// ═══════════════════════════════════════════════════════════

// Tool/Armor block IDs (80-99)
export const TOOL_BLOCKS = {
  WOOD_PICKAXE: 80, STONE_PICKAXE: 81, IRON_PICKAXE: 82, DIAMOND_PICKAXE: 83,
  WOOD_AXE: 84, STONE_AXE: 85, IRON_AXE: 86, DIAMOND_AXE: 87,
  WOOD_SHOVEL: 88, STONE_SHOVEL: 89, IRON_SHOVEL: 90, DIAMOND_SHOVEL: 91,
  WOOD_SWORD: 92, STONE_SWORD: 93, IRON_SWORD: 94, DIAMOND_SWORD: 95,
  IRON_HELMET: 96, IRON_CHESTPLATE: 97, IRON_LEGGINGS: 98, IRON_BOOTS: 99,
};

export const TOOL_BLOCK_COLORS = {
  80: [0.65, 0.45, 0.25], 81: [0.50, 0.50, 0.52], 82: [0.80, 0.80, 0.85], 83: [0.30, 0.85, 0.85],
  84: [0.65, 0.45, 0.25], 85: [0.50, 0.50, 0.52], 86: [0.80, 0.80, 0.85], 87: [0.30, 0.85, 0.85],
  88: [0.65, 0.45, 0.25], 89: [0.50, 0.50, 0.52], 90: [0.80, 0.80, 0.85], 91: [0.30, 0.85, 0.85],
  92: [0.65, 0.45, 0.25], 93: [0.50, 0.50, 0.52], 94: [0.80, 0.80, 0.85], 95: [0.30, 0.85, 0.85],
  96: [0.75, 0.75, 0.80], 97: [0.75, 0.75, 0.80], 98: [0.75, 0.75, 0.80], 99: [0.75, 0.75, 0.80],
};

export const TOOL_BLOCK_NAMES = {
  80: 'Wood Pickaxe', 81: 'Stone Pickaxe', 82: 'Iron Pickaxe', 83: 'Diamond Pickaxe',
  84: 'Wood Axe', 85: 'Stone Axe', 86: 'Iron Axe', 87: 'Diamond Axe',
  88: 'Wood Shovel', 89: 'Stone Shovel', 90: 'Iron Shovel', 91: 'Diamond Shovel',
  92: 'Wood Sword', 93: 'Stone Sword', 94: 'Iron Sword', 95: 'Diamond Sword',
  96: 'Iron Helmet', 97: 'Iron Chestplate', 98: 'Iron Leggings', 99: 'Iron Boots',
};

export const TOOL_BLOCK_HARDNESS = {
  80: 0.2, 81: 0.2, 82: 0.2, 83: 0.2,
  84: 0.2, 85: 0.2, 86: 0.2, 87: 0.2,
  88: 0.2, 89: 0.2, 90: 0.2, 91: 0.2,
  92: 0.2, 93: 0.2, 94: 0.2, 95: 0.2,
  96: 0.3, 97: 0.3, 98: 0.3, 99: 0.3,
};

// Tool types and material tiers
export const TOOL_TYPES = {
  PICKAXE: 'pickaxe',
  AXE: 'axe',
  SHOVEL: 'shovel',
  SWORD: 'sword',
};

export const TOOL_MATERIALS = {
  WOOD: { name: 'wood', durability: 60, speedMult: 2, damageBonus: 1 },
  STONE: { name: 'stone', durability: 130, speedMult: 4, damageBonus: 3 },
  IRON: { name: 'iron', durability: 250, speedMult: 6, damageBonus: 5 },
  DIAMOND: { name: 'diamond', durability: 1560, speedMult: 10, damageBonus: 8 },
};

// Map block ID → { type, material }
export const TOOL_MAP = {
  80: { type: 'pickaxe', material: 'WOOD' }, 81: { type: 'pickaxe', material: 'STONE' },
  82: { type: 'pickaxe', material: 'IRON' }, 83: { type: 'pickaxe', material: 'DIAMOND' },
  84: { type: 'axe', material: 'WOOD' }, 85: { type: 'axe', material: 'STONE' },
  86: { type: 'axe', material: 'IRON' }, 87: { type: 'axe', material: 'DIAMOND' },
  88: { type: 'shovel', material: 'WOOD' }, 89: { type: 'shovel', material: 'STONE' },
  90: { type: 'shovel', material: 'IRON' }, 91: { type: 'shovel', material: 'DIAMOND' },
  92: { type: 'sword', material: 'WOOD' }, 93: { type: 'sword', material: 'STONE' },
  94: { type: 'sword', material: 'IRON' }, 95: { type: 'sword', material: 'DIAMOND' },
};

// Armor slots
export const ARMOR_SLOTS = {
  HELMET: 'helmet',
  CHESTPLATE: 'chestplate',
  LEGGINGS: 'leggings',
  BOOTS: 'boots',
};

export const ARMOR_MAP = {
  96: { slot: 'helmet', durability: 165, reduction: 0.08 },
  97: { slot: 'chestplate', durability: 240, reduction: 0.12 },
  98: { slot: 'leggings', durability: 225, reduction: 0.10 },
  99: { slot: 'boots', durability: 195, reduction: 0.04 },
};

// Block categories for tool matching
const PICKAXE_BLOCKS = new Set([1, 17, 18, 19, 20, 21, 33, 37, 38, 45, 46, 47]);
const AXE_BLOCKS = new Set([9, 10, 11, 12, 13, 14, 15, 16, 22, 48, 55]);
const SHOVEL_BLOCKS = new Set([3, 4, 8, 35, 36, 42]);

export function getToolTypeForBlock(blockId) {
  if (PICKAXE_BLOCKS.has(blockId)) return 'pickaxe';
  if (AXE_BLOCKS.has(blockId)) return 'axe';
  if (SHOVEL_BLOCKS.has(blockId)) return 'shovel';
  return null;
}

export function isToolBlock(blockId) {
  return TOOL_MAP[blockId] !== undefined;
}

export function isArmorBlock(blockId) {
  return ARMOR_MAP[blockId] !== undefined;
}

// Tool/Armor item with durability tracking
export class ToolItem {
  constructor(blockId) {
    this.blockId = blockId;
    const info = TOOL_MAP[blockId];
    if (info) {
      this.type = info.type;
      this.material = info.material;
      this.maxDurability = TOOL_MATERIALS[info.material].durability;
      this.durability = this.maxDurability;
    } else {
      const armor = ARMOR_MAP[blockId];
      if (armor) {
        this.type = 'armor';
        this.slot = armor.slot;
        this.maxDurability = armor.durability;
        this.durability = this.maxDurability;
        this.reduction = armor.reduction;
      }
    }
  }

  use() {
    this.durability = Math.max(0, this.durability - 1);
    return this.durability <= 0;
  }

  isBroken() {
    return this.durability <= 0;
  }

  getDurabilityPercent() {
    return this.durability / this.maxDurability;
  }

  getMiningSpeedMultiplier(blockId) {
    if (!this.type || this.type === 'armor') return 1;
    const blockToolType = getToolTypeForBlock(blockId);
    if (blockToolType !== this.type) return 1;
    return TOOL_MATERIALS[this.material].speedMult;
  }

  getDamageBonus() {
    if (this.type === 'sword') {
      return TOOL_MATERIALS[this.material].damageBonus;
    }
    return 0;
  }
}

// Equipment manager — tracks equipped tool and armor
export class EquipmentManager {
  constructor() {
    this.tool = null; // ToolItem or null
    this.armor = { helmet: null, chestplate: null, leggings: null, boots: null };
  }

  equipTool(toolItem) {
    this.tool = toolItem;
  }

  unequipTool() {
    const t = this.tool;
    this.tool = null;
    return t;
  }

  equipArmor(toolItem) {
    if (toolItem.slot && this.armor[toolItem.slot] !== undefined) {
      const old = this.armor[toolItem.slot];
      this.armor[toolItem.slot] = toolItem;
      return old;
    }
    return null;
  }

  unequipArmor(slot) {
    const old = this.armor[slot];
    this.armor[slot] = null;
    return old;
  }

  getDamageReduction() {
    let total = 0;
    for (const slot of Object.values(ARMOR_SLOTS)) {
      if (this.armor[slot] && !this.armor[slot].isBroken()) {
        total += this.armor[slot].reduction;
      }
    }
    return Math.min(0.80, total);
  }

  getMiningSpeedForBlock(blockId) {
    if (this.tool && !this.tool.isBroken()) {
      return this.tool.getMiningSpeedMultiplier(blockId);
    }
    return 1;
  }

  getAttackDamage() {
    if (this.tool && !this.tool.isBroken()) {
      return this.tool.getDamageBonus();
    }
    return 0;
  }

  onBlockMined(blockId) {
    if (this.tool && !this.tool.isBroken()) {
      if (this.tool.use()) {
        return { broken: true, slot: 'tool' };
      }
    }
    return null;
  }

  onPlayerHit() {
    const broken = [];
    for (const slot of Object.values(ARMOR_SLOTS)) {
      if (this.armor[slot] && !this.armor[slot].isBroken()) {
        if (this.armor[slot].use()) {
          broken.push({ broken: true, slot });
          this.armor[slot] = null;
        }
      }
    }
    return broken;
  }

  serialize() {
    return {
      tool: this.tool ? { blockId: this.tool.blockId, durability: this.tool.durability } : null,
      armor: {
        helmet: this.armor.helmet ? { blockId: this.armor.helmet.blockId, durability: this.armor.helmet.durability } : null,
        chestplate: this.armor.chestplate ? { blockId: this.armor.chestplate.blockId, durability: this.armor.chestplate.durability } : null,
        leggings: this.armor.leggings ? { blockId: this.armor.leggings.blockId, durability: this.armor.leggings.durability } : null,
        boots: this.armor.boots ? { blockId: this.armor.boots.blockId, durability: this.armor.boots.durability } : null,
      },
    };
  }

  deserialize(data) {
    if (data.tool) {
      const item = new ToolItem(data.tool.blockId);
      item.durability = data.tool.durability;
      this.tool = item;
    }
    for (const slot of Object.values(ARMOR_SLOTS)) {
      if (data.armor && data.armor[slot]) {
        const item = new ToolItem(data.armor[slot].blockId);
        item.durability = data.armor[slot].durability;
        this.armor[slot] = item;
      }
    }
  }
}

// Crafting recipes for tools and armor
export const TOOL_RECIPES = [
  // Pickaxes: 3 material on top + 2 sticks in middle column
  { type: 'shaped', pattern: [['wood', 'wood', 'wood'], [null, 'stick', null], [null, 'stick', null]], output: { block: 80, count: 1 }, tags: { 'wood': [22] } },
  { type: 'shaped', pattern: [['cobblestone', 'cobblestone', 'cobblestone'], [null, 'stick', null], [null, 'stick', null]], output: { block: 81, count: 1 } },
  { type: 'shaped', pattern: [['iron_ingot', 'iron_ingot', 'iron_ingot'], [null, 'stick', null], [null, 'stick', null]], output: { block: 82, count: 1 } },
  { type: 'shaped', pattern: [['diamond', 'diamond', 'diamond'], [null, 'stick', null], [null, 'stick', null]], output: { block: 83, count: 1 }, tags: { 'diamond': [20] } },

  // Axes: 3 material L-shape + 1 stick
  { type: 'shaped', pattern: [['wood', 'wood', null], ['wood', 'stick', null], [null, 'stick', null]], output: { block: 84, count: 1 }, tags: { 'wood': [22] } },
  { type: 'shaped', pattern: [['cobblestone', 'cobblestone', null], ['cobblestone', 'stick', null], [null, 'stick', null]], output: { block: 85, count: 1 } },
  { type: 'shaped', pattern: [['iron_ingot', 'iron_ingot', null], ['iron_ingot', 'stick', null], [null, 'stick', null]], output: { block: 86, count: 1 } },
  { type: 'shaped', pattern: [['diamond', 'diamond', null], ['diamond', 'stick', null], [null, 'stick', null]], output: { block: 87, count: 1 }, tags: { 'diamond': [20] } },

  // Shovels: 1 material on top + 2 sticks below
  { type: 'shaped', pattern: [[null, 'wood', null], [null, 'stick', null], [null, 'stick', null]], output: { block: 88, count: 1 }, tags: { 'wood': [22] } },
  { type: 'shaped', pattern: [[null, 'cobblestone', null], [null, 'stick', null], [null, 'stick', null]], output: { block: 89, count: 1 } },
  { type: 'shaped', pattern: [[null, 'iron_ingot', null], [null, 'stick', null], [null, 'stick', null]], output: { block: 90, count: 1 } },
  { type: 'shaped', pattern: [[null, 'diamond', null], [null, 'stick', null], [null, 'stick', null]], output: { block: 91, count: 1 }, tags: { 'diamond': [20] } },

  // Swords: 2 material vertical + 1 stick at bottom
  { type: 'shaped', pattern: [[null, 'wood', null], [null, 'wood', null], [null, 'stick', null]], output: { block: 92, count: 1 }, tags: { 'wood': [22] } },
  { type: 'shaped', pattern: [[null, 'cobblestone', null], [null, 'cobblestone', null], [null, 'stick', null]], output: { block: 93, count: 1 } },
  { type: 'shaped', pattern: [[null, 'iron_ingot', null], [null, 'iron_ingot', null], [null, 'stick', null]], output: { block: 94, count: 1 } },
  { type: 'shaped', pattern: [[null, 'diamond', null], [null, 'diamond', null], [null, 'stick', null]], output: { block: 95, count: 1 }, tags: { 'diamond': [20] } },

  // Iron Armor
  // Helmet: U-shape (3 iron + 2 sides)
  { type: 'shaped', pattern: [['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', null, 'iron_ingot']], output: { block: 96, count: 1 } },
  // Chestplate: torso shape
  { type: 'shaped', pattern: [['iron_ingot', null, 'iron_ingot'], ['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', 'iron_ingot', 'iron_ingot']], output: { block: 97, count: 1 } },
  // Leggings: inverted U
  { type: 'shaped', pattern: [['iron_ingot', 'iron_ingot', 'iron_ingot'], ['iron_ingot', null, 'iron_ingot'], ['iron_ingot', null, 'iron_ingot']], output: { block: 98, count: 1 } },
  // Boots: feet shape
  { type: 'shaped', pattern: [[null, null, null], ['iron_ingot', null, 'iron_ingot'], ['iron_ingot', null, 'iron_ingot']], output: { block: 99, count: 1 } },
];

// Tool/armor placeable blocks (for inventory listing)
export const TOOL_PLACEABLE_BLOCKS = [
  80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95,
  96, 97, 98, 99,
];
