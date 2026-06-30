# SPEC-002: JardVoxel — Mundo 3D Procedural con Three.js

## Descripción
Juego 3D first-person donde un personaje explora un mundo proceduralmente generado estilo Minecraft usando Three.js y Ruido de Perlin/Simplex.

## Stack
- Three.js (CDN, ES Modules via importmap)
- HTML + CSS + JS embebido (single-file)
- Sin dependencias npm, sin build tools

## Requisitos

### Terrain Generation
- **Perlin/Simplex Noise** implementado from scratch (sin librerías externas)
- **Fractal Brownian Motion (fBm)** con múltiples octavas para mapa de altura
- **Multi-noise** para biomas: temperatura + humedad + continentalidad + erosión
- **Biomas**: llanura (verde), bosque (verde oscuro), desierto (amarillo), montaña (gris), nieve (blanco), océano (azul)
- **Seed** configurable para reproducibilidad

### Rendering
- Three.js scene con niebla atmosférica
- Luz direccional (sol) + luz ambiental
- Terreno como mesh con vertex colors por bioma
- Agua plana con transparencia
- Sky gradient o skybox procedural

### Character Controller
- **First-person** con PointerLockControls
- WASD para movimiento
- Mouse para mirar
- Space para saltar
- Shift para correr
- Gravedad y colisión con terreno (raycasting)
- Detección de altura del terreno bajo el jugador

### Chunk System
- Mundo dividido en chunks (ej: 32x32 unidades)
- Chunks se generan/cargan dinámicamente según posición del jugador
- Chunks lejanos se descargan
- Render distance configurable

### UI/HUD
- Crosshair en centro
- Coordenadas del jugador (X, Y, Z)
- FPS counter
- Bioma actual
- Instrucciones de controles
- Pantalla de carga inicial

## Acceptance Criteria
- [x] Terreno se genera proceduralmente con Perlin noise
- [x] Múltiples biomas visibles al explorar
- [x] Personaje se mueve con WASD + mouse
- [x] Gravedad y colisión funcionan
- [x] Chunks se cargan/descargan dinámicamente
- [x] Seed produce mundo reproducible
- [x] 60fps target en desktop
- [x] Single HTML file, sin build tools

## Estimación
~4 horas
