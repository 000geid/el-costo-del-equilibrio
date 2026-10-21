import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Dismiss = (afterClose?: () => void) => void;

/** Native modal: keeps focus inside and makes the game behind it inert. */
export function GameDialog({ title, onClose, children, reduceMotion = false }: {
  title: string; onClose: () => void; children: ReactNode | ((dismiss: Dismiss) => ReactNode); reduceMotion?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [closing, setClosing] = useState(false);
  const exitAction = useRef<(() => void) | null>(null);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;

  const dismiss: Dismiss = (afterClose) => {
    if (exitAction.current) return;
    const finish = afterClose ?? (() => closeCallback.current());
    // Keep feedback immediate when either the app or the device requests less motion.
    if (reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    exitAction.current = finish;
    setClosing(true);
  };

  const finishExit = () => {
    const action = exitAction.current;
    exitAction.current = null;
    action?.();
  };

  useEffect(() => {
    if (!closing) return;
    // A fallback also covers animation cancellation or a motion preference change.
    const timeout = window.setTimeout(() => {
      const action = exitAction.current;
      exitAction.current = null;
      action?.();
    }, 240);
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
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog ref={ref} className="game-dialog" aria-labelledby={titleId} data-reduce-motion={reduceMotion} data-closing={closing}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && event.animationName === 'game-dialog-out') finishExit();
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
