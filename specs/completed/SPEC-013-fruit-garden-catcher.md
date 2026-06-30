# SPEC-013: Fruit Garden & Fruit Catcher Minigames

## Objetivo
Implementar dos minijuegos secundarios presentes en el original HTML pero faltantes en jardfruit-pro: Fruit Garden (frutas flotantes que el jugador toca para ganar monedas) y Fruit Catcher (frutas que caen después de un spin sin premio).

## Estado Actual
- `FruitGarden.ts` implementado: spawn periódico, movimiento, rebotes, upgrades, expiry
- `FruitCatcher.ts` implementado: caída con gravedad, captura, perfect catch bonus
- `SlotScene.ts` integrado: FruitGarden activo en idle, FruitCatcher tras spin sin premio
- `stats.fruitsCaught` se incrementa en ambos minijuegos
- Upgrades `goldenTouch`, `fruitMagnet`, `autoCatcher`, `fruitSprinkler`, `catchMaster` funcionales
- SFX `tapFruit` y `coin` usados en capturas
- Visibility API: pausa cuando tab oculto
- requestAnimationFrame para movimiento

## Requisitos

### Fruit Garden (Frutas Flotantes)
- [x] Spawn periódico de frutas flotantes cada 3 segundos (cuando no está girando/bono/gamble)
- [x] Máximo 3 frutas simultáneas (5 con upgrade `fruitSprinkler`)
- [x] Frutas se mueven con velocity y rebotan en bordes
- [x] 5% probabilidad de fruta dorada (⭐) que vale 50 monedas
- [x] Fruta normal vale 1-5 monedas aleatorias
- [x] Upgrade `goldenTouch`: valor x2
- [x] Upgrade `fruitMagnet`: frutas se acercan al centro
- [x] Upgrade `autoCatcher`: atrapa frutas automáticamente
- [x] Fruta expira a los 3 segundos con animación de fade
- [x] Warning visual a los 2 segundos (cambio de opacidad pulsante)
- [x] SFX `tapFruit` al atrapar
- [x] Vibración al atrapar
- [x] Score flotante "+N 🪙" en posición de la fruta
- [x] `stats.fruitsCaught` incrementado
- [x] Usar `requestAnimationFrame` para movimiento (no setInterval)
- [x] Pausar cuando tab oculto (Visibility API)

### Fruit Catcher (Frutas Cayendo)
- [x] Después de un spin sin premio, 3 frutas caen desde arriba
- [x] Cada fruta cae con gravedad progresiva (vy += 0.3)
- [x] Tap para atrapar: 2-10 monedas (x3 con upgrade `catchMaster`)
- [x] Perfect Catch (3/3): +20 monedas bonus + toast
- [x] Frutas se eliminan al salir de pantalla
- [x] Timeout de 2 segundos por fruta
- [x] SFX + vibración al atrapar
- [x] Score flotante en posición de captura
- [x] `stats.fruitsCaught` incrementado
- [x] No se activa si está en bono/gamble o auto-spin

### Integración con Phaser
- [x] Implementar como Phaser GameObjects (Text objects) sobre el canvas
- [x] Usar Phaser tweens para animaciones de captura/expiry
- [x] Manejar input events de Phaser para tap/click

## Criterios de Aceptación
- [x] Fruit Garden spawnea frutas cada 3s cuando idle
- [x] Frutas flotantes se mueven y rebotan correctamente
- [x] Tap en fruta = monedas + SFX + score flotante
- [x] Fruta dorada vale 50 monedas
- [x] Upgrades afectan correctamente (goldenTouch, fruitMagnet, autoCatcher, fruitSprinkler)
- [x] Fruit Catcher activa después de spin sin premio
- [x] 3 frutas caen con gravedad
- [x] Perfect Catch da bonus +20
- [x] Stats.fruitsCaught se incrementa
- [x] No interfiere con spins/bono/gamble
- [x] Performance 60fps mantenido (requestAnimationFrame)
- [x] Build sin errores

## Archivos a Crear
- `src/systems/FruitGarden.ts` — lógica de spawn, movimiento, colisión, expiry
- `src/systems/FruitCatcher.ts` — lógica de caída, gravedad, captura

## Archivos a Modificar
- `src/scenes/SlotScene.ts` — integrar Fruit Garden y Fruit Catcher
- `src/systems/Economy.ts` — actualizar stats.fruitsCaught
- `src/config/upgrades.ts` — sin cambios (ya existen los upgrades)

## Estimación
~4 horas
