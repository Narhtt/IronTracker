import React from 'react';
import { SectionCard } from '../../../components/ui/SectionCard';
import { Icons } from '../../../components/icons/Icons';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts';
import { PALETTE } from '../../../styles/tokens';
import { triggerHaptic } from '../../../core/utils';
import { SBDStatItem } from '../hooks/useAnalyticsData';

interface SBDRadarProps {
  stats: {
    data: SBDStatItem[];
    total: number;
    ratio: string;
  };
  onInfoClick: () => void;
}

export const SBDRadar: React.FC<SBDRadarProps> = ({ stats, onInfoClick }) => (
  <SectionCard className="p-4 h-72 flex flex-col relative z-0 hover:z-50 transition-all">
    <div className="flex items-center gap-2 mb-2 justify-between">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-gold rounded-full"></div>
        <h3 className="text-xs font-black uppercase text-foreground">SBD (Ratio)</h3>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          triggerHaptic('click');
          onInfoClick();
        }}
        className="p-1.5 bg-surface2 rounded-lg text-secondary hover:text-gold transition-colors"
      >
        <Icons.Search size={12} />
      </button>
    </div>
    <div className="flex-1 min-h-0 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={stats.data}>
          <PolarGrid stroke={PALETTE.border} />
          <PolarAngleAxis dataKey="name" tick={{ fill: PALETTE.text.secondary, fontSize: 9, fontWeight: 700 }} />
          <Radar
            name="Niveau"
            dataKey="value"
            stroke={PALETTE.accents.gold.primary}
            fill={PALETTE.accents.gold.primary}
            fillOpacity={0.4}
          />
          <PolarGrid gridType="circle" />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-surface border border-border p-2 rounded-lg text-xs">
                    <div className="font-bold text-gold">{d.name}</div>
                    <div>
                      Ratio: <span className="font-mono text-foreground">{d.displayRatio}x</span>
                    </div>
                    <div>
                      Max: <span className="font-mono text-foreground">{d.raw}kg</span>
                    </div>
                    <div className="text-[9px] text-secondary mt-1">Niveau: {d.value}% Élite</div>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="absolute bottom-0 right-0 text-[10px] text-gold font-bold text-right leading-tight">
        <div>Total: {stats.total} kg</div>
        <div className="text-secondary/70">Ratio: {stats.ratio}x</div>
      </div>
    </div>
  </SectionCard>
);
