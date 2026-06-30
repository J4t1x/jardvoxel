# SPEC-033: Inventario + Minado con Progreso

**Proyecto**: jard-games / jardvoxel
**Prioridad**: Alta
**Estimación**: 7h
**Depende de**: SPEC-028 (nuevos bloques)

## Objetivo
Sistema de inventario expansible + minado con progreso variable por dureza del bloque.

## Inventario
- Tecla E abre/cierra inventario expansible
- Grid de todos los bloques colocables (scroll/paginación)
- Click en bloque → selecciona para hotbar
- Hotbar sigue con 9 slots
- Inventario persiste durante sesión

## Minado con progreso
- Tiempo variable por dureza:
  - Dirt/Sand/Grass: 0.3s
  - Stone/Cobblestone: 1.0s
  - Ores: 1.5s
  - Obsidian: 3.0s
  - Bedrock: infinito (no se rompe)
- Indicador visual: overlay de grietas sobre el bloque
- 10 etapas de grietas (cada 10% de progreso)
- Reset al soltar click o cambiar de bloque
- Recoger bloque al romper (agregar al inventario)

## Modo creativo vs supervivencia
- Toggle con tecla C
- Creativo: minado instantáneo, bloques infinitos
- Supervivencia: minado con progreso, bloques limitados

## Tareas
- [ ] Crear sistema de inventario (UI HTML/CSS)
- [ ] Grid de bloques con scroll
- [ ] Tecla E para toggle
- [ ] Sistema de dureza por bloque (BLOCK_HARDNESS map)
- [ ] Tracking de bloque mirado + progreso de minado
- [ ] Overlay de grietas (CSS o canvas overlay)
- [ ] Recoger bloques al romper
- [ ] Toggle creativo/supervivencia (tecla C)
- [ ] Actualizar HUD con modo actual

## Acceptance Criteria
- ✅ Inventario abre con E, muestra todos los bloques
- ✅ Minado tiene progreso visual con grietas
- ✅ Dureza varía por tipo de bloque
- ✅ Bedrock no se rompe
- ✅ Bloques rotos se agregan al inventario
- ✅ Modo creativo = minado instantáneo
- ✅ Sin lag en UI
