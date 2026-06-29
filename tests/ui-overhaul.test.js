import { describe, it, expect, beforeEach } from 'vitest';
import {
  UIManager,
  UI_ANIMATION_DURATION,
  UI_CATEGORIES,
  QUEST_MAX_VISIBLE,
  uiManager,
  getPixelFontCSS,
  getUIStyles,
} from '../core/jardvoxel-survival-ui.js';

describe('UI Manager — SPEC-082', () => {
  let ui;

  beforeEach(() => {
    ui = new UIManager();
  });

  it('should start with all panels closed', () => {
    expect(ui.isDialogOpen()).toBe(false);
    expect(ui.isInventoryOpen()).toBe(false);
    expect(ui.isMapOpen()).toBe(false);
    expect(ui.isDeathScreenVisible()).toBe(false);
  });

  it('should show biome indicator with 3s duration', () => {
    const result = ui.showBiomeIndicator('Forest');
    expect(result.visible).toBe(true);
    expect(result.biome).toBe('Forest');
    expect(result.duration).toBe(3000);
  });

  it('should fade biome indicator after 3s', () => {
    ui.showBiomeIndicator('Desert');
    let result = ui.updateBiomeIndicator(3.1);
    expect(result.visible).toBe(false);
  });

  it('should keep biome indicator visible before 3s', () => {
    ui.showBiomeIndicator('Plains');
    let result = ui.updateBiomeIndicator(0.5);
    expect(result.visible).toBe(true);
    result = ui.updateBiomeIndicator(3);
    expect(result.visible).toBe(false);
  });

  it('should show and fade compass', () => {
    ui.showCompass();
    expect(ui.updateCompass(0).visible).toBe(true);
    expect(ui.updateCompass(6).visible).toBe(false);
  });

  it('should add and auto-dismiss toasts', () => {
    const toast = ui.showToast('Test message', 'info');
    expect(toast.message).toBe('Test message');
    expect(toast.type).toBe('info');
    expect(ui.getActiveToasts().length).toBe(1);
  });

  it('should dismiss toasts after 4s', (done) => {
    ui.showToast('Test');
    setTimeout(() => {
      ui.updateToasts(0);
      expect(ui.getActiveToasts().length).toBe(0);
      done();
    }, 4100);
  });

  it('should dismiss toast by id', () => {
    const toast = ui.showToast('Test');
    ui.dismissToast(toast.id);
    expect(ui.getActiveToasts().length).toBe(0);
  });

  it('should open and close dialog', () => {
    const result = ui.openDialog('Merchant', 'portrait.png', ['Hello', 'Goodbye']);
    expect(result.open).toBe(true);
    expect(result.npcName).toBe('Merchant');
    expect(result.lines).toHaveLength(2);
    expect(ui.isDialogOpen()).toBe(true);
    ui.closeDialog();
    expect(ui.isDialogOpen()).toBe(false);
  });

  it('should limit dialog options to 4', () => {
    const options = ui.setDialogOptions(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(options).toHaveLength(4);
    expect(options[0].number).toBe(1);
    expect(options[3].number).toBe(4);
  });

  it('should add and track quests', () => {
    ui.addQuest({ id: 'q1', title: 'Find the Sword', progress: 0 });
    expect(ui.getVisibleQuests()).toHaveLength(1);
  });

  it('should limit visible quests to 3', () => {
    ui.addQuest({ id: 'q1', title: 'Quest 1', progress: 0 });
    ui.addQuest({ id: 'q2', title: 'Quest 2', progress: 0 });
    ui.addQuest({ id: 'q3', title: 'Quest 3', progress: 0 });
    ui.addQuest({ id: 'q4', title: 'Quest 4', progress: 0 });
    expect(ui.getVisibleQuests()).toHaveLength(3);
  });

  it('should update quest progress', () => {
    ui.addQuest({ id: 'q1', title: 'Test', progress: 0 });
    const result = ui.updateQuestProgress('q1', 0.5);
    expect(result.completed).toBe(false);
    expect(result.quest.progress).toBe(0.5);
  });

  it('should complete quest at progress 1', () => {
    ui.addQuest({ id: 'q1', title: 'Test', progress: 0 });
    const result = ui.updateQuestProgress('q1', 1.0);
    expect(result.completed).toBe(true);
    expect(ui.getActiveToasts().length).toBe(1);
  });

  it('should toggle quest tracker', () => {
    expect(ui.isQuestTrackerVisible()).toBe(true);
    ui.toggleQuestTracker();
    expect(ui.isQuestTrackerVisible()).toBe(false);
  });

  it('should open and close inventory', () => {
    const result = ui.openInventory();
    expect(result.open).toBe(true);
    expect(result.categories).toContain('blocks');
    expect(ui.isInventoryOpen()).toBe(true);
    ui.closeInventory();
    expect(ui.isInventoryOpen()).toBe(false);
  });

  it('should categorize items correctly', () => {
    expect(ui.categorizeItem(1)).toBe(UI_CATEGORIES.BLOCKS);
    expect(ui.categorizeItem(9)).toBe(UI_CATEGORIES.BLOCKS);
    expect(ui.categorizeItem(55)).toBe(UI_CATEGORIES.FOOD);
    expect(ui.categorizeItem(80)).toBe(UI_CATEGORIES.TOOLS);
    expect(ui.categorizeItem(100)).toBe(UI_CATEGORIES.ITEMS);
  });

  it('should open and close map', () => {
    const result = ui.openMap();
    expect(result.open).toBe(true);
    expect(ui.isMapOpen()).toBe(true);
    ui.closeMap();
    expect(ui.isMapOpen()).toBe(false);
  });

  it('should add map markers', () => {
    ui.addMapMarker({ x: 100, z: 200, type: 'village', name: 'Stonehaven' });
    expect(ui.getMapMarkers()).toHaveLength(1);
  });

  it('should zoom map in and out', () => {
    ui.openMap();
    expect(ui.setMapZoom(1)).toBe(1);
    expect(ui.zoomIn()).toBe(2);
    expect(ui.zoomIn()).toBe(4);
    expect(ui.zoomIn()).toBe(4);
    expect(ui.zoomOut()).toBe(2);
    expect(ui.zoomOut()).toBe(1);
    expect(ui.zoomOut()).toBe(0.5);
    expect(ui.zoomOut()).toBe(0.25);
    expect(ui.zoomOut()).toBe(0.25);
  });

  it('should show and hide death screen', () => {
    const result = ui.showDeathScreen();
    expect(result.visible).toBe(true);
    expect(result.animation).toBe('fade');
    expect(ui.isDeathScreenVisible()).toBe(true);
    ui.hideDeathScreen();
    expect(ui.isDeathScreenVisible()).toBe(false);
  });

  it('should return animation configs', () => {
    expect(ui.getHotbarAnimation(3).animation).toBe('slide');
    expect(ui.getInventoryAnimation().animation).toBe('fade-scale');
    expect(ui.getDialogAnimation().animation).toBe('slide-up');
    expect(ui.getQuestCompleteAnimation().animation).toBe('golden-flash');
  });

  it('should export animation durations', () => {
    expect(UI_ANIMATION_DURATION.HOTBAR_SLIDE).toBe(200);
    expect(UI_ANIMATION_DURATION.INVENTORY_FADE).toBe(300);
    expect(UI_ANIMATION_DURATION.DIALOG_SLIDE).toBe(250);
    expect(UI_ANIMATION_DURATION.TOAST_SLIDE).toBe(300);
    expect(UI_ANIMATION_DURATION.TOAST_DISMISS).toBe(4000);
    expect(UI_ANIMATION_DURATION.BIOME_INDICATOR).toBe(3000);
    expect(UI_ANIMATION_DURATION.DEATH_FADE).toBe(1000);
  });

  it('should export 4 item categories', () => {
    expect(Object.keys(UI_CATEGORIES).length).toBe(4);
    expect(UI_CATEGORIES.BLOCKS).toBe('blocks');
    expect(UI_CATEGORIES.ITEMS).toBe('items');
    expect(UI_CATEGORIES.TOOLS).toBe('tools');
    expect(UI_CATEGORIES.FOOD).toBe('food');
  });

  it('should export singleton instance', () => {
    expect(uiManager).toBeInstanceOf(UIManager);
  });

  it('should return pixel font CSS', () => {
    const css = getPixelFontCSS();
    expect(css.fontFamily).toContain('Press Start 2P');
    expect(css.import).toContain('fonts.googleapis.com');
  });

  it('should return UI styles', () => {
    const styles = getUIStyles();
    expect(styles.panel).toBeDefined();
    expect(styles.hotbar).toBeDefined();
    expect(styles.minimap).toBeDefined();
    expect(styles.questTracker).toBeDefined();
  });

  it('should export QUEST_MAX_VISIBLE as 3', () => {
    expect(QUEST_MAX_VISIBLE).toBe(3);
  });
});
