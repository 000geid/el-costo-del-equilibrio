import { useState } from 'react';
import { STATS } from '../../data';
import type { Mode, Vec } from '../../engine/types';
import { GameDialog } from './GameDialog';
import { StatGlyph, StatMedallion } from './Icons';

interface Props {
  mode: Mode;
  stats: Vec;
  /** Sentido de los efectos inmediatos de la opción enfocada (solo dirección, sin valores). */
  preview?: Vec | null;
  /** Variación de la última decisión (se muestra con cifras después de elegir). */
  delta?: Vec | null;
  iconLabels?: boolean;
  reduceMotion?: boolean;
}

export function StatsBar({ mode, stats, preview, delta, iconLabels = false, reduceMotion = false }: Props) {
  const [info, setInfo] = useState<number | null>(null);
  const selected = info === null ? null : STATS[mode][info];
  return (
    <>
    <ul className={`stats ${iconLabels ? 'stats-symbols' : ''}`} aria-label="Indicadores">
      {STATS[mode].map((meta, i) => {
        const value = stats[i];
        const alert = value > 0 && value <= 20;
        const p = preview?.[i] ?? 0;
        const d = delta?.[i] ?? 0;
        return (
          <li key={meta.key} className={`stat ${alert ? 'is-alert' : ''}`}>
            {iconLabels ? (
              <button className="stat-info" type="button" aria-label={`Información sobre ${meta.name}: ${value} de 100`} aria-haspopup="dialog" onClick={() => setInfo(i)}>
                <svg className="stat-symbol" viewBox="0 0 60 60" fill="currentColor" aria-hidden="true"><StatGlyph icon={meta.icon} /></svg>
                <svg className="stat-info-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><circle cx="12" cy="7.5" r="0.8" fill="currentColor" stroke="none" />
                </svg>
              </button>
            ) : <div className="stat-icon">
              <StatMedallion meta={meta} value={value} id={`${mode}-${meta.key}`} />
              {p !== 0 && (
                <span className={`stat-preview ${p > 0 ? 'up' : 'down'}`} aria-hidden="true">
                  {p > 0 ? '▲' : '▼'}
                </span>
              )}
            </div>}
            <div className="stat-text">
              <span className={iconLabels ? 'sr-only' : 'stat-name'}>{meta.name}</span>
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
    {selected && info !== null && (
      <GameDialog title={selected.name} onClose={() => setInfo(null)} reduceMotion={reduceMotion}>
        {(dismiss) => <div className="stat-help">
          <div className="stat-help-value">
            <svg viewBox="0 0 60 60" fill="currentColor" aria-hidden="true"><StatGlyph icon={selected.icon} /></svg>
            <strong>{stats[info]} <span>de 100</span></strong>
          </div>
          <p>{selected.meaning}</p>
          <p>Un valor de 20 o menos indica un nivel crítico. Si llega a cero, la gestión termina.</p>
          <p className="stat-help-defeat">{selected.defeat}</p>
          <button className="btn btn-primary" type="button" onClick={() => dismiss()}>Entendido</button>
        </div>}
      </GameDialog>
    )}
    </>
  );
}

/** Cambios con los mismos símbolos de la barra de indicadores. */
export function VecText({ mode, vec, empty = 'Sin cambios' }: { mode: Mode; vec: Vec; empty?: string }) {
  const parts = vec
    .map((x, i) => ({ x, meta: STATS[mode][i] }))
    .filter((p) => p.x !== 0);
  if (parts.length === 0) return <span className="vec-text muted">{empty}</span>;
  return (
    <span className="vec-text vec-icons">
      {parts.map((p) => (
        <span key={p.meta.key} className={`vec-change ${p.x > 0 ? 'up' : 'down'}`} title={p.meta.name}>
          <svg className="vec-stat-icon" viewBox="0 0 60 60" fill="currentColor" aria-hidden="true">
            <StatGlyph icon={p.meta.icon} />
          </svg>
          <span className="sr-only">{p.meta.name} </span>
          <span>{p.x > 0 ? `+${p.x}` : `−${Math.abs(p.x)}`}</span>
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
