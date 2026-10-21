"""Genera el PDF de alternativas a partir de resultados ya ejecutados."""
from pathlib import Path
from xml.sax.saxutils import escape
import hashlib
import json

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
R = json.loads((HERE / 'validation.json').read_text())
OLD = json.loads((HERE.parent / 'quant_v1/results/results.json').read_text())
OUT = ROOT / 'output/pdf/alternativas-balance-el-costo-del-equilibrio.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
for name, digest in R['metadata']['files_sha256'].items():
    assert hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest, name
assert len(R['cells']) == 420 and sum(c['n'] for c in R['cells']) == 210000

W, H = A4
M = 46
WIDTH = W - 2 * M
INK = colors.HexColor('#203532')
ACCENT = colors.HexColor('#17675C')
MUTED = colors.HexColor('#586A65')
PALE = colors.HexColor('#EFF4F1')
RULE = colors.HexColor('#D2DDD7')
STYLES = {
    'title': ParagraphStyle('Title', fontName='Times-Bold', fontSize=27, leading=30, textColor=INK, spaceAfter=15),
    'h1': ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=19, leading=23, textColor=INK, spaceAfter=13),
    'h2': ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=ACCENT, spaceBefore=13, spaceAfter=7),
    'body': ParagraphStyle('Body', fontName='Helvetica', fontSize=10, leading=14.2, textColor=INK, spaceAfter=9),
    'small': ParagraphStyle('Small', fontName='Helvetica', fontSize=8.4, leading=11.6, textColor=MUTED, spaceAfter=7),
    'cell': ParagraphStyle('Cell', fontName='Helvetica', fontSize=8.1, leading=10.8, textColor=INK),
    'tiny': ParagraphStyle('Tiny', fontName='Helvetica', fontSize=7.4, leading=9.7, textColor=INK),
    'head': ParagraphStyle('Head', fontName='Helvetica-Bold', fontSize=7.6, leading=10.2, textColor=colors.white),
    'code': ParagraphStyle('Code', fontName='Courier', fontSize=7.5, leading=11, textColor=INK, spaceAfter=7),
}
story = []


def para(text, style='body'):
    story.append(Paragraph(text, STYLES[style]))


def sub(text):
    para(text, 'h2')


def page(n, title):
    if story:
        story.append(PageBreak())
    para(f'EL COSTO DEL EQUILIBRIO / OPCIONES DE BALANCE / {n:02}', 'small')
    para(title, 'h1')


def fmt(x, decimals=1):
    return f'{x:.{decimals}f}'.replace('.', ',')


def pct(x, decimals=1):
    return fmt(x * 100, decimals) + ' %'


def cells(variant, mode, policy):
    return [c for c in R['cells'] if c['variant'] == variant and c['mode'] == mode and c['policy'] == policy]


def span(variant, mode, policy):
    xs = [c['win_rate'] for c in cells(variant, mode, policy)]
    lo, hi = min(xs), max(xs)
    return fmt(lo * 100) if lo == hi else f'{fmt(lo * 100)}-{fmt(hi * 100)}'


def table(headers, rows, widths, tiny=False, compact=False):
    sty = STYLES['tiny' if tiny else 'cell']
    data = [[Paragraph(escape(str(x)), STYLES['head']) for x in headers]]
    data += [[Paragraph(escape(str(x)), sty) for x in row] for row in rows]
    t = Table(data, colWidths=widths, hAlign='LEFT', repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, PALE]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4 if compact else 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4 if compact else 7),
        ('LINEBELOW', (0, -1), (-1, -1), .5, RULE),
    ]))
    story.extend([t, Spacer(1, 7)])


VARIANT_LABELS = {
    'baseline': 'Actual',
    'initial_minus10': 'Iniciales -10',
    'initial_minus20': 'Iniciales -20',
    'negative_x1_5': 'Todos los daños ×1,5',
    'cash_minus2': 'Caja/Tesoro -2 por decisión',
    'other_minus2': 'Otras barras -2 por decisión',
    'other_negative_x2': 'Daños en otras barras ×2',
}
POLICIES = ['random', 'always_A', 'always_B', 'signs', 'conservative', 'planner']


def matrix(mode):
    table(['Variante', 'Azar', 'Siempre A', 'Siempre B', 'Signos', 'Conserv.*', 'Planific.*'],
          [[label] + [span(v, mode, p) for p in POLICIES] for v, label in VARIANT_LABELS.items()],
          [139] + [(WIDTH - 139) / 6] * 6, tiny=True)
    para('Victoria (%): mínimo-máximo entre los cinco escenarios. Cada celda resume cinco muestras de 500 partidas. '
         'Estos rangos describen diferencias entre escenarios; no son intervalos de confianza. '
         '*Conservadora y planificadora conocen las magnitudes exactas.', 'small')
    para('Fuente: analysis/balance_options/validation.json. Semillas 2026400000-2026400499; '
         'catálogo y reglas de referencia v1, análisis del 15/10/2026.', 'small')


def footer(c, doc):
    c.saveState()
    c.setStrokeColor(RULE)
    c.line(M, 39, W - M, 39)
    c.setFillColor(MUTED)
    c.setFont('Helvetica', 7.3)
    c.drawString(M, 26, 'El costo del equilibrio / alternativas hipotéticas / 15 de octubre de 2026')
    c.drawRightString(W - M, 26, str(doc.page))
    c.restoreState()


page(1, 'Resumen para decidir')
para('Recuperar el desafío<br/>sin ajustar ambos modos igual.', 'title')
para('<b>Micro casi permite ganar sin gestionar riesgos. Macro castiga el azar, pero favorece demasiado repetir B.</b> '
     'La evaluación compara perturbaciones pequeñas de valores y dos formas de presión recurrente. '
     'Las candidatas más útiles actúan de manera diferente en cada modo.')
table(['Candidata', 'Azar', 'Siempre B', 'Conserv.*', 'Planific.*'], [
    ['Micro: impactos negativos ×1,5'] + [span('negative_x1_5', 'MI', p) for p in ['random', 'always_B', 'conservative', 'planner']],
    ['Macro: daños no monetarios ×2'] + [span('other_negative_x2', 'MA', p) for p in ['random', 'always_B', 'conservative', 'planner']],
], [191] + [(WIDTH - 191) / 4] * 4)
para('Victoria (%), rangos por escenario; 500 partidas por escenario, estrategia y variante. '
     '*Políticas informadas. Son referencias de sensibilidad para diseñar un prototipo, no un catálogo final aprobado.', 'small')
sub('Qué conviene hacer')
para('Rebalancear pocas familias de cartas, con costos y condiciones visibles. En micro, hacer exigentes los sacrificios '
     'que sostienen la Caja. En macro, dar más peso a las consecuencias sobre Actividad, Bienestar y Confianza al preservar Tesoro.')
sub('Qué no alcanza por sí solo')
para('Bajar las barras iniciales deja a siempre B muy fuerte en micro. Cobrar compromisos posteriores al cierre no cambia '
     'las victorias micro del reporte original. El desgaste automático agrega reglas y puede reemplazar una receta trivial por otra.')
sub('Base de evidencia y estado del trabajo')
para('<b>210.000 partidas de validación</b>, con semillas nuevas respecto de un piloto de 48.000 partidas. '
     'Siete variantes, seis políticas y diez escenarios. Se conservan las veinte decisiones. '
     'No se modificaron el motor, el catálogo ni las reglas del MVP. Todavía no hay tasas de victoria objetivo acordadas.')
para('Los resultados corresponden al modelo y sus estrategias simuladas. La planificadora conoce impactos que un principiante '
     'no ve antes de elegir. No se certificó optimalidad, solvencia de todos los mazos ni aprendizaje de jugadores reales.', 'small')

page(2, 'Micro: aumentar el costo efectivo de decidir')
para('El modo actual gana al azar en 97,4-99,4 % de las partidas de validación. '
     'Siempre B, signos y ambas políticas informadas no registran derrotas. La condición binaria de victoria distingue muy poco entre estrategias.')
matrix('MI')
sub('La candidata más útil de esta exploración')
para('Intensificar todos los componentes negativos un 50 % baja el azar a <b>28,4-35,6 %</b> y siempre B a '
     '<b>51,2-72,0 %</b>. La conservadora gana 91,8-95,6 % y la planificadora 99,8-100 %. '
     'La ventaja pareada de la planificadora sobre la conservadora varía entre 4,4 y 8,2 puntos porcentuales según negocio.')
para('El mecanismo conserva los beneficios y las demoras, pero encarece las decisiones que los financian. '
     'Caja sigue concentrando la mayoría de las derrotas; el resultado no demuestra todavía un equilibrio entre las cuatro barras.')
sub('Por qué otras alternativas quedan relegadas')
para('<b>Menos recursos iniciales:</b> con -10 puntos, siempre B todavía gana todas las partidas; '
     'con -20, gana 83,6-98,0 %. La receta persiste y también cambian las condiciones activas al comenzar.')
para('<b>Desgastar otras barras:</b> restar dos puntos por decisión a Demanda, Equipo y Calidad reduce siempre B, '
     'pero siempre A pasa a ganar 92,8-97,8 %. Signos sigue ganando todas las partidas. '
     'Duplicar solo daños no monetarios produce un problema parecido.')
para('<b>Costo recurrente de Caja:</b> reduce el azar, pero la conservadora ya alcanza 99,4-100 %. '
     'Refuerza el cuello de botella monetario y añade una regla nueva.')

page(3, 'Macro: dar peso a las contrapartidas de B')
para('El modo actual ya castiga elecciones al azar: gana 26,0-46,0 % en esta validación. '
     'La dificultad se concentra en Tesoro y siempre B obtiene 84,2-96,6 %. '
     'La pregunta principal es cómo volver costosa esa receta sin aumentar solamente la presión monetaria.')
matrix('MA')
sub('La candidata más útil de esta exploración')
para('Duplicar los componentes negativos sobre <b>Actividad, Bienestar y Confianza</b>, manteniendo los de Tesoro, '
     'deja siempre B en 6,4-22,6 % y azar en 19,6-34,8 %. La conservadora conserva 70,2-79,4 % y '
     'la planificadora 97,0-98,2 %. La ventaja pareada de planificar sobre la conservadora es de 18,8-27,0 puntos.')
para('Entre las derrotas de siempre B, Bienestar pasa a ser la causa más frecuente. '
     'Esto responde directamente al sacrificio que esa política tendía a tolerar al preservar Tesoro. '
     'Las derrotas de las políticas informadas siguen concentradas en Tesoro.')
sub('No trasladar automáticamente la calibración de micro')
para('Multiplicar todos los daños por 1,5 deja azar en 0,8-1,6 %, conservadora en 1,8-3,0 % y planificadora '
     'en 39,2-50,8 %. Un costo fijo de Tesoro también exige mucho más anticipar. '
     'Pueden representar modos de mayor dificultad, pero su aceptación requiere acordar el desafío deseado y revisar la información del jugador.')
para('Reducir iniciales en diez puntos también separa políticas: conservadora 64,2-76,6 % y planificadora '
     '98,0-98,8 %. Es una herramienta de calibración posterior; reforzar contrapartidas de cartas existentes aborda más directamente la ventaja de B.')

page(4, 'Presión recurrente y coherencia del cierre')
sub('Presión por decisión: una regla nueva')
para('Se ensayó restar dos puntos a Caja/Tesoro o a las otras tres barras en cada decisión. '
     'El drenaje ocurre después de los vencimientos, antes del recorte a cien, y puede causar derrota. '
     'No depende del tiempo real ni de consultar teoría; no continúa después de la carta veinte. '
     'Las políticas informadas conocen la regla y la planificadora la incorpora a su proyección.')
para('El costo monetario baja la victoria al azar micro a 35,8-50,0 %, pero concentra todavía más el riesgo en Caja. '
     'El desgaste no monetario diversifica riesgos, aunque en micro facilita ganar repitiendo A. '
     'La estructura de decisiones importa tanto como la tasa de derrota.')
para('Un sistema de ingresos y costos condicionado por Demanda, Equipo, Calidad o Actividad podría enriquecer las relaciones '
     'entre barras. Requiere reglas visibles, unidades consistentes y un orden de resolución definido. '
     '<b>Ese sistema condicionado no fue simulado.</b>')
sub('Cobrar pendientes: prueba de tensión del reporte original')
para('Se liquidan compromisos en orden de vencimiento, sin decisiones nuevas. Las políticas originales no se adaptaron '
     'a una condición de victoria distinta. La prueba usa el estudio anterior, con 2.000 partidas por escenario y política, '
     'y no las muestras de 500 de esta evaluación.')
rows = []
for mode, label in [('MI', 'Micro'), ('MA', 'Macro')]:
    for policy, name in [('random', 'Azar'), ('always_B', 'Siempre B'), ('planner', 'Planificadora*')]:
        xs = [c for c in OLD['cells'] if c['mode'] == mode and c['policy'] == policy]
        rows.append([label, name, f"{sum(c['wins'] for c in xs):,}".replace(',', '.'), str(sum(c['stress_fail_winners'] for c in xs))])
table(['Modo', 'Política', 'Victorias oficiales', 'Caen al liquidar pendientes'], rows, [62, 121, 131, WIDTH - 314])
para('Fuente: analysis/quant_v1/results/results.json. Son conteos descriptivos de cinco escenarios con semillas compartidas; '
     'no constituyen una muestra independiente global. *Política informada.', 'small')
para('Cobrar pendientes mejora potencialmente la coherencia del cierre, pero <b>no resuelve la facilidad de micro</b>. '
     'Otra opción de diseño es conservar la victoria oficial y mostrar sostenibilidad como una segunda dimensión del resultado.')

page(5, 'Prototipo recomendado: cambios localizados')
para('Los multiplicadores anteriores son instrumentos para detectar mecanismos. '
     'El siguiente paso recomendado es ajustar pocas familias de cartas con sentido económico y medir de nuevo. '
     '<b>Todavía no se simuló un catálogo localizado concreto.</b>')
table(['Modo / cartas', 'Qué revisar en el prototipo'], [
    ['Micro: MI04 y MI16', 'Sobrecarga y horas extra. Hacer que insistir con Equipo debilitado exija una contrapartida relevante en Equipo o Calidad.'],
    ['Micro: MI05 y MI21', 'Materiales y reclamos. Revisar que degradar Calidad pueda volver costoso el ahorro, con condiciones anunciadas antes de elegir.'],
    ['Micro: MI07 y MI17', 'Formación y productividad. Revisar el costo de postergar inversiones, manteniendo alternativas razonables cuando falta Caja.'],
    ['Micro: MI24', 'Dar un bono supera por componente a retirar fondos. Rediseñar el conflicto para que ambas opciones tengan situaciones de uso justificables.'],
    ['Macro: prudencia y MA20', 'Revisar decisiones que preservan Tesoro sacrificando otras barras. Usar condiciones visibles para que repetir la política con Bienestar o Confianza bajos sea costoso.'],
], [140, WIDTH - 140])
sub('Alcance técnico')
para('El motor actual permite sustituciones, adiciones y un efecto diferido por opción. '
     'Se pueden introducir y medir contrapartidas dentro de esa estructura. '
     'Las reglas recurrentes o una condición terminal nueva requieren trabajo adicional en motor, interfaz, explicaciones, '
     'pruebas y compatibilidad de partidas guardadas.')
sub('Secuencia de decisión')
para('<b>1.</b> Acordar tasas objetivo por modo y qué ventaja de anticipación se busca. '
     '<b>2.</b> Prototipar micro con costos más exigentes y macro con contrapartidas no monetarias más fuertes. '
     '<b>3.</b> Comparar azar, siempre A/B, signos y políticas informadas por escenario. '
     '<b>4.</b> Revisar mínimos, causas de derrota y obligaciones al cierre. '
     '<b>5.</b> Evaluar el catálogo final con otro conjunto de semillas y con personas.')
para('Las semillas de esta evaluación ya informan la selección de alternativas. '
     'No deben presentarse como una reserva independiente para el futuro catálogo ajustado.', 'small')

page(6, 'Método, incertidumbre y alcance')
sub('Muestra y comparación')
para('<b>Piloto:</b> 48.000 partidas, ocho variantes y 100 semillas por celda, 2026300000-2026300099. '
     '<b>Validación:</b> 210.000 partidas, siete variantes, seis políticas, diez escenarios y 500 semillas por celda, '
     '2026400000-2026400499. La modificación de daños no monetarios se incorporó en la validación. '
     'Se comparten mazos y decisiones aleatorias entre variantes para comparar sobre semillas pareadas.')
para('Las celdas se presentan por escenario. No se calcula una tasa conjunta de macro y micro. '
     'Si se describen conteos de varios escenarios, sus semillas compartidas impiden tratarlos como observaciones independientes.')
sub('Qué cambia exactamente')
para('<b>Iniciales:</b> se restan 10 o 20 puntos a las cuatro barras. '
     '<b>Daños:</b> se multiplican solo los componentes negativos efectivos, incluidos diferidos y condiciones activas; '
     'se redondea alejándose de cero. Los beneficios, umbrales y demoras se conservan. '
     '<b>Daños no monetarios:</b> se excluye Caja en micro y Tesoro en macro. '
     '<b>Presión:</b> se añade una fase causal después de vencimientos y antes del recorte.')
sub('Validación del modelo')
para('Se reutiliza el simulador Python de quant_v1. La revisión previa contrastó 100 opciones base, '
     '1.200 evaluaciones de condiciones, diez escenarios y 2.000 transiciones controladas con el MVP. '
     'El adaptador nuevo verifica 180 pares de partidas idénticas al modelo original, tres casos manuales de presión '
     'y los 24 controles heredados. Las huellas de entradas y el código se conservan con los resultados.')
para('Python y TypeScript usan generadores aleatorios distintos: la misma semilla no produce el mismo mazo entre lenguajes. '
     'El motor del MVP recorta a cero los recursos terminales negativos; Python los conserva. '
     'La comparación previa normalizó ese recorte. Las tasas de victoria son comparables por mecanismo, no por identidad de semillas entre lenguajes.')
sub('Incertidumbre y límites')
para('Cada celda tiene un intervalo de Wilson de 95 % en el JSON. Con 500 victorias de 500, el intervalo es '
     '<b>99,24-100 %</b>: ninguna derrota observada no demuestra riesgo cero. '
     'Las diferencias usan una aproximación normal pareada; cerca del techo, una varianza muestral nula no prueba igualdad poblacional. '
     'No se aplicó corrección por comparaciones múltiples.')
para('Los intervalos no cubren errores del modelo ni diferencias entre personas. '
     'La planificadora es una búsqueda limitada, no una política óptima. '
     'No se hizo una nueva sensibilidad a su función de utilidad para estas variantes ni una búsqueda exhaustiva de todos los mazos. '
     'Una victoria baja por sí sola no demuestra injusticia.')

page(7, 'Anexo: candidatas por escenario')
para('Cada tasa usa 500 partidas. Los IC son intervalos Wilson de 95 % para la probabilidad de victoria de una política '
     'dentro del modelo. Las diferencias entre políticas usan semillas compartidas.')
for mode, variant, title in [('MI', 'negative_x1_5', 'Micro: impactos negativos ×1,5'),
                             ('MA', 'other_negative_x2', 'Macro: daños no monetarios ×2')]:
    sub(title)
    scenarios = [c['scenario'] for c in cells(variant, mode, 'random')]
    rows = []
    for scenario in scenarios:
        get = lambda p: next(c for c in cells(variant, mode, p) if c['scenario'] == scenario)
        rows.append([scenario] + [fmt(get(p)['win_rate'] * 100) for p in ['random', 'always_B', 'conservative', 'planner']])
    table(['Escenario', 'Azar (%)', 'B (%)', 'Conserv.* (%)', 'Planific.* (%)'], rows, [159] + [(WIDTH - 159) / 4] * 4, compact=True)
    rows = []
    for scenario in scenarios:
        c = next(c for c in cells(variant, mode, 'planner') if c['scenario'] == scenario)
        gap = next(x for x in R['planning_vs_conservative'] if x['variant'] == variant and x['mode'] == mode and x['scenario'] == scenario)
        rows.append([scenario, f"{fmt(c['wilson95'][0] * 100, 2)}-{fmt(c['wilson95'][1] * 100, 2)}",
                     f"{fmt(gap['difference'] * 100)} ({fmt(gap['normal95'][0] * 100)} a {fmt(gap['normal95'][1] * 100)})"])
    table(['Escenario', 'IC planificadora (%)', 'Ventaja sobre conservadora (pp; IC 95 %)'], rows,
          [159, 130, WIDTH - 289], tiny=True, compact=True)
para('*Políticas informadas. pp: puntos porcentuales. Fuente: validation.json, semillas 2026400000-2026400499. '
     'La ventaja pertenece a estas estrategias y su información; no mide el efecto de practicar en personas.', 'small')

page(8, 'Anexo: políticas y reproducción')
table(['Política', 'Definición e información'], [
    ['Azar', 'Elige A o B con probabilidad 1/2; flujo aleatorio separado del mazo.'],
    ['Siempre A / Siempre B', 'Repite la posición de opción sin leer impactos. Detecta recetas simples.'],
    ['Signos', 'Maximiza la suma de signo del impacto inmediato dividida por cada barra actual. No usa magnitudes exactas ni vencimientos. Desempata por A.'],
    ['Conservadora*', 'Prioriza sobrevivir al turno, luego la barra mínima tras resolver y luego U. Conoce el catálogo y la regla hipotética evaluada. Desempata por A.'],
    ['Planificadora*', 'Compara cuatro continuaciones hipotéticas comunes de hasta tres cartas, sin consultar el mazo real futuro. La continuación maximiza el peor U de una proyección de vencimientos. Desempata por A.'],
], [120, WIDTH - 120])
para('*Informadas. Utilidad: U = suma de logaritmos naturales de las cuatro barras + 0,05 × barra mínima. '
     'Si alguna barra es no positiva: U = -10000 + barra mínima. '
     'La proyección de compromisos se trunca en veinte decisiones e incorpora la presión recurrente cuando corresponde.', 'small')
sub('Archivos de referencia en el repositorio')
for path, desc in [
    ('analysis/balance_options/README.md', 'Interpretación y alternativas.'),
    ('analysis/balance_options/evaluate.py', 'Experimentos reproducibles.'),
    ('analysis/balance_options/validation.json', '420 celdas, semillas, intervalos, causas, recursos y huellas.'),
    ('analysis/balance_options/pilot.json', 'Exploración inicial separada.'),
    ('analysis/quant_v1/results/results.json', 'Estudio original y prueba de tensión del cierre.'),
]:
    para(f'<b>{escape(path)}</b><br/>{desc}', 'small')
sub('Reproducir la validación')
commands = [
    'python3 analysis/balance_options/evaluate.py --n 500 \\',
    '  --start-seed 2026400000 \\',
    '  --variants baseline initial_minus10 initial_minus20 \\',
    '    negative_x1_5 cash_minus2 other_minus2 other_negative_x2 \\',
    '  --output validation.json',
]
for line in commands:
    para(escape(line).replace(' ', '&#160;'), 'code')
para('Simulación: biblioteca estándar de Python; se registró la versión en los resultados. '
     'Generación del informe: ReportLab. No se volvió a simular para producir este PDF.', 'small')
sub('Identidad del resultado usado')
digest = hashlib.sha256((HERE / 'validation.json').read_bytes()).hexdigest()
para('SHA-256 de validation.json:', 'small')
para(digest[:32] + '<br/>' + digest[32:], 'code')

doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=M, rightMargin=M, topMargin=44,
                        bottomMargin=56, title='El costo del equilibrio - alternativas de balance',
                        author='Proyecto El costo del equilibrio', subject='Evaluación exploratoria de 210.000 partidas')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
