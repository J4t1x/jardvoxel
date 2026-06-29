// ═══════════════════════════════════════════════════════════
// SPEC-090: Ancient Civilizations
// Each world generates 1-3 ancient civilizations with unique
// history. Player discovers ruins gradually, each discovery
// reveals part of the story. Artifacts combine to reveal lore.
// ═══════════════════════════════════════════════════════════

import { PRNG } from './jardvoxel-survival-engine.js';

const ERAS = ['age_of_stone', 'age_of_bronze', 'age_of_magic'];
const CULTURES = ['builders', 'warriors', 'scholars', 'mystics'];
const DECLINE_REASONS = ['war', 'plague', 'cataclysm', 'mystery'];

const CIV_NAME_PARTS = {
  prefixes: ['Vel', 'Aer', 'Mor', 'Thal', 'Kor', 'Zan', 'Eld', 'Fen', 'Quor', 'Vash', 'Drak', 'Lum'],
  roots: ['an', 'ir', 'or', 'esh', 'um', 'ar', 'iv', 'on', 'eth', 'ar'],
  suffixes: ['oth', 'heim', 'gard', 'spire', 'hold', 'reach', 'fell', 'crest', 'bourne', 'wick'],
};

const CULTURE_TRAITS = {
  builders: {
    structures: ['great monument', 'aqueduct', 'bridge', 'temple-fortress'],
    artifacts: ['stone tablet', 'architect\'s tool', 'foundation seal', 'master chisel'],
    knowledge: ['masonry', 'engineering', 'city planning'],
  },
  warriors: {
    structures: ['war monument', 'arena', 'fortress', 'training ground'],
    artifacts: ['war banner', 'champion\'s blade', 'battle standard', 'war horn'],
    knowledge: ['tactics', 'metallurgy', 'siege craft'],
  },
  scholars: {
    structures: ['library', 'observatory', 'academy', 'archive'],
    artifacts: ['scholar\'s quill', 'star chart', 'ancient codex', 'knowledge crystal'],
    knowledge: ['astronomy', 'mathematics', 'philosophy'],
  },
  mystics: {
    structures: ['ritual circle', 'moon temple', 'crystal sanctum', 'spirit gate'],
    artifacts: ['mystic orb', 'ritual dagger', 'spirit charm', 'mana crystal'],
    knowledge: ['enchantment', 'alchemy', 'spirit binding'],
  },
};

const ERA_DESCRIPTIONS = {
  age_of_stone: 'an age when stone was the highest craft',
  age_of_bronze: 'an age when bronze forged mighty empires',
  age_of_magic: 'an age when magic shaped the world itself',
};

const DECLINE_NARRATIVES = {
  war: 'destroyed in a great war that ravaged the land',
  plague: 'wiped out by a terrible plague that spared none',
  cataclysm: 'swallowed by a cataclysm that reshaped the earth',
  mystery: 'vanished without a trace, leaving only questions',
};

const ARTIFACT_TYPES = ['tool', 'weapon', 'ornament', 'text', 'fossil'];
const FOSSIL_TYPES = ['dragon', 'beholder', 'golem', 'leviathan', 'wyvern', 'shadow beast'];

const BIOME_DISTRIBUTION = {
  builders: ['mountains', 'plains', 'savanna'],
  warriors: ['mountains', 'desert', 'savanna'],
  scholars: ['forest', 'mountains', 'plains'],
  mystics: ['swamp', 'mystic_grove', 'autumn_forest', 'jungle'],
};

export class AncientCivilizationSystem {
  constructor(seed) {
    this._rng = new PRNG(seed * 9173 + 42);
    this._civilizations = [];
    this._discoveries = new Map(); // civId -> array of discoveries
    this._artifacts = new Map(); // artifactId -> artifact data
    this._unlockedRecipes = new Set();
    this._generated = false;
  }

  generate() {
    if (this._generated) return this._civilizations;

    const count = 1 + Math.floor(this._rng.next() * 3); // 1-3 civilizations
    this._civilizations = [];

    for (let i = 0; i < count; i++) {
      const civ = this._generateCivilization(i);
      this._civilizations.push(civ);
      this._discoveries.set(civ.id, []);
    }

    this._generated = true;
    return this._civilizations;
  }

  _generateCivilization(index) {
    const name = this._generateName();
    const era = ERAS[Math.floor(this._rng.next() * ERAS.length)];
    const culture = CULTURES[Math.floor(this._rng.next() * CULTURES.length)];
    const decline = DECLINE_REASONS[Math.floor(this._rng.next() * DECLINE_REASONS.length)];

    const traits = CULTURE_TRAITS[culture];
    const preferredBiomes = BIOME_DISTRIBUTION[culture] || ['plains'];

    // Generate remnants
    const numStructures = 3 + Math.floor(this._rng.next() * 4); // 3-6
    const structures = [];
    for (let i = 0; i < numStructures; i++) {
      const type = traits.structures[Math.floor(this._rng.next() * traits.structures.length)];
      const biome = preferredBiomes[Math.floor(this._rng.next() * preferredBiomes.length)];
      structures.push({
        type,
        biome,
        discovered: false,
        x: Math.floor(this._rng.next() * 1000) - 500,
        z: Math.floor(this._rng.next() * 1000) - 500,
      });
    }

    // Generate artifacts
    const numArtifacts = 5 + Math.floor(this._rng.next() * 6); // 5-10
    const artifacts = [];
    for (let i = 0; i < numArtifacts; i++) {
      const artifact = this._generateArtifact(culture, traits);
      artifact.civId = `${name}_${index}`;
      artifacts.push(artifact);
      this._artifacts.set(artifact.id, artifact);
    }

    // Generate history
    const history = this._generateHistory(era, culture, decline, name);

    // Generate ancient recipes
    const recipes = traits.knowledge.map(k => ({
      name: `${k} of ${name}`,
      knowledge: k,
      unlocked: false,
    }));

    return {
      id: `${name}_${index}`,
      name,
      era,
      culture,
      declineReason: decline,
      structures,
      artifacts: artifacts.map(a => a.id),
      history,
      recipes,
      preferredBiomes,
    };
  }

  _generateName() {
    const prefix = CIV_NAME_PARTS.prefixes[Math.floor(this._rng.next() * CIV_NAME_PARTS.prefixes.length)];
    const root = CIV_NAME_PARTS.roots[Math.floor(this._rng.next() * CIV_NAME_PARTS.roots.length)];
    const suffix = CIV_NAME_PARTS.suffixes[Math.floor(this._rng.next() * CIV_NAME_PARTS.suffixes.length)];
    return prefix + root + suffix;
  }

  _generateArtifact(culture, traits) {
    const type = ARTIFACT_TYPES[Math.floor(this._rng.next() * ARTIFACT_TYPES.length)];
    let name, description;

    if (type === 'fossil') {
      const fossil = FOSSIL_TYPES[Math.floor(this._rng.next() * FOSSIL_TYPES.length)];
      name = `${fossil} fossil`;
      description = `A preserved fossil of an extinct ${fossil}.`;
    } else if (type === 'text') {
      name = 'ancient text fragment';
      description = `A fragment of text in an ancient language, partially legible.`;
    } else {
      const artifactName = traits.artifacts[Math.floor(this._rng.next() * traits.artifacts.length)];
      name = artifactName;
      description = `A ${type} from the ${culture} civilization, crafted with ancient skill.`;
    }

    return {
      id: `artifact_${Math.floor(this._rng.next() * 1000000)}`,
      type,
      name,
      description,
      culture,
      craftable: false,
      discovered: false,
      combined: false,
    };
  }

  _generateHistory(era, culture, decline, name) {
    const eraDesc = ERA_DESCRIPTIONS[era];
    const declineDesc = DECLINE_NARRATIVES[decline];

    return {
      founding: `The civilization of ${name} rose during ${eraDesc}. They were known as ${culture}.`,
      goldenAge: `At their peak, the ${name} built magnificent structures and accumulated great knowledge.`,
      decline: `The civilization of ${name} was ${declineDesc}.`,
      legacy: `Today, only scattered ruins and artifacts remain of ${name}, waiting to be discovered.`,
    };
  }

  // === Discovery ===

  discoverStructure(civId, structureIndex) {
    const civ = this._civilizations.find(c => c.id === civId);
    if (!civ || !civ.structures[structureIndex]) return null;

    civ.structures[structureIndex].discovered = true;
    const discoveries = this._discoveries.get(civId) || [];
    discoveries.push({ type: 'structure', index: structureIndex, timestamp: Date.now() });
    this._discoveries.set(civId, discoveries);

    return this.getDiscoveryLore(civId, structureIndex, 'structure');
  }

  discoverArtifact(artifactId) {
    const artifact = this._artifacts.get(artifactId);
    if (!artifact) return null;

    artifact.discovered = true;
    const civ = this._civilizations.find(c => c.id === artifact.civId);
    if (civ) {
      const discoveries = this._discoveries.get(civ.id) || [];
      discoveries.push({ type: 'artifact', artifactId, timestamp: Date.now() });
      this._discoveries.set(civ.id, discoveries);
    }

    return artifact;
  }

  getDiscoveryLore(civId, index, type) {
    const civ = this._civilizations.find(c => c.id === civId);
    if (!civ) return null;

    if (type === 'structure') {
      const structure = civ.structures[index];
      if (!structure) return null;
      return {
        title: `${civ.name}: ${structure.type}`,
        text: `${civ.history.founding} This ${structure.type} was found in the ${structure.biome} biome.`,
        civId,
      };
    }
    return null;
  }

  // === Artifact Combination ===

  combineArtifacts(artifactIds) {
    const artifacts = artifactIds.map(id => this._artifacts.get(id)).filter(Boolean);
    if (artifacts.length < 3) return null;

    // Check all from same civilization
    const civIds = new Set(artifacts.map(a => a.civId));
    if (civIds.size !== 1) return null;

    const civId = artifacts[0].civId;
    const civ = this._civilizations.find(c => c.id === civId);
    if (!civ) return null;

    // Mark as combined
    for (const a of artifacts) {
      a.combined = true;
    }

    // Reveal deeper lore
    return {
      title: `Hidden knowledge of ${civ.name}`,
      text: `By combining these artifacts, you uncover deeper truths. ${civ.history.goldenAge} ${civ.history.decline}`,
      civId,
      unlocked: true,
    };
  }

  // === Ancient Recipes ===

  unlockRecipe(civId, recipeIndex) {
    const civ = this._civilizations.find(c => c.id === civId);
    if (!civ || !civ.recipes[recipeIndex]) return false;

    civ.recipes[recipeIndex].unlocked = true;
    this._unlockedRecipes.add(civ.recipes[recipeIndex].name);
    return true;
  }

  getUnlockedRecipes() {
    return Array.from(this._unlockedRecipes);
  }

  // === Queries ===

  getCivilizations() {
    return this._civilizations;
  }

  getCivilization(id) {
    return this._civilizations.find(c => c.id === id) || null;
  }

  getArtifact(id) {
    return this._artifacts.get(id) || null;
  }

  getAllArtifacts() {
    return Array.from(this._artifacts.values());
  }

  getDiscoveredCount(civId) {
    const discoveries = this._discoveries.get(civId) || [];
    return discoveries.length;
  }

  getDiscoveryProgress(civId) {
    const civ = this.getCivilization(civId);
    if (!civ) return { discovered: 0, total: 0, progress: 0 };

    const total = civ.structures.length + civ.artifacts.length;
    const discoveredStructures = civ.structures.filter(s => s.discovered).length;
    const discoveredArtifacts = civ.artifacts.filter(id => {
      const a = this._artifacts.get(id);
      return a && a.discovered;
    }).length;
    const discovered = discoveredStructures + discoveredArtifacts;

    return {
      discovered,
      total,
      progress: total > 0 ? discovered / total : 0,
    };
  }

  // === Serialization ===

  serialize() {
    return {
      civilizations: this._civilizations,
      discoveries: Array.from(this._discoveries.entries()),
      artifacts: Array.from(this._artifacts.entries()),
      unlockedRecipes: Array.from(this._unlockedRecipes),
      generated: this._generated,
    };
  }

  deserialize(data) {
    if (!data) return;
    this._civilizations = data.civilizations || [];
    this._discoveries = new Map(data.discoveries || []);
    this._artifacts = new Map(data.artifacts || []);
    this._unlockedRecipes = new Set(data.unlockedRecipes || []);
    this._generated = data.generated || false;
  }
}
