import React from 'react';
import { SectionCard } from '../../../components/ui/SectionCard';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PALETTE } from '../../../styles/tokens';
import { Icons } from '../../../components/icons/Icons';
import { triggerHaptic } from '../../../core/utils';
import { CHART_CONFIG } from '../../../components/ui/ChartContainer';
import { VolumeFatigueItem } from '../hooks/useAnalyticsData';

interface VolumeFatigueChartProps {
  data: VolumeFatigueItem[];
  onInfoClick: () => void;
}

export const VolumeFatigueChart: React.FC<VolumeFatigueChartProps> = ({ data, onInfoClick }) => (
  <SectionCard className="p-5 h-72 relative flex flex-col">
    {/* Header avec Z-Index élevé pour être au dessus du canvas Chart */}
    <div className="flex items-center gap-2 mb-4 justify-between relative z-20">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-primary rounded-full"></div>
        <h3 className="text-xs font-black uppercase text-foreground">Volume vs Fatigue</h3>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          triggerHaptic('click');
          onInfoClick();
        }}
        className="p-1.5 bg-surface2 rounded-lg text-secondary hover:text-gold transition-colors active:scale-90"
      >
        <Icons.Search size={12} />
      </button>
    </div>

    {/* Chart Container */}
    <div className="flex-1 w-full min-h-0 relative z-10">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ left: -20, right: 0, bottom: 0, top: 0 }}>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={CHART_CONFIG.axisStyle} dy={10} minTickGap={20} />
            <YAxis
              yAxisId="left"
              orientation="left"
              stroke={PALETTE.accents.blue.primary}
              axisLine={false}
              tickLine={false}
              tick={CHART_CONFIG.axisStyle}
            />
            <YAxis yAxisId="right" orientation="right" domain={[0, 6]} hide />
            <Tooltip {...CHART_CONFIG.tooltipStyle} />
            <Bar yAxisId="left" dataKey="volume" fill={PALETTE.accents.blue.primary} barSize={8} radius={[4, 4, 0, 0]} fillOpacity={0.6} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="fatigue"
              stroke={PALETTE.accents.orange.primary}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-secondary/40 text-xs italic">Pas de données</div>
      )}
    </div>
  </SectionCard>
);
