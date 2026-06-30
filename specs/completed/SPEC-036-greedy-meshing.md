# SPEC-036: Greedy Meshing + AO Optimization

**Proyecto**: jard-games / jardvoxel
**Prioridad**: Media
**Estimación**: 7h
**Depende de**: SPEC-025 (AO) ✅

## Objetivo
Implementar greedy meshing real (fusionar caras adyacentes) y optimizar cálculo de AO.

## Greedy meshing real
- Fusionar caras adyacentes del mismo tipo de bloque en quads grandes
- Reducir vertex count de 4 por cara a 4 por quad fusionado
- Algoritmo: por dirección (6 caras), por slice, fusionar runs horizontales
- Mantener AO por vértice en quads fusionados (promedio o esquinas)

## AO optimization
- Cache de vecinos sólidos por chunk
- Cálculo incremental: solo recalcular AO en bloques modificados
- Precomputar AO map al generar chunk

## Tone mapping
- ACESFilmicToneMapping para colores más cinematográficos

## Luces puntuales
- Torch y LANTERN emiten luz puntual (PointLight)
- Lava emisiva en cuevas (color naranja)
- Limitar número de luces puntuales activas (max 8)

## Tareas
- [ ] Implementar greedy meshing en buildChunkMesh
- [ ] Fusionar runs horizontales por slice
- [ ] Mantener AO en quads fusionados
- [ ] Cache de vecinos por chunk
- [ ] Tone mapping ACESFilmic
- [ ] PointLight para torch y lantern
- [ ] Limitar luces puntuales activas

## Acceptance Criteria
- ✅ Vertex count reducido >40% en chunks
- ✅ AO correcto en quads fusionados
- ✅ Tone mapping mejora rango dinámico
- ✅ Torches emiten luz puntual
- ✅ Performance 60fps estable
- ✅ Sin artefactos visuales
