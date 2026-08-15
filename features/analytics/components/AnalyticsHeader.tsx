import React from 'react';
import { triggerHaptic } from '../../../core/utils';

interface AnalyticsHeaderProps {
  period: '7d' | '30d' | '90d';
  setPeriod: (p: '7d' | '30d' | '90d') => void;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({ period, setPeriod }) => (
  <div className="flex items-center justify-between px-2">
    <h2 className="text-3xl font-black italic uppercase text-foreground">Activité</h2>
    <div className="bg-surface2/50 p-1 rounded-xl flex gap-1 border border-white/5">
      {(['7d', '30d', '90d'] as const).map((p) => (
        <button
          key={p}
          onClick={() => {
            triggerHaptic('click');
            setPeriod(p);
          }}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${period === p ? 'bg-primary text-black' : 'text-secondary hover:text-foreground'}`}
        >
          {p}
        </button>
      ))}
    </div>
  </div>
);
