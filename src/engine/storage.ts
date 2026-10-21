import { isValidState } from './engine';
import type { GameState } from './types';

const KEY = 'el-costo-del-equilibrio:v1';

export interface Settings {
  motionPreference: 'system' | 'reduced' | 'full';
  musicEnabled: boolean;
}

export interface SaveData {
  playerName: string;
  game?: GameState;
  /** Último intento terminado, para volver a ver el análisis. */
  lastFinished?: GameState;
  settings: Settings;
}

const defaults = (): SaveData => ({ playerName: '', settings: { motionPreference: 'system', musicEnabled: false } });

export function normalizeSettings(settings: Partial<Settings> & { reduceMotion?: boolean } | undefined): Settings {
  const motionPreference = settings?.motionPreference;
  return {
    motionPreference: motionPreference === 'system' || motionPreference === 'reduced' || motionPreference === 'full'
      ? motionPreference
      : settings?.reduceMotion ? 'reduced' : 'system',
    musicEnabled: typeof settings?.musicEnabled === 'boolean' ? settings.musicEnabled : false,
  };
}

/** Guardado local (solo en este navegador y dispositivo). Toda lectura/escritura tolera errores. */
export function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const data = JSON.parse(raw) as SaveData;
    return {
      ...defaults(),
      ...data,
      game: isValidState(data.game) ? data.game : undefined,
      lastFinished: isValidState(data.lastFinished) ? data.lastFinished : undefined,
      settings: normalizeSettings(data.settings),
    };
  } catch {
    return defaults();
  }
}

export function save(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* almacenamiento no disponible: la partida sigue en memoria */
  }
}
