import { useState } from 'react';
import { cardById, MODE_LABEL, STATS, TAG_SHORT } from '../../data';
import {
  financingSummary, indicatorSummaries, learnedConcepts, managementProfile, riskyPending, solidDecisions, topDecisions,
} from '../../engine/analysis';
import { TOTAL_TURNS } from '../../engine/engine';
import type { DefeatCause, GameState, Scenario, Vec } from '../../engine/types';
import { TrajectoryChart, TrajectoryTable } from '../components/Chart';
import { Emblem, ScaleLogo } from '../components/Icons';
import { StatsBar, VecText } from '../components/Stats';

function causeText(game: GameState, c: DefeatCause) {
  const meta = STATS[game.mode][c.stat];
  const card = cardById(c.cardId);
  if (c.source === 'decision') {
    const h = game.history.find((x) => x.turn === c.turn);
    return `${meta.name} llegó a cero en el turno ${c.turn} por la decisión «${h?.optionLabel}» de la carta ${card.id} «${card.title}».`;
  }
  const origin = game.history.find((x) => x.created?.cardId === c.cardId);
  return `${meta.name} llegó a cero en el turno ${c.turn} cuando venció el compromiso de «${origin?.optionLabel ?? card.title}» (carta ${card.id}, elegida en el turno ${origin?.turn ?? '?'}).`;
}

export function EndScreen({ game, scenario, onAnalysis, onNew, onStudy, onMenu }: {
  game: GameState; scenario: Scenario; onAnalysis: () => void; onNew: () => void; onStudy: (studyId: string) => void; onMenu: () => void;
}) {
  const won = game.status === 'won';
  const title = won
    ? game.mode === 'macro' ? 'Sostuviste la economía del país' : 'Tu negocio sigue en marcha'
    : game.mode === 'macro' ? 'La gestión terminó' : 'El negocio cerró';
  const causes = game.defeat ?? [];
  const causalStudy = causes.length ? cardById(causes[0].cardId).studyIds[0] : undefined;
  return (
    <div className={`end ${won ? 'is-win' : 'is-loss'}`}>
      <div className="end-card parchment">
        <ScaleLogo className="end-logo" tilt={won ? 0 : 18} />
        <span className="label">{MODE_LABEL[game.mode]} · {scenario.name}</span>
        <h1>{title}</h1>
        <div className="end-stats"><StatsBar mode={game.mode} stats={game.stats} delta={game.stats.map((x, i) => x - game.initial[i]) as Vec} /></div>
        <p className="small muted">Valores finales y variación desde el inicio del escenario.</p>
        {won ? (
          <p className="lead">Resolviste las {TOTAL_TURNS} decisiones sin que ningún indicador llegara a cero. Superaste el horizonte del juego; el análisis muestra qué compromisos siguen abiertos.</p>
        ) : (
          <>
            {causes.map((c, i) => (
              <div key={i} className="cause">
                <p className="cause-title"><strong>Barra crítica: {STATS[game.mode][c.stat].name}.</strong> {STATS[game.mode][c.stat].defeat}</p>
                <p>{causeText(game, c)}</p>
              </div>
            ))}
            <p className="muted">Decisiones completadas: {game.turn} de {TOTAL_TURNS}.</p>
          </>
        )}
        <div className="row center">
          <button className="btn btn-primary" onClick={onAnalysis} autoFocus>Ver análisis</button>
          {won
            ? <button className="btn" onClick={onNew}>Nueva partida</button>
            : causalStudy && <button className="btn" onClick={() => onStudy(causalStudy)}>Estudiar este tema</button>}
          <button className="btn btn-ghost" onClick={onMenu}>Menú</button>
        </div>
      </div>
    </div>
  );
}

type Tab = 'res' | 'dec' | 'learn';

export function AnalysisScreen({ game, scenario, onCard, onConcept, onNew, onMenu }: {
  game: GameState; scenario: Scenario; onCard: (turn: number) => void; onConcept: (id: string) => void; onNew: () => void; onMenu: () => void;
}) {
  const [tab, setTab] = useState<Tab>('res');
  const meta = STATS[game.mode];
  const won = game.status === 'won';
  return (
    <div className="page analysis">
      <header className="page-head analysis-head">
        <Emblem colors={scenario.colors} emblem={scenario.emblem} mode={scenario.mode} size={56} />
        <div>
          <h1>Registro de gestión</h1>
          <p className="muted-light">{game.playerName} · {MODE_LABEL[game.mode]} · {scenario.name} · {won ? 'Victoria' : 'Derrota'} · {game.turn} de {TOTAL_TURNS} decisiones</p>
        </div>
      </header>

      <div className="tabs" role="tablist">
        {([['res', 'Resultados'], ['dec', 'Tus decisiones'], ['learn', 'Lo que aprendiste']] as [Tab, string][]).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'is-active' : ''}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === 'res' && (
        <section className="parchment page-card">
          <h2 className="h-small">{won ? 'Victoria' : 'Derrota'}</h2>
          {!won && (game.defeat ?? []).map((c, i) => <p key={i}>{causeText(game, c)}</p>)}
          {won && <p>Completaste las {TOTAL_TURNS} decisiones sin barras en cero, incluidos los compromisos que vencían en el último turno.</p>}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th scope="col">Indicador</th><th scope="col">Inicial</th><th scope="col">Final</th><th scope="col">Mínimo</th><th scope="col">Máximo</th><th scope="col">Variación</th><th scope="col">Turnos en alerta</th></tr>
              </thead>
              <tbody>
                {indicatorSummaries(game).map((s) => (
                  <tr key={s.stat}>
                    <th scope="row">{meta[s.stat].name}</th>
                    <td>{s.initial}</td><td>{s.final}</td><td>{s.min}</td><td>{s.max}</td>
                    <td className={s.net > 0 ? 'up' : s.net < 0 ? 'down' : ''}>{s.net > 0 ? `+${s.net}` : s.net}</td>
                    <td>{s.alertTurns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2 className="h-small">Trayectoria</h2>
          <TrajectoryChart game={game} onTurn={onCard} />
          <details className="data-details">
            <summary>Tabla de datos del gráfico</summary>
            <TrajectoryTable game={game} />
          </details>
        </section>
      )}

      {tab === 'dec' && <DecisionsTab game={game} onCard={onCard} />}
      {tab === 'learn' && <LearnTab game={game} onConcept={onConcept} onCard={onCard} />}

      <div className="row center">
        <button className="btn btn-primary" onClick={onNew}>Nueva partida</button>
        <button className="btn" onClick={onMenu}>Menú</button>
      </div>
    </div>
  );
}

function DecisionsTab({ game, onCard }: { game: GameState; onCard: (turn: number) => void }) {
  const top = topDecisions(game);
  const topTurns = new Set(top.map((t) => t.entry.turn));
  const fin = financingSummary(game);
  return (
    <section className="parchment page-card">
      <h2 className="h-small">Decisiones de mayor impacto</h2>
      <ol className="top-list">
        {top.map(({ entry, impact }) => (
          <li key={entry.turn}>
            <button className="link" onClick={() => onCard(entry.turn)}>
              Turno {entry.turn} · {entry.cardId} «{cardById(entry.cardId).title}»
            </button>{' '}
            — «{entry.optionLabel}» <span className="muted">(magnitud {impact} puntos)</span>
          </li>
        ))}
      </ol>

      <h2 className="h-small">Historial</h2>
      <ol className="history">
        {game.history.map((h) => {
          const card = cardById(h.cardId);
          return (
            <li key={h.turn} className={`${topTurns.has(h.turn) ? 'is-top' : ''} ${h.defeat ? 'is-defeat' : ''}`}>
              <div className="history-head">
                <span className="history-turn">{h.turn}</span>
                <div>
                  <strong>{card.character}</strong> · {card.title}
                  <div>Elegiste «{h.optionLabel}» <span className="tag">{TAG_SHORT[h.tag]}</span>{topTurns.has(h.turn) && <span className="tag tag-top">★ mayor impacto</span>}</div>
                </div>
                <button className="btn btn-small" onClick={() => onCard(h.turn)}>Ver carta</button>
              </div>
              <div className="history-body">
                <div><span className="muted">Inmediato:</span> <VecText mode={game.mode} vec={h.immediate} /></div>
                {h.created && <div><span className="muted">Compromiso creado (tras la carta {h.created.dueTurn}):</span> <VecText mode={game.mode} vec={h.created.vec} /></div>}
                {h.dueApplied.map((d) => (
                  <div key={d.id}><span className="muted">Venció {d.cardId} «{d.optionLabel}»:</span> <VecText mode={game.mode} vec={d.vec} /></div>
                ))}
                {h.defeat && <div className="down">⚠ Una barra llegó a cero en esta decisión.</div>}
              </div>
            </li>
          );
        })}
      </ol>

      <h2 className="h-small">Financiamiento y compromisos</h2>
      <p className="small muted">El financiamiento aporta recursos hoy a cambio de obligaciones: no es un ingreso.</p>
      <div className="fin-grid">
        <div>
          <h3>Financiamiento aceptado</h3>
          {fin.accepted.length === 0 ? <p className="muted">Ninguno.</p> : (
            <ul>{fin.accepted.map((h) => <li key={h.turn}>Turno {h.turn}: {h.cardId} «{h.optionLabel}»</li>)}</ul>
          )}
        </div>
        <div>
          <h3>Pagos realizados</h3>
          {fin.payments.length === 0 ? <p className="muted">Ninguno.</p> : (
            <ul>{fin.payments.map((p) => <li key={p.effect.id}>Turno {p.turn}: {p.effect.cardId} — <VecText mode={game.mode} vec={p.effect.vec} /></li>)}</ul>
          )}
        </div>
        <div>
          <h3>Compromisos pendientes</h3>
          {fin.pending.length === 0 ? <p className="muted">Ninguno.</p> : (
            <ul>{fin.pending.map((p) => (
              <li key={p.id}>{p.cardId} «{p.optionLabel}» — vence tras la carta {p.dueTurn}{p.dueTurn > TOTAL_TURNS ? ' (después del cierre)' : ''}: <VecText mode={game.mode} vec={p.vec} /></li>
            ))}</ul>
          )}
        </div>
      </div>
    </section>
  );
}

function LearnTab({ game, onConcept, onCard }: { game: GameState; onConcept: (id: string) => void; onCard: (turn: number) => void }) {
  const concepts = learnedConcepts(game);
  const profile = managementProfile(game);
  const won = game.status === 'won';
  const risky = riskyPending(game);
  const solid = solidDecisions(game);
  return (
    <section className="parchment page-card">
      <h2 className="h-small">Perfil de gestión</h2>
      {profile.mixed ? (
        <p>Gestión mixta: ninguna orientación alcanzó al menos tres elecciones y el 25 % de las decisiones.</p>
      ) : (
        profile.items.map((p) => <p key={p.tag}>{p.sentence}</p>)
      )}
      <p className="small muted">
        Frecuencia de orientaciones: {profile.counts.map((c) => `${TAG_SHORT[c.tag]} ${c.count}`).join(' · ')}. El perfil describe elecciones registradas, no rasgos personales.
      </p>

      <h2 className="h-small">Conceptos para repasar</h2>
      <div className="concepts">
        {concepts.map((c) => (
          <article key={c.study.id} className={`concept ${c.causal ? 'is-causal' : ''}`}>
            {c.causal && <span className="tag tag-alert">Relacionado con la causa del cierre</span>}
            <h3>{c.study.title}</h3>
            <p>{c.study.definition}</p>
            <p><span className="muted">En tu intento:</span> {c.example}</p>
            <p><span className="muted">Recomendación:</span> {c.recommendation}</p>
            <div className="row">
              <button className="btn btn-small" onClick={() => onConcept(c.study.id)}>Abrir concepto</button>
              {c.entry && <button className="btn btn-small btn-ghost" onClick={() => onCard(c.entry!.turn)}>Ver carta</button>}
            </div>
          </article>
        ))}
      </div>

      {won && (
        <>
          <h2 className="h-small">Decisiones que sumaron dentro del modelo</h2>
          {solid.length === 0 ? <p className="muted">Ninguna decisión tuvo un saldo neto positivo.</p> : (
            <ul>{solid.map((d) => <li key={d.entry.turn}>Turno {d.entry.turn}: {d.entry.cardId} «{d.entry.optionLabel}» (saldo neto +{d.net} puntos, incluidos efectos diferidos ya realizados).</li>)}</ul>
          )}
          <h2 className="h-small">Obligaciones que siguen abiertas</h2>
          {risky.length === 0 ? <p>No quedan obligaciones negativas pendientes.</p> : (
            <ul>{risky.map((p) => <li key={p.id}>{p.cardId} «{p.optionLabel}»: <VecText mode={game.mode} vec={p.vec} /> — podría comprometer la continuidad después del cierre.</li>)}</ul>
          )}
        </>
      )}
      {game.studyVisits.length > 0 && (
        <p className="small muted">Consultaste {game.studyVisits.length} ficha(s) durante la partida. Consultar teoría nunca resta puntos.</p>
      )}
    </section>
  );
}
