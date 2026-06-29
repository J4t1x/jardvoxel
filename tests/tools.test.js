import { describe, it, expect } from 'vitest';
import {
  ToolItem, EquipmentManager,
  TOOL_TYPES, TOOL_MATERIALS, TOOL_MAP, ARMOR_MAP, ARMOR_SLOTS,
  getToolTypeForBlock, isToolBlock, isArmorBlock,
} from '../core/jardvoxel-survival-tools.js';

describe('ToolItem', () => {
  it('creates a wood pickaxe', () => {
    const t = new ToolItem(80); // WOOD_PICKAXE
    expect(t.type).toBe('pickaxe');
    expect(t.material).toBe('WOOD');
    expect(t.maxDurability).toBe(60);
    expect(t.durability).toBe(60);
  });

  it('creates a diamond sword', () => {
    const t = new ToolItem(95); // DIAMOND_SWORD
    expect(t.type).toBe('sword');
    expect(t.material).toBe('DIAMOND');
    expect(t.maxDurability).toBe(1560);
  });

  it('creates armor item', () => {
    const t = new ToolItem(97); // IRON_CHESTPLATE
    expect(t.type).toBe('armor');
    expect(t.slot).toBe('chestplate');
    expect(t.reduction).toBe(0.12);
  });

  it('use() decreases durability', () => {
    const t = new ToolItem(80);
    expect(t.use()).toBe(false);
    expect(t.durability).toBe(59);
  });

  it('use() returns true when broken', () => {
    const t = new ToolItem(80);
    t.durability = 1;
    expect(t.use()).toBe(true);
    expect(t.isBroken()).toBe(true);
  });

  it('getMiningSpeedMultiplier returns correct value for matching tool', () => {
    const t = new ToolItem(82); // IRON_PICKAXE
    expect(t.getMiningSpeedMultiplier(1)).toBe(6); // stone, iron pickaxe = 6x
  });

  it('getMiningSpeedMultiplier returns 1 for non-matching tool', () => {
    const t = new ToolItem(92); // WOOD_SWORD
    expect(t.getMiningSpeedMultiplier(1)).toBe(1); // sword can't mine stone
  });

  it('getDamageBonus returns bonus for swords', () => {
    const t = new ToolItem(95); // DIAMOND_SWORD
    expect(t.getDamageBonus()).toBe(8);
  });

  it('getDamageBonus returns 0 for non-swords', () => {
    const t = new ToolItem(80); // WOOD_PICKAXE
    expect(t.getDamageBonus()).toBe(0);
  });

  it('getDurabilityPercent returns ratio', () => {
    const t = new ToolItem(80);
    t.durability = 30;
    expect(t.getDurabilityPercent()).toBeCloseTo(0.5);
  });
});

describe('EquipmentManager', () => {
  it('starts empty', () => {
    const eq = new EquipmentManager();
    expect(eq.tool).toBeNull();
    expect(eq.armor.helmet).toBeNull();
    expect(eq.armor.chestplate).toBeNull();
  });

  it('equipTool sets current tool', () => {
    const eq = new EquipmentManager();
    const t = new ToolItem(82);
    eq.equipTool(t);
    expect(eq.tool).toBe(t);
  });

  it('unequipTool returns and clears tool', () => {
    const eq = new EquipmentManager();
    const t = new ToolItem(82);
    eq.equipTool(t);
    const returned = eq.unequipTool();
    expect(returned).toBe(t);
    expect(eq.tool).toBeNull();
  });

  it('equipArmor replaces old armor', () => {
    const eq = new EquipmentManager();
    const a1 = new ToolItem(96); // helmet
    const a2 = new ToolItem(96); // helmet
    eq.equipArmor(a1);
    const old = eq.equipArmor(a2);
    expect(old).toBe(a1);
    expect(eq.armor.helmet).toBe(a2);
  });

  it('getDamageReduction sums armor reductions', () => {
    const eq = new EquipmentManager();
    eq.equipArmor(new ToolItem(96)); // helmet 0.08
    eq.equipArmor(new ToolItem(97)); // chestplate 0.12
    expect(eq.getDamageReduction()).toBeCloseTo(0.20);
  });

  it('getDamageReduction caps at 0.80', () => {
    const eq = new EquipmentManager();
    // All 4 pieces with high reduction
    eq.equipArmor(new ToolItem(96));
    eq.equipArmor(new ToolItem(97));
    eq.equipArmor(new ToolItem(98));
    eq.equipArmor(new ToolItem(99));
    // Total = 0.08 + 0.12 + 0.10 + 0.04 = 0.34, under cap
    expect(eq.getDamageReduction()).toBeCloseTo(0.34);
  });

  it('getMiningSpeedForBlock returns tool speed', () => {
    const eq = new EquipmentManager();
    eq.equipTool(new ToolItem(82)); // IRON_PICKAXE
    expect(eq.getMiningSpeedForBlock(1)).toBe(6);
  });

  it('getMiningSpeedForBlock returns 1 with no tool', () => {
    const eq = new EquipmentManager();
    expect(eq.getMiningSpeedForBlock(1)).toBe(1);
  });

  it('onBlockMined damages tool', () => {
    const eq = new EquipmentManager();
    const t = new ToolItem(80);
    eq.equipTool(t);
    eq.onBlockMined(1);
    expect(t.durability).toBe(59);
  });

  it('onBlockMined returns broken info when tool breaks', () => {
    const eq = new EquipmentManager();
    const t = new ToolItem(80);
    t.durability = 1;
    eq.equipTool(t);
    const result = eq.onBlockMined(1);
    expect(result).toEqual({ broken: true, slot: 'tool' });
  });

  it('serialize/deserialize round-trip', () => {
    const eq = new EquipmentManager();
    eq.equipTool(new ToolItem(82));
    eq.equipArmor(new ToolItem(96));
    const data = eq.serialize();
    const eq2 = new EquipmentManager();
    eq2.deserialize(data);
    expect(eq2.tool.blockId).toBe(82);
    expect(eq2.armor.helmet.blockId).toBe(96);
  });
});

describe('Helper functions', () => {
  it('getToolTypeForBlock returns pickaxe for stone', () => {
    expect(getToolTypeForBlock(1)).toBe('pickaxe');
  });

  it('getToolTypeForBlock returns axe for planks', () => {
    expect(getToolTypeForBlock(22)).toBe('axe');
  });

  it('getToolTypeForBlock returns null for air', () => {
    expect(getToolTypeForBlock(0)).toBeNull();
  });

  it('isToolBlock detects tools', () => {
    expect(isToolBlock(80)).toBe(true);
    expect(isToolBlock(1)).toBe(false);
  });

  it('isArmorBlock detects armor', () => {
    expect(isArmorBlock(96)).toBe(true);
    expect(isArmorBlock(80)).toBe(false);
  });
});
