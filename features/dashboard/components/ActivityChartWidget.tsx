import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionCard } from '../../../components/ui/SectionCard';
import { Icons } from '../../../components/icons/Icons';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { CHART_CONFIG } from '../../../components/ui/ChartContainer';

interface ActivityChartWidgetProps {
  data: { day: string; val: number }[];
  totalSets: number;
}

export const ActivityChartWidget: React.FC<ActivityChartWidgetProps> = ({ data, totalSets }) => {
  const navigate = useNavigate();

  return (
    <SectionCard className="col-span-2 p-5 relative overflow-hidden group cursor-pointer active:scale-[0.99] transition-transform animate-zoom-in delay-150">
      <div onClick={() => navigate('/analytics')} className="h-full flex flex-col justify-between relative z-10">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary to-primary/50 rounded-2xl text-white shadow-lg shadow-primary/20">
              <Icons.TrendUp size={20} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-secondary uppercase tracking-widest">Activité Hebdo</div>
              <div className="text-2xl font-black text-foreground leading-none">
                {totalSets} <span className="text-xs text-secondary font-bold">SETS</span>
              </div>
            </div>
          </div>
          <Icons.ChevronRight size={16} className="text-secondary/30 group-hover:text-foreground transition-colors" />
        </div>

        <div className="h-24 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  {/* Use var(--primary-css) for valid RGB color string in SVG */}
                  <stop offset="5%" stopColor="var(--primary-css)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--primary-css)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={CHART_CONFIG.axisStyle}
                interval={0}
                dy={10}
                padding={{ left: 10, right: 10 }}
              />
              <Tooltip
                cursor={{ stroke: 'var(--primary-css)', strokeWidth: 1 }}
                contentStyle={{ display: 'none' }} // Minimal tooltip for dashboard
              />
              <Area type="monotone" dataKey="val" stroke="var(--primary-css)" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionCard>
  );
};
