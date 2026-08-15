import { useNavigate } from 'react-router-dom';
import { useStore } from '../../../store/useStore';
import { useConfirm } from '../../../hooks/useConfirm';
import { storage } from '../../../services/storage';
import { triggerHaptic, moveItem, generateWarmupSeries, getExerciseStats } from '../../../core/utils';
import { SetRecord } from '../../../core/types';

export const useWorkoutManager = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();

  // Global Store
  const session = useStore((s) => s.session);
  const setSession = useStore((s) => s.setSession);
  const setHistory = useStore((s) => s.setHistory);
  const setRestTarget = useStore((s) => s.setRestTarget);
  const history = useStore((s) => s.history);
  const library = useStore((s) => s.library);

  const isLogMode = session?.mode === 'log';

  const getExerciseById = (id: number) => library.find((l) => l.id === id);

  const updateSet = <K extends keyof SetRecord>(exoIdx: number, setIdx: number, field: K, value: SetRecord[K]) => {
    if (!session) return;
    const newSession = { ...session };
    const exo = newSession.exercises[exoIdx];
    const wasDone = exo.sets[setIdx].done;

    if (field === 'done' && value === true) {
      const currentSet = exo.sets[setIdx];
      if (!currentSet.weight || !currentSet.reps) {
        triggerHaptic('error');
        return;
      }
    }

    const updates: Partial<SetRecord> = { [field]: value };
    if (field === 'done') {
      if (value === true) {
        updates.completedAt = Date.now();
        triggerHaptic('success');
      } else {
        updates.completedAt = undefined;
        triggerHaptic('click');
      }
    }
    exo.sets[setIdx] = { ...exo.sets[setIdx], ...updates };

    if (!isLogMode && field === 'done' && value === true && !wasDone) {
      setRestTarget(Date.now() + exo.rest * 1000);
    }
    setSession(newSession);
    storage.session.save(newSession);
  };

  const addSet = (exoIdx: number) => {
    if (!session) return;
    triggerHaptic('click');
    const newSession = { ...session };
    const exo = newSession.exercises[exoIdx];
    const lastSet = exo.sets[exo.sets.length - 1];
    exo.sets.push({
      weight: lastSet ? lastSet.weight : '',
      reps: lastSet ? lastSet.reps : '',
      rir: lastSet ? lastSet.rir : '',
      done: false,
    });
    setSession(newSession);
    storage.session.save(newSession);
  };

  const removeSet = (exoIdx: number, setIdx: number) => {
    if (!session) return;
    triggerHaptic('error');
    const newSession = { ...session };
    newSession.exercises[exoIdx].sets.splice(setIdx, 1);
    setSession(newSession);
    storage.session.save(newSession);
  };

  const removeExercise = (exoIdx: number) => {
    confirm({
      title: 'SUPPRIMER ?',
      message: 'Voulez-vous retirer cet exercice de la séance ?',
      variant: 'danger',
      onConfirm: () => {
        if (!session) return;
        const newSession = { ...session };
        newSession.exercises.splice(exoIdx, 1);
        setSession(newSession);
        storage.session.save(newSession);
      },
    });
  };

  const moveExercise = (from: number, to: number) => {
    if (!session) return;
    triggerHaptic('click');
    const newSession = { ...session };
    newSession.exercises = moveItem(newSession.exercises, from, to);
    setSession(newSession);
    storage.session.save(newSession);
  };

  const addExercise = (libExId: number) => {
    if (!session) return;
    const libEx = getExerciseById(libExId);
    if (!libEx) return;
    const newSession = { ...session };
    newSession.exercises.push({
      exerciseId: libExId,
      target: '3 x 10',
      rest: 90,
      isBonus: true,
      notes: '',
      sets: Array(3)
        .fill(null)
        .map(() => ({ weight: '', reps: '', done: false, rir: '' })),
    });
    setSession(newSession);
    storage.session.save(newSession);
    triggerHaptic('success');
  };

  const generateWarmup = (exoIdx: number, count: number = 3) => {
    if (!session) return;
    const exo = session.exercises[exoIdx];
    let targetWeight = '';
    let historical1RM = 0;

    // 1. Try finding in history first (preferred for accurate warmup)
    const libEx = getExerciseById(exo.exerciseId);
    if (libEx) {
      const stats = getExerciseStats(libEx.id, history, libEx.type);
      historical1RM = stats.est1RM;
      if (stats.lastBestSet) {
        targetWeight = String(stats.lastBestSet.weight);
      }
    }

    // 2. Fallback to current session input
    if (!targetWeight) {
      const lastSet = exo.sets[exo.sets.length - 1];
      if (lastSet && lastSet.weight) targetWeight = lastSet.weight;
    }

    if (!targetWeight && !historical1RM) {
      triggerHaptic('error');
      alert("Première fois ? Remplissez une série de travail (Poids) ou effectuez une séance pour activer l'échauffement automatique.");
      return;
    }

    const fullWarmup = generateWarmupSeries(targetWeight, historical1RM);
    const chosenWarmup = fullWarmup.slice(0, count);

    const newSession = { ...session };
    newSession.exercises[exoIdx].sets = [...chosenWarmup, ...newSession.exercises[exoIdx].sets];
    setSession(newSession);
    storage.session.save(newSession);
    triggerHaptic('success');
  };

  const cancelSession = () => {
    confirm({
      title: 'ANNULER LA SÉANCE ?',
      message: 'Voulez-vous vraiment annuler ?',
      subMessage: 'Tout progrès non sauvegardé sera perdu.',
      variant: 'danger',
      onConfirm: () => {
        setSession(null);
        setRestTarget(null);
        storage.session.save(null);
        // TimeBuffer for modal close cleanup
        setTimeout(() => navigate('/'), 100);
      },
    });
  };

  const finishSession = (logDuration?: string) => {
    if (!session) return;
    triggerHaptic('success');

    let endTime = Date.now();
    if (isLogMode) {
      const dur = parseInt(logDuration || '60') || 60;
      endTime = session.startTime + dur * 60 * 1000;
    }

    const finishedSession = {
      ...session,
      endTime: endTime,
    };

    setHistory((prev) => [finishedSession, ...prev].sort((a, b) => b.startTime - a.startTime));
    setSession(null);
    setRestTarget(null);
    storage.session.save(null);

    // TimeBuffer: Wait for "Bilan" Modal to unmount via history.back() if applicable, then navigate
    setTimeout(() => navigate('/'), 100);
  };

  const updateSessionSettings = (newDate: number, newBW?: string, newFatigue?: string) => {
    if (!session) return;
    const newSession = {
      ...session,
      startTime: newDate,
      bodyWeight: newBW !== undefined ? newBW : session.bodyWeight,
      fatigue: newFatigue !== undefined ? newFatigue : session.fatigue,
    };
    setSession(newSession);
    storage.session.save(newSession);
  };

  const updateExerciseNotes = (exoIdx: number, notes: string) => {
    if (!session) return;
    const newSession = { ...session };
    newSession.exercises[exoIdx].notes = notes;
    setSession(newSession);
    storage.session.save(newSession);
  };

  return {
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
  };
};
