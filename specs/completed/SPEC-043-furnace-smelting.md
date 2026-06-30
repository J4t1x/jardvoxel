# SPEC-043: Furnace & Smelting

## Meta
- **Proyecto**: jardvoxel (minecraft variant)
- **Fase**: 5 — Gameplay Expansion
- **Estimacion**: 3 horas
- **Prioridad**: High
- **Dependencias**: SPEC-038 (crafting system)

## Objetivo
Implementar furnace (horno) con sistema de smelting: fuel + input = output. Furnace colocable, UI al interactuar, recetas de coccion, fuel con duracion variable.

## Tareas

### T1: Furnace Block
- [ ] Nuevo bloque: FURNACE (ID 53, ya definido en crafting.js)
- [ ] Color: gris piedra con boca oscura
- [ ] Colocable con click derecho
- [ ] Click derecho en furnace colocado → abre UI

### T2: Smelting Recipes
- [ ] Iron ore → iron ingot (10s)
- [ ] Gold ore → gold ingot (10s)
- [ ] Sand → glass (8s)
- [ ] Cobblestone → stone (10s)
- [ ] Raw beef → cooked beef (6s, +6 hunger)
- [ ] Raw porkchop → cooked porkchop (6s, +6 hunger)
- [ ] Raw chicken → cooked chicken (6s, +5 hunger, no poisoning)
- [ ] Raw mutton → cooked mutton (6s, +6 hunger)
- [ ] Clay → brick (8s, futuro)

### T3: Fuel System
- [ ] Coal: 8 items (80s burn)
- [ ] Wood/Planks: 1.5 items (15s burn)
- [ ] Stick: 0.5 items (5s burn)
- [ ] Lava bucket: 100 items (futuro)
- [ ] Fuel arde en background, input se cocina solo si hay fuel activo

### T4: Furnace UI
- [ ] Panel con 3 slots: fuel (bottom), input (top-left), output (top-right)
- [ ] Flame icon entre fuel y input (muestra burn progress)
- [ ] Arrow entre input y output (muestra cook progress)
- [ ] Cerrar con ESC o E
- [ ] Solo una furnace abierta a la vez

### T5: Furnace Logic
- [ ] Clase FurnaceEntity con: fuelSlot, inputSlot, outputSlot, burnTime, cookTime
- [ ] Tick: si burnTime > 0, decrementar. Si cookTime >= recipe.time, mover output
- [ ] Si no hay fuel y hay input + recipe: consumir 1 fuel, set burnTime
- [ ] Si no hay input: pausar cook
- [ ] Furnaces activos procesan en background (en game loop)
- [ ] Max 20 furnaces procesando simultaneamente

### T6: Integration
- [ ] Furnace state persistido en SaveManager
- [ ] Particles: smoke desde furnace activo (particula gris arriba)
- [ ] Luz: furnace activo emite luz naranja (PointLight)
- [ ] Audio: sonido de fuego leve cuando esta activo

## Criterios de Aceptacion
- [ ] Furnace colocable e interactiva
- [ ] 8+ recetas de smelting funcionales
- [ ] Fuel con duracion variable
- [ ] UI con fuel/input/output slots
- [ ] Procesamiento en background
- [ ] Furnace persiste en save/load
- [ ] Particles de smoke + luz cuando activo
