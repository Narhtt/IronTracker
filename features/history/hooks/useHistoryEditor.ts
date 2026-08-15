import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../../store/useStore';
import { useConfirm } from '../../../hooks/useConfirm';
import { WorkoutSession, SetRecord } from '../../../core/types';
import { triggerHaptic, moveItem } from '../../../core/utils';

export const useHistoryEditor = (sessionId: string | undefined) => {
  const navigate = useNavigate();
  const history = useStore((s) => s.history);
  const setHistory = useStore((s) => s.setHistory);
  const library = useStore((s) => s.library);
  const confirm = useConfirm();

  // State
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);
  const [historyDuration, setHistoryDuration] = useState<string>('60');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [isDirty, setIsDirty] = useState(false);

  // UI State for Modal
  const [showAddExoModal, setShowAddExoModal] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState('');

  // Load Session
  useEffect(() => {
    const found = history.find((h) => h.id === sessionId);
    if (found) {
      setEditingSession(JSON.parse(JSON.stringify(found)));
      setHistoryDuration(found.endTime ? Math.floor((found.endTime - found.startTime) / 60000).toString() : '60');
    } else {
      navigate('/');
    }
  }, [sessionId, history, navigate]);

  // --- Actions ---

  const handleUpdate = (updatedSession: WorkoutSession) => {
    setEditingSession(updatedSession);
    setIsDirty(true);
  };

  const updateHistorySet = <K extends keyof SetRecord>(exoIdx: number, setIdx: number, field: K, value: SetRecord[K]) => {
    if (!editingSession) return;
    const newSession = { ...editingSession };
    const exo = newSession.exercises[exoIdx];
    exo.sets[setIdx] = { ...exo.sets[setIdx], [field]: value };
    handleUpdate(newSession);
  };

  const addSet = (exoIdx: number) => {
    if (!editingSession) return;
    const newSession = { ...editingSession };
    const exo = newSession.exercises[exoIdx];
    const lastSet = exo.sets[exo.sets.length - 1];
    exo.sets.push({
      weight: lastSet?.weight || '',
      reps: lastSet?.reps || '',
      done: true,
      rir: lastSet?.rir || '',
      isWarmup: false,
    });
    handleUpdate(newSession);
  };

  const removeSet = (exoIdx: number, setIdx: number) => {
    if (!editingSession) return;
    const newSession = { ...editingSession };
    newSession.exercises[exoIdx].sets.splice(setIdx, 1);
    handleUpdate(newSession);
  };

  const deleteExercise = (idx: number) => {
    confirm({
      title: 'SUPPRIMER ?',
      message: "Supprimer l'exercice ?",
      subMessage: 'Toutes les séries de cet exercice seront perdues.',
      variant: 'danger',
      onConfirm: () => {
        if (!editingSession) return;
        const newExos = [...editingSession.exercises];
        newExos.splice(idx, 1);
        handleUpdate({ ...editingSession, exercises: newExos });
      },
    });
  };

  const moveExercise = (from: number, to: number) => {
    if (!editingSession) return;
    const newExos = moveItem(editingSession.exercises, from, to);
    handleUpdate({ ...editingSession, exercises: newExos });
  };

  const updateExerciseNotes = (exoIdx: number, notes: string) => {
    if (!editingSession) return;
    const newSession = { ...editingSession };
    newSession.exercises[exoIdx].notes = notes;
    handleUpdate(newSession);
  };

  const toggleNoteExpansion = (exoIdx: number) => {
    setExpandedNotes((prev) => ({ ...prev, [`hist_${exoIdx}`]: !prev[`hist_${exoIdx}`] }));
  };

  const addExercise = (libId: number) => {
    if (!editingSession) return;
    const newExos = [
      ...editingSession.exercises,
      {
        exerciseId: libId,
        target: '3 x 10',
        rest: 90,
        targetRir: '',
        isBonus: true,
        notes: '',
        sets: [{ weight: '', reps: '', done: true, rir: '', isWarmup: false }],
      },
    ];
    handleUpdate({ ...editingSession, exercises: newExos });
    triggerHaptic('success');
  };

  // --- Save / Cancel ---

  const handleCancel = () => {
    if (isDirty) {
      confirm({
        title: 'ANNULER ?',
        message: 'Annuler les modifications ?',
        subMessage: 'Tous les changements non sauvegardés seront perdus.',
        variant: 'danger',
        onConfirm: () => navigate('/'),
      });
    } else {
      navigate('/');
    }
  };

  const handleSave = () => {
    if (!editingSession) return;
    confirm({
      title: 'SAUVEGARDER ?',
      message: 'Enregistrer les modifications de la séance ?',
      variant: 'primary',
      confirmLabel: 'Sauvegarder',
      onConfirm: () => {
        const durationMin = parseInt(historyDuration) || 0;
        const endTime = editingSession.startTime + durationMin * 60 * 1000;
        const sessionToSave = { ...editingSession, endTime: durationMin > 0 ? endTime : undefined };

        setHistory((prev) => {
          const existingIdx = prev.findIndex((h) => h.id === sessionToSave.id);
          let newHist;
          if (existingIdx >= 0) {
            newHist = [...prev];
            newHist[existingIdx] = sessionToSave;
          } else {
            newHist = [...prev, sessionToSave];
          }
          return newHist.sort((a, b) => b.startTime - a.startTime);
        });

        triggerHaptic('success');
        navigate('/');
      },
    });
  };

  const getExerciseById = (id: number) => library.find((l) => l.id === id);

  return {
    editingSession,
    setEditingSession,
    historyDuration,
    setHistoryDuration,
    expandedNotes,
    isDirty,
    setIsDirty,
    showAddExoModal,
    setShowAddExoModal,
    libraryFilter,
    setLibraryFilter,
    library,

    // Actions
    handleUpdate,
    updateHistorySet,
    addSet,
    removeSet,
    deleteExercise,
    moveExercise,
    updateExerciseNotes,
    toggleNoteExpansion,
    addExercise,
    handleCancel,
    handleSave,
    getExerciseById,
  };
};
