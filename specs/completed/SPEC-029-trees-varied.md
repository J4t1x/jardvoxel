# SPEC-029: Árboles Variados por Bioma

**Proyecto**: jard-games / jardvoxel
**Prioridad**: Alta
**Estimación**: 5h
**Depende de**: SPEC-028 (nuevos bloques) 

## Objetivo
Reemplazar el árbol único actual con 6 tipos de árboles distintos, cada uno generado según el bioma donde aparece.

## Tipos de árboles
1. **Roble** (forest/plains) — tronco 4-5, copa redondeada asimétrica, WOOD + LEAVES
2. **Jungla** (jungle) — tronco 2x2, altura 8-12, copa grande con vines, WOOD + LEAVES
3. **Abeto/pino** (taiga) — tronco alto delgado, copa cónica, SPRUCE_WOOD + LEAVES
4. **Manglar** (mangrove) — raíces visibles, copa dispersa, WOOD + LEAVES
5. **Muerto** (swamp) — tronco sin hojas, ramas extendidas, WOOD
6. **Savanna** (savanna) — tronco grueso corto, copa plana ancha, WOOD + LEAVES

## Tareas
- [ ] Refactorizar _placeTree para usar tipos
- [ ] Implementar _placeOakTree
- [ ] Implementar _placeJungleTree (2x2 trunk)
- [ ] Implementar _placeSpruceTree (conical)
- [ ] Implementar _placeMangroveTree (roots)
- [ ] Implementar _placeDeadTree (branches, no leaves)
- [ ] Implementar _placeSavannaTree (flat top)
- [ ] Actualizar hasTreeAt para usar bioma correcto
- [ ] Usar BIRCH_WOOD para forest, SPRUCE_WOOD para taiga

## Acceptance Criteria
- ✅ 6 tipos de árboles visualmente distintos
- ✅ Cada bioma genera su tipo correcto
- ✅ Árboles de jungla tienen tronco 2x2
- ✅ Abetos tienen copa cónica
- ✅ Árboles muertos no tienen hojas
- ✅ Sin overlap con estructuras
- ✅ Performance estable (60fps)
