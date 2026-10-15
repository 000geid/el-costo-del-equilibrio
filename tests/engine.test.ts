import { describe, expect, it } from 'vitest';
import { ALL_CARDS, MACRO_CARDS, MICRO_CARDS, QUESTIONS, SCENARIOS, STUDY, cardById } from '../src/data';
import {
  advance, beginPlay, buildDeck, createGame, decide, effectiveOption, recordStudyVisit, TOTAL_TURNS,
} from '../src/engine/engine';
import { financingSummary, indicatorSummaries, managementProfile, topDecisions } from '../src/engine/analysis';
import type { GameState, Vec } from '../src/engine/types';

const MACRO_FILL = ['MA02', 'MA03', 'MA04', 'MA05', 'MA07', 'MA08', 'MA12', 'MA13', 'MA14', 'MA15', 'MA16', 'MA17', 'MA20', 'MA21', 'MA22', 'MA23', 'MA24', 'MA25', 'MA10', 'MA11'];

/** Estado de prueba con un mazo y valores controlados. */
function fixture(deck: string[], stats: Vec = [50, 50, 50, 50], turn = 0): GameState {
  const g = beginPlay(createGame({ playerName: 'Test', mode: 'macro', seed: 1, scenarioId: 'arg', now: 0 }));
  return { ...g, deck, stats, initial: stats, trajectory: [stats], turn };
}

describe('contenido', () => {
  it('tiene 50 cartas completas, 25 por modo, con IDs únicos', () => {
    expect(ALL_CARDS).toHaveLength(50);
    expect(MACRO_CARDS).toHaveLength(25);
    expect(MICRO_CARDS).toHaveLength(25);
    expect(new Set(ALL_CARDS.map((c) => c.id)).size).toBe(50);
    for (const c of ALL_CARDS) {
      expect(c.title && c.text && c.concept && c.explanation && c.character).toBeTruthy();
      expect(c.options.A.label).toBeTruthy();
      expect(c.options.B.label).toBeTruthy();
      expect(c.studyIds.length).toBeGreaterThan(0);
      for (const id of c.studyIds) expect(STUDY.some((s) => s.id === id)).toBe(true);
    }
  });

  it('respeta las etapas: 01–08 inicio, 09–17 desarrollo, 18–25 cierre', () => {
    for (const c of ALL_CARDS) {
      const n = Number(c.id.slice(2));
      const stage = n <= 8 ? 'inicio' : n <= 17 ? 'desarrollo' : 'cierre';
      expect(c.stage).toBe(stage);
    }
  });

  it('tiene 10 escenarios, 22 fichas y 10 preguntas con respuesta válida', () => {
    expect(SCENARIOS).toHaveLength(10);
    expect(STUDY).toHaveLength(22);
    expect(QUESTIONS).toHaveLength(10);
    for (const q of QUESTIONS) expect(q.options[q.answer]).toBeTruthy();
  });
});

describe('selección de cartas', () => {
  it('arma 20 cartas sin repetir, 6/7/7 por etapa y en orden de etapas', () => {
    for (const mode of ['macro', 'micro'] as const) {
      for (let seed = 1; seed < 200; seed++) {
        const deck = buildDeck(mode, seed);
        expect(deck).toHaveLength(TOTAL_TURNS);
        expect(new Set(deck).size).toBe(TOTAL_TURNS);
        const stages = deck.map((id) => cardById(id).stage);
        expect(stages.slice(0, 6).every((s) => s === 'inicio')).toBe(true);
        expect(stages.slice(6, 13).every((s) => s === 'desarrollo')).toBe(true);
        expect(stages.slice(13).every((s) => s === 'cierre')).toBe(true);
        expect(deck.every((id) => cardById(id).mode === mode)).toBe(true);
      }
    }
  });

  it('es reproducible con la misma semilla', () => {
    expect(buildDeck('micro', 42)).toEqual(buildDeck('micro', 42));
    expect(createGame({ playerName: 'a', mode: 'macro', seed: 7 }).scenarioId)
      .toBe(createGame({ playerName: 'b', mode: 'macro', seed: 7 }).scenarioId);
  });
});

describe('pruebas funcionales (§13)', () => {
  it('resolver la carta veinte con una barra que cae a cero produce derrota, no victoria', () => {
    // MA25 B: Tesoro −7. Con Tesoro 7 en el turno 20, cae a 0.
    const deck = [...MACRO_FILL.slice(0, 19), 'MA25'];
    const s = { ...fixture(deck, [50, 7, 50, 50]), turn: 19 };
    const r = decide(s, 'B');
    expect(r.turn).toBe(20);
    expect(r.status).toBe('lost');
    expect(r.defeat?.[0]).toMatchObject({ stat: 1, source: 'decision', cardId: 'MA25' });
  });

  it('completar veinte decisiones sin barras en cero produce victoria', () => {
    const deck = [...MACRO_FILL.slice(0, 19), 'MA25'];
    const s = { ...fixture(deck, [50, 50, 50, 50]), turn: 19 };
    expect(decide(s, 'A').status).toBe('won');
  });

  it('una barra en cien no provoca derrota y el exceso se recorta; una en cero sí', () => {
    const s = fixture(['MA02', ...MACRO_FILL.slice(1)], [100, 100, 100, 100]);
    const r = decide(s, 'A'); // B +10
    expect(r.status).toBe('active');
    expect(r.stats[2]).toBe(100);
    expect(r.history[0].raw[2]).toBe(110);

    const z = fixture(['MA02', ...MACRO_FILL.slice(1)], [50, 9, 50, 50]);
    expect(decide(z, 'A').status).toBe('lost'); // T −9 → 0
  });

  it('un efecto elegido en el turno 6 con retraso 2 vence tras la decisión del turno 8', () => {
    const deck = [...MACRO_FILL.slice(0, 5), 'MA01', ...MACRO_FILL.slice(5, 19)];
    let s = fixture(deck);
    for (let i = 0; i < 5; i++) s = advance(decide(s, 'A'));
    s = decide(s, 'A'); // turno 6: Reparar el puente → +2 turnos
    expect(s.pending).toHaveLength(1);
    expect(s.pending[0]).toMatchObject({ cardId: 'MA01', createdTurn: 6, dueTurn: 8 });
    s = advance(s);
    s = decide(s, 'B'); // turno 7
    expect(s.history[6].dueApplied).toHaveLength(0);
    expect(s.pending.some((p) => p.cardId === 'MA01')).toBe(true);
    s = advance(s);
    s = decide(s, 'B'); // turno 8
    expect(s.history[7].dueApplied.map((d) => d.cardId)).toContain('MA01');
    expect(s.pending.some((p) => p.cardId === 'MA01')).toBe(false);
  });

  it('volver desde una ficha de estudio conserva la carta y no aplica cambios', () => {
    const s = fixture(['MA02', ...MACRO_FILL.slice(1)]);
    const r = recordStudyVisit(s, 'inflacion');
    expect(r.stats).toEqual(s.stats);
    expect(r.turn).toBe(s.turn);
    expect(r.phase).toBe('card');
    expect(r.history).toHaveLength(0);
    expect(r.studyVisits).toEqual(['inflacion']);
  });

  it('las condiciones leen valores previos y eligen la rama correcta antes de elegir', () => {
    const ma19 = cardById('MA19');
    expect(effectiveOption(ma19, 'A', [44, 50, 50, 50]).immediate).toEqual([10, -9, 5, 1]);
    expect(effectiveOption(ma19, 'A', [45, 50, 50, 50]).immediate).toEqual([3, -9, 0, -2]);
    expect(effectiveOption(ma19, 'B', [45, 50, 50, 50]).immediate).toEqual([-2, 4, -2, 0]);

    const ma18 = cardById('MA18');
    expect(effectiveOption(ma18, 'A', [50, 50, 50, 54]).deferred?.vec).toEqual([0, -17, 0, 0]);
    expect(effectiveOption(ma18, 'A', [50, 50, 50, 55]).deferred?.vec).toEqual([0, -12, 0, 0]);

    const ma20 = cardById('MA20');
    expect(effectiveOption(ma20, 'B', [50, 50, 34, 50]).immediate).toEqual([0, -2, -4, -2]);

    // La condición usa el estado anterior aunque la propia decisión lo cambie.
    const mi01 = cardById('MI01');
    expect(effectiveOption(mi01, 'A', [50, 55, 50, 50]).immediate).toEqual([7, -4, 0, 0]);
    expect(effectiveOption(mi01, 'A', [50, 54, 50, 50]).immediate).toEqual([2, -10, 0, 0]);
  });

  it('un compromiso posterior al turno veinte figura pendiente y no se cobra antes', () => {
    // MA09 A: devolución a +3 turnos. Elegida en el turno 19 → vence el 22.
    const deck = [...MACRO_FILL.slice(0, 18), 'MA09', 'MA25'];
    let s = { ...fixture(deck), turn: 18 };
    s = advance(decide(s, 'A'));
    s = decide(s, 'A');
    expect(s.status).toBe('won');
    expect(s.pending).toHaveLength(1);
    expect(s.pending[0]).toMatchObject({ cardId: 'MA09', dueTurn: 22 });
    expect(s.history.every((h) => h.dueApplied.length === 0)).toBe(true);
    expect(financingSummary(s).pending).toHaveLength(1);
  });

  it('si dos indicadores cruzan cero en la misma fase, se informan ambos', () => {
    // MA09 B: Actividad −4, Bienestar −7.
    const s = fixture(['MA09', ...MACRO_FILL.slice(1)], [4, 50, 7, 50]);
    const r = decide(s, 'B');
    expect(r.status).toBe('lost');
    expect(r.defeat?.map((c) => c.stat).sort()).toEqual([0, 2]);
  });

  it('una derrota por compromiso cita la carta que lo creó y la inmediata no aplica vencimientos', () => {
    const deck = ['MA09', 'MA02', 'MA03', 'MA04', ...MACRO_FILL.slice(4)];
    let s = fixture(deck, [50, 50, 50, 50]);
    s = advance(decide(s, 'A')); // T 62, vence en turno 4 con T −15
    s = advance(decide(s, 'A')); // T 53
    s = advance(decide(s, 'B')); // T 50
    s = { ...s, stats: [50, 20, 50, 50] };
    const r = decide(s, 'A'); // MA04 A: T −8 → 12, luego −15 → −3
    expect(r.status).toBe('lost');
    expect(r.defeat?.[0]).toMatchObject({ stat: 1, source: 'commitment', cardId: 'MA09' });

    // Si la decisión inmediata ya provoca derrota, el vencimiento queda pendiente.
    const r2 = decide({ ...s, stats: [50, 8, 50, 50] }, 'A');
    expect(r2.defeat?.[0].source).toBe('decision');
    expect(r2.history[3].dueApplied).toHaveLength(0);
    expect(r2.pending.some((p) => p.cardId === 'MA09')).toBe(true);
  });

  it('refrescar en la pantalla de consecuencia no duplica impactos', () => {
    const s = fixture(['MA02', ...MACRO_FILL.slice(1)]);
    const r = decide(s, 'A');
    const restored = JSON.parse(JSON.stringify(r)) as GameState;
    expect(restored.phase).toBe('consequence');
    expect(() => decide(restored, 'A')).toThrow();
    const next = advance(restored);
    expect(next.stats).toEqual(r.stats);
    expect(next.turn).toBe(1);
    expect(next.phase).toBe('card');
  });

  it('el financiamiento no se cuenta como ingreso en el análisis', () => {
    const deck = ['MA09', ...MACRO_FILL.slice(1)];
    let s = fixture(deck);
    s = decide(s, 'A');
    const f = financingSummary(s);
    expect(f.accepted.map((h) => h.cardId)).toEqual(['MA09']);
    expect(f.pending[0].vec[1]).toBeLessThan(0);
  });
});

describe('análisis', () => {
  it('calcula mínimos, máximos, alerta, perfil y decisiones de mayor impacto', () => {
    let s = fixture(['MA02', 'MA04', 'MA07', 'MA03', ...MACRO_FILL.slice(4)], [50, 50, 50, 50]);
    for (let i = 0; i < 4; i++) s = advance(decide(s, i < 3 ? 'A' : 'B'));
    const summary = indicatorSummaries(s);
    expect(summary[1].min).toBeLessThan(50);
    const profile = managementProfile(s);
    expect(profile.items[0].tag).toBe('social');
    expect(profile.items[0].count).toBe(3);
    expect(profile.items[0].sentence).toMatch(/Priorizaste el bienestar social en 3 de 4/);
    expect(topDecisions(s)).toHaveLength(3);
  });
});
