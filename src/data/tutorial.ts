import type { Card, Mode } from '../engine/types';
import { later, opt, v } from './helpers';

/** Cartas de práctica: no forman parte de las cincuenta y no alteran la partida. */
export const TUTORIAL: Record<Mode, Card> = {
  macro: {
    id: 'PRÁCTICA', mode: 'macro', stage: 'inicio',
    character: 'Escriba del consejo',
    imageHint: 'Escriba con un pergamino de práctica.',
    portrait: { sex: 'm', age: 'young', skin: 2, hair: 'curly', hairColor: 'brown', hat: 'hood', outfit: '#5a4a3a', trim: '#d9b45a', prop: 'scroll' },
    title: 'La fuente de la plaza',
    text: 'La fuente pública está rota. Arreglarla hoy cuesta fondos y mejora el ánimo del barrio; un plan de mantenimiento cuesta menos ahora y rinde dentro de dos turnos.',
    concept: 'Costo de oportunidad',
    studyIds: ['costo-oportunidad'],
    options: {
      A: opt('Arreglarla hoy', v(0, -6, 5, 3), 'social'),
      B: opt('Plan de mantenimiento', v(0, -3, 0, 1), 'inversion', later(2, v(2, 0, 5, 2))),
    },
    explanation: 'Las dos opciones usan recursos del Tesoro. Una da resultados ahora; la otra crea un compromiso con beneficios más adelante. Esto es una práctica: no cambia tu partida.',
  },
  micro: {
    id: 'PRÁCTICA', mode: 'micro', stage: 'inicio',
    character: 'Aprendiz del negocio',
    imageHint: 'Aprendiz con una lista de tareas.',
    portrait: { sex: 'f', age: 'young', skin: 1, hair: 'braid', hairColor: 'blond', hat: 'scarf', outfit: '#3a5a6b', trim: '#e0c48a', prop: 'tablet' },
    title: 'La vidriera del local',
    text: 'La vidriera está despintada. Pintarla hoy atrae clientes enseguida; un cartel nuevo cuesta menos ahora y suma clientes dentro de dos turnos.',
    concept: 'Inversión y productividad',
    studyIds: ['inversion'],
    options: {
      A: opt('Pintar hoy', v(-5, 4, 0, 2), 'clientes'),
      B: opt('Encargar un cartel', v(-2, 0, 0, 0), 'inversion', later(2, v(2, 5, 0, 0))),
    },
    explanation: 'Gastar ahora puede mejorar resultados inmediatos o futuros. Esto es una práctica: no cambia tu partida.',
  },
};
