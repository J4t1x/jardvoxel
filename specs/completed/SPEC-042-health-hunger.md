# SPEC-042: Health & Hunger System

## Meta
- **Proyecto**: jardvoxel (minecraft variant)
- **Fase**: 5 — Gameplay Expansion
- **Estimacion**: 3 horas
- **Prioridad**: High
- **Dependencias**: SPEC-041 (passive mobs — drops de comida)

## Objetivo
Implementar sistema de salud (10 corazones) y hambre (10 drumsticks) para modo survival. Comida restaura hambre, hambre baja con el tiempo, sin hambre baja salud. Muerte a 0 HP con respawn.

## Tareas

### T1: Health & Hunger Stats
- [ ] Propiedades: health (20 = 10 corazones), hunger (20 = 10 drumsticks), saturation (hidden, 5 max)
- [ ] Health regenera si hunger >= 18 (0.5 HP cada 4s)
- [ ] Hunger baja: 0.5 puntos cada 40s (sprint: cada 20s)
- [ ] Si hunger = 0: health baja 1 HP cada 4s
- [ ] Solo aplica en modo survival

### T2: Food Items
- [ ] Beef (crudo): +3 hunger, +1.8 saturation
- [ ] Porkchop (crudo): +3 hunger, +1.8 saturation
- [ ] Chicken (crudo): +2 hunger, +1.2 saturation, 30% chance food poisoning
- [ ] Mutton (crudo): +2 hunger, +1.2 saturation
- [ ] Apple: +4 hunger, +2.4 saturation (de trees, ya existe)
- [ ] Food poisoning: hunger bar parpadea verde, hunger baja x2 por 30s

### T3: Eating
- [ ] Click derecho con food item seleccionado = comer (1.6s animacion)
- [ ] Restaurar hunger + saturation
- [ ] Consumir 1 item del stack
- [ ] Sonido de comer (crunch)

### T4: Damage Sources
- [ ] Fall damage: ya existe (SPEC-034), conectar con health
- [ ] Mob attack: mobs hostiles (futuro) o caida
- [ ] Drowning: 1 HP cada 2s bajo agua > 30s
- [ ] Fire/lava: 2 HP por tick en lava, 1 HP por tick en fuego
- [ ] Starvation: 1 HP cada 4s si hunger = 0

### T5: HUD
- [ ] 10 corazones (HTML/CSS) sobre hotbar, izquierda
- [ ] 10 drumsticks (HTML/CSS) sobre hotbar, derecha
- [ ] Corazones vacios = outline gris
- [ ] Hunger vacios = outline gris
- [ ] Food poisoning: drumsticks verdes parpadeantes
- [ ] Damage flash: pantalla roja semi-transparente al recibir daño

### T6: Death & Respawn
- [ ] Health = 0 → death screen (causa de muerte)
- [ ] Respawn: restaurar health=20, hunger=20, posicion spawn
- [ ] Drop todos los items al morir (inventario en el suelo)
- [ ] Death screen con boton "Respawn"

## Criterios de Aceptacion
- [ ] 10 corazones + 10 drumsticks visibles en HUD
- [ ] Comida restaura hunger correctamente
- [ ] Health regenera con hunger alto
- [ ] Starvation damage con hunger 0
- [ ] Fall damage conectado a health
- [ ] Death screen con causa de muerte
- [ ] Respawn restaura stats
- [ ] Solo aplica en survival mode
