# JardVoxel — PRD: Joysticks Touch para Moviles

**Fecha**: 2026-06-25  
**Autor**: ja  
**Estado**: ✅ Completado (v5.0.0 — SPEC-062)  
**Version objetivo**: v4.3.0  
**Spec**: SPEC-062

---

## Resumen Ejecutivo

JardVoxel Survival actualmente solo funciona con teclado+mouse (WASD para movimiento, mouse para camara, clicks para romper/colocar bloques). En dispositivos moviles (celulares/tablets) el juego es injugable porque no hay controles touch.

Este PRD define la implementacion de **joysticks virtuales touch** que permiten jugar completo en pantallas tactiles. Los joysticks se pueden **activar/desactivar con una tecla** (tecla `J`) para probar en cualquier pantalla, incluyendo desktop con mouse simulando touch.

### Tabla de features

| Componente | Descripcion | Estado |
|-----------|-------------|--------|
| Joystick izquierdo (movimiento) | Virtual stick que mapea a WASD | Pendiente |
| Joystick derecho (camara) | Virtual stick que controla yaw/pitch | Pendiente |
| Boton de salto | Touch button para saltar | Pendiente |
| Boton romper/colocar | Touch buttons para interaccion | Pendiente |
| Toggle con tecla J | Activar/desactivar joysticks en cualquier pantalla | Pendiente |
| Auto-deteccion mobile | Mostrar joysticks automaticamente en touch devices | Pendiente |

---

## SPEC-062: Touch Joystick Controls

**Prioridad**: Alta  
**Estimacion**: 5h  
**Dependencias**: Ninguna  
**Bloquea a**: Ninguna

### Problema

En `jardvoxel-survival.html`:
- `setupInput()` (linea 989) solo registra `keydown`, `keyup`, `mousedown`, `mouseup`, `mousemove` — **cero eventos touch**
- `PlayerController.update(dt, keys)` (linea 312 en `jardvoxel-survival-gameplay.js`) lee `keys.w/a/s/d/space/shift` — no hay forma de inyectar input touch
- El game loop (linea 1863) solo actualiza al jugador si `this.pointerLocked` es true — en mobile no hay pointer lock
- La camara se controla via `mousemove` con `e.movementX/movementY` que no existe en touch events
- No hay botones touch para romper/colocar bloques, saltar, o abrir inventario

### Arquitectura propuesta

```
Touch Joystick System
├── TouchJoystick (clase reutilizable)
│   ├── zone: area tactil (left/right mitad de pantalla)
│   ├── knob: circulo visual que sigue el dedo
│   ├── output: { x: -1..1, y: -1..1 } vector normalizado
│   └── active: bool
├── TouchControls (gestor)
│   ├── moveStick: TouchJoystick (izquierda) → mapea a keys.w/a/s/d
│   ├── lookStick: TouchJoystick (derecha) → mapea a player.yaw/pitch
│   ├── buttons: { jump, break, place, sprint, inventory }
│   ├── enabled: bool (toggle con tecla J)
│   └── autoDetect: bool (detectar touch device al cargar)
└── Integracion con game loop
    ├── Si touchControls.enabled: permitir update sin pointerLock
    ├── Mover jugador con moveStick output
    ├── Rotar camara con lookStick output
    └── Acciones con buttons
```

### Requisitos

#### 1. Clase TouchJoystick

Joystick virtual reutilizable con zona tactil y knob visual:

- **Zona tactil**: Mitad izquierda (movimiento) o derecha (camara) de la pantalla
- **Knob**: Circulo semi-transparente que sigue el dedo dentro de un radio maximo
- **Output**: Vector normalizado `{ x: -1..1, y: -1..1 }`
- **Multi-touch**: Soportar multiples toques simultaneos (un dedo por joystick)
- **Dead zone**: Radio minimo de 10px para evitar drift
- **Visual**: 
  - Base: circulo 120px de diametro, `rgba(255,255,255,0.1)`, borde `rgba(255,255,255,0.3)`
  - Knob: circulo 60px de diametro, `rgba(124,58,237,0.5)`, borde `rgba(124,58,237,0.8)`
  - Posicion: aparece donde el dedo toca por primera vez (floating joystick)
- **Eventos**: `touchstart`, `touchmove`, `touchend`, `touchcancel`

#### 2. Joystick izquierdo — Movimiento

Mapear el output del joystick al sistema de keys existente:

- `output.y < -deadZone` → `this.keys.w = true` (adelante)
- `output.y > deadZone` → `this.keys.s = true` (atras)
- `output.x < -deadZone` → `this.keys.a = true` (izquierda)
- `output.x > deadZone` → `this.keys.d = true` (derecha)
- Fuera de dead zone → liberar keys correspondientes
- **Intensidad proporcional**: Si el joystick esta a 50%, el jugador se mueve a 50% de velocidad (requiere modificacion menor en `PlayerController.update`)

#### 3. Joystick derecho — Camara

Controlar yaw/pitch del jugador:

- `output.x` → `this.player.yaw -= output.x * lookSensitivity * dt`
- `output.y` → `this.player.pitch -= output.y * lookSensitivity * dt`
- Clamp pitch: `[-PI/2 + 0.01, PI/2 - 0.01]`
- `lookSensitivity`: 2.0 rad/s (configurable en settings)
- No depende de `pointerLock` ni de `e.movementX/movementY`

#### 4. Botones de accion (touch)

Botones circulares en la esquina inferior derecha, apilados verticalmente:

| Boton | Tamano | Accion | Equivalente |
|-------|--------|--------|-------------|
| Saltar | 70px | `this.keys.space = true` (while pressed) | Barra espaciadora |
| Romper | 70px | `this._breakBlock()` + `this.mouseLeftDown = true` (while pressed) | Click izquierdo |
| Colocar | 70px | `this._placeBlock()` | Click derecho |
| Sprint | 60px | `this.keys.shift = true` (while pressed) | Shift |
| Inventario | 60px | Toggle inventario (`KeyE`) | Tecla E |

- **Visual**: Circulo semi-transparente con icono/letra dentro
  - Saltar: `rgba(0,255,136,0.3)`, icono `↑`
  - Romper: `rgba(255,80,80,0.3)`, icono `⛏`
  - Colocar: `rgba(80,180,255,0.3)`, icono `+`
  - Sprint: `rgba(255,200,0,0.3)`, icono `>>`
  - Inventario: `rgba(124,58,237,0.3)`, icono `INV`
- **Posicion**: Esquina inferior derecha, apilados verticalmente con 10px de gap
- **pointer-events**: `auto` (los botones deben recibir touch)

#### 5. Toggle con tecla J

- Al presionar `KeyJ`: `touchControls.enabled = !touchControls.enabled`
- Cuando se activan los joysticks:
  - Mostrar overlay visual de joysticks y botones
  - **No requerir pointerLock** para que el game loop actualice al jugador
  - Si pointerLock estaba activo, salir de pointer lock
- Cuando se desactivan:
  - Ocultar joysticks y botones
  - Volver al modo keyboard+mouse normal
- **Notificacion visual**: Mostrar toast "Joysticks: ON/OFF" durante 1.5s

#### 6. Auto-deteccion mobile

Al cargar el juego:
- Detectar `('ontouchstart' in window) || (navigator.maxTouchPoints > 0)`
- Si es touch device: activar joysticks automaticamente
- Si no es touch device: joysticks desactivados por defecto (activar con `J`)
- Guardar preferencia en `localStorage` (`jardvoxel_touch_controls`)

#### 7. Modificacion del game loop

En `animate()` (linea 1863):

```javascript
// ANTES:
if (this.pointerLocked) {
  this.player.update(dt, this.keys);
  // ...
}

// DESPUES:
if (this.pointerLocked || this.touchControls?.enabled) {
  this.player.update(dt, this.keys);
  // ...
}
```

Tambien en el hold-to-mine (linea 1927):
```javascript
// ANTES:
if (this.mouseLeftDown && this.pointerLocked && !this.inventoryOpen && ...) {
  this._breakBlock();
}

// DESPUES:
if ((this.mouseLeftDown || this.touchControls?.breaking) && (this.pointerLocked || this.touchControls?.enabled) && !this.inventoryOpen && ...) {
  this._breakBlock();
}
```

#### 8. Modificacion de PlayerController

Para soportar intensidad proporcional del joystick:

```javascript
// En update(dt, keys), agregar soporte para touchInput:
update(dt, keys, touchInput = null) {
  // Si touchInput esta disponible, usar sus valores analogicos
  const moveX = touchInput?.moveX ?? null;  // -1..1
  const moveY = touchInput?.moveY ?? null;  // -1..1
  
  if (moveX !== null && moveY !== null) {
    // Movimiento analogico directo
    const speed = this.flying ? this.flySpeed : (keys.shift ? this.runSpeed : this.moveSpeed);
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const moveDir = new THREE.Vector3()
      .addScaledVector(forward, -moveY)
      .addScaledVector(right, moveX);
    if (moveDir.lengthSq() > 0) moveDir.normalize().multiplyScalar(speed * Math.min(1, moveDir.length()));
    this.velocity.x = moveDir.x;
    this.velocity.z = moveDir.z;
  } else {
    // Logica original con keys (WASD)
    // ... codigo existente ...
  }
}
```

#### 9. CSS — Estilos de joysticks y botones

Todo el CSS va embebido en `<style>` dentro de `jardvoxel-survival.html`:

- `.touch-controls` — container oculto por defecto, `display: none`
- `.touch-controls.active` — `display: block`
- `.joystick-base` — circulo base del joystick
- `.joystick-knob` — knob que sigue el dedo
- `.touch-btn` — botones de accion
- Media query no necesaria — el toggle es manual o auto-detect
- `user-select: none` y `touch-action: none` para evitar scroll/zoom involuntario

#### 10. Viewport meta para mobile

Actualizar el meta viewport existente (linea 5) para prevenir zoom en mobile:

```html
<!-- ANTES -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- DESPUES -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

### Criterios de aceptacion

- [ ] En un celular, el juego es jugable sin teclado ni mouse
- [ ] Joystick izquierdo mueve al jugador en 8 direcciones (WASD)
- [ ] Joystick derecho rota la camara (yaw + pitch) suavemente
- [ ] Boton de salto hace saltar al jugador
- [ ] Boton de romper mina bloques (hold para minado continuo)
- [ ] Boton de colocar coloca bloques
- [ ] Boton de sprint activa corrida
- [ ] Boton de inventario abre/cierra el inventario
- [ ] Tecla `J` activa/desactiva los joysticks en cualquier pantalla
- [ ] En desktop, al presionar `J`, los joysticks aparecen y se pueden probar con mouse (simulando touch)
- [ ] Auto-deteccion: en un celular los joysticks aparecen automaticamente al cargar
- [ ] Multi-touch: se puede mover y mirar simultaneamente (dos dedos)
- [ ] No hay lag perceptible por los controles touch (60fps target)
- [ ] El knob del joystick sigue el dedo suavemente con dead zone
- [ ] Toast visual al activar/desactivar joysticks
- [ ] Preferencia de usuario persiste en localStorage
- [ ] No hay errores en consola relacionados con touch events

### Archivos a modificar

- **`jardvoxel-survival.html`** — CSS de joysticks/botones, HTML elements, `TouchJoystick` class, `TouchControls` class, integracion en `setupInput()`, modificacion de `animate()`, toggle con `KeyJ`, auto-deteccion mobile, viewport meta
- **`jardvoxel-survival-gameplay.js`** — Modificar `PlayerController.update()` para aceptar `touchInput` con movimiento analogico

### Consideraciones tecnicas

1. **pointerLock en mobile**: `requestPointerLock()` no funciona en la mayoria de mobiles. El sistema touch debe funcionar **sin pointer lock**.
2. **touch-action**: Declarar `touch-action: none` en el canvas y overlay touch para prevenir gestos del navegador (scroll, zoom, swipe).
3. **iOS Safari**: `position: fixed` puede ser erratico en iOS. Usar `position: fixed` con `touch-action: none` y testear.
4. **Performance**: Los event listeners touch deben ser pasivos donde sea posible (`{ passive: false }` solo donde se necesita `preventDefault`).
5. **Hotbar en mobile**: El hotbar existente ya tiene `pointer-events: auto` — debe seguir funcionando para seleccionar slots con touch.
6. **UI panels**: Los paneles de inventario/crafting/furnace ya usan `pointer-events: auto` — deben seguir funcionando con touch.
7. **Floating joystick**: El joystick aparece donde el dedo toca por primera vez dentro de su zona (izquierda/derecha). No es una posicion fija. Esto es mas comodo en pantallas grandes.

### Plan de implementacion

```
Fase 1: Estructura base (1h)
  ├── CSS de joysticks y botones
  ├── HTML elements (overlay touch-controls)
  ├── Clase TouchJoystick (zona + knob + output)
  └── Toggle con tecla J + toast

Fase 2: Integracion movimiento (1h)
  ├── TouchControls: mapear moveStick a keys
  ├── Modificar PlayerController.update() para touchInput analogico
  └── Modificar game loop: permitir update sin pointerLock

Fase 3: Camara look (1h)
  ├── TouchControls: mapear lookStick a yaw/pitch
  ├── Sensibilidad configurable
  └── Clamp pitch

Fase 4: Botones de accion (1h)
  ├── Boton saltar → keys.space
  ├── Boton romper → _breakBlock() + hold-to-mine
  ├── Boton colocar → _placeBlock()
  ├── Boton sprint → keys.shift
  └── Boton inventario → toggle KeyE

Fase 5: Auto-deteccion + persistencia (30min)
  ├── Detectar touch device al cargar
  ├── Activar automaticamente en mobile
  ├── Guardar preferencia en localStorage
  └── Viewport meta update

Fase 6: Testing y pulido (30min)
  ├── Test en desktop con tecla J
  ├── Test multi-touch (si hay dispositivo)
  ├── Ajustar sensibilidad y dead zone
  └── Verificar 60fps
```

### Dependencias

```
SPEC-062 (Touch Joystick) — sin dependencias, independiente
```

### Ejecucion con Harness

```bash
# Ejecutar spec especifica
/cascade-dev SPEC-062

# Ejecutar con skill jard-code
@jard-code SPEC-062
```

### Validacion

- **Desktop**: Presionar `J` → joysticks aparecen → probar con mouse drag
- **Mobile**: Abrir `jardvoxel-survival.html` en celular → joysticks auto-activados
- **Performance**: 60fps con joysticks activos
- **Multi-touch**: Mover + mirar simultaneamente

---

## Metricas de exito

| Metrica | Actual | Objetivo |
|---------|--------|----------|
| Controles touch | Ninguno | Joysticks + 5 botones |
| Jugable en mobile | No | Si |
| Toggle para testing | N/A | Tecla J |
| Auto-deteccion mobile | No | Si |
| Multi-touch | N/A | 2 dedos simultaneos |
| FPS con touch controls | N/A | 60fps |

---

*Documento generado: 2026-06-25*  
*Desarrollo: Jard Dev Harness (`/cascade-dev`, `@jard-code`)*
