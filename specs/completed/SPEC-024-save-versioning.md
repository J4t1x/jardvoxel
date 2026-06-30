# SPEC-024: Save Versioning — Migration Support

## Objetivo
Agregar versionado al sistema de guardado para permitir migraciones futuras cuando cambie el esquema de GameState.

## Estado Actual
- SaveManager.save() y load() no tienen concepto de versión
- Si se agregan campos nuevos en el futuro, saves antiguos podrían romperse
- No hay mecanismo de migración

## Requisitos

### FR-1: Campo saveVersion en GameState
- Agregar `saveVersion: number` a la interfaz GameState
- `createInitialState()` debe incluir `saveVersion: CURRENT_SAVE_VERSION`
- Exportar constante `CURRENT_SAVE_VERSION = 1`

### FR-2: SaveManager.load() con migración
- Al cargar, leer `saveVersion` del save (default 0 si no existe)
- Ejecutar `SaveManager.migrate(data, fromVersion)` antes de mergear
- El resultado debe tener `saveVersion: CURRENT_SAVE_VERSION`

### FR-3: Método migrate()
- `static migrate(data: any, fromVersion: number): any`
- v0 → v1: agregar saveVersion=1 (no breaking changes)
- Punto de extensión para futuras migraciones

### FR-4: Tests
- Test: save antiguo sin saveVersion se migra a versión 1
- Test: save nuevo incluye saveVersion=1

## Criterios de Aceptación
- [x] `saveVersion` en GameState interface
- [x] `CURRENT_SAVE_VERSION` exportada desde Economy
- [x] `SaveManager.migrate()` implementado
- [x] `SaveManager.load()` usa migrate()
- [x] Tests de migración pasan
- [x] `npm run build` sin errores
- [x] `npx eslint .` — 0 errors, 0 warnings

## Archivos Modificados
- `src/systems/Economy.ts` — agregar `CURRENT_SAVE_VERSION`, `saveVersion` en interface e initial state
- `src/store/SaveManager.ts` — importar `CURRENT_SAVE_VERSION`, usar `migrate()` en `load()`, agregar método `migrate()`
- `tests/saveManager.test.ts` — 2 tests nuevos (migración + saveVersion en save nuevo)

## Estado
✅ Completado
