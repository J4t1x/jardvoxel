# SPEC-044: Weather System (Rain/Snow/Lightning)

## Meta
- **Proyecto**: jardvoxel (minecraft variant)
- **Fase**: 5 — Gameplay Expansion
- **Estimacion**: 3 horas
- **Prioridad**: Medium
- **Dependencias**: SPEC-040 (particles)

## Objetivo
Sistema de clima dinamico: lluvia en biomas templados, nieve en biomas frios, rayos ocasionales. Afecta visibilidad, audio, y gameplay.

## Tareas

### T1: Weather Manager
- [ ] Clase WeatherManager con estados: clear, rain, snow, thunder
- [ ] Probabilidad: 10% cada 120s de cambiar de clear → weather
- [ ] Duracion: 60-180s de weather, luego vuelve a clear
- [ ] Thunder: 30% chance durante rain → thunder storm
- [ ] Solo weather en biomas correspondientes (rain: plains/forest/swamp, snow: snowy/tundra)

### T2: Rain
- [ ] Particulas de lluvia: THREE.Points con velocity Y negativo
- [ ] ~500 particulas en area 32x32 alrededor del jugador
- [ ] Color azul-gris, opacidad 0.4, size 0.05
- [ ] Sky color cambia a gris oscuro durante rain
- [ ] Fog mas denso (near 20, far 40)
- [ ] Sonido de lluvia: noise blanco continuo, volumen bajo

### T3: Snow
- [ ] Particulas de nieve: THREE.Points con velocity Y lento + drift X/Z
- [ ] ~300 particulas en area 32x32
- [ ] Color blanco, opacidad 0.7, size 0.1
- [ ] Sky color mas blanco/gris claro
- [ ] Acumulacion visual: no modificar bloques, solo overlay blanco en suelo (futuro)

### T4: Lightning
- [ ] Flash blanco pantalla completa (0.1s)
- [ ] PointLight temporal en posicion aleatoria cercana (0.5s)
- [ ] Sonido de trueno 1-3s despues del flash
- [ ] Frecuencia: cada 5-15s durante thunder
- [ ] Rayo puede golpear bloque: fuego temporal en bloque impactado (2s)

### T5: Integration
- [ ] WeatherManager.update(dt, playerPos, biome) en game loop
- [ ] Particles reutilizan ParticleSystem pool
- [ ] Sky color interpolado suavemente (clear → weather → clear)
- [ ] Rain/snow sigue al jugador (posicion relativa)
- [ ] Audio: rain loop (noise), thunder clap (burst)

## Criterios de Aceptacion
- [ ] Rain visible con particulas y sky oscurecido
- [ ] Snow visible con particulas y drift
- [ ] Lightning con flash + thunder sound
- [ ] Weather biome-dependiente
- [ ] Transiciones suaves clear ↔ weather
- [ ] No impacto significativo en FPS (<5% drop)
- [ ] Audio de lluvia y truenos
