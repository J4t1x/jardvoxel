# SPEC-038: Crafting System

## Meta
- **Proyecto**: jardvoxel
- **Fase**: 3 — Gameplay Systems
- **Estimacion**: 4 horas
- **Prioridad**: High
- **Dependencias**: SPEC-002 (in-progress)

## Objetivo
Implementar sistema de crafting con recetas, grid 2x2 (inventario) y 3x3 (mesa de trabajo), y output slot.

## Tareas

### T1: Crafting Recipes
- [ ] Definir 15+ recetas basicas (planks, sticks, crafting table, torch, furnace, bricks, glass, etc.)
- [ ] Sistema de matching (pattern-based + shapeless)
- [ ] Soporte para recetas con metadata (wood type variants)

### T2: Crafting UI
- [ ] Grid 2x2 en inventario (E)
- [ ] Grid 3x3 al abrir crafting table (click derecho)
- [ ] Output slot con preview
- [ ] Click para craft, arrastrar para mover items

### T3: Crafting Table Block
- [ ] Nuevo bloque: CRAFTING_TABLE (ID 51)
- [ ] Colocar con click derecho
- [ ] Abre UI de 3x3 al interactuar

### T4: Integration
- [ ] Conectar con Inventory existente
- [ ] Hotbar actualiza al craft
- [ ] Sound al craft

## Criterios de Aceptacion
- ✅ 15+ recetas funcionales
- ✅ Grid 2x2 y 3x3 operativos
- ✅ Crafting table colocable e interactiva
- ✅ Items craft persisten en inventario
