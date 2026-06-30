# SPEC-020: Daily Login Reward Popup

## Objetivo
Mostrar un popup visual cuando el jugador recibe recompensa por login diario. Actualmente `DailyLogin.check()` se ejecuta en BootScene pero solo hace `console.log`.

## Estado Actual
- `DailyLogin.check()` funciona correctamente (suma saldo, actualiza streak)
- No hay feedback visual — el jugador no sabe que recibió recompensa
- `loginStreak` y `ultimoLogin` se actualizan pero son invisibles

## Requisitos

### FR-1: Popup de recompensa diaria
- Mostrar popup animado en BootScene cuando `reward > 0`
- Popup debe mostrar: día de streak, monto de recompensa, icono
- Animación: aparecer desde arriba, mantenerse 2s, desaparecer
- Audio: reproducir sfx 'coin' al mostrar

### FR-2: Indicador de streak en MenuScene
- Mostrar "🔥 Racha: X días" en MenuScene si loginStreak > 0
- Mostrar próximos 7 días con check en los completados

### FR-3: Persistencia visual
- El popup solo se muestra una vez por día (ya garantizado por DailyLogin.check)
- No bloquear el flujo — el popup se muestra sobre el fade-in

## Criterios de Aceptación
- [ ] Popup visible cuando hay recompensa de login diario
- [ ] Popup muestra día de streak y monto
- [ ] Audio 'coin' se reproduce al mostrar popup
- [ ] MenuScene muestra streak actual
- [ ] Popup no bloquea transición a MenuScene
- [ ] `npm run build` sin errores

## Archivos a Modificar
- `src/scenes/BootScene.ts` — agregar popup visual
- `src/scenes/MenuScene.ts` — mostrar streak actual

## Estimación
~1 hora
