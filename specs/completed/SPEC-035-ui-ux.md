# SPEC-035: UI/UX — Minimapa, Reloj, Pantalla Muerte

**Proyecto**: jard-games / jardvoxel
**Prioridad**: Media
**Estimación**: 5h
**Depende de**: SPEC-026 (sky overhaul) ✅

## Objetivo
Mejorar UI/HUD con minimapa, reloj de día/noche y pantalla de muerte.

## Minimapa
- Esquina superior derecha
- Canvas 128x128px
- Muestra biomas cercanos con colores representativos
- Punto central = jugador
- Rotación con cámara (o norte fijo)
- Radio ~5 chunks

## Reloj / indicador de hora
- Esquina superior izquierda (debajo de info)
- Icono sol/luna según fase del día
- Texto: "Día" / "Tarde" / "Noche" / "Amanecer"
- Barra de progreso del ciclo

## Pantalla de muerte
- Aparece al morir (caída, lava, etc.)
- Texto "Has muerto" en rojo
- Botón "Respawn" explícito
- Muestra causa de muerte
- Coordenadas de muerte

## Distancia al spawn
- Indicador en HUD: "Spawn: Xm"

## Tareas
- [ ] Crear minimapa canvas en HTML
- [ ] Renderizar biomas con colores en minimapa
- [ ] Punto de jugador en centro
- [ ] Crear reloj con icono sol/luna
- [ ] Texto de fase del día
- [ ] Implementar pantalla de muerte (HTML/CSS)
- [ ] Tracking de causa de muerte
- [ ] Botón respawn funcional
- [ ] Indicador de distancia al spawn
- [ ] Actualizar HUD con nuevos elementos

## Acceptance Criteria
- ✅ Minimapa muestra biomas cercanos
- ✅ Reloj muestra fase del día
- ✅ Pantalla de muerte aparece al morir
- ✅ Botón respawn funciona
- ✅ Distancia al spawn visible
- ✅ UI no interfiere con gameplay
