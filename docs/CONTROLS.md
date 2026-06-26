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
