import React from 'react';
import { triggerHaptic } from '../../core/utils';
import { Icons } from '../icons/Icons';

interface RestTimerOverlayProps {
  restTime: number | null;
  showGo: boolean;
  setRestTarget: (val: number | null | ((prev: number | null) => number | null)) => void;
}

export const RestTimerOverlay: React.FC<RestTimerOverlayProps> = ({ restTime, showGo, setRestTarget }) => {
  if (restTime === null) return null;

  return (
    <div className="fixed left-0 right-0 z-40 pb-8 flex justify-center pointer-events-none transition-all duration-300 ease-in-out bottom-0 px-4">
      <div
        className={`
                pointer-events-auto 
                flex items-center gap-4 
                px-6 py-4 
                rounded-[2.5rem] 
                shadow-[0_8px_32px_rgba(0,0,0,0.5)] 
                backdrop-blur-xl 
                border 
                animate-slide-in-bottom 
                transition-all
                ${showGo ? 'bg-success/20 border-success text-success scale-110' : 'bg-surface/90 border-border text-foreground'}
             `}
      >
        {/* Timer Display */}
        <div className="flex flex-col items-center min-w-[80px]">
          {showGo ? (
            <div className="flex items-center gap-2 animate-pulse">
              <Icons.Flame size={24} fill="currentColor" />
              <span className="text-2xl font-black italic">GO!</span>
            </div>
          ) : (
            <>
              <span className="text-[9px] font-black uppercase text-secondary/70 tracking-widest mb-0.5">Repos</span>
              <span className="text-3xl font-mono font-bold tracking-tighter leading-none tabular-nums">
                {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
              </span>
            </>
          )}
        </div>

        {/* Controls Divider */}
        {!showGo && <div className="w-px h-8 bg-foreground/10 mx-1" />}

        {/* Controls */}
        {!showGo && (
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                triggerHaptic('click');
                setRestTarget((prev) => (prev || Date.now()) - 30000);
              }}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/5 text-foreground font-bold text-xs active:scale-90 hover:bg-white/10 transition-all flex items-center justify-center"
            >
              -30
            </button>
            <button
              onClick={() => {
                triggerHaptic('click');
                setRestTarget((prev) => (prev || Date.now()) + 30000);
              }}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/5 text-foreground font-bold text-xs active:scale-90 hover:bg-white/10 transition-all flex items-center justify-center"
            >
              +30
            </button>
            <button
              onClick={() => {
                triggerHaptic('click');
                setRestTarget(null);
              }}
              className="w-10 h-10 rounded-full bg-danger/10 border border-danger/20 text-danger font-bold active:scale-90 hover:bg-danger/20 transition-all flex items-center justify-center ml-1"
            >
              <Icons.Close size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
