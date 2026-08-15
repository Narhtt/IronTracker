import React, { useState, useMemo } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Icons } from '../../../components/icons/Icons';
import { useStore } from '../../../store/useStore';
import { getExerciseStats, formatDuration, calculate1RM, parseDuration } from '../../../core/utils';
import { PALETTE } from '../../../styles/tokens';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { triggerHaptic } from '../../../core/utils';
import { CHART_CONFIG } from '../../../components/ui/ChartContainer';

interface ExerciseDetailModalProps {
  exerciseId: number;
  onClose: () => void;
  onEdit: () => void;
  extraTab?: {
    key: string;
    label: string;
    content: React.ReactNode;
  };
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exerciseId, onClose, onEdit, extraTab }) => {
  const library = useStore((s) => s.library);
  const history = useStore((s) => s.history);
  const formula1RM = useStore((s) => s.formula1RM);
  const accentColor = useStore((s) => s.accentColor);
  const weightUnit = useStore((s) => s.weightUnit);

  const [activeTab, setActiveTab] = useState<string>('stats');

  // All hooks below must run on every render (rules-of-hooks) - the "exercise
  // not found" bail-out happens once, after every hook has been called.
  const exercise = useMemo(() => library.find((l) => l.id === exerciseId), [library, exerciseId]);

  const isCardio = exercise?.type === 'Cardio';
  const isStatic = exercise?.type === 'Statique' || exercise?.type === 'Étirement';
  const isStandard = !isCardio && !isStatic;

  const stats = useMemo(() => (exercise ? getExerciseStats(exerciseId, history, exercise.type, formula1RM) : null), [exerciseId, history, exercise, formula1RM]);

  // Data for Graph
  const graphData = useMemo(() => {
    const data: Array<{ date: string; val: number }> = [];
    const sessions = history.filter((h) => h.exercises.some((e) => e.exerciseId === exerciseId)).sort((a, b) => a.startTime - b.startTime);

    sessions.forEach((s) => {
      const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
      if (!ex) return;

      const validSets = ex.sets.filter((st) => st.done && !st.isWarmup);
      if (validSets.length === 0) return;

      let val = 0;
      if (isStandard) {
        val = Math.max(...validSets.map((st) => calculate1RM(st.weight, st.reps, formula1RM)));
      } else if (isStatic) {
        val = Math.max(...validSets.map((st) => parseDuration(st.reps)));
      } else if (isCardio) {
        val = Math.max(...validSets.map((st) => parseFloat(st.reps) || 0));
      }

      data.push({
        date: new Date(s.startTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        val: val,
        fullDate: new Date(s.startTime).toLocaleDateString(),
      });
    });
    return data;
  }, [history, exerciseId, isStandard, isStatic, isCardio, formula1RM]);

  // History List with Tonnage Calculation
  const historyList = useMemo(() => {
    return history
      .filter((h) => h.exercises.some((e) => e.exerciseId === exerciseId))
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 10);
  }, [history, exerciseId]);

  if (!exercise || !stats) return null;

  const primaryColor = PALETTE.accents[accentColor]?.primary || PALETTE.accents.blue.primary;

  const tabs = [
    { key: 'stats', label: 'Global' },
    { key: 'graph', label: 'Progrès' },
    { key: 'history', label: 'Historique' },
  ];

  if (extraTab) {
    tabs.push({ key: extraTab.key, label: extraTab.label });
  }

  return (
    <Modal title={exercise.name} onClose={onClose}>
      <div className="space-y-5">
        {/* Custom Header Actions (Edit) */}
        <div className="absolute top-5 right-14">
          <button
            onClick={() => {
              triggerHaptic('click');
              onEdit();
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface2/50 text-secondary hover:text-foreground transition-colors active:scale-90 border border-white/5"
          >
            <Icons.Edit size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-surface2 p-1 rounded-xl gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                triggerHaptic('click');
                setActiveTab(tab.key);
              }}
              className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${activeTab === tab.key ? 'bg-primary text-background shadow-sm' : 'text-secondary hover:text-foreground'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[250px] animate-fade-in">
          {/* VIEW: STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-4 animate-fade-in">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                {isStandard && (
                  <>
                    <div className="bg-surface2/30 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                      <div className="text-[9px] uppercase text-secondary font-bold">Record (1RM)</div>
                      <div className="text-2xl font-black text-primary mt-1">
                        {stats.pr} <span className="text-xs text-secondary font-medium">{weightUnit}</span>
                      </div>
                    </div>
                    <div className="bg-surface2/30 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                      <div className="text-[9px] uppercase text-secondary font-bold">Poids Max</div>
                      <div className="text-2xl font-black text-foreground mt-1">
                        {stats.prMax} <span className="text-xs text-secondary font-medium">{weightUnit}</span>
                      </div>
                    </div>
                  </>
                )}
                {isStatic && (
                  <>
                    <div className="bg-surface2/30 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                      <div className="text-[9px] uppercase text-secondary font-bold">Temps Max</div>
                      <div className="text-2xl font-black text-primary mt-1">{formatDuration(stats.maxDuration)}</div>
                    </div>
                    <div className="bg-surface2/30 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                      <div className="text-[9px] uppercase text-secondary font-bold">Lest Max</div>
                      <div className="text-2xl font-black text-foreground mt-1">
                        {stats.prMax} <span className="text-xs text-secondary font-medium">{weightUnit}</span>
                      </div>
                    </div>
                  </>
                )}
                {isCardio && (
                  <>
                    <div className="bg-surface2/30 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                      <div className="text-[9px] uppercase text-secondary font-bold">Dist. Max</div>
                      <div className="text-2xl font-black text-primary mt-1">
                        {stats.maxDistance} <span className="text-xs text-secondary font-medium">m</span>
                      </div>
                    </div>
                    <div className="bg-surface2/30 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                      <div className="text-[9px] uppercase text-secondary font-bold">Temps Max</div>
                      <div className="text-2xl font-black text-foreground mt-1">{formatDuration(stats.maxDuration)}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Tips Section */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <h4 className="text-xs font-bold uppercase text-secondary tracking-widest flex items-center gap-2">
                  <Icons.BookOpen size={14} /> Fiche Technique
                </h4>
                {exercise.tips ? (
                  <div className="space-y-3 bg-surface2/10 p-3 rounded-xl">
                    {exercise.tips.setup && (
                      <div>
                        <span className="text-primary font-bold text-[10px] uppercase block mb-0.5">Mise en place</span>
                        <span className="text-xs text-secondary-foreground leading-relaxed">{exercise.tips.setup.join('. ')}.</span>
                      </div>
                    )}
                    {exercise.tips.exec && (
                      <div>
                        <span className="text-primary font-bold text-[10px] uppercase block mb-0.5">Exécution</span>
                        <span className="text-xs text-secondary-foreground leading-relaxed">{exercise.tips.exec.join('. ')}.</span>
                      </div>
                    )}
                    {exercise.tips.mistake && (
                      <div>
                        <span className="text-danger font-bold text-[10px] uppercase block mb-0.5">Erreurs Communes</span>
                        <span className="text-xs text-secondary-foreground leading-relaxed">{exercise.tips.mistake.join('. ')}.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-secondary italic">Aucun conseil disponible.</div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: GRAPH */}
          {activeTab === 'graph' && (
            <div className="h-64 w-full bg-surface2/20 rounded-xl p-2 border border-white/5 flex flex-col animate-fade-in">
              <div className="text-center mb-2">
                <div className="text-[10px] font-bold uppercase text-secondary">
                  {isStandard ? 'Progression 1RM' : isStatic ? 'Progression Temps' : 'Progression Distance'}
                </div>
              </div>
              <div className="flex-1 w-full min-h-0">
                {graphData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid {...CHART_CONFIG.gridStyle} vertical={false} />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={CHART_CONFIG.axisStyle}
                        dy={10}
                        minTickGap={30}
                        padding={{ left: 20, right: 20 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={CHART_CONFIG.axisStyle}
                        domain={['auto', 'auto']}
                        tickFormatter={(val) => (isStatic ? formatDuration(val) : val)}
                      />
                      <Tooltip
                        {...CHART_CONFIG.tooltipStyle}
                        labelStyle={{ display: 'none' }}
                        formatter={(val: number) => [isStatic ? formatDuration(val) : `${val} ${isCardio ? 'm' : weightUnit}`, 'Perf']}
                      />
                      <Line
                        type="monotone"
                        dataKey="val"
                        stroke={primaryColor}
                        strokeWidth={3}
                        dot={{ fill: primaryColor, r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-secondary/40 text-xs italic">Pas assez de données</div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3 animate-fade-in">
              {historyList.length > 0 ? (
                historyList.map((h) => {
                  const sessionStats = getExerciseStats(exerciseId, [h], exercise.type, formula1RM);
                  return (
                    <div key={h.id} className="bg-surface2/30 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase text-secondary">
                            {new Date(h.startTime).toLocaleDateString()}
                          </span>
                          <div className="w-1 h-1 rounded-full bg-white/20" />
                          <span className="text-[10px] text-foreground font-bold truncate max-w-[120px]">{h.sessionName}</span>
                        </div>
                        <div className="font-mono text-sm font-bold text-primary">{sessionStats.lastSessionString}</div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        {isStandard && sessionStats.lastBestSet && (
                          <>
                            <div className="text-[9px] text-secondary">
                              1RM: <span className="text-foreground font-mono">{Math.round(sessionStats.lastBestSet.e1rm)}</span>
                            </div>
                            {sessionStats.lastSessionVolume > 0 && (
                              <div className="text-[9px] text-secondary">
                                Ton:{' '}
                                <span className="text-foreground font-mono">{(sessionStats.lastSessionVolume / 1000).toFixed(1)}k</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-secondary italic text-xs">Aucune séance terminée avec cet exercice.</div>
              )}
            </div>
          )}

          {/* VIEW: EXTRA TAB (NOTES) */}
          {extraTab && activeTab === extraTab.key && <div className="animate-fade-in">{extraTab.content}</div>}
        </div>
      </div>
    </Modal>
  );
};
