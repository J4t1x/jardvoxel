# JardVoxel — Documentacion del Proyecto

Mundo voxel 3D tipo voxel con generacion procedural de terreno, cuevas, biomas, 6 tipos de arboles, 14 estructuras, 80 bloques, ciclo dia/noche con sol/luna/estrellas, nubes procedurales, inventario, minado con hardness, nado, sprint, audio, mobs hostiles y pasivos, combate cuerpo a cuerpo y a distancia, sistema de salud/hambre, clima, hornos, agricultura, camas, panel de ajustes y mas.

## Estructura de Archivos

```
jardvoxel/
├── jardvoxel.html              # Juego principal (UI + game loop + controles + audio)
├── jardvoxel-engine.js         # Motor principal (terreno, chunks, greedy meshing, estructuras)
├── jardvoxel-worker.js         # Web Worker para generacion de chunks off-main-thread
├── jardvoxel-survival-engine.js  # Motor alternativo (pipeline estilo voxel)
└── docs/
    ├── README.md               # Este archivo (indice de documentacion)
    ├── ARCHITECTURE.md         # Arquitectura tecnica del motor
    ├── WORLD-GENERATION.md     # Generacion procedural de terreno y biomas
    ├── BLOCKS.md               # Catalogo de bloques (63 tipos) y materiales
    ├── CONTROLS.md             # Controles y mecanicas de gameplay
    ├── CHANGELOG.md            # Historial de versiones y cambios
    ├── BUGS-FOUND.md           # Audit de bugs (10 bugs encontrados y resueltos)
    └── IMPROVEMENTS-ROADMAP.md # Roadmap de mejoras (SPEC-025 a SPEC-037)
```

## Documentos

| Documento | Descripcion |
|-----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura del motor, clases, pipeline de renderizado |
| [WORLD-GENERATION.md](./WORLD-GENERATION.md) | Noise, biomas, cuevas, rios, estructuras, arboles |
| [BLOCKS.md](./BLOCKS.md) | Catalogo completo de bloques, colores y nombres |
| [CONTROLS.md](./CONTROLS.md) | Controles de teclado/mouse y mecanicas de gameplay |
| [CHANGELOG.md](./CHANGELOG.md) | Historial de versiones y cambios |
| [BUGS-FOUND.md](./BUGS-FOUND.md) | Audit de bugs: 10 bugs encontrados y resueltos |

## Stack Tecnologico

- **Three.js 0.160.0** (via CDN, ES Modules + importmap)
- **PointerLockControls** (three/addons)
- **Vanilla JS** (sin frameworks, sin build tools)
- **WebGL** (renderizado 3D con sombras)

## Como Jugar

Abrir `jardvoxel.html` en un navegador moderno (Chrome/Firefox/Edge). Click en la pantalla para activar el cursor lock. ESC para pausar.

## Features

- **80 bloques** con colores, hardness, transparencia y emisivos
- **16 biomas** con temperatura, humedad y altura
- **6 tipos de arboles** por bioma (Oak, Jungle, Spruce, Mangrove, Dead, Savanna)
- **14 estructuras** (village, temple, mineshaft, monument, jungle temple, shipwreck, igloo, etc.)
- **Cuevas**: spaghetti, cheese, noodle, carver tunnels, ravines
- **Aquifer system** con agua/lava subterranea
- **Ciclo dia/noche** con sol, luna, estrellas, sky dome gradiente y atardecer
- **Nubes procedurales** con viento y color dinamico
- **Inventario completo** (tecla E) con 70+ bloques colocables
- **Minado con hardness** (tecla C para Creative/Survival)
- **Fisica**: nado, sprint con stamina, crouch, fall damage
- **Audio**: Web Audio API (jump, land, break, place, splash) con control de volumen
- **UI**: minimapa, clock, death screen, mode indicator, settings panel, weather indicator
- **Mobs pasivos**: Cow, Pig, Chicken, Sheep con drops y spawning por bioma
- **Mobs hostiles**: Zombie, Skeleton, Creeper, Spider con IA de combate y spawning nocturno
- **Combate**: cuerpo a cuerpo con cooldown, arcos y flechas con draw mechanic, knockback
- **Salud/Hambre**: 10 hearts, 10 hunger drums, starvation, regeneracion
- **Clima**: lluvia, nieve, tormenta con rayos, fog dinamico
- **Agricultura**: trigo, semillas, azada, farmland, crecimiento con agua
- **Camas**: dormir, saltar noche, establecer spawn point
- **Fog submarino**: overlay azul y fog denso bajo el agua
- **Settings panel**: distancia de render, FOV, sensibilidad, volumen (persistente)
- **Performance**: real greedy meshing, frustum culling, adaptive LOD (3 levels), AO cache, web worker chunk generation, tone mapping, point light pool, chunk throttling
- **Bug audit**: 10 bugs encontrados y resueltos (3 critical, 3 moderate, 4 minor)

## Estado

- **Version:** 4.0.0
- **Estado:** Jugable con gameplay completo + mobs + combate + agricultura + clima
- **Dependencias:** Three.js (CDN)
- **Tamaño:** ~200KB total (archivos principales)
- **Specs completadas:** SPEC-025 a SPEC-050 (26 specs)
- **Bugs resueltos:** 10/10 (BUG-001 a BUG-010)
