import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { AccentColor, BeforeInstallPromptEvent, OneRMFormula, AutoSnapshot } from '../../core/types';
import { SectionCard } from '../../components/ui/SectionCard';
import { Icons } from '../../components/icons/Icons';
import { triggerHaptic, downloadFile, generateCSV } from '../../core/utils';
import { STORAGE_KEYS, THEMES } from '../../core/constants';
import { useConfirm } from '../../hooks/useConfirm';
import { validateBackup } from '../../core/validation';
import { migrateBackup, CURRENT_SCHEMA_VERSION } from '../../core/migrations';
import { storage } from '../../services/storage';
import { filterSessionsByYears, downloadArchiveFile, mergeSessionsWithoutDuplicates, getHistoryDateRange } from '../../core/archive';

interface SettingsViewProps {
  installPrompt: BeforeInstallPromptEvent | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ installPrompt }) => {
  const navigate = useNavigate();
  const accentColor = useStore((s) => s.accentColor);
  const setAccentColor = useStore((s) => s.setAccentColor);
  const themeMode = useStore((s) => s.themeMode);
  const setThemeMode = useStore((s) => s.setThemeMode);
  const weightUnit = useStore((s) => s.weightUnit);
  const setWeightUnit = useStore((s) => s.setWeightUnit);
  const barWeight = useStore((s) => s.barWeight);
  const setBarWeight = useStore((s) => s.setBarWeight);
  const availablePlates = useStore((s) => s.availablePlates) || [20, 10, 5, 2.5, 1.25];
  const setAvailablePlates = useStore((s) => s.setAvailablePlates);
  const formula1RM = useStore((s) => s.formula1RM);
  const setFormula1RM = useStore((s) => s.setFormula1RM);
  const history = useStore((s) => s.history);
  const setHistory = useStore((s) => s.setHistory);
  const library = useStore((s) => s.library);
  const programs = useStore((s) => s.programs);
  const restoreBackup = useStore((s) => s.restoreBackup);
  const resetData = useStore((s) => s.resetData);
  const pushToast = useStore((s) => s.pushToast);
  const confirm = useConfirm();

  // Local state for toggles
  const [hapticTactile, setHapticTactile] = useState(localStorage.getItem(STORAGE_KEYS.HAPTIC_TACTILE) !== 'false');
  const [visualFeedback, setVisualFeedback] = useState(localStorage.getItem(STORAGE_KEYS.VISUAL_FEEDBACK) !== 'false');
  const [hapticSession, setHapticSession] = useState(localStorage.getItem(STORAGE_KEYS.HAPTIC_SESSION) !== 'false');
  const [notifEnabled, setNotifEnabled] = useState(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED) !== 'false');

  // Snapshots state
  const [snapshots, setSnapshots] = useState<AutoSnapshot[]>([]);
  const [archiveYears, setArchiveYears] = useState<number>(1);
  const [storageUsage, setStorageUsage] = useState(storage.getUsageEstimate());

  const refreshSnapshots = () => {
    setSnapshots(storage.snapshots.list());
    setStorageUsage(storage.getUsageEstimate());
  };

  useEffect(() => {
    refreshSnapshots();
  }, []);

  // Archive preview
  const archiveFilterResult = useMemo(() => {
    return filterSessionsByYears(history, archiveYears);
  }, [history, archiveYears]);

  const historyRange = useMemo(() => {
    return getHistoryDateRange(history);
  }, [history]);

  // Permission State
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestNotifPermission = () => {
    if (!('Notification' in window)) return;

    Notification.requestPermission().then((perm) => {
      setPermissionStatus(perm);
      if (perm === 'granted') {
        setNotifEnabled(true);
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'true');
        triggerHaptic('success');
        // Test notification
        new Notification('IronTracker', { body: 'Notifications activées !' });
      } else {
        setNotifEnabled(false);
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'false');
      }
    });
  };

  const toggleNotif = () => {
    if (permissionStatus === 'default' || permissionStatus === 'denied') {
      requestNotifPermission();
      return;
    }
    const newVal = !notifEnabled;
    setNotifEnabled(newVal);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, String(newVal));
    triggerHaptic('click');
  };

  const formatSnapshotReason = (reason: string) => {
    switch (reason) {
      case 'session_completed':
        return 'Séance terminée';
      case 'before_restore':
        return 'Avant restauration';
      case 'before_reset':
        return 'Avant réinitialisation';
      case 'before_archive':
        return 'Avant archivage';
      case 'manual':
        return 'Manuel';
      default:
        return 'Système';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <h2 className="text-2xl font-black italic uppercase px-1 text-foreground">Configuration</h2>

      {/* APPARENCE */}
      <SectionCard className="p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Apparence</h3>

        {/* THEME SWITCHER LIGHT/DARK */}
        <div className="flex bg-surface2/50 p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => {
              triggerHaptic('click');
              setThemeMode('dark');
            }}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${themeMode === 'dark' ? 'bg-surface text-white shadow-md' : 'text-secondary hover:text-foreground'}`}
          >
            <span className="text-lg">🌙</span>
            <span className="text-xs font-bold uppercase">Sombre</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('click');
              setThemeMode('light');
            }}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${themeMode === 'light' ? 'bg-white text-black shadow-md' : 'text-secondary hover:text-foreground'}`}
          >
            <span className="text-lg">☀️</span>
            <span className="text-xs font-bold uppercase">Clair</span>
          </button>
        </div>

        {/* ACCENT COLORS */}
        <div className="flex gap-3 overflow-x-auto pb-2 px-2 no-scrollbar -mx-2 p-4">
          {Object.entries(THEMES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => {
                triggerHaptic('tick');
                setAccentColor(key as AccentColor);
              }}
              className={`w-10 h-10 min-w-[2.5rem] rounded-full border-2 flex items-center justify-center transition-all ${accentColor === key ? 'border-foreground scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: val.primary }}
            >
              {accentColor === key && <span className="text-black bg-white/50 rounded-full w-4 h-4" />}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* FEEDBACK & NOTIFICATIONS */}
      <SectionCard className="p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Feedback & Alertes</h3>
        <div className="space-y-3">
          {/* VIBRATION TOGGLE */}
          <div className="flex justify-between items-center text-foreground">
            <div className="flex flex-col">
              <span className="font-bold text-sm">Vibrations</span>
              <span className="text-[10px] text-secondary">Retour haptique physique</span>
            </div>
            <button
              onClick={() => {
                const newVal = !hapticTactile;
                setHapticTactile(newVal);
                localStorage.setItem(STORAGE_KEYS.HAPTIC_TACTILE, String(newVal));
                if (newVal) triggerHaptic('click');
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${hapticTactile ? 'bg-primary' : 'bg-surface2'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hapticTactile ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* FLASH TOGGLE */}
          <div className="flex justify-between items-center text-foreground">
            <div className="flex flex-col">
              <span className="font-bold text-sm">Flash Visuel</span>
              <span className="text-[10px] text-secondary">Illumination des bords d'écran</span>
            </div>
            <button
              onClick={() => {
                const newVal = !visualFeedback;
                setVisualFeedback(newVal);
                localStorage.setItem(STORAGE_KEYS.VISUAL_FEEDBACK, String(newVal));
                triggerHaptic('click');
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${visualFeedback ? 'bg-primary' : 'bg-surface2'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${visualFeedback ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* SESSION ALERTS TOGGLE */}
          <div className="flex justify-between items-center text-foreground">
            <div className="flex flex-col">
              <span className="font-bold text-sm">Alertes Séance</span>
              <span className="text-[10px] text-secondary">Pour : Fin série, Fin repos, Succès</span>
            </div>
            <button
              onClick={() => {
                const newVal = !hapticSession;
                setHapticSession(newVal);
                localStorage.setItem(STORAGE_KEYS.HAPTIC_SESSION, String(newVal));
                triggerHaptic('click');
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${hapticSession ? 'bg-primary' : 'bg-surface2'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hapticSession ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-white/5 text-foreground">
            <div className="flex flex-col">
              <span className="font-bold text-sm">Notifications Timer</span>
              <span className="text-[10px] text-secondary">Alerte quand l'app est en arrière-plan</span>
              {permissionStatus === 'denied' && <span className="text-[9px] text-danger font-bold mt-1">⚠️ Bloqué par le navigateur</span>}
            </div>
            {permissionStatus === 'granted' ? (
              <button
                onClick={toggleNotif}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifEnabled ? 'bg-primary' : 'bg-surface2'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            ) : (
              <button
                onClick={requestNotifPermission}
                className="px-3 py-1 bg-surface2 border border-primary/30 text-primary text-[10px] font-bold uppercase rounded-lg"
              >
                Autoriser
              </button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* CALCULS & UNITES */}
      <SectionCard className="p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Calculs & Préférences</h3>
        
        <div className="space-y-4">
          {/* UNITE DE MESURE (KG / LBS) */}
          <div className="flex justify-between items-center text-foreground">
            <div className="flex flex-col">
              <span className="font-bold text-sm">Unité de Mesure</span>
              <span className="text-[10px] text-secondary">Kilogrammes (kg) ou Livres (lbs)</span>
            </div>
            <div className="flex bg-surface2 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => {
                  triggerHaptic('click');
                  setWeightUnit('kg');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                  weightUnit === 'kg' ? 'bg-primary text-background' : 'text-secondary hover:text-foreground'
                }`}
              >
                kg
              </button>
              <button
                onClick={() => {
                  triggerHaptic('click');
                  setWeightUnit('lbs');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                  weightUnit === 'lbs' ? 'bg-primary text-background' : 'text-secondary hover:text-foreground'
                }`}
              >
                lbs
              </button>
            </div>
          </div>

          {/* FORMULE 1RM */}
          <div className="flex justify-between items-center text-foreground">
            <div className="flex flex-col">
              <span className="font-bold text-sm">Formule 1RM</span>
              <span className="text-[10px] text-secondary">Utilisée pour estimer votre max</span>
            </div>
            <select
              value={formula1RM}
              onChange={(e) => setFormula1RM(e.target.value as OneRMFormula)}
              className="p-2 bg-surface2 text-foreground font-bold rounded-lg border border-white/5 outline-none focus:border-primary text-sm"
            >
              <option value="wathen">Wathen</option>
              <option value="epley">Epley</option>
              <option value="brzycki">Brzycki</option>
              <option value="average">Moyenne (Les 3)</option>
            </select>
          </div>
        </div>
      </SectionCard>

      {/* MATERIEL */}
      <SectionCard className="p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Matériel</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center text-foreground">
            <div className="flex flex-col">
              <span className="font-bold text-sm">Poids de la barre ({weightUnit})</span>
              <span className="text-[10px] text-secondary">Barre par défaut pour le calculateur</span>
            </div>
            <input 
              type="number" 
              value={barWeight} 
              onChange={(e) => setBarWeight(parseFloat(e.target.value) || 0)}
              className="w-16 p-2 bg-surface2 text-foreground font-bold text-center rounded-lg border border-white/5 outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col text-foreground">
            <div className="flex flex-col mb-2">
              <span className="font-bold text-sm">Poids (Disques en {weightUnit})</span>
              <span className="text-[10px] text-secondary">Sélectionnez les disques disponibles dans votre salle</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(weightUnit === 'lbs'
                ? [55, 45, 35, 25, 15, 10, 5, 2.5, 1.25]
                : [25, 20, 15, 10, 5, 2.5, 2, 1.5, 1.25, 1, 0.5]
              ).map((plate) => {
                const isActive = availablePlates.includes(plate);
                return (
                  <button
                    key={plate}
                    onClick={() => {
                      triggerHaptic('click');
                      if (isActive) {
                        setAvailablePlates(availablePlates.filter((p) => p !== plate));
                      } else {
                        setAvailablePlates([...availablePlates, plate].sort((a, b) => b - a));
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                      isActive 
                        ? 'bg-primary text-background border-primary' 
                        : 'bg-surface2 text-secondary border-white/5 hover:text-foreground'
                    }`}
                  >
                    {plate}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* SNAPSHOTS AUTOMATIQUES & SECURITE */}
      <SectionCard className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Snapshots Automatiques</h3>
            <p className="text-[10px] text-secondary/70">Sauvegardes de secours automatiques conservées localement</p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('success');
              storage.snapshots.saveSnapshot('manual', 'Point de sauvegarde manuel', { history, library, programs });
              refreshSnapshots();
              pushToast('success', 'Nouveau snapshot créé.');
            }}
            className="text-[10px] font-bold uppercase bg-surface2 px-2.5 py-1.5 rounded-lg text-primary border border-primary/20 hover:bg-surface2/80 transition-colors"
          >
            + Snapshot
          </button>
        </div>

        {snapshots.length > 0 ? (
          <div className="space-y-2">
            {snapshots.map((snap) => {
              const dateStr = new Date(snap.timestamp).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={snap.id}
                  className="bg-surface2/40 p-3 rounded-xl border border-white/5 flex justify-between items-center"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{dateStr}</span>
                      <span className="text-[9px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
                        {formatSnapshotReason(snap.reason)}
                      </span>
                    </div>
                    <span className="text-[10px] text-secondary">
                      {snap.summary.historyCount} séances • {snap.summary.libraryCount} exos
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        confirm({
                          title: 'RESTAURER SNAPSHOT ?',
                          message: `Restaurer l'état du ${dateStr} ?`,
                          subMessage: `${snap.summary.historyCount} séance(s), ${snap.summary.libraryCount} exercice(s).\nLes données actuelles seront remplacées.`,
                          variant: 'primary',
                          confirmLabel: 'Restaurer',
                          onConfirm: () => {
                            restoreBackup(snap.data);
                            refreshSnapshots();
                            triggerHaptic('success');
                            pushToast('success', 'Snapshot restauré avec succès.');
                          },
                        });
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold uppercase bg-primary text-background rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Restaurer
                    </button>
                    <button
                      onClick={() => {
                        storage.snapshots.delete(snap.id);
                        refreshSnapshots();
                        triggerHaptic('click');
                      }}
                      className="p-1.5 text-secondary hover:text-danger rounded-lg hover:bg-danger/10 transition-colors"
                      title="Supprimer"
                    >
                      <Icons.Close size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-secondary/50 italic py-2 text-center">
            Aucun snapshot pour le moment. Un snapshot est créé à chaque séance terminée.
          </div>
        )}
      </SectionCard>

      {/* ARCHIVAGE & STOCKAGE */}
      <SectionCard className="p-6 space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Stockage & Archivage</h3>
              <p className="text-[10px] text-secondary/70">
                Espace Local-First utilisé : <span className="font-bold text-foreground">{storageUsage.formatted}</span> sur 5 Mo ({storageUsage.percentage}%)
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              storageUsage.isNearLimit
                ? 'bg-danger/20 text-danger border border-danger/30 animate-pulse'
                : storageUsage.percentage > 60
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}>
              {storageUsage.isNearLimit ? '⚠️ Espace critique' : 'Compression LZ Active'}
            </span>
          </div>

          <div className="w-full bg-surface2 h-2.5 rounded-full overflow-hidden border border-white/5 relative">
            <div
              className={`h-full transition-all duration-500 ${
                storageUsage.isNearLimit
                  ? 'bg-danger'
                  : storageUsage.percentage > 60
                  ? 'bg-amber-400'
                  : 'bg-primary'
              }`}
              style={{ width: `${Math.max(3, storageUsage.percentage)}%` }}
            />
          </div>

          {storageUsage.isNearLimit && (
            <div className="mt-3 p-3 bg-danger/10 border border-danger/30 rounded-xl flex items-start gap-2.5">
              <span className="text-danger text-base">⚠️</span>
              <div className="text-xs text-foreground">
                <p className="font-bold text-danger">Stockage local presque saturé ({storageUsage.percentage}%)</p>
                <p className="text-[11px] text-secondary mt-0.5">
                  Il est vivement conseillé de faire une <strong>Sauvegarde Globale JSON</strong> et d'archiver vos séances les plus anciennes pour libérer de l'espace.
                </p>
              </div>
            </div>
          )}
        </div>

        {historyRange.totalSessions > 0 && (
          <div className="bg-surface2/30 p-3 rounded-xl border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-secondary font-bold">Séances antérieures à :</span>
              <select
                value={archiveYears}
                onChange={(e) => setArchiveYears(parseInt(e.target.value, 10))}
                className="p-1.5 bg-surface2 text-foreground font-bold rounded-lg border border-white/5 outline-none focus:border-primary text-xs"
              >
                <option value={1}>1 an ({archiveFilterResult.toArchive.length} séance{archiveFilterResult.toArchive.length > 1 ? 's' : ''})</option>
                <option value={2}>2 ans ({filterSessionsByYears(history, 2).toArchive.length} séance{filterSessionsByYears(history, 2).toArchive.length > 1 ? 's' : ''})</option>
                <option value={3}>3 ans ({filterSessionsByYears(history, 3).toArchive.length} séance{filterSessionsByYears(history, 3).toArchive.length > 1 ? 's' : ''})</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                disabled={archiveFilterResult.toArchive.length === 0}
                onClick={() => {
                  triggerHaptic('success');
                  downloadArchiveFile(archiveFilterResult.toArchive, library, programs);

                  confirm({
                    title: 'ARCHIVAGE TÉLÉCHARGÉ',
                    message: `Souhaitez-vous retirer ces ${archiveFilterResult.toArchive.length} séance(s) de l'historique actif ?`,
                    subMessage: 'Le fichier JSON a été téléchargé. Vous pourrez réimporter ces séances à tout moment.',
                    variant: 'primary',
                    confirmLabel: 'Purger de l\'app',
                    cancelLabel: 'Garder dans l\'app',
                    onConfirm: () => {
                      storage.snapshots.saveSnapshot('before_archive', 'Avant purge d\'archive', { history, library, programs });
                      setHistory(archiveFilterResult.toKeep);
                      storage.history.save(archiveFilterResult.toKeep);
                      refreshSnapshots();
                      triggerHaptic('success');
                      pushToast('success', `${archiveFilterResult.toArchive.length} séance(s) archivée(s) et purgée(s).`);
                    },
                  });
                }}
                className="flex-1 py-2.5 bg-surface2 text-foreground font-bold text-xs uppercase rounded-lg border border-white/10 hover:bg-surface2/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Icons.Archive size={14} /> Archiver ({archiveFilterResult.toArchive.length})
              </button>

              <label className="flex-1 py-2.5 bg-surface2 text-foreground font-bold text-xs uppercase rounded-lg border border-white/10 hover:bg-surface2/80 transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                <Icons.Upload size={14} /> Fusionner Archive
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const parsed = JSON.parse(ev.target?.result as string);
                        const importedHistory = Array.isArray(parsed.history) ? parsed.history : [];
                        if (importedHistory.length === 0) {
                          pushToast('error', "Aucune séance trouvée dans ce fichier d'archive.");
                          return;
                        }

                        const { merged, addedCount } = mergeSessionsWithoutDuplicates(history, importedHistory);
                        setHistory(merged);
                        storage.history.save(merged);
                        refreshSnapshots();
                        triggerHaptic('success');
                        pushToast('success', `${addedCount} séance(s) réintégrée(s) sans doublon.`);
                      } catch {
                        pushToast('error', "Fichier d'archive invalide.");
                      }
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </SectionCard>

      {/* DONNEES GLOBALES */}
      <SectionCard className="p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Sauvegarde Globale</h3>
        <div className="grid grid-cols-2 gap-3 text-foreground">
          <button
            onClick={() => {
              triggerHaptic('success');
              const data = { schemaVersion: CURRENT_SCHEMA_VERSION, history, library, programs };
              const date = new Date().toISOString().split('T')[0];
              // EXPORT FORMATÉ (Pretty Print) pour meilleure lisibilité
              downloadFile(JSON.stringify(data, null, 2), `irontracker_backup_${date}.json`);
            }}
            className="bg-surface2 p-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-surface2/80 transition-colors"
          >
            <Icons.Download /> Sauvegarder
          </button>
          <label className="bg-surface2 p-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-surface2/80 transition-colors cursor-pointer">
            <Icons.Upload /> Restaurer
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  let parsed: unknown;
                  try {
                    parsed = JSON.parse(ev.target?.result as string);
                  } catch {
                    triggerHaptic('error');
                    pushToast('error', "Fichier illisible : ce n'est pas un JSON valide.");
                    return;
                  }

                  const result = validateBackup(parsed);
                  if (!result.valid || !result.data) {
                    triggerHaptic('error');
                    const detail = result.errors.slice(0, 3).join(' • ');
                    pushToast(
                      'error',
                      `Fichier de sauvegarde invalide ou incompatible. Aucune donnée n'a été modifiée.${detail ? ` (${detail})` : ''}`
                    );
                    return;
                  }

                  const migrated = migrateBackup(result.data, result.schemaVersion);

                  confirm({
                    title: 'RESTAURER ?',
                    message: `Remplacer les données actuelles par cette sauvegarde ?`,
                    subMessage: `${migrated.history.length} séance(s), ${migrated.library.length} exercice(s), ${migrated.programs.length} programme(s).\nLes données actuelles seront écrasées.`,
                    variant: 'danger',
                    confirmLabel: 'Restaurer',
                    onConfirm: () => {
                      restoreBackup(migrated);
                      refreshSnapshots();
                      triggerHaptic('success');
                      pushToast('success', 'Données restaurées avec succès.');
                    },
                  });
                };
                reader.onerror = () => {
                  triggerHaptic('error');
                  pushToast('error', 'Erreur de lecture du fichier.');
                };
                reader.readAsText(file);
                // Reset input so selecting the same file again re-triggers onChange
                e.target.value = '';
              }}
            />
          </label>
          <button
            onClick={() => {
              triggerHaptic('success');
              const csv = generateCSV(history, library);
              const date = new Date().toISOString().split('T')[0];
              downloadFile(csv, `irontracker_export_${date}.csv`, 'text/csv');
            }}
            className="col-span-2 bg-surface2 p-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-surface2/80 transition-colors"
          >
            <Icons.Table /> Exporter CSV (Excel)
          </button>
        </div>
      </SectionCard>

      {installPrompt && (
        <button
          onClick={() => {
            installPrompt.prompt();
          }}
          className="w-full py-4 bg-primary text-background font-black uppercase rounded-[2rem] shadow-xl active:scale-95 transition-all"
        >
          Installer l'application
        </button>
      )}

      <div className="pt-8">
        <button
          onClick={() => {
            confirm({
              title: 'RÉINITIALISER TOUT ?',
              message: 'Voulez-vous vraiment tout effacer ?',
              subMessage: 'Historique, programmes et bibliothèque seront supprimés définitivement.',
              variant: 'danger',
              onConfirm: () => {
                resetData();
                setTimeout(() => navigate('/'), 100);
                triggerHaptic('success');
              },
            });
          }}
          className="w-full py-4 bg-danger/10 text-danger font-black uppercase rounded-[2rem] border border-danger/20 hover:bg-danger/20 transition-all"
        >
          Zone de Danger : Reset
        </button>
        <div className="text-center mt-4 flex flex-col items-center gap-1">
          <div className="text-xs font-black italic text-foreground uppercase tracking-widest">IronTracker</div>
          <div className="text-[10px] text-secondary font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>v{__APP_VERSION__} • Release
          </div>
        </div>
      </div>
    </div>
  );
};
