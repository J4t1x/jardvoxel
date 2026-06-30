# SPEC-002: JardFruit Cocktail v2.0 — 15 Mejoras

## Objetivo
Agregar 15 mejoras al juego jardfruit-cocktail.html manteniendo el formato single-file.

## Mejoras

### Gameplay (4)
1. **Free Spins** — 3+ wilds 🍹 otorgan giros gratis con multiplicador x2
2. **Jackpot Progresivo** — 2% de cada apuesta acumula al jackpot, mostrado en HUD
3. **Scatter 🌟** — Nuevo símbolo que paga en cualquier posición, 3 = 5 free spins
4. **Challenges Diarios** — 3 objetivos aleatorios por día con recompensas

### Retención (3)
5. **Prestigio** — Reset a cambio de multiplicador permanente x1.5
6. **Achievement Popup** — Banner deslizable al desbloquear logros
7. **Level Progress Bar** — Ya existe, mejorar con texto "Xp para nivel N"

### UX (3)
8. **Volume Control** — Slider en lugar de toggle on/off
9. **Tutorial First-time** — Tooltips guiados si totalSpins === 0
10. **RTP visible** — Mostrar Return To Player en stats

### Pulido Visual (2)
11. **Animated Saldo** — Aplicar animateSaldo en todas las transacciones
12. **Reel Micro-glow** — Glow en símbolos ganadores potenciales al detenerse

### Technical (3)
13. **Particle Pooling** — Reutilizar elementos DOM para partículas
14. **PWA Offline** — Manifest + service worker inline
15. **Keyboard Support** — Espacio=SPIN, 1-5=apuestas, ESC=cerrar

## Criterios de Aceptación
- [ ] Juego funciona sin errores al cargar
- [ ] Save/Load compatible con versiones anteriores
- [ ] Mobile-first, 60fps target
- [ ] Sin dependencias externas
- [ ] Una sola línea de código roto = revert
