// ═══════════════════════════════════════════════════════════
// SPEC-080: Narrative Structures
// Procedural structure generation with history, lore, and loot.
// 10 structure types with unique generation and narrative elements.
// ═══════════════════════════════════════════════════════════

import { MC_BLOCKS, BLOCK } from './blocks-registry.js';
import { PRNG } from './jardvoxel-survival-engine.js';

export const STRUCTURE_TYPES = {
  VILLAGE: 'village',
  ANCIENT_TEMPLE: 'ancient_temple',
  MINESHAFT: 'mineshaft',
  RUINED_TOWER: 'ruined_tower',
  LIBRARY: 'library',
  OBSERVATORY: 'observatory',
  CAMP: 'camp',
  CASTLE_RUINS: 'castle_ruins',
  ARCHAEOLOGICAL_SITE: 'archaeological_site',
  SHIPWRECK: 'shipwreck',
};

export const VILLAGE_VARIANTS = {
  FISHING: 'fishing',
  FARMING: 'farming',
  MINING: 'mining',
  TRADING: 'trading',
};

const FOUNDING_EVENTS = [
  'founded by a group of settlers seeking new lands',
  'established as an outpost during a great war',
  'built around a sacred spring discovered by a wanderer',
  'created by refugees fleeing a fallen kingdom',
  'founded by merchants on a trade crossroads',
  'established by miners who struck a rich vein',
  'built by fishermen near abundant waters',
  'founded by a sage seeking solitude',
];

const DECLINE_EVENTS = [
  'abandoned after a plague swept through',
  'fell to raiders from the eastern mountains',
  'slowly depopulated as resources ran dry',
  'destroyed by a great fire',
  'swallowed by the encroaching wilderness',
  'evacuated after signs of the curse appeared',
  'conquered and assimilated by a neighboring power',
  'simply faded as the young left for distant cities',
];

const NOTABLE_FIGURES = [
  'Elder Thormund, who ruled for forty winters',
  'Sage Lyria, keeper of ancient knowledge',
  'Captain Roderick, defender against the siege',
  'Merchant Kael, who brought prosperity through trade',
  'Priestess Mira, who communed with the divine',
  'Miner Goran, who discovered the deep crystals',
  'Fisherman Tor, who tamed the sea serpent',
  'Lady Seraphine, whose betrayal led to ruin',
];

const STRUCTURE_LORE = {
  [STRUCTURE_TYPES.ANCIENT_TEMPLE]: {
    deities: ['the Shadowed One', 'the Earth Mother', 'the Flame Lord', 'the Whispering Wind'],
    rituals: ['blood sacrifice', 'lunar chanting', 'fire walking', 'offerings of gold'],
    curses: ['of eternal hunger', 'of silence', 'of the undead', 'of fading memories'],
  },
  [STRUCTURE_TYPES.LIBRARY]: {
    topics: ['celestial mechanics', 'ancient languages', 'herbal remedies', 'beast lore'],
    sages: ['Sage Aldric', 'Sage Fenwick', 'Sage Morwen', 'Sage Cassius'],
  },
  [STRUCTURE_TYPES.OBSERVATORY]: {
    discoveries: ['a new comet', 'a binary star system', 'a lunar eclipse pattern', 'a wandering planet'],
    astronomers: ['Astronomer Veyra', 'Astronomer Corvin', 'Astronomer Lyra'],
  },
  [STRUCTURE_TYPES.CAMP]: {
    occupants: ['explorers', 'merchants', 'bandits', 'pilgrims'],
    purposes: ['mapping the region', 'trading rare goods', 'planning a raid', 'seeking a sacred site'],
  },
  [STRUCTURE_TYPES.CASTLE_RUINS]: {
    kingdoms: ['the Kingdom of Valdoria', 'the Empire of Thessar', 'the Duchy of Karven', 'the Realm of Stoneholm'],
    battles: ['the Siege of the Long Night', 'the Battle of Broken Banners', 'the Fall of the Golden Keep'],
  },
  [STRUCTURE_TYPES.ARCHAEOLOGICAL_SITE]: {
    civilizations: ['the First Builders', 'the Sun People', 'the Stoneborn', 'the Forgotten Ones'],
    artifacts: ['a crystalline skull', 'a stone tablet with unknown script', 'a golden mask', 'a bone amulet'],
  },
  [STRUCTURE_TYPES.SHIPWRECK]: {
    routes: ['the spice route to the Southern Isles', 'the gold route from the Northern Mines'],
    storms: ['the Great Tempest of 1247', 'the Black Wave', 'the Storm of a Thousand Lightning'],
  },
};

const LOOT_TABLES = {
  [STRUCTURE_TYPES.VILLAGE]: [MC_BLOCKS.BREAD, MC_BLOCKS.IRON_INGOT, MC_BLOCKS.EMERALD, MC_BLOCKS.BOOK],
  [STRUCTURE_TYPES.ANCIENT_TEMPLE]: [MC_BLOCKS.GOLD_INGOT, MC_BLOCKS.DIAMOND_ORE, MC_BLOCKS.BONES, MC_BLOCKS.BOOK],
  [STRUCTURE_TYPES.MINESHAFT]: [MC_BLOCKS.IRON_INGOT, MC_BLOCKS.COAL_ORE, MC_BLOCKS.GOLD_ORE, MC_BLOCKS.TORCH],
  [STRUCTURE_TYPES.RUINED_TOWER]: [MC_BLOCKS.BOOK, MC_BLOCKS.IRON_INGOT, MC_BLOCKS.BOW, MC_BLOCKS.ARROW],
  [STRUCTURE_TYPES.LIBRARY]: [MC_BLOCKS.BOOK, MC_BLOCKS.BOOKSHELF, MC_BLOCKS.LANTERN, MC_BLOCKS.BOOK],
  [STRUCTURE_TYPES.OBSERVATORY]: [MC_BLOCKS.COMPASS, MC_BLOCKS.MAP, MC_BLOCKS.BOOK, MC_BLOCKS.SPYGLASS || MC_BLOCKS.COMPASS],
  [STRUCTURE_TYPES.CAMP]: [MC_BLOCKS.BREAD, MC_BLOCKS.COOKED_BEEF, MC_BLOCKS.TORCH, MC_BLOCKS.MAP],
  [STRUCTURE_TYPES.CASTLE_RUINS]: [MC_BLOCKS.IRON_INGOT, MC_BLOCKS.IRON_SWORD, MC_BLOCKS.IRON_HELMET, MC_BLOCKS.BONES],
  [STRUCTURE_TYPES.ARCHAEOLOGICAL_SITE]: [MC_BLOCKS.BOOK, MC_BLOCKS.BONES, MC_BLOCKS.IRON_INGOT, MC_BLOCKS.BOOK],
  [STRUCTURE_TYPES.SHIPWRECK]: [MC_BLOCKS.GOLD_INGOT, MC_BLOCKS.MAP, MC_BLOCKS.IRON_INGOT, MC_BLOCKS.BREAD],
};

export function generateStructureHistory(type, rng) {
  const foundingIdx = Math.floor(rng.next() * FOUNDING_EVENTS.length);
  const declineIdx = Math.floor(rng.next() * DECLINE_EVENTS.length);
  const figureIdx = Math.floor(rng.next() * NOTABLE_FIGURES.length);

  const history = {
    type,
    foundingEvent: FOUNDING_EVENTS[foundingIdx],
    declineEvent: DECLINE_EVENTS[declineIdx],
    notableFigure: NOTABLE_FIGURES[figureIdx],
  };

  const lore = STRUCTURE_LORE[type];
  if (lore) {
    if (lore.deities) {
      history.deity = lore.deities[Math.floor(rng.next() * lore.deities.length)];
      history.ritual = lore.rituals[Math.floor(rng.next() * lore.rituals.length)];
      history.curse = lore.curses[Math.floor(rng.next() * lore.curses.length)];
    }
    if (lore.topics) {
      history.topic = lore.topics[Math.floor(rng.next() * lore.topics.length)];
      history.sage = lore.sages[Math.floor(rng.next() * lore.sages.length)];
    }
    if (lore.discoveries) {
      history.discovery = lore.discoveries[Math.floor(rng.next() * lore.discoveries.length)];
      history.astronomer = lore.astronomers[Math.floor(rng.next() * lore.astronomers.length)];
    }
    if (lore.occupants) {
      history.occupantType = lore.occupants[Math.floor(rng.next() * lore.occupants.length)];
      history.occupantPurpose = lore.purposes[Math.floor(rng.next() * lore.purposes.length)];
    }
    if (lore.kingdoms) {
      history.kingdom = lore.kingdoms[Math.floor(rng.next() * lore.kingdoms.length)];
      history.battle = lore.battles[Math.floor(rng.next() * lore.battles.length)];
    }
    if (lore.civilizations) {
      history.civilization = lore.civilizations[Math.floor(rng.next() * lore.civilizations.length)];
      history.artifact = lore.artifacts[Math.floor(rng.next() * lore.artifacts.length)];
    }
    if (lore.routes) {
      history.route = lore.routes[Math.floor(rng.next() * lore.routes.length)];
      history.storm = lore.storms[Math.floor(rng.next() * lore.storms.length)];
    }
  }

  return history;
}

export function getVillageVariant(rng) {
  const variants = Object.values(VILLAGE_VARIANTS);
  return variants[Math.floor(rng.next() * variants.length)];
}

export function getLootForStructure(type, rng) {
  const table = LOOT_TABLES[type];
  if (!table) return [];
  const count = 1 + Math.floor(rng.next() * 3);
  const loot = [];
  for (let i = 0; i < count; i++) {
    loot.push(table[Math.floor(rng.next() * table.length)]);
  }
  return loot;
}

export function hasTraps(type) {
  return type === STRUCTURE_TYPES.ANCIENT_TEMPLE || type === STRUCTURE_TYPES.CASTLE_RUINS;
}

export function hasHostileMobs(type) {
  return type === STRUCTURE_TYPES.MINESHAFT ||
    type === STRUCTURE_TYPES.CASTLE_RUINS ||
    type === STRUCTURE_TYPES.ANCIENT_TEMPLE;
}

export function hasProceduralBooks(type) {
  return type === STRUCTURE_TYPES.LIBRARY ||
    type === STRUCTURE_TYPES.OBSERVATORY ||
    type === STRUCTURE_TYPES.ARCHAEOLOGICAL_SITE;
}

export function getStructureRarity(type) {
  switch (type) {
    case STRUCTURE_TYPES.VILLAGE: return 0.02;
    case STRUCTURE_TYPES.MINESHAFT: return 0.04;
    case STRUCTURE_TYPES.SHIPWRECK: return 0.01;
    case STRUCTURE_TYPES.CAMP: return 0.03;
    case STRUCTURE_TYPES.RUINED_TOWER: return 0.015;
    case STRUCTURE_TYPES.ANCIENT_TEMPLE: return 0.008;
    case STRUCTURE_TYPES.LIBRARY: return 0.006;
    case STRUCTURE_TYPES.OBSERVATORY: return 0.005;
    case STRUCTURE_TYPES.CASTLE_RUINS: return 0.004;
    case STRUCTURE_TYPES.ARCHAEOLOGICAL_SITE: return 0.003;
    default: return 0;
  }
}

export function shouldGenerateStructure(type, chunkX, chunkZ, rng) {
  const rarity = getStructureRarity(type);
  const hash = ((chunkX * 73856093) ^ (chunkZ * 19349663) ^ (type.length * 83492791)) >>> 0;
  const roll = (hash % 10000) / 10000;
  return roll < rarity;
}

export function generateNarrativeStructure(type, chunkX, chunkZ, seed) {
  const rng = new PRNG((chunkX * 1234567 ^ chunkZ * 7654321 ^ type.length * 999 + (seed || 0)) >>> 0);
  const history = generateStructureHistory(type, rng);
  const loot = getLootForStructure(type, rng);
  const traps = hasTraps(type);
  const hostileMobs = hasHostileMobs(type);
  const books = hasProceduralBooks(type);

  let variant = null;
  if (type === STRUCTURE_TYPES.VILLAGE) {
    variant = getVillageVariant(rng);
    history.variant = variant;
    history.npcCount = 3 + Math.floor(rng.next() * 6);
    history.villageName = generateVillageName(rng);
    history.villageAge = Math.floor(rng.next() * 500) + 50;
  }

  if (type === STRUCTURE_TYPES.CAMP) {
    history.occupantCount = 1 + Math.floor(rng.next() * 3);
    history.hostile = history.occupantType === 'bandits';
  }

  return { type, history, loot, traps, hostileMobs, books, variant, chunkX, chunkZ };
}

const VILLAGE_NAME_PREFIXES = ['Stone', 'River', 'Oak', 'Mist', 'Iron', 'Green', 'North', 'South', 'East', 'West', 'Frost', 'Sun'];
const VILLAGE_NAME_SUFFIXES = ['haven', 'ford', 'brook', 'fall', 'hold', 'vale', 'crest', 'mere', 'wick', 'bury', 'reach', 'moor'];

export function generateVillageName(rng) {
  const prefix = VILLAGE_NAME_PREFIXES[Math.floor(rng.next() * VILLAGE_NAME_PREFIXES.length)];
  const suffix = VILLAGE_NAME_SUFFIXES[Math.floor(rng.next() * VILLAGE_NAME_SUFFIXES.length)];
  return prefix + suffix;
}

export function getStructureDescription(structure) {
  const h = structure.history;
  const parts = [];

  switch (structure.type) {
    case STRUCTURE_TYPES.VILLAGE:
      parts.push(`The village of ${h.villageName}, ${h.variant} community of ${h.npcCount} residents, ${h.foundingEvent}.`);
      parts.push(`It ${h.declineEvent}.`);
      parts.push(`Known for ${h.notableFigure}.`);
      break;
    case STRUCTURE_TYPES.ANCIENT_TEMPLE:
      parts.push(`An ancient temple dedicated to ${h.deity}, where ${h.ritual} was practiced.`);
      parts.push(`It bears a curse ${h.curse}.`);
      parts.push(`${h.foundingEvent}.`);
      break;
    case STRUCTURE_TYPES.LIBRARY:
      parts.push(`A forgotten library where ${h.sage} studied ${h.topic}.`);
      parts.push(`It ${h.declineEvent}.`);
      break;
    case STRUCTURE_TYPES.OBSERVATORY:
      parts.push(`An observatory where ${h.astronomer} discovered ${h.discovery}.`);
      parts.push(`It ${h.declineEvent}.`);
      break;
    case STRUCTURE_TYPES.CAMP:
      parts.push(`A camp of ${h.occupantType}, ${h.occupantPurpose}.`);
      break;
    case STRUCTURE_TYPES.CASTLE_RUINS:
      parts.push(`Ruins of ${h.kingdom}, site of ${h.battle}.`);
      parts.push(`It ${h.declineEvent}.`);
      break;
    case STRUCTURE_TYPES.ARCHAEOLOGICAL_SITE:
      parts.push(`An excavation of ${h.civilization}, where ${h.artifact} was found.`);
      break;
    case STRUCTURE_TYPES.SHIPWRECK:
      parts.push(`A shipwreck from ${h.route}, lost to ${h.storm}.`);
      break;
    default:
      parts.push(`A ${structure.type} that ${h.foundingEvent}.`);
      parts.push(`It ${h.declineEvent}.`);
  }

  return parts.join(' ');
}
