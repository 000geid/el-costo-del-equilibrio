import { useEffect, useRef, useState } from 'react';

interface MusicSession {
  context: AudioContext;
  timer: number | null;
  playNote: () => void;
}

const MELODY = [293.66, 440, 392, 349.23, 293.66, 392, 440, 523.25, 440, 349.23, 392, 293.66];

export function MusicToggle() {
  const session = useRef<MusicSession | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => {
    const current = session.current;
    if (!current) return;
    if (current.timer !== null) window.clearInterval(current.timer);
    void current.context.close();
    session.current = null;
  }, []);

  const startMusic = async () => {
    if (!window.AudioContext) {
      setError('Este navegador no admite la música ambiental.');
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
      setError('');
      setEnabled(true);
    } catch {
      setError('No se pudo iniciar la música ambiental en este navegador.');
    }
  };

  const stopMusic = async () => {
    const current = session.current;
    if (!current) return;
    if (current.timer !== null) window.clearInterval(current.timer);
    current.timer = null;
    try {
      await current.context.suspend();
      setEnabled(false);
      setError('');
    } catch {
      setError('No se pudo silenciar la música ambiental.');
    }
  };

  return (
    <div className="music-control">
      <button
        className="music-toggle"
        type="button"
        aria-pressed={enabled}
        onClick={() => { if (enabled) void stopMusic(); else void startMusic(); }}
      >
        <span aria-hidden="true">♫</span>
        <span>Música {enabled ? 'activada' : 'silenciada'}</span>
      </button>
      {error && <span className="music-error" role="status">{error}</span>}
    </div>
  );
}
