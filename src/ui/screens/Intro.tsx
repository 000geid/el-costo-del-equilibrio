import { useState } from 'react';
import { MODE_LABEL, STATS } from '../../data';
import type { GameState, Mode, Scenario } from '../../engine/types';
import { Emblem, ScaleLogo } from '../components/Icons';

export function HomeScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="title-screen scene-backdrop" aria-labelledby="game-title">
      <div className="title-copy">
        <ScaleLogo className="title-logo" />
        <h1 id="game-title" className="game-title">El costo del equilibrio</h1>
        <p className="motto">Cada decisión tiene un precio.</p>
        <button className="btn btn-primary title-enter" type="button" onClick={onEnter} autoFocus>
          Entrar
        </button>
      </div>
      <p className="title-credit">Una decisión puede sostenerlo todo. O cambiarlo para siempre.</p>
    </section>
  );
}

interface MenuProps {
  name: string;
  active?: GameState;
  activeScenario?: Scenario;
  hasLast: boolean;
  onNewGame: () => void;
  onResume: () => void;
  onLearn: () => void;
  onSettings: () => void;
  onLast: () => void;
}

function MenuIcon({ kind }: { kind: 'arrow' | 'new' | 'learn' | 'archive' | 'settings' | 'check' }) {
  return (
    <svg className="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 'arrow' && <path d="M4 12h15m-6-6 6 6-6 6" />}
      {kind === 'new' && <><path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 14h8m-4-4v8" /></>}
      {kind === 'learn' && <><path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2V4Z" /><path d="m6 8 3 1m6 0 3-1M6 12l3 1m6 0 3-1" /></>}
      {kind === 'archive' && <><path d="M4 3h16v5H4zM5 8v13h14V8M9 12h6M9 16h4" /></>}
      {kind === 'settings' && <><path d="M4 7h7m4 0h5M4 17h3m4 0h9" /><circle cx="13" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>}
      {kind === 'check' && <><path d="m8 12 3 3 5-6" /><circle cx="12" cy="12" r="9" /></>}
    </svg>
  );
}

function NewGameCards() {
  return (
    <svg className="menu-deck-art" viewBox="0 0 160 112" fill="none" aria-hidden="true">
      <g transform="rotate(-18 80 90)">
        <rect x="33" y="20" width="54" height="76" rx="4" fill="var(--parch-1)" stroke="var(--bronze-lo)" />
        <rect x="39" y="26" width="42" height="64" rx="2" stroke="var(--parch-edge)" />
      </g>
      <g transform="rotate(18 80 90)">
        <rect x="73" y="20" width="54" height="76" rx="4" fill="var(--parch-1)" stroke="var(--bronze-lo)" />
        <rect x="79" y="26" width="42" height="64" rx="2" stroke="var(--parch-edge)" />
      </g>
      <rect x="52" y="10" width="56" height="82" rx="4" fill="var(--ribbon)" />
      <rect x="58" y="16" width="44" height="70" rx="2" stroke="var(--bronze)" />
      <g stroke="var(--parch-0)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M80 68V51m0 0L68 39m12 12 12-12M68 47v-8h8m8 0h8v8" />
        <circle cx="80" cy="71" r="3" />
      </g>
      <path d="m80 23 3 3-3 3-3-3 3-3Z" fill="var(--bronze)" />
    </svg>
  );
}

export function MenuScreen(p: MenuProps) {
  const active = p.active;
  const scenario = p.activeScenario;
  const canResume = !!active && !!scenario;
  const completed = active ? Math.min(20, Math.max(0, active.turn)) : 0;
  const currentCard = active ? Math.min(active.turn + (active.phase === 'card' ? 1 : 0), 20) : 1;

  return (
    <section className="home-menu scene-backdrop" aria-labelledby="menu-title">
      <header className="menu-wordmark">
        <ScaleLogo className="menu-logo" />
        <div>
          <h1 id="menu-title" className="game-title">El costo del<br />equilibrio</h1>
          <p className="menu-motto">Cada decisión tiene un precio.</p>
        </div>
      </header>

      <div className="menu-welcome">
        <p className="greeting">{p.name ? <>Hola, <strong>{p.name}</strong>.</> : 'Bienvenido a tu próxima decisión.'}</p>
        {canResume && <span>Tu gestión te espera.</span>}
      </div>

      <div className="menu-body">
        {canResume ? (
          <article className="menu-dossier" aria-labelledby="saved-game-title">
            <div className="menu-dossier-head">
              <div>
                <h2 id="saved-game-title">{scenario.name}</h2>
                <p>{MODE_LABEL[active.mode]}</p>
              </div>
              <Emblem colors={scenario.colors} emblem={scenario.emblem} mode={active.mode} size={64} />
            </div>

            <div className="menu-progress">
              <div className="menu-progress-copy"><span>Carta {currentCard} de 20</span><span>{completed} decisiones tomadas</span></div>
              <div className="menu-progress-track" role="progressbar" aria-label="Decisiones tomadas" aria-valuemin={0} aria-valuemax={20} aria-valuenow={completed}>
                {Array.from({ length: 20 }, (_, i) => <span key={i} className={i < completed ? 'is-complete' : ''} />)}
              </div>
            </div>

            <dl className="menu-indicators">
              {STATS[active.mode].map((stat, i) => (
                <div key={stat.key}>
                  <dt>{stat.name}</dt>
                  <dd>{active.stats[i]}<span className="sr-only"> de 100</span></dd>
                  <span className="menu-indicator-track" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, active.stats[i]))}%`, background: stat.color }} /></span>
                </div>
              ))}
            </dl>

            <button className="menu-primary-action" type="button" onClick={p.onResume}>Continuar partida<MenuIcon kind="arrow" /></button>
            <p className="menu-save-note"><MenuIcon kind="check" />Tu partida está guardada.</p>
          </article>
        ) : (
          <div className="menu-dossier menu-first-game">
            <NewGameCards />
            <h2>Veinte decisiones.<br />Un equilibrio propio.</h2>
            <p>Tomá las riendas de un país o de un pequeño negocio.</p>
            <button className="menu-primary-action" type="button" onClick={p.onNewGame}>Nueva partida<MenuIcon kind="arrow" /></button>
          </div>
        )}

        <nav className="menu-commands" aria-label="Menú principal">
          {canResume && <button className="menu-command" type="button" onClick={p.onNewGame}>
            <MenuIcon kind="new" /><span className="menu-command-copy"><span className="menu-command-title">Nueva partida</span><span className="menu-command-detail">Otro escenario, nuevas decisiones.</span></span><MenuIcon kind="arrow" />
          </button>}
          <button className="menu-command" type="button" onClick={p.onLearn}>
            <MenuIcon kind="learn" /><span className="menu-command-copy"><span className="menu-command-title">Aprender</span><span className="menu-command-detail">Explorá conceptos y practicá sin riesgo.</span></span><MenuIcon kind="arrow" />
          </button>
          {p.hasLast && <button className="menu-command" type="button" onClick={p.onLast}>
            <MenuIcon kind="archive" /><span className="menu-command-copy"><span className="menu-command-title">Registro de gestión</span><span className="menu-command-detail">Revisá las decisiones de tu última partida.</span></span><MenuIcon kind="arrow" />
          </button>}
          <button className="menu-command" type="button" onClick={p.onSettings}>
            <MenuIcon kind="settings" /><span className="menu-command-copy"><span className="menu-command-title">Ajustes</span><span className="menu-command-detail">Tu nombre, la música y el movimiento.</span></span><MenuIcon kind="arrow" />
          </button>
        </nav>
      </div>

      <footer className="menu-footer"><span aria-hidden="true" />La responsabilidad es tuya.<span aria-hidden="true" /></footer>
    </section>
  );
}

export function ModeSelectScreen({ initialName, initialMode, onContinue, onBack }: {
  initialName: string;
  initialMode: Mode;
  onContinue: (mode: Mode, name: string) => void;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState(initialName);
  const trimmed = name.trim().slice(0, 40);

  return (
    <section className={`mode-select scene-backdrop mode-select-${mode}`}>
      <div className="world-nav">
        <button className="world-back" type="button" onClick={onBack} aria-label="Volver al menú">Volver al menú</button>
        <ScaleLogo className="world-mark" />
      </div>

      <div className="mode-select-content">
        <h1>Elegí tu responsabilidad</h1>
        <p className="mode-select-intro">Dos escenarios. Cuatro equilibrios que sostener.</p>

        <div className="mode-choices" role="group" aria-label="Elegí un modo de juego">
          {(['macro', 'micro'] as Mode[]).map((candidate) => (
            <button
              key={candidate}
              type="button"
              className={`mode-choice ${mode === candidate ? 'is-selected' : ''}`}
              aria-pressed={mode === candidate}
              onClick={() => setMode(candidate)}
            >
              <span className="mode-choice-copy">
                <span className="mode-choice-title">{MODE_LABEL[candidate]}</span>
                <span className="mode-choice-description">
                  {candidate === 'macro'
                    ? 'Tomá decisiones desde el consejo de un país.'
                    : 'Sostené el trabajo de un pequeño negocio.'}
                </span>
                <span className="mode-choice-stats">{STATS[candidate].map((stat) => stat.name).join(' · ')}</span>
              </span>
            </button>
          ))}
        </div>

        <form
          className="setup-identity"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmed) onContinue(mode, trimmed);
          }}
        >
          <label htmlFor="player-name">¿Cómo te llamamos?</label>
          <input
            id="player-name"
            type="text"
            autoComplete="nickname"
            maxLength={40}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={!trimmed}>Ver el escenario</button>
        </form>
      </div>
      <footer className="mode-select-foot">La responsabilidad es tuya. Las consecuencias, de cada decisión.</footer>
    </section>
  );
}

export function ScenarioScreen({ game, scenario, onStart, onBack }: {
  game: GameState; scenario: Scenario; onStart: () => void; onBack: () => void;
}) {
  return (
    <section className={`scenario scene-backdrop mode-select-${game.mode}`}>
      <div className="world-nav">
        <button className="world-back" type="button" onClick={onBack} aria-label="Volver a nueva partida">Volver a nueva partida</button>
        <ScaleLogo className="world-mark" />
      </div>

      <article className="scenario-card parchment">
        <div className="scenario-head">
          <Emblem colors={scenario.colors} emblem={scenario.emblem} mode={scenario.mode} size={88} />
          <div>
            <p className="scenario-kicker">{MODE_LABEL[game.mode]} · escenario asignado al azar</p>
            <h1>{scenario.name}</h1>
            <p className="scenario-context">{scenario.context}</p>
          </div>
        </div>
        <h2 className="h-small">Valores iniciales</h2>
        <ul className="initial-values">
          {STATS[game.mode].map((stat, index) => (
            <li key={stat.key}>
              <span className="iv-name">{stat.name}</span>
              <span className="iv-bar"><span style={{ width: `${scenario.stats[index]}%`, background: stat.color }} /></span>
              <span className="iv-num">{scenario.stats[index]}</span>
            </li>
          ))}
        </ul>
        <p className="scenario-note small">
          {game.mode === 'macro'
            ? 'Escenario ficticio: no describe la situación actual del país.'
            : 'Las cartas adaptan su vocabulario al negocio; las reglas son las mismas.'}
        </p>
        <div className="scenario-actions">
          <button className="btn btn-primary" onClick={onStart}>Comenzar partida</button>
          <button className="btn btn-ghost" onClick={onBack}>Volver</button>
        </div>
      </article>
      <footer className="mode-select-foot">Veinte decisiones. Cuatro indicadores. Un equilibrio propio.</footer>
    </section>
  );
}

export function LearnHub({ name, onInstructions, onPractice, onArchive, onBack }: {
  name: string;
  onInstructions: () => void;
  onPractice: () => void;
  onArchive: () => void;
  onBack: () => void;
}) {
  return (
    <section className="learn-hub scene-backdrop">
      <button className="world-back" type="button" onClick={onBack}>Volver al menú</button>
      <header>
        <p className="learn-greeting">{name}, tu próxima decisión empieza acá.</p>
        <h1>Aprender</h1>
      </header>
      <nav className="learn-commands" aria-label="Material de aprendizaje">
        <button className="learn-command" onClick={onInstructions}>
          <span>Cómo se juega</span>
          <span>Recursos, condiciones y consecuencias diferidas.</span>
        </button>
        <button className="learn-command" onClick={onPractice}>
          <span>Practicar una decisión</span>
          <span>Probá ambas opciones sin afectar una partida.</span>
        </button>
        <button className="learn-command" onClick={onArchive}>
          <span>Archivo de estudio</span>
          <span>Conceptos de economía, gestión y finanzas.</span>
        </button>
      </nav>
    </section>
  );
}
