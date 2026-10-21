"""Create the shareable PDF from saved, executed simulation results.
Requires reportlab. Rendering/QA uses pypdfium2 and pypdf separately.
"""
from pathlib import Path
import hashlib
import json
import statistics
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                               PageBreak, Flowable, KeepTogether)

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
R=json.loads((HERE/'results/results.json').read_text())
ROB=json.loads((HERE/'results/robustness.json').read_text())
W=json.loads((HERE/'results/witnesses.json').read_text())
SOURCE=ROOT/R['source']
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==R['source_sha256']==ROB['source_sha256']
OUT=ROOT/'output/pdf/informe-balance-el-costo-del-equilibrio-v1.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
INK=colors.HexColor('#1B302E')
TEAL=colors.HexColor('#14665C')
GRAY=colors.HexColor('#5A6663')
LIGHT=colors.HexColor('#EEF2F0')
RULE=colors.HexColor('#CFD8D4')
BRONZE=colors.HexColor('#8B653D')
PAGE_W,PAGE_H=A4
WIDTH=PAGE_W-96
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleReport',fontName='Times-Bold',fontSize=28,leading=31,textColor=INK,spaceAfter=14))
styles.add(ParagraphStyle(name='SectionReport',fontName='Helvetica-Bold',fontSize=18,leading=22,textColor=INK,spaceAfter=12))
styles.add(ParagraphStyle(name='SubReport',fontName='Helvetica-Bold',fontSize=11,leading=15,textColor=TEAL,spaceBefore=12,spaceAfter=6))
styles.add(ParagraphStyle(name='BodyReport',fontName='Helvetica',fontSize=10,leading=14.5,textColor=INK,spaceAfter=8))
styles.add(ParagraphStyle(name='SmallReport',fontName='Helvetica',fontSize=8.2,leading=11.5,textColor=GRAY,spaceAfter=6))
styles.add(ParagraphStyle(name='CellReport',fontName='Helvetica',fontSize=8,leading=10.5,textColor=INK))
styles.add(ParagraphStyle(name='CellTiny',fontName='Helvetica',fontSize=7.2,leading=9,textColor=INK))
styles.add(ParagraphStyle(name='CellHead',fontName='Helvetica-Bold',fontSize=7.5,leading=10,textColor=colors.white))
styles.add(ParagraphStyle(name='CodeReport',fontName='Courier',fontSize=7.2,leading=10,textColor=INK,spaceAfter=5,wordWrap='CJK'))
story=[]

def p(text,style='BodyReport'):
    return Paragraph(text,styles[style])

def para(text,style='BodyReport'): story.append(p(text,style))
def sub(text): para(text,'SubReport')
def gap(n=8): story.append(Spacer(1,n))
def page(number,title):
    if story: story.append(PageBreak())
    para(f'INFORME DE BALANCE / {number:02d}','SmallReport')
    para(title,'SectionReport')

def fmt(x,d=1): return f'{x:.{d}f}'.replace('.',',')
def pct(x,d=1): return fmt(100*x,d)+' %'
def interval(x): return f'{fmt(x[0]*100,2)}-{fmt(x[1]*100,2)}'
def find(mode,scenario,policy): return next(x for x in R['cells'] if x['mode']==mode and x['scenario']==scenario and x['policy']==policy)
def scenarios(mode): return list(dict.fromkeys(x['scenario'] for x in R['cells'] if x['mode']==mode))
NAMES={'random':'Aleatoria','always_A':'Siempre A','always_B':'Siempre B','signs':'Solo signos',
       'myopic':'Cortoplacista*','conservative':'Conservadora*','commitments':'Vencimientos*','planner':'Planificadora*'}
SHORT={'random':'Azar','always_A':'A','always_B':'B','signs':'Signos','myopic':'Corto*','conservative':'Conserv.*','commitments':'Venc.*','planner':'Plan*'}
LABELS={'MA':['Actividad','Tesoro','Bienestar','Confianza'],'MI':['Caja','Demanda','Equipo','Calidad']}

def table(headers,rows,widths=None,tiny=False):
    cell='CellTiny' if tiny else 'CellReport'
    data=[[p(escape(str(v)),'CellHead') for v in headers]]+[[p(escape(str(v)),cell) for v in row] for row in rows]
    t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),TEAL),('VALIGN',(0,0),(-1,-1),'TOP'),
        ('TOPPADDING',(0,0),(-1,0),7),('BOTTOMPADDING',(0,0),(-1,0),7),
        ('TOPPADDING',(0,1),(-1,-1),5 if not tiny else 2),('BOTTOMPADDING',(0,1),(-1,-1),5 if not tiny else 2),
        ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,LIGHT]),
        ('LINEBELOW',(0,-1),(-1,-1),.5,RULE)]))
    story.append(t); gap(5)

class OverviewChart(Flowable):
    def __init__(self): Flowable.__init__(self); self.width=WIDTH; self.height=198
    def draw(self):
        c=self.canv; left=100; right=WIDTH-24; top=165; scale=(right-left)/100
        c.setFont('Helvetica',8); c.setFillColor(GRAY)
        for x in [0,25,50,75,100]:
            px=left+x*scale; c.setStrokeColor(RULE); c.line(px,29,px,top+9); c.drawCentredString(px,16,str(x))
        c.drawCentredString((left+right)/2,2,'Victoria (%) / media con escenarios equiprobables')
        for j,policy in enumerate(['random','always_B','myopic','planner']):
            y=top-j*34
            c.setFillColor(INK); c.drawRightString(left-10,y-9,NAMES[policy])
            for k,mode in enumerate(['MA','MI']):
                v=100*statistics.mean(x['win_rate'] for x in R['cells'] if x['mode']==mode and x['policy']==policy)
                yy=y-k*11; c.setFillColor(TEAL if mode=='MA' else GRAY); c.rect(left,yy,v*scale,7,fill=1,stroke=0)
        c.setFillColor(TEAL); c.rect(left,186,9,6,fill=1,stroke=0); c.setFillColor(INK); c.drawString(left+14,185,'Macro')
        c.setFillColor(GRAY); c.rect(left+76,186,9,6,fill=1,stroke=0); c.setFillColor(INK); c.drawString(left+90,185,'Micro')

def footer(c,doc):
    c.saveState(); c.setStrokeColor(RULE); c.line(48,40,PAGE_W-48,40)
    c.setFont('Helvetica',7.5); c.setFillColor(GRAY)
    c.drawString(48,28,'El costo del equilibrio / especificación v1 / 15 de octubre de 2026')
    c.drawRightString(PAGE_W-48,28,str(doc.page))
    c.restoreState()

page(1,'Conclusión principal')
para('El desafío cambia demasiado<br/>entre macro y micro.','TitleReport')
para('La especificación permite ganar en todos los escenarios analizados y recompensa anticipar pagos en macro. Sin embargo, <b>micro casi no exige planificar para sobrevivir</b> y macro ofrece una receta simple muy eficaz: elegir siempre B.')
story.append(OverviewChart())
para('Fuente: simulación de la especificación v1, 15/10/2026. Cada modo promedia sus cinco escenarios con peso 1/5. Las barras son estimaciones puntuales; no se mezclan ambos modos ni se tratan sus escenarios como muestras independientes. *Políticas informadas.','SmallReport')
table(['Evidencia','Resultado principal'],[
 ['Micro al azar','97,5-99,0 % de victoria, según negocio.'],
 ['Macro siempre B','84,2-97,2 %; supera al cortoplacista informado en los cinco países.'],
 ['Planificación en macro','99,85-99,95 % con búsqueda limitada e impactos conocidos.'],
 ['Recursos críticos','Tesoro/Caja explica todas las derrotas salvo 18 de Bienestar al usar siempre B en macro.'],
 ['Diversidad y cierre','MI24 tiene B dominada; MA18 puede trasladar el pago fuera de las veinte decisiones.']],
 [130,WIDTH-130])
sub('Qué se midió')
para('<b>160.000 partidas de evaluación principal</b>: 2.000 mazos por escenario y política, diez escenarios y ocho políticas. Se añadieron 80.000 partidas de sensibilidad y 17.500 de validación independiente en macro. El piloto de 12.000 partidas se mantuvo separado. Hay 24 comprobaciones del simulador y trayectorias ganadoras guardadas por escenario.','SmallReport')
para('Alcance: análisis de un documento y de un simulador construido para este estudio. Todavía no existe un motor de producción en el repositorio ni evidencia de jugadores reales. No se cambiaron cartas ni reglas.','SmallReport')

page(2,'Macroeconomía: planificar ayuda, pero B es un atajo')
para('Probabilidad estimada de superar veinte decisiones (%). Cada celda usa 2.000 partidas. A y B significan la posición fija del botón en el catálogo actual.')
policies=list(NAMES)
table(['Escenario']+[SHORT[k] for k in policies],[[s]+[fmt(find('MA',s,k)['win_rate']*100,2) for k in policies] for s in scenarios('MA')],
      [99]+[(WIDTH-99)/8]*8,True)
para('*Conocen las magnitudes técnicas, ocultas antes de elegir en la interfaz propuesta. Son referencias informadas, no una predicción del comportamiento de principiantes. Todas usan el mismo mazo por semilla.','SmallReport')
sub('Incertidumbre en tres referencias')
table(['Escenario','Azar: IC 95 %','Siempre B: IC 95 %','Planificadora*: IC 95 %'],
 [[s]+[interval(find('MA',s,k)['wilson95']) for k in ['random','always_B','planner']] for s in scenarios('MA')],
 [120,(WIDTH-120)/3,(WIDTH-120)/3,(WIDTH-120)/3])
para('Intervalos de Wilson, en puntos porcentuales de victoria. Los intervalos completos de las ocho políticas figuran en los anexos.','SmallReport')
sub('La dificultad depende mucho de la estrategia')
para('Con elecciones al azar, Rusia gana 46,35 % y Argentina 26,35 %: una brecha de 20 puntos. Con planificación informada, la brecha observada cae a 0,10 puntos. Esto muestra capacidad de compensación en el modelo; no demuestra que los países ficticios tengan igual dificultad para personas.')
para('Siempre A gana apenas 0,05-1,15 %. Siempre B alcanza 84,20-97,15 %. La posición de las opciones está asociada a una diferencia fuerte de dificultad, aunque eso no prueba que B sea superior en cada carta o estado.')
sub('Cuánto aporta la anticipación')
para('La planificadora mejora al cortoplacista predeterminado entre <b>13,7 y 22,2 puntos</b>, en comparaciones pareadas. En Argentina, la mejora es 22,2 puntos (IC aproximado 95 %: 20,4-24,0). Frente a una conservadora, la ventaja es menor; la validación independiente la sitúa entre 2,2 y 5,8 puntos. La página 7 muestra la sensibilidad a cómo se valora la barra más débil.')

page(3,'Microeconomía: el margen inicial absorbe casi todo')
para('Probabilidad estimada de superar veinte decisiones (%). Cada celda usa 2.000 partidas; reglas y políticas idénticas a macro, adaptadas a sus cuatro indicadores.')
table(['Escenario']+[SHORT[k] for k in policies],[[s]+[fmt(find('MI',s,k)['win_rate']*100,2) for k in policies] for s in scenarios('MI')],
      [99]+[(WIDTH-99)/8]*8,True)
sub('Azar: el escenario más difícil sigue siendo muy permisivo')
table(['Negocio','Victorias / partidas','Victoria (%)','IC 95 % (%)'],
 [[s,f'{find("MI",s,"random")["wins"]} / 2.000',fmt(find('MI',s,'random')['win_rate']*100,2),interval(find('MI',s,'random')['wilson95'])] for s in scenarios('MI')],
 [160,112,100,WIDTH-372])
para('Las seis referencias Siempre B, Solo signos, Cortoplacista, Conservadora, Vencimientos y Planificadora ganaron 2.000/2.000 en cada negocio. Para cada celda, Wilson da aproximadamente <b>99,81-100 %</b>. Cero derrotas observadas no equivale a riesgo cero ni certifica todos los mazos posibles.','SmallReport')
sub('Qué implica para el objetivo educativo')
para('Si la intención es que ganar exija planificar y practicar, la tasa de victoria del azar es una señal clara de falta de presión en este modo. La planificación puede mejorar los recursos de cierre, pero la condición binaria de victoria casi no permite distinguirla de decisiones simples.')
para('Ejemplo: en Panadería, Siempre B termina con medias [Caja 46,1; Demanda 68,6; Equipo 36,4; Calidad 64,6]. La planificadora llega a [67,1; 77,6; 62,9; 73,1]. Ambas ganan todas las partidas de la muestra. Son vectores de índices; sumarlos no produciría una utilidad económica válida.')
sub('El problema es de balance del objetivo, no una prueba de injusticia')
para('Una tasa baja al azar no sería por sí misma un defecto. Aquí ocurre lo contrario: casi cualquier referencia sobrevive. Conviene decidir si micro debe servir como introducción o alcanzar el desafío exigente buscado para el juego completo. No se fijó todavía una tasa objetivo.')

page(4,'Reglas e información de las políticas')
para('Azar del modelo: selección sin reemplazo y orden dentro de tres etapas (6/7/7). Los impactos son deterministas dadas la carta, la elección y el estado. El escenario es equiprobable, pero las estimaciones se presentan por separado.')
table(['Política','Regla ejecutable / información'],[
 ['Aleatoria','A o B con probabilidad 1/2. Un flujo de azar separado del mazo.'],
 ['Siempre A / Siempre B','Elige el mismo botón en las veinte decisiones, sin leer impactos.'],
 ['Solo signos','Maximiza la suma de signo del cambio inmediato dividido por el valor actual de cada barra. Usa direcciones visibles y las condiciones anunciadas; ignora magnitudes y compromisos.'],
 ['Cortoplacista*','Maximiza U del estado tras el impacto inmediato y el recorte a 100. Ignora pagos pendientes.'],
 ['Conservadora*','Prioriza sobrevivir a este turno; luego la barra mínima tras inmediatos y vencimientos; luego U.'],
 ['Vencimientos*','Maximiza el peor U entre el estado resuelto y una proyección de hasta tres turnos con compromisos, sin nuevas decisiones, truncada en el turno 20.'],
 ['Planificadora*','Evalúa cada opción con cuatro continuaciones hipotéticas comunes, hasta tres cartas futuras. Muestrea uniformemente cartas no observadas de la etapa correspondiente. En cada continuación elige con la regla de vencimientos. Maximiza el U final promedio.']],
 [112,WIDTH-112])
para('<b>Función de valor:</b> U = suma de logaritmos de las cuatro barras + 0,05 por la barra mínima. Si una barra es cero o negativa: U = -10.000 + barra mínima. Todas las barras pesan igual en los logaritmos. Desempate determinista: A. Es una heurística de supervivencia; no es una utilidad económica ni una política óptima.','SmallReport')
sub('Qué conoce cada política')
para('Las cuatro políticas marcadas con asterisco conocen los impactos exactos del catálogo, incluida la rama condicional. La planificadora conoce las cartas ya vistas y el catálogo, pero no el orden real futuro: utiliza sorteos hipotéticos. Esto representa información privilegiada o conocimiento aprendido aún no modelado. No hay una política de aprendizaje evaluada.')
para('El documento muestra direcciones, condiciones y calendario antes de elegir, y magnitudes exactas después. La precisión numérica visible de los compromisos necesita concretarse al implementar. Por eso no se atribuyen las tasas informadas a un jugador nuevo.')
sub('Transición validada')
para('Condiciones sobre el estado previo; impactos inmediatos simultáneos; derrota inmediata sin rescate posterior; vencimientos conjuntos si sigue activa; recorte positivo a 100; programación de nuevos compromisos; cierre de la decisión y verificación de la carta veinte. No hay recorte entre inmediato y vencimiento.','SmallReport')

page(5,'Fragilidad: la liquidez decide casi todas las derrotas')
para('En la evaluación principal, todas las derrotas de macro fueron por Tesoro salvo 18 por Bienestar bajo Siempre B. En micro, todas fueron por Caja. Actividad, Confianza, Demanda, Equipo y Calidad pueden condicionar decisiones, pero no causaron derrotas en las políticas y semillas evaluadas.')
table(['Modo / política','Derrotas inmediatas','Por compromiso','Causa'],[
 ['Macro / Azar','4.941','1.633','Tesoro'],['Macro / Cortoplacista*','647','1.072','Tesoro'],
 ['Macro / Vencimientos*','356','4','Tesoro'],['Macro / Planificadora*','6','3','Tesoro'],
 ['Micro / Azar','147','19','Caja']], [153,110,110,WIDTH-373])
sub('Recursos de la planificadora: el promedio no muestra toda la exposición')
table(['Escenario','Final medio: vector de cuatro índices','P5 del mínimo de trayectoria'],
 [[s,' / '.join(fmt(v['mean']) for v in find(mode,s,'planner')['end_all']),fmt(find(mode,s,'planner')['weakest_minimum']['p05'])]
  for mode in ['MA','MI'] for s in scenarios(mode)], [126,250,WIDTH-376],True)
para('Orden macro: Actividad / Tesoro / Bienestar / Confianza. Orden micro: Caja / Demanda / Equipo / Calidad. P5: percentil 5 del menor valor observado entre las cuatro barras y todos los estados inicial/final de decisión. Incluye derrotas; no es el mínimo absoluto de la muestra.','SmallReport')
sub('Cómo se representan las derrotas')
para('Las estadísticas de cierre usan el estado terminal de cada partida, aunque ocurra antes del turno veinte. Se conservan componentes brutos no positivos y se recortan los positivos a 100. No se inventan turnos posteriores. Las estadísticas de ganadoras están guardadas por separado para evitar sesgo de supervivencia.')
para('El archivo de resultados también incluye mediana, P5, P95, mínimo y máximo por barra, mínimos intermedios, turnos en alerta (1-20), decisiones completadas y riesgo por turno entre las partidas aún activas. La tabla anterior resume solo una política; los datos completos permiten consultar las ocho.','SmallReport')
sub('Implicación de diseño')
para('Antes de endurecer todo el catálogo, conviene decidir cuánto deben intervenir las otras barras en la derrota. Aumentar únicamente la presión de Caja/Tesoro podría convertir cuatro indicadores en una prueba casi exclusiva de liquidez. Esta es una hipótesis de ajuste, todavía sin efecto medido.')

page(6,'Cierre y diversidad: dos problemas concretos')
sub('1. MI24: la opción de retiro no ofrece compensación en el modelo')
table(['Opción','Caja','Demanda','Equipo','Calidad'],[
 ['A: dar un bono','-5','+1','+8','+2'],['B: retirar fondos','-7','0','-3','0'],
 ['Ventaja de A frente a B','+2','+1','+11','+2']], [215]+[(WIDTH-215)/4]*4)
para('Ambas opciones carecen de efectos diferidos. A es superior por componente antes del recorte y nunca deja una barra menor tras recortarla. Las condiciones micro posteriores también favorecen valores mayores. B no tiene una ventaja representada dentro del objetivo de supervivencia. Esto contradice literalmente la instrucción de que no existe una opción siempre mejor; el recorte puede producir empates parciales.')
sub('2. MA18: un préstamo puede vencer después de ganar')
para('Si MA18 aparece en el turno 19 o 20 y se elige A, sus -12 o -17 de Tesoro vencen fuera del horizonte. La probabilidad de que el mazo la ubique en esos dos turnos es <b>25 %</b>: 7/8 de inclusión por 2/7 de ubicación. Es una propiedad de la selección, no una tasa de aceptación del préstamo.')
para('En el turno veinte, A mejora [Actividad +2, Tesoro +10, Bienestar +4, Confianza 0], frente a B [-2, +2, -3, 0]. Como el pago queda fuera del juego, A domina débilmente para ese cierre, con los mismos compromisos anteriores. En turnos previos hay condiciones y continuaciones que impiden generalizar esta dominancia inmediata.')
sub('Prueba de tensión después del cierre')
table(['País','Corto*: con costo pendiente','Corto*: cae al liquidar','Plan*: con costo pendiente','Plan*: cae al liquidar'],
 [[s]+[pct(find('MA',s,k)['any_cost_pending_winners']/find('MA',s,k)['wins']) if metric=='pending' else pct(find('MA',s,k)['stress_fail_rate_winners'],2)
        for k,metric in [('myopic','pending'),('myopic','stress'),('planner','pending'),('planner','stress')]] for s in scenarios('MA')],
 [100]+[(WIDTH-100)/4]*4,True)
para('Denominador: únicamente las ganadoras de cada celda. Liquidar aplica todos los compromisos pendientes por fecha y detiene al cruzar cero, sin nuevas decisiones. Es una prueba de tensión, no una extensión oficial ni una reclasificación de la victoria. Costos y beneficios pendientes se guardan por separado; no se compensan para ocultar exposición.','SmallReport')
para('El informe del juego ya contempla obligaciones pendientes, lo cual es coherente con un horizonte finito. Falta decidir si ese cierre debe seguir siendo suficiente para ganar o si habrá un reconocimiento adicional por sostenibilidad; sería una decisión de diseño.','SmallReport')

page(7,'Sensibilidad y prioridades de calibración')
para('No se ajustó el catálogo. Estas variaciones son experimentos del análisis y no propuestas ya validadas para cambiar la dificultad.')
sub('Bajar cinco puntos iniciales no resuelve por sí solo el contraste')
table(['País','Iniciales -5','Actual','Iniciales +5'],
 [[s]+[pct(next(x for x in R['sensitivity'] if x['mode']=='MA' and x['scenario']==s and x['change']=='all_initial_bars' and x['value']==shift)['summary']['win_rate']) if shift else pct(find('MA',s,'commitments')['win_rate']) for shift in [-5,0,5]] for s in scenarios('MA')],
 [170]+[(WIDTH-170)/3]*3)
para('Política Vencimientos*, 2.000 semillas compartidas por celda; se mueven las cuatro barras a la vez. En micro, esta política ganó 100 % con -5, valores actuales y +5 en todos los negocios. Ese resultado no implica que el azar se mantenga igual: no se evaluó el azar con el cambio.','SmallReport')
sub('La ventaja de planificar depende también de la función de valor')
table(['País','Corto*: w=0','Plan*: w=0','Corto*: w=0,15','Plan*: w=0,15'],
 [[s]+[pct(next(x for x in ROB['cells'] if x['scenario']==s and x['policy']==k and x['weight']==w)['win_rate']) for k,w in [('myopic',0),('planner',0),('myopic',.15),('planner',.15)]] for s in scenarios('MA')],
 [100]+[(WIDTH-100)/4]*4,True)
para('Validación independiente: 500 mazos nuevos por celda. w es el peso de la barra mínima en U. Con w=0,15, la ventaja pareada Plan*-Corto* baja a 3,8-6,6 puntos; sus intervalos aproximados excluyen cero en los cinco países. Con w=0,05, Plan*-Conservadora* aporta 2,2-5,8 puntos en esta validación. No conviene atribuir la mejora completa de 13,7-22,2 puntos únicamente a planificar.','SmallReport')
sub('Orden de trabajo propuesto')
para('<b>1. Definir la exigencia deseada.</b> Acordar si micro será introductorio y fijar bandas de victoria por tipo de jugador. No se asigna una nota única de justicia ni una tasa objetivo arbitraria.')
para('<b>2. Calibrar micro y revisar la receta B.</b> Ensayar pocos cambios en márgenes o costos, medirlos sobre semillas compartidas y validar con otras nuevas. Mezclar la posición de botones puede eliminar el atajo visual, pero no corrige el balance de las decisiones subyacentes.')
para('<b>3. Revisar MI24 y el cierre.</b> Representar una compensación dentro del alcance o reformular el dilema; decidir cómo comunicar o distinguir la sostenibilidad posterior. Estos cambios todavía no tienen efectos medidos.')

page(8,'Reproducción, alcance y evidencia verificable')
sub('Entradas y comprobaciones')
para('Fuente única: <b>El_costo_del_equilibrio_Alcance.docx.md</b>, versión 1, octubre de 2026. Extracción automática de 50 cartas, 100 vectores inmediatos, 28 opciones con diferidos y nueve condiciones. Los diez estados iniciales se cotejaron con la fuente.','SmallReport')
para('SHA-256 del documento:','SmallReport'); para(R['source_sha256'],'CodeReport')
para('Las 24 comprobaciones cubren umbrales estrictos, sustituciones y adiciones, condiciones previas, derrota inmediata sin rescate, vencimientos simultáneos, capado tardío, dos causas de derrota, turno 6+2, compromisos en la carta veinte y selección 6/7/7 sin repetir. No hay un motor de producción contra el cual contrastar estas transiciones.','SmallReport')
sub('Semillas y tamaño de muestra')
para('Principal y sensibilidad: 2026101600-2026103599, 2.000 semillas por celda. Piloto separado: 2026101500-2026101599, 100 por celda. Validación macro: 2026200000-2026200499, 500 por celda. Se reutilizan los mismos mazos entre políticas; la dependencia entre escenarios impide interpretar el total de partidas como observaciones independientes de una tasa global.','SmallReport')
sub('Trayectorias ganadoras guardadas')
table(['Escenario','Semilla','Política','Final: vector de índices'],
 [[s,str((g:=W[f'{mode}/{s}/planner/win'])['seed']),'Planificadora*',' / '.join(str(v) for v in g['end'])] for mode in ['MA','MI'] for s in scenarios(mode)],
 [130,97,100,WIDTH-327],True)
para('Cada registro completo conserva mazo, veinte elecciones, estados, condiciones resueltas y obligaciones en results/witnesses.json. Una trayectoria ganadora por escenario acredita existencia en esos mazos; no certifica que todos los mazos admitan ganar. No se hizo búsqueda exhaustiva ni se probaron mazos imposibles.','SmallReport')
sub('Comandos desde la raíz del proyecto')
for command in ['python3 analysis/quant_v1/analyze.py --n 2000 --start-seed 2026101600 --out results',
                'python3 analysis/quant_v1/check_robustness.py',
                'python3 analysis/quant_v1/build_report.py']:
    para(command,'CodeReport')
para('Simulaciones: Python 3.14.7, biblioteca estándar. El PDF requiere reportlab. Se conservan huellas de scripts, configuración, semillas y datos completos. Los IC Monte Carlo describen incertidumbre de muestreo; no cubren errores del modelo ni incertidumbre sobre aprendizaje, comprensión o dificultad percibida. Eso requiere pruebas con jugadores.','SmallReport')

for mode,num in [('MA',9),('MI',10)]:
    page(num,'Anexo: métricas completas de '+('macro' if mode=='MA' else 'micro'))
    para('2.000 partidas por fila. IC 95 % de Wilson para victoria. P5 mínimo: percentil 5 de la barra más baja de toda la trayectoria, incluyendo derrotas. *Políticas informadas.','SmallReport')
    rows=[]
    for s in scenarios(mode):
        for policy in policies:
            x=find(mode,s,policy)
            rows.append([s,NAMES[policy],fmt(100*x['win_rate'],2),interval(x['wilson95']),fmt(x['turns']['mean'],2),fmt(x['weakest_minimum']['p05'])])
    table(['Escenario','Política','Victoria (%)','IC 95 % (%)','Decisiones: media','P5 mínimo (puntos)'],rows,
          [112,106,63,89,65,WIDTH-435],True)

doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=48,bottomMargin=51,
                      title='El costo del equilibrio - Informe de balance de la especificación v1',
                      author='Proyecto El costo del equilibrio',subject='Análisis cuantitativo reproducible del diseño')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT)
