# JardVoxel — PRD: Cuerpo Procedural del Personaje

**Fecha**: 2026-06-26
**Autor**: ja
**Estado**: ✅ Completado (v5.0.2 — SPEC-067)
**Version objetivo**: v4.4.0
**Spec**: SPEC-067

---

## Resumen Ejecutivo

JardVoxel Survival actualmente controla al jugador como **camara en primera persona** sin ningun modelo 3D visible. No hay cuerpo, brazos, piernas ni cabeza. El jugador es invisible.

Este PRD define la implementacion de un **sistema de generacion procedural de cuerpo humanoide** para el personaje del jugador. Cada personaje sera **unico** gracias a un seed procedural que determina: complexion, colores de piel/cabello/ropa, proporciones corporales, rasgos faciales y accesorios. El sistema incluye **vista en tercera persona** (tecla `V` para alternar) y **animaciones de caminado/brazos** sincronizadas con el movimiento.

### Tabla de features

| Componente | Descripcion | Estado |
|-----------|-------------|--------|
| Modelo humanoide procedural | Cabeza, torso, brazos, piernas con BoxGeometry | Pendiente |
| Seed procedural unico | Cada personaje generado es unico por seed | Pendiente |
| Variacion de complexion | Delgado/medio/robusto (ancho de torso/brazos) | Pendiente |
| Colores procedurales | Piel, cabello, ojos, camisa, pantalon, zapatos | Pendiente |
| Estilos de cabello | 6+ estilos: calvo, corto, largo, mohawk, gorro, casco | Pendiente |
| Rasgos faciales | Ojos (color+tamano), cejas, barba opcional | Pendiente |
| Accesorios procedurales | Gafas, gorro, capa, bandana (30% probabilidad) | Pendiente |
| Vista tercera persona | Toggle con tecla V, camara detras del jugador | Pendiente |
| Animacion de caminado | Brazos y piernas se balancean al moverse | Pendiente |
| Animacion de brazo al romper | Brazo derecho se levanta al minar | Pendiente |
| Sombra del cuerpo | Shadow mesh debajo del jugador | Pendiente |
| Persistencia del seed | Guardar seed del personaje en savegame | Pendiente |
| Preview en pantalla de carga | Mostrar personaje generado en loading screen | Pendiente |

---

## SPEC-067: Procedural Player Body

**Prioridad**: Media
**Estimacion**: 8h
**Dependencias**: Ninguna
**Bloquea a**: Ninguna

### Problema

En `jardvoxel-survival-gameplay.js`:
- `PlayerController` (linea 294) solo maneja `camera.position` y `camera.rotation` — **no existe ningun mesh del jugador**
- `update()` (linea 335) copia posicion a la camara pero no renderiza ningun cuerpo
- No hay vista en tercera persona — el jugador no puede ver su personaje
- En multiplayer futuro (o screenshots), el jugador seria invisible

### Arquitectura propuesta

```
Procedural Body System
├── CharacterGenerator (clase)
│   ├── generate(seed) → THREE.Group
│   ├── _generateDNA(seed) → CharacterDNA
│   ├── _buildHead(dna) → THREE.Mesh
│   ├── _buildTorso(dna) → THREE.Mesh
│   ├── _buildArms(dna) → { left, right }
│   ├── _buildLegs(dna) → { left, right }
│   ├── _buildHair(dna) → THREE.Mesh
│   ├── _buildAccessories(dna) → THREE.Mesh[]
│   └── _buildFace(dna) → THREE.Mesh[]
├── CharacterDNA (tipo)
│   ├── seed: number
│   ├── bodyType: 'slim' | 'normal' | 'stocky'
│   ├── skinColor: number (hex)
│   ├── hairStyle: 'bald' | 'short' | 'long' | 'mohawk' | 'bun' | 'crew'
│   ├── hairColor: number (hex)
│   ├── eyeColor: number (hex)
│   ├── eyeSize: number (0.08 - 0.14)
│   ├── shirtColor: number (hex)
│   ├── pantsColor: number (hex)
│   ├── shoeColor: number (hex)
│   ├── hasBeard: boolean
│   ├── beardColor: number (hex)
│   ├── hasGlasses: boolean
│   ├── hasHat: boolean
│   ├── hatColor: number (hex)
│   ├── hasCape: boolean
│   ├── capeColor: number (hex)
│   ├── proportions: { head, torso, arms, legs }
│   └── accessory: 'none' | 'glasses' | 'bandana' | 'earrings'
├── CharacterAnimator (clase)
│   ├── update(dt, player, body)
│   ├── _animateWalk(dt, body, moving)
│   ├── _animateArmSwing(dt, body, mining)
│   ├── _animateIdle(dt, body)
│   └── _animateJump(body, airborne)
├── ThirdPersonCamera (clase)
│   ├── distance: 3.5
│   ├── height: 1.2
│   ├── smoothing: 0.15
│   ├── update(camera, player, body)
│   └── collisionCheck(world) → ajustar distancia
└── Integracion PlayerController
    ├── this.body: THREE.Group (añadido a escena)
    ├── this.viewMode: 'first' | 'third'
    ├── this.animator: CharacterAnimator
    └── toggleView() → alternar vista
```

### Detalle de generacion procedural

#### 1. CharacterDNA — Seed → Atributos

Se usa un PRNG (Xorshift128+ ya existente en el engine) para derivar todos los atributos del seed:

```javascript
function generateDNA(seed) {
  const rng = new PRNG(seed);

  // Complexion (30% slim, 50% normal, 20% stocky)
  const bodyRoll = rng.next();
  const bodyType = bodyRoll < 0.3 ? 'slim' : bodyRoll < 0.8 ? 'normal' : 'stocky';

  // Skin: paleta de 12 tonos realistas
  const skinPalette = [
    0xfdf0d4, 0xf6c7a0, 0xeab98c, 0xd4a373,
    0xc69368, 0xa67c52, 0x8d6346, 0x6b4a2f,
    0x5a3a24, 0x4a2c18, 0x3a2010, 0x2a1808,
  ];
  const skinColor = skinPalette[Math.floor(rng.next() * skinPalette.length)];

  // Hair: 6 estilos + colores
  const hairStyles = ['bald', 'short', 'long', 'mohawk', 'bun', 'crew'];
  const hairStyle = hairStyles[Math.floor(rng.next() * hairStyles.length)];
  const hairPalette = [0x1a1a1a, 0x3b2a1a, 0x6b4a2a, 0x8b6b3a, 0xc0a050, 0xd0a040, 0x8a2020, 0xaaaaaa, 0xcc4444];
  const hairColor = hairPalette[Math.floor(rng.next() * hairPalette.length)];

  // Eyes: 6 colores
  const eyePalette = [0x4a7a9a, 0x2a5a3a, 0x6a4a2a, 0x1a1a1a, 0x6a8a6a, 0x4a3a6a];
  const eyeColor = eyePalette[Math.floor(rng.next() * eyePalette.length)];
  const eyeSize = 0.08 + rng.next() * 0.06;

  // Clothing: paletas variadas
  const shirtPalette = [0x7C3AED, 0x2563eb, 0x059669, 0xdc2626, 0xea580c, 0x713f12, 0x1e3a8a, 0x831843, 0x365314, 0x155e75];
  const pantsPalette = [0x1e293b, 0x292524, 0x44403c, 0x1c1917, 0x3730a3, 0x552202, 0x14532d, 0x4a044e];
  const shoePalette = [0x1a1a1a, 0x3a2a1a, 0x5a3a2a, 0x2a2a2a, 0x4a3a2a];

  // Beard: 35% probabilidad (solo si no es calvo)
  const hasBeard = hairStyle !== 'bald' && rng.next() < 0.35;

  // Accessories: 30% probabilidad cada uno
  const hasGlasses = rng.next() < 0.3;
  const hasHat = rng.next() < 0.2 && hairStyle !== 'mohawk';
  const hasCape = rng.next() < 0.15;

  // Proporciones: variaciones sutiles ±15%
  const proportions = {
    head: 0.85 + rng.next() * 0.3,
    torso: 0.9 + rng.next() * 0.2,
    arms: 0.9 + rng.next() * 0.2,
    legs: 0.9 + rng.next() * 0.2,
  };

  return { seed, bodyType, skinColor, hairStyle, hairColor, eyeColor, eyeSize,
           shirtColor, pantsColor, shoeColor, hasBeard, beardColor: hairColor,
           hasGlasses, hasHat, hatColor, hasCape, capeColor, proportions };
}
```

#### 2. Construcción del modelo — BoxGeometry por partes

Todas las partes usan `THREE.BoxGeometry` + `THREE.MeshLambertMaterial` (consistente con mobs existentes):

```
Estructura del THREE.Group (body):

  Group
  ├── head (Group)
  │   ├── skull: Box(w*0.5, h*0.5, w*0.5) — skinColor
  │   ├── hair: varía por estilo (ver abajo)
  │   ├── leftEye: Box(eyeSize, eyeSize*0.6, 0.02) — eyeColor
  │   ├── rightEye: Box(eyeSize, eyeSize*0.6, 0.02) — eyeColor
  │   ├── leftBrow: Box(eyeSize*1.2, 0.02, 0.02) — hairColor
  │   ├── rightBrow: Box(eyeSize*1.2, 0.02, 0.02) — hairColor
  │   ├── beard: Box(w*0.45, h*0.3, 0.05) — beardColor (si hasBeard)
  │   ├── glasses: Box(w*0.55, 0.08, 0.03) — 0x222222 (si hasGlasses)
  │   └── hat: varía (si hasHat)
  ├── torso: Box(w, h*0.35, w*0.5) — shirtColor
  ├── leftArm: Group
  │   └── upperArm: Box(w*0.25, h*0.35, w*0.25) — shirtColor (manga) + skinColor (mano)
  ├── rightArm: Group
  │   └── upperArm: Box(w*0.25, h*0.35, w*0.25) — shirtColor (manga) + skinColor (mano)
  ├── leftLeg: Group
  │   └── leg: Box(w*0.3, h*0.4, w*0.3) — pantsColor + shoeColor (pie)
  ├── rightLeg: Group
  │   └── leg: Box(w*0.3, h*0.4, w*0.3) — pantsColor + shoeColor (pie)
  └── cape: PlaneGeometry (si hasCape) — capeColor
```

#### 3. Estilos de cabello (6 variantes)

| Estilo | Construcción |
|--------|-------------|
| `bald` | Sin mesh de cabello |
| `short` | Box plano sobre la cabeza (w*0.52, 0.08, d*0.52) |
| `long` | Box que cae hasta los hombros (w*0.52, h*0.4, d*0.52) + dos laterales |
| `mohawk` | Box vertical centrado (w*0.15, h*0.25, d*0.3) — color llamativo |
| `bun` | Esfera (BoxGeometry) encima de la cabeza + cabello corto base |
| `crew` | Box muy fino pegado al craneo (w*0.5, 0.04, d*0.5) |

#### 4. Complexion — Variación de proporciones

| Tipo | Torso width | Arm width | Leg width | Descripción |
|------|-------------|-----------|-----------|-------------|
| `slim` | 0.35 | 0.18 | 0.22 | Delgado, brazos finos |
| `normal` | 0.45 | 0.22 | 0.28 | Proporción estándar |
| `stocky` | 0.55 | 0.28 | 0.34 | Robusto, brazos gruesos |

#### 5. Accesorios (probabilidades)

| Accesorio | Prob. | Construcción |
|-----------|-------|-------------|
| Gafas | 30% | Box horizontal sobre ojos + dos lentes |
| Gorro | 20% | Box sobre cabeza + visera delantera |
| Capa | 15% | PlaneGeometry detrás del torso, animación de flutter |

#### 6. Paleta de colores — Rango procedural

**Piel**: 12 tonos desde muy claro a muy oscuro
**Cabello**: 9 colores (negro, castaño, rubio, pelirrojo, canoso, etc.)
**Ojos**: 6 colores (azul, verde, marrón, negro, avellana, violeta)
**Camisa**: 10 colores variados
**Pantalón**: 8 colores tierra/oscuros
**Zapatos**: 5 colores marrones/negros

**Combinaciones únicas teóricas**: 12 × 9 × 6 × 10 × 8 × 5 × 6 × 3 × 2 × 2 × 2 = **~37 millones**

### Vista en tercera persona

#### Toggle con tecla V

```javascript
// En PlayerController
toggleView() {
  this.viewMode = this.viewMode === 'first' ? 'third' : 'first';
  if (this.viewMode === 'third') {
    this.body.visible = true;
    // Mover cámara detrás del jugador
  } else {
    // Ocultar cabeza en primera persona para no tapar la vista
    this.body.head.visible = false;
    // Cámara en posición del jugador
  }
}
```

#### Cámara tercera persona

- **Distancia**: 3.5 bloques detrás
- **Altura**: +1.2 sobre posición del jugador
- **Smoothing**: lerp 0.15 para movimiento suave
- **Collision**: raycast desde jugador hacia cámara, reducir distancia si hay bloque
- **Sensibilidad**: misma que primera persona (yaw/pitch)

#### Primera persona

- **Cabeza invisible**: `body.head.visible = false` para no tapar vista
- **Brazo derecho visible**: se mantiene visible para animación de minar
- **Resto del cuerpo**: invisible o visible según preferencia

### Animaciones

#### Walk cycle

```javascript
_animateWalk(dt, body, moving) {
  if (!moving) {
    // Reset a posición neutral con lerp
    body.leftArm.rotation.x = lerp(body.leftArm.rotation.x, 0, 0.2);
    body.rightArm.rotation.x = lerp(body.rightArm.rotation.x, 0, 0.2);
    body.leftLeg.rotation.x = lerp(body.leftLeg.rotation.x, 0, 0.2);
    body.rightLeg.rotation.x = lerp(body.rightLeg.rotation.x, 0, 0.2);
    return;
  }

  const phase = this.walkPhase;
  const swing = 0.5; // amplitud en radianes

  body.leftArm.rotation.x = Math.sin(phase) * swing;
  body.rightArm.rotation.x = -Math.sin(phase) * swing;
  body.leftLeg.rotation.x = -Math.sin(phase) * swing;
  body.rightLeg.rotation.x = Math.sin(phase) * swing;

  // Bob vertical sutil
  body.position.y = this.baseY + Math.abs(Math.sin(phase)) * 0.04;
}
```

#### Arm swing (minar)

```javascript
_animateArmSwing(dt, body, mining) {
  if (mining) {
    const swing = Math.sin(this.minePhase * 3) * 0.8;
    body.rightArm.rotation.x = -1.2 + swing;
  }
}
```

#### Idle breathing

```javascript
_animateIdle(dt, body) {
  const breath = Math.sin(this.idleTime * 1.5) * 0.02;
  body.torso.scale.y = 1 + breath;
}
```

#### Cape flutter (si tiene capa)

```javascript
if (body.cape) {
  body.cape.rotation.x = 0.1 + Math.sin(this.idleTime * 3) * 0.05;
  // Más flutter cuando se mueve
  if (moving) {
    body.cape.rotation.x += Math.sin(this.walkPhase * 2) * 0.15;
  }
}
```

### Integración con código existente

#### PlayerController (jardvoxel-survival-gameplay.js)

```javascript
// En constructor:
this.body = null;        // THREE.Group del personaje
this.viewMode = 'first'; // 'first' | 'third'
this.animator = null;    // CharacterAnimator
this.characterSeed = 0;  // Seed del personaje

// En spawn() o initPlayer():
this.characterSeed = Math.floor(Math.random() * 2147483647);
this.body = CharacterGenerator.generate(this.characterSeed);
scene.add(this.body);
this.animator = new CharacterAnimator();

// En update():
this.animator.update(dt, this, this.body);
if (this.viewMode === 'third') {
  // Cámara detrás
  const offset = new THREE.Vector3(0, 1.2, 3.5);
  offset.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0));
  this.camera.position.copy(this.position).add(offset);
} else {
  this.camera.position.copy(this.position);
  this.body.head.visible = false;
}
this.body.position.copy(this.position);
this.body.rotation.y = this.yaw;
```

#### Save/Load (jardvoxel-survival-save.js)

```javascript
// En save():
data.characterSeed = this.player.characterSeed;

// En load():
if (d.characterSeed !== undefined) {
  this.player.characterSeed = d.characterSeed;
  // Regenerar cuerpo con el seed guardado
}
```

#### Loading screen preview

```javascript
// En loading screen, mostrar preview del personaje:
const previewDNA = CharacterGenerator.generateDNA(seed);
const previewBody = CharacterGenerator.generate(seed);
// Posicionar en escena temporal o renderizar en canvas separado
```

### Archivos a crear

| Archivo | Descripción | Líneas est. |
|---------|-------------|-------------|
| `core/jardvoxel-survival-character.js` | CharacterGenerator + CharacterDNA + CharacterAnimator | ~350 |
| `core/jardvoxel-survival-thirdperson.js` | ThirdPersonCamera con collision | ~120 |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `core/jardvoxel-survival-gameplay.js` | PlayerController: añadir body, viewMode, animator |
| `jardvoxel-survival.html` | Import character module, tecla V toggle, loading preview |
| `core/jardvoxel-survival-save.js` | Guardar/cargar characterSeed |

### Acceptance Criteria

- [ ] `CharacterGenerator.generate(seed)` produce un `THREE.Group` con cabeza, torso, 2 brazos, 2 piernas
- [ ] Dos seeds diferentes producen personajes visualmente distintos
- [ ] El cuerpo se renderiza correctamente en la escena
- [ ] Tecla V alterna entre primera y tercera persona
- [ ] En tercera persona, la cámara está detrás del jugador con distancia 3.5
- [ ] En tercera persona, la cámara no atraviesa bloques (collision check)
- [ ] En primera persona, la cabeza no es visible (no tapa la vista)
- [ ] Al caminar, brazos y piernas se balancean con animación sinusoidal
- [ ] Al minar, el brazo derecho hace swing de minado
- [ ] Al estar quieto, hay animación sutil de respiración
- [ ] El seed del personaje se guarda en savegame y se restaura al cargar
- [ ] La capa (si existe) flutters al moverse
- [ ] 6 estilos de cabello se renderizan correctamente
- [ ] 3 complexions (slim/normal/stocky) se distinguen visualmente
- [ ] Accesorios (gafas, gorro, capa) se renderizan correctamente
- [ ] Performance: el cuerpo del jugador no baja FPS más de 2 frames
- [ ] El cuerpo rota con el yaw del jugador
- [ ] Loading screen muestra preview del personaje generado

### Restricciones técnicas

- **Sin dependencias externas**: solo Three.js (ya incluido)
- **BoxGeometry only**: consistente con estética voxel de los mobs
- **MeshLambertMaterial**: mismo material que mobs para iluminación consistente
- **Performance**: máximo ~30 meshes por personaje (sin LOD necesario)
- **Mobile**: el cuerpo debe renderizar sin impacto en móviles
- **Sin texturas**: todo con colores planos (estilo voxel)

### Plan de implementación

| Fase | Tarea | Tiempo est. |
|------|-------|-------------|
| 1 | CharacterGenerator + DNA + paletas | 2h |
| 2 | Construcción de mesh (head, torso, arms, legs) | 2h |
| 3 | Estilos de cabello + accesorios + rasgos faciales | 1.5h |
| 4 | CharacterAnimator (walk, idle, arm swing, cape) | 1h |
| 5 | ThirdPersonCamera + collision | 0.5h |
| 6 | Integración con PlayerController + tecla V | 0.5h |
| 7 | Save/load characterSeed | 0.25h |
| 8 | Loading screen preview | 0.25h |
| **Total** | | **~8h** |

### Futuras extensiones (fuera de scope)

- **Skins de armadura**: el cuerpo refleja la armadura equipada (helmet, chestplate, etc.)
- **Personalización manual**: UI para elegir colores/estilos en lugar de solo procedural
- **Multiplayer**: otros jugadores ven tu cuerpo procedural
- **Emotes**: animaciones especiales (saludar, sentarse, bailar)
- **Dano visual**: parpadeo rojo al recibir dano
- **Cambio de ropa**: vestir diferentes colores según armadura equipada

---

## Referencias

- `core/jardvoxel-survival-mobs.js:128-180` — Patrón de `_buildMesh()` con BoxGeometry
- `core/jardvoxel-survival-gameplay.js:294-399` — `PlayerController` actual (solo cámara)
- `core/jardvoxel-survival-engine.js` — PRNG (Xorshift128+) para generación procedural
- `docs/ARCHITECTURE.md` — Arquitectura general del motor
