import { useMemo, useState } from 'react';
import { ALL_CARDS, QUESTIONS, STUDY, studyById } from '../../data';
import type { Question } from '../../data/questions';
import type { Mode } from '../../engine/types';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function ArchiveScreen({ initialMode, highlight, resumeLabel, onOpen, onBack }: {
  initialMode: Mode;
  /** Fichas relacionadas con la carta actual (se muestran primero). */
  highlight?: string[];
  resumeLabel: string;
  onOpen: (id: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Mode>(initialMode);
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const nq = norm(q.trim());
    return STUDY.filter((s) => {
      if (!nq) return s.mode === tab;
      const hay = norm([s.title, s.definition, s.example, ...s.keywords].join(' '));
      return hay.includes(nq);
    });
  }, [tab, q]);
  const related = (highlight ?? []).map((id) => studyById(id)).filter(Boolean);

  return (
    <div className="page archive">
      <header className="page-head">
        <h1>Archivo de estudio</h1>
        <p className="muted-light">Biblioteca de conceptos. Consultarla no consume turnos ni modifica indicadores.</p>
      </header>

      {related.length > 0 && (
        <section className="related parchment">
          <span className="label">Relacionado con la carta actual</span>
          <div className="scroll-grid">
            {related.map((s) => (
              <button key={s!.id} className="scroll-item" onClick={() => onOpen(s!.id)}>
                <span className="scroll-title">{s!.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="archive-tools">
        <div className="tabs" role="tablist" aria-label="Área">
          <button role="tab" aria-selected={tab === 'macro' && !q} className={`tab ${tab === 'macro' && !q ? 'is-active' : ''}`} onClick={() => { setTab('macro'); setQ(''); }}>Macro</button>
          <button role="tab" aria-selected={tab === 'micro' && !q} className={`tab ${tab === 'micro' && !q ? 'is-active' : ''}`} onClick={() => { setTab('micro'); setQ(''); }}>Micro y finanzas</button>
        </div>
        <label className="search">
          <span className="sr-only">Buscar por palabra clave</span>
          <input type="search" placeholder="Buscar: inflación, interés, costo…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className="scroll-grid">
        {list.map((s) => (
          <button key={s.id} className="scroll-item" onClick={() => onOpen(s.id)}>
            <span className="scroll-title">{s.title}</span>
            <span className="scroll-def">{s.definition.split('. ')[0].replace(/\.$/, '')}.</span>
          </button>
        ))}
        {list.length === 0 && <p className="muted-light">No hay fichas con esa palabra.</p>}
      </div>

      <div className="row center">
        <button className="btn btn-primary" onClick={onBack}>{resumeLabel}</button>
      </div>
    </div>
  );
}

export function FicheScreen({ id, canResume, onPractice, onArchive, onResume, onCard }: {
  id: string;
  canResume: boolean;
  onPractice: (studyId: string) => void;
  onArchive: () => void;
  onResume: () => void;
  onCard: (cardId: string) => void;
}) {
  const s = studyById(id);
  if (!s) return null;
  const cards = ALL_CARDS.filter((c) => c.studyIds.includes(id));
  const hasQuestion = QUESTIONS.some((qq) => qq.studyId === id);
  return (
    <div className="page">
      <article className="parchment page-card fiche">
        <span className="label">{s.mode === 'macro' ? 'Macroeconomía' : 'Microeconomía y finanzas'}</span>
        <h1>{s.title}</h1>
        <h2 className="h-small">Definición</h2>
        <p className="lead">{s.definition}</p>
        <h2 className="h-small">Ejemplo</h2>
        <p>{s.example}</p>
        <h2 className="h-small">Para decidir mejor</h2>
        <p>{s.tip}</p>
        <h2 className="h-small">Cartas relacionadas</h2>
        <ul className="related-cards">
          {cards.map((c) => (
            <li key={c.id}>
              <button className="link" onClick={() => onCard(c.id)}><strong>{c.id}</strong> {c.title}</button>
            </li>
          ))}
        </ul>
        <div className="row">
          <button className="btn" onClick={() => onPractice(id)}>{hasQuestion ? 'Practicar' : 'Practicar (pregunta al azar)'}</button>
          <button className="btn" onClick={onArchive}>Volver al archivo</button>
          {canResume && <button className="btn btn-primary" onClick={onResume}>Retomar partida</button>}
        </div>
      </article>
    </div>
  );
}

export function QuizScreen({ studyId, mode, onBack, onFiche }: {
  studyId?: string; mode?: Mode; onBack: () => void; onFiche: (id: string) => void;
}) {
  const pool = useMemo(() => {
    const preferred = QUESTIONS.filter((q) => q.studyId === studyId);
    const rest = QUESTIONS.filter((q) => q.studyId !== studyId && (!mode || q.mode === mode));
    return [...preferred, ...shuffled(rest)];
  }, [studyId, mode]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState({ ok: 0, total: 0 });
  const q: Question = pool[idx % pool.length];

  return (
    <div className="page">
      <article className="parchment page-card quiz">
        <span className="label">Práctica · Pregunta {q.id.slice(1)} de 10 · no consume cartas</span>
        <h1 className="quiz-q">{q.prompt}</h1>
        <fieldset className="quiz-options" disabled={checked}>
          <legend className="sr-only">Opciones</legend>
          {q.options.map((o, i) => (
            <label key={i} className={`quiz-option ${checked && i === q.answer ? 'is-right' : ''} ${checked && picked === i && i !== q.answer ? 'is-wrong' : ''}`}>
              <input type="radio" name={`q-${q.id}`} checked={picked === i} onChange={() => setPicked(i)} />
              <span className="quiz-letter">{'ABC'[i]}</span> {o}
              {checked && i === q.answer && <span className="quiz-mark"> ✔ correcta</span>}
              {checked && picked === i && i !== q.answer && <span className="quiz-mark"> ✘ tu respuesta</span>}
            </label>
          ))}
        </fieldset>
        {checked && (
          <p className="explanation" role="status">
            <strong>{picked === q.answer ? 'Correcto.' : `Respuesta: ${'ABC'[q.answer]}.`}</strong> {q.explanation}
          </p>
        )}
        <p className="small muted">Aciertos en esta práctica: {score.ok} de {score.total}</p>
        <div className="row">
          {!checked ? (
            <button className="btn btn-primary" disabled={picked === null} onClick={() => {
              setChecked(true);
              setScore((s) => ({ ok: s.ok + (picked === q.answer ? 1 : 0), total: s.total + 1 }));
            }}>Comprobar</button>
          ) : (
            <button className="btn btn-primary" onClick={() => { setIdx((i) => i + 1); setPicked(null); setChecked(false); }}>Otra pregunta</button>
          )}
          <button className="btn" onClick={() => onFiche(q.studyId)}>Ver ficha</button>
          <button className="btn btn-ghost" onClick={onBack}>Volver</button>
        </div>
      </article>
    </div>
  );
}

function shuffled<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
