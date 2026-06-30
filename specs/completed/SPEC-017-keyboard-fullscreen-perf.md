# SPEC-017: Keyboard, Fullscreen & Mobile Performance Mode

## Objetivo
Implementar atajos de teclado, modo fullscreen/kiosk, detección móvil con performance mode, y Visibility API para pausar audio al cambiar de tab.

## Estado Actual
- No hay soporte de teclado en jardfruit-pro
- No hay modo fullscreen
- No hay detección móvil ni performance mode
- No hay Visibility API handler

## Requisitos

### Keyboard Support
- [ ] **Espacio** = SPIN (cuando juego activo y no girando)
- [ ] **1-5** = Seleccionar apuesta (10, 50, 100, 500, ALL)
- [ ] **ESC** = Cerrar pantalla abierta o salir de fullscreen
- [ ] Ignorar cuando tutorial está activo
- [ ] `e.preventDefault()` en Espacio para evitar scroll

### Fullscreen / Kiosk Mode
- [ ] `enterFullscreen()` con fallback webkit
- [ ] `exitFullscreen()` con fallback webkit
- [ ] `toggleFullscreen()` 
- [ ] `isFullscreen()` helper
- [ ] Auto-enter fullscreen en móvil al iniciar juego
- [ ] Botón en menú: "⛶ Pantalla completa"
- [ ] Back button (popstate): salir de fullscreen en vez de salir de la página
- [ ] `history.pushState` para manejar back button

### Mobile Detection & Performance Mode
- [ ] `detectMobile()`: UserAgent + maxTouchPoints + matchMedia
- [ ] `enablePerfMode()`: activar clase `perf-mode` en body/container
- [ ] Perf mode desactiva: aurora, frutas decorativas, estrellas, reel-idle-glow, symbol-float, reel-sweep, guide-overlay, prob-hints
- [ ] Perf mode simplifica: backdrop-filter → background sólido, vignette, spin-btn animation
- [ ] Perf mode mantiene: jackpot-zoom text gradient, reel-symbol brightness
- [ ] Auto-detectar al iniciar el juego

### Visibility API
- [ ] `visibilitychange` event listener
- [ ] Al ocultar tab: detener música (`stopMusic()`)
- [ ] Al mostrar tab: reanudar música si estaba sonando (no durante spin)
- [ ] Pausar fruit garden RAF loop cuando oculto

### Resize Handler
- [ ] `resize` event con debounce 200ms
- [ ] Re-renderizar reels en resize
- [ ] Redibujar guías si están activas
- [ ] Resize canvas de partículas

## Criterios de Aceptación
- [ ] Espacio ejecuta SPIN
- [ ] 1-5 cambia apuesta
- [ ] ESC cierra pantallas/sale de fullscreen
- [ ] Fullscreen funciona con fallback webkit
- [ ] Auto-fullscreen en móvil al iniciar
- [ ] Back button maneja fullscreen correctamente
- [ ] Mobile detection activa perf mode automáticamente
- [ ] Perf mode reduce animaciones sin perder funcionalidad
- [ ] Visibility API pausa/reanuda música
- [ ] Resize re-renderiza reels y guías
- [ ] Build sin errores

## Archivos a Crear
- `src/systems/InputManager.ts` — keyboard, fullscreen, visibility
- `src/systems/PerformanceManager.ts` — mobile detection, perf mode

## Archivos a Modificar
- `src/scenes/SlotScene.ts` — integrar InputManager y PerformanceManager
- `src/scenes/BootScene.ts` — detect mobile al iniciar
- `src/audio/AudioEngine.ts` — visibility API hooks
- `src/config/phaser.config.ts` — considerar Scale.RESIZE

## Estimación
~2 horas
