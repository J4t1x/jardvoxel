# SPEC-034: Nadar + Físicas + Audio

**Proyecto**: jard-games / jardvoxel
**Prioridad**: Alta
**Estimación**: 7h
**Depende de**: SPEC-033 (inventario + minado)

## Objetivo
Mecánicas de natación, física mejorada y audio procedural Web Audio API.

## Natación
- Flotabilidad en agua (sube lentamente)
- Velocidad reducida en agua (50% de normal)
- Space para nadar hacia arriba
- Sprint no funciona en agua
- Animación de bobbing en superficie

## Físicas
- Daño por caída: >4 bloques sin volar = daño
- Sprint con stamina: barra que se regenera, limita tiempo de carrera
- Crouch (Ctrl): velocidad reducida, anti-caída de bordes, paso 1 bloque

## Audio procedural (Web Audio API)
- Romper bloque: pitch varía por material
- Colocar bloque: sonido corto
- Pasos: ritmo según superficie y velocidad
- Salto: sonido ascendente
- Splash al entrar/salir del agua
- Ambiente de cueva: eco + tono bajo
- Ambiente de superficie: pájaros (tonos aleatorios)

## Tareas
- [ ] Detectar si jugador está en agua (chunkMgr.getBlock)
- [ ] Implementar flotabilidad y velocidad reducida
- [ ] Implementar daño por caída (tracking fallDistance)
- [ ] Implementar stamina para sprint
- [ ] Implementar crouch (Ctrl)
- [ ] Crear AudioSystem class con Web Audio API
- [ ] Sonido de romper (oscilador + envelope)
- [ ] Sonido de colocar
- [ ] Sonido de pasos
- [ ] Sonido de splash
- [ ] Ambiente de cueva
- [ ] Integrar en game loop

## Acceptance Criteria
- ✅ Jugador flota y nada en agua
- ✅ Velocidad reducida al nadar
- ✅ Daño por caída >4 bloques
- ✅ Stamina limita sprint
- ✅ Crouch funciona con Ctrl
- ✅ Audio suena al romper/colocar/pasar/saltar
- ✅ Audio de ambiente en cuevas
- ✅ Sin latencia noticeable
