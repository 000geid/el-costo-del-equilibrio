import { useEffect, useId, useMemo, useState } from 'react';
import { adaptText, capitalize, cardById, STATS } from '../../data';
import { isConditionActive, TOTAL_TURNS } from '../../engine/engine';
import type { Card, GameState, Mode, OptionKey, PendingEffect, Scenario, Vec } from '../../engine/types';
import { Portrait } from '../components/Portrait';
import { GameDialog } from '../components/GameDialog';
import { StatGlyph } from '../components/Icons';
import { StatsBar, VecText } from '../components/Stats';
import { SwipeCard } from '../components/SwipeCard';

interface Props {
  game: GameState;
  scenario: Scenario;
  reduceMotion: boolean;
  onDecide: (key: OptionKey) => void;
  onNext: () => void;
  onPause: () => void;
  onStudy: () => void;
}

export const sceneOf = (s: Scenario) => ({ mode: s.mode, colors: s.colors, emblem: s.emblem });

export function GameScreen({ game, scenario, reduceMotion, onDecide, onNext, onPause, onStudy }: Props) {
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [consequenceOpen, setConsequenceOpen] = useState(game.phase === 'consequence');
  const ledgerId = useId();
  const inConsequence = game.phase === 'consequence';
  const last = inConsequence ? game.history[game.history.length - 1] : undefined;
  const card = cardById(inConsequence && last ? last.cardId : game.deck[game.turn]);
  const before = inConsequence && last ? last.before : game.stats;
  const delta = inConsequence && last ? (last.after.map((x, i) => x - last.before[i]) as Vec) : null;
  const cardNo = inConsequence ? game.turn : game.turn + 1;
  const nextDue = game.pending.reduce<number | undefined>((earliest, commitment) =>
    earliest === undefined ? commitment.dueTurn : Math.min(earliest, commitment.dueTurn), undefined);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLedgerOpen(false);
    setConsequenceOpen(game.phase === 'consequence');
  }, [game.turn, game.phase]);

  return (
    <div className={`game game-${game.mode} encounter-game`} data-phase={game.phase}>
      <header className="game-head">
        <div className="game-head-info">
          <span className="who">{game.playerName}</span>
          <span className="where" title={scenario.name}>{scenario.name}</span>
        </div>
        <div className="game-head-turn" aria-live="polite">
          Carta <strong>{cardNo}</strong> de {TOTAL_TURNS}
        </div>
        <div className="game-head-actions">
          <button className="btn btn-small btn-ghost game-study" onClick={onStudy}>Estudiar</button>
          <button className="btn btn-small btn-ghost" onClick={onPause}>Pausar</button>
        </div>
      </header>

      <StatsBar mode={game.mode} stats={game.stats} delta={delta} iconLabels reduceMotion={reduceMotion} />

      <div className="game-body">
        <section className="table encounter" aria-label="Carta actual">
          <div className="situation">
            <div className="encounter-heading">
              <h2 className="card-title">{card.title}</h2>
              <p className="mobile-character">{card.character}</p>
            </div>
            <div className="situation-copy">
              <SituationCopy card={card} scenario={scenario} stats={before} />
            </div>
          </div>

          <SwipeCard
            key={card.id}
            labels={{ A: card.options.A.label, B: card.options.B.label }}
            disabled={inConsequence}
            reduceMotion={reduceMotion}
            onChoose={onDecide}
          >
            <div className={`card-face ${inConsequence ? 'is-resolved' : ''} ${reduceMotion ? '' : 'anim-deal'}`}>
              <Portrait spec={card.portrait} scene={sceneOf(scenario)} title={card.imageHint} />
              <div className="card-ribbon">
                <span className="card-character">{card.character}</span>
              </div>
            </div>
          </SwipeCard>

          {!inConsequence ? (
            <div className="choices" role="group" aria-label="Elegí tu decisión">
              {(['A', 'B'] as OptionKey[]).map((k) => (
                <ChoiceButton
                  key={k}
                  k={k}
                  card={card}
                  onChoose={onDecide}
                />
              ))}
              <p className="hint">Elegí una respuesta o deslizá la carta.</p>
            </div>
          ) : (
            last && (
              <div className="choices consequence-reopen">
                <p className="hint">Elegiste: «{last.optionLabel}»</p>
                <button className="btn btn-primary" type="button" onClick={() => setConsequenceOpen(true)}>Ver consecuencias</button>
              </div>
            )
          )}
        </section>

        <aside className={`game-ledger ${ledgerOpen ? 'is-open' : ''}`} aria-label="Registro de la gestión">
          <button className="ledger-toggle" type="button" aria-expanded={ledgerOpen} aria-controls={ledgerId} onClick={() => setLedgerOpen((open) => !open)}>
            <span>
              <span className="ledger-toggle-title">Calendario y compromisos</span>
              <span className="ledger-summary">
                {nextDue === undefined ? 'Sin compromisos pendientes' : `${game.pending.length} pendiente${game.pending.length === 1 ? '' : 's'} · ${nextDue > TOTAL_TURNS ? 'después del cierre' : `próximo tras la carta ${nextDue}`}`}
              </span>
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <div className="side" id={ledgerId} hidden={!ledgerOpen}>
            <Timeline game={game} />
            <Commitments mode={game.mode} pending={game.pending} turn={game.turn} />
          </div>
        </aside>
      </div>
      {inConsequence && last && consequenceOpen && (
        <GameDialog title="Consecuencias de tu elección" onClose={() => setConsequenceOpen(false)} reduceMotion={reduceMotion}>
          {(dismiss) => <Consequence game={game} card={card} scenario={scenario} before={before} onNext={() => dismiss(onNext)} />}
        </GameDialog>
      )}
    </div>
  );
}

function SituationCopy({ card, scenario, stats }: { card: Card; scenario: Scenario; stats: Vec }) {
  return <>
    <p>{capitalize(adaptText(card.text, scenario.vocab))}</p>
    {card.condition && <ConditionBox card={card} mode={scenario.mode} stats={stats} />}
  </>;
}

function ChoiceButton({ k, card, onChoose }: {
  k: OptionKey; card: Card; onChoose: (k: OptionKey) => void;
}) {
  return (
    <button
      className="choice"
      type="button"
      onClick={() => onChoose(k)}
    >
      <span className="choice-copy">
        <span className="choice-label">{card.options[k].label}</span>
        <span className="choice-direction">Deslizar a la {k === 'A' ? 'izquierda' : 'derecha'}</span>
      </span>
      <span className="choice-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d={k === 'A' ? 'M19 12H5m6-6-6 6 6 6' : 'M5 12h14m-6-6 6 6-6 6'} />
        </svg>
      </span>
    </button>
  );
}

function ConditionBox({ card, mode, stats }: { card: Card; mode: Mode; stats: Vec }) {
  const c = card.condition!;
  const active = isConditionActive(card, stats);
  const name = STATS[mode][c.stat].name;
  return (
    <div className={`condition ${active ? 'is-active' : ''}`} role="note">
      <strong>Condición visible.</strong> {c.notice}{' '}
      <span className="condition-state">
        Tu {name} es {stats[c.stat]}: {active ? 'la condición se aplica.' : 'la condición no se aplica.'}
      </span>
    </div>
  );
}

function Consequence({ game, card, scenario, before, onNext }: {
  game: GameState; card: Card; scenario: Scenario; before: Vec; onNext: () => void;
}) {
  const last = game.history[game.history.length - 1];
  const ended = game.status !== 'active';
  return (
    <div className="consequence">
      <div className="consequence-head">
        <span className="label">Elegiste</span>
        <strong>«{last.optionLabel}»</strong>
      </div>
      <p className="consequence-caption">Balance de esta carta · antes y después</p>
      <ul className="consequence-stats" aria-label="Cambios en los indicadores">
        {STATS[game.mode].map((meta, i) => {
          const change = last.after[i] - last.before[i];
          return (
            <li key={meta.key}>
              <span className="consequence-stat-name"><svg viewBox="0 0 60 60" fill="currentColor" aria-hidden="true"><StatGlyph icon={meta.icon} /></svg>{meta.name}</span>
              <span className="consequence-stat-values"><span>{last.before[i]}</span><span aria-label="a">→</span><strong>{last.after[i]}</strong></span>
              <span className={`consequence-stat-delta ${change > 0 ? 'up' : change < 0 ? 'down' : 'muted'}`}>{change > 0 ? `+${change}` : change < 0 ? `−${Math.abs(change)}` : 'Sin cambios'}</span>
            </li>
          );
        })}
      </ul>
      <dl className="consequence-list">
        <dt>Efecto inmediato</dt>
        <dd><VecText mode={game.mode} vec={last.immediate} /></dd>
        {last.conditionActive && (
          <>
            <dt>Condición</dt>
            <dd>Se aplicó con {STATS[game.mode][card.condition!.stat].name} en {before[card.condition!.stat]} antes de decidir.</dd>
          </>
        )}
        {last.dueApplied.length > 0 && (
          <>
            <dt>Compromisos que vencieron</dt>
            <dd>
              {last.dueApplied.map((d) => (
                <div key={d.id}>
                  «{d.optionLabel}»: <VecText mode={game.mode} vec={d.vec} />
                </div>
              ))}
            </dd>
          </>
        )}
        {last.created && (
          <>
            <dt>Nuevo compromiso</dt>
            <dd>
              Vence tras la carta {last.created.dueTurn}
              {last.created.dueTurn > TOTAL_TURNS ? ' (después del cierre)' : ''}: <VecText mode={game.mode} vec={last.created.vec} />
            </dd>
          </>
        )}
        {last.dueApplied.length === 0 && game.status === 'lost' && game.pending.some((p) => p.dueTurn === last.turn) && (
          <>
            <dt>Pendiente</dt>
            <dd>La gestión terminó antes de aplicar los compromisos de este turno; quedan registrados como pendientes.</dd>
          </>
        )}
      </dl>
      <details className="situation-review">
        <summary>Explicación y situación</summary>
        <p className="explanation">{card.explanation}</p>
        <SituationCopy card={card} scenario={scenario} stats={before} />
      </details>
      {game.status === 'lost' && (
        <p className="defeat-note">⚠ Una barra llegó a cero. La gestión termina en esta carta.</p>
      )}
      <div className="row">
        <button className="btn btn-primary" onClick={onNext}>
          {ended ? 'Ver resultado' : 'Siguiente carta'}
        </button>
      </div>
    </div>
  );
}

/** Calendario de 20 cartas con los vencimientos marcados. */
function Timeline({ game }: { game: GameState }) {
  const dues = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of game.pending) m.set(p.dueTurn, (m.get(p.dueTurn) ?? 0) + p.vec.reduce((a, x) => a + x, 0));
    return m;
  }, [game.pending]);
  return (
    <div className="timeline">
      <h2 className="ledger-title">Calendario</h2>
      <ol className="pips">
        {Array.from({ length: TOTAL_TURNS }, (_, i) => {
          const t = i + 1;
          const done = t <= game.turn;
          const current = t === game.turn + 1 && game.phase === 'card';
          const due = dues.get(t);
          return (
            <li
              key={t}
              className={`pip ${done ? 'done' : ''} ${current ? 'current' : ''}`}
              title={`Carta ${t}${due !== undefined ? ' · vence un compromiso' : ''}`}
            >
              <span className="pip-num">{t}</span>
              {due !== undefined && <span className={`pip-due ${due >= 0 ? 'pos' : 'neg'}`} aria-label="compromiso" />}
            </li>
          );
        })}
      </ol>
      {[...dues.keys()].some((t) => t > TOTAL_TURNS) && <p className="small muted">Hay compromisos que vencen después del cierre.</p>}
    </div>
  );
}

function Commitments({ mode, pending, turn }: { mode: Mode; pending: PendingEffect[]; turn: number }) {
  const list = pending.slice().sort((a, b) => a.dueTurn - b.dueTurn);
  return (
    <div className="commitments">
      <h2 className="ledger-title">Compromisos pendientes</h2>
      {list.length === 0 ? (
        <p className="small muted">No hay pagos ni beneficios comprometidos.</p>
      ) : (
        <ul>
          {list.map((p) => (
            <li key={p.id}>
              <div className="commit-head">
                <strong>«{p.optionLabel}»</strong>
                <span className="commit-due">
                  {p.dueTurn > TOTAL_TURNS ? 'después del cierre' : p.dueTurn - turn <= 1 ? `¡tras la carta ${p.dueTurn}!` : `tras la carta ${p.dueTurn}`}
                </span>
              </div>
              <VecText mode={mode} vec={p.vec} />
              {p.tag === 'financiamiento' && <div className="small muted">Devolución de financiamiento (no es un ingreso).</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
