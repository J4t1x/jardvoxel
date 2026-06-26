// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Experience & Enchanting — SPEC-052
// XP orbs, levels, enchanting table, enchantments
// ═══════════════════════════════════════════════════════════

import { MC_BLOCKS } from './jardvoxel-survival-mesher.js';
import { ToolItem, TOOL_MAP, ARMOR_MAP } from './jardvoxel-survival-tools.js';

// New block IDs for enchanting
export const ENCHANT_BLOCKS = {
  ENCHANTING_TABLE: 100,
  LAPIS_BLOCK: 101,
  BOOK: 102,
};

export const ENCHANT_BLOCK_COLORS = {
  100: [0.30, 0.10, 0.50],
  101: [0.15, 0.30, 0.80],
  102: [0.85, 0.75, 0.50],
};

export const ENCHANT_BLOCK_NAMES = {
  100: 'Enchanting Table',
  101: 'Lapis Block',
  102: 'Book',
};

export const ENCHANT_BLOCK_HARDNESS = {
  100: 2.0,
  101: 1.0,
  102: 0.2,
};

export const ENCHANT_PLACEABLE_BLOCKS = [100, 101, 102];

// Enchantment types
export const ENCHANTMENTS = {
  EFFICIENCY: { id: 'efficiency', name: 'Efficiency', desc: 'Mining speed +50%', cost: 1 },
  UNBREAKING: { id: 'unbreaking', name: 'Unbreaking', desc: 'Durability x1.5', cost: 1 },
  SHARPNESS: { id: 'sharpness', name: 'Sharpness', desc: 'Sword damage +3', cost: 1 },
  PROTECTION: { id: 'protection', name: 'Protection', desc: 'Damage reduction +10%', cost: 1 },
  FORTUNE: { id: 'fortune', name: 'Fortune', desc: 'Ore drops +1', cost: 1 },
};

export const ENCHANT_LIST = Object.values(ENCHANTMENTS);

// XP system
export class XPManager {
  constructor() {
    this.xp = 0;
    this.level = 0;
    this.orbs = [];
  }

  get xpForNextLevel() {
    return (this.level + 1) * 10;
  }

  addXP(amount) {
    this.xp += amount;
    while (this.xp >= this.xpForNextLevel) {
      this.xp -= this.xpForNextLevel;
      this.level++;
    }
  }

  spendLevel() {
    if (this.level > 0) {
      this.level--;
      return true;
    }
    return false;
  }

  getXPBarPercent() {
    return this.xp / this.xpForNextLevel;
  }

  // Create XP orb entity data
  spawnOrb(x, y, z, amount) {
    this.orbs.push({
      x, y, z,
      amount,
      vy: 3 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 2,
      vz: (Math.random() - 0.5) * 2,
      life: 30,
      collected: false,
    });
  }

  // Update orbs — float toward player when close
  update(dt, playerPos) {
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const orb = this.orbs[i];
      if (orb.collected) {
        this.orbs.splice(i, 1);
        continue;
      }
      // Physics
      orb.vy -= 15 * dt;
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
      orb.z += orb.vz * dt;
      orb.vx *= 0.95;
      orb.vz *= 0.95;
      orb.life -= dt;
      // Attract toward player when within 3 blocks
      const dx = playerPos.x - orb.x;
      const dy = playerPos.y - orb.y;
      const dz = playerPos.z - orb.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 3) {
        const speed = 8;
        orb.x += (dx / dist) * speed * dt;
        orb.y += (dy / dist) * speed * dt;
        orb.z += (dz / dist) * speed * dt;
      }
      // Collect when very close
      if (dist < 0.8) {
        this.addXP(orb.amount);
        orb.collected = true;
      }
      // Expire
      if (orb.life <= 0) {
        this.orbs.splice(i, 1);
      }
    }
  }

  serialize() {
    return { xp: this.xp, level: this.level };
  }

  deserialize(data) {
    if (data) {
      this.xp = data.xp || 0;
      this.level = data.level || 0;
    }
  }
}

// Enchantment manager
export class EnchantManager {
  constructor() {
    this.tableOpen = false;
    this.inputItem = null;
    this.lapisSlot = null;
    this.bookSlot = null;
    this.availableEnchants = [];
  }

  // Generate 3 random enchantment options
  rollEnchants() {
    const shuffled = [...ENCHANT_LIST].sort(() => Math.random() - 0.5);
    this.availableEnchants = shuffled.slice(0, 3);
  }

  // Apply enchantment to a tool/armor item
  applyEnchant(enchantId) {
    if (!this.inputItem) return false;
    const enchant = ENCHANT_LIST.find(e => e.id === enchantId);
    if (!enchant) return false;
    if (!this.lapisSlot) return false;

    // Add enchantment to item
    if (!this.inputItem.enchantments) {
      this.inputItem.enchantments = [];
    }
    // Only one enchantment per item (simplified)
    if (this.inputItem.enchantments.length > 0) return false;
    this.inputItem.enchantments.push(enchantId);

    // Apply effects
    switch (enchantId) {
      case 'efficiency':
        // Multiply mining speed
        if (this.inputItem.maxDurability) {
          this.inputItem._efficiencyMult = 1.5;
        }
        break;
      case 'unbreaking':
        if (this.inputItem.maxDurability) {
          this.inputItem.maxDurability = Math.floor(this.inputItem.maxDurability * 1.5);
        }
        break;
      case 'sharpness':
        this.inputItem._sharpnessBonus = 3;
        break;
      case 'protection':
        if (this.inputItem.reduction) {
          this.inputItem.reduction += 0.10;
        }
        break;
      case 'fortune':
        this.inputItem._fortuneBonus = 1;
        break;
    }

    return true;
  }

  getEnchantedName(item) {
    if (!item || !item.enchantments || item.enchantments.length === 0) return null;
    const ench = ENCHANT_LIST.find(e => e.id === item.enchantments[0]);
    return ench ? ench.name : null;
  }

  close() {
    this.tableOpen = false;
    this.inputItem = null;
    this.lapisSlot = null;
    this.bookSlot = null;
    this.availableEnchants = [];
  }
}

// XP drop values for ore blocks
export const XP_DROPS = {
  [MC_BLOCKS.COAL_ORE]: 1,
  [MC_BLOCKS.IRON_ORE]: 2,
  [MC_BLOCKS.GOLD_ORE]: 3,
  [MC_BLOCKS.DIAMOND_ORE]: 5,
};

export function getXPDropForBlock(blockId) {
  return XP_DROPS[blockId] || 0;
}

// Crafting recipes for enchanting items
export const ENCHANT_RECIPES = [
  // Enchanting Table: 4 obsidian + 2 diamond + 1 book (simplified shape)
  { type: 'shaped', pattern: [
    [null, 'diamond', null],
    ['obsidian', 'book', 'obsidian'],
    ['obsidian', 'diamond', 'obsidian'],
  ], output: { block: 100, count: 1 } },

  // Lapis Block: crafted from 4 gold_ingots (simplified — no lapis ore in JardVoxel)
  { type: 'shaped', pattern: [
    ['gold_ingot', 'gold_ingot'],
    ['gold_ingot', 'gold_ingot'],
  ], output: { block: 101, count: 1 } },

  // Book: 3 bamboo + 1 leather (simplified — paper from bamboo)
  { type: 'shapeless', ingredients: [44, 44, 44, 54], output: { block: 102, count: 1 } }, // bamboo x3 + leather
];
