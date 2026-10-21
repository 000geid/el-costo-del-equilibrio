/**
 * Simulación de balance (§13 «Balance y revisión académica»).
 * Ejecuta muchas partidas por escenario con distintas políticas y reporta tasas de victoria.
 * Uso: npm run simulate -- [partidas por escenario]
 */
import { SCENARIOS, STATS } from '../src/data';
import { advance, beginPlay, createGame, currentCard, decide, effectiveOption } from '../src/engine/engine';
import { mulberry32 } from '../src/engine/rng';
import type { GameState, OptionKey } from '../src/engine/types';

type Policy = (s: GameState, rand: () => number) => OptionKey;

/** Valor de la peor barra tras el efecto inmediato y los compromisos que vencen este turno. */
function lookahead(s: GameState, key: OptionKey): number {
  const card = currentCard(s)!;
  const eff = effectiveOption(card, key, s.stats);
  const turn = s.turn + 1;
  const after = s.stats.map((x, i) => x + eff.immediate[i]);
  for (const p of s.pending) if (p.dueTurn === turn) p.vec.forEach((x, i) => (after[i] += x));
  return Math.min(...after);
}

/** Utilidad con aversión al riesgo y proyección de compromisos en los próximos 3 turnos. */
function utility(stats: number[]): number {
  const minVal = Math.min(...stats);
  if (minVal <= 0) return -10000 + minVal;
  return stats.reduce((acc, x) => acc + Math.log(Math.min(100, x)), 0) + 0.05 * minVal;
}

function forecastScore(s: GameState, key: OptionKey, horizon = 3): number {
  const next = decide(s, key, 0);
  if (next.status === 'lost') return -10000 + Math.min(...next.stats);
  let cur = next.stats.slice();
  let worst = utility(cur);
  for (let t = next.turn + 1; t <= Math.min(20, next.turn + horizon); t++) {
    for (const p of next.pending) {
      if (p.dueTurn === t) cur = cur.map((x, i) => x + p.vec[i]);
    }
    cur = cur.map((x) => Math.min(100, x));
    worst = Math.min(worst, utility(cur));
    if (Math.min(...cur) <= 0) break;
  }
  return worst;
}

const POLICIES: Record<string, Policy> = {
  'Siempre A': () => 'A',
  'Siempre B': () => 'B',
  'Al azar': (_s, r) => (r() < 0.5 ? 'A' : 'B'),
  'Cuidar la peor barra': (s) => (lookahead(s, 'A') >= lookahead(s, 'B') ? 'A' : 'B'),
  'Planificar (compromisos)': (s) => (forecastScore(s, 'A') >= forecastScore(s, 'B') ? 'A' : 'B'),
};

function play(mode: 'macro' | 'micro', scenarioId: string, seed: number, policy: Policy) {
  const rand = mulberry32(seed * 7 + 3);
  let s = beginPlay(createGame({ playerName: 'sim', mode, seed, scenarioId, now: 0 }));
  while (s.status === 'active') s = advance(decide(s, policy(s, rand), 0));
  return s;
}

const N = Number(process.argv[2] ?? 2000);
console.log(`\nEl costo del equilibrio — simulación de balance (${N} partidas por escenario y política)\n`);

const rows: string[][] = [];
for (const sc of SCENARIOS) {
  const row = [`${sc.mode === 'macro' ? 'Macro' : 'Micro'} · ${sc.name}`];
  const causes = new Map<string, number>();
  for (const [name, policy] of Object.entries(POLICIES)) {
    let wins = 0;
    for (let i = 1; i <= N; i++) {
      const s = play(sc.mode, sc.id, i, policy);
      if (s.status === 'won') wins++;
      else if (name === 'Al azar') for (const c of s.defeat ?? []) {
        const k = STATS[sc.mode][c.stat].name;
        causes.set(k, (causes.get(k) ?? 0) + 1);
      }
    }
    row.push(`${((wins / N) * 100).toFixed(1)} %`);
  }
  const top = [...causes.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ');
  row.push(top || '—');
  rows.push(row);
}

const header = ['Escenario', ...Object.keys(POLICIES), 'Derrotas al azar por barra'];
const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
const line = (r: string[]) => r.map((c, i) => c.padEnd(widths[i])).join(' │ ');
console.log(line(header));
console.log(widths.map((w) => '─'.repeat(w)).join('─┼─'));
for (const r of rows) console.log(line(r));
console.log('\nLectura: «Siempre A» no debería garantizar la victoria y debe existir al menos una trayectoria ganadora por escenario.\n');
