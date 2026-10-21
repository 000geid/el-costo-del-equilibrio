import { QUESTIONS, STUDY, studyById } from '../data';
import type { Mode } from '../engine/types';

export type StudyArea = Mode | 'all';
export type QuizProgress = {
  questionIds: string[];
  index: number;
  picked: number | null;
  checked: boolean;
  correct: number;
  answered: number;
};
export type ArchiveRoute = {
  name: 'archive';
  mode: Mode;
  area?: StudyArea;
  query?: string;
  highlight?: string[];
  scrollY?: number;
  focusId?: string;
};

export type Screen =
  | { name: 'title' | 'menu' | 'setup' | 'scenario' | 'learn' | 'settings' | 'play' | 'instructions' | 'end' | 'analysis' }
  | { name: 'practice'; mode: Mode }
  | ArchiveRoute
  | { name: 'fiche'; id: string }
  | { name: 'quiz'; studyId: string; progress: QuizProgress };

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function filterLessons(area: StudyArea, query: string) {
  const term = normalize(query.trim());
  return STUDY.filter((lesson) => (area === 'all' || lesson.mode === area)
    && normalize([lesson.title, lesson.definition, lesson.example, ...lesson.keywords].join(' ')).includes(term));
}

export function createQuizProgress(studyId: string): QuizProgress {
  const mode = studyById(studyId)?.mode;
  const preferred = QUESTIONS.filter((question) => question.studyId === studyId);
  const rest = QUESTIONS.filter((question) => question.studyId !== studyId && question.mode === mode);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return { questionIds: [...preferred, ...rest].map((question) => question.id), index: 0, picked: null, checked: false, correct: 0, answered: 0 };
}

export function archiveIndex(stack: Screen[]) {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].name === 'archive') return i;
  }
  return -1;
}

/** Keep a single reading position; a quiz may temporarily open a lesson for reference. */
export function openLesson(stack: Screen[], id: string, scrollY = 0): Screen[] {
  const lesson = studyById(id);
  if (!lesson) return stack;
  const current = stack[stack.length - 1];
  if (current?.name === 'fiche') return [...stack.slice(0, -1), { name: 'fiche', id }];
  if (current?.name === 'archive') {
    return [...stack.slice(0, -1), { ...current, scrollY, focusId: id }, { name: 'fiche', id }];
  }
  const base: Screen[] = archiveIndex(stack) < 0 ? [...stack, { name: 'archive', mode: lesson.mode }] : stack;
  return [...base, { name: 'fiche', id }];
}

export function returnToArchive(stack: Screen[]): Screen[] {
  const index = archiveIndex(stack);
  return index < 0 ? stack : stack.slice(0, index + 1);
}

export function startStudyPractice(stack: Screen[], studyId: string): Screen[] {
  // Returning from a reference lesson keeps the question, answer and score intact.
  if (stack[stack.length - 2]?.name === 'quiz') return stack.slice(0, -1);
  return [...stack, { name: 'quiz', studyId, progress: createQuizProgress(studyId) }];
}
