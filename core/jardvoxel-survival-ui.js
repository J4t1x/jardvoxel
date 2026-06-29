// ═══════════════════════════════════════════════════════════
// SPEC-082: UI Overhaul 5.0
// Pixel typography, minimalist panels, animations, contextual info.
// ═══════════════════════════════════════════════════════════

export const UI_ANIMATION_DURATION = {
  HOTBAR_SLIDE: 200,
  INVENTORY_FADE: 300,
  DIALOG_SLIDE: 250,
  TOAST_SLIDE: 300,
  TOAST_DISMISS: 4000,
  BIOME_INDICATOR: 3000,
  QUEST_FLASH: 500,
  DEATH_FADE: 1000,
};

export const UI_CATEGORIES = {
  BLOCKS: 'blocks',
  ITEMS: 'items',
  TOOLS: 'tools',
  FOOD: 'food',
};

export const QUEST_MAX_VISIBLE = 3;

export class UIManager {
  constructor() {
    this._biomeIndicatorTimer = 0;
    this._compassTimer = 0;
    this._activeToasts = [];
    this._dialogOpen = false;
    this._questTrackerVisible = true;
    this._inventoryOpen = false;
    this._mapOpen = false;
    this._deathScreenVisible = false;
    this._currentBiome = null;
    this._quests = [];
    this._mapMarkers = [];
    this._mapZoom = 1;
  }

  showBiomeIndicator(biomeName) {
    this._currentBiome = biomeName;
    this._biomeIndicatorTimer = UI_ANIMATION_DURATION.BIOME_INDICATOR;
    return { visible: true, biome: biomeName, duration: UI_ANIMATION_DURATION.BIOME_INDICATOR };
  }

  updateBiomeIndicator(dt) {
    if (this._biomeIndicatorTimer > 0) {
      this._biomeIndicatorTimer -= dt * 1000;
      if (this._biomeIndicatorTimer <= 0) {
        this._biomeIndicatorTimer = 0;
        return { visible: false, biome: this._currentBiome };
      }
      return { visible: true, biome: this._currentBiome };
    }
    return { visible: false, biome: null };
  }

  showCompass() {
    this._compassTimer = 5000;
    return { visible: true };
  }

  updateCompass(dt) {
    if (this._compassTimer > 0) {
      this._compassTimer -= dt * 1000;
      if (this._compassTimer <= 0) {
        this._compassTimer = 0;
        return { visible: false };
      }
      return { visible: true };
    }
    return { visible: false };
  }

  showToast(message, type = 'info') {
    const toast = { id: Date.now() + Math.random(), message, type, timestamp: Date.now() };
    this._activeToasts.push(toast);
    return toast;
  }

  updateToasts(dt) {
    const now = Date.now();
    this._activeToasts = this._activeToasts.filter(t => now - t.timestamp < UI_ANIMATION_DURATION.TOAST_DISMISS);
    return this._activeToasts;
  }

  getActiveToasts() {
    return [...this._activeToasts];
  }

  dismissToast(id) {
    this._activeToasts = this._activeToasts.filter(t => t.id !== id);
  }

  openDialog(npcName, portrait, lines) {
    this._dialogOpen = true;
    return {
      open: true,
      npcName,
      portrait,
      lines,
      currentLine: 0,
      typewriterProgress: 0,
      options: [],
    };
  }

  closeDialog() {
    this._dialogOpen = false;
    return { open: false };
  }

  isDialogOpen() {
    return this._dialogOpen;
  }

  setDialogOptions(options) {
    if (options.length > 4) options = options.slice(0, 4);
    return options.map((opt, i) => ({ number: i + 1, text: opt }));
  }

  addQuest(quest) {
    this._quests.push(quest);
    if (this._quests.length > QUEST_MAX_VISIBLE) {
      this._questTrackerVisible = true;
    }
    return quest;
  }

  removeQuest(questId) {
    this._quests = this._quests.filter(q => q.id !== questId);
  }

  updateQuestProgress(questId, progress) {
    const quest = this._quests.find(q => q.id === questId);
    if (quest) {
      quest.progress = Math.min(1, Math.max(0, progress));
      if (quest.progress >= 1) {
        this.showToast(`Quest Complete: ${quest.title}`, 'quest');
        return { completed: true, quest };
      }
      return { completed: false, quest };
    }
    return { completed: false, quest: null };
  }

  getVisibleQuests() {
    return this._quests.slice(0, QUEST_MAX_VISIBLE);
  }

  toggleQuestTracker() {
    this._questTrackerVisible = !this._questTrackerVisible;
    return this._questTrackerVisible;
  }

  isQuestTrackerVisible() {
    return this._questTrackerVisible;
  }

  openInventory() {
    this._inventoryOpen = true;
    return { open: true, categories: Object.values(UI_CATEGORIES) };
  }

  closeInventory() {
    this._inventoryOpen = false;
    return { open: false };
  }

  isInventoryOpen() {
    return this._inventoryOpen;
  }

  categorizeItem(itemId) {
    if (itemId >= 1 && itemId <= 8) return UI_CATEGORIES.BLOCKS;
    if (itemId >= 9 && itemId <= 20) return UI_CATEGORIES.BLOCKS;
    if (itemId >= 21 && itemId <= 53) return UI_CATEGORIES.BLOCKS;
    if (itemId >= 54 && itemId <= 79) return UI_CATEGORIES.FOOD;
    if (itemId >= 80 && itemId <= 99) return UI_CATEGORIES.TOOLS;
    if (itemId >= 100 && itemId <= 170) return UI_CATEGORIES.ITEMS;
    return UI_CATEGORIES.ITEMS;
  }

  openMap() {
    this._mapOpen = true;
    return { open: true, markers: this._mapMarkers, zoom: this._mapZoom };
  }

  closeMap() {
    this._mapOpen = false;
    return { open: false };
  }

  isMapOpen() {
    return this._mapOpen;
  }

  addMapMarker(marker) {
    this._mapMarkers.push(marker);
    return marker;
  }

  getMapMarkers() {
    return [...this._mapMarkers];
  }

  setMapZoom(zoom) {
    this._mapZoom = Math.min(4, Math.max(0.25, zoom));
    return this._mapZoom;
  }

  zoomIn() {
    return this.setMapZoom(this._mapZoom * 2);
  }

  zoomOut() {
    return this.setMapZoom(this._mapZoom / 2);
  }

  showDeathScreen() {
    this._deathScreenVisible = true;
    return { visible: true, animation: 'fade', duration: UI_ANIMATION_DURATION.DEATH_FADE };
  }

  hideDeathScreen() {
    this._deathScreenVisible = false;
    return { visible: false };
  }

  isDeathScreenVisible() {
    return this._deathScreenVisible;
  }

  getHotbarAnimation(slot) {
    return {
      animation: 'slide',
      duration: UI_ANIMATION_DURATION.HOTBAR_SLIDE,
      slot,
    };
  }

  getInventoryAnimation() {
    return {
      animation: 'fade-scale',
      duration: UI_ANIMATION_DURATION.INVENTORY_FADE,
    };
  }

  getDialogAnimation() {
    return {
      animation: 'slide-up',
      duration: UI_ANIMATION_DURATION.DIALOG_SLIDE,
    };
  }

  getQuestCompleteAnimation() {
    return {
      animation: 'golden-flash',
      duration: UI_ANIMATION_DURATION.QUEST_FLASH,
    };
  }
}

export const uiManager = new UIManager();

export function getPixelFontCSS() {
  return {
    fontFamily: '"Press Start 2P", monospace',
    import: '@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");',
  };
}

export function getUIStyles() {
  return {
    panel: {
      background: 'rgba(20, 20, 30, 0.85)',
      border: '2px solid rgba(100, 100, 120, 0.6)',
      borderRadius: '0px',
      fontFamily: '"Press Start 2P", monospace',
    },
    hotbar: {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '4px',
    },
    minimap: {
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '128px',
      height: '128px',
    },
    questTracker: {
      position: 'fixed',
      right: '10px',
      top: '150px',
      maxWidth: '250px',
    },
  };
}
