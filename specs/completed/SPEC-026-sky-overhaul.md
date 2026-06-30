# SPEC-026: Sky Overhaul (Sol, Luna, Estrellas, Gradiente)

## Descripcion
Mejorar el cielo de JardVoxel con sol visible, luna, campo de estrellas, gradiente vertical y colores de atardecer/amanecer.

## Requisitos
1. Mesh de sol (esfera emisiva amarilla) que rota con dayTime
2. Mesh de luna (esfera grisácea) opuesta al sol
3. Campo de ~800 estrellas (THREE.Points) visibles de noche con fade
4. Gradiente de cielo vertical (horizonte claro, cenit oscuro)
5. Colores de atardecer/amanecer (tonos naranjas/rosados)
6. Fog alineada con color de horizonte

## Acceptance Criteria
- [ ] Sol visible como esfera emisiva amarilla
- [ ] Luna visible como esfera grisácea opuesta al sol
- [ ] Estrellas aparecen de noche y desaparecen de dia
- [ ] Cielo tiene gradiente vertical (no color plano)
- [ ] Atardecer/amanecer muestra tonos naranjas/rosados
- [ ] 60fps con RENDER_DIST=5
- [ ] Sin errores de consola

## Estimacion: 6h
## Dependencias: ninguna
