import type { CardOption, Deferred, Tag, Vec } from '../engine/types';

export const v = (a: number, b: number, c: number, d: number): Vec => [a, b, c, d];

export const opt = (label: string, immediate: Vec, tag: Tag, deferred?: Deferred): CardOption =>
  deferred ? { label, immediate, tag, deferred } : { label, immediate, tag };

export const later = (delay: number, vec: Vec): Deferred => ({ delay, vec });
