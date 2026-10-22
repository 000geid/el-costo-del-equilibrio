import type { ReactNode } from 'react';
import { STATS } from '../../data';
import type { Mode, Vec } from '../../engine/types';
import { StatGlyph } from './Icons';
import { VecText } from './Stats';

interface Props {
  mode: Mode;
  optionLabel: string;
  before: Vec;
  after: Vec;
  immediate: Vec;
  children?: ReactNode;
  review: ReactNode;
  notice?: ReactNode;
  actions: ReactNode;
}

/** Shared feedback; each caller supplies its commitments and next actions. */
export function DecisionConsequence({ mode, optionLabel, before, after, immediate, children, review, notice, actions }: Props) {
  return (
    <div className="consequence">
      <div className="consequence-head">
        <span className="label">Elegiste</span>
        <strong>«{optionLabel}»</strong>
      </div>
      <ul className="consequence-stats" aria-label="Cambios en los indicadores">
        {STATS[mode].map((meta, i) => {
          const change = after[i] - before[i];
          return (
            <li key={meta.key}>
              <span className="consequence-stat-name"><svg viewBox="0 0 60 60" fill="currentColor" aria-hidden="true"><StatGlyph icon={meta.icon} /></svg>{meta.name}</span>
              <span className="consequence-stat-values"><span>{before[i]}</span><span aria-label="a">→</span><strong>{after[i]}</strong></span>
              <span className={`consequence-stat-delta ${change > 0 ? 'up' : change < 0 ? 'down' : 'muted'}`}>{change > 0 ? `+${change}` : change < 0 ? `−${Math.abs(change)}` : 'Sin cambios'}</span>
            </li>
          );
        })}
      </ul>
      <dl className="consequence-list">
        <dt>Efecto inmediato</dt>
        <dd><VecText mode={mode} vec={immediate} /></dd>
        {children}
      </dl>
      <details className="situation-review">
        <summary>Explicación y situación</summary>
        {review}
      </details>
      {notice}
      <div className="row">{actions}</div>
    </div>
  );
}
