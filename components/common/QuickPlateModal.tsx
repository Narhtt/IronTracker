import React, { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Modal } from '../ui/Modal';
import { calculatePlates } from '../../core/utils';
import { PALETTE } from '../../styles/tokens';

interface QuickPlateModalProps {
  targetWeight: string;
  onClose: () => void;
}

// Map plates to PALETTE colors
const PLATE_COLORS: Record<number, string> = {
  20: PALETTE.accents.blue.primary,
  10: PALETTE.accents.emerald.primary,
  5: PALETTE.accents.red.primary,
  2.5: PALETTE.accents.purple.primary,
  1.25: PALETTE.accents.gray.primary,
};

export const QuickPlateModal: React.FC<QuickPlateModalProps> = ({ targetWeight: initialWeight, onClose }) => {
  const globalBarWeight = useStore((s) => s.barWeight);
  const availablePlates = useStore((s) => s.availablePlates);
  const weightUnit = useStore((s) => s.weightUnit);
  const [target, setTarget] = useState(initialWeight);
  const [bar, setBar] = useState(String(globalBarWeight));

  const plates = useMemo(() => availablePlates || [20, 10, 5, 2.5, 1.25], [availablePlates]);

  const plateResult = useMemo(() => {
    const w = parseFloat(target);
    const b = parseFloat(bar);
    return calculatePlates(w, b, plates);
  }, [target, bar, plates]);

  return (
    <Modal title="Assistant Disques" onClose={onClose}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-secondary font-bold">Cible ({weightUnit})</label>
            <input
              type="number"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-surface2 p-4 rounded-2xl text-center text-xl font-black outline-none focus:ring-1 ring-primary/50"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-secondary font-bold">Barre ({weightUnit})</label>
            <input
              type="number"
              inputMode="decimal"
              value={bar}
              onChange={(e) => setBar(e.target.value)}
              className="w-full bg-surface2 p-4 rounded-2xl text-center text-xl font-black outline-none focus:ring-1 ring-primary/50"
            />
          </div>
        </div>

        <div className="bg-surface2/30 p-6 rounded-[2rem] border border-border flex flex-col items-center justify-center min-h-[140px]">
          {plateResult.length > 0 ? (
            <div className="flex flex-col items-center gap-3 animate-zoom-in">
              <div className="text-[10px] uppercase text-secondary font-bold tracking-widest">Par Côté</div>
              <div className="flex flex-wrap justify-center gap-2">
                {plateResult.map((p, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-full flex items-center justify-center font-black text-xs shadow-lg border-2 border-white/10"
                    style={{ backgroundColor: PLATE_COLORS[p] || PALETTE.surface2, color: p === 1.25 ? PALETTE.text.primary : '#fff' }}
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-secondary text-xs italic">Entrez un poids valide (&gt; barre).</div>
          )}
        </div>
      </div>
    </Modal>
  );
};
