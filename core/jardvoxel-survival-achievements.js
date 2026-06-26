// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Achievements System — SPEC-064
// Achievement tracking, toast notifications, progress persistence
// ═══════════════════════════════════════════════════════════

// Achievement definitions (30+ across 8 categories)
export const ACHIEVEMENTS = {
  // Mining
  first_block: { id: 'first_block', name: 'Getting Wood', desc: 'Break a wood block', icon: '🪵', category: 'mining' },
  mine_100: { id: 'mine_100', name: 'Quarry Master', desc: 'Break 100 blocks', icon: '⛏', category: 'mining' },
  mine_diamond: { id: 'mine_diamond', name: 'Diamonds!', desc: 'Mine diamond ore', icon: '💎', category: 'mining' },
  mine_obsidian: { id: 'mine_obsidian', name: 'Obsidian Miner', desc: 'Mine obsidian', icon: '🟣', category: 'mining' },

  // Building
  first_place: { id: 'first_place', name: 'Builder', desc: 'Place your first block', icon: '🧱', category: 'building' },
  place_100: { id: 'place_100', name: 'Architect', desc: 'Place 100 blocks', icon: '🏛', category: 'building' },
  place_500: { id: 'place_500', name: 'Master Builder', desc: 'Place 500 blocks', icon: '🏰', category: 'building' },

  // Combat
  first_kill: { id: 'first_kill', name: 'Monster Hunter', desc: 'Kill your first mob', icon: '⚔', category: 'combat' },
  kill_10: { id: 'kill_10', name: 'Warrior', desc: 'Kill 10 mobs', icon: '🗡', category: 'combat' },
  kill_50: { id: 'kill_50', name: 'Slayer', desc: 'Kill 50 mobs', icon: '☠', category: 'combat' },
  survive_night: { id: 'survive_night', name: 'Night Survivor', desc: 'Survive a night without armor', icon: '🌙', category: 'combat' },

  // Exploration
  travel_1000: { id: 'travel_1000', name: 'Explorer', desc: 'Travel 1000 blocks from spawn', icon: '🧭', category: 'exploration' },
  enter_nether: { id: 'enter_nether', name: 'Into the Fire', desc: 'Enter the Nether', icon: '🔥', category: 'exploration' },
  find_village: { id: 'find_village', name: 'Villager Friend', desc: 'Find a village', icon: '🏘', category: 'exploration' },

  // Crafting
  craft_tool: { id: 'craft_tool', name: 'Tool Time', desc: 'Craft your first tool', icon: '🔨', category: 'crafting' },
  craft_iron_armor: { id: 'craft_iron_armor', name: 'Iron Clad', desc: 'Craft full iron armor', icon: '🛡', category: 'crafting' },
  craft_enchant_table: { id: 'craft_enchant_table', name: 'Enchanter', desc: 'Craft an enchanting table', icon: '✨', category: 'crafting' },
  craft_brewing_stand: { id: 'craft_brewing_stand', name: 'Brewer', desc: 'Craft a brewing stand', icon: '⚗', category: 'crafting' },

  // Survival
  first_eat: { id: 'first_eat', name: 'Foodie', desc: 'Eat your first food', icon: '🍎', category: 'survival' },
  survive_first_night: { id: 'survive_first_night', name: 'First Night', desc: 'Survive your first night', icon: '⛺', category: 'survival' },
  full_health: { id: 'full_health', name: 'Full Recovery', desc: 'Reach full health', icon: '❤', category: 'survival' },
  sleep_bed: { id: 'sleep_bed', name: 'Sweet Dreams', desc: 'Sleep in a bed', icon: '🛏', category: 'survival' },

  // Farming
  first_harvest: { id: 'first_harvest', name: 'Farmer', desc: 'Harvest your first crop', icon: '🌾', category: 'farming' },
  first_fish: { id: 'first_fish', name: 'Angler', desc: 'Catch your first fish', icon: '🎣', category: 'farming' },

  // Redstone
  first_redstone: { id: 'first_redstone', name: 'Redstone Beginner', desc: 'Place redstone dust', icon: '🔴', category: 'redstone' },
  redstone_circuit: { id: 'redstone_circuit', name: 'Electrician', desc: 'Create a circuit (lever + lamp)', icon: '⚡', category: 'redstone' },

  // Brewing
  brew_potion: { id: 'brew_potion', name: 'Alchemist', desc: 'Brew your first potion', icon: '🧪', category: 'crafting' },
  drink_potion: { id: 'drink_potion', name: 'Potion Tester', desc: 'Drink a potion', icon: '🍷', category: 'survival' },

  // Shields
  craft_shield: { id: 'craft_shield', name: 'Shield Up', desc: 'Craft a shield', icon: '🛡', category: 'crafting' },
  block_hit: { id: 'block_hit', name: 'Defender', desc: 'Block a mob attack with shield', icon: '🔰', category: 'combat' },
};

export const ACHIEVEMENT_CATEGORIES = ['mining', 'building', 'combat', 'exploration', 'crafting', 'survival', 'farming', 'redstone'];

// ═══════════════════════════════════════════════════════════
// AchievementManager
// ═══════════════════════════════════════════════════════════

export class AchievementManager {
  constructor() {
    this.unlocked = new Set();
    this.stats = {
      blocksBroken: 0,
      blocksPlaced: 0,
      mobsKilled: 0,
      distanceTraveled: 0,
      foodsEaten: 0,
      cropsHarvested: 0,
      fishCaught: 0,
      potionsBrewed: 0,
      potionsDrunk: 0,
      hitsBlocked: 0,
    };
    this.toastQueue = [];
    this.activeToast = null;
    this.toastTimer = 0;
  }

  unlock(id) {
    if (this.unlocked.has(id)) return false;
    const ach = ACHIEVEMENTS[id];
    if (!ach) return false;
    this.unlocked.add(id);
    this.toastQueue.push(ach);
    return true;
  }

  isUnlocked(id) {
    return this.unlocked.has(id);
  }

  getProgress() {
    return { unlocked: this.unlocked.size, total: Object.keys(ACHIEVEMENTS).length };
  }

  getByCategory(category) {
    return Object.values(ACHIEVEMENTS).filter(a => a.category === category);
  }

  update(dt, game) {
    // Process toast queue
    if (!this.activeToast && this.toastQueue.length > 0) {
      this.activeToast = this.toastQueue.shift();
      this.toastTimer = 3.0;
      this._showToast(this.activeToast);
      if (game.audio) game.audio.playPlace();
    }
    if (this.activeToast) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this._hideToast();
        this.activeToast = null;
      }
    }

    // Check stat-based achievements
    if (this.stats.blocksBroken >= 1 && !this.unlocked.has('first_block')) {
      this.unlock('first_block');
    }
    if (this.stats.blocksBroken >= 100) this.unlock('mine_100');
    if (this.stats.blocksPlaced >= 1) this.unlock('first_place');
    if (this.stats.blocksPlaced >= 100) this.unlock('place_100');
    if (this.stats.blocksPlaced >= 500) this.unlock('place_500');
    if (this.stats.mobsKilled >= 1) this.unlock('first_kill');
    if (this.stats.mobsKilled >= 10) this.unlock('kill_10');
    if (this.stats.mobsKilled >= 50) this.unlock('kill_50');
    if (this.stats.foodsEaten >= 1) this.unlock('first_eat');
    if (this.stats.cropsHarvested >= 1) this.unlock('first_harvest');
    if (this.stats.fishCaught >= 1) this.unlock('first_fish');
    if (this.stats.potionsBrewed >= 1) this.unlock('brew_potion');
    if (this.stats.potionsDrunk >= 1) this.unlock('drink_potion');
    if (this.stats.hitsBlocked >= 1) this.unlock('block_hit');
  }

  _showToast(ach) {
    const toast = document.getElementById('achievement-toast');
    if (!toast) return;
    toast.querySelector('.toast-icon').textContent = ach.icon;
    toast.querySelector('.toast-name').textContent = ach.name;
    toast.querySelector('.toast-desc').textContent = ach.desc;
    toast.classList.add('show');
  }

  _hideToast() {
    const toast = document.getElementById('achievement-toast');
    if (!toast) return;
    toast.classList.remove('show');
  }

  renderPanel(containerEl) {
    containerEl.innerHTML = '';
    const progress = this.getProgress();
    const header = document.createElement('div');
    header.style.cssText = 'margin-bottom:1rem;color:#fff;font-size:1.1rem';
    header.textContent = `Logros: ${progress.unlocked}/${progress.total}`;
    containerEl.appendChild(header);

    // Category tabs
    const tabs = document.createElement('div');
    tabs.style.cssText = 'display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap';
    const allBtn = document.createElement('button');
    allBtn.textContent = 'Todos';
    allBtn.className = 'ach-tab active';
    allBtn.style.cssText = 'padding:4px 12px;border-radius:6px;border:1px solid #555;background:#333;color:#fff;cursor:pointer';
    tabs.appendChild(allBtn);
    for (const cat of ACHIEVEMENT_CATEGORIES) {
      const btn = document.createElement('button');
      btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      btn.className = 'ach-tab';
      btn.style.cssText = 'padding:4px 12px;border-radius:6px;border:1px solid #555;background:#222;color:#aaa;cursor:pointer';
      btn.addEventListener('click', () => {
        containerEl.querySelectorAll('.ach-tab').forEach(t => { t.style.background = '#222'; t.style.color = '#aaa'; });
        btn.style.background = '#333';
        btn.style.color = '#fff';
        this._renderCategory(containerEl.querySelector('#ach-grid'), cat);
      });
      tabs.appendChild(btn);
    }
    allBtn.addEventListener('click', () => {
      containerEl.querySelectorAll('.ach-tab').forEach(t => { t.style.background = '#222'; t.style.color = '#aaa'; });
      allBtn.style.background = '#333';
      allBtn.style.color = '#fff';
      this._renderCategory(containerEl.querySelector('#ach-grid'), null);
    });
    containerEl.appendChild(tabs);

    const grid = document.createElement('div');
    grid.id = 'ach-grid';
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0.5rem;max-height:400px;overflow-y:auto';
    containerEl.appendChild(grid);
    this._renderCategory(grid, null);
  }

  _renderCategory(grid, category) {
    grid.innerHTML = '';
    const items = category ? this.getByCategory(category) : Object.values(ACHIEVEMENTS);
    for (const ach of items) {
      const unlocked = this.unlocked.has(ach.id);
      const card = document.createElement('div');
      card.style.cssText = `display:flex;align-items:center;gap:0.5rem;padding:0.5rem;border-radius:6px;background:${unlocked ? 'rgba(60,60,30,0.8)' : 'rgba(30,30,30,0.6)'};border:1px solid ${unlocked ? '#aa4' : '#444'};opacity:${unlocked ? '1' : '0.5'}`;
      const icon = document.createElement('span');
      icon.style.cssText = 'font-size:1.5rem';
      icon.textContent = unlocked ? ach.icon : '🔒';
      card.appendChild(icon);
      const info = document.createElement('div');
      info.innerHTML = `<div style="color:${unlocked ? '#fff' : '#888'};font-size:0.85rem;font-weight:bold">${ach.name}</div><div style="color:#888;font-size:0.7rem">${ach.desc}</div>`;
      card.appendChild(info);
      grid.appendChild(card);
    }
  }

  serialize() {
    return {
      unlocked: Array.from(this.unlocked),
      stats: { ...this.stats },
    };
  }

  deserialize(data) {
    if (data.unlocked) {
      this.unlocked = new Set(data.unlocked);
    }
    if (data.stats) {
      this.stats = { ...this.stats, ...data.stats };
    }
  }
}
