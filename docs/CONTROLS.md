# JardVoxel — Controles y Mecanicas

## Controles de Teclado

| Tecla | Accion |
|-------|--------|
| **W** | Mover adelante |
| **A** | Mover izquierda |
| **S** | Mover atras |
| **D** | Mover derecha |
| **Space** | Saltar (en suelo) / Subir (en vuelo) |
| **Shift** | Correr (sprint) / Bajar (en vuelo) |
| **Ctrl** | Crouch (agacharse) |
| **F** | Toggle modo vuelo |
| **E** | Toggle inventario (SPEC-033) |
| **C** | Toggle Creativo/Survival (SPEC-033) |
| **1-9** | Seleccionar slot del hotbar |
| **ESC** | Pausar (liberar cursor) |

## Controles de Mouse

| Accion | Efecto |
|--------|--------|
| **Click izquierdo** | Romper bloque mirado |
| **Click derecho** | Colocar bloque seleccionado |
| **Click en pantalla** | Activar pointer lock (iniciar juego) |
| **Movimiento mouse** | Mirar alrededor (pointer lock activo) |

## Mecanicas de Gameplay

### Romper Bloques

- Raycast DDA voxel desde la camara (max 6 bloques de distancia)
- Elimina el bloque mirado
- **Bedrock no se puede romper**
- Agua y lava son ignoradas por el raycast
- **Tiempo de minado** varia segun BLOCK_HARDNESS (SPEC-033)
- Overlay visual de crack durante el minado
- **Modo Creativo**: minado instantaneo
- **Modo Survival**: tiempo real segun dureza del bloque

### Colocar Bloques

- Raycast encuentra bloque solido mirado
- Coloca bloque en la cara adyacente (usa la normal de la cara golpeada)
- **No coloca dentro del jugador** (verifica posicion del jugador)
- Usa el bloque seleccionado en el hotbar
- **Inventario completo** (tecla E): grid con todos los bloques colocables

### Colisiones

- Jugador: AABB de 0.6x1.8x0.6 bloques (width 0.3 por lado)
- Colision voxel: verifica todos los bloques que el AABB solapa
- Movimiento horizontal y vertical verificados independientemente (wall sliding)

### Fisica

| Parametro | Valor |
|-----------|-------|
| Velocidad caminar | 5 bloques/seg |
| Velocidad correr | 10 bloques/seg |
| Velocidad nado | 3 bloques/seg |
| Gravedad | 28 bloques/seg² |
| Velocidad salto | 9 bloques/seg |
| Altura jugador | 1.8 bloques |
| Ancho jugador | 0.3 bloques (por lado) |

### Nado (SPEC-034)

- Flotabilidad en agua (impulso hacia arriba)
- Velocidad reducida en agua (3 bloques/seg vs 5 normal)
- Sonido de splash al entrar/salir del agua

### Sprint con Stamina (SPEC-034)

- Shift para correr (10 bloques/seg vs 5 normal)
- Barra de stamina que se consume al correr
- Stamina se regenera al dejar de correr

### Crouch (SPEC-034)

- Ctrl para agacharse
- Velocidad reducida
- Anti-caida: no cae de bordes mientras esta agachado

### Fall Damage (SPEC-034)

- Danio por caida si la distancia es mayor a N bloques
- Sin danio en modo vuelo
- Muerte si el danio es fatal → death screen

### Modo Vuelo

- Toggle con tecla **F**
- Sin gravedad
- Space sube, Shift baja
- Mismo speed horizontal
- Sin fall damage mientras vuela

### Spawn

- Busca terreno sobre nivel del mar (height > WATER_LEVEL + 3)
- Busqueda en espiral desde (0,0) hasta radio 500
- Si no encuentra, spawn sobre agua a altura 40
- Pre-genera 5x5 chunks alrededor del spawn

### Raycast Voxel (DDA)

Algoritmo Digital Differential Analyzer para raycast en grid voxel:

```
1. Calcular direccion del rayo desde camara
2. Avanzar bloque por bloque en el grid
3. En cada paso, verificar si el bloque es solido
4. Trackear que cara fue golpeada (normal)
5. Max 6 bloques de distancia
```

### Block Highlight

- Wireframe negro (EdgesGeometry) sobre el bloque mirado
- Se actualiza cada frame cuando el jugador mira un bloque
- Muestra nombre del bloque en el HUD

## HUD

### Esquina Superior Izquierda
- FPS
- Coordenadas XYZ
- Bioma actual
- Numero de chunks cargados

### Esquina Superior Derecha
- Bloque mirado
- Bloque seleccionado

### Centro
- Crosshair blanco semi-transparente

### Abajo Centro
- Hint de controles
- Hotbar (9 slots con color, numero y nombre del bloque)
- Mining overlay (crack visual durante minado)

### Abajo Izquierda
- Mode indicator (Creativo/Survival)

### Esquina Superior Derecha (adicionales)
- Minimapa 120px (SPEC-035): biomas con colores, marker de jugador + direccion
- Clock display HH:MM (SPEC-035)

### Barra de Stamina
- Visible al correr (sprint)
- Se regenera al parar

### Pantalla de Pausa
- Titulo JardVoxel
- Seed del mundo
- Boton "Continuar"
- Click para reanudar

### Pantalla de Muerte (SPEC-035)
- Texto "Has Muerto"
- Causa de muerte (ej: "Caida fatal")
- Boton "Respawn"

### Inventario (SPEC-033)
- Grid con todos los bloques colocables
- Click en un bloque lo asigna al slot seleccionado del hotbar
- Tecla E para abrir/cerrar

## Ciclo Dia/Noche (SPEC-026)

- Duracion del ciclo: ~200 segundos (tiempo real)
- **Sol visible**: mesh emisivo amarilla con halo glow
- **Luna visible**: esfera gris opuesta al sol
- **Estrellas**: ~800 puntos con fade segun dayFactor
- **Sky dome**: gradiente vertical con interpolacion day → sunset → night
- **Colores de atardecer**: interpolacion hacia naranja (#ff7a3d)
- Intensidad de luz varia con la altura del sol
- Color de cielo y fog interpolan entre dia, sunset y noche
- Sombras dinamicas siguen al sol
- **Nubes procedurales** (SPEC-032): 3 planos con textura noise, viento y color dinamico

## Audio (SPEC-034)

- **Web Audio API**: sonidos sintetizados sin archivos externos
- **jump**: sine 300→500Hz, 0.15s
- **land**: sine 150→80Hz, 0.12s
- **break**: square 200→100Hz, 0.10s
- **place**: square 400→300Hz, 0.08s
- **splash**: sawtooth 100→200Hz, 0.25s (al entrar al agua)

## Controles Survival (v4.1.0+)

### Controles de Teclado Adicionales

| Tecla | Accion | Spec |
|-------|--------|------|
| **Right Click** (en bloque) | Abrir UI del bloque (furnace, crafting, enchanting, brewing, anvil, cartography) | SPEC-043/052/062/065/066 |
| **Right Click** (con escudo) | Levantar escudo (blocking) | SPEC-063 |
| **G** | Toggle musica ChillTune on/off | SPEC-057 |
| **M** | Abrir mapa | SPEC-066 |
| **H** | Toggle HUD de logros | SPEC-064 |

### Herramientas y Armadura (SPEC-051)

- Herramientas equipadas se usan automaticamente al minar bloques
- Speed multiplier si la herramienta coincide con el tipo de bloque (pickaxe→stone, axe→wood, shovel→dirt/sand)
- Espadas aplican damage bonus en combate
- Armadura equipada reduce damage recibido automaticamente
- Durabilidad se consume con cada uso (minado o golpe)
- Herramienta se rompe al llegar a 0 durabilidad

### Encantamientos (SPEC-052)

- Construir Enchanting Table (obsidian + diamond + book)
- Right-click en mesa de encantamiento → UI con 3 opciones aleatorias
- Requiere XP levels (costo varia por encantamiento)
- Un encantamiento por item
- 5 encantamientos: Efficiency, Unbreaking, Sharpness, Protection, Fortune

### Pesca (SPEC-054)

- Equipar Fishing Rod en hotbar
- Right-click para lanzar caña (raycast busca agua, max 30 bloques)
- Bobber animado: arco al lanzar, bobbing en agua, dip al morder
- Esperar 3-15 segundos para que muerda
- Right-click durante bite window (1.5s) para recolectar
- Tabla de capturas: Fish 60%, Pufferfish 15%, Bones 10%, Ink 8%, String 5%, Leather 2%

### Nether (SPEC-055)

- Construir portal de obsidian (4x5 minimo) y encender con flint/steel
- Pararse en el portal para cambiar de dimension
- Nether: terreno de netherrack, lava, glowstone, quartz ore
- PortalManager rastrea ubicacion del portal para regreso

### Redstone (SPEC-056)

- Colocar Redstone Dust en el suelo para crear circuitos
- Lever: toggle on/off para activar/redesactivar circuito
- Power level 0-15, decrementa por 1 por bloque de dust
- Redstone Torch: fuente de power constante
- Piston: se extiende cuando recibe power
- Redstone Lamp: se ilumina cuando recibe power
- Redstone Repeater: repite y retarda la señal

## Controles Survival v4.2.0

### Musica ChillTune (SPEC-057)

- **G**: toggle musica on/off
- Musica cambia automaticamente segun estado del juego:
  - **Explorando**: Dorian 60 BPM (relajado, aventura)
  - **Construyendo**: Lydian 65 BPM + arpeggios (creativo, luminoso)
  - **Minando**: Aeolian 55 BPM (enfocado, oscuro)
  - **Combate**: Phrygian 70 BPM (tenso, peligro)
  - **Noche**: Aeolian 50 BPM (calmo, nocturno)
  - **Bajo agua**: Dorian 52 BPM (etereo, profundo)
  - **Idle**: Pentatonic 45 BPM (meditativo, espera)
- Transiciones suaves (3-8s crossfade)
- Volumen independiente (default 0.35), persistente en localStorage

### Brewing & Pociones (SPEC-062)

- Construir Brewing Stand (cobblestone + blaze rod)
- Construir Cauldron (7 iron ingots) para llenar botellas
- Right-click en Brewing Stand → UI de brewing
- Stage 1: Water Bottle + Nether Wart → Awkward Potion
- Stage 2: Awkward Potion + ingredient → Specific Potion
- Stage 3: Potion + Gunpowder → Splash Potion
- Beber pocion: right-click con pocion en mano
- Efectos: Speed, Strength, Healing, Night Vision, Fire Resistance, Regeneration, Water Breathing

### Escudos (SPEC-063)

- Equipar Shield en off-hand slot
- **Right-click hold**: levantar escudo (blocking)
- Bloquea ataques frontales dentro de cono de 120 grados
- Speed reducido a 0.5x mientras bloquea
- Shield bash: right-click rapido → knockback a enemigos cercanos
- Shield se deshabilita 5s si golpeado por hacha (10% chance)
- Durabilidad: 336 usos, se consume con cada golpe bloqueado

### Logros (SPEC-064)

- 30 logros en 8 categorias: mining, building, combat, exploration, crafting, survival, farming, redstone
- Se desbloquean automaticamente al cumplir criterios
- Toast notification: slide-in desde arriba con icono, nombre y descripcion
- Stats tracked: blocksBroken, blocksPlaced, mobsKilled, distanceTraveled, foodsEaten, cropsHarvested, fishCaught, potionsBrewed, potionsDrunk, hitsBlocked
- Persistencia: logros desbloqueados se guardan en save file

### Yunque / Anvil (SPEC-065)

- Construir Anvil (3 iron ingots top + 1 center + 3 bottom)
- Right-click en Anvil → UI de reparacion
- **Renombrar**: colocar item + texto (max 30 chars), costo 1 XP level
- **Reparar con material**: item + material del tipo correcto → recupera 25% durabilidad por unidad
- **Combinar herramientas**: dos items iguales → merge durabilidad + 10% bonus + merge encantamientos
- Anvil se dana con uso (25 usos max, 3 estados de dano)
- Anvil cae con gravedad y hace dano a entidades (2-6 HP)

### Mapas y Cartografia (SPEC-066)

- Construir Compass (4 iron + redstone en cruz) para navegacion
- Construir Map (8 paper + compass) para mapa del terreno
- **M**: abrir mapa (canvas con colores por tipo de bloque)
- 4 tiers de mapa: 128, 256, 512, 1024 bloques de cobertura
- Areas no exploradas se muestran en negro
- Mapa se actualiza cada 4 bloques movidos
- Cartography Table: para escalar mapas a tier superior
- Construir Cartography Table (4 planks + 2 paper)
