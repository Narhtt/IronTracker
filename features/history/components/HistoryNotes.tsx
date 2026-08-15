import React, { useMemo } from 'react';
import { useStore } from '../../../store/useStore';
import { getExerciseStats, formatDuration } from '../../../core/utils';
import { FATIGUE_COLORS } from '../../../core/constants';
import { VirtualList } from '../../../components/ui/VirtualList';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Icons } from '../../../components/icons/Icons';

interface NoteItem {
  date: number;
  session: string;
  fatigue: string;
  exercise: string;
  note: string;
  perf: string;
  tonnage: number;
  isStandard: boolean;
  isCardio: boolean;
}

export const HistoryNotes: React.FC = () => {
  const history = useStore((s) => s.history);
  const library = useStore((s) => s.library);
  const formula1RM = useStore((s) => s.formula1RM);

  const allNotes = useMemo(() => {
    const notesList: NoteItem[] = [];
    history.forEach((s) => {
      s.exercises.forEach((e) => {
        if (e.notes) {
          const lib = library.find((l) => l.id === e.exerciseId);
          const stats = getExerciseStats(e.exerciseId, [s], lib?.type, formula1RM);

          const isCardio = lib?.type === 'Cardio';
          const isStatic = lib?.type === 'Statique' || lib?.type === 'Étirement';

          notesList.push({
            date: s.startTime,
            session: s.sessionName,
            fatigue: s.fatigue,
            exercise: lib?.name || 'Inconnu',
            note: e.notes,
            perf: stats.lastSessionString,
            tonnage: stats.lastSessionVolume,
            isStandard: !isCardio && !isStatic,
            isCardio,
          });
        }
      });
    });
    return notesList.sort((a, b) => b.date - a.date);
  }, [history, library, formula1RM]);

  return (
    <div className="h-full -mx-1 animate-fade-in pb-20">
      <VirtualList<NoteItem>
        items={allNotes}
        itemHeight={140}
        gap={12}
        emptyMessage={
          <EmptyState
            icon={<Icons.BookOpen />}
            title="Carnet Vide"
            subtitle="Utilisez l'icône 'Note' pendant vos séances pour annoter vos ressentis."
          />
        }
        renderItem={(n, i) => (
          // Container: Rounded-3xl for softness consistent with SectionCard
          <div
            key={i}
            className="bg-surface2/30 p-4 rounded-3xl border border-white/5 flex flex-col gap-2 h-full shadow-sm hover:border-white/10 transition-colors"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-[10px] font-bold uppercase text-secondary flex-shrink-0">
                  {new Date(n.date).toLocaleDateString()}
                </span>
                <div className="w-1 h-1 bg-white/20 rounded-full flex-shrink-0" />
                <span className="text-[9px] text-secondary/70 uppercase truncate">{n.session}</span>
              </div>
              <span
                className="text-[9px] font-bold px-2 py-1 rounded-lg bg-surface2 border border-white/5 flex-shrink-0"
                style={{ color: FATIGUE_COLORS[n.fatigue] }}
              >
                RPE {n.fatigue}
              </span>
            </div>

            <div className="flex justify-between items-end flex-shrink-0">
              <div className="font-bold text-primary text-sm truncate pr-2">{n.exercise}</div>
              <div className="flex flex-col items-end gap-1">
                <div className="text-[10px] font-mono font-bold text-foreground bg-primary/10 px-2 py-1 rounded-lg text-right whitespace-nowrap border border-primary/10">
                  {n.perf}
                </div>
                {n.tonnage > 0 && (
                  <div className="text-[8px] font-mono text-secondary">
                    Ton: {n.isStandard ? `${(n.tonnage / 1000).toFixed(1)}t` : n.isCardio ? `${n.tonnage}m` : formatDuration(n.tonnage)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 relative">
              <div className="text-xs text-foreground/80 italic font-medium leading-relaxed border-l-2 border-primary/30 pl-2 line-clamp-2 overflow-hidden text-ellipsis">
                "{n.note}"
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
};
