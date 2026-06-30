# SPEC-037: Web Worker Chunk Generation + LOD

**Proyecto**: jard-games / jardvoxel
**Prioridad**: Baja
**Estimación**: 8h
**Depende de**: SPEC-036 (greedy meshing)

## Objetivo
Mover generación de chunks a Web Worker y agregar LOD por distancia.

## Web Worker
- Crear WorldGenWorker.js (inline blob para mantener single-file)
- Worker recibe: chunk coords + seed + world config
- Worker retorna: block data (Uint8Array transferable)
- Main thread: recibe data, construye mesh
- Queue de chunks pendientes con prioridad (cercanos primero)
- Max 1 worker (single-file constraint)

## LOD por distancia
- Chunks cercanos (0-2): full detail (todas las caras)
- Chunks medios (3-4): skip caras inferiores y caras entre bloques sólidos
- Chunks lejanos (5+): solo superficie (top faces), sin AO
- Frustum culling: no renderizar chunks fuera de vista

## Tareas
- [ ] Crear worker inline (Blob URL)
- [ ] Mover WorldGenerator + VoxelChunk al worker
- [ ] Message passing: main → worker (gen request), worker → main (block data)
- [ ] Queue con prioridad por distancia
- [ ] Implementar LOD por distancia en buildChunkMesh
- [ ] Frustum culling con camera frustum
- [ ] Integrar en ChunkManager.update

## Acceptance Criteria
- ✅ Generación no bloquea render thread
- ✅ Sin stuttering al generar chunks
- ✅ LOD reduce vertex count en chunks lejanos
- ✅ Frustum culling elimina chunks no visibles
- ✅ Performance 60fps estable con RENDER_DIST=5
- ✅ Mantener single-file (worker via Blob)
