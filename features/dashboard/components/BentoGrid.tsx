import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionCard } from '../../../components/ui/SectionCard';
import { Icons } from '../../../components/icons/Icons';
import { triggerHaptic } from '../../../core/utils';

interface BentoGridProps {
  programsCount: number;
  monthSessionCount: number;
  libraryCount: number;
  hasNewPR?: boolean;
  onOpenHistory: () => void;
  onOpenNotes: () => void;
  onOpenRecords?: () => void;
  onOpenTools: () => void;
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  programsCount,
  monthSessionCount,
  libraryCount,
  hasNewPR = false,
  onOpenHistory,
  onOpenNotes,
  onOpenRecords,
  onOpenTools,
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* 3. ROUTINES WIDGET */}
      <SectionCard className="p-4 flex flex-col justify-between group h-36 active:scale-[0.98] transition-transform cursor-pointer animate-zoom-in delay-300">
        <div
          onClick={() => {
            triggerHaptic('click');
            navigate('/programs');
          }}
          className="h-full flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-full bg-surface2 border border-white/5 flex items-center justify-center text-secondary group-hover:text-foreground transition-colors">
            <Icons.Repeat size={20} />
          </div>
          <div>
            <div className="text-lg font-black text-foreground italic tracking-tight">ROUTINES</div>
            <div className="text-[10px] text-secondary font-medium uppercase tracking-wide">{programsCount} programmes</div>
          </div>
        </div>
      </SectionCard>

      {/* 4. HISTORY WIDGET */}
      <SectionCard className="p-4 flex flex-col justify-between group h-36 active:scale-[0.98] transition-transform cursor-pointer animate-zoom-in delay-300">
        <div
          onClick={() => {
            triggerHaptic('click');
            onOpenHistory();
          }}
          className="h-full flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-surface2 border border-white/5 flex items-center justify-center text-secondary group-hover:text-foreground transition-colors">
              <Icons.History size={20} />
            </div>
            {monthSessionCount > 0 && (
              <span className="text-[10px] font-black text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
                +{monthSessionCount}
              </span>
            )}
          </div>
          <div>
            <div className="text-lg font-black text-foreground italic tracking-tight">HISTORIQUE</div>
            <div className="text-[10px] text-secondary font-medium uppercase tracking-wide">{monthSessionCount} ce mois</div>
          </div>
        </div>
      </SectionCard>

      {/* 5. UTILITY ROW (Tools | Notes | Records) */}
      <div className="col-span-2 grid grid-cols-3 gap-3">
        {/* TOOLS (Left) */}
        <SectionCard
          className="p-0 flex flex-col items-center justify-center gap-2 group h-24 active:scale-[0.98] transition-transform cursor-pointer overflow-hidden relative animate-zoom-in delay-400"
          radius="rounded-2xl"
        >
          <div
            onClick={() => {
              triggerHaptic('click');
              onOpenTools();
            }}
            className="w-full h-full flex flex-col items-center justify-center relative z-10"
          >
            <div className="p-2 bg-surface2 rounded-2xl border border-white/10 text-primary group-hover:scale-110 transition-transform mb-1">
              <Icons.Calculator size={20} />
            </div>
            <div className="text-[9px] font-black text-foreground uppercase tracking-widest">Outils</div>
          </div>
        </SectionCard>

        {/* NOTES (Center) */}
        <SectionCard
          className="p-0 flex flex-col items-center justify-center gap-2 group h-24 active:scale-[0.98] transition-transform cursor-pointer overflow-hidden relative animate-zoom-in delay-400"
          radius="rounded-2xl"
        >
          <div
            onClick={() => {
              triggerHaptic('click');
              onOpenNotes();
            }}
            className="w-full h-full flex flex-col items-center justify-center relative z-10"
          >
            <div className="p-2 bg-surface2 rounded-2xl border border-white/10 text-secondary group-hover:text-foreground group-hover:scale-110 transition-all mb-1">
              <Icons.BookOpen size={20} />
            </div>
            <div className="text-[9px] font-black text-foreground uppercase tracking-widest">Carnet</div>
          </div>
        </SectionCard>

        {/* RECORDS (Right) */}
        <SectionCard
          className="p-0 flex flex-col items-center justify-center gap-2 group h-24 active:scale-[0.98] transition-transform cursor-pointer overflow-hidden relative animate-zoom-in delay-400 border-white/10"
          radius="rounded-2xl"
        >
          <div
            onClick={() => {
              triggerHaptic('click');
              if (onOpenRecords) onOpenRecords();
              else navigate('/history?tab=records');
            }}
            className="w-full h-full flex flex-col items-center justify-center relative z-10"
          >
            {/* Notification Dot for New PR */}
            {hasNewPR && (
              <div className="absolute top-3 right-3 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gold border border-black"></span>
              </div>
            )}

            {/* Pulse Background */}
            {hasNewPR && <div className="absolute inset-0 bg-gold/5 animate-pulse z-0" />}

            <div className="relative">
              <div
                className={`p-2 rounded-2xl border transition-transform mb-1 ${hasNewPR ? 'bg-gold text-black border-gold scale-110' : 'bg-surface2 border-white/10 text-gold group-hover:scale-110'}`}
              >
                <Icons.Records size={20} />
              </div>
            </div>
            <div className={`text-[9px] font-black uppercase tracking-widest ${hasNewPR ? 'text-gold' : 'text-foreground'}`}>Records</div>
          </div>
        </SectionCard>
      </div>

      {/* 6. LIBRARY WIDGET */}
      <SectionCard className="p-0 flex flex-col items-center justify-center gap-2 group h-24 active:scale-[0.98] transition-transform cursor-pointer overflow-hidden relative col-span-2 animate-zoom-in delay-500">
        <div
          onClick={() => {
            triggerHaptic('click');
            navigate('/library');
          }}
          className="w-full h-full flex flex-row items-center justify-between px-6 relative z-10"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-surface2/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4">
            <div className="p-2 bg-surface2 rounded-2xl border border-white/10 text-foreground group-hover:scale-110 transition-transform">
              <Icons.Dumbbell size={20} />
            </div>
            <div className="text-left">
              <div className="text-lg font-black text-foreground italic">BIBLIOTHÈQUE</div>
              <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">{libraryCount} EXERCICES</div>
            </div>
          </div>
          <Icons.ChevronRight size={20} className="text-secondary/50" />
        </div>
      </SectionCard>
    </>
  );
};
