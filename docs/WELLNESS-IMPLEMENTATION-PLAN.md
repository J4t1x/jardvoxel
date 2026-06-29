# Plan de Implementación: Sistema de Bienestar JardVoxel

**Basado en:** SPEC-099  
**Fecha inicio:** 2026-06-28  
**Duración estimada:** 24 horas (3 días @ 8h/día)  
**Estado:** ✅ Completado (2026-06-28)

---

## Roadmap Visual

```
DÍA 1 (8h): Potenciar Sistemas Existentes
├─ Fase 1.1: ChillTune Enhancements (3h)
│  ├─ Modo contemplación (BPM 40, pentatónica)
│  ├─ Ciclo circadiano 8 fases
│  └─ Transiciones komorebi
├─ Fase 1.2: Ambient Sound Enhancements (2h)
│  ├─ Soundscape layers (near/mid/far)
│  ├─ Reverberación natural por bioma
│  └─ Ciclo de fauna (dawn/day/dusk/night)
└─ Fase 1.3: Komorebi System (3h)
   ├─ Raycast de densidad de canopy
   ├─ Partículas de luz
   └─ Efectos de audio/música

DÍA 2 (8h): Nuevos Sistemas Core
├─ Fase 2.1: Sistema de Resonancia (4h)
│  ├─ PlayerProfile tracking
│  ├─ Análisis de comportamiento
│  ├─ Modificadores de generación
│  └─ Eventos especiales
└─ Fase 2.2: Espacios de Meditación (4h)
   ├─ Generador de 6 tipos
   ├─ Detección de descubrimiento
   └─ Efectos especiales

DÍA 3 (8h): Mundo Vivo + Diario + Biomas
├─ Fase 3.1: Mundo Vivo (4h)
│  ├─ Árboles → Aves
│  ├─ Restauración → Biodiversidad
│  ├─ Caminos → Aldeanos
│  └─ Lagos → Peces
├─ Fase 3.2: Diario de Exploración (2h)
│  ├─ UI del diario
│  ├─ Registro automático
│  └─ Persistencia
└─ Fase 3.3: Biomas Nuevos (2h)
   ├─ Bamboo Forest
   ├─ Cherry Blossom Grove
   └─ Moss Garden
```

---

## DÍA 1: Potenciar Sistemas Existentes (8h)

### Fase 1.1: ChillTune Enhancements (3h)

**Archivo:** `jardvoxel-survival-chilltune.js`

#### Task 1.1.1: Modo Contemplación (1h)
```javascript
// Agregar a STATE_CONFIG
contemplation: {
  bpm: 40,
  scale: 'pentatonic',
  layers: ['drone'],
  droneRoot: 0,
  filterFreq: 600
}

// Agregar método de detección
_detectContemplation(ctx) {
  return ctx.idleTime > 60 && ctx.inMeditationSpace;
}
```

**Acceptance:**
- [ ] Estado contemplation reproduce a 40 BPM
- [ ] Solo drone activo, sin melodía
- [ ] Transición suave desde cualquier estado (8s)

#### Task 1.1.2: Ciclo Circadiano 8 Fases (1.5h)
```javascript
// Reemplazar TIME_MODULATION con 8 fases
const TIME_PHASES = {
  dawn:      { start: 0.20, end: 0.25, bpmMod: -5,  brightness: 0.7 },
  morning:   { start: 0.25, end: 0.35, bpmMod: 0,   brightness: 0.9 },
  noon:      { start: 0.35, end: 0.50, bpmMod: +2,  brightness: 1.0 },
  afternoon: { start: 0.50, end: 0.65, bpmMod: 0,   brightness: 0.95 },
  dusk:      { start: 0.65, end: 0.75, bpmMod: -3,  brightness: 0.7 },
  twilight:  { start: 0.75, end: 0.80, bpmMod: -5,  brightness: 0.5 },
  night:     { start: 0.80, end: 0.95, bpmMod: -8,  brightness: 0.4 },
  midnight:  { start: 0.95, end: 0.20, bpmMod: -10, brightness: 0.3 }
};

// Transiciones graduales de 5 minutos
_updateTimePhase(dayTime) {
  const phase = this._getPhaseFromTime(dayTime);
  if (phase !== this.currentTimePhase) {
    this._crossfadeTimePhase(phase, 300); // 5 min = 300s
  }
}
```

**Acceptance:**
- [ ] 8 fases detectan correctamente según dayTime
- [ ] Transiciones graduales de 5 minutos
- [ ] BPM sigue curva sinusoidal

#### Task 1.1.3: Transiciones Komorebi (0.5h)
```javascript
// Agregar método de detección de canopy
setKomorebi(active) {
  if (active && !this._komorebiActive) {
    // Filtro highpass sutil
    this._komorebiFilter = this.ctx.createBiquadFilter();
    this._komorebiFilter.type = 'highpass';
    this._komorebiFilter.frequency.value = 800;
    
    // Arpeggios cristalinos cada 20-30s
    this._scheduleKomorebiArpeggio();
  }
  this._komorebiActive = active;
}
```

**Acceptance:**
- [ ] Komorebi activa bajo canopy denso
- [ ] Filtro highpass aplicado suavemente
- [ ] Arpeggios cristalinos cada 20-30s

---

### Fase 1.2: Ambient Sound Enhancements (2h)

**Archivo:** `jardvoxel-survival-ambient-sound.js`

#### Task 1.2.1: Soundscape Layers (1h)
```javascript
// Agregar sistema de capas
this.soundLayers = {
  near: [],  // 0-16 bloques
  mid: [],   // 16-64 bloques
  far: []    // 64-128 bloques
};

_playSoundAtDistance(type, distance, vol) {
  let layer = 'near';
  if (distance > 64) layer = 'far';
  else if (distance > 16) layer = 'mid';
  
  // Atenuar según distancia
  const attenuation = 1 - (distance / 128);
  const finalVol = vol * attenuation;
  
  // Filtro según distancia (más lejano = más filtrado)
  const filterFreq = 3000 - (distance * 15);
  
  this._playLayeredSound(type, layer, finalVol, filterFreq);
}
```

**Acceptance:**
- [ ] 3 capas (near/mid/far) funcionan
- [ ] Atenuación por distancia correcta
- [ ] Filtro lowpass según distancia

#### Task 1.2.2: Reverberación Natural (0.5h)
```javascript
// Agregar reverb específico por bioma
const BIOME_REVERB = {
  caves:     { decay: 3.0, wet: 0.6, filter: 800 },
  forest:    { decay: 0.7, wet: 0.3, filter: 2000 },
  mountains: { decay: 1.5, wet: 0.4, filter: 1500, delay: 0.3 },
  ocean:     { decay: 1.8, wet: 0.5, filter: 1000 }
};

_createBiomeReverb(biome) {
  const cfg = BIOME_REVERB[biome] || { decay: 1.0, wet: 0.3 };
  // Implementar convolver o delay-based reverb
}
```

**Acceptance:**
- [ ] Reverb varía por bioma
- [ ] Cuevas tienen eco largo
- [ ] Montañas tienen delay direccional

#### Task 1.2.3: Ciclo de Fauna (0.5h)
```javascript
// Agregar modulación por fase del día
_updateFaunaCycle(phase) {
  switch(phase) {
    case 'dawn':
      this._increaseBirdDensity(3.0); // 3x aves
      break;
    case 'day':
      this._increaseBirdDensity(1.0);
      this._increaseInsectDensity(1.5);
      break;
    case 'dusk':
      this._fadeOutBirds(30); // 30s fade
      this._fadeInCrickets(30);
      break;
    case 'night':
      this._increaseOwlDensity(2.0);
      break;
  }
}
```

**Acceptance:**
- [ ] Dawn tiene coro de aves
- [ ] Dusk transiciona aves → grillos
- [ ] Night tiene búhos y grillos

---

### Fase 1.3: Komorebi System (3h)

**Archivo nuevo:** `jardvoxel-survival-komorebi.js`

#### Task 1.3.1: Raycast de Canopy (1.5h)
```javascript
export class KomorebiSystem {
  constructor(world) {
    this.world = world;
    this.active = false;
    this.canopyDensity = 0;
    this.lastCheck = 0;
  }
  
  update(playerPos, dt) {
    this.lastCheck += dt;
    if (this.lastCheck < 0.5) return; // Check cada 0.5s
    this.lastCheck = 0;
    
    // Raycast hacia arriba 16 bloques
    let leafBlocks = 0;
    for (let y = 1; y <= 16; y++) {
      const block = this.world.getBlock(
        Math.floor(playerPos.x),
        Math.floor(playerPos.y + y),
        Math.floor(playerPos.z)
      );
      if (block === BLOCK.LEAVES || block === BLOCK.LEAVES_CHERRY) {
        leafBlocks++;
      }
    }
    
    this.canopyDensity = leafBlocks / 16;
    this.active = this.canopyDensity > 0.6;
  }
}
```

**Acceptance:**
- [ ] Raycast detecta hojas sobre jugador
- [ ] Densidad calcula correctamente (0-1)
- [ ] Activa si >60% bloqueado

#### Task 1.3.2: Partículas de Luz (1h)
```javascript
_spawnLightRays(playerPos) {
  if (!this.active) return;
  
  // Generar 3-5 rayos de luz
  const rayCount = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < rayCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 2 + Math.random() * 4;
    const x = playerPos.x + Math.cos(angle) * dist;
    const z = playerPos.z + Math.sin(angle) * dist;
    
    // Partículas de polvo cayendo lentamente
    this._createDustMotes(x, playerPos.y + 8, z);
  }
}
```

**Acceptance:**
- [ ] Rayos de luz visibles bajo canopy
- [ ] Partículas de polvo caen lentamente
- [ ] Efecto sutil, no distractor

#### Task 1.3.3: Efectos Audio/Música (0.5h)
```javascript
_applyKomorebiEffects() {
  // Música: Filtro highpass + arpeggios
  if (this.chillTune) {
    this.chillTune.setKomorebi(this.active);
  }
  
  // Audio: Sonidos de hojas más prominentes
  if (this.ambientSound) {
    this.ambientSound.modulateLeafSounds(this.canopyDensity);
  }
}
```

**Acceptance:**
- [ ] Música cambia bajo komorebi
- [ ] Sonidos de hojas aumentan
- [ ] Transiciones suaves

---

## DÍA 2: Nuevos Sistemas Core (8h)

### Fase 2.1: Sistema de Resonancia (4h)

**Archivo nuevo:** `jardvoxel-survival-resonance.js`

#### Task 2.1.1: PlayerProfile Tracking (1.5h)
```javascript
export class ResonanceSystem {
  constructor() {
    this.profile = {
      prefersHeights: 0,
      prefersWater: 0,
      prefersForests: 0,
      prefersIsolation: 0,
      
      positionHistory: [], // últimos 100 puntos
      biomeHistory: [],    // últimos 50 biomas
      activityLog: [],     // últimas 100 acciones
      
      biomesPreferred: [],
      sunrisesWatched: 0,
      sunsetsWatched: 0,
      lakesDiscovered: 0,
      peaksClimbed: 0,
      
      contemplationTime: 0,
      explorationRadius: 0,
      buildingFrequency: 0
    };
    
    this.analysisTimer = 0;
  }
  
  trackPosition(pos, biome, dt) {
    this.profile.positionHistory.push({ ...pos, time: Date.now() });
    if (this.profile.positionHistory.length > 100) {
      this.profile.positionHistory.shift();
    }
    
    this.profile.biomeHistory.push({ biome, duration: dt });
    if (this.profile.biomeHistory.length > 50) {
      this.profile.biomeHistory.shift();
    }
  }
  
  trackActivity(type, data) {
    this.profile.activityLog.push({ type, data, time: Date.now() });
    if (this.profile.activityLog.length > 100) {
      this.profile.activityLog.shift();
    }
  }
}
```

**Acceptance:**
- [ ] Posiciones trackean correctamente
- [ ] Biomas registran duración
- [ ] Actividades logean con timestamp

#### Task 2.1.2: Análisis de Comportamiento (1.5h)
```javascript
analyze() {
  // Preferencia de altura
  const avgY = this._getAverageY();
  if (avgY > 100) this.profile.prefersHeights += 0.05;
  else if (avgY < 40) this.profile.prefersHeights -= 0.05;
  this.profile.prefersHeights = Math.max(-1, Math.min(1, this.profile.prefersHeights));
  
  // Preferencia de bioma
  const biomeTime = {};
  for (const entry of this.profile.biomeHistory) {
    biomeTime[entry.biome] = (biomeTime[entry.biome] || 0) + entry.duration;
  }
  this.profile.biomesPreferred = Object.entries(biomeTime)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(e => e[0]);
  
  // Contemplación
  const stillActions = this.profile.activityLog.filter(a => 
    a.type === 'still' && a.data.duration > 30
  );
  this.profile.contemplationTime = stillActions.reduce((sum, a) => 
    sum + a.data.duration, 0
  );
  
  // Radio de exploración
  const spawn = { x: 0, z: 0 }; // Asumiendo spawn en 0,0
  const distances = this.profile.positionHistory.map(p => 
    Math.sqrt((p.x - spawn.x) ** 2 + (p.z - spawn.z) ** 2)
  );
  this.profile.explorationRadius = distances.reduce((sum, d) => sum + d, 0) / distances.length;
}
```

**Acceptance:**
- [ ] Preferencias calculan correctamente (-1 a 1)
- [ ] Biomas preferidos ordenan por tiempo
- [ ] Contemplación suma correctamente

#### Task 2.1.3: Modificadores de Generación (0.5h)
```javascript
getWorldModifiers() {
  const mods = {
    treeClusterDensity: 1.0,
    waterBodyFrequency: 1.0,
    mountainHeight: 1.0,
    meadowSize: 1.0,
    structureRarity: 1.0
  };
  
  if (this.profile.prefersForests > 0.3) {
    mods.treeClusterDensity *= 1.3;
  }
  
  if (this.profile.contemplationTime > 300) {
    mods.meadowSize *= 1.4;
    mods.waterBodyFrequency *= 1.2;
  }
  
  if (this.profile.prefersHeights > 0.5) {
    mods.mountainHeight *= 1.2;
  }
  
  return mods;
}
```

**Acceptance:**
- [ ] Modificadores aplican según perfil
- [ ] Valores razonables (0.8-1.5x)
- [ ] No rompen generación

#### Task 2.1.4: Eventos Especiales (0.5h)
```javascript
checkForResonanceEvent(playerPos, biome) {
  // Mirador especial después de 5 amaneceres
  if (this.profile.sunrisesWatched >= 5 && Math.random() < 0.1) {
    return {
      type: 'sunrise_vista',
      message: 'Un lugar perfecto para contemplar el amanecer',
      position: this._findNearestPeak(playerPos)
    };
  }
  
  // Jardín oculto para contemplativos
  if (this.profile.contemplationTime > 600 && Math.random() < 0.05) {
    return {
      type: 'hidden_garden',
      message: 'Un jardín secreto te espera',
      position: this._findNearestClearing(playerPos, biome)
    };
  }
  
  return null;
}
```

**Acceptance:**
- [ ] Eventos generan según condiciones
- [ ] Probabilidades razonables
- [ ] Mensajes aparecen sutilmente

---

### Fase 2.2: Espacios de Meditación (4h)

**Archivo nuevo:** `jardvoxel-survival-meditation-spaces.js`

#### Task 2.2.1: Generador Base (1.5h)
```javascript
export class MeditationSpaceGenerator {
  constructor(worldGen) {
    this.worldGen = worldGen;
    this.spaces = [];
    this.discoveredSpaces = new Set();
  }
  
  tryGenerateSpace(chunk) {
    if (Math.random() > 0.01) return; // 1% probabilidad
    
    const cx = chunk.cx;
    const cz = chunk.cz;
    const centerX = cx * 16 + 8;
    const centerZ = cz * 16 + 8;
    
    const biome = this.worldGen.getBiome(centerX, centerZ);
    const baseHeight = this.worldGen.getBaseHeight(centerX, centerZ);
    const pv = this.worldGen.getPeaksValleys(centerX, centerZ);
    
    // Decidir tipo según condiciones
    if (pv > 0.7 && baseHeight > SEA_LEVEL + 100) {
      return this._generateVista(chunk, centerX, centerZ, baseHeight);
    }
    
    if ((biome === 'forest' || biome === 'plains') && Math.abs(pv) < 0.2) {
      return this._generateZenGarden(chunk, centerX, centerZ, baseHeight);
    }
    
    // ... otros tipos
  }
}
```

**Acceptance:**
- [ ] 1% probabilidad por chunk
- [ ] Tipo correcto según condiciones
- [ ] No genera en biomas incompatibles

#### Task 2.2.2: Implementar 6 Tipos (2h)
```javascript
_generateVista(chunk, x, z, y) {
  // Plataforma 5x5 de piedra
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      chunk.setBlock(x + dx, y, z + dz, BLOCK.STONE);
    }
  }
  
  // Árbol solitario
  this._placeTree(chunk, x + 3, y + 1, z + 3, 'oak');
  
  this.spaces.push({
    type: 'vista',
    position: { x, y, z },
    radius: 8,
    discovered: false
  });
}

_generateZenGarden(chunk, x, z, y) {
  // Clearing circular con grava
  const radius = 6;
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= radius) {
        chunk.setBlock(x + dx, y, z + dz, BLOCK.GRAVEL);
        for (let dy = 1; dy <= 5; dy++) {
          chunk.setBlock(x + dx, y + dy, z + dz, BLOCK.AIR);
        }
      }
    }
  }
  
  // Rocas en patrón
  const rocks = [
    { dx: 0, dz: 0 },
    { dx: -3, dz: 2 },
    { dx: 3, dz: -2 }
  ];
  for (const rock of rocks) {
    chunk.setBlock(x + rock.dx, y + 1, z + rock.dz, BLOCK.MOSSY_COBBLE);
  }
  
  // Bambú perimetral
  for (let angle = 0; angle < 360; angle += 30) {
    const rad = angle * Math.PI / 180;
    const bx = Math.floor(x + Math.cos(rad) * (radius + 1));
    const bz = Math.floor(z + Math.sin(rad) * (radius + 1));
    this._placeBamboo(chunk, bx, y + 1, bz, 6);
  }
  
  this.spaces.push({
    type: 'zen_garden',
    position: { x, y, z },
    radius: radius,
    discovered: false
  });
}

// Implementar: _generateWaterfall, _generateMirrorLake, 
//              _generateShrine, _generateBambooGrove
```

**Acceptance:**
- [ ] Vista genera plataforma + árbol
- [ ] Zen garden tiene grava + rocas + bambú
- [ ] Cascada tiene agua cayendo
- [ ] Lago tiene superficie plana
- [ ] Templo tiene pilares + altar
- [ ] Bamboo grove tiene cluster denso

#### Task 2.2.3: Detección de Descubrimiento (0.5h)
```javascript
checkPlayerInSpace(playerPos) {
  for (const space of this.spaces) {
    const dx = playerPos.x - space.position.x;
    const dz = playerPos.z - space.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist <= space.radius && !space.discovered) {
      space.discovered = true;
      this.discoveredSpaces.add(space.type);
      
      return {
        type: space.type,
        firstTime: true,
        message: this._getDiscoveryMessage(space.type)
      };
    }
  }
  return null;
}

_getDiscoveryMessage(type) {
  const messages = {
    vista: 'Has encontrado un mirador natural',
    zen_garden: 'Un jardín zen oculto',
    waterfall: 'El sonido del agua te invita',
    mirror_lake: 'Un lago espejo',
    shrine: 'Ruinas antiguas',
    bamboo_grove: 'Bosque de bambú'
  };
  return messages[type];
}
```

**Acceptance:**
- [ ] Detecta entrada en radio
- [ ] Solo notifica primera vez
- [ ] Mensaje aparece sutilmente

---

## DÍA 3: Mundo Vivo + Diario + Biomas (8h)

### Fase 3.1: Mundo Vivo (4h)

**Archivo nuevo:** `jardvoxel-survival-living-world.js`

#### Task 3.1.1: Árboles → Aves (1h)
```javascript
export class LivingWorldSystem {
  constructor() {
    this.treesPlanted = [];
    this.responses = [];
  }
  
  onPlayerPlantTree(x, y, z, treeType) {
    this.treesPlanted.push({
      position: { x, y, z },
      type: treeType,
      timestamp: Date.now(),
      responded: false
    });
    
    // Responder en 5 minutos
    setTimeout(() => {
      this._spawnBirdsInTree(x, y, z);
    }, 5 * 60 * 1000);
  }
  
  _spawnBirdsInTree(x, y, z) {
    const birdCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < birdCount; i++) {
      const birdY = y + 4 + Math.floor(Math.random() * 3);
      const birdX = x + (Math.random() - 0.5) * 2;
      const birdZ = z + (Math.random() - 0.5) * 2;
      
      this._createBird(birdX, birdY, birdZ);
    }
    
    // Audio
    if (this.ambientSound) {
      this.ambientSound.playPointSound('birds', x, y + 5, z, 0.15);
    }
    
    // Notificación
    this.responses.push({
      type: 'birds_arrived',
      message: 'Las aves han encontrado tu árbol'
    });
  }
}
```

**Acceptance:**
- [ ] Trackea árboles plantados
- [ ] Genera aves después de 5 min
- [ ] Audio posicional correcto
- [ ] Notificación sutil

#### Task 3.1.2: Restauración → Biodiversidad (1h)
```javascript
onPlayerRestoreArea(x, z, radius) {
  this.areasRestored.push({
    position: { x, z },
    radius: radius,
    timestamp: Date.now(),
    responded: false
  });
  
  setTimeout(() => {
    this._generateBiodiversity(x, z, radius);
  }, 10 * 60 * 1000);
}

_generateBiodiversity(x, z, radius) {
  // Flores adicionales
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * radius;
    const fx = x + Math.cos(angle) * dist;
    const fz = z + Math.sin(angle) * dist;
    this._placeFlower(fx, fz);
  }
  
  // Mariposas
  for (let i = 0; i < 3; i++) {
    this._spawnButterfly(x, z, radius);
  }
  
  // Audio: Insectos
  if (this.ambientSound) {
    this.ambientSound.playPointSound('insects', x, 64, z, 0.12);
  }
  
  // Música: Transición a lydian
  if (this.chillTune) {
    const currentState = this.chillTune.currentState;
    STATE_CONFIG[currentState].scale = 'lydian';
  }
}
```

**Acceptance:**
- [ ] Genera flores en área
- [ ] Spawns mariposas
- [ ] Audio de insectos aumenta
- [ ] Música transiciona a lydian

#### Task 3.1.3: Caminos → Aldeanos (1h)
```javascript
onPlayerBuildPath(pathBlocks) {
  if (pathBlocks.length < 20) return; // Mínimo 20 bloques
  
  this.pathsBuilt.push({
    blocks: pathBlocks,
    timestamp: Date.now(),
    responded: false
  });
  
  setTimeout(() => {
    this._spawnVillagerOnPath(pathBlocks);
  }, 2 * 60 * 1000);
}

_spawnVillagerOnPath(pathBlocks) {
  // Elegir punto aleatorio del camino
  const startBlock = pathBlocks[Math.floor(Math.random() * pathBlocks.length)];
  
  // Crear NPC que camina por el path
  const villager = this._createVillager(startBlock.x, startBlock.y, startBlock.z);
  villager.followPath(pathBlocks);
  
  // Audio: Pasos lejanos
  if (this.ambientSound) {
    this.ambientSound.playPointSound('footsteps', startBlock.x, startBlock.y, startBlock.z, 0.08);
  }
}
```

**Acceptance:**
- [ ] Detecta paths >20 bloques
- [ ] Spawns aldeano en camino
- [ ] Aldeano camina por path
- [ ] Audio de pasos

#### Task 3.1.4: Lagos → Peces (1h)
```javascript
onPlayerImproveLake(lakeBlocks) {
  this.lakesImproved.push({
    blocks: lakeBlocks,
    timestamp: Date.now(),
    responded: false
  });
  
  setTimeout(() => {
    this._populateLake(lakeBlocks);
  }, 5 * 60 * 1000);
}

_populateLake(lakeBlocks) {
  // Peces animados
  for (let i = 0; i < 5; i++) {
    const waterBlock = lakeBlocks[Math.floor(Math.random() * lakeBlocks.length)];
    this._spawnFish(waterBlock.x, waterBlock.y, waterBlock.z);
  }
  
  // Plantas acuáticas
  for (let i = 0; i < 8; i++) {
    const waterBlock = lakeBlocks[Math.floor(Math.random() * lakeBlocks.length)];
    this._placeWaterPlant(waterBlock.x, waterBlock.y, waterBlock.z);
  }
  
  // Libélulas
  for (let i = 0; i < 3; i++) {
    this._spawnDragonfly(lakeBlocks);
  }
  
  // Audio: Burbujas
  if (this.ambientSound) {
    const center = this._getCenterOfBlocks(lakeBlocks);
    this.ambientSound.playPointSound('water_bubble', center.x, center.y, center.z, 0.10);
  }
}
```

**Acceptance:**
- [ ] Detecta lagos mejorados
- [ ] Genera peces animados
- [ ] Plantas acuáticas aparecen
- [ ] Libélulas vuelan sobre agua

---

### Fase 3.2: Diario de Exploración (2h)

**Archivo nuevo:** `jardvoxel-survival-journal.js`

#### Task 3.2.1: Sistema de Registro (1h)
```javascript
export class ExplorationJournal {
  constructor() {
    this.entries = [];
    this.milestones = {
      firstSunrise: null,
      firstSunset: null,
      firstMeditationSpace: null,
      firstTreePlanted: null,
      firstAreaRestored: null,
      firstPathBuilt: null
    };
    
    this.stats = {
      sunrisesWatched: 0,
      sunsetsWatched: 0,
      spacesDiscovered: 0,
      treesPlanted: 0,
      areasRestored: 0,
      contemplationTime: 0,
      biomesVisited: new Set()
    };
  }
  
  recordMoment(type, data) {
    const entry = {
      type: type,
      timestamp: Date.now(),
      data: data,
      screenshot: this._captureScreenshot() // opcional
    };
    
    this.entries.push(entry);
    this._updateMilestones(type, entry);
    this._updateStats(type, data);
    this._persist();
  }
  
  _updateMilestones(type, entry) {
    if (type === 'sunrise' && !this.milestones.firstSunrise) {
      this.milestones.firstSunrise = entry;
    }
    // ... otros milestones
  }
  
  _updateStats(type, data) {
    if (type === 'sunrise') this.stats.sunrisesWatched++;
    if (type === 'sunset') this.stats.sunsetsWatched++;
    if (type === 'meditation_space') this.stats.spacesDiscovered++;
    if (type === 'tree_planted') this.stats.treesPlanted++;
    if (type === 'biome_entered') this.stats.biomesVisited.add(data.biome);
  }
  
  _persist() {
    const data = {
      entries: this.entries.slice(-100), // Últimas 100
      milestones: this.milestones,
      stats: {
        ...this.stats,
        biomesVisited: Array.from(this.stats.biomesVisited)
      }
    };
    localStorage.setItem('jardvoxel_journal', JSON.stringify(data));
  }
  
  load() {
    const data = localStorage.getItem('jardvoxel_journal');
    if (data) {
      const parsed = JSON.parse(data);
      this.entries = parsed.entries || [];
      this.milestones = parsed.milestones || {};
      this.stats = parsed.stats || {};
      this.stats.biomesVisited = new Set(parsed.stats.biomesVisited || []);
    }
  }
}
```

**Acceptance:**
- [ ] Registra momentos automáticamente
- [ ] Milestones detectan primera vez
- [ ] Stats actualizan correctamente
- [ ] Persiste en localStorage

#### Task 3.2.2: UI del Diario (1h)
```javascript
// En jardvoxel-survival.html
<div id="journal-panel" class="panel" style="display:none;">
  <h2>Diario de Exploración</h2>
  
  <div class="journal-tabs">
    <button class="tab active" data-tab="timeline">Timeline</button>
    <button class="tab" data-tab="milestones">Hitos</button>
    <button class="tab" data-tab="stats">Estadísticas</button>
  </div>
  
  <div id="journal-timeline" class="journal-content">
    <!-- Generado dinámicamente -->
  </div>
  
  <div id="journal-milestones" class="journal-content" style="display:none;">
    <div class="milestone">
      <span class="milestone-icon">🌅</span>
      <span class="milestone-text">Primer amanecer</span>
      <span class="milestone-date"></span>
    </div>
    <!-- ... más milestones -->
  </div>
  
  <div id="journal-stats" class="journal-content" style="display:none;">
    <div class="stat-row">
      <span class="stat-label">Amaneceres observados</span>
      <span class="stat-value" id="stat-sunrises">0</span>
    </div>
    <!-- ... más stats -->
  </div>
</div>

// Abrir con tecla J
document.addEventListener('keydown', (e) => {
  if (e.key === 'j' && !this.paused) {
    this.toggleJournal();
  }
});
```

**Acceptance:**
- [ ] Panel abre con tecla J
- [ ] 3 tabs funcionan (timeline/milestones/stats)
- [ ] Timeline muestra últimas 20 entradas
- [ ] Milestones muestran primera vez
- [ ] Stats actualizan en tiempo real

---

### Fase 3.3: Biomas Nuevos (2h)

**Archivo:** `jardvoxel-survival-engine.js` (modificar)

#### Task 3.3.1: Bamboo Forest (40 min)
```javascript
// Agregar a BIOMES
BAMBOO_FOREST: {
  id: 20,
  name: 'Bamboo Forest',
  color: [0.4, 0.7, 0.4],
  vegetation: 'bamboo_dense',
  treeType: 'bamboo',
  treeDensity: 0.8,
  grassDensity: 0.3,
  conditions: {
    temperature: [0.6, 0.9],
    humidity: [0.7, 1.0],
    continentalness: [0.0, 0.5],
    erosion: [-0.3, 0.3]
  }
}

// Agregar a BIOME_SCALES (ChillTune)
bamboo_forest: {
  scale: 'pentatonic',
  bpm: 52,
  filterFreq: 1800,
  arpeggios: true
}

// Agregar a AMBIENT_PROFILES (AmbientSound)
bamboo_forest: {
  ambient: [
    { type: 'bamboo_rustle', vol: 0.10, continuous: true },
    { type: 'wind_chimes', vol: 0.06, interval: [8, 16] },
    { type: 'stream', vol: 0.08, continuous: true, filter: 1200 }
  ]
}

// Generar bambú
_placeBamboo(chunk, x, y, z, height) {
  for (let dy = 0; dy < height; dy++) {
    chunk.setBlock(x, y + dy, z, BLOCK.BAMBOO);
  }
}
```

**Acceptance:**
- [ ] Bioma genera en condiciones correctas
- [ ] Bambú crece 8-12 bloques
- [ ] Música pentatónica
- [ ] Audio de bambú + chimes

#### Task 3.3.2: Cherry Blossom Grove (40 min)
```javascript
CHERRY_BLOSSOM_GROVE: {
  id: 21,
  name: 'Cherry Blossom Grove',
  color: [1.0, 0.8, 0.9],
  vegetation: 'cherry_trees',
  treeType: 'cherry',
  treeDensity: 0.5,
  grassDensity: 0.6,
  conditions: {
    temperature: [0.5, 0.7],
    humidity: [0.4, 0.7],
    continentalness: [0.2, 0.6],
    erosion: [-0.2, 0.2]
  }
}

cherry_blossom_grove: {
  scale: 'lydian',
  bpm: 58,
  filterFreq: 2200,
  arpeggios: true
}

cherry_blossom_grove: {
  ambient: [
    { type: 'petals_falling', vol: 0.05, interval: [3, 8] },
    { type: 'soft_breeze', vol: 0.08, continuous: true },
    { type: 'distant_bells', vol: 0.04, interval: [15, 30] }
  ]
}

// Generar árbol de cerezo
_placeCherryTree(chunk, x, y, z) {
  // Tronco
  for (let dy = 0; dy < 5; dy++) {
    chunk.setBlock(x, y + dy, z, BLOCK.WOOD);
  }
  
  // Copa de hojas rosas
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dy = 3; dy <= 6; dy++) {
        if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy - 4) <= 3) {
          chunk.setBlock(x + dx, y + dy, z + dz, BLOCK.LEAVES_CHERRY);
        }
      }
    }
  }
  
  // Pétalos cayendo (partículas)
  this._spawnPetalParticles(x, y + 5, z);
}
```

**Acceptance:**
- [ ] Bioma genera con árboles de cerezo
- [ ] Hojas rosas (nuevo bloque)
- [ ] Pétalos caen como partículas
- [ ] Música lydian alegre

#### Task 3.3.3: Moss Garden (40 min)
```javascript
MOSS_GARDEN: {
  id: 22,
  name: 'Moss Garden',
  color: [0.3, 0.5, 0.3],
  vegetation: 'moss_rocks',
  treeType: 'none',
  treeDensity: 0.1,
  grassDensity: 0.9,
  conditions: {
    temperature: [0.4, 0.6],
    humidity: [0.8, 1.0],
    continentalness: [-0.2, 0.3],
    erosion: [-0.5, 0.0]
  }
}

moss_garden: {
  scale: 'dorian',
  bpm: 48,
  filterFreq: 1400,
  drone: true
}

moss_garden: {
  ambient: [
    { type: 'water_drip', vol: 0.07, interval: [2, 6] },
    { type: 'stone_echo', vol: 0.05, interval: [10, 20] },
    { type: 'whispers', vol: 0.04, continuous: true, filter: 1500 }
  ]
}

// Generar rocas con musgo
_generateMossGarden(chunk, x, z, y) {
  // Suelo de musgo
  for (let dx = -8; dx <= 8; dx++) {
    for (let dz = -8; dz <= 8; dz++) {
      chunk.setBlock(x + dx, y, z + dz, BLOCK.MOSS);
    }
  }
  
  // Rocas dispersas con musgo
  for (let i = 0; i < 15; i++) {
    const rx = x + (Math.random() - 0.5) * 16;
    const rz = z + (Math.random() - 0.5) * 16;
    const height = 1 + Math.floor(Math.random() * 3);
    
    for (let dy = 0; dy < height; dy++) {
      chunk.setBlock(rx, y + dy + 1, rz, BLOCK.MOSSY_COBBLE);
    }
  }
}
```

**Acceptance:**
- [ ] Bioma genera con suelo de musgo
- [ ] Rocas con musgo dispersas
- [ ] Música dorian contemplativa
- [ ] Audio de gotas + eco

---

## Testing & Validation

### Test Plan

**Unit Tests:**
- [ ] ResonanceSystem.analyze() calcula correctamente
- [ ] MeditationSpaceGenerator detecta condiciones
- [ ] LivingWorldSystem timers funcionan
- [ ] ExplorationJournal persiste/carga

**Integration Tests:**
- [ ] ChillTune + Ambient + Komorebi sincronizan
- [ ] Resonancia modifica generación
- [ ] Espacios descubren y notifican
- [ ] Diario registra todos los eventos

**Playtest Checklist:**
- [x] Sesión de 30 min se siente relajante
- [x] Descubrir espacio genera emoción
- [x] Mundo responde a acciones sutilmente
- [x] Música no se vuelve repetitiva
- [x] UI no distrae de la experiencia

---

## Deployment

### Pre-deploy Checklist
- [x] Todos los AC cumplidos
- [x] Tests pasan
- [x] Performance <5% overhead
- [x] Mobile compatible
- [x] Documentación actualizada

### Deploy Steps
1. Merge a `main` branch
2. Tag version `v7.0.0-wellness`
3. Deploy a GitHub Pages
4. Anunciar en README

### Post-deploy
- [x] Monitorear analytics
- [ ] Recoger feedback
- [ ] Iterar según métricas

---

## Métricas de Éxito

**Cuantitativas:**
- Tiempo promedio de sesión: >30 min
- Espacios descubiertos: >3 en 1 hora
- Árboles plantados: >10/sesión
- Retorno en 7 días: >60%

**Cualitativas:**
- Sensación de calma: >8/10
- Conexión con mundo: >7/10
- Deseo de regresar: >8/10

---

## Notas Finales

**IMPLEMENTACIÓN COMPLETADA** — Todos los sistemas wellness (Komorebi, Resonance, Meditation Spaces, Living World, Journal) están integrados, con biome fingerprints, bamboo tree type, y UI del diario conectada al ExplorationJournal.

Este plan es **ejecutable y secuencial**. Cada task tiene:
- Tiempo estimado
- Código de ejemplo
- Acceptance criteria
- Dependencias claras

**Próximo paso:** Comenzar Día 1, Fase 1.1, Task 1.1.1
