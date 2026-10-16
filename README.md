# El costo del equilibrio — MVP

*Cada decisión tiene un precio.*

Juego educativo de decisiones por cartas, inspirado en **Reigns** y **Lapse**, para la materia Economía y Finanzas. Administrás un país (**Macroeconomía**) o una pequeña empresa (**Microeconomía**) durante **20 decisiones** y tenés que evitar que alguno de los cuatro indicadores llegue a cero.

El contenido y las reglas salen del documento de alcance (`El_costo_del_equilibrio_Alcance.docx.md`, en la rama `main`).

Hecho con **TypeScript + Node.js** (Vite + React para la interfaz, motor de juego en TypeScript puro, Vitest para pruebas y un servidor Node sin dependencias para publicar la versión compilada).

---

## Cómo verlo

Requisitos: **Node.js 18 o superior** (probado con Node 22) y npm.

```bash
git clone https://github.com/000geid/el-costo-del-equilibrio.git
cd el-costo-del-equilibrio
git checkout MVP
npm install
npm run dev
```

Abrí **http://localhost:5173**. El servidor de desarrollo también queda expuesto en tu red local, así que podés probarlo desde el celular entrando a `http://<IP-de-tu-compu>:5173`.

### Música ambiental

La ambientación instrumental se sintetiza localmente con Web Audio a partir de una secuencia original; no usa grabaciones ni recursos externos y no requiere atribución. Comienza silenciada y se activa únicamente desde el control de música.

### Versión compilada (como se publicaría)

```bash
npm start          # compila y levanta el servidor Node en http://localhost:3000
PORT=8080 npm start  # en otro puerto
```

`npm start` ejecuta `npm run build` (chequeo de tipos + build de Vite a `dist/`) y luego `server/index.ts`, un servidor HTTP de Node que sirve `dist/`.

### Todos los comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Chequea tipos y compila a `dist/` |
| `npm start` | Compila y sirve `dist/` con Node en el puerto 3000 |
| `npm run serve` | Sirve `dist/` sin recompilar |
| `npm test` | Corre las pruebas del motor (Vitest) |
| `npm run typecheck` | Solo chequeo de tipos |
| `npm run simulate` | Simula miles de partidas por escenario y reporta tasas de victoria (balance) |

---

## Qué incluye el MVP

**Pantallas** (§5 del documento): Inicio con nombre, Menú, Instrucciones con carta de práctica, Escenario, Partida macro y micro, Consecuencia, Pausa, Archivo de estudio con buscador, Ficha de estudio, Práctica de preguntas, cuatro finales (victoria/derrota × macro/micro) y Análisis con tres pestañas.

**Contenido**
- 50 cartas (25 macro + 25 micro) con personaje, retrato ilustrado, situación, dos opciones, efectos inmediatos, efectos diferidos, condiciones visibles, concepto y explicación.
- 10 escenarios (5 países ficticios, 5 negocios). Las cartas micro adaptan el vocabulario al negocio (harina/horno en la panadería, arcilla/horno de cerámica en el taller, etc.).
- 22 fichas de estudio y 10 preguntas de práctica con respuesta y explicación.

**Motor** (§7–8)
- Mazo reproducible con semilla: 6 + 7 + 7 cartas por etapa (Inicio, Desarrollo, Cierre), sin repetir ni mezclar modos.
- Orden de resolución exacto: condiciones con valores previos → efecto inmediato → compromisos que vencen → recorte a 100 → programar nuevos compromisos → historial → victoria/derrota.
- Derrota inmediata o por compromiso, con todas las causas si caen varias barras a la vez. Los compromisos posteriores al turno 20 quedan pendientes en el informe.

**Interfaz**
- Estética de pergamino, madera y bronce; retratos SVG por personaje con escena de fondo (sala del consejo para macro, local del negocio para micro).
- Antes de elegir, las barras muestran solo el **sentido** de los efectos (▲/▼) y cada botón indica si crea un compromiso y cuándo vence. Los valores exactos aparecen después de elegir.
- Arrastre de la carta a izquierda/derecha (estilo Reigns) **y** dos botones equivalentes. Teclado completo (Tab, Enter/Espacio, Escape para pausar), foco visible, opción «Reducir movimiento», diseño adaptado al celular.
- Calendario de 20 cartas con los vencimientos marcados y panel de compromisos pendientes.

**Persistencia**: guardado en `localStorage` después de cada decisión, al pausar y al estudiar. Refrescar la página recupera la misma carta, mazo, barras y compromisos, sin aplicar dos veces una decisión.

**Análisis** (§9): resultado y causa, mínimo/máximo/variación/turnos en alerta por indicador, gráfico de trayectoria (cada turno abre su carta) con tabla de datos, historial con las 3 decisiones de mayor impacto, financiamiento aceptado, pagos realizados y compromisos pendientes, perfil de gestión con evidencia (umbral de 3 elecciones y 25 %) y 3–5 conceptos para repasar (priorizando la causa en caso de derrota).

---

## Cómo trabajar sobre el proyecto

```
src/
  data/                 Contenido del juego (lo que más se va a editar)
    cardsMacro.ts       25 cartas macro  — orden de vectores: [Actividad, Tesoro, Bienestar, Confianza]
    cardsMicro.ts       25 cartas micro  — orden de vectores: [Caja, Demanda, Equipo, Calidad]
    scenarios.ts        Países y negocios, valores iniciales y vocabulario de cada negocio
    study.ts            22 fichas del Archivo de estudio
    questions.ts        10 preguntas de práctica
    stats.ts            Nombre, significado y mensaje de derrota de cada indicador
    tutorial.ts         Cartas de práctica (no cuentan en la partida)
  engine/               Lógica pura en TypeScript, sin React
    engine.ts           Mazo, condiciones, resolución de decisiones, victoria/derrota
    analysis.ts         Estadísticas, decisiones de mayor impacto, perfil y conceptos
    storage.ts          Guardado local
    types.ts            Tipos del juego
  ui/                   Interfaz React
    App.tsx             Navegación entre pantallas, pausa y modales
    screens/            Una pantalla por archivo
    components/         Retratos SVG, barras, carta arrastrable, gráfico
  styles.css            Estilos (variables de color al principio)
server/index.ts         Servidor Node para la versión compilada
scripts/simulate.ts     Simulación de balance
tests/engine.test.ts    Pruebas funcionales de §13
```

### Editar o agregar una carta

Cada carta es un objeto en `src/data/cardsMacro.ts` o `cardsMicro.ts`:

```ts
{
  id: 'MA09', mode: 'macro', stage: 'desarrollo',
  character: 'Tesorera nacional',
  portrait: { sex: 'f', age: 'adult', skin: 0, hair: 'bun', hairColor: 'black', glasses: true, outfit: '#5a2f4a', prop: 'seal' },
  title: 'Crédito para sostener servicios',
  text: 'Un prestamista ofrece recursos…',
  studyIds: ['deficit-deuda'],
  options: {
    A: opt('Aceptar el préstamo', v(2, 12, 4, 0), 'financiamiento', later(3, v(0, -15, 0, -2))),
    B: opt('Reducir gastos ahora', v(-4, 5, -7, -3), 'prudencia'),
  },
  explanation: 'Un préstamo aporta liquidez, no ingreso permanente…',
}
```

- `v(a, b, c, d)` es el vector de puntos; `later(n, v(...))` es un efecto que vence n turnos después.
- `condition` (opcional) permite sustituir el efecto inmediato, sustituir el diferido o sumar al inmediato según una barra antes de decidir (ver MA18–MA20, MI01, MI09, MI11, MI16, MI18, MI21).
- En las cartas micro, `{insumo}`, `{maquina}`, `{producto}` y `{local}` se reemplazan con el vocabulario del negocio (`scenarios.ts`).
- El retrato se arma con `portrait`: piel (0–4), peinado, color de pelo, sombrero, barba, anteojos, color de ropa y objeto que sostiene. Las opciones están tipadas en `src/engine/types.ts`, así que el editor autocompleta.

Después de cambiar valores, corré `npm test` y `npm run simulate` para ver el efecto en el balance.

### Ajustar la dificultad

Los valores de impacto son los del documento de alcance. `npm run simulate` juega 2000 partidas por escenario con cuatro políticas. Resultado actual con los valores del documento:

| Escenario | Siempre A | Siempre B | Al azar | Cuidar la peor barra |
|---|---|---|---|---|
| Macro (5 países) | 0,1 – 1,7 % | 82,8 – 97,8 % | 23 – 43 % | 96 – 99 % |
| Micro (5 negocios) | 97,6 – 99,9 % | 100 % | 97,8 – 99,5 % | 100 % |

Lectura: se cumple que «siempre el primer botón» no garantiza ganar, y hay trayectorias ganadoras en todos los escenarios. Pero en **macro**, «siempre el segundo botón» gana casi siempre (la mayoría de las opciones B son de prudencia y suman Tesoro, que es la barra que más derrotas causa), y en **micro** la partida es muy fácil con cualquier política. El documento deja la calibración como tarea de desarrollo (§13), así que el MVP mantiene los valores originales; el ajuste conviene decidirlo en grupo y validarlo con la simulación.

---

## Fuera de este MVP

- Sonido (el documento lo marca como opcional).
- Ilustraciones finales: los retratos son SVG generados por código, pensados como base visual del estilo.
- Calibración de dificultad (ver arriba) y pruebas con usuarios para confirmar la duración de 10–20 minutos.
- Multijugador, cuentas, rankings y datos en tiempo real (fuera del alcance inicial según el documento).
