# SPEC-018: Code Quality Fixes (SaveManager, Split Files, Tests, Lint)

## Objetivo
Corregir issues de calidad de código identificados en el code review: SaveManager deep merge, separar archivos co-located, corregir import order, agregar ESLint config, y crear tests unitarios.

## Estado Actual
- `SaveManager.load()` hace shallow merge — nested objects no se mergean correctamente
- `BonusRound.ts` contiene `BonusRound` + `GambleRound` (2 clases en 1 archivo)
- `AchievementChecker.ts` contiene `AchievementChecker` + `ChallengeChecker` (2 clases en 1 archivo)
- `PaylineChecker.ts` tiene import de `SIMBOLOS` al final del archivo
- No hay ESLint config (el script `lint` fallará)
- No hay tests a pesar de tener vitest configurado
- `MysteryBox.shouldTrigger()` no se usa (SlotScene tiene su propia función)
- `main.ts` exporta `game` pero nadie lo importa (dead code)
- Physics config en `phaser.config.ts` pero nunca se usa

## Requisitos

### SaveManager Deep Merge
- [ ] Implementar deep merge recursivo para `upgrades` y `stats` objects
- [ ] Migración field-by-field como el HTML original:
  - `jackpotProgresivo` default 5000
  - `prestigeMult` default 1
  - `goldenHourMult` default 0
  - `challenges` default []
  - `volume` default 70
  - `musicEnabled` default true
  - `showGuides` default true
- [ ] Validar que saves antiguos carguen sin perder datos

### Split Files
- [ ] Mover `GambleRound` de `BonusRound.ts` a `src/systems/GambleRound.ts`
- [ ] Actualizar imports en `GambleScene.ts`
- [ ] Mover `ChallengeChecker` de `AchievementChecker.ts` a `src/systems/ChallengeChecker.ts`
- [ ] Actualizar imports en scenes que usen ChallengeChecker

### Import Order Fix
- [ ] Mover `import { SIMBOLOS } from '@config/symbols'` al top de `PaylineChecker.ts`

### ESLint Configuration
- [ ] Crear `eslint.config.mjs` con:
  - TypeScript parser
  - Recommended rules
  - Phaser globals (si necesario)
- [ ] Verificar que `npm run lint` pasa sin errores

### MysteryBox.shouldTrigger
- [ ] Eliminar `MysteryBoxShouldTrigger` duplicado en SlotScene
- [ ] Usar `MysteryBox.shouldTrigger()` de `MysteryBox.ts`

### Dead Code Cleanup
- [ ] Remover `export default game` de `main.ts`
- [ ] Remover physics config de `phaser.config.ts` (o documentar como futuro uso)

### Unit Tests
- [ ] `tests/rng.test.ts` — genSim distribution, luckyStraw effect, genCarrete
- [ ] `tests/paylineChecker.test.ts` — evalLine LTR/RTL, wild substitution, scatter count, jackpot detection
- [ ] `tests/economy.test.ts` — deductBet, applyWin, applyLoss, prestige, levelUp
- [ ] `tests/mysteryBox.test.ts` — roll distribution, shouldTrigger
- [ ] `tests/saveManager.test.ts` — save/load roundtrip, deep merge, migration
- [ ] `tests/bonusRound.test.ts` — bonus spin logic, exit handling
- [ ] `tests/gambleRound.test.ts` — card generation, win/loss/tie evaluation

## Criterios de Aceptación
- [ ] SaveManager hace deep merge de nested objects
- [ ] Saves antiguos cargan sin perder datos
- [ ] `GambleRound` en archivo separado
- [ ] `ChallengeChecker` en archivo separado
- [ ] Import de SIMBOLOS al top de PaylineChecker
- [ ] ESLint config creado y `npm run lint` pasa
- [ ] `MysteryBox.shouldTrigger()` usado en SlotScene
- [ ] Dead code removido
- [ ] Al menos 5 archivos de tests creados
- [ ] `npm run test` pasa sin errores
- [ ] `npm run build` sin errores

## Archivos a Crear
- `src/systems/GambleRound.ts` — extraído de BonusRound.ts
- `src/systems/ChallengeChecker.ts` — extraído de AchievementChecker.ts
- `eslint.config.mjs`
- `tests/rng.test.ts`
- `tests/paylineChecker.test.ts`
- `tests/economy.test.ts`
- `tests/mysteryBox.test.ts`
- `tests/saveManager.test.ts`
- `tests/bonusRound.test.ts`
- `tests/gambleRound.test.ts`

## Archivos a Modificar
- `src/store/SaveManager.ts` — deep merge
- `src/systems/BonusRound.ts` — remover GambleRound
- `src/systems/AchievementChecker.ts` — remover ChallengeChecker
- `src/systems/PaylineChecker.ts` — mover import al top
- `src/scenes/SlotScene.ts` — usar MysteryBox.shouldTrigger()
- `src/main.ts` — remover export
- `src/config/phaser.config.ts` — remover physics
- `src/scenes/GambleScene.ts` — actualizar import

## Estimación
~4 horas
