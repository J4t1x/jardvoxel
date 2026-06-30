# SPEC-028: Nuevos Bloques (15-20 tipos)

**Proyecto**: jard-games / jardvoxel
**Prioridad**: Alta
**Estimación**: 4h
**Depende de**: SPEC-025 (AO + color variation) ✅

## Objetivo
Agregar 20 nuevos tipos de bloques al motor voxel con colores distintivos, reglas de generación procedural, y bloques emisivos (torch, lantern).

## Bloques a agregar (IDs 43-62)
1. BIRCH_WOOD (43) — blanco crema
2. SPRUCE_WOOD (44) — marrón oscuro
3. OAK_LEAVES_DARK (45) — verde oscuro
4. MOSS (46) — verde musgo, cuevas/pantanos
5. MYCELIUM (47) — gris-violeta, swamp
6. OBSIDIAN (48) — negro azulado, cerca de lava
7. LAPIS_ORE (49) — azul con vetas
8. REDSTONE_ORE (50) — rojo oscuro
9. EMERALD_ORE (51) — verde brillante (montañas, raro)
10. NETHERRACK (52) — rojo oscuro (lava lakes)
11. BASALT (53) — negro (cuevas profundas)
12. AMETHYST (54) — púrpura (cuevas raras)
13. BOOKSHELF (55) — planks + líneas (villages)
14. LANTERN (56) — amarillo cálido, emisivo
15. TORCH (57) — naranja, emisivo, no-sólido
16. TNT (58) — rojo
17. SPONGE (59) — amarillo
18. PUMPKIN (60) — naranja
19. MELON (61) — verde claro
20. BAMBOO (62) — verde claro delgado, no-sólido

## Tareas
- [ ] Agregar IDs al enum BLOCKS
- [ ] Agregar colores a BLOCK_COLORS
- [ ] Agregar nombres a BLOCK_NAMES
- [ ] Actualizar TRANSPARENT_BLOCKS (torch, bamboo, moss)
- [ ] Actualizar isSolidAt (torch, bamboo no-sólidos)
- [ ] Actualizar _raycastBlock skip list
- [ ] Generación procedural: obsidian cerca de lava, moss en cuevas, stone variants
- [ ] Nuevos ores (lapis, redstone, emerald) en getOreAt
- [ ] Actualizar hotbar con nuevos bloques
- [ ] Bloques emisivos: torch y lantern con color emisivo en mesh

## Acceptance Criteria
- ✅ 20 nuevos bloques con colores distintivos
- ✅ Obsidian genera cerca de lava
- ✅ Moss genera en cuevas húmedas
- ✅ Nuevos ores distribuidos por profundidad
- ✅ Torch y lantern son no-sólidos y emisivos
- ✅ Hotbar actualizado con selección de nuevos bloques
- ✅ Sin errores de consola al cargar
