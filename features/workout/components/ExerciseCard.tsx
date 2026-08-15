import React from 'react';
import { SectionCard } from '../../../components/ui/SectionCard';
import { Icons } from '../../../components/icons/Icons';
import { useStore } from '../../../store/useStore';
import { calculate1RM, ExerciseStats } from '../../../core/utils';
import { ExerciseInstance, SetRecord, LibraryExercise } from '../../../core/types';

interface ExerciseCardProps {
  exo: ExerciseInstance;
  exoIdx: number;
  libEx: LibraryExercise | undefined;
  stats: ExerciseStats;
  isCardio: boolean;
  isStatic: boolean;
  isLogMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (idx: number) => void;
  onAddSet: (idx: number) => void;
  onRemoveSet: (exoIdx: number, setIdx: number) => void;
  onUpdateSet: (exoIdx: number, setIdx: number, field: keyof SetRecord, value: string | boolean) => void;
  onOpenDetail: () => void;
  onWarmup: () => void;
  onPlateHelp: (target: string) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exo,
  exoIdx,
  libEx,
  stats,
  isCardio,
  isStatic,
  isFirst,
  isLast,
  onMove,
  onRemove,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onOpenDetail,
  onWarmup,
  onPlateHelp,
}) => {
  const formula1RM = useStore((s) => s.formula1RM);
  const weightUnit = useStore((s) => s.weightUnit);
  // Current Session Metrics Calculation
  const currentVolume = exo.sets
    .filter((s) => s.done && !s.isWarmup)
    .reduce((acc, s) => acc + (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0), 0);
  const currentBestE1RM = exo.sets.reduce((best, s) => {
    if (s.done && !s.isWarmup) {
      const e = calculate1RM(s.weight, s.reps, formula1RM);
      return e > best ? e : best;
    }
    return best;
  }, 0);

  // Helper for Trend Symbol
  const getTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return { sym: '', color: 'text-secondary' };
    if (current > previous) return { sym: '▴', color: 'text-success' };
    if (current < previous) return { sym: '▾', color: 'text-danger' };
    return { sym: '▸', color: 'text-secondary' };
  };

  const tonDelta = currentVolume - stats.lastSessionVolume;
  const tonPct = stats.lastSessionVolume > 0 ? Math.round((tonDelta / stats.lastSessionVolume) * 100) : 0;
  const tonTrend = getTrend(currentVolume, stats.lastSessionVolume);

  const rmDelta = currentBestE1RM - (stats.lastBestSet?.e1rm || 0);
  const rmPct = stats.lastBestSet?.e1rm ? Math.round((rmDelta / stats.lastBestSet.e1rm) * 100) : 0;
  const rmTrend = getTrend(currentBestE1RM, stats.lastBestSet?.e1rm || 0);

  // Bloquer les caractères non désirés
  const preventNegative = (e: React.KeyboardEvent) => {
    if (['-', 'e', 'E'].includes(e.key)) e.preventDefault();
  };

  return (
    <SectionCard className="overflow-hidden">
      {/* Exercise Header - PADDING p-4 pour Nested Corners 32px-16px=16px */}
      <div className="p-4 bg-surface2/20 border-b border-border">
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-3 items-center w-full overflow-hidden">
            <div className="flex flex-col gap-1 flex-shrink-0">
              {!isFirst && (
                <button onClick={() => onMove(exoIdx, exoIdx - 1)} className="p-0.5 text-secondary hover:text-foreground">
                  <Icons.ChevronUp size={14} />
                </button>
              )}
              {!isLast && (
                <button onClick={() => onMove(exoIdx, exoIdx + 1)} className="p-0.5 text-secondary hover:text-foreground">
                  <Icons.ChevronDown size={14} />
                </button>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-black uppercase text-sm truncate text-foreground">{libEx?.name || 'Inconnu'}</div>
              <div className="text-[10px] text-secondary flex justify-between items-center pr-2 mt-0.5">
                <span>
                  {exo.target} • {exo.rest}s
                </span>
              </div>
            </div>
          </div>

          {/* Tools Actions */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
            {!isCardio && !isStatic && (
              <button
                onClick={() => onPlateHelp(exo.sets[exo.sets.length - 1]?.weight || '20')}
                className="p-2 rounded-2xl text-secondary hover:text-foreground transition-colors"
              >
                <Icons.Calculator size={18} />
              </button>
            )}
            <button onClick={onWarmup} className="p-2 rounded-2xl text-secondary hover:text-gold transition-colors">
              <Icons.Flame size={18} />
            </button>
            <button
              onClick={onOpenDetail}
              className={`p-2 rounded-2xl transition-colors ${exo.notes ? 'text-foreground bg-surface2' : 'text-secondary hover:text-foreground'}`}
            >
              <Icons.Search size={18} />
            </button>
            <button onClick={() => onRemove(exoIdx)} className="p-2 text-danger/50 hover:text-danger rounded-2xl">
              <Icons.Trash size={18} />
            </button>
          </div>
        </div>

        {/* Stats Grid - Radius 2xl pour harmonie */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {/* Column 1: History */}
          <div className="bg-surface2/30 rounded-2xl p-2 border border-white/5 space-y-1">
            <div className="text-[8px] font-black uppercase text-secondary/50 mb-1 border-b border-white/5 pb-0.5">Historique</div>
            <div className="flex justify-between items-center h-4">
              <span className="text-secondary/70">Perf.</span>
              <span className="text-secondary font-mono font-bold truncate ml-2">{stats.lastSessionString}</span>
            </div>
            {!isCardio && !isStatic && (
              <>
                <div className="flex justify-between items-center h-4">
                  <span className="text-secondary/70">1RM</span>
                  <span className="text-secondary font-mono font-bold">
                    {Math.round(stats.lastBestSet?.e1rm || 0)} <span className="text-[8px] font-normal">{weightUnit}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center h-4">
                  <span className="text-secondary/70">Ton.</span>
                  <span className="text-secondary font-mono font-bold">
                    {Math.round(stats.lastSessionVolume)} <span className="text-[8px] font-normal">{weightUnit}</span>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Column 2: Current Session */}
          <div className="bg-primary/5 rounded-2xl p-2 border border-primary/5 space-y-1">
            <div className="text-[8px] font-black uppercase text-primary/50 mb-1 border-b border-primary/5 pb-0.5">Session</div>
            <div className="flex justify-between items-center h-4">
              <span className="text-primary/70">Perf.</span>
              <span className="text-primary/90 font-mono font-bold truncate ml-2 italic">
                {currentVolume > 0 || isCardio || isStatic ? 'En cours...' : '-'}
              </span>
            </div>
            {!isCardio && !isStatic && (
              <>
                <div className="flex justify-between items-center h-4">
                  <span className="text-primary/70">1RM</span>
                  <div className="flex items-center gap-1 font-mono font-bold">
                    <span className="text-primary/90">
                      {Math.round(currentBestE1RM)} <span className="text-[8px] font-normal opacity-70">{weightUnit}</span>
                    </span>
                    {stats.lastBestSet?.e1rm && currentBestE1RM > 0 ? (
                      <span className={`text-[8px] ${rmTrend.color}`}>
                        {rmTrend.sym}
                        {Math.abs(rmPct)}%
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex justify-between items-center h-4">
                  <span className="text-primary/70">Ton.</span>
                  <div className="flex items-center gap-1 font-mono font-bold">
                    <span className="text-primary/90">
                      {Math.round(currentVolume)} <span className="text-[8px] font-normal opacity-70">{weightUnit}</span>
                    </span>
                    {stats.lastSessionVolume > 0 && currentVolume > 0 && (
                      <span className={`text-[8px] ${tonTrend.color}`}>
                        {tonTrend.sym}
                        {Math.abs(tonPct)}%
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sets List - PADDING p-4 */}
      <div className="p-4 space-y-2">
        {exo.sets.map((set, setIdx) => (
          <div key={setIdx} className={`grid grid-cols-12 gap-2 items-center ${set.done ? 'opacity-50' : ''} relative`}>
            {/* Left Controls */}
            <div className="col-span-2 flex flex-col items-center justify-center gap-1">
              <div className="flex gap-1">
                <button
                  onClick={() => onRemoveSet(exoIdx, setIdx)}
                  className="w-5 h-5 flex items-center justify-center text-danger/30 hover:text-danger bg-danger/5 rounded"
                >
                  <Icons.Close size={10} />
                </button>
                <button
                  onClick={() => onUpdateSet(exoIdx, setIdx, 'isWarmup', !set.isWarmup)}
                  className={`w-6 h-6 flex items-center justify-center text-center font-mono text-[10px] font-bold rounded border transition-colors ${set.isWarmup ? 'text-warning bg-warning/10 border-warning' : 'text-secondary border-transparent bg-surface2/50'}`}
                >
                  {set.isWarmup ? 'W' : setIdx + 1}
                </button>
              </div>
            </div>

            {/* Inputs - ROUNDED-2XL pour Nested Corners (16px) */}
            <div className="col-span-3 relative">
              <input
                type="number"
                min="0"
                onKeyDown={preventNegative}
                inputMode="decimal"
                placeholder={isCardio ? 'Lvl' : weightUnit}
                className="w-full bg-surface2 p-3 rounded-2xl text-center font-mono font-bold outline-none focus:border-white/20 border border-transparent text-xs text-foreground"
                value={set.weight}
                onChange={(e) => onUpdateSet(exoIdx, setIdx, 'weight', e.target.value)}
              />
            </div>
            <div className="col-span-3 relative">
              <input
                type="number"
                min="0"
                onKeyDown={preventNegative}
                inputMode="decimal"
                placeholder={isCardio ? 'Dist' : isStatic ? 'T (s)' : 'reps'}
                className="w-full bg-surface2 p-3 rounded-2xl text-center font-mono font-bold outline-none focus:border-white/20 border border-transparent text-xs text-foreground"
                value={set.reps}
                onChange={(e) => onUpdateSet(exoIdx, setIdx, 'reps', e.target.value)}
              />
            </div>
            <div className="col-span-2 relative">
              <input
                type="number"
                min="0"
                onKeyDown={preventNegative}
                inputMode="decimal"
                placeholder={isCardio ? 'T (min)' : 'RIR'}
                className="w-full bg-surface2 p-3 rounded-2xl text-center font-mono font-bold outline-none focus:border-white/20 border border-transparent text-xs text-foreground"
                value={set.rir || ''}
                onChange={(e) => onUpdateSet(exoIdx, setIdx, 'rir', e.target.value)}
              />
            </div>

            {/* Validation Button - ROUNDED-2XL */}
            <button
              onClick={() => onUpdateSet(exoIdx, setIdx, 'done', !set.done)}
              className={`col-span-2 h-10 rounded-2xl flex flex-col items-center justify-center transition-all relative ${set.done ? 'bg-success text-white scale-95' : 'bg-surface2 text-secondary hover:bg-surface2/80 active:scale-95'}`}
            >
              {set.done ? (
                <>
                  <Icons.Check size={16} strokeWidth={3} />
                  {set.completedAt && (
                    <span className="text-[7px] font-mono font-bold leading-none mt-0.5 opacity-90">
                      {new Date(set.completedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  )}
                </>
              ) : (
                ''
              )}
            </button>
          </div>
        ))}
        <button
          onClick={() => onAddSet(exoIdx)}
          className="w-full py-2 bg-surface2/30 rounded-2xl text-[10px] font-bold uppercase text-secondary border border-dashed border-border hover:border-white/20 transition-colors flex items-center justify-center gap-2"
        >
          <Icons.Plus size={12} /> Série
        </button>
      </div>
    </SectionCard>
  );
};
