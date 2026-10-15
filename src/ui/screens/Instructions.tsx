import { useState } from 'react';
import { STATS } from '../../data';
import { TUTORIAL } from '../../data/tutorial';
import { effectiveOption, previewSigns } from '../../engine/engine';
import type { Mode, OptionKey, Vec } from '../../engine/types';
import { Portrait } from '../components/Portrait';
import { SignText, StatsBar, VecText } from '../components/Stats';

export const INSTRUCTIONS_TEXT =
  'Tenés veinte decisiones para sostener tu economía. Cada personaje trae un problema y dos alternativas. Las barras muestran tu situación actual. Si alguna llega a cero, la gestión termina. Una decisión puede ayudar ahora y generar costos después. Revisá los compromisos pendientes y consultá el Archivo de estudio cuando lo necesites. No existe una opción que sea siempre la mejor.';

export function InstructionsScreen({ mode, canStart, onPractice, onStart, onBack }: {
  mode?: Mode; canStart: boolean; onPractice: () => void; onStart: () => void; onBack: () => void;
}) {
  const modes: Mode[] = mode ? [mode] : ['macro', 'micro'];
  return (
    <div className="page">
      <article className="parchment page-card">
        <h1>Instrucciones</h1>
        <p className="lead">{INSTRUCTIONS_TEXT}</p>

        <h2 className="h-small">Las barras</h2>
        {modes.map((m) => (
          <div key={m} className="bars-help">
            {!mode && <h3>{m === 'macro' ? 'Macroeconomía' : 'Microeconomía'}</h3>}
            <ul>
              {STATS[m].map((s) => (
                <li key={s.key}><strong>{s.name}:</strong> {s.meaning} <span className="muted">Si llega a cero: {s.defeat}</span></li>
              ))}
            </ul>
          </div>
        ))}
        <p>Todas las barras van de 0 a 100 y representan condiciones favorables. Llegar a 100 no castiga: el exceso se recorta. Solo el cero termina la gestión. Entre 1 y 20 la barra queda en <em>alerta</em>.</p>

        <h2 className="h-small">Antes de elegir</h2>
        <ul>
          <li>Al pasar el mouse, enfocar con el teclado o arrastrar la carta, las barras muestran el <strong>sentido</strong> de cada efecto inmediato (▲ sube, ▼ baja).</li>
          <li>Cada botón muestra si la opción crea un <strong>compromiso</strong> y cuándo vence. Los valores exactos aparecen después de elegir y quedan en el historial.</li>
          <li>Las condiciones especiales («si Calidad es menor que 45…») se informan en la carta y se evalúan con los valores previos a decidir.</li>
        </ul>

        <h2 className="h-small">Efectos futuros: un ejemplo</h2>
        <p>Si en la carta 6 elegís una opción con efecto «dentro de 2 turnos», ese efecto se aplica después de tu decisión en la carta 8. Los compromisos que vencen después de la carta 20 no se cobran: quedan visibles en el informe final.</p>

        <h2 className="h-small">Controles</h2>
        <p>Dos botones equivalentes, navegables con Tab y activables con Enter o Espacio. Podés arrastrar la carta, pero no es obligatorio. No hay límite de tiempo. Pausar y Estudiar no consumen turnos ni modifican indicadores.</p>

        <div className="row">
          <button className="btn" onClick={onPractice}>Practicar</button>
          {canStart && <button className="btn btn-primary" onClick={onStart}>Comenzar</button>}
          <button className="btn btn-ghost" onClick={onBack}>Volver</button>
        </div>
      </article>
    </div>
  );
}

const PRACTICE_STATS: Vec = [50, 50, 50, 50];

export function PracticeCardScreen({ mode, onBack }: { mode: Mode; onBack: () => void }) {
  const card = TUTORIAL[mode];
  const [hover, setHover] = useState<OptionKey | null>(null);
  const [choice, setChoice] = useState<OptionKey | null>(null);
  const eff = choice ? effectiveOption(card, choice, PRACTICE_STATS) : null;
  const after = eff ? (PRACTICE_STATS.map((x, i) => x + eff.immediate[i]) as Vec) : PRACTICE_STATS;
  return (
    <div className={`game game-${mode} practice`}>
      <header className="game-head">
        <div className="game-head-info"><span className="who">Carta de práctica</span><span className="where">No altera tu partida</span></div>
        <div className="game-head-turn">Práctica</div>
        <div className="game-head-actions"><button className="btn btn-small btn-ghost" onClick={onBack}>Volver</button></div>
      </header>
      <StatsBar mode={mode} stats={after} preview={!choice && hover ? previewSigns(card, hover, PRACTICE_STATS) : null}
        delta={eff ? eff.immediate : null} />
      <div className="game-body single">
        <section className="table">
          <div className="situation parchment">
            <h2 className="card-title">{card.title}</h2>
            <p>{card.text}</p>
          </div>
          <div className="swipe"><div className="card-face anim-deal">
            <Portrait spec={card.portrait} scene={{ mode, colors: mode === 'macro' ? ['#3f6e8c', '#efe2c2', '#d9b45a'] : ['#2f6b6b', '#efe2c2', '#d98c2a'], emblem: mode === 'macro' ? 'sun' : 'gear' }} title={card.imageHint} />
            <div className="card-ribbon"><span className="card-character">{card.character}</span><span className="card-id">{card.id}</span></div>
          </div></div>
          {!choice ? (
            <div className="choices">
              {(['A', 'B'] as OptionKey[]).map((k) => {
                const o = card.options[k];
                return (
                  <button key={k} className={`choice ${hover === k ? 'is-hovered' : ''}`} onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(k)} onBlur={() => setHover(null)} onClick={() => setChoice(k)}>
                    <span className="choice-side" aria-hidden="true">{k === 'A' ? '◀' : '▶'}</span>
                    <span className="choice-label">{o.label}</span>
                    <span className="choice-effects">
                      <span className="choice-now">Ahora: <SignText mode={mode} vec={o.immediate} /></span>
                      {o.deferred && <span className="choice-later">⏳ Compromiso: dentro de {o.deferred.delay} turnos — <SignText mode={mode} vec={o.deferred.vec} /></span>}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="consequence parchment">
              <div className="consequence-head"><span className="label">Elegiste</span><strong>«{eff!.label}»</strong></div>
              <dl className="consequence-list">
                <dt>Efecto inmediato</dt><dd><VecText mode={mode} vec={eff!.immediate} /></dd>
                {eff!.deferred && (<><dt>Nuevo compromiso</dt><dd>Dentro de {eff!.deferred.delay} turnos: <VecText mode={mode} vec={eff!.deferred.vec} /></dd></>)}
              </dl>
              <p className="explanation">{card.explanation}</p>
              <div className="row">
                <button className="btn" onClick={() => setChoice(null)}>Probar la otra opción</button>
                <button className="btn btn-primary" onClick={onBack} autoFocus>Volver</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
