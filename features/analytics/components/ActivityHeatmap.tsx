import React, { useMemo, useState, useRef } from 'react';
import { SectionCard } from '../../../components/ui/SectionCard';
import { Icons } from '../../../components/icons/Icons';
import { triggerHaptic } from '../../../core/utils';
import { MUSCLE_COLORS, MUSCLE_GROUPS } from '../../../core/constants';
import { WorkoutSession, LibraryExercise } from '../../../core/types';

interface ActivityHeatmapProps {
  history: WorkoutSession[];
  library: LibraryExercise[];
  weightUnit?: string;
}

interface DayData {
  date: Date;
  dateStr: string;
  dayOfWeek: number; // 0 = Mon ... 6 = Sun
  weekIndex: number;
  totalSets: number;
  totalVolume: number;
  sessionsCount: number;
  sessions: WorkoutSession[];
  muscleSets: Record<string, number>;
  intensityLevel: 0 | 1 | 2 | 3 | 4;
}

const ALL_FILTER = 'Tous';
const MUSCLE_FILTER_OPTIONS = [
  ALL_FILTER,
  ...MUSCLE_GROUPS.PRIMARY,
  'Épaules',
  'Bras',
  'Abdos',
];

const MONTH_NAMES_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const DAYS_LABELS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ history, library, weightUnit = 'kg' }) => {
  const [selectedMuscle, setSelectedMuscle] = useState<string>(ALL_FILTER);
  const [metricMode, setMetricMode] = useState<'sets' | 'volume'>('sets');
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [tooltipState, setTooltipState] = useState<{
    x: number;
    y: number;
    placement: 'top' | 'bottom';
  } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Map for fast library lookup
  const libMap = useMemo(() => {
    const map = new Map<number, LibraryExercise>();
    library.forEach((l) => map.set(l.id, l));
    return map;
  }, [library]);

  // Generate 52 weeks grid (364 days ending today or this week Sunday)
  const { weeks, monthLabels, totalYearSets, totalYearVolume, totalActiveDays, streakStats } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // End on upcoming/current Sunday
    const currentDay = today.getDay(); // 0 is Sun, 1 is Mon...
    const diffToSunday = currentDay === 0 ? 0 : 7 - currentDay;
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + diffToSunday);

    // 52 weeks = 364 days (52 * 7)
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 52 * 7 + 1);
    startDate.setHours(0, 0, 0, 0);

    // Map history to date strings YYYY-MM-DD
    const sessionsByDateStr = new Map<string, WorkoutSession[]>();
    history.forEach((s) => {
      const d = new Date(s.startTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const existing = sessionsByDateStr.get(key) || [];
      existing.push(s);
      sessionsByDateStr.set(key, existing);
    });

    const dayCells: DayData[] = [];
    const curDate = new Date(startDate);

    let maxMetricVal = 1;
    let yearSets = 0;
    let yearVol = 0;
    let activeDaysCount = 0;

    while (curDate <= endDate) {
      const dateStr = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, '0')}-${String(curDate.getDate()).padStart(2, '0')}`;
      const daySessions = sessionsByDateStr.get(dateStr) || [];
      const dayOfWeek = (curDate.getDay() + 6) % 7; // 0 = Mon ... 6 = Sun

      let daySets = 0;
      let dayVol = 0;
      const mSets: Record<string, number> = {};

      daySessions.forEach((s) => {
        s.exercises.forEach((ex) => {
          const lib = libMap.get(ex.exerciseId);
          const muscle = lib?.muscle || 'Autre';
          const validSets = ex.sets.filter((st) => st.done && !st.isWarmup);

          const matchesFilter = selectedMuscle === ALL_FILTER || muscle === selectedMuscle;
          if (matchesFilter) {
            daySets += validSets.length;
            mSets[muscle] = (mSets[muscle] || 0) + validSets.length;

            if (lib && lib.type !== 'Cardio' && lib.type !== 'Statique' && lib.type !== 'Étirement') {
              validSets.forEach((st) => {
                const w = parseFloat(st.weight) || 0;
                const r = parseFloat(st.reps) || 0;
                dayVol += w * r;
              });
            }
          }
        });
      });

      if (daySessions.length > 0) {
        activeDaysCount++;
      }
      yearSets += daySets;
      yearVol += dayVol;

      const evalVal = metricMode === 'sets' ? daySets : dayVol;
      if (evalVal > maxMetricVal) {
        maxMetricVal = evalVal;
      }

      dayCells.push({
        date: new Date(curDate),
        dateStr,
        dayOfWeek,
        weekIndex: Math.floor(dayCells.length / 7),
        totalSets: daySets,
        totalVolume: dayVol,
        sessionsCount: daySessions.length,
        sessions: daySessions,
        muscleSets: mSets,
        intensityLevel: 0, // calculated below
      });

      curDate.setDate(curDate.getDate() + 1);
    }

    // Assign intensity levels 0..4 (quantiles)
    dayCells.forEach((cell) => {
      const val = metricMode === 'sets' ? cell.totalSets : cell.totalVolume;
      if (val === 0) {
        cell.intensityLevel = 0;
      } else if (metricMode === 'sets') {
        if (val <= 6) cell.intensityLevel = 1;
        else if (val <= 14) cell.intensityLevel = 2;
        else if (val <= 22) cell.intensityLevel = 3;
        else cell.intensityLevel = 4;
      } else {
        const ratio = val / maxMetricVal;
        if (ratio < 0.25) cell.intensityLevel = 1;
        else if (ratio < 0.5) cell.intensityLevel = 2;
        else if (ratio < 0.75) cell.intensityLevel = 3;
        else cell.intensityLevel = 4;
      }
    });

    // Group into 52 weeks of 7 days
    const computedWeeks: DayData[][] = [];
    for (let w = 0; w < 52; w++) {
      computedWeeks.push(dayCells.slice(w * 7, (w + 1) * 7));
    }

    // Compute month label positions
    const mLabels: { text: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    computedWeeks.forEach((week, wIdx) => {
      const firstDayOfMonth = week.find((d) => d.date.getDate() <= 7);
      if (firstDayOfMonth) {
        const m = firstDayOfMonth.date.getMonth();
        if (m !== lastMonth) {
          mLabels.push({ text: MONTH_NAMES_FR[m], weekIndex: wIdx });
          lastMonth = m;
        }
      }
    });

    // Compute streak stats
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Check backwards from today for current streak
    const todayIndex = dayCells.findIndex(
      (d) => d.date.getFullYear() === today.getFullYear() && d.date.getMonth() === today.getMonth() && d.date.getDate() === today.getDate()
    );

    if (todayIndex >= 0) {
      let pointer = todayIndex;
      // If no workout today, check if workout yesterday was active
      if (dayCells[pointer].sessionsCount === 0 && pointer > 0 && dayCells[pointer - 1].sessionsCount > 0) {
        pointer--;
      }
      while (pointer >= 0 && dayCells[pointer].sessionsCount > 0) {
        currentStreak++;
        pointer--;
      }
    }

    dayCells.forEach((d) => {
      if (d.sessionsCount > 0) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    });

    return {
      weeks: computedWeeks,
      monthLabels: mLabels,
      totalYearSets: yearSets,
      totalYearVolume: yearVol,
      totalActiveDays: activeDaysCount,
      streakStats: { currentStreak, bestStreak },
    };
  }, [history, libMap, selectedMuscle, metricMode]);

  // Color selection based on filter
  const activeColorHex = useMemo(() => {
    if (selectedMuscle !== ALL_FILTER && MUSCLE_COLORS[selectedMuscle]) {
      return MUSCLE_COLORS[selectedMuscle];
    }
    return '#10b981'; // Emerald/Green theme by default
  }, [selectedMuscle]);

  const getCellColor = (level: 0 | 1 | 2 | 3 | 4) => {
    if (level === 0) return 'rgba(255, 255, 255, 0.04)';
    if (level === 1) return `${activeColorHex}40`; // 25%
    if (level === 2) return `${activeColorHex}80`; // 50%
    if (level === 3) return `${activeColorHex}B3`; // 70%
    return activeColorHex; // 100%
  };

  const handleCellHover = (e: React.MouseEvent<HTMLDivElement>, day: DayData) => {
    if (!cardRef.current) return;
    const cardRect = cardRef.current.getBoundingClientRect();
    const cellRect = e.currentTarget.getBoundingClientRect();

    const rawX = cellRect.left + cellRect.width / 2 - cardRect.left;
    const padding = 100; // Tooltip safe margin
    const boundedX = Math.max(padding, Math.min(cardRect.width - padding, rawX));

    // Vertical placement: default top, flip to bottom if too close to card top
    const cellTopInCard = cellRect.top - cardRect.top;
    const placement = cellTopInCard < 110 ? 'bottom' : 'top';
    const y = placement === 'top' ? cellTopInCard - 8 : cellTopInCard + cellRect.height + 8;

    setTooltipState({ x: boundedX, y, placement });
    setHoveredDay(day);
  };

  // Scroll to end of 52-week grid on mount
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, []);

  return (
    <div ref={cardRef} className="relative">
      <SectionCard className="p-5 relative flex flex-col">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full" style={{ backgroundColor: activeColorHex }} />
            <div>
              <h3 className="text-xs font-black uppercase text-foreground tracking-tight flex items-center gap-1.5">
                Régularité Annuelle (52 Semaines)
              </h3>
              <span className="text-[10px] text-secondary">
                {totalActiveDays} jours actifs • {totalYearSets} séries validées
                {totalYearVolume > 0 && ` • ${(totalYearVolume / 1000).toFixed(1)}k ${weightUnit}`}
              </span>
            </div>
          </div>

          {/* Metric Switch & Muscle Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mode Séries vs Volume */}
            <div className="flex bg-surface2/60 p-0.5 rounded-lg border border-white/5">
              <button
                onClick={() => {
                  triggerHaptic('click');
                  setMetricMode('sets');
                }}
                className={`px-2 py-1 text-[9px] font-bold uppercase rounded transition-colors ${
                  metricMode === 'sets' ? 'bg-white/10 text-foreground shadow-sm' : 'text-secondary hover:text-foreground'
                }`}
              >
                Séries
              </button>
              <button
                onClick={() => {
                  triggerHaptic('click');
                  setMetricMode('volume');
                }}
                className={`px-2 py-1 text-[9px] font-bold uppercase rounded transition-colors ${
                  metricMode === 'volume' ? 'bg-white/10 text-foreground shadow-sm' : 'text-secondary hover:text-foreground'
                }`}
              >
                Volume
              </button>
            </div>
          </div>
        </div>

        {/* Muscle Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-none border-b border-white/5">
          {MUSCLE_FILTER_OPTIONS.map((m) => {
            const isSelected = selectedMuscle === m;
            const mColor = m !== ALL_FILTER ? MUSCLE_COLORS[m] : null;

            return (
              <button
                key={m}
                onClick={() => {
                  triggerHaptic('click');
                  setSelectedMuscle(m);
                }}
                className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-surface2 text-foreground border-white/20 shadow-sm'
                    : 'bg-transparent text-secondary hover:text-foreground border-transparent hover:border-white/5'
                }`}
              >
                {mColor && (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                    style={{ backgroundColor: mColor }}
                  />
                )}
                {m}
              </button>
            );
          })}
        </div>

        {/* 52-Week Grid (Horizontally Scrollable) */}
        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-white/10"
          onMouseLeave={() => {
            setHoveredDay(null);
            setTooltipState(null);
          }}
        >
          <div className="inline-block min-w-max">
            {/* Month Labels Bar */}
            <div className="flex text-[9px] font-mono text-secondary/60 mb-1.5 pl-6">
              {monthLabels.map((lbl, idx) => (
                <div
                  key={idx}
                  style={{
                    width: `${(idx < monthLabels.length - 1 ? monthLabels[idx + 1].weekIndex - lbl.weekIndex : 52 - lbl.weekIndex) * 14}px`,
                  }}
                  className="truncate"
                >
                  {lbl.text}
                </div>
              ))}
            </div>

            {/* Days Grid: 7 Rows (Mon..Sun) x 52 Columns (Weeks) */}
            <div className="flex gap-1">
              {/* Day of Week Labels (L, M, M, J, V, S, D) */}
              <div className="flex flex-col gap-1 pr-1.5 justify-between text-[8px] font-mono text-secondary/50 select-none">
                {DAYS_LABELS_FR.map((d, i) => (
                  <div key={i} className="h-2.5 flex items-center justify-center">
                    {i % 2 === 0 ? d : ''}
                  </div>
                ))}
              </div>

              {/* Weeks Columns */}
              <div className="flex gap-1">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1">
                    {week.map((day, dIdx) => {
                      const isHovered = hoveredDay?.dateStr === day.dateStr;
                      const isToday =
                        new Date().toDateString() === day.date.toDateString();

                      return (
                        <div
                          key={dIdx}
                          onMouseEnter={(e) => handleCellHover(e, day)}
                          onClick={(e) => {
                            triggerHaptic('click');
                            handleCellHover(e, day);
                          }}
                          style={{
                            backgroundColor: getCellColor(day.intensityLevel),
                            boxShadow: isHovered
                              ? `0 0 8px ${activeColorHex}`
                              : isToday
                                ? `inset 0 0 0 1px ${activeColorHex}`
                                : undefined,
                          }}
                          className={`w-2.5 h-2.5 rounded-[2px] cursor-pointer transition-all duration-150 relative ${
                            isHovered ? 'scale-125 z-10' : 'hover:scale-110'
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap Legend & Summary Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5 text-[10px]">
          {/* Streak summary */}
          <div className="flex items-center gap-4 text-secondary">
            <div className="flex items-center gap-1.5">
              <Icons.Zap size={13} className="text-primary" />
              <span>Série actuelle: <strong className="text-foreground">{streakStats.currentStreak} j</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icons.Award size={13} className="text-gold" />
              <span>Record: <strong className="text-foreground">{streakStats.bestStreak} j</strong></span>
            </div>
          </div>

          {/* Legend Scale */}
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-secondary">
            <span>Moins</span>
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: getCellColor(0) }} />
              <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: getCellColor(1) }} />
              <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: getCellColor(2) }} />
              <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: getCellColor(3) }} />
              <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: getCellColor(4) }} />
            </div>
            <span>Plus</span>
          </div>
        </div>
      </SectionCard>

      {/* Floating Tooltip positioned relative to card */}
      {hoveredDay && tooltipState && (
        <div
          style={{
            position: 'absolute',
            left: `${tooltipState.x}px`,
            top: `${tooltipState.y}px`,
            transform: tooltipState.placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            zIndex: 50,
          }}
          className="pointer-events-none bg-slate-900/95 backdrop-blur border border-slate-700/80 rounded-xl p-2.5 shadow-2xl text-[10px] text-white min-w-[155px] space-y-1 animate-fade-in"
        >
          <div className="font-bold text-slate-300 capitalize flex justify-between items-center border-b border-slate-800 pb-1">
            <span>
              {hoveredDay.date.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          {hoveredDay.sessionsCount > 0 ? (
            <div className="space-y-1 pt-0.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Séances:</span>
                <span className="font-bold text-primary">{hoveredDay.sessionsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Séries validées:</span>
                <span className="font-bold text-emerald-400">{hoveredDay.totalSets}</span>
              </div>
              {hoveredDay.totalVolume > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Volume:</span>
                  <span className="font-bold text-slate-200">
                    {Math.round(hoveredDay.totalVolume)} {weightUnit}
                  </span>
                </div>
              )}
              {hoveredDay.sessions.length > 0 && (
                <div className="pt-1 text-[9px] text-slate-400 font-sans truncate max-w-[160px]">
                  {hoveredDay.sessions.map((s) => s.sessionName).join(', ')}
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500 italic pt-0.5">Aucun entraînement</div>
          )}
        </div>
      )}
    </div>
  );
};
