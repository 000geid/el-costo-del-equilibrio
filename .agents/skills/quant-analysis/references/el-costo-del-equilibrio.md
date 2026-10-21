# Reglas que afectan el análisis de El costo del equilibrio

Fuente inicial: `El_costo_del_equilibrio_Alcance.docx.md` en la raíz del proyecto, versión 1, octubre de 2026. Esta referencia orienta la lectura; si cambia la especificación, usar la versión vigente y registrar discrepancias.

## Intención de diseño

El usuario eligió un enfoque de desafío: ganar debe exigir planificar bien y practicar. Todavía no se acordaron tasas de victoria objetivo ni brechas aceptables entre escenarios. El documento pide varias trayectorias razonables, una trayectoria ganadora por escenario y que elegir siempre el primer botón no garantice ganar. Son requisitos por comprobar; no son resultados demostrados.

## Selección y estado

- Dos modos: macro y micro. Cada uno tiene cinco escenarios equiprobables y 25 cartas.
- Mazo de 20: seis de las cartas 01–08, siete de 09–17 y siete de 18–25; seleccionar sin reemplazo y barajar dentro de cada bloque. Conservar ese orden de etapas.
- Indicadores macro: Actividad, Tesoro, Bienestar, Confianza. Micro: Caja, Demanda, Equipo, Calidad.
- Una barra en cero o menos provoca derrota; el exceso positivo sobre cien se recorta. No existe derrota por llegar a cien.
- Los puntos son índices; las monedas de ejemplos no forman una contabilidad adicional.
- El azar inicial es reproducible mediante semilla. No hay azar adicional al resolver una elección.

## Orden de resolución que debe conservar el simulador

1. Evaluar condiciones con el estado anterior a la decisión.
2. Aplicar simultáneamente el vector inmediato. Si una barra cruza cero, registrar derrota inmediata.
3. Solo si sigue activa, aplicar juntos los efectos ya pendientes que vencen en el turno actual; volver a comprobar derrota.
4. Recortar valores positivos a cien después de esas fases. Conservar valores brutos e intermedios para explicar causas.
5. Registrar y programar efectos nuevos en turno actual más retraso; conservar compromisos aun si el intento terminó según la especificación.
6. Contar la decisión, registrar historial y terminar por derrota o, si se resolvieron veinte y sigue activa, por victoria.

No recortar a cien entre el vector inmediato y los vencimientos. No rescatar una derrota inmediata con un beneficio pendiente. Un efecto elegido en turno seis con retraso dos se aplica después de la elección del ocho. Efectos posteriores al veinte quedan pendientes, incluidos los positivos.

## Información para las políticas

Antes de elegir se conocen indicadores, contexto, sentido de los efectos inmediatos, condiciones y calendario de compromisos ofrecidos. Los impactos exactos aparecen al resolver. Verificar en la interfaz implementada cuánto detalle numérico muestran los compromisos; no inferir que todos sus vectores exactos son visibles por existir en el catálogo técnico.

No exponer el orden futuro del mazo, la semilla ni los vectores técnicos ocultos a una política presentada como principiante. Una política entrenada puede aprender sobre cartas, pero debe declarar la información adquirida y separar partidas de aprendizaje y evaluación.

## Casos que requieren comprobación explícita

- Condiciones MA18, MA19 y MA20; MI01, MI09, MI11, MI16, MI18 y MI21. Verificar la lista contra la fuente vigente.
- MA18 reemplaza únicamente Tesoro del pago futuro, según Confianza anterior a elegir.
- Sustituciones y adiciones no son equivalentes: conservar los componentes que no se modifican.
- Carta veinte: tanto el vector inmediato como los compromisos vencidos pueden provocar derrota.
- Varias barras pueden causar derrota en la misma fase; registrar todas.
- Estudiar, pausar y retomar no alteran estado económico ni consumen decisiones.

## Preguntas prioritarias

1. ¿Qué ventaja consigue una política que anticipa pagos frente a otra que solo responde al presente?
2. ¿Algún escenario presenta mucha más dificultad con la misma política y las mismas condiciones de información?
3. ¿Hay mazos sin trayectoria ganadora, o solo mazos difíciles para las políticas ensayadas?
4. ¿Alguna opción domina en los estados alcanzables, o la preferencia cambia según recursos y turno?
5. ¿El horizonte de veinte decisiones favorece deuda tardía o inversiones cuyo costo queda fuera de la partida?
6. ¿Los riesgos que explican derrotas estaban comunicados antes de la elección?

El análisis cuantitativo puede evaluar la estructura y las estrategias simuladas. Comprensión de las advertencias, aprendizaje y dificultad percibida requieren pruebas de uso.
