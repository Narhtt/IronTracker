import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Modal } from '../../components/ui/Modal';
import { Icons } from '../../components/icons/Icons';
import { BodyMeasurement } from '../../core/types';
import { triggerHaptic } from '../../core/utils';

interface BodyMeasurementsModalProps {
  onClose: () => void;
  onWeightRecorded?: (weight: string) => void;
}

export const BodyMeasurementsModal: React.FC<BodyMeasurementsModalProps> = ({ onClose, onWeightRecorded }) => {
  const rawMeasurements = useStore((s) => s.measurements);
  const measurements = useMemo(() => rawMeasurements || [], [rawMeasurements]);
  const addMeasurement = useStore((s) => s.addMeasurement);
  const updateMeasurement = useStore((s) => s.updateMeasurement);
  const deleteMeasurement = useStore((s) => s.deleteMeasurement);
  const weightUnit = useStore((s) => s.weightUnit);
  const session = useStore((s) => s.session);
  const setSession = useStore((s) => s.setSession);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [weight, setWeight] = useState<string>('');
  const [waist, setWaist] = useState<string>('');
  const [chest, setChest] = useState<string>('');
  const [arms, setArms] = useState<string>('');
  const [thighs, setThighs] = useState<string>('');
  const [calves, setCalves] = useState<string>('');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // If selecting a date that already exists, auto-fill form
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const existing = measurements.find((m) => m.date === newDate);
    if (existing) {
      setEditingId(existing.id);
      setWeight(existing.weight ? String(existing.weight) : '');
      setWaist(existing.waist ? String(existing.waist) : '');
      setChest(existing.chest ? String(existing.chest) : '');
      setArms(existing.arms ? String(existing.arms) : '');
      setThighs(existing.thighs ? String(existing.thighs) : '');
      setCalves(existing.calves ? String(existing.calves) : '');
      setBodyFat(existing.bodyFat ? String(existing.bodyFat) : '');
      setNotes(existing.notes || '');
    } else if (editingId) {
      setEditingId(null);
    }
  };

  const handleEditEntry = (m: BodyMeasurement) => {
    triggerHaptic('click');
    setEditingId(m.id);
    setSelectedDate(m.date);
    setWeight(m.weight ? String(m.weight) : '');
    setWaist(m.waist ? String(m.waist) : '');
    setChest(m.chest ? String(m.chest) : '');
    setArms(m.arms ? String(m.arms) : '');
    setThighs(m.thighs ? String(m.thighs) : '');
    setCalves(m.calves ? String(m.calves) : '');
    setBodyFat(m.bodyFat ? String(m.bodyFat) : '');
    setNotes(m.notes || '');
    setActiveTab('form');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');

    const numWeight = parseFloat(weight);
    const numWaist = parseFloat(waist);
    const numChest = parseFloat(chest);
    const numArms = parseFloat(arms);
    const numThighs = parseFloat(thighs);
    const numCalves = parseFloat(calves);
    const numFat = parseFloat(bodyFat);

    const payload = {
      date: selectedDate,
      timestamp: new Date(selectedDate).getTime() || Date.now(),
      weight: !isNaN(numWeight) && numWeight > 0 ? numWeight : undefined,
      waist: !isNaN(numWaist) && numWaist > 0 ? numWaist : undefined,
      chest: !isNaN(numChest) && numChest > 0 ? numChest : undefined,
      arms: !isNaN(numArms) && numArms > 0 ? numArms : undefined,
      thighs: !isNaN(numThighs) && numThighs > 0 ? numThighs : undefined,
      calves: !isNaN(numCalves) && numCalves > 0 ? numCalves : undefined,
      bodyFat: !isNaN(numFat) && numFat > 0 ? numFat : undefined,
      notes: notes.trim() || undefined,
    };

    if (editingId) {
      updateMeasurement({ id: editingId, ...payload });
    } else {
      addMeasurement(payload);
    }

    // Synchronize active session body weight if provided
    if (payload.weight && session) {
      setSession({
        ...session,
        bodyWeight: String(payload.weight),
      });
    }

    if (payload.weight && onWeightRecorded) {
      onWeightRecorded(String(payload.weight));
    }

    setActiveTab('history');
    setEditingId(null);
  };

  const sortedMeasurements = useMemo(() => {
    return [...measurements].sort((a, b) => b.timestamp - a.timestamp);
  }, [measurements]);

  return (
    <Modal title="Mensurations Corporelles" onClose={onClose}>
      <div className="space-y-5 animate-fade-in text-foreground">
        {/* Navigation Tabs */}
        <div className="flex bg-surface2 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('click');
              setActiveTab('form');
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'form' ? 'bg-primary text-black shadow-md' : 'text-secondary hover:text-foreground'
            }`}
          >
            <Icons.Edit size={16} />
            <span>{editingId ? 'Modifier' : 'Nouvelle Saisie'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('click');
              setActiveTab('history');
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'history' ? 'bg-primary text-black shadow-md' : 'text-secondary hover:text-foreground'
            }`}
          >
            <Icons.History size={16} />
            <span>Historique ({measurements.length})</span>
          </button>
        </div>

        {activeTab === 'form' ? (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Date Selector */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-secondary font-bold tracking-wider">Date de mesure</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full bg-surface2 p-3 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-white/20 text-foreground"
                required
              />
            </div>

            {/* Core Metrics: Poids & Taille */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-secondary font-bold flex justify-between">
                  <span>Poids</span>
                  <span className="text-primary font-mono lowercase">({weightUnit})</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  placeholder="Ex: 78.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-surface2 p-3 rounded-xl text-center text-lg font-black outline-none border border-transparent focus:border-white/20 text-foreground placeholder-secondary/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-secondary font-bold flex justify-between">
                  <span>Tour de Taille</span>
                  <span className="text-secondary font-mono lowercase">(cm)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  placeholder="Ex: 82.0"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  className="w-full bg-surface2 p-3 rounded-xl text-center text-lg font-black outline-none border border-transparent focus:border-white/20 text-foreground placeholder-secondary/30"
                />
              </div>
            </div>

            {/* Circumferences Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5">
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-secondary font-bold">Poitrine (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  placeholder="-"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                  className="w-full bg-surface2/60 p-2.5 rounded-xl text-center text-sm font-bold outline-none border border-transparent focus:border-white/20 text-foreground placeholder-secondary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-secondary font-bold">Bras (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  placeholder="-"
                  value={arms}
                  onChange={(e) => setArms(e.target.value)}
                  className="w-full bg-surface2/60 p-2.5 rounded-xl text-center text-sm font-bold outline-none border border-transparent focus:border-white/20 text-foreground placeholder-secondary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-secondary font-bold">Cuisses (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  placeholder="-"
                  value={thighs}
                  onChange={(e) => setThighs(e.target.value)}
                  className="w-full bg-surface2/60 p-2.5 rounded-xl text-center text-sm font-bold outline-none border border-transparent focus:border-white/20 text-foreground placeholder-secondary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-secondary font-bold">Masse Grasse (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  inputMode="decimal"
                  placeholder="-"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  className="w-full bg-surface2/60 p-2.5 rounded-xl text-center text-sm font-bold outline-none border border-transparent focus:border-white/20 text-foreground placeholder-secondary/30"
                />
              </div>
            </div>

            {/* Optional Notes */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-secondary font-bold">Notes / Contexte (optionnel)</label>
              <input
                type="text"
                placeholder="Ex: À jeun au réveil, fin de semaine de deload..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-surface2 p-3 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-white/20 text-foreground placeholder-secondary/30"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('click');
                    setEditingId(null);
                    setWeight('');
                    setWaist('');
                    setChest('');
                    setArms('');
                    setThighs('');
                    setCalves('');
                    setBodyFat('');
                    setNotes('');
                  }}
                  className="px-4 py-3 rounded-xl bg-surface2 text-secondary font-bold uppercase text-xs hover:text-foreground"
                >
                  Annuler
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3.5 rounded-xl bg-primary text-black font-black uppercase text-xs shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Icons.Check size={16} strokeWidth={2.5} />
                <span>{editingId ? 'Mettre à jour' : 'Enregistrer la mesure'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* History View */
          <div className="space-y-3">
            {sortedMeasurements.length === 0 ? (
              <div className="text-center py-10 bg-surface2/30 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-center text-secondary/40">
                  <Icons.Scale size={32} />
                </div>
                <div className="text-sm font-bold text-secondary">Aucune mesure enregistrée</div>
                <div className="text-xs text-secondary/60">Ajoutez votre première pesée pour suivre votre évolution.</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
                {sortedMeasurements.map((m, idx) => {
                  const prev = sortedMeasurements[idx + 1];
                  const weightDiff = prev && m.weight && prev.weight ? +(m.weight - prev.weight).toFixed(1) : null;
                  const waistDiff = prev && m.waist && prev.waist ? +(m.waist - prev.waist).toFixed(1) : null;

                  return (
                    <div
                      key={m.id}
                      className="bg-surface2/40 border border-white/5 p-3.5 rounded-2xl flex items-center justify-between gap-3 hover:border-white/10 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-foreground">
                            {new Date(m.date).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {m.notes && <span className="text-[10px] text-secondary/70 italic max-w-[150px] truncate">"{m.notes}"</span>}
                        </div>

                        <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                          {m.weight && (
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                              {m.weight} {weightUnit}
                              {weightDiff !== null && (
                                <span className={`ml-1 text-[9px] ${weightDiff > 0 ? 'text-danger' : weightDiff < 0 ? 'text-success' : 'text-secondary'}`}>
                                  {weightDiff > 0 ? `+${weightDiff}` : `${weightDiff}`}
                                </span>
                              )}
                            </span>
                          )}
                          {m.waist && (
                            <span className="bg-surface2 text-secondary px-2 py-0.5 rounded">
                              Taille: <b className="text-foreground">{m.waist}cm</b>
                              {waistDiff !== null && (
                                <span className={`ml-1 text-[9px] ${waistDiff > 0 ? 'text-danger' : waistDiff < 0 ? 'text-success' : 'text-secondary'}`}>
                                  {waistDiff > 0 ? `+${waistDiff}` : `${waistDiff}`}
                                </span>
                              )}
                            </span>
                          )}
                          {m.arms && (
                            <span className="bg-surface2 text-secondary px-1.5 py-0.5 rounded">
                              Bras: <b className="text-foreground">{m.arms}cm</b>
                            </span>
                          )}
                          {m.chest && (
                            <span className="bg-surface2 text-secondary px-1.5 py-0.5 rounded">
                              Poitrine: <b className="text-foreground">{m.chest}cm</b>
                            </span>
                          )}
                          {m.bodyFat && (
                            <span className="bg-surface2 text-secondary px-1.5 py-0.5 rounded">
                              MG: <b className="text-foreground">{m.bodyFat}%</b>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditEntry(m)}
                          className="w-8 h-8 rounded-lg bg-surface2 text-secondary hover:text-foreground flex items-center justify-center transition-colors"
                          title="Modifier"
                        >
                          <Icons.Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('error');
                            deleteMeasurement(m.id);
                          }}
                          className="w-8 h-8 rounded-lg bg-surface2 text-secondary hover:text-danger flex items-center justify-center transition-colors"
                          title="Supprimer"
                        >
                          <Icons.Trash size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
