import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../../components/icons/Icons';
import { InsightItem } from '../../../core/types';
import { triggerHaptic } from '../../../core/utils';

interface InsightBannerProps {
  insight: InsightItem[] | { title: string | null; text: string | null } | null;
}

export const InsightBanner: React.FC<InsightBannerProps> = ({ insight }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Normalize input to array
  const items: InsightItem[] = Array.isArray(insight)
    ? insight
    : insight
      ? [
          {
            id: 'legacy',
            title: insight.title || '',
            text: insight.text || '',
            level: 'info',
            priority: 10,
          },
        ]
      : [];

  // Timer Ref for Auto-Play
  const timerRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);
  }, [items.length]);

  useEffect(() => {
    if (items.length > 1) {
      resetTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length, resetTimer]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  // Colors & Icons based on ID/Level - STRICT HARMONIZATION
  // Pattern: bg-{color}/10 border-{color}/20 text-{color} backdrop-blur-md
  const getVisuals = (item: InsightItem) => {
    // Specific Insight Styling
    if (item.id === 'welcome') {
      return {
        icon: <Icons.Play size={16} />, // Reduced size for sharper look
        style: 'bg-primary/10 border-primary/20 text-primary backdrop-blur-md',
      };
    }
    if (item.id === 'streak') {
      return {
        icon: <Icons.Flame size={18} />,
        style: 'bg-orange/10 border-orange/20 text-orange backdrop-blur-md',
      };
    }
    if (item.id === 'readiness') {
      if (item.level === 'danger')
        return { icon: <Icons.Fitness size={18} />, style: 'bg-danger/10 border-danger/20 text-danger backdrop-blur-md' };
      if (item.level === 'warning')
        return { icon: <Icons.Fitness size={18} />, style: 'bg-warning/10 border-warning/20 text-warning backdrop-blur-md' };
      return { icon: <Icons.Fitness size={18} />, style: 'bg-success/10 border-success/20 text-success backdrop-blur-md' };
    }
    if (item.id === 'focus') {
      return {
        icon: <Icons.Search size={18} />,
        style: 'bg-blue-400/10 border-blue-400/20 text-blue-400 backdrop-blur-md',
      };
    }

    // Fallback / Legacy Styling (TrendUp)
    switch (item.level) {
      case 'danger':
        return { icon: <Icons.TrendUp size={18} />, style: 'bg-danger/10 border-danger/20 text-danger backdrop-blur-md' };
      case 'warning':
        return { icon: <Icons.TrendUp size={18} />, style: 'bg-warning/10 border-warning/20 text-warning backdrop-blur-md' };
      case 'success':
        return { icon: <Icons.TrendUp size={18} />, style: 'bg-success/10 border-success/20 text-success backdrop-blur-md' };
      default:
        return { icon: <Icons.TrendUp size={18} />, style: 'bg-primary/10 border-primary/20 text-primary backdrop-blur-md' };
    }
  };

  const visuals = getVisuals(currentItem);

  // --- INTERACTION HANDLERS ---

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to analytics
    triggerHaptic('click');
    setCurrentIndex(index);
    resetTimer();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - endX;

    if (Math.abs(diff) > 50) {
      triggerHaptic('tick');
      if (diff > 0) setCurrentIndex((prev) => (prev + 1) % items.length);
      else setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    }

    if (items.length > 1) resetTimer();
    touchStartX.current = null;
  };

  return (
    <div className="relative mx-1">
      <div
        onClick={() => navigate('/analytics')}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="bg-surface2/30 border border-white/5 rounded-2xl p-3 flex flex-col justify-center min-h-[64px] backdrop-blur-md cursor-pointer active:scale-[0.99] transition-transform group animate-zoom-in delay-75 overflow-hidden shadow-sm hover:bg-surface2/40"
      >
        <div className="flex items-center gap-4 relative z-10">
          {/* Icon Container - Harmonized Style */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors duration-500 ${visuals.style}`}>
            {visuals.icon}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[9px] font-black uppercase text-secondary tracking-widest">{currentItem.title}</span>

              {/* INTERACTIVE Pagination Dots */}
              {items.length > 1 && (
                <div className="flex gap-2 p-1 -m-1">
                  {' '}
                  {/* Padding hit area boost */}
                  {items.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => handleDotClick(i, e)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-foreground scale-125' : 'bg-foreground/10 hover:bg-foreground/30'}`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Main Message */}
            <div className="text-xs font-bold text-foreground truncate animate-fade-in key={currentIndex} leading-tight">
              {currentItem.text}
            </div>
          </div>

          <Icons.ChevronRight size={16} className="text-secondary/20 group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </div>
  );
};
