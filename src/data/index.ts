import type { Card, Mode } from '../engine/types';
import { MACRO_CARDS } from './cardsMacro';
import { MICRO_CARDS } from './cardsMicro';

export const ALL_CARDS: Card[] = [...MACRO_CARDS, ...MICRO_CARDS];
const BY_ID = new Map(ALL_CARDS.map((c) => [c.id, c]));

export const cardById = (id: string): Card => {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`Carta desconocida: ${id}`);
  return c;
};

export const cardsFor = (mode: Mode) => (mode === 'macro' ? MACRO_CARDS : MICRO_CARDS);

/** Reemplaza {insumo}, {maquina}, etc. con el vocabulario del negocio. */
export const adaptText = (text: string, vocab?: Record<string, string>) =>
  vocab ? text.replace(/\{(\w+)\}/g, (_, k: string) => vocab[k] ?? k) : text;

/** Primera letra en mayúscula (para frases que empiezan con un marcador). */
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export { MACRO_CARDS, MICRO_CARDS };
export * from './scenarios';
export * from './study';
export * from './questions';
export * from './stats';
