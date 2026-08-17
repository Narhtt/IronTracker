import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../../store/useStore';
import { AutoSnapshot } from '../../../core/types';
import { SectionCard } from '../../../components/ui/SectionCard';
import { Icons } from '../../../components/icons/Icons';
import { triggerHaptic, downloadFile, generateCSV } from '../../../core/utils';
import { useConfirm } from '../../../hooks/useConfirm';
import { validateBackup } from '../../../core/validation';
import { migrateBackup, CURRENT_SCHEMA_VERSION } from '../../../core/migrations';
import { storage } from '../../../services/storage';
import {
  filterSessionsByYears,
  downloadArchiveFile,
  mergeSessionsWithoutDuplicates,
  getHistoryDateRange,
} from '../../../core/archive';

interface DataStorageTabProps {
  snapshots: AutoSnapshot[];
  refreshSnapshots: () => void;
  storageUsage: ReturnType<typeof storage.getUsageEstimate>;
  archiveYears: number;
  setArchiveYears: (val: number) => void;
  formatSnapshotReason: (reason: string) => string;
}

export const DataStorageTab: React.FC<DataStorageTabProps> = ({
  snapshots,
  refreshSnapshots,
  storageUsage,
  archiveYears,
  setArchiveYears,
  formatSnapshotReason,
}) => {
  const navigate = useNavigate();
  const history = useStore((s) => s.history);
  const setHistory = useStore((s) => s.setHistory);
  const library = useStore((s) => s.library);
  const programs = useStore((s) => s.programs);
  const restoreBackup = useStore((s) => s.restoreBackup);
  const resetData = useStore((s) => s.resetData);
  const pushToast = useStore((s) => s.pushToast);
  const confirm = useConfirm();

  const archiveFilterResult = React.useMemo(() => {
    return filterSessionsByYears(history, archiveYears);
  }, [history, archiveYears]);

  const historyRange = React.useMemo(() => {
    return getHistoryDateRange(history);
  }, [history]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ARCHIVAGE & STOCKAGE LOCAL */}
      <SectionCard className="p-6 space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Stockage Local-First</h3>
              <p className="text-[10px] text-secondary/70">
                Espace utilisé : <span className="font-bold text-foreground">{storageUsage.formatted}</span> sur 5 Mo ({storageUsage.percentage}%)
              </p>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                storageUsage.isNearLimit
                  ? 'bg-danger/20 text-danger border border-danger/30 animate-pulse'
                  : storageUsage.percentage > 60
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}
            >
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

        {/* SECTION ARCHIVAGE */}
        {historyRange.totalSessions > 0 && (
          <div className="bg-surface2/30 p-3 rounded-xl border border-white/5 space-y-3 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-secondary font-bold">Archiver séances antérieures à :</span>
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
                    confirmLabel: "Purger de l'app",
                    cancelLabel: "Garder dans l'app",
                    onConfirm: () => {
                      storage.snapshots.saveSnapshot('before_archive', "Avant purge d'archive", { history, library, programs });
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

      {/* SNAPSHOTS AUTOMATIQUES & SECURITE */}
      <SectionCard className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Snapshots de Sécurité</h3>
            <p className="text-[10px] text-secondary/70">Points de restauration créés automatiquement</p>
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

      {/* DONNEES GLOBALES */}
      <SectionCard className="p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">Sauvegarde Globale</h3>
        <div className="grid grid-cols-2 gap-3 text-foreground">
          <button
            onClick={() => {
              triggerHaptic('success');
              const data = { schemaVersion: CURRENT_SCHEMA_VERSION, history, library, programs };
              const date = new Date().toISOString().split('T')[0];
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

      {/* ZONE DE DANGER */}
      <div className="pt-2">
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
      </div>
    </div>
  );
};
