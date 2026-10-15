import type { Mode, StatIndex, Tag } from '../engine/types';

export interface StatMeta {
  key: string;
  short: string;
  name: string;
  meaning: string;
  defeat: string;
  icon: 'gear' | 'chest' | 'heart' | 'scale' | 'coins' | 'people' | 'basket' | 'star';
  color: string;
}

export const STATS: Record<Mode, [StatMeta, StatMeta, StatMeta, StatMeta]> = {
  macro: [
    { key: 'A', short: 'A', name: 'Actividad', meaning: 'Índice de capacidad de producir y sostener actividad. No es el PBI real.', defeat: 'Parálisis económica: la actividad dejó de sostenerse.', icon: 'gear', color: '#c27c2c' },
    { key: 'T', short: 'T', name: 'Tesoro', meaning: 'Margen fiscal y recursos disponibles en el modelo. No equivale a un saldo monetario real.', defeat: 'Sin recursos para sostener servicios.', icon: 'chest', color: '#c9a03a' },
    { key: 'B', short: 'B', name: 'Bienestar', meaning: 'Condiciones materiales y acceso a servicios de la población.', defeat: 'Crisis social: las condiciones materiales colapsaron.', icon: 'heart', color: '#b4483c' },
    { key: 'C', short: 'C', name: 'Confianza', meaning: 'Credibilidad y cooperación ciudadana e institucional.', defeat: 'Pérdida de gobernabilidad.', icon: 'scale', color: '#4f7a8c' },
  ],
  micro: [
    { key: 'K', short: 'K', name: 'Caja', meaning: 'Disponibilidad financiera para mantener operaciones.', defeat: 'No pudiste sostener los pagos del negocio.', icon: 'coins', color: '#c9a03a' },
    { key: 'D', short: 'D', name: 'Demanda', meaning: 'Fortaleza de las ventas y de la clientela. No son unidades físicas.', defeat: 'Las ventas dejaron de sostener la actividad.', icon: 'basket', color: '#c27c2c' },
    { key: 'E', short: 'E', name: 'Equipo', meaning: 'Bienestar y capacidad del personal.', defeat: 'El equipo ya no pudo mantener las operaciones.', icon: 'people', color: '#5a8c5a' },
    { key: 'Q', short: 'Q', name: 'Calidad', meaning: 'Calidad y continuidad del producto o servicio.', defeat: 'Las fallas del servicio hicieron inviable continuar.', icon: 'star', color: '#4f7a8c' },
  ],
};

export const statName = (mode: Mode, i: StatIndex) => STATS[mode][i].name;

export const TAG_LABEL: Record<Tag, string> = {
  social: 'el bienestar social',
  prudencia: 'la prudencia',
  inversion: 'la inversión',
  estabilidad: 'la estabilidad',
  recaudacion: 'la recaudación',
  actividad: 'la actividad',
  regulacion: 'la regulación',
  financiamiento: 'el financiamiento',
  clientes: 'a los clientes',
  rentabilidad: 'la rentabilidad',
  equipo: 'al equipo',
  calidad: 'la calidad',
  retiro: 'el retiro de fondos',
};

export const TAG_SHORT: Record<Tag, string> = {
  social: 'Social', prudencia: 'Prudencia', inversion: 'Inversión', estabilidad: 'Estabilidad',
  recaudacion: 'Recaudación', actividad: 'Actividad', regulacion: 'Regulación', financiamiento: 'Financiamiento',
  clientes: 'Clientes', rentabilidad: 'Rentabilidad', equipo: 'Equipo', calidad: 'Calidad', retiro: 'Retiro',
};

export const MODE_LABEL: Record<Mode, string> = { macro: 'Macroeconomía', micro: 'Microeconomía' };
