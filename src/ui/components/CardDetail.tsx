import { useEffect, useRef } from 'react';
import { adaptText, capitalize, cardById, studyById } from '../../data';
import type { HistoryEntry, Scenario } from '../../engine/types';
import { Portrait } from './Portrait';
import { VecText } from './Stats';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal parchment" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/**
 * Ficha de una carta. Con `entry` (después de jugar) muestra los efectos exactos;
 * sin ella, solo el planteo (para no anticipar valores antes de elegir).
 */
export function CardDetail({ cardId, scenario, entry, onClose, onConcept }: {
  cardId: string; scenario: Scenario; entry?: HistoryEntry; onClose: () => void; onConcept: (id: string) => void;
}) {
  const c = cardById(cardId);
  return (
    <Modal title={c.title} onClose={onClose}>
      <div className="detail">
        <div className="detail-art">
          <Portrait spec={c.portrait} scene={{ mode: scenario.mode, colors: scenario.colors, emblem: scenario.emblem }} title={c.imageHint} />
          <div className="card-ribbon"><span className="card-character">{c.character}</span></div>
        </div>
        <div className="detail-text">
          <span className="label">{entry ? `Turno ${entry.turn}` : 'Carta'}</span>
          <h2>{c.title}</h2>
          <p>{capitalize(adaptText(c.text, scenario.vocab))}</p>
          {entry && (
            <>
              <p><strong>Elegiste:</strong> «{entry.optionLabel}»{entry.conditionActive ? ' (con la condición de la carta aplicada)' : ''}</p>
              <p><strong>Cambio inmediato:</strong> <VecText mode={c.mode} vec={entry.immediate} /></p>
              {entry.created && <p><strong>Compromiso creado:</strong> tras la carta {entry.created.dueTurn}: <VecText mode={c.mode} vec={entry.created.vec} /></p>}
              {entry.dueApplied.length > 0 && (
                <p><strong>Vencieron en este turno:</strong> {entry.dueApplied.map((d) => <span key={d.id}><VecText mode={c.mode} vec={d.vec} /> </span>)}</p>
              )}
              <p className="explanation">{c.explanation}</p>
            </>
          )}
          <div className="row">
            {c.studyIds.map((id) => (
              <button key={id} className="btn btn-small" onClick={() => onConcept(id)}>Abrir concepto: {studyById(id)?.title}</button>
            ))}
            <button className="btn btn-small btn-primary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
