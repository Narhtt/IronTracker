import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { triggerHaptic } from '../../core/utils';
import { Icons } from '../icons/Icons';
import { WorkoutSession } from '../../core/types';

interface AppHeaderProps {
  session: WorkoutSession | null;
  timerString: string;
  restTarget: number | null;
  restTime: number | null;
  setRestTarget: (val: number | null | ((prev: number | null) => number | null)) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ session, timerString, restTarget, restTime, setRestTarget }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isWorkoutView = location.pathname === '/workout';
  const isLogMode = session?.mode === 'log';

  return (
    <header className="fixed top-0 inset-x-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 h-16 flex justify-center px-4 transition-all">
      <div className="w-full max-w-lg flex items-center justify-between">
        {location.pathname !== '/' && (
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-secondary hover:text-primary transition-colors"
            aria-label="Retour"
          >
            <Icons.ChevronLeft size={24} />
          </button>
        )}

        {location.pathname === '/' ? (
          <h1 className="text-xl font-black italic tracking-tighter cursor-pointer text-foreground">
            IRON<span className="text-primary">TRACKER</span>
          </h1>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex items-center gap-2">
          {/* Manual Rest Timer Trigger */}
          {isWorkoutView && !isLogMode && !restTarget && (
            <button
              onClick={() => {
                triggerHaptic('click');
                setRestTarget(Date.now() + 180000);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border text-secondary active:scale-90 transition-transform hover:bg-surface2 hover:text-foreground"
              aria-label="Lancer Chrono Repos"
            >
              <Icons.Stopwatch size={16} />
            </button>
          )}

          {/* Active Rest Timer Indicator (Pip) */}
          {restTime !== null && !isWorkoutView && (
            <button
              onClick={() => {
                triggerHaptic('click');
                navigate('/workout');
              }}
              className="px-3 py-1 bg-surface border border-primary/30 rounded-full flex items-center gap-2 animate-pulse hover:bg-surface2 transition-colors"
              aria-label="Retour au Chrono"
            >
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-mono font-bold text-primary text-xs">
                {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
              </span>
            </button>
          )}

          {/* Session Duration */}
          {session && isWorkoutView && !isLogMode && (
            <div className="px-3 py-1 bg-surface2/50 text-foreground text-[10px] font-mono font-bold rounded-full border border-border">
              {timerString}
            </div>
          )}

          {/* Active Session Indicator (Outside Workout) */}
          {session && !isWorkoutView && (
            <button
              onClick={() => {
                triggerHaptic('click');
                navigate('/workout');
              }}
              className="px-3 py-1 bg-green-500/20 text-green-500 text-[10px] font-black uppercase rounded-full border border-green-500/50 animate-pulse"
              aria-label="Retour à la séance"
            >
              En cours
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
