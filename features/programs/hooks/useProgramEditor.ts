import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../../store/useStore';
import { useConfirm } from '../../../hooks/useConfirm';
import { Program, ProgramSession } from '../../../core/types';
import { triggerHaptic, moveItem } from '../../../core/utils';

export const useProgramEditor = (programId: string | undefined) => {
  const navigate = useNavigate();
  const programs = useStore((s) => s.programs);
  const setPrograms = useStore((s) => s.setPrograms);
  const library = useStore((s) => s.library);
  const confirm = useConfirm();

  // State
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // UI State
  const [programExoPicker, setProgramExoPicker] = useState<number | null>(null); // Index of session receiving the exercise
  const [libraryFilter, setLibraryFilter] = useState('');

  // Load Program
  useEffect(() => {
    if (programId === 'new') {
      setEditingProgram({ id: `prog_${crypto.randomUUID()}`, name: 'Nouveau Programme', sessions: [] });
      setIsDirty(true);
    } else {
      const found = programs.find((p) => p.id === programId);
      if (found) {
        setEditingProgram(JSON.parse(JSON.stringify(found)));
      } else {
        navigate('/programs');
      }
    }
  }, [programId, programs, navigate]);

  // --- Core Updates ---

  const handleUpdate = (updatedProgram: Program) => {
    setEditingProgram(updatedProgram);
    setIsDirty(true);
  };

  const updateProgramName = (name: string) => {
    if (!editingProgram) return;
    handleUpdate({ ...editingProgram, name });
  };

  // --- Session Management ---

  const addSession = () => {
    if (!editingProgram) return;
    triggerHaptic('click');
    const newSessions = [...editingProgram.sessions, { id: `sess_${crypto.randomUUID()}`, name: 'Nouvelle Séance', exos: [] }];
    handleUpdate({ ...editingProgram, sessions: newSessions });
  };

  const updateSession = (sIdx: number, updatedSession: ProgramSession) => {
    if (!editingProgram) return;
    const newSessions = [...editingProgram.sessions];
    newSessions[sIdx] = updatedSession;
    handleUpdate({ ...editingProgram, sessions: newSessions });
  };

  const deleteSession = (sIdx: number) => {
    confirm({
      title: 'SUPPRIMER ?',
      message: 'Supprimer cette séance ?',
      variant: 'danger',
      onConfirm: () => {
        if (!editingProgram) return;
        const newSessions = editingProgram.sessions.filter((_, i) => i !== sIdx);
        handleUpdate({ ...editingProgram, sessions: newSessions });
        triggerHaptic('success');
      },
    });
  };

  const moveSession = (from: number, to: number) => {
    if (!editingProgram) return;
    const newSessions = moveItem(editingProgram.sessions, from, to);
    handleUpdate({ ...editingProgram, sessions: newSessions });
  };

  // --- Exercise Management ---

  const addExerciseToSession = (exerciseId: number) => {
    if (!editingProgram || programExoPicker === null) return;

    const sIdx = programExoPicker;
    const newSessions = [...editingProgram.sessions];
    newSessions[sIdx].exos.push({
      exerciseId,
      sets: 3,
      reps: '10',
      rest: 120,
      targetRir: '',
    });

    handleUpdate({ ...editingProgram, sessions: newSessions });
    setProgramExoPicker(null);
    setLibraryFilter('');
    triggerHaptic('success');
  };

  const deleteExercise = (sIdx: number, eIdx: number) => {
    confirm({
      title: 'SUPPRIMER ?',
      message: 'Retirer cet exercice ?',
      variant: 'danger',
      onConfirm: () => {
        if (!editingProgram) return;
        const newSessions = [...editingProgram.sessions];
        newSessions[sIdx].exos.splice(eIdx, 1);
        handleUpdate({ ...editingProgram, sessions: newSessions });
        triggerHaptic('error');
      },
    });
  };

  const moveExercise = (sIdx: number, from: number, to: number) => {
    if (!editingProgram) return;
    const newSessions = [...editingProgram.sessions];
    newSessions[sIdx].exos = moveItem(newSessions[sIdx].exos, from, to);
    handleUpdate({ ...editingProgram, sessions: newSessions });
  };

  const updateExercise = (sIdx: number, eIdx: number, field: string, value: string | number) => {
    if (!editingProgram) return;
    const newSessions = [...editingProgram.sessions];
    const exo: Record<string, string | number> = newSessions[sIdx].exos[eIdx];
    exo[field] = value;
    handleUpdate({ ...editingProgram, sessions: newSessions });
  };

  // --- Save / Cancel ---

  const handleCancel = () => {
    if (isDirty) {
      confirm({
        title: 'ANNULER ?',
        message: 'Quitter sans sauvegarder ?',
        subMessage: 'Les modifications seront perdues.',
        variant: 'danger',
        onConfirm: () => navigate('/programs'),
      });
    } else {
      navigate('/programs');
    }
  };

  const handleSave = () => {
    if (!editingProgram || !editingProgram.name.trim()) return;
    confirm({
      title: 'SAUVEGARDER ?',
      message: 'Enregistrer les modifications du programme ?',
      variant: 'primary',
      confirmLabel: 'Sauvegarder',
      onConfirm: () => {
        setPrograms((prev) => {
          const idx = prev.findIndex((p) => p.id === editingProgram.id);
          if (idx >= 0) {
            const newProgs = [...prev];
            newProgs[idx] = editingProgram;
            return newProgs;
          }
          return [...prev, editingProgram];
        });
        triggerHaptic('success');
        navigate('/programs');
      },
    });
  };

  return {
    editingProgram,
    isDirty,
    programExoPicker,
    setProgramExoPicker,
    libraryFilter,
    setLibraryFilter,
    library,

    updateProgramName,
    addSession,
    updateSession,
    deleteSession,
    moveSession,
    addExerciseToSession,
    deleteExercise,
    moveExercise,
    updateExercise,
    handleSave,
    handleCancel,
  };
};
