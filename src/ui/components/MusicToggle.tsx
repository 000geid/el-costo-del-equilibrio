import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

interface MusicSession {
  context: AudioContext;
  timer: number | null;
  playNote: () => void;
}

export interface MusicControlHandle {
  resumeIfEnabled: () => void;
  setEnabled: (enabled: boolean) => void;
}

interface Props {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onErrorChange: (error: string) => void;
}

const MELODY = [293.66, 440, 392, 349.23, 293.66, 392, 440, 523.25, 440, 349.23, 392, 293.66];

export const MusicController = forwardRef<MusicControlHandle, Props>(function MusicController({ enabled, onEnabledChange, onErrorChange: setError }, ref) {
  const session = useRef<MusicSession | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => {
    const current = session.current;
    if (!current) return;
    if (current.timer !== null) window.clearInterval(current.timer);
    void current.context.close();
    session.current = null;
  }, []);

  const startMusic = useCallback(async () => {
    if (!window.AudioContext) {
      setError('Este navegador no admite la música ambiental.');
      onEnabledChange(false);
      return;
    }

    try {
      let current = session.current;
      if (!current) {
        const context = new AudioContext();
        const master = context.createGain();
        master.gain.value = 0.32;
        master.connect(context.destination);

        for (const frequency of [73.42, 110, 146.83]) {
          const oscillator = context.createOscillator();
          const volume = context.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.value = frequency;
          volume.gain.value = 0.08;
          oscillator.connect(volume);
          volume.connect(master);
          oscillator.start();
        }

        let noteIndex = 0;
        const playNote = () => {
          const now = context.currentTime;
          const oscillator = context.createOscillator();
          const volume = context.createGain();
          const filter = context.createBiquadFilter();
          oscillator.type = 'triangle';
          oscillator.frequency.value = MELODY[noteIndex % MELODY.length];
          filter.type = 'lowpass';
          filter.frequency.value = 1200;
          volume.gain.setValueAtTime(0.0001, now);
          volume.gain.exponentialRampToValueAtTime(0.42, now + 0.12);
          volume.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
          oscillator.connect(filter);
          filter.connect(volume);
          volume.connect(master);
          oscillator.start(now);
          oscillator.stop(now + 1.72);
          oscillator.onended = () => {
            oscillator.disconnect();
            filter.disconnect();
            volume.disconnect();
          };
          noteIndex += 1;
        };

        current = { context, timer: null, playNote };
        session.current = current;
      }

      await current.context.resume();
      if (current.timer === null) {
        current.playNote();
        current.timer = window.setInterval(current.playNote, 2200);
      }
      onEnabledChange(true);
      setPlaying(true);
      setError('');
    } catch {
      onEnabledChange(false);
      setPlaying(false);
      setError('No se pudo iniciar la música ambiental. Podés seguir jugando sin música.');
    }
  }, [onEnabledChange, setError]);

  const stopMusic = async () => {
    const current = session.current;
    if (current && current.timer !== null) window.clearInterval(current.timer);
    if (current) {
      current.timer = null;
      try {
        await current.context.suspend();
      } catch {
        setError('No se pudo silenciar la música ambiental.');
      }
    }
    onEnabledChange(false);
    setPlaying(false);
    if (!current) setError('');
  };

  useImperativeHandle(ref, () => ({
    resumeIfEnabled: () => {
      if (enabled && !playing) void startMusic();
    },
    setEnabled: (next: boolean) => {
      if (next) void startMusic();
      else void stopMusic();
    },
  }), [enabled, playing, startMusic]);

  return null;
});
