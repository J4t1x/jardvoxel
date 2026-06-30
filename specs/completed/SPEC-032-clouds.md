# SPEC-032: Nubes Procedurales

**Proyecto**: jard-games / jardvoxel
**Prioridad**: Media
**Estimación**: 4h
**Depende de**: SPEC-026 (sky overhaul) ✅

## Objetivo
Agregar capa de nubes procedurales animadas con noise, movimiento de viento y color dinámico.

## Features
- Capa de nubes a Y=50-60
- Noise generado proceduralmente (canvas 2D → textura)
- Movimiento con viento (dirección + velocidad variable)
- Color dinámico: blancas de día, rosadas al atardecer, grises de noche
- Múltiples planos para efecto volumétrico simple
- Opacidad variable según densidad de nube

## Tareas
- [ ] Crear CloudSystem class en jardvoxel.html
- [ ] Generar textura de nubes con canvas 2D + Perlin noise
- [ ] Crear planos con textura a diferentes alturas
- [ ] Animar movimiento con viento (offset en UV)
- [ ] Color dinámico según dayFactor
- [ ] Opacidad según densidad
- [ ] Seguir al jugador (position.copy)
- [ ] Integrar en _updateDayNight

## Acceptance Criteria
- ✅ Nubes visibles en cielo
- ✅ Movimiento suave con viento
- ✅ Color cambia con ciclo día/noche
- ✅ No afecta performance (<2ms por frame)
- ✅ Nubes siguen al jugador
