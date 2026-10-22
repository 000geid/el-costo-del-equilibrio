import { useEffect, useRef, useState } from 'react';

/** Retain the displayed outcome while the next encounter changes behind the modal. */
export function useConsequenceDialog<T>(outcome: T | null, reduceMotion: boolean) {
  const [snapshot, setSnapshot] = useState<T | null>(outcome);
  const timer = useRef<number>();

  const cancelOpening = () => window.clearTimeout(timer.current);

  useEffect(() => {
    if (outcome === null) return;
    const immediate = reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timer.current = window.setTimeout(() => setSnapshot(outcome), immediate ? 0 : 120);
    return () => window.clearTimeout(timer.current);
  }, [outcome, reduceMotion]);

  return {
    snapshot,
    open: () => { cancelOpening(); setSnapshot(outcome); },
    close: () => { cancelOpening(); setSnapshot(null); },
  };
}
