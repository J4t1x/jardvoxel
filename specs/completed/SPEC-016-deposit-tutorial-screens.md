# SPEC-016: Deposit, Tutorial & Info Screens

## Objetivo
Implementar las pantallas faltantes: Deposit (carga de saldo), Tutorial (onboarding), Paytable, Upgrades, Achievements, Stats, Challenges.

## Estado Actual
- No existe ninguna pantalla de información en jardfruit-pro
- `DEPOSIT_PACKS` definido en `balance.ts` pero sin UI
- `ACHIEVEMENTS_DATA` definido pero sin pantalla de logros
- `UPGRADES_DATA` definido pero sin pantalla de tienda
- `CHALLENGES_POOL` definido pero sin pantalla de retos
- No hay tutorial
- No hay paytable visual

## Requisitos

### Deposit Screen
- [ ] Pantalla modal con packs de recarga (6 opciones)
- [ ] Pack popular destacado visualmente
- [ ] Input custom para monto manual (1-999,999)
- [ ] Display de saldo actual
- [ ] SFX coin + coin rain al cargar
- [ ] `stats.totalDeposited` actualizado
- [ ] Toast de confirmación
- [ ] Info: "Modo demo — montos virtuales"

### Tutorial System
- [ ] 6 pasos de tutorial con icon, title, text
- [ ] Mostrar solo si `tutorialVisto === false` Y `totalSpins === 0`
- [ ] Navegación: botón "Siguiente" / "¡Jugar!"
- [ ] Dots indicadores de progreso
- [ ] Persistir `tutorialVisto` al completar

### Paytable Screen
- [ ] Grid de cartas por símbolo
- [ ] Cada carta: emoji, nombre, multiplicadores x3/x4/x5
- [ ] Tags especiales: WILD, BONUS, SCATTER
- [ ] Info: pago bidireccional, wild sustituye, scatter free spins, bonus ronda

### Upgrades Screen
- [ ] Lista de 15 upgrades
- [ ] Cada item: icon, name, desc, precio, botón comprar
- [ ] Estados: comprado (✓), affordable, can't afford
- [ ] Compra: descuenta saldo, activa upgrade, SFX, toast
- [ ] Actualizar lista después de compra

### Achievements Screen
- [ ] Lista de 16 achievements
- [ ] Cada item: emoji (o 🔒), name, desc, premio
- [ ] Estado: desbloqueado vs bloqueado
- [ ] Popup animado al desbloquear (banner deslizable)

### Stats Screen
- [ ] Secciones: Resumen, Giros, Bonos & Gamble, Features, Extras
- [ ] Display: saldo, high score, nivel, EXP, total giros, premios, apostado, ganado
- [ ] Mayor premio, mejor racha, bonos, gamble W/L, jackpots
- [ ] Scatters, free spins, prestigios, retos hoy
- [ ] Frutas, login streak, RTP %, multiplicador prestigio
- [ ] Botón de prestigio si `canPrestige()`

### Challenges Screen
- [ ] 3 retos diarios aleatorios
- [ ] Cada reto: icon, name, desc, progress bar, reward
- [ ] Estado: completado (✅) vs pendiente
- [ ] Auto-renovación cada 24 horas
- [ ] Toast al completar reto

### Integración Phaser
- [ ] Implementar como Scene overlays o DOM elements sobre canvas
- [ ] Botón de menú 📋 con dropdown: Cargar, Pagos, Upgrades, Logros, Stats, Retos
- [ ] Cerrar con ESC o botón "Cerrar"
- [ ] Backdrop semi-transparente

## Criterios de Aceptación
- [ ] Deposit screen funcional con 6 packs + input custom
- [ ] Tutorial muestra en primera sesión (6 pasos)
- [ ] Paytable muestra todos los símbolos con multiplicadores
- [ ] Upgrades screen permite comprar y muestra estados
- [ ] Achievements screen muestra logros desbloqueados/bloqueados
- [ ] Stats screen muestra todas las métricas + RTP
- [ ] Challenges screen muestra 3 retos con progress
- [ ] Achievement popup animado al desbloquear
- [ ] Menú dropdown funcional
- [ ] Build sin errores

## Archivos a Crear
- `src/scenes/DepositScene.ts`
- `src/scenes/TutorialScene.ts`
- `src/scenes/PaytableScene.ts`
- `src/scenes/UpgradesScene.ts`
- `src/scenes/AchievementsScene.ts`
- `src/scenes/StatsScene.ts`
- `src/scenes/ChallengesScene.ts`

## Archivos a Modificar
- `src/scenes/SlotScene.ts` — menú dropdown, navegación a pantallas
- `src/config/phaser.config.ts` — registrar nuevas scenes
- `src/systems/AchievementChecker.ts` — achievement popup trigger

## Estimación
~6 horas
