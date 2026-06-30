# SPEC-039: Save/Load System

## Meta
- **Proyecto**: jardvoxel
- **Fase**: 4 — Polish & Optimization
- **Estimacion**: 3 horas
- **Prioridad**: High
- **Dependencias**: SPEC-002 (in-progress)

## Objetivo
Persistir mundo, posicion del jugador, inventario y bloques modificados usando IndexedDB.

## Tareas

### T1: Save Manager
- [ ] Clase SaveManager con IndexedDB
- [ ] Serializar chunks modificados (solo diferencias)
- [ ] Serializar posicion, inventario, seed, tiempo de juego

### T2: Auto-save
- [ ] Auto-save cada 30 segundos
- [ ] Save al cerrar (beforeunload)
- [ ] Indicador visual de save (icono disco)

### T3: Load al iniciar
- [ ] Cargar save al detectar seed existente
- [ ] Restaurar chunks modificados despues de generar
- [ ] Restaurar posicion e inventario

### T4: UI
- [ ] Boton "Nuevo Mundo" vs "Continuar"
- [ ] Slot de save unico (ultimo mundo)

## Criterios de Aceptacion
- ✅ Mundo persiste entre sesiones
- ✅ Bloques modificados se restauran
- ✅ Inventario y posicion se restauran
- ✅ Auto-save sin bloquear gameplay
