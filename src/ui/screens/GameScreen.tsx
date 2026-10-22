import { useEffect, useRef } from 'react';
import { cardById, STATS } from '../../data';
import { TOTAL_TURNS } from '../../engine/engine';
import type { GameState, OptionKey, Scenario, Vec } from '../../engine/types';
import { Encounter, SituationCopy } from '../components/Encounter';
import { DecisionConsequence } from '../components/DecisionConsequence';
import { GameDialog } from '../components/GameDialog';
import { GameLedger } from '../components/GameLedger';
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
  const gameRef = useRef<HTMLDivElement>(null);
  const inConsequence = game.phase === 'consequence';
  const feedback = useConsequenceDialog(inConsequence ? game : null, reduceMotion);
  const consequenceGame = feedback.snapshot;
  const last = inConsequence ? game.history[game.history.length - 1] : undefined;
  const card = cardById(inConsequence && last ? last.cardId : game.deck[game.turn]);
  const before = inConsequence && last ? last.before : game.stats;
  const delta = inConsequence && last ? (last.after.map((x, i) => x - last.before[i]) as Vec) : null;
  const cardNo = inConsequence ? game.turn : game.turn + 1;

  useEffect(() => {
    // Choosing keeps the reading position; only a fresh card starts at the top.
    if (game.phase === 'card') {
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
          <button className="btn btn-small btn-ghost game-pause" type="button" onClick={onPause} aria-label="Pausar partida" title="Pausar partida">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 8v8M15 8v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <StatsBar mode={game.mode} stats={game.stats} delta={delta} iconLabels reduceMotion={reduceMotion} />

      <GameLedger key={`${game.id}:${cardNo}`} game={game} reduceMotion={reduceMotion} />

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
