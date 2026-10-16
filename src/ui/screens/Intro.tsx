import { useState } from 'react';
import { MODE_LABEL, STATS } from '../../data';
import type { GameState, Mode, Scenario } from '../../engine/types';
import { Emblem, ScaleLogo } from '../components/Icons';
import { Portrait } from '../components/Portrait';

export function HomeScreen({ initialName, onEnter }: { initialName: string; onEnter: (name: string) => void }) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  return (
    <div className="home">
      <ScaleLogo className="home-logo" tilt={-6} />
      <h1 className="game-title">El costo del equilibrio</h1>
      <p className="motto">Cada decisión tiene un precio.</p>
      <form
        className="home-form parchment"
        onSubmit={(e) => {
          e.preventDefault();
          if (trimmed) onEnter(trimmed.slice(0, 40));
        }}
      >
        <label htmlFor="player-name">Escribí tu nombre</label>
        <input
          id="player-name"
          value={name}
          maxLength={40}
          autoComplete="nickname"
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={!trimmed}>Entrar al juego</button>
        <p className="home-promise">Aprendé economía. Elegí tu estrategia. Encontrá el equilibrio</p>
      </form>
    </div>
  );
}

interface MenuProps {
  name: string;
  active?: GameState;
  activeScenario?: Scenario;
  hasLast: boolean;
  onMode: (m: Mode) => void;
  onResume: () => void;
  onArchive: () => void;
  onLast: () => void;
  onInstructions: () => void;
  onChangeName: () => void;
}

const MENU_SCENES: Record<Mode, { colors: [string, string, string]; emblem: string }> = {
  macro: { colors: ['#6b2f2f', '#d9b45a', '#2f4a6b'], emblem: 'sun' },
  micro: { colors: ['#c8873a', '#f3dfb5', '#7a4a22'], emblem: 'bread' },
};

export function MenuScreen(p: MenuProps) {
  return (
    <div className="menu">
      <header className="menu-head">
        <ScaleLogo className="menu-logo" />
        <div>
          <h1 className="game-title small">El costo del equilibrio</h1>
          <p className="greeting">Hola, <strong>{p.name}</strong>. ¿Qué querés administrar hoy?</p>
        </div>
      </header>

      {p.active && p.activeScenario && (
        <div className="resume parchment">
          <div>
            <span className="label">Partida guardada</span>
            <p>
              {MODE_LABEL[p.active.mode]} · {p.activeScenario.name} · {p.active.turn} de 20 decisiones
            </p>
          </div>
          <button className="btn btn-primary" onClick={p.onResume}>Retomar partida</button>
        </div>
      )}

      <div className="modes">
        {(['macro', 'micro'] as Mode[]).map((m) => (
          <button key={m} className="mode-card" onClick={() => p.onMode(m)}>
            <div className="mode-art">
              <Portrait
                spec={m === 'macro'
                  ? { sex: 'f', age: 'adult', skin: 1, hair: 'bun', hairColor: 'brown', hat: 'crown', outfit: '#6b2f2f', trim: '#d9b45a', prop: 'scale' }
                  : { sex: 'm', age: 'adult', skin: 2, hair: 'short', hairColor: 'black', beard: 'mustache', hat: 'chef', outfit: '#e8e2d0', trim: '#7a4a22', prop: 'coins' }}
                scene={{ mode: m, ...MENU_SCENES[m] }}
              />
            </div>
            <div className="mode-text">
              <h2>{MODE_LABEL[m]}</h2>
              <p>
                {m === 'macro'
                  ? 'Integrás el equipo de gobierno de un país: ciudadanía, productores, bancos y diplomacia.'
                  : 'Administrás una pequeña empresa: clientes, proveedores, trabajadores e inversores.'}
              </p>
              <p className="mode-stats">{STATS[m].map((s) => s.name).join(' · ')}</p>
            </div>
          </button>
        ))}
      </div>

      <section className="how parchment" aria-label="Cómo se juega">
        <div className="how-step"><span className="how-num">1</span><div><h3>Leé la carta</h3><p>Cada personaje trae un problema económico y dos alternativas.</p></div></div>
        <div className="how-step"><span className="how-num">2</span><div><h3>Elegí y mirá el costo</h3><p>Una decisión puede ayudar hoy y generar compromisos para después.</p></div></div>
        <div className="how-step"><span className="how-num">3</span><div><h3>Sostené el equilibrio</h3><p>Superá 20 decisiones sin que ninguna de las cuatro barras llegue a cero.</p></div></div>
      </section>

      <div className="menu-actions">
        <button className="btn" onClick={p.onArchive}>📜 Archivo de estudio</button>
        <button className="btn" onClick={p.onInstructions}>Instrucciones</button>
        {p.hasLast && <button className="btn" onClick={p.onLast}>Último análisis</button>}
        <button className="btn btn-ghost" onClick={p.onChangeName}>Cambiar nombre</button>
      </div>
    </div>
  );
}

export function ScenarioScreen({ game, scenario, onStart, onInstructions, onMenu }: {
  game: GameState; scenario: Scenario; onStart: () => void; onInstructions: () => void; onMenu: () => void;
}) {
  return (
    <div className="scenario">
      <div className="scenario-card parchment">
        <span className="label">{MODE_LABEL[game.mode]} · escenario asignado al azar</span>
        <div className="scenario-head">
          <Emblem colors={scenario.colors} emblem={scenario.emblem} mode={scenario.mode} size={92} />
          <div>
            <h1>{scenario.name}</h1>
            <p className="scenario-context">{scenario.context}</p>
          </div>
        </div>
        <h2 className="h-small">Valores iniciales</h2>
        <ul className="initial-values">
          {STATS[game.mode].map((s, i) => (
            <li key={s.key}>
              <span className="iv-name">{s.name}</span>
              <span className="iv-bar"><span style={{ width: `${scenario.stats[i]}%`, background: s.color }} /></span>
              <span className="iv-num">{scenario.stats[i]}</span>
              <span className="iv-desc">{s.meaning}</span>
            </li>
          ))}
        </ul>
        <p className="small muted">
          {game.mode === 'macro'
            ? 'Escenario ficticio para variar la partida: no describe la situación actual del país.'
            : 'Las cartas adaptan su vocabulario a este negocio; la mecánica es la misma para todos.'}
        </p>
        <div className="row">
          <button className="btn btn-primary" onClick={onStart} autoFocus>Comenzar partida</button>
          <button className="btn" onClick={onInstructions}>Ver instrucciones</button>
          <button className="btn btn-ghost" onClick={onMenu}>Menú</button>
        </div>
      </div>
    </div>
  );
}
