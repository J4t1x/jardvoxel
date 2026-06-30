# SPEC-015: Guide Overlay & Near-Miss Visualization

## Objetivo
Implementar el sistema de guías predictivas (payline overlay), símbolos fantasma, active line tracker durante spin, y enhance de near-miss visualization.

## Estado Actual
- `GuideSystem.ts` implementado: payline overlay, toggle, ghost symbols, probability hints, active line tracker, pre-spin flash
- `NearMissSystem.ts` implementado: detección 4/5, línea roja interrumpida, shake, toast, flash púrpura, consolación
- `SlotScene.ts` integrado: botón toggle 📐, pre-spin flash, near miss usando NearMissSystem
- `showGuides` persiste en save/load via gameStore
- `PaylineChecker.detectNearMiss()` ya expuesto

## Requisitos

### Payline Overlay Toggle
- [x] Botón toggle 📐 en HUD bottom
- [x] Dibujar 5 paylines con Phaser Graphics sobre reels
- [x] Colores diferenciados: horizontales dorado, diagonales púrpura, extra verde
- [x] Opacity 0.4 en reposo, 0.8 durante flash
- [x] Persistir `showGuides` en save/load

### Ghost Symbols
- [x] Símbolos fantasma semitransparentes arriba y abajo de las 3 filas visibles
- [x] `opacity: 0.15`
- [x] Solo visibles en reposo (no durante spin)
- [x] Generar símbolos aleatorios para ghost positions

### Active Line Tracker
- [x] Después de cada reel detenido (secuencial), evaluar paylines vivas
- [x] Líneas con 3+ en racha: iluminar dorado intenso (alpha 0.8)
- [x] Líneas inactivas: atenuar a opacity 0.1
- [x] Líneas con 4+ en racha + reel 4 girando: pulse rápido dorado
- [x] No revela resultado final, solo potencial

### Pre-spin Flash
- [x] Al presionar SPIN, flash de 0.3s de todas las paylines
- [x] Las líneas se desvanecen al iniciar spin

### Near-Miss Enhancement
- [x] Cuando 4/5 en línea: mostrar línea interrumpida en rojo por 0.5s
- [x] Shake del reel que falló
- [x] Toast "¡CASI! 4/5 [símbolo]"
- [x] SFX nearMiss
- [x] Flash púrpura
- [x] +5 monedas de consolación (`BALANCE.nearMissConsolation`)
- [x] Activar shake nudge (ver SPEC-014)

### Symbol Probability Hints
- [x] Puntos de color bajo cada reel indicando frecuencia relativa
- [x] Dorado para wild
- [x] Solo visible cuando `showGuides` activo
- [x] Opacity 0.3

## Criterios de Aceptación
- [x] Botón toggle de guías visible y funcional
- [x] 5 paylines dibujadas con colores diferenciados
- [x] Estado de guías persiste en save/load
- [x] Ghost symbols visibles arriba/abajo en reposo
- [x] Active line tracker ilumina líneas vivas durante spin
- [x] Pre-spin flash de paylines
- [x] Near-miss muestra línea roja + shake + toast + consolación
- [x] Probability hints visibles con guías activas
- [x] Performance 60fps mantenido
- [x] Build sin errores

## Archivos a Crear
- `src/systems/GuideSystem.ts` — drawGuides, toggleGuides, updateActiveLines, flashAllLines
- `src/systems/NearMissSystem.ts` — detectNearMiss, showNearMiss, updateNearMissGuide

## Archivos a Modificar
- `src/scenes/SlotScene.ts` — integrar guide system y near-miss
- `src/systems/PaylineChecker.ts` — mover import al top, exponer detectNearMiss
- `src/config/paylines.ts` — ya tiene LINEAS y GUIDE_LINE_COLORS

## Estimación
~4 horas
