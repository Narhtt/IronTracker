import React from 'react';
import { useParams } from 'react-router-dom';
import { useHistoryEditor } from './hooks/useHistoryEditor';
import { EditorHeader } from '../../components/ui/EditorHeader';
import { Modal } from '../../components/ui/Modal';
import { Icons } from '../../components/icons/Icons';
import { EQUIPMENTS } from '../../core/data/equipments';
import { TYPE_COLORS } from '../../core/constants';
import { HistorySessionHeader } from './components/HistorySessionHeader';
import { HistoryExerciseCard } from './components/HistoryExerciseCard';

export const HistoryEditorView: React.FC = () => {
  const { id } = useParams();
  const {
    editingSession,
    historyDuration,
    setHistoryDuration,
    expandedNotes,
    setIsDirty,
    showAddExoModal,
    setShowAddExoModal,
    libraryFilter,
    setLibraryFilter,
    library,
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
  } = useHistoryEditor(id);

  if (!editingSession) return null;

  return (
    <div className="space-y-6 animate-slide-in-bottom pb-24">
      <EditorHeader title={editingSession.sessionName} onCancel={handleCancel} onSave={handleSave} />

      <HistorySessionHeader
        session={editingSession}
        duration={historyDuration}
        setDuration={setHistoryDuration}
        setIsDirty={setIsDirty}
        onUpdate={handleUpdate}
      />

      {editingSession.exercises.map((exo, eIdx) => {
        const libEx = getExerciseById(exo.exerciseId);
        const isCardio = libEx?.type === 'Cardio';
        const isStatic = libEx?.type === 'Statique' || libEx?.type === 'Étirement';

        return (
          <HistoryExerciseCard
            key={eIdx}
            exo={exo}
            exoIdx={eIdx}
            libEx={libEx}
            isCardio={isCardio}
            isStatic={isStatic}
            expanded={expandedNotes[`hist_${eIdx}`] || false}
            onToggleExpand={() => toggleNoteExpansion(eIdx)}
            onDelete={() => deleteExercise(eIdx)}
            onMove={(dir) => moveExercise(eIdx, eIdx + dir)}
            isFirst={eIdx === 0}
            isLast={eIdx === editingSession.exercises.length - 1}
            onUpdateNotes={(val) => updateExerciseNotes(eIdx, val)}
            onUpdateSet={(sIdx, field, val) => updateHistorySet(eIdx, sIdx, field, val)}
            onAddSet={() => addSet(eIdx)}
            onRemoveSet={(sIdx) => removeSet(eIdx, sIdx)}
          />
        );
      })}

      <button
        onClick={() => setShowAddExoModal(true)}
        className="w-full py-4 border-2 border-dashed border-white/10 rounded-[2rem] text-secondary font-black uppercase hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2"
      >
        <Icons.Plus size={18} /> Ajouter Exercice
      </button>

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
              className="w-full bg-surface2 p-3 rounded-2xl outline-none"
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
                    className="w-full p-3 bg-surface2/50 rounded-2xl text-left hover:bg-surface2 transition-colors flex justify-between items-center group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {l.isFavorite && (
                          <span className="text-gold">
                            <Icons.Star />
                          </span>
                        )}
                        <div className="font-bold text-sm group-hover:text-primary transition-colors">{l.name}</div>
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
    </div>
  );
};
