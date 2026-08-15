import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../../components/icons/Icons';

export const DashboardHeader: React.FC = () => {
  const navigate = useNavigate();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 5) return 'LATE NIGHT.';
    if (hour < 12) return 'GOOD MORNING.';
    if (hour < 18) return 'GOOD AFTERNOON.';
    return 'GOOD EVENING.';
  }, []);

  return (
    <div className="flex justify-between items-end px-2">
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-foreground italic uppercase">{greeting}</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-primary/80">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>
      <button
        onClick={() => navigate('/settings')}
        className="w-11 h-11 rounded-full bg-surface2/50 flex items-center justify-center text-secondary hover:text-foreground hover:bg-surface2 transition-all border border-white/10 hover:border-border active:scale-95 shadow-sm"
        aria-label="Paramètres"
      >
        <Icons.Settings size={22} />
      </button>
    </div>
  );
};
