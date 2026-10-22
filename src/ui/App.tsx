import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cardById, scenarioById } from '../data';
import { advance, beginPlay, createGame, decide, recordStudyVisit } from '../engine/engine';
import { load, save, type SaveData, type Settings } from '../engine/storage';
import type { GameState, Mode, OptionKey } from '../engine/types';
import { CardDetail, Modal } from './components/CardDetail';
import { MusicController, type MusicControlHandle } from './components/MusicToggle';
import { GameScreen } from './screens/GameScreen';
import { InstructionsScreen, PracticeCardScreen } from './screens/Instructions';
import { HomeScreen, LearnHub, MenuScreen, ModeSelectScreen, ScenarioScreen } from './screens/Intro';
import { AnalysisScreen, EndScreen } from './screens/Results';
import { ArchiveScreen, FicheScreen, QuizScreen } from './screens/Study';
import { SettingsScreen } from './screens/Settings';
import { openLesson, returnToArchive, startStudyPractice, type Screen } from './studyNavigation';

type DetailState = { cardId: string; turn?: number; source: 'game' | 'last' | 'none' } | null;

export default function App() {
  const [data, setData] = useState<SaveData>(() => load());
  const [stack, setStack] = useState<Screen[]>([{ name: 'title' }]);
  const [paused, setPaused] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [draftGame, setDraftGame] = useState<GameState>();
  const [preferredMode, setPreferredMode] = useState<Mode>('macro');
  const [detail, setDetail] = useState<DetailState>(null);
  const [systemReduceMotion, setSystemReduceMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const musicControl = useRef<MusicControlHandle>(null);
  const [musicError, setMusicError] = useState('');
  const reduceMotion = data.settings.motionPreference === 'reduced'
    || (data.settings.motionPreference === 'system' && systemReduceMotion);

  useEffect(() => save(data), [data]);

  const screen = stack[stack.length - 1];
  const push = useCallback((next: Screen) => setStack((current) => [...current, next]), []);
  const back = useCallback(() => setStack((current) => current.length > 1 ? current.slice(0, -1) : current), []);
  const reset = useCallback((...screens: Screen[]) => setStack(screens), []);
  const game = data.game;
  const last = data.lastFinished;
  const setGame = (next: GameState | undefined) => setData((current) => ({ ...current, game: next }));

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => setSystemReduceMotion(event.matches);
    setSystemReduceMotion(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (screen.name !== 'play' || !game || game.phase === 'scenario') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !detail && !document.querySelector('dialog[open]')) setPaused((current) => !current);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen.name, game, detail]);

  const setupNew = (mode: Mode, name: string) => {
    const playerName = name.trim().slice(0, 40);
    if (!playerName) return;
    setPreferredMode(mode);
    setData((current) => ({
      ...current,
      playerName,
      game: current.game ? { ...current.game, playerName } : current.game,
    }));
    setDraftGame(createGame({ playerName, mode }));
    push({ name: 'scenario' });
  };

  const beginDraft = () => {
    if (!draftGame) return;
    const started = beginPlay({ ...draftGame, updatedAt: Date.now() });
    setData((current) => ({ ...current, game: started }));
    setDraftGame(undefined);
    setConfirmReplace(false);
    setPaused(false);
    reset({ name: 'menu' }, { name: 'play' });
  };

  const requestBeginDraft = () => {
    if (!draftGame) return;
    if (game?.status === 'active') setConfirmReplace(true);
    else beginDraft();
  };

  const openNewGame = (mode: Mode = last?.mode ?? 'macro') => {
    setPreferredMode(mode);
    push({ name: 'setup' });
  };

  const resumeGame = () => {
    setPaused(false);
    setConfirmReplace(false);
    reset({ name: 'menu' }, { name: 'play' });
  };

  const onDecide = (key: OptionKey) => {
    if (!game || game.phase !== 'card') return;
    setGame(decide(game, key));
  };

  const onNext = () => {
    if (!game) return;
    const next = advance(game);
    if (next.phase === 'ended') {
      setData((current) => ({ ...current, game: undefined, lastFinished: next }));
      reset({ name: 'menu' }, { name: 'end' });
    } else setGame(next);
  };

  const openFiche = (id: string) => {
    setData((current) => current.game?.status === 'active'
      ? { ...current, game: recordStudyVisit(current.game, id) } : current);
    const scrollY = window.scrollY;
    setStack((current) => openLesson(current, id, scrollY));
  };

  const scenarioOfDetail = useMemo(() => {
    if (!detail) return undefined;
    const source = detail.source === 'last' ? last : detail.source === 'game' ? game : undefined;
    return source ? scenarioById(source.scenarioId) : undefined;
  }, [detail, game, last]);

  const detailEntry = detail?.turn !== undefined
    ? (detail.source === 'last' ? last : game)?.history.find((entry) => entry.turn === detail.turn)
    : undefined;

  const view = (() => {
    switch (screen.name) {
      case 'title':
        return (
          <HomeScreen onEnter={() => {
            if (data.settings.musicEnabled) musicControl.current?.resumeIfEnabled();
            push({ name: 'menu' });
          }} />
        );
      case 'menu':
        return (
          <MenuScreen
            name={data.playerName}
            active={game}
            activeScenario={game ? scenarioById(game.scenarioId) : undefined}
            hasLast={!!last}
            onNewGame={() => openNewGame()}
            onResume={resumeGame}
            onLearn={() => push({ name: 'learn' })}
            onSettings={() => push({ name: 'settings' })}
            onLast={() => push({ name: 'analysis' })}
          />
        );
      case 'setup':
        return (
          <ModeSelectScreen
            initialName={data.playerName}
            initialMode={preferredMode}
            onContinue={setupNew}
            onBack={back}
          />
        );
      case 'scenario':
        return draftGame ? (
          <ScenarioScreen
            game={draftGame}
            scenario={scenarioById(draftGame.scenarioId)}
            onStart={requestBeginDraft}
            onBack={() => { setDraftGame(undefined); back(); }}
          />
        ) : null;
      case 'learn':
        return (
          <LearnHub
            name={data.playerName}
            onInstructions={() => push({ name: 'instructions' })}
            onPractice={() => push({ name: 'practice', mode: game?.mode ?? preferredMode })}
            onArchive={() => push({ name: 'archive', mode: game?.mode ?? preferredMode })}
            onBack={back}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            name={data.playerName}
            settings={data.settings}
            musicError={musicError}
            onNameChange={(playerName) => setData((current) => ({
              ...current,
              playerName,
              game: current.game ? { ...current.game, playerName } : current.game,
            }))}
            onSettingsChange={(settings: Partial<Settings>) => {
              if (settings.musicEnabled !== undefined) musicControl.current?.setEnabled(settings.musicEnabled);
              setData((current) => ({ ...current, settings: { ...current.settings, ...settings } }));
            }}
            onBack={back}
          />
        );
      case 'play': {
        if (!game) return null;
        const scenario = scenarioById(game.scenarioId);
        if (game.phase === 'scenario') {
          return (
            <ScenarioScreen
              game={game}
              scenario={scenario}
              onStart={() => setGame(beginPlay(game))}
              onBack={() => reset({ name: 'menu' })}
            />
          );
        }
        return (
          <GameScreen
            game={game}
            scenario={scenario}
            reduceMotion={reduceMotion}
            onDecide={onDecide}
            onNext={onNext}
            onPause={() => setPaused(true)}
            onStudy={() => {
              const card = game.deck[Math.min(game.phase === 'consequence' ? game.turn - 1 : game.turn, 19)];
              const related = card ? cardById(card).studyIds : [];
              push({ name: 'archive', mode: game.mode, highlight: related });
            }}
          />
        );
      }
      case 'instructions':
        return (
          <InstructionsScreen
            canStart={!!game}
            onPractice={() => push({ name: 'practice', mode: game?.mode ?? preferredMode })}
            onStart={() => resumeGame()}
            onBack={back}
          />
        );
      case 'practice':
        return <PracticeCardScreen key={screen.mode} mode={screen.mode} reduceMotion={reduceMotion} onBack={back} />;
      case 'archive': {
        const origin = stack[stack.length - 2]?.name;
        const backLabel = origin === 'learn' ? 'Volver a Aprender'
          : origin === 'analysis' ? 'Volver al registro'
            : origin === 'end' ? 'Volver al resultado' : 'Volver al menú';
        return (
          <ArchiveScreen
            location={screen}
            canResume={game?.status === 'active'}
            backLabel={backLabel}
            onChange={(update) => setStack((current) => current.map((item, index) =>
              index === current.length - 1 && item.name === 'archive' ? { ...item, ...update } : item))}
            onOpen={openFiche}
            onBack={origin === 'learn' || origin === 'analysis' || origin === 'end' ? back : () => reset({ name: 'menu' })}
            onResume={resumeGame}
          />
        );
      }
      case 'fiche':
        return (
          <FicheScreen
            id={screen.id}
            canResume={game?.status === 'active'}
            reviewingPractice={stack[stack.length - 2]?.name === 'quiz'}
            onPractice={(studyId) => setStack((current) => startStudyPractice(current, studyId))}
            onArchive={() => setStack(returnToArchive)}
            onResume={resumeGame}
            onLesson={openFiche}
          />
        );
      case 'quiz':
        return <QuizScreen studyId={screen.studyId} progress={screen.progress}
          canResume={game?.status === 'active'} onResume={resumeGame}
          onChange={(progress) => setStack((current) => current.map((item, index) =>
            index === current.length - 1 && item.name === 'quiz' ? { ...item, progress } : item))}
          onBack={() => openFiche(screen.studyId)} onArchive={() => setStack(returnToArchive)} onFiche={openFiche} />;
      case 'end':
        if (!last) return null;
        return (
          <EndScreen
            game={last}
            scenario={scenarioById(last.scenarioId)}
            onAnalysis={() => push({ name: 'analysis' })}
            onNew={() => openNewGame(last.mode)}
            onStudy={openFiche}
            onMenu={() => reset({ name: 'menu' })}
          />
        );
      case 'analysis':
        if (!last) return null;
        return (
          <AnalysisScreen
            game={last}
            scenario={scenarioById(last.scenarioId)}
            onCard={(turn) => setDetail({ cardId: last.history[turn - 1].cardId, turn, source: 'last' })}
            onConcept={openFiche}
            onNew={() => openNewGame(last.mode)}
            onMenu={() => reset({ name: 'menu' })}
          />
        );
    }
  })();

  return (
    <div className="app-shell" data-playing={screen.name === 'practice' || (screen.name === 'play' && game?.phase !== 'scenario') ? 'true' : 'false'} data-reduce-motion={reduceMotion ? 'true' : 'false'}>
      <MusicController
        ref={musicControl}
        enabled={data.settings.musicEnabled}
        onErrorChange={setMusicError}
        onEnabledChange={(musicEnabled) => setData((current) => ({
          ...current,
          settings: { ...current.settings, musicEnabled },
        }))}
      />
      <main className="main">{view}</main>

      {paused && screen.name === 'play' && game && (
        <Modal title="Pausa" onClose={() => setPaused(false)}>
          <div className="pause">
            <h2>La partida espera</h2>
            <p>Tu turno quedó guardado: carta {Math.min(game.turn + (game.phase === 'card' ? 1 : 0), 20)} de 20.</p>
            <div className="stack">
              <button className="btn btn-primary" onClick={() => setPaused(false)} autoFocus>Continuar</button>
              <button className="btn" onClick={() => { setPaused(false); push({ name: 'archive', mode: game.mode }); }}>Estudiar</button>
              <button className="btn" onClick={() => { setPaused(false); push({ name: 'settings' }); }}>Ajustes</button>
              <button className="btn btn-ghost" onClick={() => { setPaused(false); reset({ name: 'menu' }); }}>Menú principal</button>
            </div>
          </div>
        </Modal>
      )}

      {confirmReplace && draftGame && (
        <Modal title="Reemplazar partida" onClose={() => setConfirmReplace(false)}>
          <div className="pause">
            <h2>¿Comenzar una nueva gestión?</h2>
            <p>Ya hay una gestión sin terminar. Si continuás, esta nueva partida ocupará su lugar.</p>
            <div className="row">
              <button className="btn" onClick={() => setConfirmReplace(false)} autoFocus>Seguir con mi partida</button>
              <button className="btn btn-primary" onClick={beginDraft}>Reemplazar y comenzar</button>
            </div>
          </div>
        </Modal>
      )}

      {detail && scenarioOfDetail && (
        <CardDetail
          cardId={detail.cardId}
          scenario={scenarioOfDetail}
          entry={detailEntry}
          onClose={() => setDetail(null)}
          onConcept={(id) => { setDetail(null); openFiche(id); }}
        />
      )}
    </div>
  );
}
