# SPEC-001: Template base game-template.html

## Descripción
Template reutilizable con todas las mecánicas clicker implementadas, listo para personalizar.

## Requisitos
- [x] HTML single-file con CSS y JS embebidos
- [x] Fondo animado (gradient + aurora + estrellas)
- [x] Pantalla de inicio con icono pulsante
- [x] Sistema de fases dinámicas (4 fases)
- [x] Motor de movimiento físico (velocity, bouncing, behaviors)
- [x] Comportamientos: drift, zigzag, orbital, pulsante, mini, gigante
- [x] Combo system con ventana de 1.5s
- [x] Streak meter con boost x2 automático
- [x] Critical hits (x2/x3/x5)
- [x] 5 power-ups (doble, slowmo, magnet, freeze, frenzy)
- [x] Indicador de dificultad progresiva
- [x] HUD distribuido por bordes
- [x] Audio Web API sintetizado
- [x] Haptics (navigator.vibrate)
- [x] Partículas, ondas, confeti, screen shake
- [x] Pantalla final con reinicio

## Criterios de Aceptación
- [x] Abrir template en navegador = juego funcional
- [x] Mobile-first responsive
- [x] 60fps con 6 entidades simultáneas
- [x] Todas las mecánicas operativas
- [x] HUD sin superposiciones
- [x] Audio funcional
- [x] Personalizable con placeholders (GAME_NAME, GAME_TITLE, etc.)

## Estado
Completado. Template en `templates/game-template.html`.
