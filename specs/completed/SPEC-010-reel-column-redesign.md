# SPEC-010: Reel Column System Redesign — Guides, Separators, Lights & Effects

## Objetivo
Perfeccionar el sistema de columnas (reels) del slot jardfruit-cocktail.html: agregar sistema de guías predictivas para previsualizar posibilidades, separación visual entre figuras, iluminación dinámica por columna, y efectos visuales premium durante spin, stop y win. Mantener formato single-file, mobile-first, 60fps.

## Estado Actual
- 5 columnas (reels) con `gap:5px` entre ellas
- Cada reel: `background:var(--color-reel)` plano, `border:1px solid rgba(255,255,255,0.08)`
- Símbolos pegados sin separación vertical dentro del reel
- Glow trail solo durante spin (gradiente sutil)
- No hay iluminación diferenciada por columna
- No hay separadores visibles entre filas de símbolos
- Efectos de stop limitados a `reelBounce` (0.25s)
- No hay sistema de guías para previsualizar líneas ganadoras
- Las 5 paylines solo se muestran después de evaluar el resultado (win-line-overlay)
- El usuario no puede ver qué líneas están activas durante el spin
- No hay indicación de qué símbolos podrían venir en cada reel

## Mejoras

### 1. Separadores entre Figuras (Reel Row Dividers)
- **Separador horizontal** entre cada fila de símbolos dentro de cada reel
- Línea sutil con gradiente: `rgba(255,215,0,0.05)` → `rgba(255,215,0,0.15)` → `rgba(255,215,0,0.05)`
- Grosor: 1px con `box-shadow` de 2px blur para efecto difuminado
- **Separador vertical** entre columnas más pronunciado:
  - Aumentar `gap` de 5px a 8px (mobile) / 12px (tablet+)
  - Borde dorado sutil (`rgba(255,215,0,0.12)`) en cada reel
  - Sombra interior vertical entre reels para efecto profundidad

### 2. Iluminación por Columna (Per-Reel Lighting)
- **Reel background gradient**: Reemplazar `background:var(--color-reel)` plano con:
  ```css
  background:linear-gradient(180deg,
    rgba(22,33,62,0.95) 0%,
    rgba(22,33,62,0.7) 50%,
    rgba(22,33,62,0.95) 100%
  );
  ```
  Efecto: centro más iluminado, bordes superior/inferior más oscuros (spotlight effect)
- **Top glow line**: Barra de luz dorada en el borde superior de cada reel:
  ```css
  border-top:2px solid rgba(255,215,0,0.2);
  box-shadow:inset 0 4px 12px rgba(255,215,0,0.08);
  ```
- **Bottom shadow line**: Sombra oscura en borde inferior para efecto profundidad 3D:
  ```css
  border-bottom:2px solid rgba(0,0,0,0.3);
  box-shadow:inset 0 -4px 8px rgba(0,0,0,0.2);
  ```
- **Side bevel**: Sombra lateral izquierda + luz lateral derecha para efecto columna 3D:
  ```css
  box-shadow:inset 2px 0 4px rgba(0,0,0,0.15), inset -2px 0 4px rgba(255,255,255,0.03);
  ```

### 3. Luces Dinámicas (Dynamic Lighting Effects)
- **Reel idle glow**: Pulso dorado sutil cada 3s cuando el reel está en reposo:
  ```css
  @keyframes reelIdleGlow{
    0%,100%{box-shadow:inset 0 0 0 rgba(255,215,0,0)}
    50%{box-shadow:inset 0 0 20px rgba(255,215,0,0.05)}
  }
  ```
  Stagger de 0.6s entre reels para efecto secuencial
- **Spin light sweep**: Luz que barre verticalmente cada reel durante el spin:
  ```css
  @keyframes reelSweep{
    0%{transform:translateY(-100%);opacity:0}
    50%{opacity:0.6}
    100%{transform:translateY(100%);opacity:0}
  }
  ```
  Elemento `<div class="reel-sweep">` dentro de cada reel, visible solo durante `.girando`
- **Stop flash**: Flash de luz dorada al detenerse cada reel (ya existe `stopping`, agregar):
  ```css
  .reel.stopping .reel-flash{
    animation:reelStopFlash 0.4s ease-out;
  }
  @keyframes reelStopFlash{
    0%{opacity:0;transform:scale(0.8)}
    30%{opacity:0.8;transform:scale(1.1)}
    100%{opacity:0;transform:scale(1)}
  }
  ```
  Elemento `<div class="reel-flash">` centrado en cada reel

### 4. Efectos Visuales Adicionales
- **Symbol cell background**: Cada símbolo con fondo sutil alternado (zebra striping):
  ```css
  .reel-symbol:nth-child(odd){
    background:rgba(255,255,255,0.015);
  }
  ```
  Efecto: distinción clara entre filas sin ser invasivo
- **Reel frame**: Marco dorado decorativo en el contenedor de reels:
  ```css
  .reels-container{
    border:2px solid rgba(255,215,0,0.2);
    box-shadow:
      0 0 30px rgba(255,215,0,0.1),
      inset 0 0 20px rgba(0,0,0,0.3);
  }
  ```
- **Corner ornaments**: 4 adornos decorativos en las esquinas del reels-container:
  ```css
  .reel-corner{position:absolute;width:20px;height:20px;border:2px solid rgba(255,215,0,0.3)}
  .reel-corner.tl{top:-2px;left:-2px;border-right:none;border-bottom:none;border-radius:8px 0 0 0}
  .reel-corner.tr{top:-2px;right:-2px;border-left:none;border-bottom:none;border-radius:0 8px 0 0}
  .reel-corner.bl{bottom:-2px;left:-2px;border-right:none;border-top:none;border-radius:0 0 0 8px}
  .reel-corner.br{bottom:-2px;right:-2px;border-left:none;border-top:none;border-radius:0 0 8px 0}
  ```
- **Win line glow enhancement**: Cuando hay línea ganadora, las columnas involucradas se iluminan:
  ```css
  .reel.winning{
    box-shadow:
      0 0 20px rgba(255,215,0,0.3),
      inset 0 0 15px rgba(255,215,0,0.1);
    border-color:rgba(255,215,0,0.4);
  }
  ```
- **Anticipation upgrade**: Cuando un reel está en anticipation, agregar partículas doradas flotantes dentro del reel:
  ```css
  .reel.anticipation::before{
    content:'';
    position:absolute;inset:0;
    background:radial-gradient(circle at 50% 50%, rgba(255,215,0,0.1) 0%, transparent 60%);
    animation:anticipationGlow 0.4s ease-in-out infinite;
  }
  ```

### 5. Efectos de Profundidad 3D
- **Reel inset shadow**: Sombra interior superior e inferior para efecto "túnel":
  ```css
  .reel::before,.reel::after{
    content:'';position:absolute;left:0;right:0;height:20px;z-index:2;pointer-events:none;
  }
  .reel::before{
    top:0;
    background:linear-gradient(180deg,rgba(13,13,26,0.6) 0%,transparent 100%);
  }
  .reel::after{
    bottom:0;
    background:linear-gradient(0deg,rgba(13,13,26,0.6) 0%,transparent 100%);
  }
  ```
  Efecto: los símbolos parecen salir de un túnel oscuro
- **Reel 3D tilt enhancement**: Aumentar el `perspective` y `rotateX` durante spin:
  ```css
  .reels-container.girando .reel-3d{
    transform:perspective(800px) rotateX(12deg);
  }
  ```
  Y agregar sombra proyectada al pie de cada reel

### 6. Micro-Animaciones de Símbolos
- **Symbol entry animation**: Cuando los símbolos se renderizan después del spin, animar entrada:
  ```css
  @keyframes symbolEntry{
    0%{opacity:0;transform:scale(0.5) translateY(10px)}
    60%{opacity:1;transform:scale(1.1) translateY(0)}
    100%{opacity:1;transform:scale(1) translateY(0)}
  }
  .reel-symbol.fresh{animation:symbolEntry 0.3s ease-out}
  ```
  Aplicar clase `fresh` a símbolos recién renderizados en `renderReel()` y `spinReel()` post-spin
- **Symbol hover/idle micro-bounce**: Símbolos con leve flotación cuando el reel está en reposo:
  ```css
  @keyframes symbolFloat{
    0%,100%{transform:translateY(0)}
    50%{transform:translateY(-2px)}
  }
  .reel-symbol:not(.win):not(.jackpot-win){
    animation:symbolFloat 3s ease-in-out infinite;
  }
  ```
  Stagger por posición para efecto ondulante

### 7. Sistema de Guías Predictivas (Pre-spin Preview & Line Guides)

Sistema que permite al usuario visualizar las líneas de pago activas y previsualizar posibilidades durante y antes del spin.

#### 7.1 Payline Overlay Toggle
- **Botón toggle** en el HUD bottom (junto a bet-buttons o control-row) con icono `📐` o `🔍` que muestra/oculta las 5 paylines
- Cuando está activo, dibuja las 5 líneas con SVG sobre el reels-container:
  - Líneas horizontales (filas 0, 1, 2): color `rgba(255,215,0,0.3)`
  - Líneas diagonales (V y V invertida): color `rgba(124,58,237,0.3)`
  - Línea extra zigzag (si se compró el upgrade): color `rgba(0,255,136,0.3)`
- Cada línea con `stroke-dasharray` animado (efecto flujo) como el win-line-overlay existente
- Las líneas se muestran con `opacity:0.4` en reposo y `opacity:0.7` durante spin
- Persistir estado en `gameState.showGuides` (save/load)

#### 7.2 Ghost Symbols (Previsualización de Símbolos Adyacentes)
- Mostrar **símbolos fantasma** semitransparentes arriba y abajo de las 3 filas visibles:
  - Fila superior fantasma: `opacity:0.15` (símbolo que estaba antes)
  - Fila inferior fantasma: `opacity:0.15` (símbolo que vendría después)
- Solo visibles cuando el reel está en reposo (no durante spin)
- Efecto: el usuario ve que hay más símbolos en el strip, creando sensación de profundidad
- Implementación: Renderizar 5 símbolos en el strip (2 fantasma + 3 visibles + 0 extra) en lugar de 3, con `translateY` ajustado para mostrar solo 3 visibles + medio símbolo fantasma arriba/abajo
- Los símbolos fantasma tienen `filter:blur(1px) opacity(0.15)` para efecto dream

#### 7.3 Active Line Tracker (Durante el Spin)
- A medida que cada reel se detiene secuencialmente (reel 0 → reel 4), el sistema evalúa qué paylines siguen **vivas** (podrían ganar):
  - Reel 0 detenido: todas las líneas están vivas (parpadean suavemente)
  - Reel 1 detenido: las líneas donde reel[0] y reel[1] coinciden se iluminan más
  - Reel 2 detenido: las líneas con 3+ en racha se iluminan con color dorado intenso
  - Reel 3 detenido: las líneas con 4 en racha brillan con anticipación
  - Reel 4 detenido: se evalúa resultado final
- Implementación: Después de cada `spinReel()` individual, llamar a `updateActiveLines(reelIdx)` que:
  1. Lee los símbolos ya detenidos en reels 0..reelIdx
  2. Para cada payline, verifica si los símbolos hasta ahora son compatibles (mismo símbolo o wild)
  3. Marca las líneas activas con clase `.line-active` en el SVG overlay
- Las líneas inactivas se atenúan a `opacity:0.1`
- Las líneas activas se iluminan a `opacity:0.8` con `stroke:var(--color-gold)`
- **No revela el resultado final** — solo muestra qué líneas tienen potencial basado en los reels ya detenidos

#### 7.4 Pre-spin Line Flash
- Al presionar SPIN, antes de que comience la animación:
  1. Flash breve (0.3s) de todas las paylines con color dorado brillante
  2. Las líneas se desvanecen al iniciar el spin
  3. Efecto: "aquí están tus posibilidades, ¡gira!"
- Implementación: En `doSpin()`, antes de `blurReels(true)`, llamar a `flashAllLines()` que agrega clase `.flash` al overlay por 300ms

#### 7.5 Symbol Probability Hints (Opcional, toggle)
- Pequeños puntos de color bajo cada reel que indican la **frecuencia relativa** de símbolos:
  - 🍒 (peso 25): 5 puntos
  - 🍑 (peso 20): 4 puntos
  - 🍋 (peso 18): 4 puntos
  - 🍎 (peso 15): 3 puntos
  - 🍐 (peso 10): 2 puntos
  - 🍉 (peso 7): 2 puntos
  - 🍹 wild (peso 3): 1 punto dorado
  - 🌟 scatter (peso 3): 1 punto púrpura
- Solo visible cuando `showGuides` está activo
- Posicionado en la parte inferior del reel, fuera del área visible de símbolos
- `font-size:4px` por punto, `gap:2px`, `opacity:0.3`
- Efecto: el usuario entiende qué símbolos son más probables sin mostrar números

#### 7.6 Near-Miss Guide Enhancement
- Cuando un reel se detiene y una línea tiene 3 símbolos iguales pero el reel 3 no coincide:
  - Mostrar la línea interrumpida con color rojo (`var(--color-red)`) por 0.5s
  - Efecto de "casi" visualmente claro
- Cuando una línea tiene 4 símbolos iguales y el reel 4 está girando (anticipation):
  - La línea se pone dorada brillante y pulsa rápido
  - Efecto: tensión visual máxima antes del resultado final

## Criterios de Aceptación
- [ ] Separadores horizontales visibles entre las 3 filas de símbolos en cada reel
- [ ] Separación vertical entre columnas más clara (gap aumentado + bordes)
- [ ] Iluminación gradient en background de cada reel (spotlight effect)
- [ ] Luz dorada en borde superior de cada reel
- [ ] Sombra en borde inferior para efecto profundidad
- [ ] Side bevel 3D en cada reel
- [ ] Reel idle glow con stagger secuencial
- [ ] Spin light sweep animado durante giro
- [ ] Stop flash al detenerse cada reel
- [ ] Zebra striping sutil en filas de símbolos
- [ ] Marco dorado mejorado en reels-container
- [ ] 4 adornos en esquinas del reels-container
- [ ] Reel.winning ilumina columnas ganadoras
- [ ] Anticipation con glow radial interno
- [ ] Sombra túnel superior/inferior en reels (inset shadow)
- [ ] 3D tilt mejorado durante spin
- [ ] Symbol entry animation al detenerse
- [ ] Symbol idle float con stagger
- [ ] Botón toggle de guías visible en HUD bottom
- [ ] 5 paylines dibujadas con SVG al activar guías
- [ ] Paylines con colores diferenciados (horizontales dorado, diagonales púrpura, extra verde)
- [ ] Estado de guías persiste en save/load
- [ ] Ghost symbols visibles arriba/abajo de filas en reposo
- [ ] Ghost symbols con blur y opacity reducida
- [ ] Active line tracker ilumina líneas vivas durante spin secuencial
- [ ] Líneas inactivas se atenúan durante spin
- [ ] Líneas con 3+ en racha brillan dorado intenso
- [ ] Líneas con 4 en racha + anticipation pulsan rápido
- [ ] Pre-spin flash de todas las paylines al presionar SPIN
- [ ] Symbol probability hints visibles con guías activas
- [ ] Near-miss muestra línea interrumpida en rojo
- [ ] Guías no afectan performance (60fps mantenido)
- [ ] Juego funciona sin errores al cargar
- [ ] Mobile-first, 60fps target mantenido
- [ ] Sin dependencias externas
- [ ] Save/Load compatible con versiones anteriores
- [ ] Una sola línea de código roto = revert

## Restricciones Técnicas
- **Solo CSS + JS vanilla** — sin librerías externas
- **Single-file** — todo dentro de jardfruit-cocktail.html
- **Performance**: Las animaciones deben usar `transform` y `opacity` (GPU-accelerated)
- **No layout thrash**: Los pseudo-elementos `::before`/`::after` no deben causar reflow
- **Z-index**: Los overlays de reel (sweep, flash, tunnel shadow) deben estar por encima del strip pero por debajo del win-line-overlay
- **Responsive**: Los efectos deben escalar correctamente en pantallas <380px, 600px, 768px y 1024px

## Archivos a Modificar
- `games/jardfruit-cocktail.html` — CSS (sección `<style>`) + HTML (estructura de reels + botón toggle + overlay SVG) + JS (clases dinámicas en renderReel/spinReel + updateActiveLines + flashAllLines + ghost symbols + probability hints)

## Estimación
~5-6 horas
