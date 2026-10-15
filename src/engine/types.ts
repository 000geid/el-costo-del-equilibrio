/** Tipos del motor de juego. Ver secciones 7 y 8 del documento de alcance. */

export type Mode = 'macro' | 'micro';
export type Stage = 'inicio' | 'desarrollo' | 'cierre';
export type OptionKey = 'A' | 'B';

/**
 * Vector de 4 componentes en puntos del índice.
 * Macro: [Actividad, Tesoro, Bienestar, Confianza]
 * Micro: [Caja, Demanda, Equipo, Calidad]
 */
export type Vec = [number, number, number, number];
export type StatIndex = 0 | 1 | 2 | 3;

export type Tag =
  | 'social'
  | 'prudencia'
  | 'inversion'
  | 'estabilidad'
  | 'recaudacion'
  | 'actividad'
  | 'regulacion'
  | 'financiamiento'
  | 'clientes'
  | 'rentabilidad'
  | 'equipo'
  | 'calidad'
  | 'retiro';

export interface Deferred {
  /** Turnos de retraso: elegido en turno t, vence tras la decisión del turno t + delay. */
  delay: number;
  vec: Vec;
}

export interface CardOption {
  label: string;
  immediate: Vec;
  deferred?: Deferred;
  tag: Tag;
}

export type ConditionKind = 'replaceImmediate' | 'replaceDeferred' | 'addImmediate';

/** Condición especial: se evalúa siempre con los indicadores previos a la decisión. */
export interface Condition {
  stat: StatIndex;
  op: '<' | '>=';
  value: number;
  target: OptionKey;
  kind: ConditionKind;
  vec: Vec;
  /** Texto que se muestra en la carta antes de elegir. */
  notice: string;
}

/** Especificación visual del retrato (se dibuja en SVG). */
export interface PortraitSpec {
  sex: 'f' | 'm';
  age: 'young' | 'adult' | 'old';
  skin: 0 | 1 | 2 | 3 | 4;
  hair: 'short' | 'long' | 'bun' | 'bald' | 'curly' | 'braid';
  hairColor: 'black' | 'brown' | 'red' | 'blond' | 'grey' | 'white';
  hat?: 'crown' | 'hood' | 'cap' | 'beret' | 'helmet' | 'scarf' | 'tophat' | 'chef' | 'circlet';
  outfit: string; // color base de la ropa
  trim?: string; // color del ribete
  beard?: 'full' | 'mustache' | 'goatee';
  glasses?: boolean;
  prop?:
    | 'scroll'
    | 'plans'
    | 'coins'
    | 'scale'
    | 'magnifier'
    | 'calendar'
    | 'bag'
    | 'sack'
    | 'wrench'
    | 'flask'
    | 'sign'
    | 'key'
    | 'book'
    | 'banner'
    | 'map'
    | 'chest'
    | 'hourglass'
    | 'tablet'
    | 'basket'
    | 'tools'
    | 'seal';
}

export interface Card {
  id: string;
  mode: Mode;
  stage: Stage;
  character: string;
  imageHint: string;
  portrait: PortraitSpec;
  title: string;
  text: string;
  concept: string;
  studyIds: string[];
  options: Record<OptionKey, CardOption>;
  condition?: Condition;
  explanation: string;
}

export interface Scenario {
  id: string;
  mode: Mode;
  name: string;
  stats: Vec;
  context: string;
  /** Datos visuales para el emblema / cartel. */
  colors: [string, string, string];
  /** Vocabulario para adaptar las cartas micro (§4 "Adaptación de cartas"). */
  vocab?: Record<string, string>;
  emblem: string;
}

export interface PendingEffect {
  id: string;
  cardId: string;
  option: OptionKey;
  optionLabel: string;
  createdTurn: number;
  dueTurn: number;
  vec: Vec;
  tag: Tag;
}

export type DefeatSource = 'decision' | 'commitment';

export interface DefeatCause {
  stat: StatIndex;
  source: DefeatSource;
  /** Carta que originó la caída: la decisión del turno o la carta que creó el compromiso. */
  cardId: string;
  turn: number;
  rawValue: number;
}

export interface HistoryEntry {
  turn: number; // 1..20
  cardId: string;
  choice: OptionKey;
  optionLabel: string;
  tag: Tag;
  conditionActive: boolean;
  before: Vec;
  immediate: Vec;
  /** Efectos pendientes que vencieron en este turno. */
  dueApplied: PendingEffect[];
  /** Compromiso creado por esta decisión (si existe). */
  created?: PendingEffect;
  /** Valor bruto antes del recorte a 100 (para explicar caídas). */
  raw: Vec;
  after: Vec;
  defeat?: DefeatCause[];
}

export type Phase = 'scenario' | 'card' | 'consequence' | 'ended';
export type Status = 'active' | 'won' | 'lost';

export interface GameState {
  rulesVersion: 1;
  id: string;
  playerName: string;
  mode: Mode;
  scenarioId: string;
  seed: number;
  deck: string[];
  /** Decisiones completadas (0..20). La carta actual es deck[turn]. */
  turn: number;
  phase: Phase;
  stats: Vec;
  initial: Vec;
  /** Estado inicial y estado al terminar cada decisión. */
  trajectory: Vec[];
  history: HistoryEntry[];
  pending: PendingEffect[];
  studyVisits: string[];
  status: Status;
  defeat?: DefeatCause[];
  startedAt: number;
  updatedAt: number;
}
