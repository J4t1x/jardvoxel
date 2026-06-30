# SPEC-030: Estructuras Detalladas Village + Temple

**Proyecto**: jard-games / jardvoxel
**Prioridad**: Media
**Estimación**: 7h
**Depende de**: SPEC-028 (nuevos bloques)

## Objetivo
Mejorar las estructuras village y temple con detalle arquitectónico: puertas, ventanas, chimeneas, techos a dos aguas, caminos, plaza central.

## Village mejorado
- 3-4 plantillas de casas distintas (casa pequeña, casa grande, taller, granja)
- Puertas (gap de 2 bloques)
- Ventanas (glass blocks en paredes)
- Chimeneas con COBBLESTONE
- Techos a dos aguas (escalera de WOOD)
- Caminos de GRAVEL entre casas
- Plaza central con pozo de agua
- Faroles en postes (LANTERN blocks)
- Vallas de WOOD alrededor

## Temple mejorado
- Pirámide escalonada mesoamericana (5 capas)
- Entrada visible (gap en base)
- Cámara interior con AIR space
- Pilares en esquinas (SANDSTONE)
- Escaleras de acceso entre capas
- Bandera/estandarte en la cima (WOOL color)

## Tareas
- [ ] Refactorizar _placeVillage con casas detalladas
- [ ] Implementar _placeHouseSmall (3x4, 1 puerta, 1 ventana)
- [ ] Implementar _placeHouseLarge (5x6, 2 ventanas, chimenea)
- [ ] Implementar _placeWell (pozo central 3x3)
- [ ] Implementar _placePath (gravel entre casas)
- [ ] Implementar _placeLampPost (post + lantern)
- [ ] Refactorizar _placeTemple con 5 capas
- [ ] Agregar pilares y entrada al temple

## Acceptance Criteria
- ✅ Village tiene casas con puertas, ventanas y techos
- ✅ Caminos de gravel conectan casas
- ✅ Plaza central con pozo
- ✅ Temple tiene 5 capas con pilares
- ✅ Sin bloques fuera de chunk bounds
- ✅ Performance estable
