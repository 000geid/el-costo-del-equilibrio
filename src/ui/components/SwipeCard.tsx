import { useRef, useState, type ReactNode } from 'react';
import type { OptionKey } from '../../engine/types';

interface Props {
  children: ReactNode;
  labels: Record<OptionKey, string>;
  disabled?: boolean;
  reduceMotion?: boolean;
  onChoose: (key: OptionKey) => void;
}

const THRESHOLD = 110;

/**
 * Carta que se puede arrastrar a izquierda (opción A) o derecha (opción B), como en Reigns.
 * El arrastre es opcional: los botones de abajo siempre están disponibles.
 */
export function SwipeCard({ children, labels, disabled, reduceMotion, onChoose }: Props) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; id: number } | null>(null);
  const side: OptionKey | null = dx < -30 ? 'A' : dx > 30 ? 'B' : null;

  const end = (commit: boolean) => {
    if (!start.current) return;
    const accepted = commit && !disabled && side && Math.abs(dx) > THRESHOLD;
    start.current = null;
    setDragging(false);
    if (accepted) {
      // Keep a small directional pose to distinguish accepting from cancelling.
      const gentle = reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setDx(gentle ? 0 : side === 'A' ? -24 : 24);
      onChoose(side);
    } else setDx(0);
  };

  return (
    <div
      className={`swipe ${dragging ? 'is-dragging' : ''} ${disabled ? 'is-disabled' : ''}`}
      style={{
        transform: dx ? `translateX(${dx}px)${reduceMotion ? '' : ` rotate(${dx / 14}deg)`}` : undefined,
        touchAction: 'pan-y',
      }}
      onPointerDown={(e) => {
        if (disabled || e.button !== 0) return;
        start.current = { x: e.clientX, id: e.pointerId };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDragging(true);
      }}
      onPointerMove={(e) => {
        if (!start.current || start.current.id !== e.pointerId) return;
        const nx = Math.max(-180, Math.min(180, e.clientX - start.current.x));
        setDx(nx);
      }}
      onPointerUp={() => end(true)}
      onPointerCancel={() => end(false)}
      onLostPointerCapture={() => end(false)}
    >
      {children}
      {side && !disabled && (
        <div className={`swipe-label swipe-label-${side}`} aria-hidden="true">
          {labels[side]}
        </div>
      )}
    </div>
  );
}
