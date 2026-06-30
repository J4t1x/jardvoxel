# SPEC-031: Estructuras Mineshaft + Monument + Nuevas

**Proyecto**: jard-games / jardvoxel
**Prioridad**: Media
**Estimación**: 7h
**Depende de**: SPEC-028 (nuevos bloques)

## Objetivo
Mejorar mineshaft y monument existentes + agregar 10 nuevas estructuras menores.

## Mineshaft mejorado
- Túneles ramificados (2-3 bifurcaciones)
- Soportes con postes + viga superior (WOOD)
- TORCH blocks en paredes cada 4 bloques
- Conexión con cuevas naturales

## Monument mejorado
- Forma de templo marino con cúpula
- Tamaño 9x9 con múltiples niveles
- Pilares internos decorativos (PRISMARINE)
- Arco de entrada visible

## Nuevas estructuras (10)
1. Shipwreck (ocean) — barco hundido de WOOD con cofre
2. Igloo (tundra/snow) — cúpula de SNOW_BLOCK
3. Desert Well (desert) — pozo de SANDSTONE 3x3
4. Ice Spike (frozen_ocean/tundra) — pico de PACKED_ICE
5. Boulder (mountain) — roca de GRANITE/DIORITE/ANDESITE
6. Swamp Hut (swamp) — cabaña sobre pilotes
7. Jungle Temple (jungle) — estructura de MOSSY_COBBLE
8. Ruined Portal (cualquiera) — marco de OBSIDIAN con LAVA
9. Coral Reef (ocean cálido) — bloques decorativos de color
10. Forest Rock (forest) — formación de MOSSY_STONE

## Tareas
- [ ] Mejorar _placeMineshaft con bifurcaciones + torches
- [ ] Mejorar _placeMonument con cúpula + pilares
- [ ] Implementar _placeShipwreck
- [ ] Implementar _placeIgloo
- [ ] Implementar _placeDesertWell
- [ ] Implementar _placeIceSpike
- [ ] Implementar _placeBoulder
- [ ] Implementar _placeSwampHut
- [ ] Implementar _placeJungleTemple
- [ ] Implementar _placeRuinedPortal
- [ ] Implementar _placeCoralReef
- [ ] Implementar _placeForestRock
- [ ] Actualizar getStructureAt con nuevos tipos

## Acceptance Criteria
- ✅ 14 tipos de estructuras totales
- ✅ Mineshaft tiene bifurcaciones y torches
- ✅ Monument tiene cúpula y pilares
- ✅ Nuevas estructuras generan en biomas correctos
- ✅ Sin overlap entre estructuras
- ✅ Performance estable
