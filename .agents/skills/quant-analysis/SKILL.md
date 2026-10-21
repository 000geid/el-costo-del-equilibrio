---
name: quant-analysis
description: Analiza cuantitativamente el balance y la justicia de juegos de decisiones con recursos limitados. Usar para estimar valor esperado, riesgo de derrota, dificultad por escenario, ventaja de planificar, decisiones dominantes y efectos del azar, o comparar cambios de balance en El costo del equilibrio.
---

# quant-analysis

## Propósito y criterio de diseño

Evaluar si el juego ofrece un desafío exigente que recompensa planificar y practicar. Una tasa de victoria baja no demuestra injusticia; una media positiva tampoco demuestra balance. Separar resultados del modelo, hipótesis sobre jugadores y objetivos de diseño.

Trabajar sobre la versión disponible del documento, catálogo y motor. Para El costo del equilibrio, leer [references/el-costo-del-equilibrio.md](references/el-costo-del-equilibrio.md). Si solo existe una especificación, identificar resultados como análisis de esa especificación; no presentarlos como evidencia de un juego implementado o de jugadores reales.

## Qué significa justicia

Evaluar por separado, sin construir una nota única arbitraria:

- **Posibilidad de ganar:** encontrar trayectorias ganadoras y estimar qué estrategias pueden realizarlas. Una trayectoria aislada no demuestra una dificultad razonable.
- **Recompensa a la planificación:** una estrategia que usa compromisos y horizonte temporal debería mejorar respecto de referencias simples bajo la misma información.
- **Información suficiente:** consecuencias relevantes y condiciones deben ser visibles según las reglas. Registrar pérdidas atribuibles a información oculta o a discrepancias con el motor.
- **Diversidad de decisiones:** detectar opciones que sistemáticamente convienen, así como cambios razonables de preferencia según recursos, contexto y turno.
- **Influencia del azar:** medir diferencias entre escenarios y mazos, y la capacidad de una estrategia para sostenerse en distintas semillas.
- **Coherencia del cierre:** distinguir ganar veinte decisiones de terminar con obligaciones difíciles de sostener.

No exigir que A y B tengan la misma probabilidad de elegirse, que todos los escenarios tengan idéntica dificultad ni que elegir al azar permita ganar. Los umbrales de aceptación son decisiones de diseño: si no están acordados, presentar propuestas explícitas y dejar el veredicto abierto.

## Valor esperado y riesgo

Definir la variable, la distribución y la estrategia antes de calcular una esperanza. En este juego los efectos son deterministas una vez fijados estado y elección; el azar procede del escenario, del mazo y, si corresponde, de la política evaluada.

Usar como resultado principal `P(victoria | modo, escenario, estrategia, versión)`. Acompañar con decisiones completadas, causas de derrota y distribuciones de recursos. Si se agrega un resultado global, declarar los pesos de escenarios; para una comparación de dificultad, reportar también cada escenario por separado.

Para recursos, reportar el vector esperado de cuatro indicadores, mediana, percentiles bajos y mínimo de la trayectoria. Incluir derrotas y explicar cómo se representan los estados terminales. Mostrar por separado los resultados condicionados a ganar para evitar sesgo de supervivencia.

La suma de puntos puede describir magnitudes, pero no es una utilidad económica: las barras no son intercambiables y tocar cero termina la partida. Si se necesita una función de valor para una estrategia, explicitar pesos y penalizaciones, y comprobar sensibilidad a esas elecciones.

Comparar A y B desde el mismo estado y con las mismas continuaciones aleatorias cuando sea posible. Estimar tanto cambios inmediatos como probabilidad de victoria y exposición futura. No confundir un efecto diferido programado con uno ya realizado.

## Estrategias de referencia

Comparar una selección justificada de estas políticas y publicar su definición exacta, horizonte y desempate:

- Aleatoria: A o B con igual probabilidad; referencia de dificultad sin planificación.
- Siempre A y siempre B: detectan ventajas de posición o recetas triviales.
- Cortoplacista: decide por efectos inmediatos con una función de valor declarada.
- Conservadora: prioriza evitar la derrota y proteger la barra más vulnerable; describir la regla de forma ejecutable.
- Planificadora: incorpora vencimientos y alternativas futuras mediante búsqueda limitada o simulaciones, usando solo información permitida.
- Oráculo opcional: conoce mazo futuro o impactos ocultos; sirve como comparación privilegiada, nunca como jugador realista.

Una política realista solo puede usar lo que ve el jugador antes de elegir. Si el documento oculta impactos exactos, una política que los conoce es informada o privilegiada, salvo que se modele explícitamente aprendizaje a partir de partidas anteriores. Tampoco puede conocer la semilla ni el orden futuro del mazo.

No denominar óptimo a un heurístico ni concluir que un mazo es imposible porque varias políticas pierdan. Para certificar imposibilidad, agotar las alternativas legales o usar un método exacto con una justificación verificable. Si no se hizo, escribir «no se encontró una trayectoria ganadora» y señalar el alcance de la búsqueda.

La diferencia entre políticas mide el beneficio de esa estrategia dentro del modelo. Para afirmar que practicar mejora a personas se necesitan sesiones con jugadores o un modelo explícito de aprendizaje.

## Protocolo de análisis

1. Identificar versión de reglas, pregunta concreta y datos disponibles. Extraer cartas y condiciones a un formato verificable; comprobar conteos, vectores, plazos y correspondencia con la fuente. Detener cálculos dependientes de una ambigüedad material y explicar cuál es.
2. Validar el simulador con casos manuales de derrota, vencimientos, condiciones, recorte y carta veinte. Si existe motor de producción, contrastar transiciones para no medir otro juego por accidente.
3. Ejecutar una muestra piloto reproducible por modo, escenario y política. Guardar semillas y usar los mismos mazos para comparar estrategias o versiones. Declarar qué es aleatorio y qué información recibe cada política.
4. Elegir el tamaño de muestra según la precisión útil para la decisión. Reportar número de partidas e intervalos para estimaciones Monte Carlo; Wilson es una opción para proporciones independientes. Para diferencias sobre semillas compartidas, usar un método pareado. No tratar turnos de una partida como observaciones independientes ni interpretar ausencia de derrotas como riesgo cero.
5. Analizar escenarios por separado antes de agregar. Revisar trayectorias, cuellos de botella, compromisos y cartas influyentes. Los intervalos Monte Carlo no cuantifican errores del modelo ni incertidumbre sobre personas reales.
6. Si se proponen ajustes, cambiar pocos parámetros y conservar definiciones económicas. Comparar antes/después sobre las mismas semillas; reservar otras semillas para comprobar que la mejora no se limita a las usadas para ajustar.

## Métricas mínimas y diagnósticos

- **Victoria y supervivencia:** proporción de victorias, distribución de decisiones completadas y riesgo de perder en cada turno entre partidas todavía activas.
- **Fragilidad:** indicador y fase causal de cada derrota, turnos en alerta y percentiles bajos de la barra más débil.
- **Ventaja de planificar:** diferencia de victoria y supervivencia entre políticas comparables, con incertidumbre y supuestos de información.
- **Dispersión por escenario:** rango y diferencias de victoria bajo una misma política; evitar esconder escenarios difíciles en la media global.
- **Obligaciones al cierre:** efectos pendientes agrupados por vencimiento, signo e indicador; reportar beneficios y costos por separado. Una proyección sin nuevas decisiones es una prueba de tensión, no una prolongación oficial del juego.
- **Opciones dominantes:** distinguir dominancia inmediata por componente de superioridad estratégica. Considerar plazos, estado y continuación; las frecuencias de elección por sí solas no prueban dominancia. Acotar cada hallazgo a los estados analizados.
- **Sensibilidad:** medir qué cambia al variar impactos, umbrales o valores iniciales. Diferenciar un fallo del motor de una decisión de balance.

Para atribuir efecto a una carta, comparar decisiones contrafácticas desde el mismo estado. La tasa de victoria observada al elegir A puede reflejar estados más favorables y no el efecto causal de A. Documentar cómo se muestrearon los estados y la cobertura de estados poco frecuentes.

## Entrega y límites

Entregar la conclusión principal, métricas por escenario y estrategia, evidencia reproducible de los problemas, límites del análisis y ajustes propuestos con su efecto medido. Elegir gráficos que expliquen diferencias o trayectorias cuando aporten claridad y respetar los requisitos de artefactos del entorno.

Conservar junto a resultados: versión o huella de entradas, configuración de políticas, semillas, tamaño de muestra, reglas de agregación y comando de reproducción. Con solo una especificación o sin ejecución, entregar hipótesis y un plan de medición, sin inventar tasas, simulaciones ni certificados de justicia.

No modificar el catálogo, el motor o los objetivos de dificultad como consecuencia automática del análisis. Si el usuario pide rebalancear, realizar los ajustes dentro del alcance autorizado y volver a medir.
