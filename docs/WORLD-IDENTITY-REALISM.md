# World Identity Realism Update

## Objetivo
Mejorar el `WorldIdentity` para generar mundos que se sientan más reales, basados en la Tierra actual y su historia geológica reciente.

## Cambios Implementados

### 1. Edades Geológicas Realistas (Cenozoico)

**Antes:**
- `YOUNG`, `MATURE`, `OLD` (nombres genéricos)
- Distribución uniforme 33% cada una

**Después:**
- **Paleogene** (66-23 Ma): 10% probabilidad
- **Neogene** (23-2.6 Ma): 20% probabilidad  
- **Quaternary** (2.6 Ma-presente): 70% probabilidad

**Impacto:** La mayoría de mundos generados están en el Cuaternario (era actual), lo que produce paisajes más familiares y reconocibles.

---

### 2. Eventos Geológicos Históricos Reales

**Antes:**
- Eventos ficticios: `volcanic_era`, `ice_age`, `great_flood`, etc.
- Sin contexto temporal

**Después (Eventos del Cuaternario):**

| Evento | Temperatura | Nivel del Mar | Vegetación | Período |
|--------|-------------|---------------|------------|---------|
| **Pleistocene Glaciation** | -0.18°C | -8m | 70% | 2.6 Ma-11.7 ka |
| **Last Glacial Maximum** | -0.25°C | -12m | 60% | 26.5-19 ka |
| **Holocene Optimum** | +0.08°C | +2m | 120% | 9-5 ka |
| **Younger Dryas** | -0.15°C | -3m | 80% | 12.9-11.7 ka |
| **Eemian Interglacial** | +0.12°C | +6m | 130% | 130-115 ka |
| **Toba Supereruption** | -0.1°C | 0m | 50% | 74 ka |
| **Alpine Orogeny** | 0°C | 0m | 100% | 65-2.6 Ma |
| **Anthropocene** | +0.15°C | +1m | 90% | 1950-presente |

**Impacto:** Los mundos tienen historia geológica verificable. Un mundo con "Last Glacial Maximum" tendrá glaciares extensos, nivel del mar bajo, y vegetación reducida.

---

### 3. Parámetros Terrestres Realistas

#### Temperatura Global
**Antes:** ±0.4°C (demasiado variable)  
**Después:** ±0.15°C (rango realista vs +1.1°C actual desde pre-industrial)

#### Cobertura Oceánica
**Antes:** 40-60% (muy variable)  
**Después:** 68-74% (centrado en 71%, valor real de la Tierra)

#### Número de Continentes
**Antes:** 2-5 continentes  
**Después:** 5-9 continentes (centrado en 7, valor real de la Tierra)

#### Rotación Axial
**Nuevo:** 20.5-26.5° (centrado en 23.5°, inclinación real de la Tierra)  
**Impacto:** Afecta estaciones y distribución de temperatura

#### Excentricidad Orbital
**Nuevo:** 0.01-0.03 (centrado en 0.0167, valor real de la Tierra)  
**Impacto:** Afecta variación estacional y ciclos climáticos

---

### 4. Gradiente de Temperatura Latitudinal

**Nuevo Sistema:**
```javascript
// Ecuador cálido → Polos fríos
const latitude = Math.abs(z) / 10000; // 0 = ecuador, 1 = polo
const latitudeEffect = -0.5 * Math.pow(latitude, 1.5);
```

**Impacto:**
- Biomas tropicales cerca del ecuador (z ≈ 0)
- Biomas templados en latitudes medias
- Tundra y hielo en polos (|z| > 8000)

---

### 5. Sistema de Eventos Sin Duplicados

**Antes:** Podían repetirse eventos (ej: 2x `ice_age`)  
**Después:** Máximo 1 ocurrencia de cada evento histórico

**Impacto:** Historias geológicas más coherentes y diversas.

---

### 6. Información de Mundo Mejorada

**Antes:**
```json
{
  "geologicalAge": "mature",
  "climateOffset": 0.12,
  "oceanCoverage": 0.53
}
```

**Después:**
```json
{
  "geologicalAge": "Quaternary (2.6 Ma-present)",
  "climateOffset": "+0.08°C",
  "oceanCoverage": "71.2%",
  "axialTilt": "23.1°",
  "orbitalEccentricity": "0.0165",
  "worldHistory": [
    "Holocene Optimum (9-5 ka)",
    "Anthropocene (1950-present)"
  ]
}
```

---

## Ejemplos de Mundos Generados

### Mundo 1: "Tierra Post-Glacial"
- **Edad:** Quaternary (2.6 Ma-present)
- **Eventos:** Last Glacial Maximum + Holocene Optimum
- **Temperatura:** -0.17°C (frío residual)
- **Océano:** 69.8% (nivel bajo por glaciación)
- **Continentes:** 7
- **Resultado:** Mundo con glaciares en retroceso, costas emergentes, vegetación en expansión

### Mundo 2: "Tierra Cálida"
- **Edad:** Quaternary (2.6 Ma-present)
- **Eventos:** Eemian Interglacial + Anthropocene
- **Temperatura:** +0.27°C (cálido)
- **Océano:** 72.5% (nivel alto)
- **Continentes:** 6
- **Resultado:** Mundo tropical, costas inundadas, vegetación exuberante

### Mundo 3: "Tierra Volcánica"
- **Edad:** Neogene (23-2.6 Ma)
- **Eventos:** Alpine Orogeny + Toba Supereruption
- **Temperatura:** -0.1°C
- **Océano:** 70.1%
- **Continentes:** 8
- **Resultado:** Montañas jóvenes, actividad volcánica alta, minerales abundantes

---

## Validación Científica

### Temperatura
- Rango: -0.25°C a +0.27°C
- Referencia: Tierra actual +1.1°C vs pre-industrial
- ✅ Realista

### Nivel del Mar
- Rango: -12m a +6m (relativo a presente)
- Referencia: LGM -120m, Eemian +6m
- ✅ Realista (escalado para gameplay)

### Cobertura Oceánica
- Rango: 68-74%
- Referencia: Tierra 71%
- ✅ Realista

### Continentes
- Rango: 5-9
- Referencia: Tierra 7 (África, Antártida, Asia, Europa, América del Norte, Oceanía, América del Sur)
- ✅ Realista

---

## Impacto en Gameplay

### Exploración
- Mundos más familiares y navegables
- Distribución de biomas predecible (tropical → templado → polar)

### Inmersión
- Historia geológica verificable
- Eventos con nombres reales aumentan credibilidad

### Variedad
- 8 eventos históricos × 3 edades × variación de parámetros = miles de combinaciones únicas
- Cada mundo sigue siendo único pero dentro de límites terrestres

---

## Próximos Pasos (Opcional)

1. **Placas Tectónicas:** Simular bordes de placas para volcanes y montañas
2. **Corrientes Oceánicas:** Afectar clima regional (ej: Corriente del Golfo)
3. **Ciclos de Milankovitch:** Variación orbital a largo plazo
4. **Biomas Históricos:** Megafauna del Pleistoceno, bosques del Carbonífero

---

## Conclusión

El `WorldIdentity` mejorado genera mundos que:
- ✅ Se sienten como la Tierra real
- ✅ Tienen historia geológica coherente
- ✅ Mantienen variedad procedural
- ✅ Son científicamente plausibles
- ✅ Mejoran la inmersión sin sacrificar gameplay

**Fecha de implementación:** 29 Junio 2026  
**Archivo modificado:** `core/jardvoxel-survival-world-hierarchy.js`  
**Líneas afectadas:** 43-211
