import React from 'react';
import { SectionCard } from '../../../components/ui/SectionCard';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ReferenceArea, ResponsiveContainer } from 'recharts';
import { PALETTE } from '../../../styles/tokens';
import { MUSCLE_COLORS, TYPE_COLORS } from '../../../core/constants';
import { ExerciseType } from '../../../core/types';
import { Icons } from '../../../components/icons/Icons';
import { triggerHaptic } from '../../../core/utils';
import { CHART_CONFIG } from '../../../components/ui/ChartContainer';
import { WeeklyVolumeItem } from '../hooks/useAnalyticsData';

interface WeeklyVolumeChartProps {
  data: WeeklyVolumeItem[];
  mode: 'muscle' | 'type';
  setMode: (m: 'muscle' | 'type') => void;
  onInfoClick: () => void;
}

export const WeeklyVolumeChart: React.FC<WeeklyVolumeChartProps> = ({ data, mode, setMode, onInfoClick }) => (
  <SectionCard className="p-5 h-72 relative flex flex-col">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
        <h3 className="text-xs font-black uppercase text-foreground">Volume Hebdo (Moy.)</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('click');
            onInfoClick();
          }}
          className="p-1.5 bg-surface2 rounded-lg text-secondary hover:text-gold transition-colors ml-1"
        >
          <Icons.Search size={12} />
        </button>
      </div>
      <div className="flex bg-surface2/50 p-0.5 rounded-lg border border-white/5">
        <button
          onClick={() => setMode('muscle')}
          className={`px-2 py-1 text-[8px] font-bold uppercase rounded ${mode === 'muscle' ? 'bg-white/10 text-foreground' : 'text-secondary'}`}
        >
          Muscle
        </button>
        <button
          onClick={() => setMode('type')}
          className={`px-2 py-1 text-[8px] font-bold uppercase rounded ${mode === 'type' ? 'bg-white/10 text-foreground' : 'text-secondary'}`}
        >
          Type
        </button>
      </div>
    </div>
    <div className="flex-1 w-full min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ ...CHART_CONFIG.axisStyle, fontSize: 9 }} dy={10} interval={0} />
          <YAxis axisLine={false} tickLine={false} tick={CHART_CONFIG.axisStyle} />
          <ReferenceArea y1={10} y2={20} fill={PALETTE.accents.emerald.primary} fillOpacity={0.1} />
          <Tooltip {...CHART_CONFIG.tooltipStyle} cursor={{ fill: 'transparent' }} />
          <Bar dataKey="avgSets" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => {
              const color = mode === 'muscle' ? MUSCLE_COLORS[entry.realName] : TYPE_COLORS[entry.realName as ExerciseType];
              return <Cell key={`cell-${index}`} fill={color || PALETTE.text.secondary} fillOpacity={0.8} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </SectionCard>
);
