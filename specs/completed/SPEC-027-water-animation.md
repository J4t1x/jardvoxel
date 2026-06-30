# SPEC-027: Water Animation (Olas + Profundidad)

## Descripcion
Mejorar el agua con olas animadas, color por profundidad y efecto fresnel.

## Requisitos
1. Olas animadas con sin/cos en vertex position Y
2. Color por profundidad (turquesa claro en orillas, azul oscuro en profundo)
3. Fresnel effect (mas reflectante en angulos rasantes)
4. Linea de costa (transicion suave agua-arena)
5. Crestas blancas en maximos de ola

## Acceptance Criteria
- [ ] Agua tiene movimiento de olas visible
- [ ] Color varia segun profundidad del agua
- [ ] Efecto fresnel en angulos rasantes
- [ ] Transicion suave en linea de costa
- [ ] 60fps con RENDER_DIST=5
- [ ] Sin errores de consola

## Estimacion: 5h
## Dependencias: ninguna
