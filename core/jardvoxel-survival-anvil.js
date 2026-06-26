// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Anvil & Item Repair — SPEC-065
// Anvil block, repair UI, enchantment combination, renaming
// ═══════════════════════════════════════════════════════════

// MC_BLOCKS/BLOCK values inlined to avoid circular dependency with mesher.js
import { ToolItem, isToolBlock, isArmorBlock, TOOL_MAP, ARMOR_MAP } from './jardvoxel-survival-tools.js';

// New block IDs for anvil
export const ANVIL_BLOCKS = {
  ANVIL: 153,
};

export const ANVIL_BLOCK_COLORS = {
  153: [0.30, 0.30, 0.32],
};

export const ANVIL_BLOCK_NAMES = {
  153: 'Anvil',
};

export const ANVIL_BLOCK_HARDNESS = {
  153: 5.0,
};

export const ANVIL_PLACEABLE_BLOCKS = [153];

// Anvil crafting recipe
export const ANVIL_RECIPES = [
  { type: 'shaped', pattern: [
    ['iron_ingot', 'iron_ingot', 'iron_ingot'],
    [null, 'iron_ingot', null],
    ['iron_ingot', 'iron_ingot', 'iron_ingot'],
  ], output: { block: ANVIL_BLOCKS.ANVIL, count: 1 } },
];

// Anvil constants
export const ANVIL_MAX_USES = 25;
export const ANVIL_REPAIR_BONUS = 0.10; // 10% bonus when merging two same tools
export const ANVIL_MATERIAL_REPAIR = 0.25; // 25% per material unit
export const ANVIL_FALL_DAMAGE_MIN = 2;
export const ANVIL_FALL_DAMAGE_MAX = 6;

// Material mapping for repair (which material repairs which tool)
export const REPAIR_MATERIALS = {
  // Wood tools → planks
  [TOOL_MAP.WOOD_PICKAXE]: 22, // PLANKS
  [TOOL_MAP.WOOD_AXE]: 22, // PLANKS
  [TOOL_MAP.WOOD_SHOVEL]: 22, // PLANKS
  [TOOL_MAP.WOOD_SWORD]: 22, // PLANKS
  [TOOL_MAP.WOOD_HOE]: 22, // PLANKS
  // Stone tools → cobblestone
  [TOOL_MAP.STONE_PICKAXE]: 21, // COBBLESTONE
  [TOOL_MAP.STONE_AXE]: 21, // COBBLESTONE
  [TOOL_MAP.STONE_SHOVEL]: 21, // COBBLESTONE
  [TOOL_MAP.STONE_SWORD]: 21, // COBBLESTONE
  [TOOL_MAP.STONE_HOE]: 21, // COBBLESTONE
  // Iron tools → iron ingot
  [TOOL_MAP.IRON_PICKAXE]: 65, // IRON_INGOT
  [TOOL_MAP.IRON_AXE]: 65, // IRON_INGOT
  [TOOL_MAP.IRON_SHOVEL]: 65, // IRON_INGOT
  [TOOL_MAP.IRON_SWORD]: 65, // IRON_INGOT
  [TOOL_MAP.IRON_HOE]: 65, // IRON_INGOT
  // Diamond tools → diamond ore (simplified)
  [TOOL_MAP.DIAMOND_PICKAXE]: 20, // DIAMOND_ORE
  [TOOL_MAP.DIAMOND_AXE]: 20, // DIAMOND_ORE
  [TOOL_MAP.DIAMOND_SHOVEL]: 20, // DIAMOND_ORE
  [TOOL_MAP.DIAMOND_SWORD]: 20, // DIAMOND_ORE
  [TOOL_MAP.DIAMOND_HOE]: 20, // DIAMOND_ORE
};

// ═══════════════════════════════════════════════════════════
// AnvilManager — manages anvil state, repair, and combination
// ═══════════════════════════════════════════════════════════

export class AnvilManager {
  constructor() {
    this.anvils = new Map(); // key: "x,y,z" → { uses: 0, damageState: 0 }
    this.input1 = null; // ToolItem or { block, count } for material
    this.input2 = null;
    this.output = null;
    this.xpCost = 0;
    this.renameText = '';
  }

  addAnvil(x, y, z) {
    const key = `${x},${y},${z}`;
    if (!this.anvils.has(key)) {
      this.anvils.set(key, { uses: 0, damageState: 0 });
    }
    return this.anvils.get(key);
  }

  removeAnvil(x, y, z) {
    this.anvils.delete(`${x},${y},${z}`);
  }

  getAnvil(x, y, z) {
    return this.anvils.get(`${x},${y},${z}`) || this.addAnvil(x, y, z);
  }

  // Calculate the result of the current inputs
  calculateResult(xpLevel) {
    this.output = null;
    this.xpCost = 0;

    if (!this.input1) return null;

    // Rename operation
    if (this.renameText && !this.input2) {
      this.xpCost = 1;
      if (xpLevel < this.xpCost) return null;
      const result = this._cloneItem(this.input1);
      result.customName = this.renameText.substring(0, 30);
      this.output = result;
      return this.output;
    }

    // Repair with material
    if (this.input2 && !isToolBlock(this.input2.block) && !isArmorBlock(this.input2.block)) {
      const requiredMaterial = REPAIR_MATERIALS[this.input1.block];
      if (requiredMaterial && this.input2.block === requiredMaterial) {
        const materialCount = this.input2.count || 1;
        this.xpCost = materialCount;
        if (xpLevel < this.xpCost) return null;
        const result = this._cloneItem(this.input1);
        const repairAmount = Math.floor(result.maxDurability * ANVIL_MATERIAL_REPAIR * materialCount);
        result.durability = Math.min(result.maxDurability, result.durability + repairAmount);
        this.output = result;
        return this.output;
      }
    }

    // Repair/combine with same tool type
    if (this.input2 && (isToolBlock(this.input2.block) || isArmorBlock(this.input2.block))) {
      if (this.input1.block === this.input2.block) {
        // Merge durability + 10% bonus
        const result = this._cloneItem(this.input1);
        const mergedDur = this.input1.durability + this.input2.durability;
        const bonus = Math.floor(result.maxDurability * ANVIL_REPAIR_BONUS);
        result.durability = Math.min(result.maxDurability, mergedDur + bonus);

        // Merge enchantments
        this.xpCost = 1; // base cost for repair
        if (result.enchantments && this.input2.enchantments) {
          for (const [ench, level] of Object.entries(this.input2.enchantments)) {
            if (result.enchantments[ench]) {
              // Same enchantment → higher level (capped at max)
              result.enchantments[ench] = Math.max(result.enchantments[ench], level);
            } else {
              result.enchantments[ench] = level;
              this.xpCost += 2; // 2 XP per new enchantment merged
            }
          }
        } else if (!result.enchantments && this.input2.enchantments) {
          result.enchantments = { ...this.input2.enchantments };
          this.xpCost += 2 * Object.keys(this.input2.enchantments).length;
        }

        if (this.renameText) {
          result.customName = this.renameText.substring(0, 30);
          this.xpCost += 1;
        }

        if (xpLevel < this.xpCost) return null;
        this.output = result;
        return this.output;
      }
    }

    return null;
  }

  // Apply the result: consume inputs and XP, increment anvil uses
  applyResult(xpManager) {
    if (!this.output) return false;
    if (xpManager && xpManager.level < this.xpCost) return false;

    if (xpManager) {
      xpManager.addXP(-this.xpCost * xpManager.xpPerLevel);
    }

    // Consume inputs
    this.input1 = null;
    this.input2 = null;

    // Increment anvil uses (handled by caller)
    return true;
  }

  useAnvil(x, y, z) {
    const anvil = this.getAnvil(x, y, z);
    anvil.uses++;
    // Update damage state: 0 = pristine, 1 = chipped (8+ uses), 2 = damaged (16+ uses)
    if (anvil.uses >= 16) anvil.damageState = 2;
    else if (anvil.uses >= 8) anvil.damageState = 1;
    return anvil.uses >= ANVIL_MAX_USES;
  }

  _cloneItem(item) {
    const clone = new ToolItem(item.block);
    clone.durability = item.durability;
    clone.maxDurability = item.maxDurability;
    clone.enchantments = item.enchantments ? { ...item.enchantments } : {};
    clone.customName = item.customName || null;
    return clone;
  }

  serialize() {
    const anvilData = {};
    for (const [key, val] of this.anvils) {
      anvilData[key] = val;
    }
    return { anvils: anvilData };
  }

  deserialize(data) {
    if (data.anvils) {
      for (const [key, val] of Object.entries(data.anvils)) {
        this.anvils.set(key, val);
      }
    }
  }
}
