# Opciones de balance: evaluación exploratoria

Fecha: 15 de octubre de 2026. Se evaluaron cambios hipotéticos; **no se modificaron el motor, las cartas ni las reglas del MVP**. El objetivo es elegir qué prototipar, no declarar una dificultad final aceptable. Todavía no hay tasas objetivo acordadas.

Versión para compartir: [informe PDF de alternativas de balance](../../output/pdf/alternativas-balance-el-costo-del-equilibrio.pdf), ocho páginas. Se genera desde los resultados guardados con `build_report.py` (requiere ReportLab); incluye comparación de variantes, recomendaciones, método y anexos por escenario.

## Conclusión

Conviene ajustar micro y macro por separado. Micro necesita que elegir sin criterio tenga costos efectivos. Macro necesita que preservar Tesoro tenga contrapartidas más importantes sobre las otras barras.

Las dos candidatas más útiles de esta exploración conservan las veinte cartas y no requieren un sistema recurrente nuevo:

- **Micro: intensificar costos de las decisiones.** Multiplicar los componentes negativos por 1,5 reduce la victoria al azar a 28,4–35,6 %, siempre B a 51,2–72,0 % y siempre A a 3,0–12,4 %. La conservadora informada gana 91,8–95,6 %; la planificadora informada, 99,8–100 %. Es una prueba de sensibilidad, no una propuesta de multiplicar indiscriminadamente todo el catálogo. Caja sigue siendo el principal cuello de botella.
- **Macro: reforzar sacrificios sobre las barras no monetarias.** Duplicar los componentes negativos de Actividad, Bienestar y Confianza, manteniendo Tesoro, deja azar en 19,6–34,8 %, siempre B en 6,4–22,6 %, conservadora en 70,2–79,4 % y planificadora en 97,0–98,2 %. Reduce la receta B sin añadir presión monetaria directa. Las políticas exactas siguen teniendo una ventaja de información respecto de un principiante.

Todos los rangos describen mínimos y máximos entre los cinco escenarios de cada modo, con 500 partidas por celda. No son intervalos de confianza ni resultados de personas reales. No se certificó solvencia de todos los mazos ni optimalidad de ninguna política.

## Alternativas y limitaciones

### Bajar valores iniciales

Es el ajuste más pequeño, pero modifica tanto el colchón disponible como la activación de condiciones existentes.

- Micro con todas las barras iniciales −10: azar 86,6–92,8 % y siempre B 100 % en la muestra. No resuelve la receta trivial.
- Micro con iniciales −20: azar 52,2–65,4 %, siempre B 83,6–98,0 % y planificadora 99,0–99,8 %. La asimetría persiste.
- Macro con iniciales −10: azar 11,6–25,2 %, siempre B 50,4–73,0 %, conservadora 64,2–76,6 % y planificadora 98,0–98,8 %. Puede servir como ajuste de dificultad posterior, pero no aborda directamente los sacrificios entre barras.
- Macro con iniciales −20: azar 3,6–10,0 %, conservadora 25,0–39,2 % y planificadora 79,8–88,2 %. Es una dificultad mucho más exigente; su aceptación depende del objetivo de diseño y de la información disponible al jugador.

### Aumentar todos los daños un 50 %

Resulta prometedor en micro. Aplicado también a macro deja azar en 0,8–1,6 %, conservadora en 1,8–3,0 % y planificadora en 39,2–50,8 %. No es una calibración intercambiable entre modos. Una victoria baja tampoco demuestra por sí sola injusticia.

Se escalan los componentes negativos inmediatos y diferidos, incluidas las sustituciones y adiciones activas; se redondea cada componente negativo alejándose de cero. No cambian los beneficios, las demoras ni los umbrales. El redondeo también afecta daños pequeños.

### Presión recurrente sobre Caja/Tesoro

Se ensayó un costo abstracto de dos puntos por decisión, aplicado después de los vencimientos y antes del recorte a cien; puede causar derrota. No depende del tiempo real ni de consultar teoría. El drenaje no continúa después del turno veinte.

- Micro: azar 35,8–50,0 %, siempre B 52,8–73,8 % y conservadora 99,4–100 %.
- Macro: azar 0,8–1,8 %, siempre B 0,6–4,4 %, conservadora 9,8–13,6 % y planificadora 55,2–69,8 %.

Baja las victorias sin planificación, pero concentra todavía más la dificultad en el dinero. Añade una regla, una nueva fase causal que explicar y trabajo de interfaz. Un sistema de ingresos/costos condicionado por las otras barras sería una alternativa más rica, aunque requiere definir unidades, reglas visibles y orden de resolución. **Ese sistema condicionado no fue simulado.**

### Presión recurrente sobre las otras barras

Restar dos puntos por decisión a las tres barras no monetarias diversifica algunos riesgos, pero en micro sustituye una receta por otra: siempre B baja a 17,2–37,2 %, mientras siempre A gana 92,8–97,8 % y la política de signos gana las 500 partidas de cada escenario.

En macro, esa variante deja azar en 21,8–38,8 %, siempre B en 23,0–53,6 % y planificadora en 97,6–99,2 %. No hace falta añadir desgaste automático para obtener un efecto parecido: reforzar costos de decisiones existentes es otra candidata.

Duplicar únicamente daños no monetarios tampoco basta en micro: siempre A gana 95,0–98,4 %. Las asimetrías requieren evaluar A y B, no solo el azar.

### Cobrar compromisos al cierre

El reporte original permite una prueba de tensión: liquidar pendientes en orden de vencimiento, sin decisiones adicionales. Con las políticas originales sin adaptar a ese objetivo:

- Ninguna de las 9.834 victorias micro al azar pasaría a derrota; tampoco las 10.000 victorias de siempre B ni las de la planificadora.
- En macro se perderían 216 de 3.426 victorias al azar, 57 de 8.994 de siempre B y 3 de 9.991 de la planificadora.

Son conteos descriptivos con escenarios igualmente representados y semillas compartidas, no muestras independientes agregables para calcular un intervalo binomial global. Esta prueba no evalúa estrategias adaptadas a una nueva condición de victoria. Cobrar pendientes puede mejorar la coherencia del cierre, pero no solventa por sí solo la facilidad de micro. Mantener el resultado oficial y mostrar sostenibilidad como una segunda dimensión también es una posibilidad de diseño.

### Rebalanceo localizado con condiciones y efectos diferidos

Es la dirección recomendada después de esta exploración numérica. **Todavía no fue simulada una versión concreta de ese catálogo.**

- En micro, revisar MI04/MI16 (sobrecarga), MI05/MI21 (calidad y reclamos), MI07/MI17 (postergar formación o productividad) y MI24 (opción dominada). Las ganancias de Caja deberían exigir sacrificios que puedan volverse relevantes dentro de la partida. Usar condiciones explícitas según Equipo, Calidad o Demanda para que la preferencia cambie con el estado.
- En macro, revisar las decisiones que preservan Tesoro a cambio de Bienestar, Confianza o Actividad. Las condiciones existentes de MA20 son un precedente para hacer costoso insistir en una política cuando una barra ya está debilitada.
- El motor actual soporta sustituciones, adiciones y un efecto diferido por opción. Permite experimentar con esas consecuencias sin añadir un sistema de simulación económica continuo. Cambios recurrentes o reglas terminales nuevas sí requieren trabajo en motor, explicaciones, pruebas y compatibilidad de partidas guardadas.

## Qué prototipar y cómo decidir

1. Probar un catálogo micro con costos más exigentes, usando ×1,5 como referencia de sensibilidad y ajustando pocas familias de cartas con sentido económico. Corregir MI24 de forma explícita.
2. Probar macro con contrapartidas no monetarias más fuertes, usando ×2 como referencia de sensibilidad. Mantener Tesoro inicialmente para aislar ese mecanismo.
3. Comparar variantes por escenario, incluidas siempre A, siempre B, signos, conservadora y planificadora. Medir causas de derrota, mínimos y obligaciones al cierre, además de victorias.
4. Acordar tasas objetivo antes de declarar balance aceptable. Exigir una ventaja de estrategia sin convertir una política informada en representación de un jugador nuevo.
5. Reservar **otro** conjunto de semillas para el catálogo finalmente ajustado: las semillas de esta exploración ya informan la selección de alternativas. Incorporar partidas con personas para medir comprensión y aprendizaje.

## Método y reproducción

- Piloto: 100 semillas por celda, 2026300000–2026300099, ocho variantes, 48.000 partidas. Sirvió para descartar o priorizar hipótesis; sus tasas no son las estimaciones principales.
- Validación posterior: 500 semillas nuevas por celda, 2026400000–2026400499, siete variantes, seis políticas y diez escenarios: **210.000 partidas**. Se comparten mazos y decisiones aleatorias entre variantes. Este conjunto valida las perturbaciones elegidas; no constituye un conjunto reservado para el futuro catálogo localizado.
- Se reutiliza el modelo Python de `quant_v1`, contrastado previamente con 100 opciones base, 1.200 resoluciones de condiciones, diez escenarios y 2.000 transiciones del MVP. Python usa un generador de mazos diferente del TypeScript; las mismas semillas no generan los mismos mazos entre lenguajes.
- El adaptador verifica 180 pares de partidas idénticas al modelo original, incluidos historiales, y tres casos manuales de presión recurrente, además de los 24 controles heredados. No se modificó el código del estudio original.
- La conservadora y la planificadora conocen los impactos exactos. La planificadora usa cuatro continuaciones hipotéticas de tres turnos, nunca el mazo futuro real. La utilidad y los desempates se heredan de `quant_v1`; no se hizo una nueva sensibilidad a esa utilidad para estas variantes.
- Cada celda tiene su intervalo de Wilson de 95 % en `validation.json`; las diferencias sobre semillas compartidas incluyen una aproximación normal pareada. Con 500/500 victorias, el intervalo Wilson es aproximadamente 99,24–100 %, no riesgo cero. No se aplicó corrección por comparaciones múltiples. Los intervalos no cubren errores del modelo ni diferencias entre personas.
- Se conservan resultados terminales de derrotas, distribuciones de recursos, causas, vencimientos, semillas, parámetros y huellas de entradas en los JSON. No se calcula una tasa conjunta de ambos modos.

```sh
python3 analysis/balance_options/evaluate.py --n 500 --start-seed 2026400000 \
  --variants baseline initial_minus10 initial_minus20 negative_x1_5 cash_minus2 other_minus2 other_negative_x2 \
  --output validation.json
```

Archivos: `evaluate.py` (experimentos), `pilot.json` (exploración), `validation.json` (estimaciones principales). Las variantes son hipotéticas y no aparecen en la aplicación.
