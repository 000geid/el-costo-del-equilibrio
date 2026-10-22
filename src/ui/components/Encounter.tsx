import { adaptText, capitalize, STATS } from '../../data';
import { isConditionActive } from '../../engine/engine';
import type { Card, OptionKey, Vec } from '../../engine/types';
import { Portrait, type SceneSpec } from './Portrait';
import { SwipeCard } from './SwipeCard';

interface Props {
  card: Card;
  scene: SceneSpec;
  stats: Vec;
  vocab?: Record<string, string>;
  selectedOption?: OptionKey;
  reduceMotion: boolean;
  onChoose: (key: OptionKey) => void;
  onShowConsequence: () => void;
}

/** The same encounter is used for a real decision and an isolated practice. */
export function Encounter({ card, scene, stats, vocab, selectedOption, reduceMotion, onChoose, onShowConsequence }: Props) {
  const resolved = selectedOption !== undefined;
  return (
    <section className="table encounter" aria-label="Carta actual" data-reduce-motion={reduceMotion}>
      <div className="situation">
        <div className="encounter-heading">
          <h2 className="card-title" tabIndex={-1}>{card.title}</h2>
          <p className="mobile-character">{card.character}</p>
        </div>
        <div className="situation-copy">
          <SituationCopy card={card} stats={stats} vocab={vocab} />
        </div>
      </div>

      <SwipeCard
        key={card.id}
        labels={{ A: card.options.A.label, B: card.options.B.label }}
        disabled={resolved}
        reduceMotion={reduceMotion}
        onChoose={onChoose}
      >
        <div className={`card-face ${resolved ? 'is-resolved' : ''}`}>
          <Portrait spec={card.portrait} scene={scene} title={card.imageHint} />
          <div className="card-ribbon">
            <span className="card-character">{card.character}</span>
          </div>
        </div>
      </SwipeCard>

      <div className="choices" role="group" aria-label={resolved ? 'Tu decisión' : 'Elegí tu decisión'}>
        {(['A', 'B'] as OptionKey[]).map((key) => (
          <button key={key} className={`choice ${selectedOption === key ? 'is-selected' : ''}`} type="button" disabled={resolved} onClick={() => onChoose(key)}>
            <span className="choice-copy">
              <span className="choice-label">{selectedOption === key && <span className="sr-only">Elegiste: </span>}{card.options[key].label}</span>
              <span className="choice-direction">
                <span className="choice-instruction">Deslizar a la {key === 'A' ? 'izquierda' : 'derecha'}</span>
                {selectedOption === key && <span>Tu elección</span>}
              </span>
            </span>
            <span className="choice-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d={selectedOption === key ? 'm5 12 4 4L19 6' : key === 'A' ? 'M19 12H5m6-6-6 6 6 6' : 'M5 12h14m-6-6 6 6-6 6'} />
              </svg>
            </span>
          </button>
        ))}
        <div className="hint">
          {resolved ? <>
            <span className="sr-only">Elegiste: «{card.options[selectedOption].label}». </span>
            <button className="consequence-reopen" type="button" onClick={onShowConsequence}>Ver consecuencias</button>
          </> : 'Elegí una respuesta o deslizá la carta.'}
        </div>
      </div>
    </section>
  );
}

export function SituationCopy({ card, stats, vocab }: {
  card: Card; stats: Vec; vocab?: Record<string, string>;
}) {
  const condition = card.condition;
  const active = condition && isConditionActive(card, stats);
  return <>
    <p>{capitalize(adaptText(card.text, vocab))}</p>
    {condition && (
      <div className={`condition ${active ? 'is-active' : ''}`} role="note">
        <strong>Condición visible.</strong> {condition.notice}{' '}
        <span className="condition-state">
          Tu {STATS[card.mode][condition.stat].name} es {stats[condition.stat]}: {active ? 'la condición se aplica.' : 'la condición no se aplica.'}
        </span>
      </div>
    )}
  </>;
}
