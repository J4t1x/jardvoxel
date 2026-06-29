// ═══════════════════════════════════════════════════════════
// SPEC-081: Procedural Lore System
// NameGenerator, HistoryGenerator, BookGenerator, LegendSystem
// All seeded by world seed for reproducibility.
// ═══════════════════════════════════════════════════════════

import { PRNG } from './jardvoxel-survival-engine.js';

// ── Biome-appropriate name components ──

const NAME_COMPONENTS = {
  desert: {
    prefixes: ['Al', 'Kar', 'Ras', 'Dun', 'Sakh', 'Mir', 'Tar', 'Zir'],
    roots: ['akh', 'em', 'un', 'ir', 'ad', 'im', 'ar', 'or'],
    suffixes: ['abad', 'esh', 'ir', 'un', 'id', 'an', 'oth', 'im'],
  },
  forest: {
    prefixes: ['Oak', 'Pine', 'Moss', 'Fern', 'Bram', 'Hazel', 'Yew', 'Ash'],
    roots: ['en', 'wood', 'green', 'shade', 'thorn', 'glade', 'fell', 'hurst'],
    suffixes: ['haven', 'ford', 'wick', 'bury', 'vale', 'reach', 'moor', 'crest'],
  },
  plains: {
    prefixes: ['Stone', 'River', 'Green', 'North', 'South', 'East', 'West', 'Sun'],
    roots: ['en', 'ing', 'ton', 'burg', 'field', 'mere', 'dale', 'worth'],
    suffixes: ['ford', 'bury', 'wick', 'mere', 'dale', 'worth', 'ton', 'burg'],
  },
  taiga: {
    prefixes: ['Frost', 'Snow', 'Ice', 'Pine', 'Wolf', 'Raven', 'Bear', 'Winter'],
    roots: ['hold', 'fjord', 'gard', 'heim', 'varg', 'skog', 'fjell', 'dal'],
    suffixes: ['heim', 'gard', 'fjord', 'dal', 'skog', 'hold', 'varg', 'fjell'],
  },
  jungle: {
    prefixes: ['Verd', 'Thal', 'Koth', 'Zan', 'Mul', 'Quor', 'Vash', 'Yul'],
    roots: ['an', 'ir', 'or', 'esh', 'um', 'ar', 'iv', 'on'],
    suffixes: ['ar', 'esh', 'um', 'iv', 'on', 'ir', 'ar', 'esh'],
  },
  ocean: {
    prefixes: ['Wave', 'Tide', 'Salt', 'Coral', 'Pearl', 'Deep', 'Shell', 'Reef'],
    roots: ['en', 'more', 'sea', 'water', 'gulf', 'bay', 'cove', 'strand'],
    suffixes: ['cove', 'bay', 'gulf', 'strand', 'more', 'haven', 'reach', 'port'],
  },
  mountains: {
    prefixes: ['Stone', 'Iron', 'Gran', 'High', 'Cliff', 'Crag', 'Peak', 'Stark'],
    roots: ['hold', 'gard', 'heim', 'berg', 'fell', 'crag', 'mont', 'spire'],
    suffixes: ['berg', 'hold', 'spire', 'fell', 'crag', 'gard', 'mont', 'heim'],
  },
  swamp: {
    prefixes: ['Mire', 'Bog', 'Mist', 'Fen', 'Reed', 'Marsh', 'Wallow', 'Silt'],
    roots: ['en', 'more', 'fen', 'marsh', 'gloom', 'shade', 'mire', 'bog'],
    suffixes: ['fen', 'marsh', 'mire', 'bog', 'gloom', 'shade', 'more', 'wallow'],
  },
};

const CHARACTER_NAME_PARTS = {
  first: ['Thar', 'Mor', 'Kael', 'Ser', 'Bran', 'Lyr', 'Eld', 'Fen', 'Cor', 'Vey', 'Ald', 'Mir', 'Tor', 'Ror', 'Cas', 'Wyn', 'Dun', 'Hal', 'Bel', 'Sor'],
  male_middle: ['an', 'or', 'ic', 'in', 'ar', 'on', 'ur', 'ir'],
  female_middle: ['ia', 'el', 'in', 'ys', 'ar', 'en', 'is', 'wyn'],
  suffixes: ['mund', 'wick', 'dris', 'ven', 'ric', 'dor', 'wyn', 'das', 'rin', 'mund', 'helm', 'gard', 'wyn', 'mir', 'dor'],
};

const BOOK_TITLES = {
  lore: ['Chronicles of', 'History of', 'The Tale of', 'Legends of', 'The Saga of', 'Annals of'],
  recipe: ['A Treatise on', 'The Art of', 'Practical Guide to', 'On the Making of', 'Secrets of'],
  map: ['Map of', 'Chart of', 'Directions to', 'The Way to', 'Guide to'],
  journal: ['Diary of', 'Journal of', 'Memoirs of', 'Notes of', 'Reminiscences of'],
};

const BOOK_SUBJECTS = {
  lore: ['the Founding', 'the Great War', 'the Fallen Kingdom', 'the Dragon Age', 'the Plague Years', 'the Golden Era', 'the Shadow Times', 'the First Builders'],
  recipe: ['Ironworking', 'Potion Brewing', 'Stone Masonry', 'Herbal Remedies', 'Enchantment', 'Glassmaking', 'Leatherworking', 'Beast Taming'],
  map: ['the Northern Caves', 'the Sunken Temple', 'the Crystal Mine', 'the Forgotten Tower', 'the Ancient Ruins', 'the Hidden Valley', 'the Lost City', 'the Deep Forge'],
  journal: ['a Wandering Merchant', 'a Lonely Sage', 'a Lost Explorer', 'a Castle Guard', 'a Village Elder', 'a Fleeing Refugee', 'a Young Apprentice', 'a Dying Knight'],
};

const LEGEND_TEMPLATES = [
  'In the age of {era}, {figure} {action} the {entity} of {place}, and {result}.',
  'Long ago, {figure} {action} at {place}, where the {entity} still {lingers}.',
  'It is said that beneath {place}, {entity} {action} by {figure}, and {result}.',
  'The {entity} of {place} was once {action} by {figure}, but {result}.',
  'Beyond {place}, {figure} {action} the {entity}, and to this day {lingers}.',
];

const LEGEND_ERAS = ['the First Dawn', 'the Shadowed Years', 'the Golden Age', 'the Broken Time', 'the Before'];
const LEGEND_FIGURES = ['the Sage', 'the Warrior', 'the Betrayer', 'the Wanderer', 'the King', 'the Witch', 'the Builder', 'the Child'];
const LEGEND_ENTITIES = ['dragon', 'spirit', 'shadow', 'golem', 'phantom', 'beast', 'demon', 'giant'];
const LEGEND_PLACES = ['the Northern Peaks', 'the Deep Marsh', 'the Sunken Ruins', 'the Crystal Cave', 'the Old Forest', 'the Iron Tower', 'the Misty Vale', 'the Forgotten Shore'];
const LEGEND_ACTIONS = ['slew', 'bound', 'awoke', 'sealed', 'chased', 'tamed', 'freed', 'imprisoned'];
const LEGEND_RESULTS = ['the land was saved', 'the curse began', 'the kingdom fell', 'peace returned', 'the creature vanished', 'the secret was lost', 'the hero never returned', 'the door was sealed forever'];
const LEGEND_LINGERS = ['waits', 'sleeps', 'wanders', 'whispers', 'guards the treasure', 'hungers', 'watches', 'dreams'];

// ── NameGenerator ──

export class NameGenerator {
  constructor(seed) {
    this._rng = new PRNG(seed);
    this._used = new Set();
  }

  generateVillageName(biome = 'plains') {
    const comps = NAME_COMPONENTS[biome] || NAME_COMPONENTS.plains;
    for (let attempts = 0; attempts < 20; attempts++) {
      const prefix = comps.prefixes[Math.floor(this._rng.next() * comps.prefixes.length)];
      const suffix = comps.suffixes[Math.floor(this._rng.next() * comps.suffixes.length)];
      const name = prefix + suffix;
      if (!this._used.has(name)) {
        this._used.add(name);
        return name;
      }
    }
    return comps.prefixes[0] + comps.suffixes[0] + this._used.size;
  }

  generateCharacterName(gender = 'male') {
    const first = CHARACTER_NAME_PARTS.first[Math.floor(this._rng.next() * CHARACTER_NAME_PARTS.first.length)];
    const middle = gender === 'female'
      ? CHARACTER_NAME_PARTS.female_middle[Math.floor(this._rng.next() * CHARACTER_NAME_PARTS.female_middle.length)]
      : CHARACTER_NAME_PARTS.male_middle[Math.floor(this._rng.next() * CHARACTER_NAME_PARTS.male_middle.length)];
    const suffix = CHARACTER_NAME_PARTS.suffixes[Math.floor(this._rng.next() * CHARACTER_NAME_PARTS.suffixes.length)];
    return first + middle + suffix;
  }

  generateStructureName(type) {
    const prefixes = ['Old', 'New', 'High', 'Low', 'Great', 'Lesser', 'North', 'South'];
    const prefix = prefixes[Math.floor(this._rng.next() * prefixes.length)];
    const nameMap = {
      temple: 'Sanctum',
      library: 'Archive',
      tower: 'Spire',
      castle: 'Keep',
      mineshaft: 'Delve',
      observatory: 'Watch',
      camp: 'Outpost',
      shipwreck: 'Hulk',
      archaeological_site: 'Dig',
      village: 'Settlement',
    };
    const base = nameMap[type] || 'Ruins';
    return `${prefix} ${base}`;
  }
}

// ── HistoryGenerator ──

const FOUNDING_EVENTS = [
  'founded by settlers seeking new lands',
  'established as an outpost during a great war',
  'built around a sacred spring',
  'created by refugees fleeing a fallen kingdom',
  'founded by merchants on a trade crossroads',
  'established by miners who struck a rich vein',
  'built by a sage seeking solitude',
  'founded by a noble family seeking independence',
];

const DECLINE_EVENTS = [
  'abandoned after a plague',
  'fell to raiders from the east',
  'depopulated as resources ran dry',
  'destroyed by a great fire',
  'swallowed by the wilderness',
  'evacuated after signs of the curse',
  'conquered by a neighboring power',
  'faded as the young left for distant cities',
];

const NOTABLE_FIGURES = [
  'Elder Thormund, who ruled for forty winters',
  'Sage Lyria, keeper of ancient knowledge',
  'Captain Roderick, defender against the siege',
  'Merchant Kael, who brought prosperity',
  'Priestess Mira, who communed with the divine',
  'Miner Goran, who discovered the deep crystals',
  'Lady Seraphine, whose betrayal led to ruin',
  'Sir Aldric, the last knight who held the gate',
];

export class HistoryGenerator {
  constructor(seed) {
    this._rng = new PRNG(seed * 7919 + 1);
  }

  generate(type) {
    return {
      foundingEvent: FOUNDING_EVENTS[Math.floor(this._rng.next() * FOUNDING_EVENTS.length)],
      declineEvent: DECLINE_EVENTS[Math.floor(this._rng.next() * DECLINE_EVENTS.length)],
      notableFigure: NOTABLE_FIGURES[Math.floor(this._rng.next() * NOTABLE_FIGURES.length)],
    };
  }
}

// ── BookGenerator ──

export const BOOK_TYPES = {
  LORE: 'lore',
  RECIPE: 'recipe',
  MAP: 'map',
  JOURNAL: 'journal',
};

export class BookGenerator {
  constructor(seed) {
    this._rng = new PRNG(seed * 4099 + 3);
  }

  generate(type) {
    const titles = BOOK_TITLES[type] || BOOK_TITLES.lore;
    const subjects = BOOK_SUBJECTS[type] || BOOK_SUBJECTS.lore;
    const titlePrefix = titles[Math.floor(this._rng.next() * titles.length)];
    const subject = subjects[Math.floor(this._rng.next() * subjects.length)];
    const title = `${titlePrefix} ${subject}`;

    let content;
    switch (type) {
      case BOOK_TYPES.LORE:
        content = this._generateLoreContent(subject);
        break;
      case BOOK_TYPES.RECIPE:
        content = this._generateRecipeContent(subject);
        break;
      case BOOK_TYPES.MAP:
        content = this._generateMapContent(subject);
        break;
      case BOOK_TYPES.JOURNAL:
        content = this._generateJournalContent(subject);
        break;
      default:
        content = 'The pages are blank.';
    }

    return { type, title, content };
  }

  _generateLoreContent(subject) {
    return `In the days of old, the tale of ${subject} was told by every fireside. ` +
      `The events described herein shaped the very land upon which we walk. ` +
      `Let it serve as a reminder of what was, and what may come again.`;
  }

  _generateRecipeContent(subject) {
    return `A Practical Guide to ${subject}.\n\n` +
      `Chapter I: Materials and Preparation\n` +
      `To begin, one must gather the finest materials available.\n\n` +
      `Chapter II: The Process\n` +
      `Patience is the most important ingredient. Work carefully and with purpose.\n\n` +
      `Chapter III: Finishing\n` +
      `The final product should be tested before use. Quality is paramount.`;
  }

  _generateMapContent(subject) {
    const x = Math.floor(this._rng.next() * 1000) - 500;
    const z = Math.floor(this._rng.next() * 1000) - 500;
    return `Directions to ${subject}.\n\n` +
      `From the starting point, head ${x > 0 ? 'east' : 'west'} ${Math.abs(x)} paces.\n` +
      `Then turn and head ${z > 0 ? 'south' : 'north'} ${Math.abs(z)} paces.\n\n` +
      `Look for the stone marker. The entrance is hidden beneath.`;
  }

  _generateJournalContent(subject) {
    return `The diary of ${subject}.\n\n` +
      `Day 1: I have set out on my journey. The road is long but my spirit is willing.\n\n` +
      `Day 7: I have seen things I cannot explain. The shadows move in ways they should not.\n\n` +
      `Day 14: I fear I may not return. If anyone reads this, know that the truth lies beneath the old stones.\n\n` +
      `Day 21: It is too late for me. But perhaps not for you.`;
  }
}

// ── LegendSystem ──

export class LegendSystem {
  constructor(seed) {
    this._rng = new PRNG(seed * 6151 + 7);
    this._legends = [];
    this._generateLegends();
  }

  _generateLegends() {
    const count = 5 + Math.floor(this._rng.next() * 6);
    for (let i = 0; i < count; i++) {
      this._legends.push(this._generateLegend());
    }
  }

  _generateLegend() {
    const template = LEGEND_TEMPLATES[Math.floor(this._rng.next() * LEGEND_TEMPLATES.length)];
    const era = LEGEND_ERAS[Math.floor(this._rng.next() * LEGEND_ERAS.length)];
    const figure = LEGEND_FIGURES[Math.floor(this._rng.next() * LEGEND_FIGURES.length)];
    const entity = LEGEND_ENTITIES[Math.floor(this._rng.next() * LEGEND_ENTITIES.length)];
    const place = LEGEND_PLACES[Math.floor(this._rng.next() * LEGEND_PLACES.length)];
    const action = LEGEND_ACTIONS[Math.floor(this._rng.next() * LEGEND_ACTIONS.length)];
    const result = LEGEND_RESULTS[Math.floor(this._rng.next() * LEGEND_RESULTS.length)];
    const lingers = LEGEND_LINGERS[Math.floor(this._rng.next() * LEGEND_LINGERS.length)];

    const text = template
      .replace('{era}', era)
      .replace('{figure}', figure)
      .replace('{action}', action)
      .replace('{entity}', entity)
      .replace('{place}', place)
      .replace('{result}', result)
      .replace('{lingers}', lingers);

    return { text, place, entity, era };
  }

  getLegends() {
    return [...this._legends];
  }

  getLegendCount() {
    return this._legends.length;
  }

  getRandomLegend() {
    if (this._legends.length === 0) return null;
    return this._legends[Math.floor(this._rng.next() * this._legends.length)];
  }

  getLegendsByPlace(place) {
    return this._legends.filter(l => l.place === place);
  }
}

// ── LoreGenerator (facade) ──

export class LoreGenerator {
  constructor(worldSeed) {
    this.worldSeed = worldSeed;
    this.nameGenerator = new NameGenerator(worldSeed);
    this.historyGenerator = new HistoryGenerator(worldSeed);
    this.bookGenerator = new BookGenerator(worldSeed);
    this.legendSystem = new LegendSystem(worldSeed);
  }

  generateVillageName(biome) {
    return this.nameGenerator.generateVillageName(biome);
  }

  generateCharacterName(gender) {
    return this.nameGenerator.generateCharacterName(gender);
  }

  generateStructureName(type) {
    return this.nameGenerator.generateStructureName(type);
  }

  generateHistory(type) {
    return this.historyGenerator.generate(type);
  }

  generateBook(type) {
    return this.bookGenerator.generate(type);
  }

  getLegends() {
    return this.legendSystem.getLegends();
  }

  getLegendCount() {
    return this.legendSystem.getLegendCount();
  }
}

export { NAME_COMPONENTS, CHARACTER_NAME_PARTS };
