import { useState } from 'react';
import { TUTORIAL } from '../../data/tutorial';
import { effectiveOption } from '../../engine/engine';
import type { Mode, OptionKey, Vec } from '../../engine/types';
import { Portrait } from '../components/Portrait';
import { StatsBar, VecText } from '../components/Stats';

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

export function PracticeCardScreen({ mode, onBack }: { mode: Mode; onBack: () => void }) {
  const card = TUTORIAL[mode];
  const [choice, setChoice] = useState<OptionKey | null>(null);
  const eff = choice ? effectiveOption(card, choice, PRACTICE_STATS) : null;
  const after = eff ? (PRACTICE_STATS.map((x, i) => x + eff.immediate[i]) as Vec) : PRACTICE_STATS;
  return (
    <div className={`game game-${mode} practice`}>
      <header className="game-head">
        <div className="game-head-info"><span className="who">Carta de práctica</span><span className="where">No altera tu partida</span></div>
        <div className="game-head-turn">Práctica</div>
        <div className="game-head-actions"><button className="btn btn-small btn-ghost" onClick={onBack}>Volver</button></div>
      </header>
      <StatsBar mode={mode} stats={after} delta={eff ? eff.immediate : null} />
      <div className="game-body single">
        <section className="table">
          <div className="situation parchment">
            <h2 className="card-title">{card.title}</h2>
            <p>{card.text}</p>
          </div>
          <div className="swipe"><div className="card-face anim-deal">
            <Portrait spec={card.portrait} scene={{ mode, colors: mode === 'macro' ? ['#3f6e8c', '#efe2c2', '#d9b45a'] : ['#2f6b6b', '#efe2c2', '#d98c2a'], emblem: mode === 'macro' ? 'sun' : 'gear' }} title={card.imageHint} />
            <div className="card-ribbon"><span className="card-character">{card.character}</span></div>
          </div></div>
          {!choice ? (
            <div className="choices">
              {(['A', 'B'] as OptionKey[]).map((k) => {
                const o = card.options[k];
                return (
                  <button key={k} className="choice" onClick={() => setChoice(k)}>
                  <span className="choice-side" aria-hidden="true">{k === 'A' ? '◀' : '▶'}</span>
                  <span className="choice-label">{o.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="consequence parchment">
              <div className="consequence-head"><span className="label">Elegiste</span><strong>«{eff!.label}»</strong></div>
              <dl className="consequence-list">
                <dt>Efecto inmediato</dt><dd><VecText mode={mode} vec={eff!.immediate} /></dd>
                {eff!.deferred && (<><dt>Nuevo compromiso</dt><dd>Dentro de {eff!.deferred.delay} turnos: <VecText mode={mode} vec={eff!.deferred.vec} /></dd></>)}
              </dl>
              <p className="explanation">{card.explanation}</p>
              <div className="row">
                <button className="btn" onClick={() => setChoice(null)}>Probar la otra opción</button>
                <button className="btn btn-primary" onClick={onBack} autoFocus>Volver</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
