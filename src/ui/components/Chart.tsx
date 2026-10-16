import { cardById, STATS } from '../../data';
import type { GameState } from '../../engine/types';

const W = 640, H = 280, PAD = { l: 36, r: 14, t: 14, b: 30 };
const MARKERS = ['circle', 'square', 'triangle', 'diamond'] as const;

function Marker({ kind, x, y, color }: { kind: (typeof MARKERS)[number]; x: number; y: number; color: string }) {
  const s = 4.2;
  switch (kind) {
    case 'circle': return <circle cx={x} cy={y} r={s} fill={color} stroke="#2b1d12" strokeWidth="1" />;
    case 'square': return <rect x={x - s} y={y - s} width={s * 2} height={s * 2} fill={color} stroke="#2b1d12" strokeWidth="1" />;
    case 'triangle': return <path d={`M${x} ${y - s - 1} L${x + s + 1} ${y + s} L${x - s - 1} ${y + s} Z`} fill={color} stroke="#2b1d12" strokeWidth="1" />;
    case 'diamond': return <path d={`M${x} ${y - s - 1} L${x + s + 1} ${y} L${x} ${y + s + 1} L${x - s - 1} ${y} Z`} fill={color} stroke="#2b1d12" strokeWidth="1" />;
  }
}

/** Trayectoria de los cuatro indicadores. Cada columna de turno es seleccionable y abre su carta. */
export function TrajectoryChart({ game, onTurn }: { game: GameState; onTurn: (turn: number) => void }) {
  const n = Math.max(1, game.trajectory.length - 1);
  const x = (i: number) => PAD.l + (i / Math.max(n, 20)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / 100) * (H - PAD.t - PAD.b);
  const meta = STATS[game.mode];
  const colW = (W - PAD.l - PAD.r) / Math.max(n, 20);

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfico de la trayectoria de los indicadores por turno">
        <rect x={PAD.l} y={y(20)} width={W - PAD.l - PAD.r} height={y(0) - y(20)} fill="#b4483c" opacity="0.12" />
        <text x={W - PAD.r - 4} y={y(20) + 12} textAnchor="end" className="chart-axis" fill="#8c2f2f">zona de alerta (1–20)</text>
        {[0, 20, 40, 60, 80, 100].map((v) => (
          <g key={v}>
            <path d={`M${PAD.l} ${y(v)} H${W - PAD.r}`} stroke="#8a6a4a" strokeOpacity={v === 0 ? 0.8 : 0.25} />
            <text x={PAD.l - 6} y={y(v) + 4} textAnchor="end" className="chart-axis">{v}</text>
          </g>
        ))}
        {Array.from({ length: Math.max(n, 20) + 1 }, (_, i) => (
          <text key={i} x={x(i)} y={H - 10} textAnchor="middle" className="chart-axis">{i === 0 ? 'Inicio' : i % 2 === 0 || i === 1 ? i : ''}</text>
        ))}
        {meta.map((m, si) => {
          const pts = game.trajectory.map((v, i) => `${x(i)},${y(v[si])}`).join(' ');
          return (
            <g key={m.key}>
              <polyline points={pts} fill="none" stroke={m.color} strokeWidth="2.6" strokeLinejoin="round" />
              {game.trajectory.map((v, i) => <Marker key={i} kind={MARKERS[si]} x={x(i)} y={y(v[si])} color={m.color} />)}
            </g>
          );
        })}
        {game.history.map((h) => (
          <rect
            key={h.turn}
            className="chart-hit"
            x={x(h.turn) - colW / 2}
            y={PAD.t}
            width={colW}
            height={H - PAD.t - PAD.b}
            tabIndex={0}
            role="button"
            aria-label={`Turno ${h.turn}: ver carta «${cardById(h.cardId).title}»`}
            onClick={() => onTurn(h.turn)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTurn(h.turn); } }}
          >
            <title>{`Turno ${h.turn} · «${h.optionLabel}»`}</title>
          </rect>
        ))}
      </svg>
      <figcaption className="legend">
        {meta.map((m, si) => (
          <span key={m.key} className="legend-item">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><Marker kind={MARKERS[si]} x={8} y={8} color={m.color} /></svg>
            {m.name}
          </span>
        ))}
        <span className="legend-item muted">Seleccioná un turno para ver su carta.</span>
      </figcaption>
    </figure>
  );
}

/** Tabla con los mismos datos del gráfico. */
export function TrajectoryTable({ game }: { game: GameState }) {
  const meta = STATS[game.mode];
  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="sr-only">Valores de cada indicador al inicio y al terminar cada decisión</caption>
        <thead>
          <tr><th scope="col">Turno</th><th scope="col">Carta</th>{meta.map((m) => <th key={m.key} scope="col">{m.name}</th>)}</tr>
        </thead>
        <tbody>
          {game.trajectory.map((v, i) => (
            <tr key={i}>
              <th scope="row">{i === 0 ? 'Inicio' : i}</th>
              <td>{i === 0 ? '—' : cardById(game.history[i - 1].cardId).title}</td>
              {v.map((x, j) => <td key={j} className={x <= 20 ? 'is-alert' : ''}>{x}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
