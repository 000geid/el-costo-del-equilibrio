import { useEffect, useMemo, useState } from 'react';
import { adaptText, capitalize, cardById, STATS, studyById } from '../../data';
import { effectiveOption, isConditionActive, previewSigns, TOTAL_TURNS } from '../../engine/engine';
import type { Card, GameState, Mode, OptionKey, PendingEffect, Scenario, Vec } from '../../engine/types';
import { Portrait } from '../components/Portrait';
import { SignText, StatsBar, VecText } from '../components/Stats';
import { SwipeCard } from '../components/SwipeCard';

interface Props {
  game: GameState;
  scenario: Scenario;
  reduceMotion: boolean;
  onDecide: (key: OptionKey) => void;
  onNext: () => void;
  onPause: () => void;
  onStudy: () => void;
  onConcept: (studyId: string) => void;
}

export const sceneOf = (s: Scenario) => ({ mode: s.mode, colors: s.colors, emblem: s.emblem });

export function GameScreen({ game, scenario, reduceMotion, onDecide, onNext, onPause, onStudy, onConcept }: Props) {
  const inConsequence = game.phase === 'consequence';
  const last = inConsequence ? game.history[game.history.length - 1] : undefined;
  const card = cardById(inConsequence && last ? last.cardId : game.deck[game.turn]);
  const [hover, setHover] = useState<OptionKey | null>(null);

  useEffect(() => setHover(null), [game.turn, game.phase]);

  const before = inConsequence && last ? last.before : game.stats;
  const preview = !inConsequence && hover ? previewSigns(card, hover, game.stats) : null;
  const delta = inConsequence && last ? (last.after.map((x, i) => x - last.before[i]) as Vec) : null;
  const cardNo = inConsequence ? game.turn : game.turn + 1;

  return (
    <div className={`game game-${game.mode}`}>
      <header className="game-head">
        <div className="game-head-info">
          <span className="who">{game.playerName}</span>
          <span className="where">{scenario.name}</span>
        </div>
        <div className="game-head-turn" aria-live="polite">
          Carta <strong>{cardNo}</strong> de {TOTAL_TURNS}
        </div>
        <div className="game-head-actions">
          <button className="btn btn-small btn-ghost" onClick={onStudy}>📜 Estudiar</button>
          <button className="btn btn-small btn-ghost" onClick={onPause}>⏸ Pausar</button>
        </div>
      </header>

      <StatsBar mode={game.mode} stats={game.stats} preview={preview} delta={delta} />

      <div className="game-body">
        <section className="table" aria-label="Carta actual">
          <div className="situation parchment">
            <h2 className="card-title">{card.title}</h2>
            <p>{capitalize(adaptText(card.text, scenario.vocab))}</p>
            {card.condition && !inConsequence && <ConditionBox card={card} mode={game.mode} stats={game.stats} />}
          </div>

          <SwipeCard
            key={`${card.id}-${game.phase}`}
            labels={{ A: card.options.A.label, B: card.options.B.label }}
            disabled={inConsequence}
            reduceMotion={reduceMotion}
            onHover={setHover}
            onChoose={onDecide}
          >
            <div className={`card-face ${inConsequence ? 'is-resolved' : ''} ${reduceMotion ? '' : 'anim-deal'}`}>
              <Portrait spec={card.portrait} scene={sceneOf(scenario)} title={card.imageHint} />
              <div className="card-ribbon">
                <span className="card-character">{card.character}</span>
                <span className="card-id">{card.id}</span>
              </div>
            </div>
          </SwipeCard>

          {!inConsequence ? (
            <div className="choices">
              {(['A', 'B'] as OptionKey[]).map((k) => (
                <ChoiceButton
                  key={k}
                  k={k}
                  card={card}
                  game={game}
                  hovered={hover === k}
                  onHover={setHover}
                  onChoose={onDecide}
                />
              ))}
              <p className="hint">También podés arrastrar la carta: izquierda para la primera opción, derecha para la segunda.</p>
            </div>
          ) : (
            last && (
              <Consequence
                game={game}
                card={card}
                before={before}
                onNext={onNext}
                onConcept={() => onConcept(card.studyIds[0])}
              />
            )
          )}
        </section>

        <aside className="side">
          <Timeline game={game} />
          <Commitments mode={game.mode} pending={game.pending} turn={game.turn} />
          <div className="concept-chip parchment">
            <span className="label">Concepto de la carta</span>
            <button className="link" onClick={() => onConcept(card.studyIds[0])}>
              {card.concept}{'\u00a0'}→
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ChoiceButton({ k, card, game, hovered, onHover, onChoose }: {
  k: OptionKey; card: Card; game: GameState; hovered: boolean;
  onHover: (k: OptionKey | null) => void; onChoose: (k: OptionKey) => void;
}) {
  const eff = effectiveOption(card, k, game.stats);
  return (
    <button
      className={`choice ${hovered ? 'is-hovered' : ''}`}
      onMouseEnter={() => onHover(k)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(k)}
      onBlur={() => onHover(null)}
      onClick={() => onChoose(k)}
    >
      <span className="choice-side" aria-hidden="true">{k === 'A' ? '◀' : '▶'}</span>
      <span className="choice-label">{eff.label}</span>
      <span className="choice-effects">
        <span className="choice-now">Ahora: <SignText mode={game.mode} vec={eff.immediate} /></span>
        {eff.deferred && (
          <span className="choice-later">
            ⏳ Compromiso: tras la carta {game.turn + 1 + eff.deferred.delay}
            {game.turn + 1 + eff.deferred.delay > TOTAL_TURNS ? ' (después del cierre)' : ''}
            {' — '}
            <SignText mode={game.mode} vec={eff.deferred.vec} />
          </span>
        )}
      </span>
    </button>
  );
}

function ConditionBox({ card, mode, stats }: { card: Card; mode: Mode; stats: Vec }) {
  const c = card.condition!;
  const active = isConditionActive(card, stats);
  const name = STATS[mode][c.stat].name;
  return (
    <div className={`condition ${active ? 'is-active' : ''}`} role="note">
      <strong>Condición visible.</strong> {c.notice}{' '}
      <span className="condition-state">
        Tu {name} es {stats[c.stat]}: {active ? 'la condición se aplica.' : 'la condición no se aplica.'}
      </span>
    </div>
  );
}

function Consequence({ game, card, before, onNext, onConcept }: {
  game: GameState; card: Card; before: Vec; onNext: () => void; onConcept: () => void;
}) {
  const last = game.history[game.history.length - 1];
  const ended = game.status !== 'active';
  return (
    <div className="consequence parchment" role="status">
      <div className="consequence-head">
        <span className="label">Elegiste</span>
        <strong>«{last.optionLabel}»</strong>
      </div>
      <dl className="consequence-list">
        <dt>Efecto inmediato</dt>
        <dd><VecText mode={game.mode} vec={last.immediate} /></dd>
        {last.conditionActive && (
          <>
            <dt>Condición</dt>
            <dd>Se aplicó la condición de la carta (evaluada con los valores previos: {STATS[game.mode][card.condition!.stat].name} {before[card.condition!.stat]}).</dd>
          </>
        )}
        {last.dueApplied.length > 0 && (
          <>
            <dt>Compromisos que vencieron</dt>
            <dd>
              {last.dueApplied.map((d) => (
                <div key={d.id}>
                  {d.cardId} «{d.optionLabel}»: <VecText mode={game.mode} vec={d.vec} />
                </div>
              ))}
            </dd>
          </>
        )}
        {last.created && (
          <>
            <dt>Nuevo compromiso</dt>
            <dd>
              Vence tras la carta {last.created.dueTurn}
              {last.created.dueTurn > TOTAL_TURNS ? ' (después del cierre)' : ''}: <VecText mode={game.mode} vec={last.created.vec} />
            </dd>
          </>
        )}
        {last.dueApplied.length === 0 && game.status === 'lost' && game.pending.some((p) => p.dueTurn === last.turn) && (
          <>
            <dt>Pendiente</dt>
            <dd>La gestión terminó antes de aplicar los compromisos de este turno; quedan registrados como pendientes.</dd>
          </>
        )}
      </dl>
      <p className="explanation">{card.explanation}</p>
      {game.status === 'lost' && (
        <p className="defeat-note">⚠ Una barra llegó a cero. La gestión termina en esta carta.</p>
      )}
      <div className="row">
        <button className="btn btn-primary" onClick={onNext} autoFocus>
          {ended ? 'Ver resultado' : 'Siguiente carta'}
        </button>
        <button className="btn" onClick={onConcept}>Ver concepto: {studyById(card.studyIds[0])?.title}</button>
      </div>
    </div>
  );
}

/** Calendario de 20 cartas con los vencimientos marcados. */
function Timeline({ game }: { game: GameState }) {
  const dues = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of game.pending) m.set(p.dueTurn, (m.get(p.dueTurn) ?? 0) + p.vec.reduce((a, x) => a + x, 0));
    return m;
  }, [game.pending]);
  return (
    <div className="timeline parchment">
      <span className="label">Calendario</span>
      <ol className="pips">
        {Array.from({ length: TOTAL_TURNS }, (_, i) => {
          const t = i + 1;
          const done = t <= game.turn;
          const current = t === game.turn + 1 && game.phase === 'card';
          const due = dues.get(t);
          return (
            <li
              key={t}
              className={`pip ${done ? 'done' : ''} ${current ? 'current' : ''}`}
              title={`Carta ${t}${due !== undefined ? ' · vence un compromiso' : ''}`}
            >
              <span className="pip-num">{t}</span>
              {due !== undefined && <span className={`pip-due ${due >= 0 ? 'pos' : 'neg'}`} aria-label="compromiso" />}
            </li>
          );
        })}
      </ol>
      {[...dues.keys()].some((t) => t > TOTAL_TURNS) && <p className="small muted">Hay compromisos que vencen después del cierre.</p>}
    </div>
  );
}

function Commitments({ mode, pending, turn }: { mode: Mode; pending: PendingEffect[]; turn: number }) {
  const list = pending.slice().sort((a, b) => a.dueTurn - b.dueTurn);
  return (
    <div className="commitments parchment">
      <span className="label">Compromisos pendientes</span>
      {list.length === 0 ? (
        <p className="small muted">No hay pagos ni beneficios comprometidos.</p>
      ) : (
        <ul>
          {list.map((p) => (
            <li key={p.id}>
              <div className="commit-head">
                <strong>{p.cardId}</strong> «{p.optionLabel}»
                <span className="commit-due">
                  {p.dueTurn > TOTAL_TURNS ? 'después del cierre' : p.dueTurn - turn <= 1 ? `¡tras la carta ${p.dueTurn}!` : `tras la carta ${p.dueTurn}`}
                </span>
              </div>
              <VecText mode={mode} vec={p.vec} />
              {p.tag === 'financiamiento' && <div className="small muted">Devolución de financiamiento (no es un ingreso).</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
