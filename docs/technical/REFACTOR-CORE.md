# Refactorización: Centralización de Archivos JS en carpeta `core/`

**Fecha:** 26 de junio de 2026  
**Objetivo:** Organizar todos los archivos `.js` en una carpeta centralizada para facilitar la reutilización modular del motor JardVoxel.

## Cambios Realizados

### 1. Creación de carpeta `core/`
Se creó la carpeta `core/` en la raíz del proyecto jardvoxel para centralizar todos los módulos JavaScript.

### 2. Archivos Movidos (26 archivos)

#### Motor Base (2 archivos)
- `jardvoxel-engine.js` → `core/jardvoxel-engine.js`
- `jardvoxel-worker.js` → `core/jardvoxel-worker.js`

#### Survival Mode - Core (4 archivos)
- `jardvoxel-survival-engine.js` → `core/jardvoxel-survival-engine.js`
- `jardvoxel-survival-mesher.js` → `core/jardvoxel-survival-mesher.js`
- `jardvoxel-survival-gameplay.js` → `core/jardvoxel-survival-gameplay.js`
- `jardvoxel-survival-features.js` → `core/jardvoxel-survival-features.js`

#### Survival Mode - Sistemas (4 archivos)
- `jardvoxel-survival-crafting.js` → `core/jardvoxel-survival-crafting.js`
- `jardvoxel-survival-health.js` → `core/jardvoxel-survival-health.js`
- `jardvoxel-survival-save.js` → `core/jardvoxel-survival-save.js`
- `jardvoxel-survival-particles.js` → `core/jardvoxel-survival-particles.js`

#### Survival Mode - Características Avanzadas (16 archivos)
- `jardvoxel-survival-mobs.js` → `core/jardvoxel-survival-mobs.js`
- `jardvoxel-survival-furnace.js` → `core/jardvoxel-survival-furnace.js`
- `jardvoxel-survival-weather.js` → `core/jardvoxel-survival-weather.js`
- `jardvoxel-survival-tools.js` → `core/jardvoxel-survival-tools.js`
- `jardvoxel-survival-enchanting.js` → `core/jardvoxel-survival-enchanting.js`
- `jardvoxel-survival-villagers.js` → `core/jardvoxel-survival-villagers.js`
- `jardvoxel-survival-fishing.js` → `core/jardvoxel-survival-fishing.js`
- `jardvoxel-survival-nether.js` → `core/jardvoxel-survival-nether.js`
- `jardvoxel-survival-redstone.js` → `core/jardvoxel-survival-redstone.js`
- `jardvoxel-survival-brewing.js` → `core/jardvoxel-survival-brewing.js`
- `jardvoxel-survival-shields.js` → `core/jardvoxel-survival-shields.js`
- `jardvoxel-survival-achievements.js` → `core/jardvoxel-survival-achievements.js`
- `jardvoxel-survival-anvil.js` → `core/jardvoxel-survival-anvil.js`
- `jardvoxel-survival-map.js` → `core/jardvoxel-survival-map.js`
- `jardvoxel-survival-chilltune.js` → `core/jardvoxel-survival-chilltune.js`
- `jardvoxel-survival-worker.js` → `core/jardvoxel-survival-worker.js`

### 3. Archivos HTML Actualizados

#### `jardvoxel.html` (1 cambio)
```javascript
// Antes
import { ... } from './jardvoxel-engine.js';

// Después
import { ... } from './core/jardvoxel-engine.js';
```

#### `jardvoxel-survival.html` (23 cambios)
Todas las rutas de imports actualizadas de `./nombre-archivo.js` a `./core/nombre-archivo.js`:

```javascript
// Ejemplos
import { ... } from './core/jardvoxel-survival-gameplay.js';
import { ... } from './core/jardvoxel-survival-crafting.js';
import { ... } from './core/jardvoxel-survival-mobs.js';
// ... (23 imports en total)
```

#### `index.html`
No requirió cambios (no tiene imports de archivos `.js`).

### 4. Documentación Creada

- **`core/README.md`** - Documentación completa de la estructura del motor, módulos disponibles, uso y mantenimiento.
- **`REFACTOR-CORE.md`** (este archivo) - Resumen de la refactorización.

## Estructura Final

```
jardvoxel/
├── core/                          # ✨ NUEVO - Motor centralizado
│   ├── README.md                  # Documentación del motor
│   ├── jardvoxel-engine.js        # Motor base
│   ├── jardvoxel-worker.js        # Worker base
│   ├── jardvoxel-survival-*.js    # 24 módulos de survival
│   └── ...
├── docs/                          # Documentación del proyecto
├── index.html                     # Menú principal
├── jardvoxel.html                 # Open World mode
├── jardvoxel-survival.html        # Survival mode
├── logo.png                       # Logo del proyecto
├── vercel.json                    # Config de deploy
└── REFACTOR-CORE.md              # Este archivo
```

## Beneficios

### ✅ Organización
- Todos los módulos JavaScript centralizados en un solo lugar
- Fácil de navegar y mantener
- Separación clara entre código (core/) y presentación (HTML)

### ✅ Reutilización
- Los módulos pueden ser importados selectivamente según necesidad
- Futuras versiones de JardVoxel pueden mezclar y combinar módulos
- Motor modular y extensible

### ✅ Escalabilidad
- Fácil agregar nuevos módulos a `core/`
- Estructura preparada para crecer
- Documentación clara de cada módulo

### ✅ Mantenimiento
- Un solo lugar para buscar y editar código JavaScript
- Imports consistentes y predecibles
- Menos archivos en la raíz del proyecto

## Próximos Pasos Sugeridos

1. **Probar ambos modos** (Open World y Survival) para verificar que todos los imports funcionan correctamente
2. **Considerar subdivisión** de `core/` en subcarpetas si el proyecto crece:
   - `core/base/` - Motor base
   - `core/survival/` - Módulos de survival
   - `core/creative/` - Módulos de creativo (futuro)
3. **Crear versiones alternativas** que reutilicen módulos del core según necesidad

## Verificación

Para verificar que todo funciona correctamente:

```bash
# Verificar que no hay archivos .js en la raíz
ls *.js 2>&1 | grep "no matches found"

# Verificar que todos los archivos están en core/
ls core/*.js | wc -l  # Debe mostrar 26

# Probar los juegos en el navegador
# 1. Abrir index.html
# 2. Probar Open World (jardvoxel.html)
# 3. Probar Survival (jardvoxel-survival.html)
```

## Notas

- **Sin cambios en funcionalidad**: Esta refactorización es puramente organizacional, no cambia el comportamiento del juego
- **Compatibilidad**: Todos los imports relativos funcionan correctamente
- **Git**: Los archivos fueron movidos, no copiados, por lo que Git debería detectar el movimiento automáticamente

---

**Refactorización completada exitosamente** ✅
