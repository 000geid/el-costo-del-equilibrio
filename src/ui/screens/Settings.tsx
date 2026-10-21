import { useState, type FormEvent } from 'react';
import type { Settings } from '../../engine/storage';

const MOTION_OPTIONS: { value: Settings['motionPreference']; label: string }[] = [
  { value: 'system', label: 'Como el dispositivo' },
  { value: 'reduced', label: 'Reducido' },
  { value: 'full', label: 'Completo' },
];

export function SettingsScreen({ name, settings, musicError, onNameChange, onSettingsChange, onBack }: {
  name: string;
  settings: Settings;
  musicError: string;
  onNameChange: (name: string) => void;
  onSettingsChange: (settings: Partial<Settings>) => void;
  onBack: () => void;
}) {
  const [draftName, setDraftName] = useState(name);
  const trimmed = draftName.trim().slice(0, 40);
  const submitName = (event: FormEvent) => {
    event.preventDefault();
    if (trimmed) onNameChange(trimmed);
  };

  return (
    <section className="settings-page scene-backdrop">
      <button className="world-back" type="button" onClick={onBack}>‹ Volver</button>
      <header className="page-head">
        <h1>Ajustes</h1>
        <p>Las preferencias se guardan en este dispositivo.</p>
      </header>
      <div className="settings-content">
        <form className="settings-row settings-name" onSubmit={submitName}>
          <label htmlFor="settings-player-name">Nombre de jugador</label>
          <div className="settings-name-edit">
            <input
              id="settings-player-name"
              type="text"
              autoComplete="nickname"
              maxLength={40}
              required
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
            />
            <button className="btn btn-small" type="submit" disabled={!trimmed}>Guardar nombre</button>
          </div>
        </form>
        <div className="settings-row">
          <div>
            <label htmlFor="settings-music">Música ambiental</label>
            <p className="settings-help">Activá o silenciá la música ambiental.</p>
            {musicError && <p className="settings-help" role="status">{musicError}</p>}
          </div>
          <input
            id="settings-music"
            type="checkbox"
            checked={settings.musicEnabled}
            onChange={(event) => onSettingsChange({ musicEnabled: event.target.checked })}
          />
        </div>
        <div className="settings-row">
          <div>
            <label htmlFor="settings-motion">Movimiento</label>
            <p className="settings-help">Los cambios se aplican a las cartas y transiciones.</p>
          </div>
          <select
            id="settings-motion"
            value={settings.motionPreference}
            onChange={(event) => onSettingsChange({ motionPreference: event.target.value as Settings['motionPreference'] })}
          >
            {MOTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="settings-actions">
          <button className="btn btn-primary" type="button" onClick={onBack}>Listo</button>
        </div>
      </div>
    </section>
  );
}
