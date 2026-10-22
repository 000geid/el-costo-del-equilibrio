import { describe, expect, it } from 'vitest';
import { commitmentKind } from '../src/ui/components/GameLedger';
import type { PendingEffect, Vec } from '../src/engine/types';

const pending = (vec: Vec): PendingEffect => ({
  id: 'test', cardId: 'test', option: 'A', optionLabel: 'Compromiso', createdTurn: 1,
  dueTurn: 5, vec, tag: 'inversion',
});

describe('marcadores de compromisos', () => {
  it('conserva los costos aunque el beneficio total sea mayor o igual', () => {
    expect(commitmentKind([pending([10, -2, 0, 0])])).toBe('mixed');
    expect(commitmentKind([pending([10, -10, 0, 0])])).toBe('mixed');
    expect(commitmentKind([pending([2, -10, 0, 0])])).toBe('mixed');
  });

  it('muestra como mixtos los compromisos opuestos de una misma fecha', () => {
    expect(commitmentKind([pending([10, 0, 0, 0]), pending([-10, 0, 0, 0])])).toBe('mixed');
  });

  it('distingue beneficios, costos y ausencia de variación', () => {
    expect(commitmentKind([pending([0, 5, 0, 2])])).toBe('pos');
    expect(commitmentKind([pending([0, -5, 0, -2])])).toBe('neg');
    expect(commitmentKind([pending([0, 0, 0, 0])])).toBe('neutral');
  });
});
