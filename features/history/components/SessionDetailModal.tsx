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
      if (document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(captureRef.current, {
        scale: 3,
        backgroundColor: exportStyle === 'social' ? '#0b1120' : '#070b14',
        useCORS: true,
        logging: false,
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
      if (document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(captureRef.current, {
        scale: 3,
        backgroundColor: exportStyle === 'social' ? '#0b1120' : '#070b14',
        useCORS: true,
        logging: false,
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
        <div ref={captureRef} style={{ width: '100%' }}>
          {exportStyle === 'receipt' ? (
            /* STYLE 1: TICKET DE CAISSE THERMIQUE */
            <div
              style={{
                backgroundColor: '#070b14',
                color: '#cbd5e1',
                fontFamily: "'JetBrains Mono', 'Courier New', Courier, monospace",
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderTop: '4px dashed #eab308',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                lineHeight: 1.5,
                position: 'relative',
                overflow: 'hidden',
              }}
              className="text-xs space-y-4"
            >
              {/* Header */}
              <div
                style={{
                  textAlign: 'center',
                  paddingBottom: '16px',
                  borderBottom: '1px dashed rgba(255, 255, 255, 0.15)',
                  marginBottom: '16px',
                }}
                className="space-y-2 relative z-10"
              >
                <div
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    fontSize: '8px',
                    color: '#64748b',
                    fontWeight: 700,
                  }}
                >
                  IronTracker System Log
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 900,
                    color: '#f8fafc',
                    textTransform: 'uppercase',
                    wordBreak: 'break-word',
                    letterSpacing: '-0.025em',
                  }}
                >
                  {session.sessionName}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#94a3b8',
                  }}
                >
                  <span
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e1',
                    }}
                  >
                    {session.programName}
                  </span>
                  <span>{dateTimeInfo.dateStr}</span>
                  <span style={{ opacity: 0.5, fontSize: '8px' }}>•</span>
                  <span>{dateTimeInfo.timeRange}</span>
                </div>
              </div>

              {/* KEY METRICS ROW */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: '8px',
                  textAlign: 'center',
                  paddingBottom: '16px',
                  borderBottom: '1px dashed rgba(255, 255, 255, 0.15)',
                  marginBottom: '16px',
                }}
                className="relative z-10"
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '8px', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                    Durée
                  </span>
                  <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>
                    {stats.duration}
                    <span style={{ fontSize: '10px', fontWeight: 400, opacity: 0.7 }}>m</span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '8px', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                    Sets
                  </span>
                  <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>{stats.totalSets}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '8px', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                    Vol.
                  </span>
                  <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>
                    {(stats.totalVolume / 1000).toFixed(1)}
                    <span style={{ fontSize: '10px', fontWeight: 400, opacity: 0.7 }}>k</span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '8px', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                    RPE
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: FATIGUE_COLORS[session.fatigue] }}>
                    {session.fatigue}/5
                  </span>
                </div>
              </div>

              {/* INTENSITY GAUGE */}
              <div
                style={{
                  paddingBottom: '16px',
                  borderBottom: '1px dashed rgba(255, 255, 255, 0.15)',
                  marginBottom: '16px',
                }}
                className="relative z-10 space-y-2"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '8px', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8' }}>
                    Intensité Relative
                  </span>
                  {stats.hasHistory ? (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: stats.intensityRatio >= 100 ? '#10b981' : '#eab308',
                      }}
                    >
                      {stats.intensityRatio}%
                    </span>
                  ) : (
                    <span style={{ fontSize: '8px', fontWeight: 700, color: '#64748b', fontStyle: 'italic' }}>
                      Ref. Initiale
                    </span>
                  )}
                </div>

                <div
                  style={{
                    height: '10px',
                    width: '100%',
                    backgroundColor: '#1e293b',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    display: 'flex',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      zIndex: 20,
                    }}
                  />
                  {stats.hasHistory && (
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '9999px',
                        backgroundColor: stats.intensityRatio >= 100 ? '#10b981' : '#eab308',
                        width: `${Math.min(stats.intensityRatio, 100)}%`,
                      }}
                    />
                  )}
                </div>

                {stats.hasHistory ? (
                  <div style={{ fontSize: '8px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', paddingTop: '4px' }}>
                    "{getIntensityText(stats.intensityRatio)}"
                  </div>
                ) : (
                  <div style={{ fontSize: '8px', color: '#64748b', fontStyle: 'italic', textAlign: 'center', paddingTop: '4px' }}>
                    Première séance de ce type.
                  </div>
                )}
              </div>

              {/* EXERCISES LIST */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} className="relative z-10">
                {session.exercises.map((ex, i) => {
                  const lib = library.find((l) => l.id === ex.exerciseId);
                  const isCardio = lib?.type === 'Cardio';
                  const isStatic = lib?.type === 'Statique' || lib?.type === 'Étirement';

                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          color: '#f8fafc',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            fontSize: '11px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '82%',
                          }}
                        >
                          {i + 1}. {lib?.name || `ID ${ex.exerciseId}`}
                        </div>
                        <div
                          style={{
                            fontSize: '8px',
                            fontWeight: 700,
                            color: '#94a3b8',
                            backgroundColor: '#1e293b',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          {lib?.muscle.substring(0, 3).toUpperCase()}
                        </div>
                      </div>

                      <div style={{ paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                            <div
                              key={j}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '11px',
                                opacity: set.isWarmup ? 0.45 : 1,
                                fontStyle: set.isWarmup ? 'italic' : 'normal',
                                color: set.isWarmup ? '#94a3b8' : '#cbd5e1',
                              }}
                            >
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ color: '#64748b', fontWeight: 700, fontSize: '10px' }}>#{j + 1}</span>
                                <span>{perfStr}</span>
                              </div>
                              <div style={{ fontSize: '9px', opacity: 0.7, display: 'flex', gap: '8px', fontWeight: 700 }}>
                                {set.isWarmup && <span style={{ color: '#eab308' }}>WARMUP</span>}
                                <span>{subStr}</span>
                                {set.rir && !isCardio && <span style={{ color: '#94a3b8' }}>@{set.rir}</span>}
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
              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '14px',
                  borderTop: '1px dashed rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
                className="relative z-10"
              >
                <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b' }}>
                  IronTracker <span style={{ color: '#f8fafc', fontWeight: 700 }}>v4.0.6</span>
                </div>
                <div style={{ fontSize: '8px', color: '#475569', fontFamily: 'monospace' }}>#{session.id.slice(-6)}</div>
              </div>
            </div>
          ) : (
            /* STYLE 2: CARTE SOCIALE MODERNE */
            <div
              style={{
                background: 'linear-gradient(145deg, #0b1120 0%, #020617 100%)',
                color: '#ffffff',
                fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                borderRadius: '24px',
                padding: '24px',
                border: '1px solid #1e293b',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Ambient Glow */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '180px',
                  height: '180px',
                  background: 'radial-gradient(circle, rgba(234, 179, 8, 0.12) 0%, rgba(234, 179, 8, 0) 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Top Banner */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '20px',
                  position: 'relative',
                  zIndex: 10,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: '#eab308',
                      backgroundColor: 'rgba(234, 179, 8, 0.12)',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(234, 179, 8, 0.25)',
                      display: 'inline-block',
                    }}
                  >
                    {session.programName}
                  </span>
                  <h3
                    style={{
                      fontSize: '22px',
                      fontWeight: 900,
                      marginTop: '8px',
                      letterSpacing: '-0.025em',
                      textTransform: 'uppercase',
                      color: '#ffffff',
                      lineHeight: 1.2,
                    }}
                  >
                    {session.sessionName}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'capitalize', marginTop: '2px' }}>
                    {dateTimeInfo.fullDateStr}
                  </p>
                </div>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#eab308',
                    fontWeight: 900,
                    fontSize: '12px',
                  }}
                >
                  IT
                </div>
              </div>

              {/* Highlight Stats Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '10px',
                  marginBottom: '20px',
                  position: 'relative',
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    backgroundColor: '#131d31',
                    border: '1px solid #1e293b',
                    padding: '12px',
                    borderRadius: '16px',
                  }}
                >
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8' }}>
                    Temps Total
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
                    {stats.duration} <span style={{ fontSize: '11px', fontWeight: 400, color: '#94a3b8' }}>min</span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#131d31',
                    border: '1px solid #1e293b',
                    padding: '12px',
                    borderRadius: '16px',
                  }}
                >
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8' }}>
                    Volume Total
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#eab308', marginTop: '4px' }}>
                    {Math.round(stats.totalVolume)}{' '}
                    <span style={{ fontSize: '11px', fontWeight: 400, color: '#94a3b8' }}>{weightUnit}</span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#131d31',
                    border: '1px solid #1e293b',
                    padding: '12px',
                    borderRadius: '16px',
                  }}
                >
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8' }}>
                    Séries Valides
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#34d399', marginTop: '4px' }}>
                    {stats.totalSets}
                  </div>
                </div>
              </div>

              {/* Muscles Badges */}
              {stats.musclesWorked.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: '20px',
                    position: 'relative',
                    zIndex: 10,
                  }}
                >
                  {stats.musclesWorked.map((m) => (
                    <span
                      key={m}
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: '#1e293b',
                        color: '#cbd5e1',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                      }}
                    >
                      {m}
                    </span>
                  ))}
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: '#1e293b',
                      color: '#cbd5e1',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                    }}
                  >
                    RPE: {session.fatigue}/5
                  </span>
                </div>
              )}

              {/* Top Exercises Summary */}
              <div
                style={{
                  backgroundColor: '#0f172a',
                  borderRadius: '16px',
                  padding: '14px',
                  border: '1px solid #1e293b',
                  position: 'relative',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    color: '#94a3b8',
                  }}
                >
                  Exercices Principaux
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {session.exercises.slice(0, 4).map((ex, idx) => {
                    const lib = library.find((l) => l.id === ex.exerciseId);
                    const doneSets = ex.sets.filter((s) => s.done && !s.isWarmup);
                    const topSet =
                      doneSets.length > 0
                        ? doneSets.reduce(
                            (prev, curr) =>
                              (parseFloat(curr.weight) || 0) > (parseFloat(prev.weight) || 0) ? curr : prev,
                            doneSets[0]
                          )
                        : null;

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '12px',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: '#e2e8f0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '65%',
                          }}
                        >
                          {lib?.name || `Exercice ${idx + 1}`}
                        </span>
                        {topSet ? (
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              color: '#eab308',
                              fontWeight: 700,
                              fontSize: '11px',
                            }}
                          >
                            {topSet.weight} {weightUnit} × {topSet.reps}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '10px' }}>{ex.sets.length} séries</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card Footer */}
              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '12px',
                  borderTop: '1px solid #1e293b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10px',
                  color: '#64748b',
                  fontWeight: 700,
                  position: 'relative',
                  zIndex: 10,
                }}
              >
                <span>IronTracker v4.0.6</span>
                <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>#{session.id.slice(-6)}</span>
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
