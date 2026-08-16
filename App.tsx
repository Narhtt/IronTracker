import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ProgramSession } from './core/types';
import { THEMES, STORAGE_KEYS } from './core/constants';
import { triggerHaptic } from './core/utils';
import { storage } from './services/storage';

// Store & Hooks
import { useStore } from './store/useStore';
import { useTimer } from './hooks/useTimer';
import { usePWA } from './hooks/usePWA';

// Views & Layouts
import { Modal } from './components/ui/Modal';
import { ConfirmationModal } from './components/ui/ConfirmationModal';
import { ToastHost } from './components/ui/ToastHost';
import { AppHeader } from './components/common/AppHeader';
import { RestTimerOverlay } from './components/common/RestTimerOverlay';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { WorkoutToolsModal } from './components/common/WorkoutToolsModal';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Icons } from './components/icons/Icons';

// Lazy Features (Feature-Based Architecture)
const AnalyticsView = React.lazy(() => import('./features/analytics/AnalyticsView').then((m) => ({ default: m.AnalyticsView })));
const DashboardView = React.lazy(() => import('./features/dashboard/DashboardView').then((m) => ({ default: m.DashboardView })));
const WorkoutView = React.lazy(() => import('./features/workout/WorkoutView').then((m) => ({ default: m.WorkoutView })));
const ProgramsView = React.lazy(() => import('./features/programs/ProgramsView').then((m) => ({ default: m.ProgramsView })));
const ProgramEditorView = React.lazy(() => import('./features/programs/ProgramEditorView').then((m) => ({ default: m.ProgramEditorView })));
const LibraryView = React.lazy(() => import('./features/library/LibraryView').then((m) => ({ default: m.LibraryView })));
const SettingsView = React.lazy(() => import('./features/settings/SettingsView').then((m) => ({ default: m.SettingsView })));
const HistoryEditorView = React.lazy(() => import('./features/history/HistoryEditorView').then((m) => ({ default: m.HistoryEditorView })));

// New History Hub (Replaces RecordsView)
const HistoryHubView = React.lazy(() => import('./features/history/HistoryHubView').then((m) => ({ default: m.HistoryHubView })));

export default function App() {
  // Global State
  const history = useStore((s) => s.history);
  const session = useStore((s) => s.session);
  const accentColor = useStore((s) => s.accentColor);
  const themeMode = useStore((s) => s.themeMode);
  const setSession = useStore((s) => s.setSession);
  const initData = useStore((s) => s.initData);
  const library = useStore((s) => s.library);
  const isLoaded = useStore((s) => s.isLoaded);

  // Persistence Subscription
  const sessionSaveTimer = useRef<number | null>(null);

  useEffect(() => {
    initData();
    const { pushToast } = useStore.getState();

    const reportIfFailed = (res: { ok: boolean; reason?: string }, label: string) => {
      if (res.ok) return;
      pushToast(
        'error',
        res.reason === 'quota'
          ? `Stockage plein : ${label} n'a pas pu être sauvegardé(e). Libère de l'espace (ex. exporter puis purger l'historique) pour éviter de perdre des données.`
          : `Erreur lors de la sauvegarde : ${label}.`
      );
    };

    const unsub = useStore.subscribe((state, prevState) => {
      if (state.history !== prevState.history) reportIfFailed(storage.history.save(state.history), "l'historique");
      if (state.library !== prevState.library) reportIfFailed(storage.library.save(state.library), 'la bibliothèque');
      if (state.programs !== prevState.programs) reportIfFailed(storage.programs.save(state.programs), 'les programmes');
      if (state.accentColor !== prevState.accentColor) storage.theme.save(state.accentColor);
      if (state.themeMode !== prevState.themeMode) localStorage.setItem(STORAGE_KEYS.THEME_MODE, state.themeMode);

      if (state.session !== prevState.session) {
        if (sessionSaveTimer.current !== null) {
          window.clearTimeout(sessionSaveTimer.current);
          sessionSaveTimer.current = null;
        }
        if (state.session === null) {
          // Clearing the session (end/cancel workout) must persist immediately.
          reportIfFailed(storage.session.save(null), 'la séance en cours');
        } else {
          // Debounce writes during active logging (rapid weight/rep entry) to
          // avoid a compress+stringify pass on every keystroke on low-end mobile.
          sessionSaveTimer.current = window.setTimeout(() => {
            reportIfFailed(storage.session.save(useStore.getState().session), 'la séance en cours');
            sessionSaveTimer.current = null;
          }, 400);
        }
      }
    });

    return () => {
      unsub();
      if (sessionSaveTimer.current !== null) window.clearTimeout(sessionSaveTimer.current);
    };
  }, [initData]);

  // Global Accent Theme Injection
  useEffect(() => {
    const theme = THEMES[accentColor] || THEMES.blue;
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '88 166 255';
    };
    const rgbTriplet = hexToRgb(theme.primary);
    document.documentElement.style.setProperty('--primary', rgbTriplet);
    document.documentElement.style.setProperty('--primary-css', `rgb(${rgbTriplet.split(' ').join(', ')})`);
    document.documentElement.style.setProperty('--primary-glow', theme.glow);
  }, [accentColor]);

  // Global Light/Dark Mode Injection
  useEffect(() => {
    const html = document.documentElement;
    if (themeMode === 'light') {
      html.classList.remove('dark');
      html.classList.add('light');
      // Force meta theme color for OS status bar
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f1f5f9');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#020617');
    }
  }, [themeMode]);

  // Timers (Global to App for persistence across views)
  const { timerString, restTarget, setRestTarget, restTime, showGo } = useTimer();

  const { installPrompt } = usePWA();
  const navigate = useNavigate();
  const location = useLocation();

  // --- SERVICE WORKER BRIDGE (Notification Click Handler) ---
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      // Écoute les messages de type 'NAVIGATE_TO' envoyés par le SW
      if (event.data && event.data.type === 'NAVIGATE_TO' && event.data.url) {
        // Navigation interne React Router (SPA) sans rechargement
        navigate(event.data.url);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [navigate]);

  // Local UI State
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [previewSession, setPreviewSession] = useState<{ programName: string; session: ProgramSession; mode?: 'active' | 'log' } | null>(
    null
  );

  // Feedback State (Visual for iOS/Silent)
  const [feedbackClass, setFeedbackClass] = useState<string>('');

  // VISUAL FEEDBACK LISTENER (For devices without vibration)
  useEffect(() => {
    const handleFeedback = (e: Event) => {
      const customEv = e as CustomEvent<string>;
      const type = customEv.detail;
      const isVisualOn = localStorage.getItem(STORAGE_KEYS.VISUAL_FEEDBACK) !== 'false';
      const isSessionOn = localStorage.getItem(STORAGE_KEYS.HAPTIC_SESSION) !== 'false';

      let shouldFlash = false;
      if (!isVisualOn) return;

      if (type === 'click' || type === 'tick') {
        shouldFlash = false;
      } else if (type === 'success' || type === 'warning' || type === 'error') {
        if (isSessionOn) shouldFlash = true;
      }

      if (shouldFlash) {
        setFeedbackClass('');
        setTimeout(() => {
          if (type === 'success') setFeedbackClass('animate-flash-success');
          else if (type === 'warning') setFeedbackClass('animate-flash-warning');
          else if (type === 'error') setFeedbackClass('animate-flash-error');
        }, 10);
        setTimeout(() => setFeedbackClass(''), 600);
      }
    };

    window.addEventListener('feedback-trigger', handleFeedback);
    return () => window.removeEventListener('feedback-trigger', handleFeedback);
  }, []);

  useEffect(() => {
    setShowToolsModal(false);
  }, [location.pathname]);

  const startSession = (progName: string, sess: ProgramSession, mode: 'active' | 'log' = 'active') => {
    triggerHaptic('success');
    const newSessionPayload: WorkoutSession = {
      id: crypto.randomUUID(),
      programName: progName,
      sessionName: sess.name,
      startTime: Date.now(),
      bodyWeight: history[0]?.bodyWeight || '',
      fatigue: '3',
      mode: mode,
      exercises: sess.exos.map((e) => ({
        exerciseId: e.exerciseId,
        target: `${e.sets} x ${e.reps}`,
        rest: e.rest,
        targetRir: e.targetRir,
        isBonus: false,
        notes: '',
        sets: Array(e.sets)
          .fill(null)
          .map(() => ({ weight: '', reps: '', done: false, rir: e.targetRir || '' })),
      })),
    };
    setSession(newSessionPayload);
    if (previewSession) {
      setPreviewSession(null);
      setTimeout(() => {
        navigate('/workout');
      }, 100);
    } else {
      navigate('/workout');
    }
  };

  const isWorkoutView = location.pathname === '/workout';

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 pb-safe relative transition-colors duration-300">
      {/* VISUAL FEEDBACK OVERLAY (Pointer events none) */}
      <div className={`fixed inset-0 pointer-events-none z-[100] ${feedbackClass}`}></div>

      <AppHeader session={session} timerString={timerString} restTarget={restTarget} restTime={restTime} setRestTarget={setRestTarget} />

      <main className="pt-20 px-4 max-w-lg mx-auto min-h-screen pb-12">
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<DashboardView onStartSession={startSession} onOpenTools={() => setShowToolsModal(true)} />} />
              <Route path="/workout" element={session ? <WorkoutView /> : <Navigate to="/" />} />
              <Route path="/analytics" element={<AnalyticsView />} />
              <Route
                path="/programs"
                element={
                  <ProgramsView onStartPreview={(name, sess) => setPreviewSession({ programName: name, session: sess, mode: 'active' })} />
                }
              />
              <Route path="/programs/edit/:id" element={<ProgramEditorView />} />
              <Route path="/library" element={<LibraryView />} />
              <Route path="/settings" element={<SettingsView installPrompt={installPrompt} />} />
              <Route path="/history" element={<HistoryHubView onStartSession={startSession} />} />
              <Route path="/records" element={<Navigate to="/history?tab=records" replace />} />
              <Route path="/history/edit/:id" element={<HistoryEditorView />} />
              {/* Redirect old tools routes to Dashboard */}
              <Route path="/tools/*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* GLOBAL REST TIMER OVERLAY */}
      {isWorkoutView && <RestTimerOverlay restTime={restTime} showGo={showGo} setRestTarget={setRestTarget} />}

      {/* PREVIEW MODAL */}
      {previewSession && (
        <Modal title="Aperçu" onClose={() => setPreviewSession(null)}>
          <div className="space-y-6">
            <div className="text-center pb-2 border-b border-white/5">
              <div className="text-[10px] uppercase font-black text-primary tracking-widest mb-1 border border-primary/30 px-2 py-0.5 rounded-full bg-primary/5 inline-block">
                {previewSession.programName}
              </div>
              <div className="font-black italic text-2xl text-foreground mt-1">{previewSession.session.name}</div>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
              {previewSession.session.exos.map((ex, idx) => {
                const libEx = library.find((l) => l.id === ex.exerciseId);
                return (
                  <div key={idx} className="bg-surface2/30 border border-white/5 p-3 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-secondary text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground">{libEx?.name || `Exo #${ex.exerciseId}`}</div>
                        <div className="text-[10px] text-secondary uppercase font-bold">{libEx?.muscle}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-foreground font-mono font-bold text-sm bg-surface2 px-2 py-1 rounded-lg border border-white/5">
                        {ex.sets} x {ex.reps}
                      </div>
                      <div className="text-[9px] text-secondary mt-1">{ex.rest}s</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => startSession(previewSession.programName, previewSession.session, previewSession.mode)}
              className="w-full h-16 rounded-[1.5rem] bg-primary text-white flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.4)] active:scale-95 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <Icons.Play size={28} fill="currentColor" className="text-white drop-shadow-md" />
              <span className="ml-2 font-black italic text-lg tracking-wider">START</span>
            </button>
          </div>
        </Modal>
      )}

      {showToolsModal && <WorkoutToolsModal onClose={() => setShowToolsModal(false)} />}
      <ConfirmationModal />
      <ToastHost />
    </div>
  );
}
