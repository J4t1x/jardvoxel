# Indicators & HUD Layout — Jard Games

Guía de distribución de indicadores en pantalla para evitar superposiciones y maximizar área de juego.

## Principios

1. **Bordes solamente** — Todo HUD va en los bordes, centro libre para gameplay
2. **Una función por esquina** — No apilar indicadores del mismo tipo
3. **z-index estricto** — HUD (10-30) < Efectos (50-90) < Modales (100+)
4. **Safe areas** — Respetar `env(safe-area-inset-*)` para notch
5. **Glassmorphism** — `backdrop-filter: blur(10px)` + fondo semi-transparente
6. **No pointer-events en HUD** — Excepto botones interactivos

## Distribución Canónica

```
┌──────────────────────────────────────────────┐
│  [HEADER]              [FASE]      [SONIDO]  │ ← Top border
│  Score / Progreso / Streak                    │
│                                               │
│                                               │
│                                               │
│              ÁREA DE JUEGO                    │
│            (completamente libre)              │
│                                               │
│                                               │
│                                               │
│  [POWER-UP]     [COMBO]      [DIFICULTAD]    │ ← Bottom border
└──────────────────────────────────────────────┘
```

## Posiciones Detalladas

### Top-Left: Header del juego
```css
.header-juego {
  position: fixed; /* o relative dentro de #juego */
  top: 10px;
  left: 10px;
  z-index: 8;
}
```
**Contenido:** Score, contador de progreso, barra de progreso, streak meter, multiplicador badge

### Top-Center: Indicador de fase
```css
.indicador-fase {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  pointer-events: none;
  opacity: 0; /* show transient */
}
```
**Contenido:** Nombre de fase actual, se muestra 2.5s al cambiar

### Top-Right: Botón de sonido
```css
.btn-sonido {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 30;
}
```
**Contenido:** Icono 🔊/🔇, único elemento interactivo en bordes

### Bottom-Left: Power-up activo
```css
.powerup-activo {
  position: fixed;
  bottom: 15px;
  left: 15px;
  z-index: 25;
  pointer-events: none;
  opacity: 0; /* show when active */
}
```
**Contenido:** Emoji + nombre del power-up activo

### Bottom-Center: Combo display
```css
.combo-display {
  position: fixed;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  pointer-events: none;
  opacity: 0; /* show transient */
}
```
**Contenido:** "🔥 Combo x5!", texto gradiente dorado-rosa

### Bottom-Right: Indicador de dificultad
```css
.indicador-dificultad {
  position: fixed;
  bottom: 15px;
  right: 15px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
}
```
**Contenido:** Label "Dificultad" + 10 puntos + "Nivel X"

### Center: Aviso de rush wave (transient)
```css
.aviso-rush {
  position: fixed;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  z-index: 80;
  pointer-events: none;
}
```
**Contenido:** "¡RUSH! 💕", solo aparece durante rush waves

## z-index Scale

| Rango | Capa | Elementos |
|-------|------|-----------|
| 0-1 | Fondo | Aurora, estrellas, corazones de fondo |
| 5 | Juego | `#juego`, área de juego |
| 7 | Entidades | Corazones tocables, power-up items |
| 8-10 | HUD estático | Header, barras |
| 15-30 | HUD flotante | Indicadores, botón sonido |
| 50 | Efectos transitorios | Combo display |
| 80 | Avisos grandes | Rush wave |
| 90 | Confeti | Lluvia de emojis |
| 100+ | Modales | Mensaje, hito, pantalla final |
| 198-199 | Fin de juego | Lluvia final, fuegos artificiales |

## Responsive

- **Mobile (< 400px):** HUD más compacto, font-size reducido
- **Tablet (400-768px):** Layout canónico
- **Desktop (> 768px):** Área de juego centrada con max-width

## Animaciones de entrada/salida

| Elemento | Entrada | Salida |
|----------|---------|--------|
| Indicador de fase | `opacity 0→1` (0.5s) | `opacity 1→0` (0.5s) después de 2.5s |
| Combo display | `comboPop` keyframe (1s) | `opacity→0` al terminar animación |
| Power-up activo | `translateY(20px→0) + opacity(0→1)` | `translateY(0→20px) + opacity(1→0)` |
| Aviso rush | `scale(0→1.2→1)` + `opacity(0→1)` | `scale(1→1.5) + opacity(1→0)` |

## Errores Comunes a Evitar

1. **Superposición de indicadores** — No poner dos elementos `position: fixed` en la misma zona
2. **HUD que bloquea toques** — Siempre `pointer-events: none` excepto botones
3. **z-index incorrecto** — Entidades debajo del fondo o modales detrás del HUD
4. **Transiciones CSS en movimiento** — Conflicto con `requestAnimationFrame`, usar solo para entrada/salida
5. **Safe area ignorada** — En iOS con notch, el HUD queda tapado
