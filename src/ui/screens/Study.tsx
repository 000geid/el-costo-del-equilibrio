import { useLayoutEffect, useRef } from 'react';
import { QUESTIONS, STUDY, studyById } from '../../data';
import { filterLessons, type ArchiveRoute, type QuizProgress, type StudyArea } from '../studyNavigation';

const AREA_LABELS = { macro: 'Macroeconomía', micro: 'Microeconomía y finanzas' };

function StudyNav({ backLabel, onBack, canResume, onResume, onPractice }: {
  backLabel: string;
  onBack: () => void;
  canResume: boolean;
  onResume: () => void;
  onPractice?: () => void;
}) {
  return (
    <nav className="study-nav" aria-label="Navegación de estudio">
      <div className="study-nav-links">
        <button className="world-back" type="button" onClick={onBack}>{backLabel}</button>
        {onPractice && <button className="world-back" type="button" onClick={onPractice}>Volver a la práctica</button>}
      </div>
      {canResume && <button className="btn btn-small" type="button" onClick={onResume}>Retomar partida</button>}
    </nav>
  );
}

export function ArchiveScreen({ location, canResume, backLabel, onChange, onOpen, onBack, onResume }: {
  location: ArchiveRoute;
  canResume: boolean;
  backLabel: string;
  onChange: (update: Partial<ArchiveRoute>) => void;
  onOpen: (id: string) => void;
  onBack: () => void;
  onResume: () => void;
}) {
  const area = location.area ?? location.mode;
  const query = location.query ?? '';
  const list = filterLessons(area, query);
  const related = STUDY.filter((lesson) => location.highlight?.includes(lesson.id));
  const heading = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const previous = location.focusId && document.getElementById(`lesson-${location.focusId}`);
    (previous || heading.current)?.focus({ preventScroll: true });
    window.scrollTo(0, location.scrollY ?? 0);
    // Restore only on entry, rather than moving focus while the reader types.
  }, []);

  return (
    <div className="page study-page archive">
      <StudyNav backLabel={backLabel} onBack={onBack} canResume={canResume} onResume={onResume} />
      <header className="study-heading">
        <h1 ref={heading} tabIndex={-1}>Archivo de estudio</h1>
        <p className="muted">Conceptos de economía, gestión y finanzas. Consultarlos no consume turnos ni modifica indicadores.</p>
      </header>

      {related.length > 0 && (
        <section className="study-related" aria-labelledby="related-lessons">
          <h2 className="h-small" id="related-lessons">Para tu decisión actual</h2>
          <ul>
            {related.map((lesson) => (
              <li key={lesson.id}><button className="world-back" type="button" onClick={() => onOpen(lesson.id)}>{lesson.title}</button></li>
            ))}
          </ul>
        </section>
      )}

      <div className="study-tools">
        <label className="study-search">
          <span>Buscar una lección</span>
          <input type="search" placeholder="Inflación, interés, costos…" value={query}
            onChange={(event) => onChange({ query: event.target.value, scrollY: 0, focusId: undefined })} />
        </label>
        <div className="study-filters" role="group" aria-label="Filtrar por área">
          {([['all', 'Todas las áreas'], ['macro', AREA_LABELS.macro], ['micro', AREA_LABELS.micro]] as [StudyArea, string][]).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={area === value}
              onClick={() => onChange({ area: value, scrollY: 0, focusId: undefined })}>{label}</button>
          ))}
        </div>
      </div>

      <p className="study-count muted" role="status">{list.length} {list.length === 1 ? 'lección' : 'lecciones'}{query.trim() && ` para «${query.trim()}»`}</p>
      {(['macro', 'micro'] as const).map((mode) => {
        const lessons = list.filter((lesson) => lesson.mode === mode);
        if (!lessons.length) return null;
        return (
          <section className="study-index" key={mode} aria-labelledby={`area-${mode}`}>
            <h2 className="h-small" id={`area-${mode}`}>{AREA_LABELS[mode]}</h2>
            <ul className="study-lessons">
              {lessons.map((lesson) => (
                <li key={lesson.id}>
                  <button id={`lesson-${lesson.id}`} className="study-lesson" type="button" onClick={() => onOpen(lesson.id)}>
                    <span className="study-lesson-copy">
                      <span className="study-lesson-title">{lesson.title}</span>
                      <span className="study-lesson-description">{lesson.definition.split('. ')[0].replace(/\.$/, '')}.</span>
                    </span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {list.length === 0 && (
        <div className="study-empty">
          <p>No encontramos lecciones con esos filtros.</p>
          <button className="world-back" type="button" onClick={() => onChange({ area: 'all', query: '', scrollY: 0, focusId: undefined })}>Ver todas las lecciones</button>
        </div>
      )}
    </div>
  );
}

export function FicheScreen({ id, canResume, reviewingPractice, onPractice, onArchive, onResume, onLesson }: {
  id: string;
  canResume: boolean;
  reviewingPractice: boolean;
  onPractice: (studyId: string) => void;
  onArchive: () => void;
  onResume: () => void;
  onLesson: (id: string) => void;
}) {
  const s = studyById(id);
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [id]);
  if (!s) return null;
  const lessons = STUDY.filter((lesson) => lesson.mode === s.mode);
  const index = lessons.findIndex((lesson) => lesson.id === id);
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  const hasQuestion = QUESTIONS.some((question) => question.studyId === id);
  return (
    <div className="page study-page">
      <StudyNav backLabel="Volver al archivo" onBack={onArchive} canResume={canResume} onResume={onResume}
        onPractice={reviewingPractice ? () => onPractice(id) : undefined} />
      <article className="fiche">
        <header className="lesson-heading">
          <h1 ref={heading} tabIndex={-1}>{s.title}</h1>
          <p className="muted">{AREA_LABELS[s.mode]} · Lección {index + 1} de {lessons.length}</p>
        </header>
        <h2 className="h-small">Definición</h2>
        <p className="lead">{s.definition}</p>
        <h2 className="h-small">Ejemplo</h2>
        <p>{s.example}</p>
        <h2 className="h-small">Para decidir mejor</h2>
        <p>{s.tip}</p>
        <div className="lesson-practice">
          <button className="btn btn-primary" type="button" onClick={() => onPractice(id)}>
            {reviewingPractice ? 'Continuar práctica' : hasQuestion ? 'Practicar este concepto' : 'Practicar esta área'}
          </button>
          {!hasQuestion && !reviewingPractice && <p className="small muted">Esta lección no tiene una pregunta propia. Podés practicar otros conceptos de {AREA_LABELS[s.mode].toLowerCase()}.</p>}
        </div>
        <nav className="lesson-pagination" aria-label="Otras lecciones de esta área">
          {previous && <button className="lesson-page-link" type="button" onClick={() => onLesson(previous.id)}><span>Lección anterior</span><strong>{previous.title}</strong></button>}
          {next && <button className="lesson-page-link lesson-next" type="button" onClick={() => onLesson(next.id)}><span>Siguiente lección</span><strong>{next.title}</strong></button>}
        </nav>
      </article>
    </div>
  );
}

export function QuizScreen({ studyId, progress, canResume, onChange, onBack, onArchive, onResume, onFiche }: {
  studyId: string;
  progress: QuizProgress;
  canResume: boolean;
  onChange: (progress: QuizProgress) => void;
  onBack: () => void;
  onArchive: () => void;
  onResume: () => void;
  onFiche: (id: string) => void;
}) {
  const { index, picked, checked, correct, answered } = progress;
  const q = QUESTIONS.find((question) => question.id === progress.questionIds[index % progress.questionIds.length]);
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [index]);
  if (!q) return null;
  const origin = studyById(studyId);
  const questionLesson = studyById(q.studyId);

  return (
    <div className="page study-page">
      <StudyNav backLabel="Volver al archivo" onBack={onArchive} canResume={canResume} onResume={onResume} />
      <article className="fiche quiz">
        <header className="study-heading">
          <h1 ref={heading} tabIndex={-1}>Práctica de {AREA_LABELS[q.mode].toLowerCase()}</h1>
          <p className="muted">Pregunta {index % progress.questionIds.length + 1} de {progress.questionIds.length} · No consume turnos.</p>
          <button className="world-back" type="button" onClick={onBack}>Volver a la lección{origin ? ` «${origin.title}»` : ''}</button>
        </header>
        <h2 className="quiz-q">{q.prompt}</h2>
        <fieldset className="quiz-options" disabled={checked}>
          <legend className="sr-only">Opciones</legend>
          {q.options.map((option, i) => (
            <label key={i} className={`quiz-option ${checked && i === q.answer ? 'is-right' : ''} ${checked && picked === i && i !== q.answer ? 'is-wrong' : ''}`}>
              <input type="radio" name={`q-${q.id}`} checked={picked === i} onChange={() => onChange({ ...progress, picked: i })} />
              <span className="quiz-letter">{'ABC'[i]}</span> {option}
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
        <p className="small muted">Aciertos en esta práctica: {correct} de {answered}</p>
        <div className="row">
          {!checked ? (
            <button className="btn btn-primary" type="button" disabled={picked === null} onClick={() => onChange({
              ...progress, checked: true, correct: correct + (picked === q.answer ? 1 : 0), answered: answered + 1,
            })}>Comprobar</button>
          ) : (
            <button className="btn btn-primary" type="button" onClick={() => onChange({ ...progress, index: index + 1, picked: null, checked: false })}>Otra pregunta</button>
          )}
          <button className="world-back" type="button" onClick={() => onFiche(q.studyId)}>Consultar lección{questionLesson ? `: ${questionLesson.title}` : ''}</button>
        </div>
      </article>
    </div>
  );
}
