# SPEC-048: Settings Panel

## Priority: Medium
## Estimate: 3h
## Depends on: none

## Description

Add a settings panel accessible from the pause screen. Allows configuring render distance, FOV, mouse sensitivity, audio volume, and day/night length. Persists settings in localStorage.

## Settings

### Render Distance
- **Range**: 2-8 chunks (default: 5)
- **Effect**: Changes `RENDER_DIST` in ChunkManager
- **Warning**: Higher values = more chunks = lower FPS

### FOV (Field of View)
- **Range**: 60-110 degrees (default: 75)
- **Effect**: `camera.fov` + `camera.updateProjectionMatrix()`

### Mouse Sensitivity
- **Range**: 0.5-3.0 (default: 1.0)
- **Effect**: Multiplier on PointerLockControls movement

### Audio Volume
- **Range**: 0-100% (default: 50%)
- **Effect**: `GainNode.gain.value` in Web Audio API

### Day/Night Length
- **Range**: 60-600 seconds per full cycle (default: 300)
- **Effect**: `dayCycleDuration` in DayNightCycle

### Render Shadows
- **Toggle**: on/off (default: on)
- **Effect**: `renderer.shadowMap.enabled`

### Pixel Ratio
- **Range**: 1-3 (default: 2)
- **Effect**: `renderer.setPixelRatio()`

## UI Design

- **Access**: "Configuracion" button on pause screen
- **Panel**: Semi-transparent overlay (like inventory panel)
- **Layout**: Vertical list of settings with sliders + toggles
- **Sliders**: HTML range inputs with value display
- **Toggles**: Checkbox or button style
- **Close**: ESC or "Volver" button
- **Apply**: Settings apply immediately (live preview)

## Persistence

- **Storage**: `localStorage.setItem('jardvoxel_settings', JSON.stringify(settings))`
- **Load**: On game init, read settings and apply
- **Defaults**: If no saved settings, use defaults

## Acceptance Criteria

- [ ] Settings button on pause screen opens settings panel
- [ ] Render distance slider (2-8) works live
- [ ] FOV slider (60-110) works live
- [ ] Mouse sensitivity slider (0.5-3.0) works live
- [ ] Audio volume slider (0-100%) works live
- [ ] Day/night length slider (60-600s) works live
- [ ] Shadows toggle works
- [ ] Pixel ratio slider works
- [ ] Settings persist in localStorage across sessions
- [ ] Settings load on game start
- [ ] ESC or button closes panel
- [ ] No console errors

## Files to Modify

- `jardvoxel-survival.html` — Add settings panel HTML, CSS, JS logic
