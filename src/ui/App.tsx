import { useCallback, useEffect, useMemo, useState } from 'react';
import { cardById, scenarioById, scenariosFor } from '../data';
import { advance, beginPlay, createGame, decide, recordStudyVisit } from '../engine/engine';
import { load, save, type SaveData } from '../engine/storage';
import type { GameState, Mode, OptionKey } from '../engine/types';
import { CardDetail, Modal } from './components/CardDetail';
import { GameScreen } from './screens/GameScreen';
import { InstructionsScreen, PracticeCardScreen } from './screens/Instructions';
import { HomeScreen, MenuScreen, ScenarioScreen } from './screens/Intro';
import { AnalysisScreen, EndScreen } from './screens/Results';
import { ArchiveScreen, FicheScreen, QuizScreen } from './screens/Study';

type Screen =
  | { name: 'home' }
  | { name: 'menu' }
  | { name: 'play' }
  | { name: 'instructions' }
  | { name: 'practice'; mode: Mode }
  | { name: 'archive'; mode: Mode; highlight?: string[] }
  | { name: 'fiche'; id: string }
  | { name: 'quiz'; studyId?: string; mode?: Mode }
  | { name: 'end' }
  | { name: 'analysis' };

type DetailState = { cardId: string; turn?: number; source: 'game' | 'last' | 'none' } | null;

export default function App() {
  const [data, setData] = useState<SaveData>(() => load());
  const [stack, setStack] = useState<Screen[]>(() => [data.playerName ? { name: 'menu' } : { name: 'home' }]);
  const [paused, setPaused] = useState(false);
  const [confirmMode, setConfirmMode] = useState<Mode | null>(null);
  const [detail, setDetail] = useState<DetailState>(null);

  // Guardado local tras cada cambio de estado (decisión, pausa, estudio, consecuencia).
  useEffect(() => save(data), [data]);

  const screen = stack[stack.length - 1];
  const push = useCallback((s: Screen) => setStack((st) => [...st, s]), []);
  const back = useCallback(() => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)), []);
  const reset = useCallback((...s: Screen[]) => setStack(s), []);

  const game = data.game;
  const last = data.lastFinished;
  const setGame = (g: GameState | undefined) => setData((d) => ({ ...d, game: g }));

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', data.settings.reduceMotion);
  }, [data.settings.reduceMotion]);

  // Escape abre/cierra la pausa durante la partida.
  useEffect(() => {
    if (screen.name !== 'play' || !game || game.phase === 'scenario') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !detail) setPaused((p) => !p);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen.name, game, detail]);

  const startNew = (mode: Mode) => {
    const g = createGame({ playerName: data.playerName, mode });
    setData((d) => ({ ...d, game: g }));
    setPaused(false);
    reset({ name: 'menu' }, { name: 'play' });
  };

  const requestMode = (mode: Mode) => {
    if (game && game.status === 'active') setConfirmMode(mode);
    else startNew(mode);
  };

  const onDecide = (key: OptionKey) => {
    if (!game || game.phase !== 'card') return;
    setGame(decide(game, key));
  };

  const onNext = () => {
    if (!game) return;
    const g = advance(game);
    if (g.phase === 'ended') {
      setData((d) => ({ ...d, game: undefined, lastFinished: g }));
      reset({ name: 'menu' }, { name: 'end' });
    } else setGame(g);
  };

  const openFiche = (id: string) => {
    if (game && game.status === 'active') setGame(recordStudyVisit(game, id));
    push({ name: 'fiche', id });
  };

  const resumeGame = () => {
    setPaused(false);
    reset({ name: 'menu' }, { name: 'play' });
  };

  const scenarioOfDetail = useMemo(() => {
    if (!detail) return undefined;
    const src = detail.source === 'last' ? last : detail.source === 'game' ? game : undefined;
    if (src) return scenarioById(src.scenarioId);
    const mode: Mode = detail.cardId.startsWith('MA') ? 'macro' : 'micro';
    return scenariosFor(mode)[0];
  }, [detail, game, last]);

  const detailEntry = detail?.turn !== undefined
    ? (detail.source === 'last' ? last : game)?.history.find((h) => h.turn === detail.turn)
    : undefined;

  const view = (() => {
    switch (screen.name) {
      case 'home':
        return (
          <HomeScreen
            initialName={data.playerName}
            onEnter={(name) => {
              setData((d) => ({ ...d, playerName: name, game: d.game ? { ...d.game, playerName: name } : d.game }));
              reset({ name: 'menu' });
            }}
          />
        );
      case 'menu':
        return (
          <MenuScreen
            name={data.playerName}
            active={game}
            activeScenario={game ? scenarioById(game.scenarioId) : undefined}
            hasLast={!!last}
            reduceMotion={data.settings.reduceMotion}
            onMode={requestMode}
            onResume={resumeGame}
            onArchive={() => push({ name: 'archive', mode: game?.mode ?? 'macro' })}
            onLast={() => push({ name: 'analysis' })}
            onInstructions={() => push({ name: 'instructions' })}
            onChangeName={() => reset({ name: 'home' })}
            onToggleMotion={() => setData((d) => ({ ...d, settings: { ...d.settings, reduceMotion: !d.settings.reduceMotion } }))}
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
              onInstructions={() => push({ name: 'instructions' })}
              onMenu={() => reset({ name: 'menu' })}
            />
          );
        }
        return (
          <GameScreen
            game={game}
            scenario={scenario}
            reduceMotion={data.settings.reduceMotion}
            onDecide={onDecide}
            onNext={onNext}
            onPause={() => setPaused(true)}
            onStudy={() => {
              const card = game.deck[Math.min(game.phase === 'consequence' ? game.turn - 1 : game.turn, 19)];
              const ids = card ? cardById(card).studyIds : [];
              push({ name: 'archive', mode: game.mode, highlight: ids });
            }}
            onConcept={openFiche}
          />
        );
      }
      case 'instructions':
        return (
          <InstructionsScreen
            mode={game?.mode}
            canStart={!!game}
            onPractice={() => push({ name: 'practice', mode: game?.mode ?? 'macro' })}
            onStart={() => {
              if (game && game.phase === 'scenario') setGame(beginPlay(game));
              resumeGame();
            }}
            onBack={back}
          />
        );
      case 'practice':
        return <PracticeCardScreen mode={screen.mode} onBack={back} />;
      case 'archive': {
        const fromGame = stack.some((s) => s.name === 'play') && !!game;
        return (
          <ArchiveScreen
            initialMode={screen.mode}
            highlight={screen.highlight}
            resumeLabel={fromGame ? 'Retomar partida' : 'Volver'}
            onOpen={openFiche}
            onBack={fromGame ? resumeGame : back}
          />
        );
      }
      case 'fiche':
        return (
          <FicheScreen
            id={screen.id}
            canResume={!!game}
            onPractice={(studyId) => push({ name: 'quiz', studyId })}
            onArchive={() => {
              const prev = stack[stack.length - 2];
              if (prev?.name === 'archive') back();
              else push({ name: 'archive', mode: screen.id && game ? game.mode : 'macro' });
            }}
            onResume={resumeGame}
            onCard={(cardId) => setDetail({ cardId, source: game ? 'game' : 'none' })}
          />
        );
      case 'quiz':
        return <QuizScreen studyId={screen.studyId} mode={screen.mode} onBack={back} onFiche={(id) => push({ name: 'fiche', id })} />;
      case 'end': {
        if (!last) return null;
        return (
          <EndScreen
            game={last}
            scenario={scenarioById(last.scenarioId)}
            onAnalysis={() => push({ name: 'analysis' })}
            onNew={() => startNew(last.mode)}
            onStudy={(id) => push({ name: 'fiche', id })}
            onMenu={() => reset({ name: 'menu' })}
          />
        );
      }
      case 'analysis': {
        if (!last) return null;
        return (
          <AnalysisScreen
            game={last}
            scenario={scenarioById(last.scenarioId)}
            onCard={(turn) => setDetail({ cardId: last.history[turn - 1].cardId, turn, source: 'last' })}
            onConcept={(id) => push({ name: 'fiche', id })}
            onNew={() => requestMode(last.mode)}
            onMenu={() => reset({ name: 'menu' })}
          />
        );
      }
    }
  })();

  return (
    <div className="app">
      <main className="main">{view}</main>

      {paused && screen.name === 'play' && game && (
        <Modal title="Pausa" onClose={() => setPaused(false)}>
          <div className="pause">
            <h2>Pausa</h2>
            <p>Tu turno quedó guardado: carta {Math.min(game.turn + (game.phase === 'card' ? 1 : 0), 20)} de 20.</p>
            <div className="stack">
              <button className="btn btn-primary" onClick={() => setPaused(false)} autoFocus>Retomar</button>
              <button className="btn" onClick={() => { setPaused(false); push({ name: 'archive', mode: game.mode }); }}>Estudiar</button>
              <button className="btn" onClick={() => { setPaused(false); push({ name: 'instructions' }); }}>Instrucciones</button>
              <button className="btn btn-ghost" onClick={() => { setPaused(false); reset({ name: 'menu' }); }}>Volver al menú</button>
            </div>
          </div>
        </Modal>
      )}

      {confirmMode && (
        <Modal title="Reemplazar partida" onClose={() => setConfirmMode(null)}>
          <div className="pause">
            <h2>¿Comenzar otra partida?</h2>
            <p>Tenés una partida sin terminar. Si comenzás otra, se reemplaza.</p>
            <div className="row">
              <button className="btn" onClick={() => setConfirmMode(null)} autoFocus>Cancelar</button>
              <button className="btn btn-primary" onClick={() => { const m = confirmMode; setConfirmMode(null); startNew(m); }}>Comenzar otra</button>
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
