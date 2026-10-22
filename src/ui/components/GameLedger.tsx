import { useId, useMemo, useRef, useState } from 'react';
import { TOTAL_TURNS } from '../../engine/engine';
import type { GameState, PendingEffect } from '../../engine/types';
import { VecText } from './Stats';

const effectLabels = { pos: 'Beneficios', neg: 'Costos', mixed: 'Efectos mixtos', neutral: 'Sin variación' };

// Preserve costs and benefits across indicators and commitments; they do not cancel each other.
export function commitmentKind(pending: PendingEffect[]): keyof typeof effectLabels {
  const positive = pending.some((p) => p.vec.some((value) => value > 0));
  const negative = pending.some((p) => p.vec.some((value) => value < 0));
  return positive && negative ? 'mixed' : positive ? 'pos' : negative ? 'neg' : 'neutral';
}

export function GameLedger({ game, reduceMotion }: { game: GameState; reduceMotion: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const currentTurn = game.phase === 'card' ? game.turn + 1 : undefined;
  const groups = useMemo(() => {
    const byTurn = new Map<number, PendingEffect[]>();
    for (const p of [...game.pending].sort((a, b) => a.dueTurn - b.dueTurn)) {
      const turn = Math.min(p.dueTurn, TOTAL_TURNS + 1);
      const group = byTurn.get(turn) ?? [];
      group.push(p);
      byTurn.set(turn, group);
    }
    return byTurn;
  }, [game.pending]);
  const nextDue = groups.keys().next().value;
  const dueNow = currentTurn === undefined ? 0 : groups.get(currentTurn)?.length ?? 0;
  const summary = dueNow > 0
    ? `${dueNow === 1 ? '1 se aplica' : `${dueNow} se aplican`} al resolver esta carta`
    : nextDue === undefined ? 'Sin compromisos pendientes'
    : nextDue > TOTAL_TURNS ? 'Los pendientes se aplican después del cierre'
    : `Próximo vencimiento: tras la carta ${nextDue}`;
  const groupId = (turn: number) => `${id}-due-${turn}`;
  const close = () => {
    setOpen(false);
    // Closing a long list keeps the game and its summary in view.
    toggleRef.current?.focus({ preventScroll: true });
    toggleRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  };
  const goToGroup = (turn: number) => {
    const heading = document.getElementById(groupId(turn));
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'instant' : 'smooth' });
  };

  return (
    <>
      <div className="ledger-bar">
        <button ref={toggleRef} className="ledger-toggle" type="button" aria-expanded={open}
          aria-controls={`${id}-detail`} onClick={() => open ? close() : setOpen(true)}>
          <span className="ledger-toggle-copy">
            <span className="ledger-toggle-title">Calendario y compromisos
              {game.pending.length > 0 && <span className="ledger-count"> · {game.pending.length} pendiente{game.pending.length === 1 ? '' : 's'}</span>}
            </span>
            <span className={`ledger-summary${dueNow ? ' is-due' : ''}`}>{summary}</span>
          </span>
          <span className="ledger-toggle-action">
            <span>{open ? 'Ocultar detalle' : 'Ver detalle'}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </span>
        </button>
      </div>
      <aside className="game-ledger" id={`${id}-detail`} hidden={!open} aria-label="Detalle del calendario y compromisos">
        <div className="timeline">
          <h2 className="ledger-title">Calendario</h2>
          <ol className="pips">
            {Array.from({ length: TOTAL_TURNS }, (_, i) => {
              const turn = i + 1;
              const pending = groups.get(turn);
              const kind = commitmentKind(pending ?? []);
              const label = `Carta ${turn}${pending ? ` · ${pending.length} compromiso${pending.length === 1 ? '' : 's'} · ${effectLabels[kind]}` : ''}`;
              return (
                <li key={turn} className={`pip${turn <= game.turn ? ' done' : ''}${turn === currentTurn ? ' current' : ''}`}>
                  {pending ? (
                    <button type="button" title={label} aria-label={label} aria-current={turn === currentTurn ? 'step' : undefined}
                      onClick={() => goToGroup(turn)}>
                      {turn}<span className={`pip-due ${kind}`} aria-hidden="true" />
                    </button>
                  ) : <span title={label} aria-current={turn === currentTurn ? 'step' : undefined}>{turn}</span>}
                </li>
              );
            })}
          </ol>
          <p className="calendar-hint">{[...groups.keys()].some((turn) => turn <= TOTAL_TURNS)
            ? 'Elegí una fecha marcada para ver sus compromisos.'
            : 'No hay vencimientos pendientes en estas 20 cartas.'}</p>
          <ul className="calendar-key" aria-label="Referencias del calendario">
            {(['pos', 'neg', 'mixed'] as const).map((kind) => (
              <li key={kind}><span className={`pip-due ${kind}`} aria-hidden="true" />{effectLabels[kind]}</li>
            ))}
          </ul>
          {groups.has(TOTAL_TURNS + 1) && <button className="ledger-after-close" type="button" onClick={() => goToGroup(TOTAL_TURNS + 1)}>Ver compromisos después del cierre</button>}
        </div>
        <div className="commitments">
          <h2 className="ledger-title">Compromisos pendientes</h2>
          {groups.size === 0 ? <p className="small muted">No hay pagos ni beneficios comprometidos.</p> : (
            [...groups].map(([turn, pending]) => (
              <section className="commit-group" key={turn} aria-labelledby={groupId(turn)}>
                <h3 className={`commit-group-title${turn === currentTurn ? ' is-due' : ''}`} id={groupId(turn)} tabIndex={-1}>
                  {turn > TOTAL_TURNS ? 'Después del cierre' : turn === currentTurn ? 'Al resolver esta carta' : `Tras la carta ${turn}`}
                  <span className="commit-group-count"><span className="sr-only"> · </span>{pending.length}<span className="sr-only"> compromiso{pending.length === 1 ? '' : 's'}</span></span>
                </h3>
                <ul>
                  {pending.map((p) => (
                    <li key={p.id}>
                      <div className="commit-head"><strong>«{p.optionLabel}»</strong>
                        {turn > TOTAL_TURNS && <span className="commit-due">tras la carta {p.dueTurn}</span>}
                      </div>
                      <VecText mode={game.mode} vec={p.vec} />
                      {p.tag === 'financiamiento' && <div className="small muted">Devolución de financiamiento (no es un ingreso).</div>}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
        <button className="ledger-close" type="button" onClick={close}>Ocultar detalle y volver a la carta</button>
      </aside>
    </>
  );
}
