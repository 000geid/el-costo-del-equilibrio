import { cardById, cardsFor, scenariosFor, scenarioById } from '../data';
import { mulberry32, randomSeed, shuffle } from './rng';
import type {
  Card, CardOption, DefeatCause, GameState, HistoryEntry, Mode, OptionKey, PendingEffect, Stage, StatIndex, Vec,
} from './types';

export const TOTAL_TURNS = 20;
export const MAX_STAT = 100;
export const ALERT_MAX = 20;
export const STAGE_PICKS: Record<Stage, number> = { inicio: 6, desarrollo: 7, cierre: 7 };
const STAGES: Stage[] = ['inicio', 'desarrollo', 'cierre'];
const IDX: StatIndex[] = [0, 1, 2, 3];

export const addVec = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
export const isZeroVec = (v: Vec) => v.every((x) => x === 0);

/**
 * Selección reproducible (§7): por etapa se sortean sin reemplazo 6, 7 y 7 cartas
 * y se barajan dentro de cada bloque. No se repiten cartas ni se mezclan modos.
 */
export function buildDeck(mode: Mode, seed: number): string[] {
  const rand = mulberry32(seed);
  const cards = cardsFor(mode);
  return STAGES.flatMap((stage) => {
    const pool = cards.filter((c) => c.stage === stage).map((c) => c.id);
    return shuffle(pool, rand).slice(0, STAGE_PICKS[stage]);
  });
}

export function pickScenario(mode: Mode, seed: number): string {
  // Se usa una semilla derivada para no acoplar el escenario al orden del mazo.
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const list = scenariosFor(mode);
  return list[Math.floor(rand() * list.length)].id;
}

export interface NewGameOptions {
  playerName: string;
  mode: Mode;
  seed?: number;
  scenarioId?: string;
  now?: number;
}

export function createGame(opts: NewGameOptions): GameState {
  const seed = opts.seed ?? randomSeed();
  const scenarioId = opts.scenarioId ?? pickScenario(opts.mode, seed);
  const scenario = scenarioById(scenarioId);
  if (scenario.mode !== opts.mode) throw new Error('El escenario no corresponde al modo');
  const now = opts.now ?? Date.now();
  const stats = scenario.stats.slice() as Vec;
  return {
    rulesVersion: 1,
    id: `${opts.mode}-${seed.toString(36)}-${now.toString(36)}`,
    playerName: opts.playerName,
    mode: opts.mode,
    scenarioId,
    seed,
    deck: buildDeck(opts.mode, seed),
    turn: 0,
    phase: 'scenario',
    stats,
    initial: stats.slice() as Vec,
    trajectory: [stats.slice() as Vec],
    history: [],
    pending: [],
    studyVisits: [],
    status: 'active',
    startedAt: now,
    updatedAt: now,
  };
}

export const beginPlay = (s: GameState): GameState =>
  s.phase === 'scenario' ? { ...s, phase: 'card', updatedAt: Date.now() } : s;

export const currentCard = (s: GameState): Card | undefined =>
  s.turn < s.deck.length ? cardById(s.deck[s.turn]) : undefined;

/** Condición evaluada siempre con los indicadores previos a la decisión (§8). */
export function isConditionActive(card: Card, stats: Vec): boolean {
  const c = card.condition;
  if (!c) return false;
  const value = stats[c.stat];
  return c.op === '<' ? value < c.value : value >= c.value;
}

export interface EffectiveOption extends CardOption {
  conditionActive: boolean;
}

/** Devuelve la opción con la condición aplicada (sustitución o adición). */
export function effectiveOption(card: Card, key: OptionKey, stats: Vec): EffectiveOption {
  const base = card.options[key];
  const result: EffectiveOption = {
    ...base,
    immediate: base.immediate.slice() as Vec,
    deferred: base.deferred ? { delay: base.deferred.delay, vec: base.deferred.vec.slice() as Vec } : undefined,
    conditionActive: false,
  };
  const c = card.condition;
  if (!c || c.target !== key || !isConditionActive(card, stats)) return result;
  result.conditionActive = true;
  switch (c.kind) {
    case 'replaceImmediate':
      result.immediate = c.vec.slice() as Vec;
      break;
    case 'addImmediate':
      result.immediate = addVec(result.immediate, c.vec);
      break;
    case 'replaceDeferred':
      if (result.deferred) result.deferred = { ...result.deferred, vec: c.vec.slice() as Vec };
      break;
  }
  return result;
}

/** Sentido de los efectos inmediatos (lo que se muestra antes de elegir). */
export function previewSigns(card: Card, key: OptionKey, stats: Vec): Vec {
  return effectiveOption(card, key, stats).immediate.map((x) => Math.sign(x)) as Vec;
}

/**
 * Resuelve una decisión siguiendo el orden de §7:
 * 1) condiciones con estado previo; 2) vector inmediato (derrota inmediata si alguna barra ≤ 0);
 * 3) compromisos que vencen este turno (derrota por compromiso); 4) recorte a 100;
 * 5) programar nuevos efectos; 6) historial; 7) victoria o derrota.
 */
export function decide(s: GameState, key: OptionKey, now = Date.now()): GameState {
  if (s.status !== 'active' || s.phase !== 'card') throw new Error('No hay una carta pendiente de decisión');
  const card = currentCard(s);
  if (!card) throw new Error('El mazo está agotado');
  const turn = s.turn + 1;
  const before = s.stats.slice() as Vec;
  const eff = effectiveOption(card, key, before);

  // Paso 2: vector inmediato.
  let raw = addVec(before, eff.immediate);
  const causes: DefeatCause[] = [];
  for (const i of IDX) {
    if (raw[i] <= 0) causes.push({ stat: i, source: 'decision', cardId: card.id, turn, rawValue: raw[i] });
  }

  // Paso 3: compromisos que vencen en este turno (solo si la partida sigue activa).
  let pending = s.pending.slice();
  let dueApplied: PendingEffect[] = [];
  if (causes.length === 0) {
    dueApplied = pending.filter((p) => p.dueTurn === turn);
    if (dueApplied.length > 0) {
      pending = pending.filter((p) => p.dueTurn !== turn);
      for (const d of dueApplied) raw = addVec(raw, d.vec);
      for (const i of IDX) {
        if (raw[i] <= 0) {
          // El compromiso más negativo sobre esa barra se cita como causa.
          const culprit = dueApplied.reduce((a, b) => (b.vec[i] < a.vec[i] ? b : a));
          causes.push({ stat: i, source: 'commitment', cardId: culprit.cardId, turn, rawValue: raw[i] });
        }
      }
    }
  }

  // Paso 4: recorte (positivos a 100; el bruto se conserva en el historial).
  const after = raw.map((x) => Math.min(MAX_STAT, Math.max(0, x))) as Vec;

  // Paso 5: programar el efecto diferido de la opción elegida.
  let created: PendingEffect | undefined;
  if (eff.deferred && !isZeroVec(eff.deferred.vec)) {
    created = {
      id: `${card.id}-${key}-${turn}`,
      cardId: card.id,
      option: key,
      optionLabel: eff.label,
      createdTurn: turn,
      dueTurn: turn + eff.deferred.delay,
      vec: eff.deferred.vec,
      tag: eff.tag,
    };
    pending.push(created);
  }

  // Paso 6: historial.
  const entry: HistoryEntry = {
    turn,
    cardId: card.id,
    choice: key,
    optionLabel: eff.label,
    tag: eff.tag,
    conditionActive: eff.conditionActive,
    before,
    immediate: eff.immediate,
    dueApplied,
    created,
    raw,
    after,
    defeat: causes.length ? causes : undefined,
  };

  // Paso 7: cierre.
  const lost = causes.length > 0;
  const won = !lost && turn >= TOTAL_TURNS;
  return {
    ...s,
    turn,
    phase: 'consequence',
    stats: after,
    trajectory: [...s.trajectory, after],
    history: [...s.history, entry],
    pending,
    status: lost ? 'lost' : won ? 'won' : 'active',
    defeat: lost ? causes : undefined,
    updatedAt: now,
  };
}

/** «Siguiente carta»: pasa de la consecuencia a la próxima carta o al final. */
export function advance(s: GameState): GameState {
  if (s.phase !== 'consequence') return s;
  return { ...s, phase: s.status === 'active' ? 'card' : 'ended', updatedAt: Date.now() };
}

export function recordStudyVisit(s: GameState, studyId: string): GameState {
  if (s.studyVisits.includes(studyId)) return s;
  return { ...s, studyVisits: [...s.studyVisits, studyId] };
}

/** Compromisos pendientes que vencerían después del turno 20: quedan visibles en el informe. */
export const commitmentsAfterHorizon = (s: GameState) => s.pending.filter((p) => p.dueTurn > TOTAL_TURNS);

/** Validación mínima de un estado guardado. */
export function isValidState(x: unknown): x is GameState {
  if (!x || typeof x !== 'object') return false;
  const s = x as GameState;
  try {
    return (
      s.rulesVersion === 1 &&
      Array.isArray(s.deck) && s.deck.length === TOTAL_TURNS &&
      s.deck.every((id) => !!cardById(id)) &&
      Array.isArray(s.stats) && s.stats.length === 4 &&
      !!scenarioById(s.scenarioId)
    );
  } catch {
    return false;
  }
}
