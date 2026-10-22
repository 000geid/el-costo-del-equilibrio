import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cardById, STATS } from '../../data';
import { TOTAL_TURNS } from '../../engine/engine';
import type { GameState, Mode, OptionKey, PendingEffect, Scenario, Vec } from '../../engine/types';
import { Encounter, SituationCopy } from '../components/Encounter';
import { DecisionConsequence } from '../components/DecisionConsequence';
import { GameDialog } from '../components/GameDialog';
import { StatsBar, VecText } from '../components/Stats';
import { useConsequenceDialog } from '../useConsequenceDialog';

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
  const gameRef = useRef<HTMLDivElement>(null);
  const ledgerId = useId();
  const inConsequence = game.phase === 'consequence';
  const feedback = useConsequenceDialog(inConsequence ? game : null, reduceMotion);
  const consequenceGame = feedback.snapshot;
  const last = inConsequence ? game.history[game.history.length - 1] : undefined;
  const card = cardById(inConsequence && last ? last.cardId : game.deck[game.turn]);
  const before = inConsequence && last ? last.before : game.stats;
  const delta = inConsequence && last ? (last.after.map((x, i) => x - last.before[i]) as Vec) : null;
  const cardNo = inConsequence ? game.turn : game.turn + 1;
  const nextDue = game.pending.reduce<number | undefined>((earliest, commitment) =>
    earliest === undefined ? commitment.dueTurn : Math.min(earliest, commitment.dueTurn), undefined);

  useEffect(() => {
    // Choosing keeps the reading position; only a fresh card starts at the top.
    if (game.phase === 'card') {
      setLedgerOpen(false);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [game.id, game.turn, game.phase]);

  return (
    <div ref={gameRef} className={`game game-${game.mode} encounter-game`} data-phase={game.phase}>
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
        <Encounter
          key={`${game.id}:${cardNo}`}
          card={card}
          scene={sceneOf(scenario)}
          vocab={scenario.vocab}
          stats={before}
          selectedOption={last?.choice}
          reduceMotion={reduceMotion}
          onChoose={onDecide}
          onShowConsequence={feedback.open}
        />

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
      {consequenceGame && (
        <GameDialog title="Consecuencias de tu elección" onClose={feedback.close} reduceMotion={reduceMotion}
          returnFocus={() => gameRef.current?.querySelector<HTMLElement>(game.phase === 'card' ? '.card-title' : '.consequence-reopen')}>
          {(dismiss) => <Consequence game={consequenceGame} scenario={scenario} onNext={() => {
            if (consequenceGame.status === 'active') dismiss(feedback.close, onNext);
            else dismiss(() => { feedback.close(); onNext(); });
          }} />}
        </GameDialog>
      )}
    </div>
  );
}

function Consequence({ game, scenario, onNext }: {
  game: GameState; scenario: Scenario; onNext: () => void;
}) {
  const last = game.history[game.history.length - 1];
  const card = cardById(last.cardId);
  const before = last.before;
  const ended = game.status !== 'active';
  return (
    <DecisionConsequence
      mode={game.mode}
      optionLabel={last.optionLabel}
      before={last.before}
      after={last.after}
      immediate={last.immediate}
      review={<>
        <p className="explanation">{card.explanation}</p>
        <SituationCopy card={card} vocab={scenario.vocab} stats={before} />
      </>}
      notice={game.status === 'lost' && (
        <p className="defeat-note">⚠ Una barra llegó a cero. La gestión termina en esta carta.</p>
      )}
      actions={
        <button className="btn btn-primary" onClick={onNext}>
          {ended ? 'Ver resultado' : 'Siguiente carta'}
        </button>
      }
    >
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
    </DecisionConsequence>
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
