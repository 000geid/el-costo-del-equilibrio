import { STATS } from '../../data';
import type { Mode, Vec } from '../../engine/types';
import { StatMedallion } from './Icons';

interface Props {
  mode: Mode;
  stats: Vec;
  /** Sentido de los efectos inmediatos de la opción enfocada (solo dirección, sin valores). */
  preview?: Vec | null;
  /** Variación de la última decisión (se muestra con cifras después de elegir). */
  delta?: Vec | null;
}

export function StatsBar({ mode, stats, preview, delta }: Props) {
  return (
    <ul className="stats" aria-label="Indicadores">
      {STATS[mode].map((meta, i) => {
        const value = stats[i];
        const alert = value > 0 && value <= 20;
        const p = preview?.[i] ?? 0;
        const d = delta?.[i] ?? 0;
        return (
          <li key={meta.key} className={`stat ${alert ? 'is-alert' : ''}`}>
            <div className="stat-icon">
              <StatMedallion meta={meta} value={value} id={`${mode}-${meta.key}`} />
              {p !== 0 && (
                <span className={`stat-preview ${p > 0 ? 'up' : 'down'}`} aria-hidden="true">
                  {p > 0 ? '▲' : '▼'}
                </span>
              )}
            </div>
            <div className="stat-text">
              <span className="stat-name">{meta.name}</span>
              <span className="stat-value">
                {value}
                {d !== 0 && (
                  <span className={`stat-delta ${d > 0 ? 'up' : 'down'}`}>
                    {d > 0 ? ` ▲+${d}` : ` ▼${d}`}
                  </span>
                )}
              </span>
            </div>
            <div className="stat-track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={`${meta.name}: ${value} de 100`}>
              <div className="stat-track-fill" style={{ width: `${value}%`, background: meta.color }} />
              <div className="stat-track-alert" />
            </div>
            {p !== 0 && (
              <span className="sr-only">{`${meta.name} ${p > 0 ? 'sube' : 'baja'}`}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Lista legible de cambios: «Actividad +4 · Tesoro −3». */
export function VecText({ mode, vec, empty = 'Sin cambios' }: { mode: Mode; vec: Vec; empty?: string }) {
  const parts = vec
    .map((x, i) => ({ x, name: STATS[mode][i].name }))
    .filter((p) => p.x !== 0);
  if (parts.length === 0) return <span className="vec-text muted">{empty}</span>;
  return (
    <span className="vec-text">
      {parts.map((p, i) => (
        <span key={p.name} className={p.x > 0 ? 'up' : 'down'}>
          {i > 0 && <span className="sep"> · </span>}
          {p.name} {p.x > 0 ? `▲ +${p.x}` : `▼ −${Math.abs(p.x)}`}
        </span>
      ))}
    </span>
  );
}

/** Solo sentido (para previsualizar antes de elegir). */
export function SignText({ mode, vec }: { mode: Mode; vec: Vec }) {
  const parts = vec
    .map((x, i) => ({ x: Math.sign(x), name: STATS[mode][i].name }))
    .filter((p) => p.x !== 0);
  if (parts.length === 0) return <span className="vec-text muted">sin cambios</span>;
  return (
    <span className="vec-text">
      {parts.map((p, i) => (
        <span key={p.name} className={p.x > 0 ? 'up' : 'down'}>
          {i > 0 && <span className="sep"> · </span>}
          {p.name} {p.x > 0 ? '▲' : '▼'}
        </span>
      ))}
    </span>
  );
}
