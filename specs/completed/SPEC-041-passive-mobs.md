# SPEC-041: Passive Mobs — Animals with Simple AI

## Meta
- **Proyecto**: jardvoxel (minecraft variant)
- **Fase**: 5 — Gameplay Expansion
- **Estimacion**: 5 horas
- **Prioridad**: High
- **Dependencias**: SPEC-038 (crafting), SPEC-040 (particles)

## Objetivo
Anadir animales pasivos (cow, pig, chicken, sheep) con IA simple (wander, flee, idle) al minecraft variant. Los mobs se generan por bioma, tienen salud, pueden ser atacados y dropean items al morir.

## Tareas

### T1: Mob Manager
- [ ] Clase MobManager con pool de mobs (max 20 activos)
- [ ] Spawn por bioma (plains: cow/pig/sheep, forest: chicken/pig, jungle: chicken, savanna: cow)
- [ ] Despawn si distancia > 40 bloques del jugador
- [ ] Spawn limit: max 4 mobs por chunk, max 20 total

### T2: Mob Entity
- [ ] Clase Mob con: position, velocity, health, type, age, state
- [ ] Estados: idle, wander, flee, follow
- [ ] IA simple: wander random (cada 3-5s cambiar direccion), flee al ser atacado
- [ ] Colision con terreno (igual que player pero sin salto)
- [ ] Animacion basica: bob vertical al caminar, head tilt al idle

### T3: Mob Types (4)
- [ ] Cow (vaca): 10 HP, drop leather + beef, tamaño 0.9x1.4
- [ ] Pig (cerdo): 10 HP, drop porkchop, tamaño 0.9x0.9
- [ ] Chicken (pollo): 6 HP, drop feather + chicken, tamaño 0.6x0.8, puede volar corto
- [ ] Sheep (oveja): 8 HP, drop wool + mutton, tamaño 0.9x1.3

### T4: Combat & Drops
- [ ] Click izquierdo al mob = daño (raycast hit)
- [ ] Mob flash rojo al recibir daño
- [ ] Mob huye al ser atacado (flee state, velocidad x2)
- [ ] Mob muere a 0 HP, dropea items en el suelo
- [ ] Particles de daño (rojas) al golpear
- [ ] Particles de muerte (del color del mob)

### T5: Rendering
- [ ] Mobs renderizados como box-based meshes (body + head + 4 legs)
- [ ] Colores por tipo (cow: blanco+negro, pig: rosa, chicken: blanco+rojo, sheep: blanco)
- [ ] Billboard name tag opcional (toggle)
- [ ] Mobs visibles solo si estan en frustum

### T6: Integration
- [ ] MobManager.update(dt, playerPos) en game loop
- [ ] Mobs afectados por gravedad y colision de bloques
- [ ] Audio: hit sound (pitch por mob type), death sound
- [ ] Save: mobs persistidos en SaveManager (posicion, tipo, salud)

## Criterios de Aceptacion
- [ ] 4 tipos de mobs generados por bioma
- [ ] IA wander + flee funcional
- [ ] Combate con click izquierdo
- [ ] Drops al morir
- [ ] Particles de daño y muerte
- [ ] Max 20 mobs simultaneos sin impacto en FPS
- [ ] Mobs persisten en save/load
