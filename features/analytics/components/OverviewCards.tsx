import React from 'react';
import { SectionCard } from '../../../components/ui/SectionCard';

interface OverviewCardsProps {
  stats: { totalSessions: number; totalSets: number; totalTonnage: number };
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ stats }) => (
  <div className="grid grid-cols-3 gap-3">
    <SectionCard className="p-4 flex flex-col items-center justify-center gap-1">
      <div className="text-2xl font-black text-foreground">{stats.totalSessions}</div>
      <div className="text-[9px] font-bold uppercase text-secondary">Séances</div>
    </SectionCard>
    <SectionCard className="p-4 flex flex-col items-center justify-center gap-1">
      <div className="text-2xl font-black text-foreground">{stats.totalSets}</div>
      <div className="text-[9px] font-bold uppercase text-secondary">Sets</div>
    </SectionCard>
    <SectionCard className="p-4 flex flex-col items-center justify-center gap-1">
      <div className="text-2xl font-black text-foreground">{stats.totalTonnage}k</div>
      <div className="text-[9px] font-bold uppercase text-secondary">Tonnage</div>
    </SectionCard>
  </div>
);
