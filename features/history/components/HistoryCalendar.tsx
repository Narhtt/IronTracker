import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../../store/useStore';
import { Modal } from '../../../components/ui/Modal';
import { Icons } from '../../../components/icons/Icons';
import { triggerHaptic } from '../../../core/utils';
import { FATIGUE_COLORS, MUSCLE_COLORS, TYPE_COLORS } from '../../../core/constants';
import { ProgramSession, WorkoutSession } from '../../../core/types';
import { SessionDetailModal } from './SessionDetailModal';

interface HistoryCalendarProps {
  onStartSession: (progName: string, sess: ProgramSession, mode: 'active' | 'log') => void;
}

export const HistoryCalendar: React.FC<HistoryCalendarProps> = ({ onStartSession }) => {
  const navigate = useNavigate();
  const history = useStore((s) => s.history);
  const library = useStore((s) => s.library);
  const programs = useStore((s) => s.programs);

  const [calDate, setCalDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewingSession, setViewingSession] = useState<WorkoutSession | null>(null);
  const [calendarMode, setCalendarMode] = useState<'muscle' | 'type'>('muscle');
  const [showHistoryProgramPicker, setShowHistoryProgramPicker] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const curMonth = calDate.getMonth();
  const curYear = calDate.getFullYear();
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const firstDay = new Date(curYear, curMonth, 1).getDay();
  const emptyDays = firstDay === 0 ? 6 : firstDay - 1;

  // Helper pour vérifier "Aujourd'hui"
  const isToday = (day: number) => {
    const now = new Date();
    return now.getDate() === day && now.getMonth() === curMonth && now.getFullYear() === curYear;
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-fade-in relative">
      {/* Controls Header - Rounded-3xl */}
      <div className="flex flex-col gap-3 flex-shrink-0">
        <div className="flex justify-between items-center px-2 bg-surface2/50 p-2 rounded-3xl border border-white/5">
          <button
            onClick={() => {
              triggerHaptic('click');
              setCalDate(new Date(curYear, curMonth - 1));
            }}
            className="p-2 text-secondary hover:text-foreground"
          >
            <Icons.ChevronLeft size={16} />
          </button>
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
            {calDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => {
              triggerHaptic('click');
              setCalDate(new Date(curYear, curMonth + 1));
            }}
            className="p-2 text-secondary hover:text-foreground"
          >
            <Icons.ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 flex bg-surface2/50 p-1 rounded-2xl">
            <button
              onClick={() => {
                triggerHaptic('click');
                setCalendarMode('muscle');
              }}
              className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl transition-colors ${calendarMode === 'muscle' ? 'bg-surface text-foreground shadow-sm' : 'text-secondary hover:text-foreground'}`}
            >
              Muscles
            </button>
            <button
              onClick={() => {
                triggerHaptic('click');
                setCalendarMode('type');
              }}
              className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl transition-colors ${calendarMode === 'type' ? 'bg-surface text-foreground shadow-sm' : 'text-secondary hover:text-foreground'}`}
            >
              Types
            </button>
          </div>
          <button
            onClick={() => {
              triggerHaptic('click');
              setShowLegend(true);
            }}
            className="w-10 h-full bg-surface2/50 rounded-2xl flex items-center justify-center text-secondary hover:text-primary transition-colors border border-transparent hover:border-primary/30"
          >
            <Icons.Search size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 overflow-y-auto no-scrollbar pb-24 content-start">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, index) => (
          <div key={`day-header-${d}-${index}`} className="text-center text-[10px] font-bold text-secondary/40">
            {d}
          </div>
        ))}
        {Array.from({ length: emptyDays }).map((_, i) => (
          <div key={i} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayIsToday = isToday(day);

          const daySessions = history.filter((s) => {
            const d = new Date(s.startTime);
            return d.getDate() === day && d.getMonth() === curMonth && d.getFullYear() === curYear;
          });

          const count = daySessions.length;
          const lastSession = daySessions[daySessions.length - 1];
          const fatigueScore = lastSession ? lastSession.fatigue : null;

          // Distribution de volume / séries par muscle ou type
          const distribution: Record<string, number> = {};
          let totalSetsForDay = 0;

          daySessions.forEach((s) => {
            s.exercises.forEach((e) => {
              const l = library.find((lib) => lib.id === e.exerciseId);
              if (l) {
                const key = calendarMode === 'muscle' ? l.muscle : l.type;
                const setsCount = e.sets.filter((st) => st.done && !st.isWarmup).length;
                distribution[key] = (distribution[key] || 0) + setsCount;
                totalSetsForDay += setsCount;
              }
            });
          });

          const activeSegments = Object.entries(distribution).filter(([_, sets]) => sets > 0);
          const dots = activeSegments.slice(0, 4).map(([k]) => k);

          return (
            <button
              key={i}
              onClick={() => {
                triggerHaptic('click');
                setSelectedDate(new Date(curYear, curMonth, day));
              }}
              className={`
                                aspect-square flex flex-col items-center justify-between py-1.5 rounded-2xl text-xs transition-all relative overflow-hidden active:scale-95 border
                                ${dayIsToday ? 'border-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]' : 'border-transparent'}
                                ${
                                  count > 0
                                    ? 'bg-surface2 border-white/5 shadow-sm'
                                    : dayIsToday
                                      ? 'bg-surface2/50'
                                      : 'text-secondary/30 hover:bg-surface2/20'
                                }
                            `}
            >
              {/* Fatigue Dot */}
              {fatigueScore && count > 0 && (
                <div
                  className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: FATIGUE_COLORS[fatigueScore] }}
                />
              )}

              {/* Day Number */}
              <span className={`font-black ${dayIsToday ? 'text-primary' : count > 0 ? 'text-foreground' : ''}`}>{day}</span>

              {/* Mini Segmented Distribution Bar / Dots */}
              {totalSetsForDay > 0 && (
                <div className="w-full px-1.5 flex h-1 rounded-full overflow-hidden gap-0.5 opacity-90">
                  {activeSegments.map(([key, sets], idx) => {
                    const color = calendarMode === 'muscle' ? MUSCLE_COLORS[key] : TYPE_COLORS[key as keyof typeof TYPE_COLORS];
                    const widthPct = Math.max(15, Math.round((sets / totalSetsForDay) * 100));
                    return (
                      <div
                        key={idx}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: color || 'var(--primary)',
                          width: `${widthPct}%`,
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {/* Fallback dots if 0 valid sets */}
              {totalSetsForDay === 0 && dots.length > 0 && (
                <div className="flex gap-0.5 h-1.5 items-end">
                  {dots.map((m, idx) => (
                    <div
                      key={idx}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: calendarMode === 'muscle' ? MUSCLE_COLORS[m] : TYPE_COLORS[m as keyof typeof TYPE_COLORS] }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* DETAIL MODAL (Overlay) */}
      {selectedDate && !viewingSession && (
        <Modal
          title={
            showHistoryProgramPicker ? 'Ajouter une séance' : selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })
          }
          onClose={() => {
            setSelectedDate(null);
            setShowHistoryProgramPicker(false);
          }}
        >
          {!showHistoryProgramPicker ? (
            <div className="space-y-3">
              {history
                .filter((s) => {
                  const d = new Date(s.startTime);
                  return (
                    d.getDate() === selectedDate.getDate() &&
                    d.getMonth() === selectedDate.getMonth() &&
                    d.getFullYear() === selectedDate.getFullYear()
                  );
                })
                .map((s) => {
                  const muscles = Array.from(
                    new Set(
                      s.exercises
                        .map((e) => {
                          const l = library.find((lib) => lib.id === e.exerciseId);
                          return l?.muscle;
                        })
                        .filter(Boolean)
                    )
                  )
                    .slice(0, 3)
                    .join(' • ');

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        triggerHaptic('click');
                        setSelectedDate(null);
                        setTimeout(() => {
                          setViewingSession(s);
                        }, 100);
                      }}
                      // Rounded-3xl for softness
                      className="bg-surface2/30 p-4 rounded-3xl border border-white/5 hover:border-white/20 cursor-pointer flex justify-between items-center group transition-colors active:scale-98"
                    >
                      <div>
                        <div className="font-bold text-foreground">{s.sessionName}</div>
                        <div className="text-[10px] text-secondary uppercase">{s.programName}</div>
                        <div className="text-[10px] text-primary/70 font-medium mt-0.5">{muscles}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('click');
                            setSelectedDate(null);
                            setTimeout(() => navigate(`/history/edit/${s.id}`), 100);
                          }}
                          className="p-2 rounded-full hover:bg-white/10 text-secondary hover:text-foreground transition-colors"
                        >
                          <Icons.Edit size={16} />
                        </button>
                        <Icons.Search size={16} className="text-secondary group-hover:text-foreground" />
                      </div>
                    </div>
                  );
                })}

              {history.filter((s) => {
                const d = new Date(s.startTime);
                return (
                  d.getDate() === selectedDate.getDate() &&
                  d.getMonth() === selectedDate.getMonth() &&
                  d.getFullYear() === selectedDate.getFullYear()
                );
              }).length === 0 && <div className="text-center text-secondary/50 italic py-4">Rien ce jour-là</div>}

              <button
                onClick={() => setShowHistoryProgramPicker(true)}
                className="w-full py-4 bg-primary text-background font-black uppercase rounded-[2rem] border border-transparent shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                <Icons.Plus size={16} className="inline mr-2" /> Ajouter une séance
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowHistoryProgramPicker(false);
                }}
                className="text-xs font-bold uppercase text-secondary mb-2 flex items-center gap-1"
              >
                <Icons.ChevronLeft size={14} /> Retour
              </button>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar">
                {programs.map((prog) => (
                  <div key={prog.id} className="space-y-2">
                    <h4 className="font-black text-xs text-secondary uppercase px-2 tracking-wider">{prog.name}</h4>
                    {prog.sessions.map((sess) => (
                      <button
                        key={sess.id}
                        onClick={() => {
                          let start = new Date(selectedDate);
                          const now = new Date();
                          const isToday =
                            start.getDate() === now.getDate() &&
                            start.getMonth() === now.getMonth() &&
                            start.getFullYear() === now.getFullYear();

                          let mode: 'active' | 'log' = 'active';
                          if (isToday) {
                            start = now;
                            mode = 'active';
                          } else {
                            start.setHours(12, 0, 0, 0);
                            mode = 'log';
                          }

                          onStartSession(prog.name, sess, mode);
                          setShowHistoryProgramPicker(false);
                          setSelectedDate(null);
                        }}
                        className="w-full text-left bg-surface2/30 hover:bg-surface2 p-4 rounded-2xl flex justify-between items-center group transition-colors border border-white/5 active:scale-98"
                      >
                        <span className="font-bold text-sm text-foreground">{sess.name}</span>
                        <Icons.Plus size={16} className="text-primary" />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* RECEIPT VIEW MODAL */}
      {viewingSession && (
        <SessionDetailModal
          session={viewingSession}
          onClose={() => setViewingSession(null)}
          onEdit={() => {
            setViewingSession(null);
            setSelectedDate(null);
            setTimeout(() => {
              navigate(`/history/edit/${viewingSession.id}`);
            }, 100);
          }}
        />
      )}

      {/* LEGEND MODAL */}
      {showLegend && (
        <Modal title="Légende" onClose={() => setShowLegend(false)}>
          <div className="space-y-6">
            {/* 1. FATIGUE */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-secondary border-b border-white/10 pb-1">
                Fatigue Ressentie (Point Haut-Gauche)
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div key={lvl} className="flex flex-col items-center gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: FATIGUE_COLORS[lvl] }} />
                    <span className="text-[9px] font-bold text-secondary">{lvl}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[8px] text-secondary/50 uppercase tracking-widest px-1">
                <span>Facile</span>
                <span>Épuisant</span>
              </div>
            </div>

            {/* 2. MUSCLES */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-secondary border-b border-white/10 pb-1">Groupes Musculaires</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(MUSCLE_COLORS).map(([name, color]) => (
                  <div key={name} className="flex items-center gap-2 bg-surface2/30 p-2 rounded-xl">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-[10px] font-bold text-foreground">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. TYPES */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-secondary border-b border-white/10 pb-1">Types d'Exercice</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TYPE_COLORS).map(([name, color]) => (
                  <div key={name} className="flex items-center gap-2 bg-surface2/30 p-2 rounded-xl">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-[10px] font-bold text-foreground">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
