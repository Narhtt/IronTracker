import React, { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas-pro';
import { Modal } from '../../../components/ui/Modal';
import { WorkoutSession } from '../../../core/types';
import { Icons } from '../../../components/icons/Icons';
import { useStore } from '../../../store/useStore';
import { calculate1RM, parseDuration, formatDuration, triggerHaptic } from '../../../core/utils';
import { FATIGUE_COLORS } from '../../../core/constants';

interface SessionDetailModalProps {
  session: WorkoutSession;
  onClose: () => void;
  onEdit: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ session, onClose, onEdit }) => {
  const library = useStore((s) => s.library);
  const history = useStore((s) => s.history);
  const weightUnit = useStore((s) => s.weightUnit);
  const formula1RM = useStore((s) => s.formula1RM);
  const captureRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [exportStyle, setExportStyle] = useState<'receipt' | 'social'>('receipt');

  // Formattage des dates et heures
  const dateTimeInfo = useMemo(() => {
    const start = new Date(session.startTime);
    const dateStr = start.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const fullDateStr = start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const formatTime = (ts: number) =>
      new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', 'h');

    const startTimeStr = formatTime(session.startTime);
    const endTimeStr = session.endTime ? formatTime(session.endTime) : '??';

    return { dateStr, fullDateStr, timeRange: `${startTimeStr} - ${endTimeStr}` };
  }, [session]);

  // Stats globales du ticket + Comparaison Historique
  const stats = useMemo(() => {
    const duration = session.endTime ? Math.floor((session.endTime - session.startTime) / 60000) : 0;
    const totalSets = session.exercises.reduce((acc, e) => acc + e.sets.filter((s) => s.done && !s.isWarmup).length, 0);

    const calculateVolume = (sess: WorkoutSession) =>
      sess.exercises.reduce((acc, e) => {
        const lib = library.find((l) => l.id === e.exerciseId);
        if (lib?.type === 'Cardio' || lib?.type === 'Statique') return acc;
        return (
          acc + e.sets.filter((s) => s.done && !s.isWarmup).reduce((a, s) => a + (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0), 0)
        );
      }, 0);

    const currentVolume = calculateVolume(session);

    // Récupérer les 5 dernières séances du même type pour la moyenne
    const previousSessions = history
      .filter((h) => h.programName === session.programName && h.sessionName === session.sessionName && h.startTime < session.startTime)
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 5);

    const historyVolumes = previousSessions.map((h) => calculateVolume(h));

    // Intensity Ratio (vs Avg)
    let intensityRatio = 100;
    let avgVolume = 0;

    if (historyVolumes.length > 0) {
      avgVolume = historyVolumes.reduce((a, b) => a + b, 0) / historyVolumes.length;
      intensityRatio = avgVolume > 0 ? Math.round((currentVolume / avgVolume) * 100) : 100;
    }

    // Muscles travaillés
    const musclesWorked = Array.from(
      new Set(
        session.exercises
          .map((e) => library.find((l) => l.id === e.exerciseId)?.muscle)
          .filter(Boolean) as string[]
      )
    );

    return {
      duration,
      totalSets,
      totalVolume: currentVolume,
      intensityRatio,
      avgVolume,
      hasHistory: historyVolumes.length > 0,
      musclesWorked,
    };
  }, [session, library, history]);

  const handleDownload = async () => {
    if (!captureRef.current || isSharing) return;
    setIsSharing(true);
    triggerHaptic('click');

    try {
      await new Promise((r) => setTimeout(r, 60));

      const canvas = await html2canvas(captureRef.current, {
        scale: 3,
        backgroundColor: exportStyle === 'social' ? '#0f172a' : '#020617',
        useCORS: true,
        logging: false,
        windowWidth: 420,
      });

      canvas.toBlob((blob: Blob | null) => {
        if (!blob) {
          setIsSharing(false);
          return;
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `irontracker_${exportStyle === 'social' ? 'carte' : 'ticket'}_${session.startTime}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        triggerHaptic('success');
        setIsSharing(false);
      }, 'image/png');
    } catch (error) {
      console.error('Capture failed', error);
      triggerHaptic('error');
      setIsSharing(false);
    }
  };

  const handleShare = async () => {
    if (!captureRef.current || isSharing) return;
    setIsSharing(true);
    triggerHaptic('click');

    try {
      await new Promise((r) => setTimeout(r, 60));

      const canvas = await html2canvas(captureRef.current, {
        scale: 3,
        backgroundColor: exportStyle === 'social' ? '#0f172a' : '#020617',
        useCORS: true,
        logging: false,
        windowWidth: 420,
      });

      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) {
          setIsSharing(false);
          return;
        }

        const fileName = `irontracker_${exportStyle === 'social' ? 'carte' : 'ticket'}_${session.startTime}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'IronTracker Session',
              text: `Séance ${session.sessionName} terminée ! (${stats.duration} min • ${Math.round(stats.totalVolume)} ${weightUnit})`,
            });
            triggerHaptic('success');
          } catch {
            // Utilisateur a annulé ou navigateur a refusé
          }
        } else {
          // Fallback téléchargement direct
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
          triggerHaptic('success');
        }
        setIsSharing(false);
      }, 'image/png');
    } catch (error) {
      console.error('Capture failed', error);
      triggerHaptic('error');
      setIsSharing(false);
    }
  };

  // Helper Text for Gauge
  const getIntensityText = (ratio: number) => {
    if (ratio >= 115) return 'Session intense ! Volume supérieur à la moyenne.';
    if (ratio >= 90) return 'Volume standard. Constance maintenue.';
    if (ratio >= 70) return 'Séance légère ou de récupération.';
    return "Volume faible par rapport à l'habitude.";
  };

  return (
    <Modal title="Partage Séance" onClose={onClose}>
      <div className="flex flex-col animate-fade-in space-y-4">
        {/* EXPORT MODE SELECTOR */}
        <div className="flex bg-surface2 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('click');
              setExportStyle('receipt');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
              exportStyle === 'receipt' ? 'bg-primary text-black shadow-md' : 'text-secondary hover:text-foreground'
            }`}
          >
            <Icons.Receipt size={14} />
            <span>Ticket Séance</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('click');
              setExportStyle('social');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
              exportStyle === 'social' ? 'bg-primary text-black shadow-md' : 'text-secondary hover:text-foreground'
            }`}
          >
            <Icons.ExternalLink size={14} />
            <span>Carte Séance</span>
          </button>
        </div>

        {/* RECEIPT / SOCIAL CARD CONTAINER */}
        <div ref={captureRef}>
          {exportStyle === 'receipt' ? (
            /* STYLE 1: TICKET DE CAISSE THERMIQUE */
            <div className="bg-background rounded-2xl p-5 font-mono text-xs text-secondary/80 leading-relaxed border-t-4 border-dashed border-primary/50 relative overflow-hidden shadow-2xl">
              <div className="text-center pb-4 border-b border-dashed border-white/20 mb-4 space-y-2 relative z-10">
                <div className="uppercase tracking-[0.2em] text-[8px] text-secondary/40 font-bold">IronTracker System Log</div>
                <div className="text-2xl font-black text-foreground uppercase break-words tracking-tight">{session.sessionName}</div>
                <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[10px] font-bold text-secondary">
                  <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{session.programName}</span>
                  <span>{dateTimeInfo.dateStr}</span>
                  <span className="opacity-50 text-[8px]">•</span>
                  <span>{dateTimeInfo.timeRange}</span>
                </div>
              </div>

              {/* KEY METRICS ROW */}
              <div className="grid grid-cols-4 gap-2 text-center pb-4 border-b border-dashed border-white/20 mb-4 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase opacity-50 mb-1">Durée</span>
                  <span className="font-bold text-foreground text-sm">
                    {stats.duration}
                    <span className="text-[10px] font-normal opacity-70">m</span>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase opacity-50 mb-1">Sets</span>
                  <span className="font-bold text-foreground text-sm">{stats.totalSets}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase opacity-50 mb-1">Vol.</span>
                  <span className="font-bold text-foreground text-sm">
                    {(stats.totalVolume / 1000).toFixed(1)}
                    <span className="text-[10px] font-normal opacity-70">k</span>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase opacity-50 mb-1">RPE</span>
                  <span className="font-bold text-sm" style={{ color: FATIGUE_COLORS[session.fatigue] }}>
                    {session.fatigue}/5
                  </span>
                </div>
              </div>

              {/* INTENSITY GAUGE */}
              <div className="pb-4 border-b border-dashed border-white/20 mb-4 relative z-10 space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[8px] uppercase font-bold text-secondary">Intensité Relative</span>
                  {stats.hasHistory ? (
                    <span className={`text-[10px] font-bold ${stats.intensityRatio >= 100 ? 'text-success' : 'text-secondary'}`}>
                      {stats.intensityRatio}%
                    </span>
                  ) : (
                    <span className="text-[8px] font-bold text-secondary/50 italic">Ref. Initiale</span>
                  )}
                </div>

                <div className="h-3 w-full bg-surface2 rounded-full overflow-hidden flex border border-white/5 relative">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 z-20"></div>
                  {stats.hasHistory && (
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${stats.intensityRatio >= 100 ? 'bg-gradient-to-r from-primary to-success' : 'bg-primary'}`}
                      style={{ width: `${Math.min(stats.intensityRatio, 100)}%` }}
                    />
                  )}
                </div>

                {stats.hasHistory ? (
                  <div className="text-[8px] text-secondary/70 italic text-center pt-1">"{getIntensityText(stats.intensityRatio)}"</div>
                ) : (
                  <div className="text-[8px] text-secondary/40 italic text-center pt-1">
                    Première séance de ce type.
                  </div>
                )}
              </div>

              {/* EXERCISES LIST */}
              <div className="space-y-4 relative z-10">
                {session.exercises.map((ex, i) => {
                  const lib = library.find((l) => l.id === ex.exerciseId);
                  const isCardio = lib?.type === 'Cardio';
                  const isStatic = lib?.type === 'Statique' || lib?.type === 'Étirement';

                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-baseline text-foreground">
                        <div className="font-bold uppercase truncate pr-4 max-w-[85%] text-[11px]">
                          {i + 1}. {lib?.name || `ID ${ex.exerciseId}`}
                        </div>
                        <div className="text-[8px] font-bold opacity-40 bg-surface2 px-1.5 rounded">
                          {lib?.muscle.substring(0, 3).toUpperCase()}
                        </div>
                      </div>

                      <div className="pl-2 space-y-0.5">
                        {ex.sets.map((set, j) => {
                          if (!set.done) return null;

                          let perfStr = '';
                          let subStr = '';

                          if (isCardio) {
                            perfStr = `Lvl ${set.weight} • ${set.reps}m`;
                            if (set.rir && set.rir !== '0') subStr = `${formatDuration(parseDuration(set.rir))}`;
                          } else if (isStatic) {
                            perfStr = `+${set.weight}${weightUnit} • ${formatDuration(parseDuration(set.reps))}`;
                          } else {
                            perfStr = `${set.weight}${weightUnit} x ${set.reps}`;
                            if (!set.isWarmup) {
                              const e1rm = calculate1RM(set.weight, set.reps, formula1RM);
                              subStr = `1RM:${e1rm}`;
                            }
                          }

                          return (
                            <div key={j} className={`flex justify-between items-center ${set.isWarmup ? 'opacity-40 italic' : ''}`}>
                              <div className="flex gap-2 items-center">
                                <span className="text-secondary/50 font-bold text-[10px]">#{j + 1}</span>
                                <span>{perfStr}</span>
                              </div>
                              <div className="text-[9px] opacity-50 flex gap-2 font-bold">
                                {set.isWarmup && <span>WARMUP</span>}
                                <span>{subStr}</span>
                                {set.rir && !isCardio && <span className="text-secondary">@{set.rir}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SOCIAL FOOTER */}
              <div className="mt-6 pt-4 border-t border-dashed border-white/20 flex justify-between items-end relative z-10">
                <div className="text-[8px] uppercase tracking-widest text-secondary/50">
                  IronTracker <span className="text-foreground font-bold">v4.0.6</span>
                </div>
                <div className="text-[8px] text-secondary/30 font-mono">#{session.id.slice(-6)}</div>
              </div>
            </div>
          ) : (
            /* STYLE 2: CARTE SOCIALE MODERNE */
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-black rounded-3xl p-6 text-foreground relative overflow-hidden shadow-2xl border border-slate-800">
              {/* Subtle Ambient Light */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              {/* Top Banner */}
              <div className="flex justify-between items-start mb-5 relative z-10">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                    {session.programName}
                  </span>
                  <h3 className="text-2xl font-black mt-2 tracking-tight uppercase text-white">{session.sessionName}</h3>
                  <p className="text-xs text-slate-400 capitalize mt-0.5">{dateTimeInfo.fullDateStr}</p>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary font-black text-xs">
                  IT
                </div>
              </div>

              {/* Highlight Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5 mb-5 relative z-10">
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-3 rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Temps Total</div>
                  <div className="text-xl font-black text-white mt-1">
                    {stats.duration} <span className="text-xs font-normal text-slate-400">min</span>
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-3 rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Volume Total</div>
                  <div className="text-xl font-black text-primary mt-1">
                    {Math.round(stats.totalVolume)} <span className="text-xs font-normal text-slate-400">{weightUnit}</span>
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-3 rounded-2xl">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Séries Valides</div>
                  <div className="text-xl font-black text-emerald-400 mt-1">{stats.totalSets}</div>
                </div>
              </div>

              {/* Muscles Badges */}
              {stats.musclesWorked.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5 relative z-10">
                  {stats.musclesWorked.map((m) => (
                    <span key={m} className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                      {m}
                    </span>
                  ))}
                  <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                    RPE: {session.fatigue}/5
                  </span>
                </div>
              )}

              {/* Top Exercises Summary */}
              <div className="bg-slate-900/80 rounded-2xl p-3.5 border border-slate-800 space-y-2 relative z-10">
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Exercices Principaux</div>
                <div className="space-y-1.5">
                  {session.exercises.slice(0, 4).map((ex, idx) => {
                    const lib = library.find((l) => l.id === ex.exerciseId);
                    const doneSets = ex.sets.filter((s) => s.done && !s.isWarmup);
                    const topSet = doneSets.length > 0 ? doneSets.reduce((prev, curr) => (parseFloat(curr.weight) || 0) > (parseFloat(prev.weight) || 0) ? curr : prev, doneSets[0]) : null;

                    return (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-200 truncate max-w-[65%]">{lib?.name || `Exercice ${idx + 1}`}</span>
                        {topSet ? (
                          <span className="font-mono text-primary font-bold text-[11px]">
                            {topSet.weight} {weightUnit} × {topSet.reps}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">{ex.sets.length} séries</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-bold relative z-10">
                <span>IronTracker v4.0.6</span>
                <span className="font-mono text-slate-400">#{session.id.slice(-6)}</span>
              </div>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-surface2 hover:bg-surface2/80 text-foreground font-sans font-bold uppercase text-[10px] transition-colors border border-transparent hover:border-white/10"
          >
            Fermer
          </button>
          <button
            onClick={onEdit}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface2 hover:bg-surface2/80 text-secondary hover:text-foreground transition-colors border border-transparent hover:border-white/10"
            title="Modifier la séance"
          >
            <Icons.Edit size={18} />
          </button>
          <button
            onClick={handleDownload}
            disabled={isSharing}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface2 hover:bg-surface2/80 text-secondary hover:text-foreground transition-colors border border-transparent hover:border-white/10"
            title="Télécharger l'image"
          >
            <Icons.Download size={18} />
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="px-4 h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-black font-black uppercase text-xs shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            {isSharing ? (
              <span className="animate-pulse text-[10px]">Export...</span>
            ) : (
              <>
                <Icons.Upload size={16} strokeWidth={2.5} />
                <span>Partager</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
