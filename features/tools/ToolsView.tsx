import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { SectionCard } from '../../components/ui/SectionCard';
import { calculate1RM, triggerHaptic, calculatePlates } from '../../core/utils';
import { Icons } from '../../components/icons/Icons';
import { PALETTE } from '../../styles/tokens';

export const OneRMView: React.FC = () => {
  const navigate = useNavigate();
  const formula1RM = useStore((s) => s.formula1RM);
  const weightUnit = useStore((s) => s.weightUnit);
  const [oneRMWeight, setOneRMWeight] = useState('100');
  const [oneRMReps, setOneRMReps] = useState('5');
  const est1RM = useMemo(() => calculate1RM(oneRMWeight, oneRMReps, formula1RM), [oneRMWeight, oneRMReps, formula1RM]);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center gap-4 px-1">
        <button onClick={() => navigate('/')} className="p-2 bg-surface2 rounded-full text-secondary hover:text-white transition-colors">
          <Icons.ChevronLeft />
        </button>
        <h2 className="text-2xl font-black italic uppercase">Calculateur 1RM</h2>
      </div>
      <SectionCard className="p-8 flex flex-col items-center gap-6 relative">
        <div className="absolute top-4 right-4 text-[9px] text-secondary/50 font-mono capitalize">Formule: {formula1RM}</div>
        <div className="text-center">
          <div className="text-6xl font-black text-primary mb-2 tracking-tighter">
            {est1RM} <span className="text-2xl text-secondary">{weightUnit}</span>
          </div>
          <div className="text-xs font-bold uppercase text-secondary tracking-widest">Estimation Max</div>
        </div>
        <div className="w-full grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-secondary">Poids ({weightUnit})</label>
            <input
              type="number"
              value={oneRMWeight}
              onChange={(e) => {
                setOneRMWeight(e.target.value);
                triggerHaptic('tick');
              }}
              className="w-full bg-surface2 p-4 rounded-2xl text-center text-xl font-bold outline-none focus:ring-2 ring-primary/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-secondary">Reps</label>
            <input
              type="number"
              value={oneRMReps}
              onChange={(e) => {
                setOneRMReps(e.target.value);
                triggerHaptic('tick');
              }}
              className="w-full bg-surface2 p-4 rounded-2xl text-center text-xl font-bold outline-none focus:ring-2 ring-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="w-full grid grid-cols-4 gap-2 text-center mt-4">
          {[95, 90, 85, 80, 75, 70, 65, 60].map((pct) => (
            <div key={pct} className="bg-surface2/50 p-2 rounded-xl">
              <div className="text-[10px] text-secondary font-bold">{pct}%</div>
              <div className="font-mono font-bold">{Math.round(est1RM * (pct / 100))}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

export const ConverterView: React.FC = () => {
  const navigate = useNavigate();
  const [convBB, setConvBB] = useState('');
  const [convDB, setConvDB] = useState('');

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center gap-4 px-1">
        <button onClick={() => navigate('/')} className="p-2 bg-surface2 rounded-full text-secondary hover:text-white transition-colors">
          <Icons.ChevronLeft />
        </button>
        <h2 className="text-2xl font-black italic uppercase">Convertisseur</h2>
      </div>
      <SectionCard className="p-8 space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="font-black text-xl italic text-secondary">BARRE</label>
            <div className="text-[10px] font-mono text-secondary">2 mains</div>
          </div>
          <input
            type="number"
            value={convBB}
            onChange={(e) => {
              const v = e.target.value;
              setConvBB(v);
              if (v) setConvDB(Math.round((parseFloat(v) * 0.8) / 2).toString());
              else setConvDB('');
            }}
            placeholder="0"
            className="w-full bg-surface2 p-4 rounded-2xl text-center text-3xl font-black outline-none focus:ring-2 ring-primary/50 transition-all placeholder-secondary/20"
          />
        </div>
        <div className="flex justify-center text-secondary/30">
          <Icons.Exchange size={24} className="rotate-90" />
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="font-black text-xl italic text-secondary">HALTÈRE</label>
            <div className="text-[10px] font-mono text-secondary">Par main</div>
          </div>
          <input
            type="number"
            value={convDB}
            onChange={(e) => {
              const v = e.target.value;
              setConvDB(v);
              if (v) setConvBB(Math.round((parseFloat(v) * 2) / 0.8).toString());
              else setConvBB('');
            }}
            placeholder="0"
            className="w-full bg-surface2 p-4 rounded-2xl text-center text-3xl font-black outline-none focus:ring-2 ring-primary/50 transition-all placeholder-secondary/20"
          />
        </div>
        <p className="text-center text-[10px] text-secondary italic">Basé sur une perte de stabilité d'environ 20% aux haltères.</p>
      </SectionCard>
    </div>
  );
};

// Map plates to PALETTE colors
const PLATE_COLORS: Record<number, string> = {
  20: PALETTE.accents.blue.primary,
  10: PALETTE.accents.emerald.primary,
  5: PALETTE.accents.red.primary,
  2.5: PALETTE.accents.purple.primary,
  1.25: PALETTE.accents.gray.primary,
};

export const PlateCalcView: React.FC = () => {
  const navigate = useNavigate();
  const [targetWeight, setTargetWeight] = useState('');
  const globalBarWeight = useStore((s) => s.barWeight);
  const weightUnit = useStore((s) => s.weightUnit);
  const storeAvailablePlates = useStore((s) => s.availablePlates);
  const availablePlates = useMemo(() => storeAvailablePlates || [20, 10, 5, 2.5, 1.25], [storeAvailablePlates]);
  const [barWeight, setBarWeight] = useState(String(globalBarWeight));

  const plateResult = useMemo(() => {
    const target = parseFloat(targetWeight);
    const bar = parseFloat(barWeight);
    return calculatePlates(target, bar, availablePlates);
  }, [targetWeight, barWeight, availablePlates]);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center gap-4 px-1">
        <button onClick={() => navigate('/')} className="p-2 bg-surface2 rounded-full text-secondary hover:text-white transition-colors">
          <Icons.ChevronLeft />
        </button>
        <h2 className="text-2xl font-black italic uppercase">Disques</h2>
      </div>

      <SectionCard className="p-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase text-secondary font-bold">Objectif ({weightUnit})</label>
            <input
              type="number"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              className="w-full bg-surface2 p-4 rounded-2xl text-center font-black text-xl outline-none"
              placeholder="Ex: 100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase text-secondary font-bold">Barre ({weightUnit})</label>
            <input
              type="number"
              value={barWeight}
              onChange={(e) => setBarWeight(e.target.value)}
              className="w-full bg-surface2 p-4 rounded-2xl text-center font-black text-xl outline-none"
              placeholder={String(globalBarWeight)}
            />
          </div>
        </div>

        <div className="bg-surface2/30 p-8 rounded-[2rem] min-h-[150px] flex flex-col items-center justify-center border border-border">
          {plateResult.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <div className="text-xs uppercase text-secondary font-bold tracking-widest">Charger par Côté</div>
              <div className="flex flex-wrap justify-center gap-2">
                {plateResult.map((p, i) => (
                  <div
                    key={i}
                    className="w-14 h-14 rounded-full flex items-center justify-center font-black text-sm shadow-xl relative group border-4 border-white/10"
                    style={{ backgroundColor: PLATE_COLORS[p] || PALETTE.surface2, color: p === 1.25 ? PALETTE.text.primary : '#fff' }}
                  >
                    {p}
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-secondary mt-2 bg-surface2 px-3 py-1 rounded-full">
                Total chargé: {targetWeight} {weightUnit}
              </div>
            </div>
          ) : (
            <div className="text-secondary text-sm italic">Entrez un poids cible valide.</div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};
