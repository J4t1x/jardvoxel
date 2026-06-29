import { describe, it, expect } from 'vitest';
import { Inventory } from '../core/jardvoxel-survival-gameplay.js';

describe('Inventory', () => {
  it('starts with empty hotbar and main', () => {
    const inv = new Inventory();
    expect(inv.hotbar).toHaveLength(9);
    expect(inv.main).toHaveLength(27);
    expect(inv.hotbar.every(s => s === null)).toBe(true);
    expect(inv.selectedSlot).toBe(0);
  });

  it('addToHotbar sets item in slot', () => {
    const inv = new Inventory();
    inv.addToHotbar(0, 5); // block ID 5
    expect(inv.hotbar[0]).not.toBeNull();
    expect(inv.hotbar[0].block).toBe(5);
  });

  it('getSelected returns current slot item', () => {
    const inv = new Inventory();
    inv.addToHotbar(3, 10);
    inv.setSelected(3);
    expect(inv.getSelected()).not.toBeNull();
    expect(inv.getSelected().block).toBe(10);
  });

  it('setSelected clamps to 0-8', () => {
    const inv = new Inventory();
    inv.setSelected(100);
    expect(inv.selectedSlot).toBe(8);
    inv.setSelected(-5);
    expect(inv.selectedSlot).toBe(0);
  });

  it('addBlock is no-op in creative mode', () => {
    const inv = new Inventory();
    expect(inv.creativeMode).toBe(true);
    expect(inv.addBlock(5)).toBeUndefined(); // returns undefined (no-op)
  });

  it('addBlock stacks in survival mode', () => {
    const inv = new Inventory();
    inv.creativeMode = false;
    inv.addToHotbar(0, 5); // count = 64 in survival
    inv.addBlock(5);
    expect(inv.hotbar[0].count).toBe(65);
  });

  it('addBlock finds empty slot in survival', () => {
    const inv = new Inventory();
    inv.creativeMode = false;
    inv.addBlock(7);
    expect(inv.hotbar.some(s => s && s.block === 7)).toBe(true);
  });

  it('removeSelected returns block and decrements in survival', () => {
    const inv = new Inventory();
    inv.creativeMode = false;
    inv.addToHotbar(0, 5); // count = 64
    inv.setSelected(0);
    const block = inv.removeSelected();
    expect(block).toBe(5);
    expect(inv.hotbar[0].count).toBe(63);
    expect(inv.hotbar[0]).not.toBeNull();
  });

  it('removeSelected removes item when count reaches 0', () => {
    const inv = new Inventory();
    inv.creativeMode = false;
    inv.hotbar[0] = { block: 5, count: 1 };
    inv.setSelected(0);
    inv.removeSelected();
    expect(inv.hotbar[0]).toBeNull();
  });

  it('removeSelected returns block without decrement in creative', () => {
    const inv = new Inventory();
    inv.addToHotbar(0, 5);
    inv.setSelected(0);
    const block = inv.removeSelected();
    expect(block).toBe(5);
    expect(inv.hotbar[0]).not.toBeNull(); // still there
  });

  it('removeSelected returns null for empty slot', () => {
    const inv = new Inventory();
    inv.setSelected(5);
    expect(inv.removeSelected()).toBeNull();
  });
});
