# SPEC-006: JardPredict — Pulido Final (Cosméticos, PWA, Tutorial)

## Descripción
Pulido final de JardPredict: temas visuales cosméticos, animaciones avanzadas, tutorial/onboarding, música dinámica por racha, y PWA installable.

## Requisitos
- [ ] 4 temas visuales seleccionables: Dark (default), Neon, Pastel, Retro
- [ ] Selector de tema en settings (⚙️)
- [ ] Tema persistido en localStorage
- [ ] Animación de confeti masivo en milestones (nivel up, racha 10, all-in win)
- [ ] Frenzy mode visual: fondo cambia en racha ≥10 (aurora más intensa, vignette dorado)
- [ ] Música dinámica: capas adicionales se activan según racha (drums → bass → melody → harmony)
- [ ] Tutorial/onboarding: tooltips guiados si totalRondas === 0
  - Paso 1: "Predice si la vela sube ↑ o baja ↓"
  - Paso 2: "Elige cuánto apostar"
  - Paso 3: "Encadena aciertos para multiplicadores"
  - Paso 4: "Compra upgrades en 🛒"
- [ ] PWA: manifest inline + service worker inline para uso offline
- [ ] Apple touch icon (emoji 🪙 como favicon SVG inline)
- [ ] Loading screen con animación
- [ ] Transiciones suaves entre pantallas (inicio → juego → game over)
- [ ] Haptics completos en todos los eventos
- [ ] Keyboard support: ↑/↓ = predecir, 1/2/3 = apuesta, Enter = confirmar, ESC = cerrar modal

## Criterios de Aceptación
- [ ] 4 temas visuales funcionales y persistidos
- [ ] Confeti masivo en milestones
- [ ] Frenzy mode visual activa en racha ≥10
- [ ] Música dinámica escala con racha
- [ ] Tutorial aparece solo en primera sesión
- [ ] PWA installable (manifest + service worker)
- [ ] Loading screen visible
- [ ] Transiciones suaves entre pantallas
- [ ] Keyboard support operativo
- [ ] Sin errores de consola
- [ ] Save/Load compatible con SPEC-003 y SPEC-004
