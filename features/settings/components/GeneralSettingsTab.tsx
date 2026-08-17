import React from 'react';
import { useStore } from '../../../store/useStore';
import { AccentColor, OneRMFormula } from '../../../core/types';
import { SectionCard } from '../../../components/ui/SectionCard';
import { triggerHaptic } from '../../../core/utils';
import { STORAGE_KEYS, THEMES } from '../../../core/constants';

interface GeneralSettingsTabProps {
  hapticTactile: boolean;
  setHapticTactile: (val: boolean) => void;
  visualFeedback: boolean;
  setVisualFeedback: (val: boolean) => void;
  hapticSession: boolean;
  setHapticSession: (val: boolean) => void;
  notifEnabled: boolean;
  toggleNotif: () => void;
  permissionStatus: NotificationPermission;
  requestNotifPermission: () => void;
}

export const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({
  hapticTactile,
  setHapticTactile,
  visualFeedback,
  setVisualFeedback,
  hapticSession,
  setHapticSession,
  notifEnabled,
  toggleNotif,
  permissionStatus,
  requestNotifPermission,
}) => {
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

  return (
    <div className="space-y-6 animate-fade-in">
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
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              themeMode === 'dark' ? 'bg-surface text-white shadow-md' : 'text-secondary hover:text-foreground'
            }`}
          >
            <span className="text-lg">🌙</span>
            <span className="text-xs font-bold uppercase">Sombre</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('click');
              setThemeMode('light');
            }}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              themeMode === 'light' ? 'bg-white text-black shadow-md' : 'text-secondary hover:text-foreground'
            }`}
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
              className={`w-10 h-10 min-w-[2.5rem] rounded-full border-2 flex items-center justify-center transition-all ${
                accentColor === key ? 'border-foreground scale-110' : 'border-transparent'
              }`}
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
    </div>
  );
};
