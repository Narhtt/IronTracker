import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionCard } from '../../../components/ui/SectionCard';
import { Icons } from '../../../components/icons/Icons';
import { triggerHaptic } from '../../../core/utils';
import { ProgramSession, WorkoutSession } from '../../../core/types';

interface SmartStartWidgetProps {
  activeSession: WorkoutSession | null;
  availableSessions: { progName: string; sess: ProgramSession }[];
  onStartSession: (progName: string, sess: ProgramSession, mode: 'active' | 'log') => void;
  lastSession?: WorkoutSession;
}

export const SmartStartWidget: React.FC<SmartStartWidgetProps> = ({ activeSession, availableSessions, onStartSession, lastSession }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Swipe State
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-select next session based on history
  useEffect(() => {
    if (availableSessions.length === 0) return;
    if (lastSession) {
      const foundIdx = availableSessions.findIndex(
        (item) => item.progName === lastSession.programName && item.sess.name === lastSession.sessionName
      );
      if (foundIdx >= 0) {
        const next = (foundIdx + 1) % availableSessions.length;
        setCurrentIndex(next);
      }
    }
  }, [lastSession, availableSessions]);

  const currentSelection = availableSessions[currentIndex];

  const cycleSelection = (dir: -1 | 1) => {
    if (activeSession) return;
    triggerHaptic('tick');
    setCurrentIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return availableSessions.length - 1;
      if (next >= availableSessions.length) return 0;
      return next;
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      cycleSelection(1);
    } else if (distance < -minSwipeDistance) {
      cycleSelection(-1);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <SectionCard className="col-span-2 p-3 flex flex-col items-center justify-center gap-3 min-h-[160px] animate-zoom-in delay-200 touch-pan-y">
      <div
        className="w-full flex flex-col items-center gap-3"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {activeSession ? (
          // ACTIVE SESSION STATE
          <>
            <div className="w-full text-center py-2 opacity-50 select-none">
              <div className="text-[9px] font-black text-secondary uppercase tracking-widest mb-1">Séance en cours</div>
              <div className="text-lg font-bold text-foreground truncate">{activeSession.sessionName}</div>
            </div>
            <button
              onClick={() => {
                triggerHaptic('click');
                navigate('/workout');
              }}
              className="w-full h-16 rounded-[1.5rem] bg-surface2 border border-primary/20 text-primary flex items-center justify-center shadow-lg active:scale-95 transition-all group animate-pulse"
            >
              <span className="ml-2 font-black italic text-lg tracking-wider">REPRENDRE</span>
            </button>
          </>
        ) : availableSessions.length > 0 ? (
          // STANDARD SELECTOR STATE
          <>
            <div className="w-full flex items-center justify-between px-2 select-none">
              <button
                onClick={() => cycleSelection(-1)}
                className="p-2 text-secondary hover:text-foreground active:scale-90 transition-transform"
              >
                <Icons.ChevronLeft size={20} />
              </button>
              <div className="text-center pointer-events-none">
                <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 border border-primary/30 px-2 py-0.5 rounded-full bg-primary/5 inline-block">
                  {currentSelection?.progName}
                </div>
                <div className="text-xl font-black text-foreground truncate max-w-[200px]">{currentSelection?.sess.name}</div>
              </div>
              <button
                onClick={() => cycleSelection(1)}
                className="p-2 text-secondary hover:text-foreground active:scale-90 transition-transform"
              >
                <Icons.ChevronRight size={20} />
              </button>
            </div>
            <button
              onClick={() => {
                if (!currentSelection) return;
                triggerHaptic('success');
                onStartSession(currentSelection.progName, currentSelection.sess, 'active');
              }}
              className="w-full h-16 rounded-[1.5rem] bg-primary text-white flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.4)] active:scale-95 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <Icons.Play size={28} fill="currentColor" className="text-white drop-shadow-md" />
              <span className="ml-2 font-black italic text-lg tracking-wider">START</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/programs')}
            className="w-full h-24 rounded-[1.5rem] flex items-center justify-center gap-2 text-secondary hover:text-foreground transition-colors border-2 border-dashed border-white/10 hover:border-white/30"
          >
            <Icons.Plus size={20} />
            <span className="font-bold">Créer un programme</span>
          </button>
        )}
      </div>
    </SectionCard>
  );
};
