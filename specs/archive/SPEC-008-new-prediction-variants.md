# SPEC-008: JardPredict — Nuevas Variantes de Predicción

## Descripción
Agregar 3 nuevos modos de predicción basados en la investigación: Arrow Flow, Coin Flip Rush, y Trend Hunter.

## Requisitos
- [ ] **Arrow Flow**: Flechas aparecen rápidamente (↑↓←→), jugador predice siguiente flecha, velocidad aumenta progresivamente
- [ ] **Coin Flip Rush**: Moneda gigante 3D (CSS transform), predecir cara/cruz, multiplicador por racha
- [ ] **Trend Hunter**: Línea neon estilo Tron dibujándose en tiempo real, predecir si termina arriba/abajo del punto actual
- [ ] Selector de modo muestra 8 modos totales (grid 4x2)
- [ ] Cada modo mantiene core mechanics (apuesta, racha, multiplicador, audio, haptics)
- [ ] HUD se adapta a cada modo
- [ ] Game over específico por modo
- [ ] High score separado por modo en localStorage

## Criterios de Aceptación
- [ ] Arrow Flow: flechas con velocidad progresiva, predicción funcional
- [ ] Coin Flip Rush: moneda 3D animada, cara/cruz funcional
- [ ] Trend Hunter: línea neon dibujándose, predicción arriba/abajo funcional
- [ ] Selector de modo muestra 8 modos sin overflow
- [ ] High scores separados por modo
- [ ] Sin errores de consola
- [ ] 60fps en todos los modos
- [ ] Mobile-first en todos los modos
