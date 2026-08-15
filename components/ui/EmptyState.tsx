import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, action }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center animate-fade-in space-y-4">
      {icon && React.isValidElement(icon) && (
        <div className="text-secondary/10 p-4 rounded-full bg-white/5 mb-2">
          {/* Clone element to enforce size if needed, or rely on passed icon props */}
          {React.cloneElement(icon as React.ReactElement<{ size?: number; strokeWidth?: number }>, { size: 48, strokeWidth: 1 })}
        </div>
      )}
      <div className="space-y-1">
        <div className="text-sm font-black uppercase tracking-widest text-secondary">{title}</div>
        {subtitle && <div className="text-xs text-secondary/50 font-medium max-w-[200px] mx-auto leading-relaxed">{subtitle}</div>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
