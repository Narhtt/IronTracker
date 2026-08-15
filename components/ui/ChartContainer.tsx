import React from 'react';
import { SectionCard } from './SectionCard';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  height?: string; // Tailwind class, defaults to h-64
  action?: React.ReactNode; // Optional header button (e.g. RST)
  footer?: React.ReactNode; // Optional legend or footer info
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, height = 'h-64', action, footer }) => {
  return (
    <SectionCard className="p-3 flex flex-col" radius="rounded-2xl">
      <div className={`flex items-center ${title ? 'mb-4' : 'mb-0'} ${action ? 'justify-between' : 'justify-center'}`}>
        <h3 className="text-xs font-bold uppercase text-secondary tracking-wider">{title}</h3>
        {action && <div>{action}</div>}
      </div>

      <div className={`w-full ${height} overflow-hidden`}>{children}</div>

      {footer && <div className="mt-2 pt-2 border-t border-border/30">{footer}</div>}
    </SectionCard>
  );
};

// Reusable standard chart configs using CSS VARIABLES for theming support
// FIXED: Variables must be wrapped in rgb() for SVG consumption
export const CHART_CONFIG = {
  axisStyle: {
    fontSize: 10,
    fill: 'rgb(var(--muted))', // FIX: Added rgb() wrapper
    fontWeight: 600,
    fontFamily: 'JetBrains Mono, monospace',
  },
  gridStyle: {
    stroke: 'rgb(var(--border))', // FIX: Added rgb() wrapper
    strokeOpacity: 0.3,
    strokeDasharray: '3 3',
  },
  tooltipStyle: {
    contentStyle: {
      backgroundColor: 'rgb(var(--surface))',
      border: '1px solid rgb(var(--border))',
      borderRadius: '12px',
      boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)',
      padding: '8px 12px',
      color: 'rgb(var(--foreground))',
    },
    itemStyle: {
      fontSize: '12px',
      color: 'rgb(var(--foreground))',
      fontWeight: 'bold',
    },
    labelStyle: {
      color: 'rgb(var(--muted))',
      marginBottom: '4px',
      fontSize: '10px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    cursor: {
      fill: 'transparent',
      stroke: 'rgb(var(--border))',
      strokeWidth: 1,
      strokeDasharray: '4 4',
    },
  },
};
