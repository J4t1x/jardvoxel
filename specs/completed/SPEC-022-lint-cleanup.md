# SPEC-022: Lint Cleanup — Fix All 22 Warnings

## Objetivo
Eliminar los 22 warnings de eslint en el código de jardfruit-pro.

## Criterios de Aceptación
- [x] 0 errors, 0 warnings en `eslint .`
- [x] `npm run build` sin errores
- [x] `npx vitest run` — 74 tests pasan
- [x] No se elimina ninguna funcionalidad

## Archivos Modificados
- `src/scenes/BonusScene.ts` — removed unused `title`, `state`
- `src/scenes/BootScene.ts` — removed unused `height`, `days` array
- `src/scenes/GambleScene.ts` — removed unused `title`, `dealerLabel`, `cardLabel`
- `src/scenes/InfoScene.ts` — prefixed unused `w` param with `_`
- `src/scenes/MenuScene.ts` — removed unused `subtitle`, `balanceText`, `levelText`, `hint`
- `src/scenes/MysteryScene.ts` — removed unused `title`
- `src/scenes/SlotScene.ts` — removed unused `f` from destructuring
- `src/systems/GuideSystem.ts` — removed unused `GUIDE_LINE_COLORS` import, `REEL_PAD`
- `src/systems/NearMissSystem.ts` — removed unused `REEL_PAD`, `x`, `y` in shakeReel
- `tests/fruitMinigames.test.ts` — removed unused `vi`, `beforeEach`, `Economy` imports

## Estado
✅ Completado
