import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// beforeReveal changes the background after the panel exits, while it is still dimmed.
type Dismiss = (afterClose?: () => void, beforeReveal?: () => void) => void;
type Closing = 'all' | 'panel' | 'backdrop' | null;

/** Native modal: keeps focus inside and makes the game behind it inert. */
export function GameDialog({ title, onClose, children, reduceMotion = false, returnFocus }: {
  title: string; onClose: () => void; children: ReactNode | ((dismiss: Dismiss) => ReactNode); reduceMotion?: boolean;
  returnFocus?: () => HTMLElement | null | undefined;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [closing, setClosing] = useState<Closing>(null);
  const exitAction = useRef<(() => void) | null>(null);
  const coveredAction = useRef<(() => void) | null>(null);
  const closeCallback = useRef(onClose);
  const focusCallback = useRef(returnFocus);
  closeCallback.current = onClose;
  focusCallback.current = returnFocus;

  const dismiss: Dismiss = (afterClose, beforeReveal) => {
    if (exitAction.current) return;
    const finish = afterClose ?? (() => closeCallback.current());
    // Keep feedback immediate when either the app or the device requests less motion.
    if (reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      beforeReveal?.();
      finish();
      return;
    }
    exitAction.current = finish;
    coveredAction.current = beforeReveal ?? null;
    setClosing(beforeReveal ? 'panel' : 'all');
  };

  const finishExit = () => {
    const action = exitAction.current;
    exitAction.current = null;
    action?.();
  };

  const finishPanel = () => {
    const action = coveredAction.current;
    if (!action) return;
    coveredAction.current = null;
    setClosing('backdrop');
    action();
  };

  useEffect(() => {
    if (!closing) return;
    // A fallback also covers animation cancellation or a motion preference change.
    const timeout = window.setTimeout(() => {
      if (closing === 'panel') finishPanel();
      else finishExit();
    }, closing === 'panel' ? 180 : 240);
    return () => window.clearTimeout(timeout);
  }, [closing]);

  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      const target = focusCallback.current?.() ?? previous;
      if (target?.isConnected) target.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog ref={ref} className="game-dialog" aria-labelledby={titleId} data-reduce-motion={reduceMotion} data-closing={closing}
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.animationName === 'game-dialog-out') {
          if (closing === 'panel') finishPanel();
          else if (closing === 'all') finishExit();
        } else if (closing === 'backdrop' && event.animationName === 'game-dialog-dim-out') finishExit();
      }}
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      onClick={(event) => { if (event.target === event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dismiss();
      } }}>
      <header className="game-dialog-head">
        <h2 id={titleId}>{title}</h2>
        <button className="game-dialog-close" type="button" aria-label="Cerrar" onClick={() => dismiss()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </header>
      {typeof children === 'function' ? children(dismiss) : children}
    </dialog>, document.body,
  );
}
