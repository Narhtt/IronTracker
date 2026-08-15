import React from 'react';
import { SectionCard } from '../../../components/ui/SectionCard';
import { WorkoutSession } from '../../../core/types';

interface HistorySessionHeaderProps {
  session: WorkoutSession;
  duration: string;
  setDuration: (d: string) => void;
  setIsDirty: (b: boolean) => void;
  onUpdate: (s: WorkoutSession) => void;
}

export const HistorySessionHeader: React.FC<HistorySessionHeaderProps> = ({ session, duration, setDuration, setIsDirty, onUpdate }) => {
  // Bloquer les caractères non désirés (- et e)
  const preventNegative = (e: React.KeyboardEvent) => {
    if (['-', 'e', 'E'].includes(e.key)) e.preventDefault();
  };

  // Helper pour format HH:mm strict pour input type="time"
  const getTimeString = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <SectionCard className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] uppercase text-secondary">Date</label>
          <input
            type="date"
            value={new Date(session.startTime).toISOString().split('T')[0]}
            onChange={(e) => {
              const d = new Date(e.target.value);
              const old = new Date(session.startTime);
              d.setHours(old.getHours(), old.getMinutes());
              onUpdate({ ...session, startTime: d.getTime() });
            }}
            className="w-full bg-surface2 p-2 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-white/10"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] uppercase text-secondary">Heure</label>
          <input
            type="time"
            value={getTimeString(session.startTime)}
            onChange={(e) => {
              const [h, m] = e.target.value.split(':').map(Number);
              const d = new Date(session.startTime);
              d.setHours(h, m);
              onUpdate({ ...session, startTime: d.getTime() });
            }}
            className="w-full bg-surface2 p-2 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-white/10"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-[9px] uppercase text-secondary">Durée (min)</label>
          <input
            type="number"
            min="0"
            onKeyDown={preventNegative}
            inputMode="decimal"
            value={duration}
            onChange={(e) => {
              setDuration(e.target.value);
              setIsDirty(true);
            }}
            className="w-full bg-surface2 p-2 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-white/10"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] uppercase text-secondary">Poids (kg)</label>
          <input
            type="number"
            min="0"
            onKeyDown={preventNegative}
            inputMode="decimal"
            value={session.bodyWeight}
            onChange={(e) => onUpdate({ ...session, bodyWeight: e.target.value })}
            className="w-full bg-surface2 p-2 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-white/10"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] uppercase text-secondary">Forme (1-5)</label>
          <input
            type="number"
            min="1"
            max="5"
            onKeyDown={preventNegative}
            inputMode="numeric"
            value={session.fatigue}
            onChange={(e) => onUpdate({ ...session, fatigue: e.target.value })}
            className="w-full bg-surface2 p-2 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-white/10"
          />
        </div>
      </div>
    </SectionCard>
  );
};
