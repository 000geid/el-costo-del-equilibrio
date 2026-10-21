# Análisis de la especificación v1

Fecha: 15 de octubre de 2026. Este directorio contiene un estudio del documento de diseño, no el motor de producción ni mediciones de jugadores reales. No modifica el catálogo del juego ni sus reglas.

El informe para compartir está en [output/pdf/informe-balance-el-costo-del-equilibrio-v1.pdf](../../output/pdf/informe-balance-el-costo-del-equilibrio-v1.pdf).

## Hallazgos

- Micro al azar gana entre 97,50 % y 98,95 % según el negocio. Siempre B gana las 2.000 partidas de cada negocio; esto no certifica todos los mazos posibles.
- Macro Siempre B gana entre 84,20 % y 97,15 %, mientras Siempre A gana entre 0,05 % y 1,15 %.
- La planificación informada gana entre 99,85 % y 99,95 % en macro. La mejora frente al cortoplacista depende de la función de valor. En semillas independientes supera a una conservadora entre 2,2 y 5,8 puntos porcentuales.
- Todas las derrotas fueron por Caja/Tesoro salvo 18 por Bienestar bajo Siempre B en macro, dentro de la evaluación principal.
- MI24 tiene una opción dominada por componente. MA18 puede dejar su devolución fuera del horizonte; en el turno veinte, A domina débilmente para la victoria oficial.

## Datos y alcance

- `results/catalog.json`: extracción verificable de 50 cartas, con líneas de origen, vectores, retrasos y condiciones.
- `results/results.json`: 160.000 partidas principales y 80.000 de sensibilidad; configuración, semillas, huellas, 24 comprobaciones, tasas e intervalos, supervivencia, recursos, causas y compromisos. Las estadísticas de cierre incluyen estados terminales de derrotas; también se guardan las de ganadoras por separado.
- `results/robustness.json`: 17.500 partidas adicionales en macro con 500 semillas independientes, para sensibilidad de utilidad y comparación pareada con la conservadora.
- `results/witnesses.json`: trayectorias completas de victorias y derrotas, incluyendo una victoria planificadora por escenario. No se realizó búsqueda exhaustiva de todos los mazos.
- `pilot/`: piloto separado de 100 semillas por celda, previo a la validación final del simulador. Sus tasas no se utilizan como estimaciones principales.

Las cuatro políticas con magnitudes exactas (cortoplacista, conservadora, vencimientos y planificadora) son informadas. No representan la información de un principiante. La planificadora usa continuaciones hipotéticas y no consulta el mazo real futuro. La política de signos utiliza solo direcciones inmediatas y barras actuales.

Cada celda principal tiene 2.000 partidas, con intervalos de Wilson de 95 %. Las diferencias de victoria usan semillas compartidas y una aproximación normal pareada. Los intervalos de diferencias son descriptivos: cerca del techo, particularmente cuando todos los pares coinciden, una varianza muestral nula no demuestra igualdad poblacional. No se aplicó corrección por comparaciones múltiples.

Los cinco escenarios tienen peso 1/5 dentro de cada modo. No se calcula una tasa conjunta de macro y micro. Los mazos se comparten entre escenarios y políticas, de modo que el total de partidas no es un tamaño de muestra independiente para una tasa global. Los intervalos no cubren incertidumbre del modelo ni de jugadores reales.

## Reproducción

Desde la raíz, con Python 3.14.7 para reproducir el entorno de simulación:

```sh
python3 analysis/quant_v1/analyze.py --n 2000 --start-seed 2026101600 --out results
python3 analysis/quant_v1/check_robustness.py
python3 analysis/quant_v1/build_report.py
```

Las simulaciones usan únicamente la biblioteca estándar. El generador del PDF requiere `reportlab` (se utilizó 5.0.1 con Python 3.12). La revisión del PDF empleó `pypdf` 6.19.0, `pypdfium2` y Pillow 12.3.0 disponibles en el entorno local.

Las semillas principales son 2026101600 a 2026103599; las independientes, 2026200000 a 2026200499; las del piloto, 2026101500 a 2026101599. No se rebalanceó el juego ni se ajustaron políticas a las semillas de validación.

La prueba posterior al cierre solo liquida compromisos sin nuevas decisiones, en orden de vencimiento. Es una prueba de tensión, no una prolongación oficial. Los costos y beneficios se conservan por separado.

El PDF tiene diez páginas: síntesis, macro, micro, políticas, fragilidad, cierre/diversidad, sensibilidad, reproducción y dos anexos con las 80 celdas principales. Se renderizaron y revisaron todas las páginas; se corrigieron desbordes antes de entregar.
