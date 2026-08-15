import React from 'react';
import { SectionCard } from '../../../components/ui/SectionCard';
import { Icons } from '../../../components/icons/Icons';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PALETTE } from '../../../styles/tokens';
import { triggerHaptic } from '../../../core/utils';
import { CHART_CONFIG } from '../../../components/ui/ChartContainer';

interface EquipmentDonutProps {
  data: { name: string; value: number }[];
  onInfoClick: () => void;
}

const CAT_COLORS: Record<string, string> = {
  'Lib. 2m.': PALETTE.accents.blue.primary,
  'Lib. 1m.': PALETTE.accents.red.primary,
  Machine: PALETTE.accents.orange.primary,
  Poulie: PALETTE.accents.purple.primary,
  PDC: PALETTE.accents.emerald.primary,
  Divers: PALETTE.accents.gray.primary,
};

export const EquipmentDonut: React.FC<EquipmentDonutProps> = ({ data, onInfoClick }) => (
  <SectionCard className="p-4 h-72 flex flex-col relative z-0 hover:z-50 transition-all">
    <div className="flex items-center gap-2 mb-2 justify-between">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
        <h3 className="text-xs font-black uppercase text-foreground">Matériel</h3>
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
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value" stroke="none">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CAT_COLORS[entry.name] || PALETTE.text.secondary} />
            ))}
          </Pie>
          <Tooltip {...CHART_CONFIG.tooltipStyle} />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            iconSize={6}
            wrapperStyle={{ fontSize: '9px', opacity: 0.8, paddingTop: '10px' }}
            formatter={(value) => <span style={{ color: 'rgb(var(--foreground))' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </SectionCard>
);
