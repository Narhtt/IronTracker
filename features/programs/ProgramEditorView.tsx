import React from 'react';
import { useParams } from 'react-router-dom';
import { useProgramEditor } from './hooks/useProgramEditor';
import { EditorHeader } from '../../components/ui/EditorHeader';
import { SectionCard } from '../../components/ui/SectionCard';
import { Modal } from '../../components/ui/Modal';
import { Icons } from '../../components/icons/Icons';
import { TYPE_COLORS } from '../../core/constants';
import { EQUIPMENTS } from '../../core/data/equipments';
import { ProgramSessionCard } from './components/ProgramSessionCard';

export const ProgramEditorView: React.FC = () => {
  const { id } = useParams();
  const {
    editingProgram,
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
  } = useProgramEditor(id);

  if (!editingProgram) return null;

  return (
    <div className="space-y-6 animate-zoom-in pb-20">
      <EditorHeader title={editingProgram.name} onCancel={handleCancel} onSave={handleSave} />

      <SectionCard className="p-6">
        <div className="space-y-1 mb-6">
          <label className="text-[10px] uppercase text-secondary">Nom du programme</label>
          <input
            value={editingProgram.name}
            onChange={(e) => updateProgramName(e.target.value)}
            className="w-full bg-surface2 p-3 rounded-xl font-bold outline-none focus:border-primary border border-transparent hover:border-border text-foreground"
          />
        </div>

        <div className="space-y-6">
          {editingProgram.sessions.map((sess, sIdx) => (
            <ProgramSessionCard
              key={sess.id}
              session={sess}
              sIdx={sIdx}
              isFirst={sIdx === 0}
              isLast={sIdx === editingProgram.sessions.length - 1}
              library={library}
              onUpdateName={(name) => updateSession(sIdx, { ...sess, name })}
              onDelete={() => deleteSession(sIdx)}
              onMove={(dir) => moveSession(sIdx, sIdx + dir)}
              onAddExo={() => {
                setProgramExoPicker(sIdx);
                setLibraryFilter('');
              }}
              onDeleteExo={(eIdx) => deleteExercise(sIdx, eIdx)}
              onMoveExo={(eIdx, dir) => moveExercise(sIdx, eIdx, eIdx + dir)}
              onUpdateExo={(eIdx, field, val) => updateExercise(sIdx, eIdx, field, val)}
            />
          ))}

          <button
            onClick={addSession}
            className="w-full py-4 bg-surface2 rounded-2xl font-bold uppercase text-xs text-secondary hover:text-foreground transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-border"
          >
            <Icons.Plus size={16} /> Ajouter Séance
          </button>
        </div>
      </SectionCard>

      {programExoPicker !== null && (
        <Modal
          title="Choisir Exercice"
          onClose={() => {
            setProgramExoPicker(null);
            setLibraryFilter('');
          }}
        >
          <div className="space-y-4">
            <div className="bg-surface2 p-2 rounded-2xl flex items-center gap-2 border border-transparent focus-within:border-primary/50 transition-colors">
              <span className="text-secondary pl-2">
                <Icons.Search size={16} />
              </span>
              <input
                placeholder="Rechercher (nom, muscle...)"
                className="bg-transparent w-full p-1 outline-none text-sm font-bold text-foreground placeholder-secondary/50"
                value={libraryFilter}
                onChange={(e) => setLibraryFilter(e.target.value)}
                autoFocus
              />
              {libraryFilter && (
                <button
                  type="button"
                  onClick={() => setLibraryFilter('')}
                  className="p-1 text-secondary hover:text-white transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
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
                    onClick={() => addExerciseToSession(l.id)}
                    className="w-full p-3 bg-surface2/50 rounded-2xl text-left hover:bg-surface2 transition-colors flex justify-between items-center group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {l.isFavorite && (
                          <span className="text-gold">
                            <Icons.Star />
                          </span>
                        )}
                        <div className="font-bold text-sm group-hover:text-primary transition-colors text-foreground">{l.name}</div>
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
