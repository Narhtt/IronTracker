import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { SectionCard } from '../../components/ui/SectionCard';
import { getExerciseStats, formatDuration } from '../../core/utils';
import { Icons } from '../../components/icons/Icons';
import { VirtualList } from '../../components/ui/VirtualList';
import { EmptyState } from '../../components/ui/EmptyState';
import { WorkoutSession } from '../../core/types';

export const RecordsView: React.FC = () => {
  const library = useStore((s) => s.library);
  const formula1RM = useStore((s) => s.formula1RM);
  const history = useStore((s) => s.history);
  const weightUnit = useStore((s) => s.weightUnit);
  const [showAllRecords, setShowAllRecords] = useState(true);

  // Pré-calcul de la liste complète avec optimisation O(N) au lieu de O(N^2)
  const recordsList = useMemo(() => {
    // 1. Pré-grouper l'historique par ID d'exercice
    // Cela évite que getExerciseStats ne doive filtrer tout l'historique pour chaque exercice
    const historyByExo = new Map<number, WorkoutSession[]>();

    history.forEach((session) => {
      session.exercises.forEach((ex) => {
        if (!historyByExo.has(ex.exerciseId)) {
          historyByExo.set(ex.exerciseId, []);
        }
        historyByExo.get(ex.exerciseId)!.push(session);
      });
    });

    return library
      .filter((l) => !l.isArchived && (showAllRecords || l.isFavorite))
      .sort((a, b) => (a.isFavorite === b.isFavorite ? a.name.localeCompare(b.name) : a.isFavorite ? -1 : 1))
      .map((l) => {
        // On passe uniquement le sous-ensemble de l'historique pertinent
        const specificHistory = historyByExo.get(l.id) || [];
        // S'il n'y a pas d'historique, on skip le calcul coûteux
        if (specificHistory.length === 0) return null;

        const stats = getExerciseStats(l.id, specificHistory, l.type, formula1RM);

        // Double check (normalement couvert par length === 0 mais pour sécurité)
        if (stats.lastDetailed === '-') return null;

        return { l, stats };
      })
      .filter(Boolean) as { l: (typeof library)[0]; stats: ReturnType<typeof getExerciseStats> }[];
  }, [library, history, showAllRecords, formula1RM]);

  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col pb-24">
      <div className="flex items-center justify-end px-1 flex-shrink-0">
        <button
          onClick={() => setShowAllRecords(!showAllRecords)}
          className="text-[10px] font-bold uppercase bg-surface2 px-3 py-1 rounded-full text-secondary transition-colors hover:text-foreground border border-transparent hover:border-white/10"
        >
          {showAllRecords ? 'Tous' : 'Favoris'}
        </button>
      </div>

      <div className="flex-1 min-h-0 border-t border-transparent">
        <VirtualList
          items={recordsList}
          itemHeight={150}
          gap={12}
          emptyMessage={
            <EmptyState
              icon={<Icons.Records />}
              title="Aucun Record"
              subtitle="Terminez des séances pour voir vos statistiques apparaître ici."
            />
          }
          renderItem={({ l, stats }) => {
            const isCardio = l.type === 'Cardio';
            const isStatic = l.type === 'Statique' || l.type === 'Étirement';
            const isStandard = !isCardio && !isStatic;

            return (
              <SectionCard className="p-4 flex flex-col gap-2 h-full justify-between">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="font-bold text-sm flex items-center gap-2 truncate pr-2 text-foreground">
                    {l.isFavorite && (
                      <span className="text-gold text-xs flex-shrink-0">
                        <Icons.Star size={12} fill="currentColor" />
                      </span>
                    )}
                    <span className="truncate">{l.name}</span>
                  </div>
                  <div className="text-[9px] font-bold uppercase px-2 py-1 rounded-lg bg-surface2 text-secondary flex-shrink-0 border border-white/5">
                    {l.muscle}
                  </div>
                </div>

                {/* Stats Grid - Rounded 2xl (Inner of SectionCard) */}
                <div className={`grid ${isCardio ? 'grid-cols-3' : 'grid-cols-2'} gap-3 mt-1`}>
                  {isStandard && (
                    <>
                      <div className="bg-surface2/30 p-2 rounded-2xl text-center border border-white/5">
                        <div className="text-[8px] text-secondary uppercase font-bold tracking-wider mb-0.5">Meilleur 1RM</div>
                        <div className="font-black text-lg text-primary leading-none">
                          {stats.pr} <span className="text-[10px] text-secondary font-normal">{weightUnit}</span>
                        </div>
                      </div>
                      <div className="bg-surface2/30 p-2 rounded-2xl text-center border border-white/5">
                        <div className="text-[8px] text-secondary uppercase font-bold tracking-wider mb-0.5">Poids Max</div>
                        <div className="font-black text-lg text-foreground leading-none">
                          {stats.prMax} <span className="text-[10px] text-secondary font-normal">{weightUnit}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {isStatic && (
                    <div className="bg-surface2/30 p-2 rounded-2xl text-center col-span-2 border border-white/5">
                      <div className="text-[8px] text-secondary uppercase font-bold tracking-wider mb-0.5">Temps Max</div>
                      <div className="font-black text-lg text-primary leading-none">{formatDuration(stats.maxDuration)}</div>
                    </div>
                  )}

                  {isCardio && (
                    <>
                      <div className="bg-surface2/30 p-1.5 rounded-2xl text-center border border-white/5">
                        <div className="text-[8px] text-secondary uppercase">Max Dist</div>
                        <div className="font-black text-xs text-foreground">
                          {stats.maxDistance} <span className="text-[8px]">m</span>
                        </div>
                      </div>
                      <div className="bg-surface2/30 p-1.5 rounded-2xl text-center border border-white/5">
                        <div className="text-[8px] text-secondary uppercase">Max Tps</div>
                        <div className="font-black text-xs text-foreground">{formatDuration(stats.maxDuration)}</div>
                      </div>
                      <div className="bg-surface2/30 p-1.5 rounded-2xl text-center border border-white/5">
                        <div className="text-[8px] text-secondary uppercase">Max Lvl</div>
                        <div className="font-black text-xs text-primary">{stats.prMax}</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer - Badges softened to rounded-lg */}
                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                  <span className="text-secondary/70 text-[10px]">Dernière perf:</span>
                  <div className="flex gap-2">
                    {/* Tonnage Badge */}
                    {stats.lastSessionVolume > 0 && (
                      <span className="font-mono font-bold text-[10px] text-secondary bg-surface2/30 px-2 py-1 rounded-lg border border-white/5">
                        {isStandard
                          ? `${(stats.lastSessionVolume / 1000).toFixed(1)}t`
                          : isCardio
                            ? `${stats.lastSessionVolume}m`
                            : formatDuration(stats.lastSessionVolume)}
                      </span>
                    )}
                    <span className="font-mono font-bold text-[10px] text-foreground/90 bg-surface2/50 px-2 py-1 rounded-lg border border-white/5">
                      {stats.lastDetailed}
                    </span>
                  </div>
                </div>
              </SectionCard>
            );
          }}
        />
      </div>
    </div>
  );
};
