import type { Mode } from '../engine/types';

export interface Question {
  id: string;
  mode: Mode;
  studyId: string;
  prompt: string;
  options: [string, string, string];
  answer: 0 | 1 | 2;
  explanation: string;
}

/** Sección 10: diez preguntas de práctica. No consumen cartas ni modifican barras. */
export const QUESTIONS: Question[] = [
  { id: 'P1', mode: 'macro', studyId: 'inflacion', prompt: 'Un ingreso no cambia y los precios suben 10 %. ¿Qué ocurre con su poder adquisitivo?',
    options: ['Aumenta', 'Disminuye', 'Permanece igual'], answer: 1, explanation: 'El mismo ingreso compra menos bienes y servicios.' },
  { id: 'P2', mode: 'macro', studyId: 'deficit-deuda', prompt: '¿Qué diferencia déficit y deuda?',
    options: ['Son lo mismo', 'El déficit es un flujo y la deuda un saldo acumulado', 'La deuda es solo gasto anual'], answer: 1, explanation: 'El déficit corresponde a un período; la deuda representa obligaciones acumuladas.' },
  { id: 'P3', mode: 'macro', studyId: 'oferta-demanda', prompt: 'Un precio máximo queda por debajo del equilibrio. ¿Qué puede aparecer?',
    options: ['Exceso de demanda', 'Oferta ilimitada', 'Eliminación de costos'], answer: 0, explanation: 'La cantidad demandada puede superar la ofrecida.' },
  { id: 'P4', mode: 'macro', studyId: 'fiscal', prompt: '¿Cuál es una medida fiscal?',
    options: ['Cambiar el gasto público', 'Cambiar la tasa de política monetaria', 'Cambiar una licencia privada'], answer: 0, explanation: 'La política fiscal comprende gasto e impuestos.' },
  { id: 'P5', mode: 'macro', studyId: 'costo-oportunidad', prompt: 'Financiar un puerto en lugar de una plaza ilustra principalmente…',
    options: ['Ausencia de escasez', 'Costo de oportunidad', 'Dinero gratuito'], answer: 1, explanation: 'Elegir un proyecto implica renunciar a otro uso de los recursos.' },
  { id: 'P6', mode: 'micro', studyId: 'flujo-caja', prompt: 'Se vende a crédito con ganancia. ¿Hay efectivo disponible inmediatamente?',
    options: ['Siempre', 'Nunca habrá efectivo', 'No necesariamente'], answer: 2, explanation: 'El cobro puede ocurrir después de pagar costos.' },
  { id: 'P7', mode: 'micro', studyId: 'equilibrio', prompt: 'Precio 20, costo variable 12, costos fijos 600. ¿Cuántas unidades cubren los costos?',
    options: ['30', '50', '75'], answer: 2, explanation: 'El margen unitario es 8; 600 dividido por 8 es 75.' },
  { id: 'P8', mode: 'micro', studyId: 'interes', prompt: 'Recibís 500 y devolvés 600 en dos turnos. ¿Cuál es el interés de ese plazo?',
    options: ['10 %', '20 %', '60 %'], answer: 1, explanation: 'Los 100 adicionales representan 20 % de 500; no es una tasa anual.' },
  { id: 'P9', mode: 'micro', studyId: 'costos', prompt: '¿Cuál es un costo variable en este ejemplo?',
    options: ['Comisión por cada venta', 'Alquiler mensual fijo', 'Retiro del dueño'], answer: 0, explanation: 'La comisión cambia con las ventas; el retiro no es costo productivo.' },
  { id: 'P10', mode: 'micro', studyId: 'capital-propio', prompt: '¿Un aporte de un socio es igual a un préstamo?',
    options: ['Sí', 'No, implica participación en el capital', 'Sí, si se usa para insumos'], answer: 1, explanation: 'Participación y obligación de devolución son mecanismos distintos.' },
];
