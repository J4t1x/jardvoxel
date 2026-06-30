# SPEC-040: Particle Effects + Block Lighting

## Meta
- **Proyecto**: jardvoxel
- **Fase**: 4 — Polish & Optimization
- **Estimacion**: 4 horas
- **Prioridad**: Medium
- **Dependencias**: SPEC-002 (in-progress)

## Objetivo
Anadir efectos de particulas (minado, colocacion, caminar) y iluminacion de bloques (torch, lava, glowstone).

## Tareas

### T1: Particle System
- [ ] Clase ParticleSystem con pool de THREE.Points
- [ ] Particles de minado (textura del bloque roto)
- [ ] Particles de colocacion (polvo)
- [ ] Particles al caminar (polvo en suelo)
- [ ] Particles de lluvia/nieve (bioma dependiente)

### T2: Block Lighting
- [ ] Propagacion de luz desde bloques emisivos
- [ ] Torch emite luz (ya parcial en SPEC-036)
- [ ] Lava emite luz naranja
- [ ] Smooth lighting entre bloques adyacentes

### T3: Ambient Effects
- [ ] Niebla en biomas frios
- [ ] Lluvia en biomas templados
- [ ] Niebla subterranea (oscuridad progresiva)

## Criterios de Aceptacion
- ✅ Particles de minado visibles
- ✅ Torch ilumina area circundante
- ✅ Lluvia/nieve segun bioma
- ✅ No impacto significativo en FPS
