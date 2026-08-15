import React from 'react';
import { Icons } from '../../../components/icons/Icons';
import { TYPE_COLORS } from '../../../core/constants';
import { ProgramSession, LibraryExercise, ProgramExercise } from '../../../core/types';
import { triggerHaptic } from '../../../core/utils';

interface ProgramSessionCardProps {
  session: ProgramSession;
  _sIdx?: number;
  isFirst: boolean;
  isLast: boolean;
  library: LibraryExercise[];
  onUpdateName: (name: string) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onAddExo: () => void;
  onDeleteExo: (eIdx: number) => void;
  onMoveExo: (eIdx: number, dir: -1 | 1) => void;
  onUpdateExo: <K extends keyof ProgramExercise>(eIdx: number, field: K, value: ProgramExercise[K]) => void;
}

export const ProgramSessionCard: React.FC<ProgramSessionCardProps> = ({
  session,
  isFirst,
  isLast,
  library,
  onUpdateName,
  onDelete,
  onMove,
  onAddExo,
  onDeleteExo,
  onMoveExo,
  onUpdateExo,
}) => {
  const getExerciseById = (id: number) => library.find((l) => l.id === id);

  const preventNegative = (e: React.KeyboardEvent) => {
    if (['-', 'e', 'E'].includes(e.key)) e.preventDefault();
  };

  return (
    // OUTER: Rounded-3xl (24px) to contain elements comfortably
    <div className="bg-surface2/30 rounded-3xl border border-border p-4">
      {/* Header Séance */}
      <div className="flex justify-between items-center mb-4 gap-2">
        <div className="flex flex-col gap-1">
          {!isFirst && (
            <button onClick={() => onMove(-1)} className="p-1 bg-surface2 rounded-lg text-secondary hover:text-white">
              <Icons.ChevronUp size={14} />
            </button>
          )}
          {!isLast && (
            <button onClick={() => onMove(1)} className="p-1 bg-surface2 rounded-lg text-secondary hover:text-white">
              <Icons.ChevronDown size={14} />
            </button>
          )}
        </div>
        <input
          value={session.name}
          onChange={(e) => onUpdateName(e.target.value)}
          className="bg-transparent font-bold text-sm outline-none w-full border-b border-transparent focus:border-white/10 px-1 py-0.5 text-foreground"
          placeholder="Nom de la séance (ex: Push A)"
        />
        <button onClick={onDelete} className="p-2 text-danger/50 hover:text-danger rounded-xl">
          <Icons.Trash size={16} />
        </button>
      </div>

      {/* Liste Exercices */}
      <div className="space-y-2">
        {session.exos.map((ex, eIdx) => {
          const libEx = getExerciseById(ex.exerciseId);
          return (
            <div
              key={eIdx}
              className="bg-surface2/50 p-3 rounded-2xl flex flex-col gap-2 relative border border-transparent hover:border-border transition-colors"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex flex-col gap-1 pt-1">
                  {eIdx > 0 && (
                    <button onClick={() => onMoveExo(eIdx, -1)} className="p-0.5 hover:text-white text-secondary">
                      <Icons.ChevronUp size={14} />
                    </button>
                  )}
                  {eIdx < session.exos.length - 1 && (
                    <button onClick={() => onMoveExo(eIdx, 1)} className="p-0.5 hover:text-white text-secondary">
                      <Icons.ChevronDown size={14} />
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-bold text-xs truncate text-foreground">{libEx?.name || 'Exercice Inconnu'}</div>
                  {libEx && (
                    <span
                      className="text-[9px] font-bold uppercase opacity-70"
                      style={{ color: TYPE_COLORS[libEx.type as keyof typeof TYPE_COLORS] }}
                    >
                      {libEx.type.substring(0, 4).toUpperCase()}
                    </span>
                  )}
                </div>

                <button onClick={() => onDeleteExo(eIdx)} className="text-secondary/50 hover:text-danger p-1">
                  <Icons.Close size={16} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 pl-6">
                <div className="space-y-0.5">
                  <label className="text-[8px] uppercase text-secondary">Sets</label>
                  <input
                    type="number"
                    min="0"
                    onKeyDown={preventNegative}
                    inputMode="decimal"
                    value={ex.sets}
                    onChange={(e) => onUpdateExo(eIdx, 'sets', parseInt(e.target.value) || 0)}
                    className="w-full bg-surface2 text-center text-[10px] rounded-xl p-1.5 outline-none focus:border-primary border border-transparent hover:border-border font-mono font-bold text-foreground"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] uppercase text-secondary">Reps</label>
                  <input
                    type="text"
                    value={ex.reps}
                    onChange={(e) => onUpdateExo(eIdx, 'reps', e.target.value)}
                    className="w-full bg-surface2 text-center text-[10px] rounded-xl p-1.5 outline-none focus:border-primary border border-transparent hover:border-border font-mono font-bold text-foreground"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] uppercase text-secondary">RIR</label>
                  <input
                    type="text"
                    value={ex.targetRir || ''}
                    placeholder="-"
                    onChange={(e) => onUpdateExo(eIdx, 'targetRir', e.target.value)}
                    className="w-full bg-surface2 text-center text-[10px] rounded-xl p-1.5 outline-none focus:border-primary border border-transparent hover:border-border font-mono font-bold text-foreground"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] uppercase text-secondary">Rest</label>
                  <input
                    type="number"
                    min="0"
                    onKeyDown={preventNegative}
                    inputMode="decimal"
                    value={ex.rest}
                    onChange={(e) => onUpdateExo(eIdx, 'rest', parseInt(e.target.value) || 0)}
                    className="w-full bg-surface2 text-center text-[10px] rounded-xl p-1.5 outline-none focus:border-primary border border-transparent hover:border-border font-mono font-bold text-foreground"
                  />
                </div>
              </div>
            </div>
          );
        })}
        <button
          onClick={() => {
            triggerHaptic('click');
            onAddExo();
          }}
          className="w-full py-2 border border-dashed border-border rounded-xl text-[10px] uppercase text-secondary hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
        >
          <Icons.Plus size={14} /> Ajouter Exercice
        </button>
      </div>
    </div>
  );
};
