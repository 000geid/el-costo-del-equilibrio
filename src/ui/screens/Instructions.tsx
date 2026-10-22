import { useRef, useState } from 'react';
import { TUTORIAL } from '../../data/tutorial';
import { effectiveOption } from '../../engine/engine';
import type { Mode, OptionKey, Vec } from '../../engine/types';
import { Encounter, SituationCopy } from '../components/Encounter';
import { DecisionConsequence } from '../components/DecisionConsequence';
import { GameDialog } from '../components/GameDialog';
import type { SceneSpec } from '../components/Portrait';
import { StatsBar, VecText } from '../components/Stats';
import { useConsequenceDialog } from '../useConsequenceDialog';

export const INSTRUCTIONS_STEPS = [
  'Leé la situación.',
  'Elegí entre dos opciones.',
  'Mantené tus cuatro indicadores por encima de cero.',
  'Superá 20 decisiones.',
];

export const INSTRUCTIONS_NOTE =
  'Algunas consecuencias llegan después. Podés pausar y estudiar cuando lo necesites.';

export function InstructionsScreen({ canStart, onPractice, onStart, onBack }: {
  canStart: boolean; onPractice: () => void; onStart: () => void; onBack: () => void;
}) {
  return (
    <div className="page">
      <article className="parchment page-card">
        <h1>Instrucciones</h1>
        <ol className="instruction-steps">
          {INSTRUCTIONS_STEPS.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <p className="lead">{INSTRUCTIONS_NOTE}</p>

        <div className="row">
          <button className="btn" onClick={onPractice}>Practicar</button>
          {canStart && <button className="btn btn-primary" onClick={onStart}>Comenzar</button>}
          <button className="btn btn-ghost" onClick={onBack}>Volver</button>
        </div>
      </article>
    </div>
  );
}

const PRACTICE_STATS: Vec = [50, 50, 50, 50];

const PRACTICE_SCENES: Record<Mode, SceneSpec> = {
  macro: { mode: 'macro', colors: ['#3f6e8c', '#efe2c2', '#d9b45a'], emblem: 'sun' },
  micro: { mode: 'micro', colors: ['#2f6b6b', '#efe2c2', '#d98c2a'], emblem: 'gear' },
};

export function PracticeCardScreen({ mode, reduceMotion, onBack }: {
  mode: Mode; reduceMotion: boolean; onBack: () => void;
}) {
  const card = TUTORIAL[mode];
  const [choice, setChoice] = useState<OptionKey | null>(null);
  const [attempt, setAttempt] = useState(0);
  const gameRef = useRef<HTMLDivElement>(null);
  const feedback = useConsequenceDialog(choice, reduceMotion);
  const eff = choice ? effectiveOption(card, choice, PRACTICE_STATS) : null;
  const after = eff ? (PRACTICE_STATS.map((x, i) => x + eff.immediate[i]) as Vec) : PRACTICE_STATS;
  const shownEffect = feedback.snapshot ? effectiveOption(card, feedback.snapshot, PRACTICE_STATS) : null;
  const shownAfter = shownEffect ? (PRACTICE_STATS.map((x, i) => x + shownEffect.immediate[i]) as Vec) : PRACTICE_STATS;

  const onChoose = (key: OptionKey) => {
    if (choice !== null) return;
    setChoice(key);
  };

  const repeat = () => {
    setChoice(null);
    setAttempt((current) => current + 1);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  return (
    <div ref={gameRef} className={`game game-${mode} encounter-game practice`} data-phase={choice ? 'consequence' : 'card'}>
      <header className="game-head">
        <div className="game-head-info"><span className="who">Carta de práctica</span><span className="where">No altera tu partida</span></div>
        <div className="game-head-turn">Práctica</div>
        <div className="game-head-actions"><button className="btn btn-small btn-ghost" onClick={onBack}>Volver</button></div>
      </header>
      <StatsBar mode={mode} stats={after} delta={eff ? eff.immediate : null} iconLabels reduceMotion={reduceMotion} />
      <div className="game-body">
        <Encounter
          key={attempt}
          card={card}
          scene={PRACTICE_SCENES[mode]}
          stats={PRACTICE_STATS}
          selectedOption={choice ?? undefined}
          reduceMotion={reduceMotion}
          onChoose={onChoose}
          onShowConsequence={feedback.open}
        />
      </div>
      {shownEffect && (
        <GameDialog title="Consecuencias de tu elección" onClose={feedback.close} reduceMotion={reduceMotion}
          returnFocus={() => gameRef.current?.querySelector<HTMLElement>(choice ? '.consequence-reopen' : '.card-title')}>
          {(dismiss) => (
            <DecisionConsequence
              mode={mode}
              optionLabel={shownEffect.label}
              before={PRACTICE_STATS}
              after={shownAfter}
              immediate={shownEffect.immediate}
              review={<>
                <p className="explanation">{card.explanation}</p>
                <SituationCopy card={card} stats={PRACTICE_STATS} />
              </>}
              notice={<p>Esto es una práctica: no altera tu partida. Podés volver a elegir para comparar las dos opciones.</p>}
              actions={<>
                <button className="btn btn-primary" type="button" onClick={() => dismiss(feedback.close, repeat)}>Volver a elegir</button>
                <button className="btn" type="button" onClick={() => dismiss(onBack)}>Volver</button>
              </>}
            >
              {shownEffect.deferred && (<>
                <dt>Nuevo compromiso</dt>
                <dd>Dentro de {shownEffect.deferred.delay} turnos: <VecText mode={mode} vec={shownEffect.deferred.vec} /></dd>
              </>)}
            </DecisionConsequence>
          )}
        </GameDialog>
      )}
    </div>
  );
}
