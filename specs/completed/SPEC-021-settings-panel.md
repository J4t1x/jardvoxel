# SPEC-021: Settings Panel

## Objetivo
Agregar panel de configuración con control de volumen, toggle de audio, y reset de progreso. Actualmente `volume` está en el store y `AudioEngine` tiene `setVolume()`, pero no hay UI para ajustarlo.

## Estado Actual
- `state.volume` existe (default 70) pero no se puede cambiar desde UI
- `AudioEngine.setVolume()` existe pero solo se llama en SlotScene create
- `AudioEngine.setEnabled()` existe pero no se usa desde UI
- No hay forma de resetear progreso (solo `useGameStore.reset()` programáticamente)

## Requisitos

### FR-1: Settings como tab en InfoScene
- Agregar tab 'settings' a InfoScene
- Accesible desde menú ☰ como "⚙️ Configuración"

### FR-2: Control de volumen
- Slider visual de 0-100 para volumen
- Al cambiar, actualizar `state.volume` y llamar `AudioEngine.setVolume()`
- Persistir cambio con SaveManager.save()

### FR-3: Toggle de audio
- Botón para activar/desactivar audio
- Al desactivar: `AudioEngine.setEnabled(false)` + `state.volume = 0`
- Al activar: `AudioEngine.setEnabled(true)` + restaurar volumen anterior

### FR-4: Reset de progreso
- Botón "Resetear progreso" con confirmación
- Al confirmar: `useGameStore.reset()` + `SaveManager.clear()` + reiniciar escena
- Confirmación con doble tap o botón "Sí, resetear"

## Criterios de Aceptación
- [ ] Tab 'settings' agregado a InfoScene
- [ ] Slider de volumen funciona y persiste
- [ ] Toggle de audio funciona y persiste
- [ ] Reset de progreso funciona con confirmación
- [ ] Menú ☰ incluye "⚙️ Configuración"
- [ ] `npm run build` sin errores

## Archivos a Modificar
- `src/scenes/InfoScene.ts` — agregar tab settings + controles
- `src/scenes/SlotScene.ts` — agregar entrada de menú para settings
- `src/store/SaveManager.ts` — agregar método clear()

## Estimación
~1.5 horas
