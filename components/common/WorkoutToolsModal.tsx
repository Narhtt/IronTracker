import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Modal } from '../ui/Modal';
import { Icons } from '../icons/Icons';
import { calculate1RM, calculatePlates } from '../../core/utils';
import { PALETTE } from '../../styles/tokens';

interface WorkoutToolsModalProps {
  onClose: () => void;
  initialTab?: '1rm' | 'conv' | 'plate' | 'measure';
  initialTargetWeight?: string;
}

// Map plates to PALETTE colors
const PLATE_COLORS: Record<number, string> = {
  20: PALETTE.accents.blue.primary,
  10: PALETTE.accents.emerald.primary,
  5: PALETTE.accents.red.primary,
  2.5: PALETTE.accents.purple.primary,
  1.25: PALETTE.accents.gray.primary,
};

export const WorkoutToolsModal: React.FC<WorkoutToolsModalProps> = ({ onClose, initialTab = '1rm', initialTargetWeight = '' }) => {
  const [activeTab, setActiveTab] = useState<'1rm' | 'conv' | 'plate' | 'measure'>(initialTab);
  const formula1RM = useStore((s) => s.formula1RM);
  const weightUnit = useStore((s) => s.weightUnit);
  const measurements = useStore((s) => s.measurements) || [];
  const addMeasurement = useStore((s) => s.addMeasurement);
  const deleteMeasurement = useStore((s) => s.deleteMeasurement);
  const session = useStore((s) => s.session);
  const setSession = useStore((s) => s.setSession);

  // Measurements Quick Form State
  const [mDate, setMDate] = useState(new Date().toISOString().split('T')[0]);
  const [mWeight, setMWeight] = useState('');
  const [mWaist, setMWaist] = useState('');
  const [mChest, setMChest] = useState('');
  const [mArms, setMArms] = useState('');
  const [mThighs, setMThighs] = useState('');
  const [mFat, setMFat] = useState('');

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(mWeight);
    const wst = parseFloat(mWaist);
    const c = parseFloat(mChest);
    const a = parseFloat(mArms);
    const t = parseFloat(mThighs);
    const f = parseFloat(mFat);

    if (isNaN(w) && isNaN(wst) && isNaN(c) && isNaN(a) && isNaN(t) && isNaN(f)) return;

    addMeasurement({
      date: mDate,
      timestamp: new Date(mDate).getTime() || Date.now(),
      weight: !isNaN(w) && w > 0 ? w : undefined,
      waist: !isNaN(wst) && wst > 0 ? wst : undefined,
      chest: !isNaN(c) && c > 0 ? c : undefined,
      arms: !isNaN(a) && a > 0 ? a : undefined,
      thighs: !isNaN(t) && t > 0 ? t : undefined,
      bodyFat: !isNaN(f) && f > 0 ? f : undefined,
    });

    if (!isNaN(w) && w > 0 && session) {
      setSession({ ...session, bodyWeight: String(w) });
    }

    setMWeight('');
    setMWaist('');
    setMChest('');
    setMArms('');
    setMThighs('');
    setMFat('');
  };

  // 1RM State
  const [rmWeight, setRmWeight] = useState('100');
  const [rmReps, setRmReps] = useState('5');
  const est1RM = useMemo(() => calculate1RM(rmWeight, rmReps, formula1RM), [rmWeight, rmReps, formula1RM]);

  // Converter State
  const [convBB, setConvBB] = useState('');
  const [convDB, setConvDB] = useState('');

  // Plate Calc State
  const globalBarWeight = useStore((s) => s.barWeight);
  const availablePlates = useStore((s) => s.availablePlates);
  const plates = useMemo(() => availablePlates || [20, 10, 5, 2.5, 1.25], [availablePlates]);
  const [targetWeight, setTargetWeight] = useState(initialTargetWeight);
  const [barWeight, setBarWeight] = useState(String(globalBarWeight));

  const plateResult = useMemo(() => {
    const target = parseFloat(targetWeight);
    const bar = parseFloat(barWeight);
    return calculatePlates(target, bar, plates);
  }, [targetWeight, barWeight, plates]);

  // Bloquer les caractères non désirés (- et e)
  const preventNegative = (e: React.KeyboardEvent) => {
    if (['-', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Configuration des zones 1RM
  const RM_ZONES = [
    { label: 'Force / Intensité', values: [95, 90, 85, 80] },
    { label: 'Hypertrophie / Volume', values: [75, 70, 65, 60] },
    { label: 'Échauffement / Deload', values: [55, 50, 45, 40] },
  ];

  return (
    <Modal title="Boîte à Outils" onClose={onClose}>
      <div className="space-y-6">
        {/* TABS */}
        <div className="flex bg-surface2 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('1rm')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${activeTab === '1rm' ? 'bg-primary text-background shadow-lg' : 'text-secondary hover:text-foreground'}`}
          >
            <span className="text-lg">1RM</span>
          </button>
          <button
            onClick={() => setActiveTab('conv')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${activeTab === 'conv' ? 'bg-primary text-background shadow-lg' : 'text-secondary hover:text-foreground'}`}
          >
            <Icons.Exchange size={16} />
          </button>
          <button
            onClick={() => setActiveTab('plate')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${activeTab === 'plate' ? 'bg-primary text-background shadow-lg' : 'text-secondary hover:text-foreground'}`}
          >
            <Icons.Disc size={16} />
          </button>
          <button
            onClick={() => setActiveTab('measure')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${activeTab === 'measure' ? 'bg-primary text-background shadow-lg' : 'text-secondary hover:text-foreground'}`}
          >
            <Icons.Scale size={16} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="min-h-[250px]">
          {activeTab === '1rm' && (
            <div className="space-y-6 animate-fade-in">
              {/* RESULTAT PRINCIPAL */}
              <div className="text-center bg-surface2/30 p-4 rounded-2xl relative border border-white/5">
                <div className="text-5xl font-black text-primary mb-1 tracking-tighter">
                  {est1RM} <span className="text-lg text-secondary font-bold">{weightUnit}</span>
                </div>
                <div className="text-[10px] font-bold uppercase text-secondary tracking-widest">Max Estimé</div>
                <div className="absolute top-3 right-3 text-[8px] text-secondary/50 font-mono capitalize">{formula1RM}</div>
              </div>

              {/* INPUTS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-secondary font-bold">Charge ({weightUnit})</label>
                  <input
                    type="number"
                    min="0"
                    onKeyDown={preventNegative}
                    inputMode="decimal"
                    value={rmWeight}
                    onChange={(e) => setRmWeight(e.target.value)}
                    className="w-full bg-surface2 p-3 rounded-2xl text-center text-xl font-black outline-none focus:border-white/20 border border-transparent text-foreground placeholder-secondary/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-secondary font-bold">Reps</label>
                  <input
                    type="number"
                    min="0"
                    onKeyDown={preventNegative}
                    inputMode="decimal"
                    value={rmReps}
                    onChange={(e) => setRmReps(e.target.value)}
                    className="w-full bg-surface2 p-3 rounded-2xl text-center text-xl font-black outline-none focus:border-white/20 border border-transparent text-foreground placeholder-secondary/30"
                  />
                </div>
              </div>

              {/* GRILLES DE POURCENTAGES */}
              <div className="space-y-3">
                {RM_ZONES.map((zone, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="text-[9px] font-black uppercase text-secondary/50 pl-1">{zone.label}</div>
                    <div className="grid grid-cols-4 gap-2">
                      {zone.values.map((pct) => (
                        <div
                          key={pct}
                          className="bg-surface2/50 p-2 rounded-xl text-center border border-white/5 flex flex-col items-center justify-center"
                        >
                          <div className="text-[8px] text-secondary font-bold mb-0.5">{pct}%</div>
                          <div className="font-mono font-black text-sm text-slate-900 dark:text-white">
                            {Math.round(est1RM * (pct / 100))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'conv' && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                  <label className="font-black text-lg italic text-secondary">BARRE</label>
                  <span className="text-[9px] text-secondary/50 font-bold uppercase">2 mains</span>
                </div>
                <input
                  type="number"
                  min="0"
                  onKeyDown={preventNegative}
                  inputMode="decimal"
                  value={convBB}
                  onChange={(e) => {
                    const v = e.target.value;
                    setConvBB(v);
                    if (v) setConvDB(Math.round((parseFloat(v) * 0.8) / 2).toString());
                    else setConvDB('');
                  }}
                  placeholder="0"
                  className="w-full bg-surface2 p-4 rounded-2xl text-center text-3xl font-black outline-none focus:border-white/20 border border-transparent placeholder-secondary/20 text-foreground"
                />
              </div>

              <div className="flex justify-center text-secondary/30">
                <Icons.Exchange size={24} className="rotate-90" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                  <label className="font-black text-lg italic text-secondary">HALTÈRE</label>
                  <span className="text-[9px] text-secondary/50 font-bold uppercase">Par main</span>
                </div>
                <input
                  type="number"
                  min="0"
                  onKeyDown={preventNegative}
                  inputMode="decimal"
                  value={convDB}
                  onChange={(e) => {
                    const v = e.target.value;
                    setConvDB(v);
                    if (v) setConvBB(Math.round((parseFloat(v) * 2) / 0.8).toString());
                    else setConvBB('');
                  }}
                  placeholder="0"
                  className="w-full bg-surface2 p-4 rounded-2xl text-center text-3xl font-black outline-none focus:border-white/20 border border-transparent placeholder-secondary/20 text-foreground"
                />
              </div>
              <div className="text-center text-[10px] text-secondary italic px-4">
                Calibré sur une perte de stabilité d'environ 20% aux haltères.
              </div>
            </div>
          )}

          {activeTab === 'plate' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-secondary font-bold">Cible ({weightUnit})</label>
                  <input
                    type="number"
                    min="0"
                    onKeyDown={preventNegative}
                    inputMode="decimal"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    className="w-full bg-surface2 p-4 rounded-2xl text-center text-xl font-black outline-none focus:border-white/20 border border-transparent text-foreground placeholder-secondary/30"
                    placeholder="100"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-secondary font-bold">Barre ({weightUnit})</label>
                  <input
                    type="number"
                    min="0"
                    onKeyDown={preventNegative}
                    inputMode="decimal"
                    value={barWeight}
                    onChange={(e) => setBarWeight(e.target.value)}
                    className="w-full bg-surface2 p-4 rounded-2xl text-center text-xl font-black outline-none focus:border-white/20 border border-transparent text-foreground placeholder-secondary/30"
                    placeholder={String(globalBarWeight)}
                  />
                </div>
              </div>

              <div className="bg-surface2/30 p-6 rounded-[2rem] min-h-[160px] flex flex-col items-center justify-center border border-white/5">
                {plateResult.length > 0 ? (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="text-[10px] uppercase text-secondary font-bold tracking-widest bg-surface2 px-3 py-1 rounded-full">
                      Par Côté
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {plateResult.map((p, i) => {
                        const useBlackText = p === 10;
                        return (
                          <div
                            key={i}
                            className="w-14 h-14 rounded-full flex items-center justify-center font-black text-sm shadow-xl relative group border-4 border-black/10 dark:border-white/10 animate-zoom-in"
                            style={{
                              backgroundColor: PLATE_COLORS[p] || PALETTE.surface2,
                              color: useBlackText ? '#000' : '#fff',
                              animationDelay: `${i * 50}ms`,
                            }}
                          >
                            {p}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-secondary mt-1 bg-surface2 px-3 py-1 rounded-full font-bold">
                      Total chargé: <span className="text-foreground">{targetWeight} {weightUnit}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-secondary/40 text-xs italic font-medium">Entrez un poids cible valide.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'measure' && (
            <div className="space-y-4 animate-fade-in text-foreground">
              <form onSubmit={handleSaveMeasurement} className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] uppercase text-secondary font-bold">Date</label>
                    <input
                      type="date"
                      value={mDate}
                      onChange={(e) => setMDate(e.target.value)}
                      className="w-full bg-surface2 p-2.5 rounded-xl text-xs font-bold outline-none text-foreground"
                    />
                  </div>
                  <div className="w-1/2 space-y-1">
                    <label className="text-[9px] uppercase text-secondary font-bold">Poids ({weightUnit})</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      inputMode="decimal"
                      placeholder="Ex: 80.5"
                      value={mWeight}
                      onChange={(e) => setMWeight(e.target.value)}
                      className="w-full bg-surface2 p-2.5 rounded-xl text-xs font-bold text-center outline-none text-foreground placeholder-secondary/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-secondary font-bold">Taille (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      inputMode="decimal"
                      placeholder="-"
                      value={mWaist}
                      onChange={(e) => setMWaist(e.target.value)}
                      className="w-full bg-surface2 p-2 rounded-xl text-xs font-bold text-center outline-none text-foreground"
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
                      value={mArms}
                      onChange={(e) => setMArms(e.target.value)}
                      className="w-full bg-surface2 p-2 rounded-xl text-xs font-bold text-center outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-secondary font-bold">MG (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      inputMode="decimal"
                      placeholder="-"
                      value={mFat}
                      onChange={(e) => setMFat(e.target.value)}
                      className="w-full bg-surface2 p-2 rounded-xl text-xs font-bold text-center outline-none text-foreground"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary text-black font-black uppercase text-[10px] rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Icons.Check size={14} strokeWidth={2.5} />
                  <span>Enregistrer</span>
                </button>
              </form>

              {/* History Preview */}
              <div className="space-y-1.5 pt-2 border-t border-white/5 max-h-[160px] overflow-y-auto no-scrollbar">
                <div className="text-[9px] uppercase font-bold text-secondary tracking-wider">Dernières entrées</div>
                {measurements.length === 0 ? (
                  <div className="text-center py-4 text-xs text-secondary/50 italic">Aucune pesée enregistrée</div>
                ) : (
                  measurements.slice(0, 5).map((m) => (
                    <div key={m.id} className="bg-surface2/40 px-3 py-1.5 rounded-lg flex justify-between items-center text-xs">
                      <div className="flex gap-2 items-center">
                        <span className="font-mono text-secondary text-[10px]">
                          {new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        </span>
                        {m.weight && <span className="font-bold text-primary">{m.weight} {weightUnit}</span>}
                        {m.waist && <span className="text-[10px] text-secondary">T:{m.waist}cm</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteMeasurement(m.id)}
                        className="text-secondary/40 hover:text-danger p-1"
                      >
                        <Icons.Trash size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
