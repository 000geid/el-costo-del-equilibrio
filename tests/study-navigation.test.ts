import { describe, expect, it } from 'vitest';
import { QUESTIONS, STUDY } from '../src/data';
import {
  createQuizProgress, filterLessons, openLesson, returnToArchive, startStudyPractice,
  type ArchiveRoute, type Screen,
} from '../src/ui/studyNavigation';

describe('navegación de estudio', () => {
  it('recupera filtros, búsqueda y posición después de leer varias lecciones', () => {
    const archive: ArchiveRoute = { name: 'archive', mode: 'macro', area: 'micro', query: 'costos', highlight: ['costos'] };
    let stack: Screen[] = [{ name: 'menu' }, { name: 'learn' }, archive];
    stack = openLesson(stack, 'costos', 560);
    stack = openLesson(stack, 'ingresos');
    stack = openLesson(stack, 'flujo-caja');
    expect(stack).toHaveLength(4);
    expect(returnToArchive(stack)).toEqual([
      { name: 'menu' }, { name: 'learn' }, { ...archive, scrollY: 560, focusId: 'costos' },
    ]);
  });

  it('permite consultar lecciones sin perder la respuesta ni acumular pantallas', () => {
    let stack: Screen[] = openLesson([{ name: 'menu' }, { name: 'archive', mode: 'macro', query: 'inflacion' }], 'inflacion', 120);
    stack = startStudyPractice(stack, 'inflacion');
    const quiz = stack[stack.length - 1];
    if (quiz.name !== 'quiz') throw new Error('Falta la práctica');
    const answeredQuiz: Screen = { ...quiz, progress: { ...quiz.progress, picked: 1, checked: true, correct: 1, answered: 1 } };
    stack = [...stack.slice(0, -1), answeredQuiz];
    const beforeReference = stack;
    for (let i = 0; i < 20; i++) {
      stack = openLesson(stack, 'inflacion');
      stack = openLesson(stack, 'monetaria');
      expect(stack).toHaveLength(beforeReference.length + 1);
      stack = startStudyPractice(stack, 'monetaria');
      expect(stack).toEqual(beforeReference);
    }
    const reference = openLesson(stack, 'fiscal');
    expect(returnToArchive(reference)).toEqual(beforeReference.slice(0, 2));
  });

  it('abre un archivo del área correcta desde el registro y conserva ese origen', () => {
    const stack = openLesson([{ name: 'menu' }, { name: 'analysis' }], 'flujo-caja');
    expect(returnToArchive(stack)).toEqual([
      { name: 'menu' }, { name: 'analysis' }, { name: 'archive', mode: 'micro' },
    ]);
  });

  it('ignora una lección inexistente sin romper el recorrido', () => {
    const stack: Screen[] = [{ name: 'menu' }];
    expect(openLesson(stack, 'no-existe')).toBe(stack);
  });
});

describe('búsqueda y práctica por área', () => {
  it('encuentra palabras sin tildes y respeta el filtro seleccionado', () => {
    expect(filterLessons('macro', '  INFLACION  ').map((lesson) => lesson.id)).toContain('inflacion');
    expect(filterLessons('micro', 'inflacion')).toEqual([]);
    expect(filterLessons('all', 'interes').map((lesson) => lesson.mode)).toContain('micro');
    expect(filterLessons('all', '')).toHaveLength(STUDY.length);
    expect(filterLessons('macro', '')).toHaveLength(STUDY.filter((lesson) => lesson.mode === 'macro').length);
  });

  it('empieza por el concepto elegido y mantiene las preguntas dentro de su área', () => {
    for (const lesson of STUDY) {
      const progress = createQuizProgress(lesson.id);
      expect(progress.questionIds.length).toBeGreaterThan(0);
      expect(new Set(progress.questionIds).size).toBe(progress.questionIds.length);
      const questions = progress.questionIds.map((id) => QUESTIONS.find((question) => question.id === id)!);
      expect(questions.every((question) => question.mode === lesson.mode)).toBe(true);
      if (QUESTIONS.some((question) => question.studyId === lesson.id)) {
        expect(questions[0].studyId).toBe(lesson.id);
      }
    }
  });
});
