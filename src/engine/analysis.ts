import { cardById, STATS, studyById, TAG_LABEL } from '../data';
import type { StudyEntry } from '../data/study';
import { ALERT_MAX, addVec } from './engine';
import type { GameState, HistoryEntry, PendingEffect, StatIndex, Tag, Vec } from './types';

const IDX: StatIndex[] = [0, 1, 2, 3];
const sumAbs = (v: Vec) => v.reduce((a, x) => a + Math.abs(x), 0);

export interface IndicatorSummary {
  stat: StatIndex;
  initial: number;
  final: number;
  min: number;
  max: number;
  net: number;
  alertTurns: number;
}

/** §9 Resultados: mínimo, máximo, variación neta y turnos en alerta (valor entre 1 y 20). */
export function indicatorSummaries(s: GameState): IndicatorSummary[] {
  return IDX.map((i) => {
    const series = s.trajectory.map((v) => v[i]);
    return {
      stat: i,
      initial: series[0],
      final: series[series.length - 1],
      min: Math.min(...series),
      max: Math.max(...series),
      net: series[series.length - 1] - series[0],
      alertTurns: s.trajectory.slice(1).filter((v) => v[i] >= 1 && v[i] <= ALERT_MAX).length,
    };
  });
}

/** Efectos diferidos de una decisión que ya se realizaron. */
export function realizedFrom(s: GameState, entry: HistoryEntry): PendingEffect[] {
  if (!entry.created) return [];
  const id = entry.created.id;
  return s.history.flatMap((h) => h.dueApplied.filter((d) => d.id === id));
}

export interface ImpactfulDecision {
  entry: HistoryEntry;
  impact: number;
}

/** Hasta tres decisiones de mayor impacto: magnitud inmediata + efectos ya realizados; desempate por turno. */
export function topDecisions(s: GameState, n = 3): ImpactfulDecision[] {
  return s.history
    .map((entry) => ({
      entry,
      impact: sumAbs(entry.immediate) + realizedFrom(s, entry).reduce((a, d) => a + sumAbs(d.vec), 0),
    }))
    .sort((a, b) => b.impact - a.impact || a.entry.turn - b.entry.turn)
    .slice(0, n);
}

export interface FinancingSummary {
  accepted: HistoryEntry[];
  payments: { turn: number; effect: PendingEffect }[];
  pending: PendingEffect[];
}

/** Préstamos aceptados, pagos realizados y compromisos pendientes (sin llamar ingreso al financiamiento). */
export function financingSummary(s: GameState): FinancingSummary {
  return {
    accepted: s.history.filter((h) => h.tag === 'financiamiento'),
    payments: s.history.flatMap((h) =>
      h.dueApplied.filter((d) => d.tag === 'financiamiento').map((effect) => ({ turn: h.turn, effect })),
    ),
    pending: s.pending.slice().sort((a, b) => a.dueTurn - b.dueTurn),
  };
}

export interface ProfileItem {
  tag: Tag;
  count: number;
  total: number;
  examples: HistoryEntry[];
  sentence: string;
}

export interface Profile {
  mixed: boolean;
  items: ProfileItem[];
  counts: { tag: Tag; count: number }[];
}

/**
 * §9 Perfil de gestión con evidencia: hasta dos etiquetas con al menos tres elecciones
 * y 25 % del total. Si ninguna alcanza el umbral, «gestión mixta». No atribuye rasgos personales.
 */
export function managementProfile(s: GameState): Profile {
  const total = s.history.length;
  const map = new Map<Tag, HistoryEntry[]>();
  for (const h of s.history) map.set(h.tag, [...(map.get(h.tag) ?? []), h]);
  const counts = [...map.entries()]
    .map(([tag, list]) => ({ tag, count: list.length }))
    .sort((a, b) => b.count - a.count);
  const qualifying = counts.filter((c) => c.count >= 3 && total > 0 && c.count / total >= 0.25).slice(0, 2);
  const items = qualifying.map(({ tag, count }) => {
    const list = map.get(tag)!;
    const examples = list.slice(0, 2);
    const sum = list.reduce<Vec>((acc, h) => addVec(acc, h.immediate), [0, 0, 0, 0]);
    const names = STATS[s.mode];
    const up = IDX.filter((i) => sum[i] > 0).sort((a, b) => sum[b] - sum[a])[0];
    const down = IDX.filter((i) => sum[i] < 0).sort((a, b) => sum[a] - sum[b])[0];
    const exText = examples
      .map((h) => `en «${cardById(h.cardId).title}» elegiste «${h.optionLabel}»`)
      .join(examples.length > 1 ? ' y ' : '');
    let effect = '';
    if (up !== undefined && down !== undefined) {
      effect = ` En conjunto, esas decisiones sumaron ${sum[up] > 0 ? '+' : ''}${sum[up]} a ${names[up].name} y restaron ${Math.abs(sum[down])} a ${names[down].name} de forma inmediata.`;
    } else if (up !== undefined) {
      effect = ` En conjunto, esas decisiones sumaron +${sum[up]} a ${names[up].name} de forma inmediata.`;
    } else if (down !== undefined) {
      effect = ` En conjunto, esas decisiones restaron ${Math.abs(sum[down])} a ${names[down].name} de forma inmediata.`;
    }
    const sentence = `Priorizaste ${TAG_LABEL[tag]} en ${count} de ${total} decisiones. ${exText.charAt(0).toUpperCase()}${exText.slice(1)}.${effect}`;
    return { tag, count, total, examples, sentence };
  });
  return { mixed: items.length === 0, items, counts };
}

export interface LearnedConcept {
  study: StudyEntry;
  entry?: HistoryEntry;
  example: string;
  recommendation: string;
  causal: boolean;
}

const fmtVec = (s: GameState, v: Vec) =>
  IDX.filter((i) => v[i] !== 0)
    .map((i) => `${STATS[s.mode][i].name} ${v[i] > 0 ? '+' : '−'}${Math.abs(v[i])}`)
    .join(', ') || 'sin cambios';

/** §9 «Lo que aprendiste»: 3 a 5 conceptos; en derrota se prioriza el de la carta o compromiso causal. */
export function learnedConcepts(s: GameState, max = 5): LearnedConcept[] {
  const out: LearnedConcept[] = [];
  const seen = new Set<string>();
  const push = (studyId: string, entry: HistoryEntry | undefined, causal: boolean) => {
    if (seen.has(studyId) || out.length >= max) return;
    const study = studyById(studyId);
    if (!study) return;
    seen.add(studyId);
    const card = entry ? cardById(entry.cardId) : undefined;
    const example = entry && card
      ? `Turno ${entry.turn}, «${card.title}»: elegiste «${entry.optionLabel}» (${fmtVec(s, entry.immediate)}).`
      : study.example;
    out.push({ study, entry, example, recommendation: study.tip, causal });
  };

  if (s.status === 'lost' && s.defeat) {
    for (const cause of s.defeat) {
      const entry = s.history.find((h) => h.cardId === cause.cardId);
      for (const id of cardById(cause.cardId).studyIds) push(id, entry, true);
    }
  }
  // Luego, las decisiones de mayor impacto y el resto en orden.
  const ordered = [...topDecisions(s, s.history.length).map((d) => d.entry)];
  for (const entry of ordered) for (const id of cardById(entry.cardId).studyIds) push(id, entry, false);
  return out;
}

/** En victoria: obligaciones que aún podrían comprometer la continuidad. */
export const riskyPending = (s: GameState) => s.pending.filter((p) => p.vec.some((x) => x < 0));

/** Decisiones con resultado neto positivo dentro del modelo (inmediato + diferido realizado). */
export function solidDecisions(s: GameState, n = 3) {
  return s.history
    .map((entry) => {
      const total = realizedFrom(s, entry).reduce<Vec>((acc, d) => addVec(acc, d.vec), entry.immediate);
      return { entry, net: total.reduce((a, x) => a + x, 0) };
    })
    .filter((d) => d.net > 0)
    .sort((a, b) => b.net - a.net || a.entry.turn - b.entry.turn)
    .slice(0, n);
}
