import React, { useState, useEffect } from 'react';
import { BeforeInstallPromptEvent, AutoSnapshot } from '../../core/types';
import { triggerHaptic } from '../../core/utils';
import { STORAGE_KEYS } from '../../core/constants';
import { storage } from '../../services/storage';
import { GeneralSettingsTab } from './components/GeneralSettingsTab';
import { DataStorageTab } from './components/DataStorageTab';

type SettingsTab = 'general' | 'storage';

interface SettingsViewProps {
  installPrompt: BeforeInstallPromptEvent | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ installPrompt }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Local state for toggles
  const [hapticTactile, setHapticTactile] = useState(localStorage.getItem(STORAGE_KEYS.HAPTIC_TACTILE) !== 'false');
  const [visualFeedback, setVisualFeedback] = useState(localStorage.getItem(STORAGE_KEYS.VISUAL_FEEDBACK) !== 'false');
  const [hapticSession, setHapticSession] = useState(localStorage.getItem(STORAGE_KEYS.HAPTIC_SESSION) !== 'false');
  const [notifEnabled, setNotifEnabled] = useState(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED) !== 'false');

  // Snapshots & storage state
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

  // Permission State for Notifications
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
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black italic uppercase text-foreground">Configuration</h2>
        <span className="text-[10px] text-secondary font-mono bg-surface2 px-2 py-1 rounded-lg border border-white/5">
          v{__APP_VERSION__}
        </span>
      </div>

      {/* SEGMENTED CONTROL / TABS */}
      <div className="flex bg-surface2/60 p-1 rounded-2xl border border-white/5">
        <button
          onClick={() => {
            triggerHaptic('click');
            setActiveTab('general');
          }}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-bold uppercase tracking-wider ${
            activeTab === 'general'
              ? 'bg-primary text-background shadow-md'
              : 'text-secondary hover:text-foreground'
          }`}
        >
          <span>⚙️</span>
          <span>Préférences</span>
        </button>
        <button
          onClick={() => {
            triggerHaptic('click');
            setActiveTab('storage');
          }}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-bold uppercase tracking-wider ${
            activeTab === 'storage'
              ? 'bg-primary text-background shadow-md'
              : 'text-secondary hover:text-foreground'
          }`}
        >
          <span>💾</span>
          <span>Données & Stockage</span>
          {storageUsage.isNearLimit && (
            <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
          )}
        </button>
      </div>

      {/* CONTENU DE L'ONGLET */}
      {activeTab === 'general' ? (
        <GeneralSettingsTab
          hapticTactile={hapticTactile}
          setHapticTactile={setHapticTactile}
          visualFeedback={visualFeedback}
          setVisualFeedback={setVisualFeedback}
          hapticSession={hapticSession}
          setHapticSession={setHapticSession}
          notifEnabled={notifEnabled}
          toggleNotif={toggleNotif}
          permissionStatus={permissionStatus}
          requestNotifPermission={requestNotifPermission}
        />
      ) : (
        <DataStorageTab
          snapshots={snapshots}
          refreshSnapshots={refreshSnapshots}
          storageUsage={storageUsage}
          archiveYears={archiveYears}
          setArchiveYears={setArchiveYears}
          formatSnapshotReason={formatSnapshotReason}
        />
      )}

      {/* BOUTON D'INSTALLATION PWA */}
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

      {/* PIED DE PAGE */}
      <div className="pt-4 text-center flex flex-col items-center gap-1">
        <div className="text-xs font-black italic text-foreground uppercase tracking-widest">IronTracker</div>
        <div className="text-[10px] text-secondary font-mono flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>v{__APP_VERSION__} • Stable Release
        </div>
      </div>
    </div>
  );
};
