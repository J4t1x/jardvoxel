// ═══════════════════════════════════════════════════════════
// JardVoxel Survival — Block Registry (CENTRALIZED)
// Single source of truth for all block IDs, colors, names, hardness
// Eliminates circular dependencies between mesher.js and feature modules
// ═══════════════════════════════════════════════════════════

// ── Block ID definitions ──

// Base block IDs (must match engine's blockTypeToId)
export const BLOCK = {
  AIR: 0, STONE: 1, GRASS: 2, DIRT: 3, SAND: 4,
  WATER: 5, LAVA: 6, SNOW: 7, MUD: 8,
};

// Extended block types for features
export const MC_BLOCKS = {
  ...BLOCK,
  OAK_LOG: 9, OAK_LEAVES: 10, BIRCH_LOG: 11, BIRCH_LEAVES: 12,
  SPRUCE_LOG: 13, SPRUCE_LEAVES: 14, JUNGLE_LOG: 15, JUNGLE_LEAVES: 16,
  COAL_ORE: 17, IRON_ORE: 18, GOLD_ORE: 19, DIAMOND_ORE: 20,
  COBBLESTONE: 21, PLANKS: 22, GLASS: 23, BRICKS: 24,
  TORCH: 25, LANTERN: 26, CACTUS: 27, FLOWER_RED: 28,
  FLOWER_YELLOW: 29, TALL_GRASS: 30, FERN: 31, DEAD_BUSH: 32,
  MOSSY_COBBLE: 33, SANDSTONE: 34, GRAVEL: 35, CLAY: 36,
  OBSIDIAN: 37, BEDROCK: 38, SNOW_BLOCK: 39, ICE: 40,
  PACKED_ICE: 41, MYCELIUM: 42, MOSS: 43, BAMBOO: 44,
  GRANITE: 45, ANDESITE: 46, DIORITE: 47,
  BOOKSHELF: 48, PUMPKIN: 49, MELON: 50,
  CRAFTING_TABLE: 51, STICK: 52, FURNACE: 53,
  LEATHER: 54, RAW_BEEF: 55, RAW_PORKCHOP: 56, FEATHER: 57,
  RAW_CHICKEN: 58, WOOL: 59, RAW_MUTTON: 60,
  COOKED_BEEF: 61, COOKED_PORKCHOP: 62, COOKED_CHICKEN: 63, COOKED_MUTTON: 64,
  IRON_INGOT: 65, GOLD_INGOT: 66,
  ROTTEN_FLESH: 67, BONES: 68, ARROW: 69,
  GUNPOWDER: 70, STRING: 71,
  BOW: 72,
  BED: 74,
  WHEAT_SEEDS: 75, WHEAT_CROP: 76, FARMLAND: 77, HOE: 78, BREAD: 79,
};

// Tool/Armor block IDs (80-99)
export const TOOL_BLOCKS = {
  WOOD_PICKAXE: 80, STONE_PICKAXE: 81, IRON_PICKAXE: 82, DIAMOND_PICKAXE: 83,
  WOOD_AXE: 84, STONE_AXE: 85, IRON_AXE: 86, DIAMOND_AXE: 87,
  WOOD_SHOVEL: 88, STONE_SHOVEL: 89, IRON_SHOVEL: 90, DIAMOND_SHOVEL: 91,
  WOOD_SWORD: 92, STONE_SWORD: 93, IRON_SWORD: 94, DIAMOND_SWORD: 95,
  IRON_HELMET: 96, IRON_CHESTPLATE: 97, IRON_LEGGINGS: 98, IRON_BOOTS: 99,
};

// Enchanting block IDs (100-102)
export const ENCHANT_BLOCKS = {
  ENCHANTING_TABLE: 100, LAPIS_BLOCK: 101, BOOK: 102,
};

// Villager block IDs (103-104)
export const VILLAGER_BLOCKS = {
  EMERALD: 103, VILLAGER_SPAWN_EGG: 104,
};

// Fishing block IDs (105-109)
export const FISHING_BLOCKS = {
  FISHING_ROD: 105, RAW_FISH: 106, COOKED_FISH: 107,
  PUFFERFISH: 108, INK_SAC: 109,
};

// Nether block IDs (110-119)
export const NETHER_BLOCKS = {
  NETHERRACK: 110, NETHER_BRICK: 111, SOUL_SAND: 112,
  GLOWSTONE: 113, NETHER_QUARTZ_ORE: 114, LAVA_NETHER: 115,
  OBSIDIAN_PORTAL: 116, QUARTZ: 117, BLAZE_ROD: 118, NETHER_WART: 119,
};

// Redstone block IDs (120-125)
export const REDSTONE_BLOCKS = {
  REDSTONE_DUST: 120, REDSTONE_TORCH: 121, LEVER: 122,
  PISTON: 123, REDSTONE_LAMP: 124, REDSTONE_REPEATER: 125,
};

// Brewing block IDs (126-140)
export const BREWING_BLOCKS = {
  BREWING_STAND: 126, GLASS_BOTTLE: 127, CAULDRON: 128,
  WATER_BOTTLE: 129, AWKWARD_POTION: 130, POTION_SPEED: 131,
  POTION_STRENGTH: 132, POTION_HEALING: 133, POTION_NIGHT_VISION: 134,
  POTION_FIRE_RESISTANCE: 135, POTION_REGENERATION: 136,
  SPLASH_POTION_HEALING: 137, POTION_WATER_BREATHING: 138,
  BLAZE_POWDER: 139, SUGAR: 140,
};

// Shield block IDs (151-152)
export const SHIELD_BLOCKS = {
  SHIELD: 151, BANNER: 152,
};

// Anvil block ID (153)
export const ANVIL_BLOCKS = {
  ANVIL: 153,
};

// Map/Cartography block IDs (154-156)
export const MAP_BLOCKS = {
  MAP: 154, COMPASS: 155, CARTOGRAPHY_TABLE: 156,
};

// Vegetation block IDs (157-170) — SPEC-078
export const VEGETATION_BLOCKS = {
  FLOWER_BLUE: 157, FLOWER_WHITE: 158, FLOWER_PURPLE: 159,
  FLOWER_ORANGE: 160, FLOWER_PINK: 161, FLOWER_LILY: 162,
  FLOWER_TULIP: 163, FLOWER_SUNFLOWER: 164,
  MUSHROOM_RED: 165, MUSHROOM_BROWN: 166,
  BERRY_BUSH: 167, VINES: 168, LILY_PAD: 169, CORAL_FAN: 170,
};

// SPEC-BIOME-OVERHAUL: Terrain blocks (171-175)
export const TERRAIN_BLOCKS = {
  RED_SAND: 171, TERRACOTTA: 172, CALCITE: 173, COARSE_DIRT: 174, SPRUCE_WOOD: 175,
};

// ── Consolidated colors (all blocks) ──

export const ALL_BLOCK_COLORS = {
  // Base blocks — Colores premium vibrantes y realistas
  [BLOCK.STONE]: [0.62, 0.62, 0.66],           // Gris piedra natural
  [BLOCK.GRASS]: [0.48, 0.88, 0.42],           // Verde césped vibrante
  [BLOCK.DIRT]: [0.65, 0.48, 0.32],            // Marrón tierra rico
  [BLOCK.SAND]: [0.96, 0.90, 0.72],            // Arena dorada suave
  [BLOCK.WATER]: [0.15, 0.48, 0.78],           // Azul agua cristalina
  [BLOCK.LAVA]: [0.95, 0.42, 0.12],            // Naranja lava incandescente
  [BLOCK.SNOW]: [0.97, 0.98, 0.99],            // Blanco nieve puro
  [BLOCK.MUD]: [0.45, 0.38, 0.25],             // Marrón barro oscuro
  // Extended blocks — Colores naturales mejorados
  [MC_BLOCKS.OAK_LOG]: [0.52, 0.36, 0.20],     // Marrón roble cálido
  [MC_BLOCKS.OAK_LEAVES]: [0.28, 0.68, 0.28],  // Verde hojas roble
  [MC_BLOCKS.BIRCH_LOG]: [0.92, 0.88, 0.75],   // Beige abedul claro
  [MC_BLOCKS.BIRCH_LEAVES]: [0.32, 0.72, 0.32], // Verde hojas abedul
  [MC_BLOCKS.SPRUCE_LOG]: [0.32, 0.24, 0.18],  // Marrón abeto oscuro
  [MC_BLOCKS.SPRUCE_LEAVES]: [0.22, 0.52, 0.26], // Verde hojas abeto
  [MC_BLOCKS.JUNGLE_LOG]: [0.38, 0.32, 0.16],  // Marrón selva profundo
  [MC_BLOCKS.JUNGLE_LEAVES]: [0.22, 0.72, 0.22], // Verde hojas selva
  [MC_BLOCKS.COAL_ORE]: [0.28, 0.28, 0.30],    // Gris carbón oscuro
  [MC_BLOCKS.IRON_ORE]: [0.72, 0.62, 0.48],    // Beige hierro
  [MC_BLOCKS.GOLD_ORE]: [0.88, 0.72, 0.22],    // Dorado oro brillante
  [MC_BLOCKS.DIAMOND_ORE]: [0.38, 0.92, 0.92], // Cian diamante brillante
  [MC_BLOCKS.COBBLESTONE]: [0.52, 0.52, 0.55], // Gris adoquín
  [MC_BLOCKS.PLANKS]: [0.72, 0.52, 0.32],      // Marrón tablas cálido
  [MC_BLOCKS.GLASS]: [0.85, 0.93, 0.97],       // Azul vidrio transparente
  [MC_BLOCKS.BRICKS]: [0.68, 0.42, 0.38],      // Rojo ladrillo
  [MC_BLOCKS.TORCH]: [0.95, 0.65, 0.25],       // Naranja antorcha cálido
  [MC_BLOCKS.LANTERN]: [0.98, 0.82, 0.35],     // Amarillo linterna brillante
  [MC_BLOCKS.CACTUS]: [0.42, 0.72, 0.38],      // Verde cactus
  [MC_BLOCKS.FLOWER_RED]: [0.95, 0.38, 0.32],  // Rojo flor vibrante
  [MC_BLOCKS.FLOWER_YELLOW]: [0.95, 0.85, 0.25],
  [MC_BLOCKS.TALL_GRASS]: [0.45, 0.75, 0.35],
  [MC_BLOCKS.FERN]: [0.25, 0.50, 0.20],
  [MC_BLOCKS.DEAD_BUSH]: [0.55, 0.40, 0.25],
  [MC_BLOCKS.MOSSY_COBBLE]: [0.40, 0.50, 0.35],
  [MC_BLOCKS.SANDSTONE]: [0.92, 0.82, 0.55],
  [MC_BLOCKS.GRAVEL]: [0.55, 0.52, 0.48],
  [MC_BLOCKS.CLAY]: [0.60, 0.65, 0.70],
  [MC_BLOCKS.OBSIDIAN]: [0.08, 0.06, 0.14],
  [MC_BLOCKS.BEDROCK]: [0.20, 0.20, 0.22],
  [MC_BLOCKS.SNOW_BLOCK]: [0.98, 0.98, 1.0],
  [MC_BLOCKS.ICE]: [0.70, 0.88, 0.98],
  [MC_BLOCKS.PACKED_ICE]: [0.60, 0.82, 0.95],
  [MC_BLOCKS.MYCELIUM]: [0.60, 0.55, 0.62],
  [MC_BLOCKS.MOSS]: [0.30, 0.55, 0.25],
  [MC_BLOCKS.BAMBOO]: [0.60, 0.80, 0.30],
  [MC_BLOCKS.GRANITE]: [0.68, 0.45, 0.40],
  [MC_BLOCKS.ANDESITE]: [0.58, 0.58, 0.62],
  [MC_BLOCKS.DIORITE]: [0.82, 0.80, 0.78],
  [MC_BLOCKS.BOOKSHELF]: [0.65, 0.45, 0.25],
  [MC_BLOCKS.PUMPKIN]: [0.85, 0.55, 0.15],
  [MC_BLOCKS.MELON]: [0.60, 0.85, 0.35],
  [MC_BLOCKS.CRAFTING_TABLE]: [0.55, 0.38, 0.20],
  [MC_BLOCKS.STICK]: [0.65, 0.45, 0.25],
  [MC_BLOCKS.FURNACE]: [0.45, 0.45, 0.47],
  [MC_BLOCKS.LEATHER]: [0.65, 0.45, 0.30],
  [MC_BLOCKS.RAW_BEEF]: [0.75, 0.40, 0.35],
  [MC_BLOCKS.RAW_PORKCHOP]: [0.85, 0.55, 0.55],
  [MC_BLOCKS.FEATHER]: [0.90, 0.90, 0.85],
  [MC_BLOCKS.RAW_CHICKEN]: [0.85, 0.75, 0.65],
  [MC_BLOCKS.WOOL]: [0.92, 0.92, 0.92],
  [MC_BLOCKS.RAW_MUTTON]: [0.80, 0.50, 0.45],
  [MC_BLOCKS.COOKED_BEEF]: [0.55, 0.30, 0.20],
  [MC_BLOCKS.COOKED_PORKCHOP]: [0.70, 0.40, 0.35],
  [MC_BLOCKS.COOKED_CHICKEN]: [0.75, 0.60, 0.40],
  [MC_BLOCKS.COOKED_MUTTON]: [0.65, 0.35, 0.30],
  [MC_BLOCKS.IRON_INGOT]: [0.80, 0.80, 0.85],
  [MC_BLOCKS.GOLD_INGOT]: [0.85, 0.70, 0.20],
  [MC_BLOCKS.ROTTEN_FLESH]: [0.55, 0.45, 0.40],
  [MC_BLOCKS.BONES]: [0.90, 0.88, 0.82],
  [MC_BLOCKS.ARROW]: [0.60, 0.50, 0.30],
  [MC_BLOCKS.GUNPOWDER]: [0.30, 0.30, 0.28],
  [MC_BLOCKS.STRING]: [0.85, 0.82, 0.78],
  [MC_BLOCKS.BOW]: [0.65, 0.45, 0.25],
  [MC_BLOCKS.BED]: [0.85, 0.25, 0.25],
  [MC_BLOCKS.WHEAT_SEEDS]: [0.65, 0.55, 0.20],
  [MC_BLOCKS.WHEAT_CROP]: [0.85, 0.75, 0.30],
  [MC_BLOCKS.FARMLAND]: [0.50, 0.38, 0.22],
  [MC_BLOCKS.HOE]: [0.65, 0.45, 0.25],
  [MC_BLOCKS.BREAD]: [0.90, 0.70, 0.40],
  // Tools & Armor (80-99)
  80: [0.65, 0.45, 0.25], 81: [0.50, 0.50, 0.52], 82: [0.80, 0.80, 0.85], 83: [0.30, 0.85, 0.85],
  84: [0.65, 0.45, 0.25], 85: [0.50, 0.50, 0.52], 86: [0.80, 0.80, 0.85], 87: [0.30, 0.85, 0.85],
  88: [0.65, 0.45, 0.25], 89: [0.50, 0.50, 0.52], 90: [0.80, 0.80, 0.85], 91: [0.30, 0.85, 0.85],
  92: [0.65, 0.45, 0.25], 93: [0.50, 0.50, 0.52], 94: [0.80, 0.80, 0.85], 95: [0.30, 0.85, 0.85],
  96: [0.75, 0.75, 0.80], 97: [0.75, 0.75, 0.80], 98: [0.75, 0.75, 0.80], 99: [0.75, 0.75, 0.80],
  // Enchanting (100-102)
  100: [0.30, 0.10, 0.50], 101: [0.15, 0.30, 0.80], 102: [0.85, 0.75, 0.50],
  // Villager (103-104)
  103: [0.10, 0.80, 0.50], 104: [0.90, 0.70, 0.30],
  // Fishing (105-109)
  105: [0.45, 0.35, 0.20], 106: [0.70, 0.60, 0.40], 107: [0.85, 0.75, 0.50],
  108: [0.80, 0.70, 0.10], 109: [0.10, 0.10, 0.10],
  // Nether (110-119)
  110: [0.35, 0.15, 0.15], 111: [0.25, 0.10, 0.10], 112: [0.30, 0.25, 0.15],
  113: [0.90, 0.75, 0.30], 114: [0.40, 0.35, 0.30], 115: [0.80, 0.30, 0.10],
  116: [0.20, 0.10, 0.40], 117: [0.85, 0.85, 0.80], 118: [0.80, 0.50, 0.15],
  119: [0.60, 0.15, 0.15],
  // Redstone (120-125)
  120: [0.70, 0.10, 0.10], 121: [0.90, 0.20, 0.10], 122: [0.50, 0.35, 0.20],
  123: [0.60, 0.55, 0.45], 124: [0.85, 0.70, 0.30], 125: [0.70, 0.15, 0.15],
  // Brewing (126-140)
  126: [0.40, 0.35, 0.30], 127: [0.85, 0.90, 0.95], 128: [0.35, 0.35, 0.38],
  129: [0.50, 0.60, 0.80], 130: [0.70, 0.50, 0.50], 131: [0.30, 0.85, 0.30],
  132: [0.85, 0.30, 0.30], 133: [0.90, 0.30, 0.50], 134: [0.30, 0.40, 0.90],
  135: [0.85, 0.50, 0.20], 136: [0.90, 0.70, 0.30], 137: [0.90, 0.30, 0.50],
  138: [0.30, 0.60, 0.90], 139: [0.90, 0.60, 0.20], 140: [0.95, 0.90, 0.80],
  // Shield (151-152)
  151: [0.50, 0.35, 0.20], 152: [0.80, 0.20, 0.20],
  // Anvil (153)
  153: [0.30, 0.30, 0.32],
  // Map (154-156)
  154: [0.85, 0.80, 0.60], 155: [0.80, 0.80, 0.85], 156: [0.65, 0.45, 0.25],
  // Vegetation (157-170) — SPEC-078
  157: [0.30, 0.50, 0.90], 158: [0.90, 0.90, 0.95], 159: [0.60, 0.30, 0.80],
  160: [0.90, 0.55, 0.15], 161: [0.95, 0.60, 0.70], 162: [0.70, 0.60, 0.95],
  163: [0.85, 0.30, 0.35], 164: [0.95, 0.85, 0.20],
  165: [0.80, 0.20, 0.20], 166: [0.55, 0.40, 0.25],
  167: [0.50, 0.30, 0.20], 168: [0.25, 0.45, 0.15], 169: [0.35, 0.55, 0.25], 170: [0.90, 0.55, 0.55],
  // SPEC-BIOME-OVERHAUL: Terrain blocks (171-175)
  171: [0.85, 0.50, 0.25],  // RED_SAND
  172: [0.75, 0.50, 0.35],  // TERRACOTTA
  173: [0.92, 0.92, 0.90],  // CALCITE
  174: [0.50, 0.38, 0.22],  // COARSE_DIRT
  175: [0.28, 0.20, 0.14],  // SPRUCE_WOOD
};

// ── Consolidated names ──

export const ALL_BLOCK_NAMES = {
  [BLOCK.STONE]: 'Stone', [BLOCK.GRASS]: 'Grass', [BLOCK.DIRT]: 'Dirt',
  [BLOCK.SAND]: 'Sand', [BLOCK.WATER]: 'Water', [BLOCK.LAVA]: 'Lava',
  [BLOCK.SNOW]: 'Snow', [BLOCK.MUD]: 'Mud',
  [MC_BLOCKS.OAK_LOG]: 'Oak Log', [MC_BLOCKS.OAK_LEAVES]: 'Oak Leaves',
  [MC_BLOCKS.BIRCH_LOG]: 'Birch Log', [MC_BLOCKS.BIRCH_LEAVES]: 'Birch Leaves',
  [MC_BLOCKS.SPRUCE_LOG]: 'Spruce Log', [MC_BLOCKS.SPRUCE_LEAVES]: 'Spruce Leaves',
  [MC_BLOCKS.JUNGLE_LOG]: 'Jungle Log', [MC_BLOCKS.JUNGLE_LEAVES]: 'Jungle Leaves',
  [MC_BLOCKS.COAL_ORE]: 'Coal Ore', [MC_BLOCKS.IRON_ORE]: 'Iron Ore',
  [MC_BLOCKS.GOLD_ORE]: 'Gold Ore', [MC_BLOCKS.DIAMOND_ORE]: 'Diamond Ore',
  [MC_BLOCKS.COBBLESTONE]: 'Cobblestone', [MC_BLOCKS.PLANKS]: 'Planks',
  [MC_BLOCKS.GLASS]: 'Glass', [MC_BLOCKS.BRICKS]: 'Bricks',
  [MC_BLOCKS.TORCH]: 'Torch', [MC_BLOCKS.LANTERN]: 'Lantern',
  [MC_BLOCKS.CACTUS]: 'Cactus', [MC_BLOCKS.FLOWER_RED]: 'Poppy',
  [MC_BLOCKS.FLOWER_YELLOW]: 'Dandelion', [MC_BLOCKS.TALL_GRASS]: 'Tall Grass',
  [MC_BLOCKS.FERN]: 'Fern', [MC_BLOCKS.DEAD_BUSH]: 'Dead Bush',
  [MC_BLOCKS.MOSSY_COBBLE]: 'Mossy Cobblestone', [MC_BLOCKS.SANDSTONE]: 'Sandstone',
  [MC_BLOCKS.GRAVEL]: 'Gravel', [MC_BLOCKS.CLAY]: 'Clay',
  [MC_BLOCKS.OBSIDIAN]: 'Obsidian', [MC_BLOCKS.BEDROCK]: 'Bedrock',
  [MC_BLOCKS.SNOW_BLOCK]: 'Snow Block', [MC_BLOCKS.ICE]: 'Ice',
  [MC_BLOCKS.PACKED_ICE]: 'Packed Ice', [MC_BLOCKS.MYCELIUM]: 'Mycelium',
  [MC_BLOCKS.MOSS]: 'Moss', [MC_BLOCKS.BAMBOO]: 'Bamboo',
  [MC_BLOCKS.GRANITE]: 'Granite', [MC_BLOCKS.ANDESITE]: 'Andesite',
  [MC_BLOCKS.DIORITE]: 'Diorite', [MC_BLOCKS.BOOKSHELF]: 'Bookshelf',
  [MC_BLOCKS.PUMPKIN]: 'Pumpkin', [MC_BLOCKS.MELON]: 'Melon',
  [MC_BLOCKS.CRAFTING_TABLE]: 'Crafting Table', [MC_BLOCKS.STICK]: 'Stick',
  [MC_BLOCKS.FURNACE]: 'Furnace',
  [MC_BLOCKS.LEATHER]: 'Leather', [MC_BLOCKS.RAW_BEEF]: 'Raw Beef',
  [MC_BLOCKS.RAW_PORKCHOP]: 'Raw Porkchop', [MC_BLOCKS.FEATHER]: 'Feather',
  [MC_BLOCKS.RAW_CHICKEN]: 'Raw Chicken', [MC_BLOCKS.WOOL]: 'Wool',
  [MC_BLOCKS.RAW_MUTTON]: 'Raw Mutton', [MC_BLOCKS.COOKED_BEEF]: 'Cooked Beef',
  [MC_BLOCKS.COOKED_PORKCHOP]: 'Cooked Porkchop', [MC_BLOCKS.COOKED_CHICKEN]: 'Cooked Chicken',
  [MC_BLOCKS.COOKED_MUTTON]: 'Cooked Mutton',
  [MC_BLOCKS.IRON_INGOT]: 'Iron Ingot', [MC_BLOCKS.GOLD_INGOT]: 'Gold Ingot',
  [MC_BLOCKS.ROTTEN_FLESH]: 'Rotten Flesh', [MC_BLOCKS.BONES]: 'Bones',
  [MC_BLOCKS.ARROW]: 'Arrow', [MC_BLOCKS.GUNPOWDER]: 'Gunpowder',
  [MC_BLOCKS.STRING]: 'String', [MC_BLOCKS.BOW]: 'Bow', [MC_BLOCKS.BED]: 'Bed',
  [MC_BLOCKS.WHEAT_SEEDS]: 'Wheat Seeds', [MC_BLOCKS.WHEAT_CROP]: 'Wheat',
  [MC_BLOCKS.FARMLAND]: 'Farmland', [MC_BLOCKS.HOE]: 'Hoe', [MC_BLOCKS.BREAD]: 'Bread',
  // Tools & Armor
  80: 'Wood Pickaxe', 81: 'Stone Pickaxe', 82: 'Iron Pickaxe', 83: 'Diamond Pickaxe',
  84: 'Wood Axe', 85: 'Stone Axe', 86: 'Iron Axe', 87: 'Diamond Axe',
  88: 'Wood Shovel', 89: 'Stone Shovel', 90: 'Iron Shovel', 91: 'Diamond Shovel',
  92: 'Wood Sword', 93: 'Stone Sword', 94: 'Iron Sword', 95: 'Diamond Sword',
  96: 'Iron Helmet', 97: 'Iron Chestplate', 98: 'Iron Leggings', 99: 'Iron Boots',
  // Enchanting
  100: 'Enchanting Table', 101: 'Lapis Block', 102: 'Book',
  // Villager
  103: 'Emerald', 104: 'Villager Spawn Egg',
  // Fishing
  105: 'Fishing Rod', 106: 'Raw Fish', 107: 'Cooked Fish',
  108: 'Pufferfish', 109: 'Ink Sac',
  // Nether
  110: 'Netherrack', 111: 'Nether Brick', 112: 'Soul Sand',
  113: 'Glowstone', 114: 'Nether Quartz Ore', 115: 'Lava',
  116: 'Portal', 117: 'Quartz', 118: 'Blaze Rod', 119: 'Nether Wart',
  // Redstone
  120: 'Redstone Dust', 121: 'Redstone Torch', 122: 'Lever',
  123: 'Piston', 124: 'Redstone Lamp', 125: 'Redstone Repeater',
  // Brewing
  126: 'Brewing Stand', 127: 'Glass Bottle', 128: 'Cauldron',
  129: 'Water Bottle', 130: 'Awkward Potion', 131: 'Potion of Speed',
  132: 'Potion of Strength', 133: 'Potion of Healing', 134: 'Potion of Night Vision',
  135: 'Potion of Fire Resistance', 136: 'Potion of Regeneration',
  137: 'Splash Potion of Healing', 138: 'Potion of Water Breathing',
  139: 'Blaze Powder', 140: 'Sugar',
  // Shield
  151: 'Shield', 152: 'Banner',
  // Anvil
  153: 'Anvil',
  // Map
  154: 'Map', 155: 'Compass', 156: 'Cartography Table',
  // Vegetation — SPEC-078
  157: 'Blue Flower', 158: 'White Flower', 159: 'Purple Flower',
  160: 'Orange Flower', 161: 'Pink Flower', 162: 'Lily Flower',
  163: 'Tulip', 164: 'Sunflower',
  165: 'Red Mushroom', 166: 'Brown Mushroom',
  167: 'Berry Bush', 168: 'Vines', 169: 'Lily Pad', 170: 'Coral Fan',
  // SPEC-BIOME-OVERHAUL: Terrain blocks
  171: 'Red Sand', 172: 'Terracotta', 173: 'Calcite',
  174: 'Coarse Dirt', 175: 'Spruce Wood',
};

// ── Consolidated hardness ──

export const ALL_BLOCK_HARDNESS = {
  [BLOCK.STONE]: 1.0, [BLOCK.DIRT]: 0.3, [BLOCK.GRASS]: 0.3,
  [BLOCK.SAND]: 0.3, [BLOCK.SNOW]: 0.2, [BLOCK.MUD]: 0.4,
  [MC_BLOCKS.OAK_LOG]: 0.8, [MC_BLOCKS.BIRCH_LOG]: 0.8,
  [MC_BLOCKS.SPRUCE_LOG]: 0.8, [MC_BLOCKS.JUNGLE_LOG]: 0.8,
  [MC_BLOCKS.OAK_LEAVES]: 0.2, [MC_BLOCKS.BIRCH_LEAVES]: 0.2,
  [MC_BLOCKS.SPRUCE_LEAVES]: 0.2, [MC_BLOCKS.JUNGLE_LEAVES]: 0.2,
  [MC_BLOCKS.COAL_ORE]: 1.5, [MC_BLOCKS.IRON_ORE]: 1.5,
  [MC_BLOCKS.GOLD_ORE]: 1.5, [MC_BLOCKS.DIAMOND_ORE]: 1.8,
  [MC_BLOCKS.COBBLESTONE]: 1.0, [MC_BLOCKS.PLANKS]: 0.8,
  [MC_BLOCKS.GLASS]: 0.3, [MC_BLOCKS.BRICKS]: 1.0,
  [MC_BLOCKS.TORCH]: 0.1, [MC_BLOCKS.LANTERN]: 0.3,
  [MC_BLOCKS.CACTUS]: 0.3, [MC_BLOCKS.OBSIDIAN]: 3.0,
  [MC_BLOCKS.BEDROCK]: Infinity, [MC_BLOCKS.SANDSTONE]: 0.8,
  [MC_BLOCKS.MOSSY_COBBLE]: 1.0, [MC_BLOCKS.GRAVEL]: 0.3,
  [MC_BLOCKS.GRANITE]: 1.2, [MC_BLOCKS.ANDESITE]: 1.1,
  [MC_BLOCKS.DIORITE]: 1.1, [MC_BLOCKS.ICE]: 0.3,
  [MC_BLOCKS.PACKED_ICE]: 0.5, [MC_BLOCKS.BOOKSHELF]: 0.8,
  [MC_BLOCKS.CRAFTING_TABLE]: 1.0, [MC_BLOCKS.STICK]: 0.2,
  [MC_BLOCKS.FURNACE]: 1.5,
  // Tools & Armor
  80: 0.2, 81: 0.2, 82: 0.2, 83: 0.2, 84: 0.2, 85: 0.2, 86: 0.2, 87: 0.2,
  88: 0.2, 89: 0.2, 90: 0.2, 91: 0.2, 92: 0.2, 93: 0.2, 94: 0.2, 95: 0.2,
  96: 0.3, 97: 0.3, 98: 0.3, 99: 0.3,
  // Enchanting
  100: 2.0, 101: 1.0, 102: 0.2,
  // Villager
  103: 0.2, 104: 0.1,
  // Fishing
  105: 0.1, 106: 0.1, 107: 0.1, 108: 0.1, 109: 0.1,
  // Nether
  110: 0.4, 111: 2.0, 112: 0.5, 113: 0.3, 114: 1.0,
  115: Infinity, 116: Infinity, 117: 0.3, 118: 0.1, 119: 0.1,
  // Redstone
  120: 0.1, 121: 0.1, 122: 0.1, 123: 1.5, 124: 0.3, 125: 0.1,
  // Brewing
  126: 0.5, 127: 0.1, 128: 1.5, 129: 0.1, 130: 0.1, 131: 0.1,
  132: 0.1, 133: 0.1, 134: 0.1, 135: 0.1, 136: 0.1, 137: 0.1,
  138: 0.1, 139: 0.1, 140: 0.1,
  // Shield
  151: 0.1, 152: 0.1,
  // Anvil
  153: 5.0,
  // Map
  154: 0.1, 155: 0.1, 156: 1.0,
  // Vegetation — SPEC-078
  157: 0.0, 158: 0.0, 159: 0.0, 160: 0.0, 161: 0.0,
  162: 0.0, 163: 0.0, 164: 0.0, 165: 0.0, 166: 0.0,
  167: 0.1, 168: 0.1, 169: 0.0, 170: 0.0,
  // SPEC-BIOME-OVERHAUL: Terrain blocks
  171: 0.3, 172: 0.8, 173: 0.8, 174: 0.3, 175: 0.8,
};

// ── Consolidated placeable blocks ──

export const ALL_PLACEABLE_BLOCKS = [
  BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.SAND,
  MC_BLOCKS.OAK_LOG, MC_BLOCKS.OAK_LEAVES, MC_BLOCKS.BIRCH_LOG,
  MC_BLOCKS.SPRUCE_LOG, MC_BLOCKS.PLANKS, MC_BLOCKS.COBBLESTONE,
  MC_BLOCKS.GLASS, MC_BLOCKS.BRICKS, MC_BLOCKS.SANDSTONE,
  MC_BLOCKS.MOSSY_COBBLE, MC_BLOCKS.GRAVEL, MC_BLOCKS.TORCH,
  MC_BLOCKS.LANTERN, MC_BLOCKS.OBSIDIAN, MC_BLOCKS.SNOW_BLOCK,
  MC_BLOCKS.ICE, MC_BLOCKS.GRANITE, MC_BLOCKS.ANDESITE, MC_BLOCKS.DIORITE,
  MC_BLOCKS.COAL_ORE, MC_BLOCKS.IRON_ORE, MC_BLOCKS.GOLD_ORE,
  MC_BLOCKS.DIAMOND_ORE, MC_BLOCKS.CACTUS, MC_BLOCKS.FLOWER_RED,
  MC_BLOCKS.FLOWER_YELLOW, MC_BLOCKS.TALL_GRASS, MC_BLOCKS.BOOKSHELF,
  MC_BLOCKS.PUMPKIN, MC_BLOCKS.MELON, MC_BLOCKS.BAMBOO, MC_BLOCKS.MOSS,
  MC_BLOCKS.CRAFTING_TABLE, MC_BLOCKS.STICK, MC_BLOCKS.FURNACE,
  MC_BLOCKS.LEATHER, MC_BLOCKS.RAW_BEEF, MC_BLOCKS.RAW_PORKCHOP,
  MC_BLOCKS.FEATHER, MC_BLOCKS.RAW_CHICKEN, MC_BLOCKS.WOOL,
  MC_BLOCKS.RAW_MUTTON, MC_BLOCKS.COOKED_BEEF, MC_BLOCKS.COOKED_PORKCHOP,
  MC_BLOCKS.COOKED_CHICKEN, MC_BLOCKS.COOKED_MUTTON,
  MC_BLOCKS.IRON_INGOT, MC_BLOCKS.GOLD_INGOT,
  MC_BLOCKS.ROTTEN_FLESH, MC_BLOCKS.BONES, MC_BLOCKS.ARROW,
  MC_BLOCKS.GUNPOWDER, MC_BLOCKS.STRING, MC_BLOCKS.BOW, MC_BLOCKS.BED,
  MC_BLOCKS.WHEAT_SEEDS, MC_BLOCKS.WHEAT_CROP, MC_BLOCKS.FARMLAND,
  MC_BLOCKS.HOE, MC_BLOCKS.BREAD,
  // Tools & Armor
  80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95,
  96, 97, 98, 99,
  // Enchanting
  100, 101, 102,
  // Villager
  103,
  // Nether
  110, 111, 112, 113, 117,
  // Redstone
  120, 121, 122, 123, 124, 125,
  // Brewing
  126, 128,
  // Shield
  152,
  // Anvil
  153,
  // Map
  156,
  // SPEC-BIOME-OVERHAUL: Terrain blocks
  171, 172, 173, 174, 175,
];

// Non-placeable items that appear in creative inventory
export const ALL_MAP_ITEMS = [154, 155];
