import React from 'react';
import { SectionCard } from '../../../components/ui/SectionCard';
import { Icons } from '../../../components/icons/Icons';
import { triggerHaptic } from '../../../core/utils';
import { ExerciseInstance, LibraryExercise, SetRecord } from '../../../core/types';
import { useStore } from '../../../store/useStore';

interface HistoryExerciseCardProps {
  exo: ExerciseInstance;
  _exoIdx?: number;
  libEx: LibraryExercise | undefined;
  isCardio: boolean;
  isStatic: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
  onUpdateNotes: (val: string) => void;
  onUpdateSet: <K extends keyof SetRecord>(setIdx: number, field: K, value: SetRecord[K]) => void;
  onAddSet: () => void;
  onRemoveSet: (setIdx: number) => void;
}

export const HistoryExerciseCard: React.FC<HistoryExerciseCardProps> = ({
  exo,
  libEx,
  isCardio,
  isStatic,
  expanded,
  onToggleExpand,
  onDelete,
  onMove,
  isFirst,
  isLast,
  onUpdateNotes,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
}) => {
  const weightUnit = useStore((s) => s.weightUnit);

  // Bloquer les caractères non désirés (- et e)
  const preventNegative = (e: React.KeyboardEvent) => {
    if (['-', 'e', 'E'].includes(e.key)) e.preventDefault();
  };

  return (
    <SectionCard className="overflow-hidden">
      <div className="p-4 bg-surface2/20 flex justify-between items-center border-b border-white/10">
        <div className="flex gap-3 items-center">
          <div className="flex flex-col gap-1">
            {!isFirst && (
              <button onClick={() => onMove(-1)} className="p-0.5 text-secondary hover:text-white">
                <Icons.ChevronUp size={14} />
              </button>
            )}
            {!isLast && (
              <button onClick={() => onMove(1)} className="p-0.5 text-secondary hover:text-white">
                <Icons.ChevronDown size={14} />
              </button>
            )}
          </div>
          <div className="font-black italic uppercase">{libEx?.name || `Exo #${exo.exerciseId}`}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              triggerHaptic('click');
              onToggleExpand();
            }}
            className={`p-2 rounded-lg transition-colors ${exo.notes ? 'text-white bg-surface2' : 'text-secondary hover:text-white'}`}
          >
            <Icons.Note size={18} />
          </button>
          <button
            onClick={() => {
              triggerHaptic('error');
              onDelete();
            }}
            className="p-2 text-danger/50 hover:text-danger rounded-lg"
          >
            <Icons.Trash size={18} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-2 border-b border-white/10 bg-surface2/10">
          <textarea
            value={exo.notes || ''}
            onChange={(e) => onUpdateNotes(e.target.value)}
            maxLength={280}
            rows={2}
            className="w-full bg-background border border-white/10 rounded-xl p-3 text-xs font-mono outline-none focus:border-primary placeholder-secondary/30"
            placeholder="Note pour cette séance..."
          />
        </div>
      )}

      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[9px] font-bold uppercase text-secondary">
        <div className="col-span-2 text-center">#</div>
        <div className="col-span-3 text-center">{isCardio ? 'Lvl' : `Poids (${weightUnit})`}</div>
        <div className="col-span-3 text-center">{isCardio ? 'Dist' : isStatic ? 'Durée' : 'Reps'}</div>
        <div className="col-span-2 text-center">{isCardio ? 'Durée' : 'RIR'}</div>
        <div className="col-span-2 text-right">Valid</div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {exo.sets.map((set, sIdx) => (
          <div key={sIdx} className="grid grid-cols-12 gap-2 items-center text-xs">
            <div className="col-span-2 flex items-center justify-center relative gap-1">
              <button
                onClick={() => onRemoveSet(sIdx)}
                className="w-5 h-5 flex items-center justify-center text-danger/50 hover:text-danger bg-danger/10 rounded"
              >
                <Icons.Close size={10} />
              </button>
              <button
                onClick={() => onUpdateSet(sIdx, 'isWarmup', !set.isWarmup)}
                className={`w-6 h-6 flex items-center justify-center text-center font-mono text-[10px] font-bold rounded border transition-colors ${set.isWarmup ? 'text-warning bg-warning/10 border-warning' : 'text-secondary border-transparent'}`}
              >
                {set.isWarmup ? 'W' : sIdx + 1}
              </button>
            </div>

            <input
              type="number"
              min="0"
              onKeyDown={preventNegative}
              inputMode="decimal"
              className="col-span-3 bg-surface2 p-2 rounded-lg text-center font-mono font-bold outline-none focus:border-primary border border-transparent"
              placeholder={isCardio ? 'Lvl' : weightUnit}
              value={set.weight}
              onChange={(e) => onUpdateSet(sIdx, 'weight', e.target.value)}
            />
            <input
              type="number"
              min="0"
              onKeyDown={preventNegative}
              inputMode="decimal"
              className="col-span-3 bg-surface2 p-2 rounded-lg text-center font-mono font-bold outline-none focus:border-primary border border-transparent"
              placeholder={isCardio ? 'Dist (m)' : isStatic ? 'T (s)' : 'reps'}
              value={set.reps}
              onChange={(e) => onUpdateSet(sIdx, 'reps', e.target.value)}
            />
            <input
              type="number"
              min="0"
              onKeyDown={preventNegative}
              inputMode="decimal"
              className="col-span-2 bg-surface2 p-2 rounded-lg text-center font-mono font-bold outline-none focus:border-primary border border-transparent"
              placeholder={isCardio ? 'T (min)' : 'RIR'}
              value={set.rir || ''}
              onChange={(e) => onUpdateSet(sIdx, 'rir', e.target.value)}
            />

            <div className="col-span-2 flex items-center justify-end">
              <button
                onClick={() => onUpdateSet(sIdx, 'done', !set.done)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${set.done ? 'bg-success border-success text-white' : 'bg-surface2 border-white/10 text-secondary/30'}`}
              >
                ✓
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={onAddSet}
          className="w-full py-2 bg-surface2/50 rounded-xl text-[10px] font-bold uppercase text-secondary border border-dashed border-white/10 hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
        >
          <Icons.Plus size={12} /> Série
        </button>
      </div>
    </SectionCard>
  );
};
