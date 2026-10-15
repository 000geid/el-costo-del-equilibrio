import { isValidState } from './engine';
import type { GameState } from './types';

const KEY = 'el-costo-del-equilibrio:v1';

export interface Settings {
  reduceMotion: boolean;
}

export interface SaveData {
  playerName: string;
  game?: GameState;
  /** Último intento terminado, para volver a ver el análisis. */
  lastFinished?: GameState;
  settings: Settings;
}

const defaults = (): SaveData => ({ playerName: '', settings: { reduceMotion: false } });

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
      settings: { ...defaults().settings, ...(data.settings ?? {}) },
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
