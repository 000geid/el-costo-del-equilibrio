import { useRef, useState, type ReactNode } from 'react';
import type { OptionKey } from '../../engine/types';

interface Props {
  children: ReactNode;
  labels: Record<OptionKey, string>;
  disabled?: boolean;
  reduceMotion?: boolean;
  onHover: (key: OptionKey | null) => void;
  onChoose: (key: OptionKey) => void;
}

const THRESHOLD = 110;

/**
 * Carta que se puede arrastrar a izquierda (opción A) o derecha (opción B), como en Reigns.
 * El arrastre es opcional: los botones de abajo siempre están disponibles.
 */
export function SwipeCard({ children, labels, disabled, reduceMotion, onHover, onChoose }: Props) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; id: number } | null>(null);
  const side: OptionKey | null = dx < -30 ? 'A' : dx > 30 ? 'B' : null;

  const end = (commit: boolean) => {
    if (commit && side && Math.abs(dx) > THRESHOLD) onChoose(side);
    start.current = null;
    setDragging(false);
    setDx(0);
    onHover(null);
  };

  return (
    <div
      className={`swipe ${dragging ? 'is-dragging' : ''} ${disabled ? 'is-disabled' : ''}`}
      style={{
        transform: reduceMotion ? undefined : `translateX(${dx}px) rotate(${dx / 14}deg)`,
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
        onHover(nx < -30 ? 'A' : nx > 30 ? 'B' : null);
      }}
      onPointerUp={() => end(true)}
      onPointerCancel={() => end(false)}
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
