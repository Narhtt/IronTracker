import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { PALETTE } from '../../../styles/tokens';

interface ModalProps {
  onClose: () => void;
}

// 1. SBD INFO
export const SBDInfoModal: React.FC<ModalProps> = ({ onClose }) => (
  <Modal title="Standards SBD" onClose={onClose}>
    <div className="space-y-4">
      <div className="text-sm text-secondary/80 leading-relaxed">
        La <strong className="text-foreground">force relative</strong> (Ratio 1RM / Poids de corps) est l'indicateur le plus pertinent pour
        évaluer votre niveau réel, indépendamment de votre gabarit.
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase text-primary border-b border-white/10 pb-1">Les Paliers de Force</h4>

        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
          <div className="text-left text-secondary">Niveau</div>
          <div className="text-gold">Squat</div>
          <div className="text-gold">Bench</div>
          <div className="text-gold">Dead.</div>
        </div>

        {[
          { lvl: 'Novice', s: '1.0x', b: '0.7x', d: '1.2x', desc: '< 6 mois de pratique' },
          { lvl: 'Inter.', s: '1.5x', b: '1.0x', d: '1.8x', desc: '6 mois à 2 ans' },
          { lvl: 'Avancé', s: '2.0x', b: '1.5x', d: '2.5x', desc: 'Potentiel naturel proche' },
          { lvl: 'Élite', s: '2.2x', b: '1.7x', d: '2.8x', desc: 'Compétition nationale' },
        ].map((row, i) => (
          <div key={i} className="bg-surface2/30 p-2 rounded-xl">
            <div className="grid grid-cols-4 gap-2 text-center items-center mb-1">
              <div className="text-left font-black text-foreground text-[10px] uppercase">{row.lvl}</div>
              <div className="font-mono text-xs text-foreground/80">{row.s}</div>
              <div className="font-mono text-xs text-foreground/80">{row.b}</div>
              <div className="font-mono text-xs text-foreground/80">{row.d}</div>
            </div>
            <div className="text-[9px] text-secondary/50 text-left italic">{row.desc}</div>
          </div>
        ))}
      </div>

      <div className="bg-warning/5 border border-warning/10 p-3 rounded-xl space-y-2">
        <div className="text-[10px] font-black uppercase text-warning">Note Importante</div>
        <p className="text-[10px] text-secondary leading-relaxed">
          Ces standards sont basés sur une répétition maximale (1RM) pour un athlète masculin naturel.
        </p>
      </div>
    </div>
  </Modal>
);

// 2. VOLUME INFO
export const VolumeInfoModal: React.FC<ModalProps> = ({ onClose }) => (
  <Modal title="Volume Hebdomadaire" onClose={onClose}>
    <div className="space-y-5">
      <div className="text-sm text-secondary/80 leading-relaxed">
        Le nombre de séries effectives (proches de l'échec) par groupe musculaire est le facteur principal de l'hypertrophie.
      </div>

      {/* Zones Générales */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase text-emerald-500 border-b border-white/10 pb-1">Les Zones Cibles</h4>

        {[
          { zone: 'Maintien (MV)', range: '< 6 sets', color: 'text-secondary', desc: 'Suffisant pour conserver la masse.' },
          { zone: 'Optimal (MAV)', range: '10 - 20 sets', color: 'text-success', desc: 'Zone de progression maximale.' },
          { zone: 'Surcharge (MRV)', range: '> 22 sets', color: 'text-warning', desc: 'Risque de récupération insuffisante.' },
        ].map((item, i) => (
          <div key={i} className="bg-surface2/30 p-3 rounded-xl flex justify-between items-center">
            <div>
              <div className={`text-xs font-black uppercase ${item.color}`}>{item.zone}</div>
              <div className="text-[10px] text-secondary mt-1">{item.desc}</div>
            </div>
            <div className="text-xs font-mono font-bold text-foreground bg-surface2 px-2 py-1 rounded border border-white/5">
              {item.range}
            </div>
          </div>
        ))}
      </div>

      {/* Distinction Gros/Petits Muscles */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase text-blue-400 border-b border-white/10 pb-1">Distinction Anatomique</h4>

        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
          <div className="text-left text-secondary">Groupe</div>
          <div className="text-secondary">Maintien</div>
          <div className="text-emerald-500">Cible</div>
        </div>

        <div className="bg-surface2/30 p-2 rounded-xl grid grid-cols-3 gap-2 text-center items-center">
          <div className="text-left">
            <div className="font-black text-foreground text-[10px] uppercase">Gros Muscles</div>
            <div className="text-[8px] text-secondary italic">Dos, Jambes, Pecs</div>
          </div>
          <div className="font-mono text-xs text-secondary">6+</div>
          <div className="font-mono text-xs text-foreground font-bold">12-20</div>
        </div>

        <div className="bg-surface2/30 p-2 rounded-xl grid grid-cols-3 gap-2 text-center items-center">
          <div className="text-left">
            <div className="font-black text-foreground text-[10px] uppercase">Petits Muscles</div>
            <div className="text-[8px] text-secondary italic">Bras, Épaules, Mollets</div>
          </div>
          <div className="font-mono text-xs text-secondary">3+</div>
          <div className="font-mono text-xs text-foreground font-bold">6-12</div>
        </div>

        <p className="text-[9px] text-secondary/60 italic mt-2">
          * Les petits muscles sont déjà sollicités indirectement par les mouvements polyarticulaires (ex: Triceps au Bench).
        </p>
      </div>
    </div>
  </Modal>
);

// 3. FATIGUE INFO
export const FatigueInfoModal: React.FC<ModalProps> = ({ onClose }) => (
  <Modal title="Auto-Régulation (RPE)" onClose={onClose}>
    <div className="space-y-4">
      <div className="text-sm text-secondary/80 leading-relaxed">
        La gestion de la fatigue est cruciale. Plus le volume augmente, plus la fatigue s'accumule. L'objectif est de maximiser le volume
        tant que la fatigue reste gérable.
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface2/30 p-3 rounded-xl border border-white/5">
          <div className="text-[10px] font-black uppercase text-secondary mb-1">Volume Élevé + Fatigue Basse</div>
          <div className="text-xl font-bold text-success">Sweet Spot</div>
          <p className="text-[9px] text-secondary/70 mt-1">Progression optimale.</p>
        </div>
        <div className="bg-surface2/30 p-3 rounded-xl border border-white/5">
          <div className="text-[10px] font-black uppercase text-secondary mb-1">Volume Élevé + Fatigue Élevée</div>
          <div className="text-xl font-bold text-danger">Danger</div>
          <p className="text-[9px] text-secondary/70 mt-1">Risque de blessure imminent.</p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-black uppercase text-orange-500 border-b border-white/10 pb-1 mt-2">
          Échelle de Fatigue (Session RPE)
        </h4>
        {[
          { val: 1, text: 'Très Facile', color: PALETTE.fatigue[1] },
          { val: 2, text: 'Facile', color: PALETTE.fatigue[2] },
          { val: 3, text: 'Modéré (Standard)', color: PALETTE.fatigue[3] },
          { val: 4, text: 'Difficile', color: PALETTE.fatigue[4] },
          { val: 5, text: 'Épuisant (Échec)', color: PALETTE.fatigue[5] },
        ].map((f) => (
          <div key={f.val} className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-black font-bold text-xs"
              style={{ backgroundColor: f.color }}
            >
              {f.val}
            </div>
            <div className="text-xs text-foreground">{f.text}</div>
          </div>
        ))}
      </div>
    </div>
  </Modal>
);

// 4. EQUIPMENT INFO
export const EquipmentInfoModal: React.FC<ModalProps> = ({ onClose }) => {
  const CAT_COLORS: Record<string, string> = {
    'Lib. 2m.': PALETTE.accents.blue.primary,
    'Lib. 1m.': PALETTE.accents.red.primary,
    Machine: PALETTE.accents.orange.primary,
    Poulie: PALETTE.accents.purple.primary,
    PDC: PALETTE.accents.emerald.primary,
    Divers: PALETTE.accents.gray.primary,
  };

  const LEGEND_DETAILS = [
    { label: 'Lib. 2m.', desc: 'Barre, Barre EZ, Trap Bar', sub: 'Haute stabilité, charge maximale.' },
    { label: 'Lib. 1m.', desc: 'Haltères, Kettlebell', sub: 'Unilatéral, correction symétrie.' },
    { label: 'Machine', desc: 'Machines Guidées, Smith', sub: 'Isolation, sécurité, tension continue.' },
    { label: 'Poulie', desc: 'Câbles', sub: 'Tension constante, angles variés.' },
    { label: 'PDC', desc: 'Poids du corps, Lesté', sub: 'Contrôle corporel, gainage.' },
    { label: 'Divers', desc: 'Élastiques, Disques seuls', sub: 'Accessoires.' },
  ];

  return (
    <Modal title="Catégories Matériel" onClose={onClose}>
      <div className="space-y-4">
        <div className="text-sm text-secondary/80 leading-relaxed">
          La variété des outils de travail prévient les blessures d'usure et stimule différentes adaptations musculaires.
        </div>

        <div className="grid grid-cols-1 gap-2">
          {LEGEND_DETAILS.map((item, idx) => (
            <div key={idx} className="bg-surface2/30 p-3 rounded-xl flex items-start gap-3">
              <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: CAT_COLORS[item.label] }} />
              <div>
                <div className="font-black text-xs text-foreground uppercase">{item.label}</div>
                <div className="text-[10px] text-foreground/80 font-bold">{item.desc}</div>
                <div className="text-[9px] text-secondary mt-0.5 italic">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
