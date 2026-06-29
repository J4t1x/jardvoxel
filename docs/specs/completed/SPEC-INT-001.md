# SPEC-INT-001: Integración de Atmósfera y Sonido

**Proyecto:** jard-games/jardvoxel  
**Prioridad:** Media  
**Estimación:** 6h  
**Dependencias:** SPEC-075, SPEC-076, SPEC-084  
**Bloquea a:** INT-002  
**Estado:** ✅ Completado (v5.0.0-RC2)  

---

## Objetivo

Conectar los sistemas aislados de sonido ambiental, identidad de bioma y clima para que reaccionen a la posición, hora y contexto del jugador en `jardvoxel-survival.html`.

## Alcance

- Importar `AmbientSoundManager` y `BiomeIdentityManager` en el juego principal.
- Crear `AtmosphereSystem` que orqueste sonido, descubrimiento de biomas y transiciones según clima/hora/altitud.
- Persistir `discoveredBiomes` y configuración de volumen ambiental en el save.

## Criterios de aceptación

- [ ] Al entrar a un bioma, el nombre del bioma aparece brevemente en pantalla (toast o HUD).
- [ ] El sonido ambiental cambia entre bosque, desierto, océano, cueva y aldea.
- [ ] La lluvia aumenta el volumen de sonido de agua; la nieve reduce el volumen general.
- [ ] Al entrar bajo tierra, se activa el modo `indoor` con eco/reverb reducido.

## Archivos afectados

- `jardvoxel-survival.html`
- `core/jardvoxel-survival-gameplay.js`
- `core/jardvoxel-survival-save.js`

## Notas de implementación

- El sistema debe reutilizar `AmbientSoundManager` sin modificar su API interna.
- Detectar cueva como `y < 35` y bloque sólido sobre la cabeza del jugador.
- El toast de bioma debe tener cooldown de 30s para no saturar la UI.
