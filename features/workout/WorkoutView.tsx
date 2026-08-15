import React, { useState, useMemo } from 'react';
import { useWorkoutManager } from './hooks/useWorkoutManager';
import { Modal } from '../../components/ui/Modal';
import { Icons } from '../../components/icons/Icons';
import { WorkoutToolsModal } from '../../components/common/WorkoutToolsModal';
import { WarmupModal } from '../../components/common/WarmupModal';
import { ExerciseDetailModal } from '../library/components/ExerciseDetailModal';
import { BodyMeasurementsModal } from '../tools/BodyMeasurementsModal';
import { triggerHaptic, getExerciseStats, ExerciseStats } from '../../core/utils';
import { FATIGUE_COLORS, TYPE_COLORS } from '../../core/constants';
import { EQUIPMENTS } from '../../core/data/equipments';
import { ExerciseCard } from './components/ExerciseCard';
import { LibraryExercise, ExerciseType } from '../../core/types';
import { EXERCISE_TYPE_LIST } from '../../core/data/exerciseTypes';
import { useStore } from '../../store/useStore';

export const WorkoutView: React.FC = () => {
  const weightUnit = useStore((s) => s.weightUnit);
  const {
    session,
    isLogMode,
    library,
    history,
    getExerciseById,
    updateSet,
    addSet,
    removeSet,
    removeExercise,
    moveExercise,
    addExercise,
    generateWarmup,
    cancelSession,
    finishSession,
    updateSessionSettings,
    updateExerciseNotes,
  } = useWorkoutManager();

  // UI State
  const [activeDetailExoIdx, setActiveDetailExoIdx] = useState<number | null>(null);
  const [showAddExoModal, setShowAddExoModal] = useState(false);
  const [showSessionSettings, setShowSessionSettings] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState('');

  // Tools State
  const [toolsState, setToolsState] = useState<{ open: boolean; target?: string }>({ open: false });
  const [logDuration, setLogDuration] = useState<string>('60');

  // Warmup Selection State
  const [warmupTargetExo, setWarmupTargetExo] = useState<number | null>(null);

  // Editing State (For Exercise Library Item)
  const [editingLibExercise, setEditingLibExercise] = useState<LibraryExercise | null>(null);

  const EMPTY_STATS: ExerciseStats = {
    pr: 0,
    prMax: 0,
    maxDuration: 0,
    maxDistance: 0,
    lastDetailed: '-',
    lastSessionString: '-',
    prSessionString: '-',
    lastSessionVolume: 0,
    lastBestSet: null,
  };

  // Helpers for MUSCLE_ORDER
  const MUSCLE_ORDER = [
    'Pectoraux',
    'Dos',
    'Quadriceps',
    'Ischios',
    'Fessiers',
    'Jambes',
    'Épaules',
    'Bras',
    'Avant-bras',
    'Abdos',
    'Mollets',
    'Cou',
    'Cardio',
  ];

  const isSessionComplete = useMemo(() => {
    if (!session) return false;
    if (session.exercises.length === 0) return false;
    return session.exercises.every((ex) => ex.sets.length > 0 && ex.sets.every((s) => s.done));
  }, [session]);

  if (!session) return null;

  const preventNegative = (e: React.KeyboardEvent) => {
    if (['-', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const getTimeString = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-24 animate-zoom-in">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="text-left">
          <h2 className="text-2xl font-black italic uppercase leading-none text-foreground">{session.sessionName}</h2>
          <div className="flex gap-2 items-center mt-1">
            <p className="text-secondary text-xs uppercase tracking-widest">{session.programName}</p>
            {isLogMode && <span className="text-[9px] font-bold bg-secondary/20 text-secondary px-1.5 rounded uppercase">Mode Saisie</span>}
          </div>
        </div>
        <button
          onClick={() => setShowSessionSettings(true)}
          className="p-2 bg-surface2 rounded-xl text-secondary hover:text-foreground transition-colors border border-transparent hover:border-border"
        >
          <Icons.Settings size={20} />
        </button>
      </div>

      {/* Exercises List */}
      <div className="space-y-6">
        {session.exercises.map((exo, exoIdx) => {
          const libEx = getExerciseById(exo.exerciseId);
          const isCardio = libEx?.type === 'Cardio';
          const isStatic = libEx?.type === 'Statique' || libEx?.type === 'Étirement';
          const stats = libEx ? getExerciseStats(libEx.id, history, libEx.type) : EMPTY_STATS;

          return (
            <ExerciseCard
              key={exoIdx}
              exo={exo}
              exoIdx={exoIdx}
              libEx={libEx}
              stats={stats}
              isCardio={isCardio}
              isStatic={isStatic}
              isLogMode={isLogMode}
              isFirst={exoIdx === 0}
              isLast={exoIdx === session.exercises.length - 1}
              onMove={moveExercise}
              onRemove={(idx) => {
                triggerHaptic('error');
                removeExercise(idx);
              }}
              onAddSet={addSet}
              onRemoveSet={removeSet}
              onUpdateSet={updateSet}
              onOpenDetail={() => {
                triggerHaptic('click');
                setActiveDetailExoIdx(exoIdx);
              }}
              onWarmup={() => {
                triggerHaptic('click');
                setWarmupTargetExo(exoIdx);
              }}
              onPlateHelp={(target) => setToolsState({ open: true, target })}
            />
          );
        })}
      </div>

      <button
        onClick={() => setShowAddExoModal(true)}
        className="w-full py-4 border-2 border-dashed border-border rounded-[2rem] text-secondary font-black uppercase hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-2"
      >
        <Icons.Plus size={18} /> Ajouter Exercice
      </button>

      <div className="flex gap-4 pt-4">
        <button
          onClick={cancelSession}
          className="flex-1 py-4 bg-danger/10 text-danger font-black uppercase rounded-[2rem] border border-danger/20 hover:bg-danger/20 transition-all active:scale-95"
        >
          Annuler
        </button>

        <button
          onClick={() => setShowFinishModal(true)}
          className={`flex-1 py-4 font-black uppercase rounded-[2rem] shadow-lg transition-all flex flex-col items-center justify-center leading-none active:scale-95 ${isSessionComplete ? 'bg-success text-white shadow-success/20 animate-pulse-slow' : 'bg-surface2 text-secondary border border-border hover:text-foreground'}`}
        >
          <span>Terminer</span>
          {!isSessionComplete && <span className="text-[9px] font-normal mt-1 opacity-70">Séries incomplètes</span>}
        </button>
      </div>

      {/* SETTINGS MODAL */}
      {showSessionSettings && (
        <Modal title="Réglages Séance" onClose={() => setShowSessionSettings(false)}>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-secondary font-bold">Début de séance</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={new Date(session.startTime).toISOString().split('T')[0]}
                  onChange={(e) => {
                    const d = new Date(e.target.value);
                    const old = new Date(session.startTime);
                    d.setHours(old.getHours(), old.getMinutes());
                    updateSessionSettings(d.getTime(), session.bodyWeight, session.fatigue);
                  }}
                  className="flex-1 bg-surface2 p-3 rounded-xl text-sm font-bold outline-none text-foreground"
                />
                <input
                  type="time"
                  value={getTimeString(session.startTime)}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const d = new Date(session.startTime);
                    d.setHours(h, m);
                    updateSessionSettings(d.getTime(), session.bodyWeight, session.fatigue);
                  }}
                  className="w-24 bg-surface2 p-3 rounded-xl text-sm font-bold outline-none text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-secondary font-bold">
                  Durée (min) {!isLogMode && <span className="text-primary ml-1">(Chrono Actif)</span>}
                </label>
                <input
                  type="number"
                  min="0"
                  onKeyDown={preventNegative}
                  inputMode="decimal"
                  value={logDuration}
                  onChange={(e) => setLogDuration(e.target.value)}
                  className={`w-full bg-surface2 p-3 rounded-xl text-sm font-bold outline-none text-foreground ${!isLogMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isLogMode}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-secondary font-bold">Poids & Mensurations</label>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('click');
                    setShowMeasurementsModal(true);
                  }}
                  className="w-full bg-surface2 hover:bg-surface2/80 p-3 rounded-xl flex items-center justify-between border border-white/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {session.bodyWeight ? `${session.bodyWeight} ${weightUnit}` : 'Non renseigné'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                    <span>Saisir</span>
                    <Icons.Shortcut size={14} />
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-secondary font-bold">Fatigue Ressentie</label>
              <div className="flex bg-surface2 rounded-xl overflow-hidden">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => updateSessionSettings(session.startTime, session.bodyWeight, String(v))}
                    className={`flex-1 py-3 text-xs font-bold ${session.fatigue === String(v) ? 'text-black' : 'text-secondary/30'}`}
                    style={{ backgroundColor: session.fatigue === String(v) ? FATIGUE_COLORS[v] : 'transparent' }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* FINISH CONFIRMATION MODAL */}
      {showFinishModal && (
        <Modal title="Bilan" onClose={() => setShowFinishModal(false)}>
          <div className="space-y-6 text-center">
            {!isSessionComplete && (
              <div className="bg-warning/10 border border-warning/20 p-3 rounded-xl text-warning text-xs font-bold mb-4">
                ⚠️ Certaines séries ne sont pas validées.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface2/30 p-4 rounded-2xl">
                <div className="text-[10px] text-secondary uppercase">Durée</div>
                {isLogMode ? (
                  <div className="text-xl font-black font-mono text-foreground">{logDuration} min</div>
                ) : (
                  <div className="text-xl font-black font-mono text-foreground">
                    {Math.floor((Date.now() - session.startTime) / 60000)} min
                  </div>
                )}
              </div>
              <div className="bg-surface2/30 p-4 rounded-2xl">
                <div className="text-[10px] text-secondary uppercase">Volume</div>
                <div className="text-xl font-black font-mono text-foreground">
                  {session.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.done && !s.isWarmup).length, 0)} sets
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => finishSession(logDuration)}
                className="w-full py-3 bg-success text-white font-black uppercase rounded-xl shadow-xl shadow-success/20 active:scale-95 transition-all"
              >
                Valider et Sauvegarder
              </button>
              <button
                onClick={() => setShowFinishModal(false)}
                className="w-full py-3 bg-surface2 text-secondary font-bold uppercase text-xs rounded-xl hover:bg-surface2/80 hover:text-foreground transition-colors"
              >
                Continuer l'entraînement
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* SMART WARMUP MODAL */}
      {warmupTargetExo !== null && (
        <WarmupModal
          exo={session.exercises[warmupTargetExo]}
          libEx={getExerciseById(session.exercises[warmupTargetExo].exerciseId)}
          history={history}
          onClose={() => setWarmupTargetExo(null)}
          onGenerate={(count) => {
            generateWarmup(warmupTargetExo, count);
            setWarmupTargetExo(null);
          }}
        />
      )}

      {/* TOOLS MODAL */}
      {toolsState.open && (
        <WorkoutToolsModal onClose={() => setToolsState({ open: false })} initialTab="plate" initialTargetWeight={toolsState.target} />
      )}

      {/* UNIFIED EXERCISE DETAIL MODAL */}
      {activeDetailExoIdx !== null && session.exercises[activeDetailExoIdx] && (
        <ExerciseDetailModal
          exerciseId={session.exercises[activeDetailExoIdx].exerciseId}
          onClose={() => setActiveDetailExoIdx(null)}
          onEdit={() => {
            const exId = session.exercises[activeDetailExoIdx].exerciseId;
            const libEx = getExerciseById(exId);
            if (libEx) {
              setActiveDetailExoIdx(null); // Close detail
              // SAFE WAIT : Empêche la race condition avec History API sur mobile
              setTimeout(() => {
                setEditingLibExercise(libEx); // Open edit
              }, 100);
            }
          }}
          extraTab={{
            key: 'notes',
            label: 'Notes',
            content: (
              <textarea
                className="w-full h-48 bg-surface2/30 p-4 rounded-xl outline-none text-sm resize-none text-foreground placeholder-secondary/50 border border-white/5 focus:border-primary/50 transition-colors"
                placeholder="Notes pour cette séance (ex: Douleur épaule, bonne sensation...)"
                value={session.exercises[activeDetailExoIdx].notes}
                onChange={(e) => updateExerciseNotes(activeDetailExoIdx, e.target.value)}
                autoFocus
              />
            ),
          }}
        />
      )}

      {/* EXERCISE EDIT MODAL (Copied from Library Logic for Quick Edit) */}
      {editingLibExercise && (
        <Modal title="Modifier Exercice" onClose={() => setEditingLibExercise(null)}>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-secondary">Nom</label>
              <input
                value={editingLibExercise.name}
                onChange={(e) => setEditingLibExercise({ ...editingLibExercise, name: e.target.value })}
                className="w-full bg-surface2 p-3 rounded-xl outline-none text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-secondary">Type</label>
                <select
                  value={editingLibExercise.type}
                  onChange={(e) => setEditingLibExercise({ ...editingLibExercise, type: e.target.value as ExerciseType })}
                  className="w-full bg-surface2 p-3 rounded-xl outline-none text-foreground"
                >
                  {EXERCISE_TYPE_LIST.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-secondary">Muscle</label>
                <select
                  value={editingLibExercise.muscle}
                  onChange={(e) => setEditingLibExercise({ ...editingLibExercise, muscle: e.target.value })}
                  className="w-full bg-surface2 p-3 rounded-xl outline-none text-foreground"
                >
                  {MUSCLE_ORDER.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-secondary">Équipement</label>
              <select
                value={editingLibExercise.equipment}
                onChange={(e) => setEditingLibExercise({ ...editingLibExercise, equipment: e.target.value })}
                className="w-full bg-surface2 p-3 rounded-xl outline-none text-foreground"
              >
                {Object.entries(EQUIPMENTS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 pt-2 border-t border-border/50">
              <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Conseils Techniques</label>
              <div className="space-y-2">
                <textarea
                  placeholder="Setup (1 par ligne)"
                  rows={2}
                  className="w-full bg-surface2 p-3 rounded-xl text-xs outline-none text-foreground"
                  value={editingLibExercise.tips?.setup?.join('\n') || ''}
                  onChange={(e) =>
                    setEditingLibExercise({
                      ...editingLibExercise,
                      tips: { ...editingLibExercise.tips, setup: e.target.value.split('\n') },
                    })
                  }
                />
                <textarea
                  placeholder="Exécution (1 par ligne)"
                  rows={2}
                  className="w-full bg-surface2 p-3 rounded-xl text-xs outline-none text-foreground"
                  value={editingLibExercise.tips?.exec?.join('\n') || ''}
                  onChange={(e) =>
                    setEditingLibExercise({ ...editingLibExercise, tips: { ...editingLibExercise.tips, exec: e.target.value.split('\n') } })
                  }
                />
                <textarea
                  placeholder="Erreurs (1 par ligne)"
                  rows={2}
                  className="w-full bg-surface2 p-3 rounded-xl text-xs outline-none text-foreground"
                  value={editingLibExercise.tips?.mistake?.join('\n') || ''}
                  onChange={(e) =>
                    setEditingLibExercise({
                      ...editingLibExercise,
                      tips: { ...editingLibExercise.tips, mistake: e.target.value.split('\n') },
                    })
                  }
                />
              </div>
            </div>
            <button
              onClick={() => {
                // Direct Store Update via Import (Optimized)
                import('../../store/useStore').then(({ useStore }) => {
                  useStore.getState().setLibrary((prev) => prev.map((l) => (l.id === editingLibExercise.id ? editingLibExercise : l)));
                });

                setEditingLibExercise(null);
                triggerHaptic('success');
              }}
              className="w-full py-3 bg-primary text-background font-black uppercase rounded-[2rem]"
            >
              Sauvegarder
            </button>
          </div>
        </Modal>
      )}

      {/* Add Exercise Modal */}
      {showAddExoModal && (
        <Modal
          title="Ajouter Exercice"
          onClose={() => {
            setShowAddExoModal(false);
            setLibraryFilter('');
          }}
        >
          <div className="space-y-4">
            <input
              placeholder="Rechercher..."
              className="w-full bg-surface2 p-3 rounded-xl outline-none text-foreground placeholder-secondary/50"
              onChange={(e) => setLibraryFilter(e.target.value)}
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto space-y-2">
              {library
                .filter(
                  (l) =>
                    !l.isArchived &&
                    ((l.name || '').toLowerCase().includes(libraryFilter.toLowerCase()) ||
                      (l.muscle || '').toLowerCase().includes(libraryFilter.toLowerCase()))
                )
                .sort((a, b) => (a.isFavorite === b.isFavorite ? (a.name || '').localeCompare(b.name || '') : a.isFavorite ? -1 : 1))
                .map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      addExercise(l.id);
                      setShowAddExoModal(false);
                      setLibraryFilter('');
                    }}
                    className="w-full p-3 bg-surface2/50 rounded-xl text-left hover:bg-surface2 transition-colors flex justify-between items-center group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {l.isFavorite && (
                          <span className="text-gold">
                            <Icons.Star />
                          </span>
                        )}
                        <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{l.name}</div>
                      </div>
                      <div className="text-[10px] text-secondary uppercase mt-1 flex gap-2">
                        <span>
                          {l.muscle} • {EQUIPMENTS[l.equipment as keyof typeof EQUIPMENTS]}
                        </span>
                        <span style={{ color: TYPE_COLORS[l.type as keyof typeof TYPE_COLORS] }}>● {l.type}</span>
                      </div>
                    </div>
                    <div className="text-xl text-primary font-black">+</div>
                  </button>
                ))}
            </div>
          </div>
        </Modal>
      )}

      {showMeasurementsModal && (
        <BodyMeasurementsModal
          onClose={() => setShowMeasurementsModal(false)}
          onWeightRecorded={(w) => {
            if (session) {
              updateSessionSettings(session.startTime, w, session.fatigue);
            }
          }}
        />
      )}
    </div>
  );
};
