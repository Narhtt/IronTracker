import React, { useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Icons } from '../icons/Icons';
import { getExerciseStats } from '../../core/utils';
import { WorkoutSession, LibraryExercise, ExerciseInstance } from '../../core/types';

interface WarmupModalProps {
  exo: ExerciseInstance;
  libEx: LibraryExercise | undefined;
  history: WorkoutSession[];
  onClose: () => void;
  onGenerate: (count: number) => void;
}

export const WarmupModal: React.FC<WarmupModalProps> = ({ exo, libEx, history, onClose, onGenerate }) => {
  // Calcul de la charge cible (Basé sur historique ou saisie actuelle)
  const targetData = useMemo(() => {
    let weight = 0;
    let source = 'saisie';

    // 1. Priorité Historique (Plus fiable)
    if (libEx) {
      const stats = getExerciseStats(libEx.id, history, libEx.type);
      if (stats.lastBestSet) {
        weight = stats.lastBestSet.weight;
        source = 'historique';
      }
    }

    // 2. Fallback Saisie Actuelle
    if (weight === 0 && exo.sets.length > 0) {
      const lastSet = exo.sets[exo.sets.length - 1];
      if (lastSet.weight) {
        weight = parseFloat(lastSet.weight);
        source = 'saisie';
      }
    }

    return { weight, source };
  }, [exo, libEx, history]);

  // Calcul de la gamme
  const rampUp = useMemo(() => {
    if (!targetData.weight) return null;
    return [
      { pct: '50%', w: Math.round(targetData.weight * 0.5), r: 12, label: 'Déverrouillage' },
      { pct: '70%', w: Math.round(targetData.weight * 0.7), r: 8, label: 'Montée' },
      { pct: '90%', w: Math.round(targetData.weight * 0.9), r: 3, label: 'Potentiation' },
    ];
  }, [targetData.weight]);

  return (
    <Modal title="Assistant Échauffement" onClose={onClose}>
      <div className="space-y-6 animate-fade-in">
        {/* Header Information */}
        <div className="flex items-center gap-4 bg-surface2/30 p-4 rounded-xl border border-border">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold border border-gold/20 shadow-[0_0_15px_rgba(var(--warning),0.2)]">
            <Icons.Flame size={24} fill="currentColor" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-secondary tracking-widest">Cible détectée</div>
            <div className="text-2xl font-black text-foreground leading-none">
              {targetData.weight > 0 ? `${targetData.weight} kg` : '?'}
            </div>
            <div className="text-[9px] text-secondary/50 italic mt-0.5">
              {targetData.weight > 0
                ? targetData.source === 'historique'
                  ? 'Basé sur votre record'
                  : 'Basé sur la saisie actuelle'
                : 'Aucune donnée de référence'}
            </div>
          </div>
        </div>

        {/* Visual Ramp-up Grid */}
        {rampUp ? (
          <div className="space-y-2">
            <div className="text-[9px] font-black uppercase text-secondary/70 pl-1">Séquence Recommandée</div>
            <div className="grid grid-cols-3 gap-3">
              {rampUp.map((step, i) => (
                <div
                  key={i}
                  className="bg-surface2/50 rounded-xl p-3 flex flex-col items-center justify-center border border-border relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-[8px] font-bold text-secondary uppercase mb-1">{step.pct}</div>
                  <div className="text-xl font-black text-foreground">
                    {step.w}
                    <span className="text-[9px] font-normal text-secondary ml-0.5">kg</span>
                  </div>
                  <div className="text-[9px] font-bold text-primary uppercase mt-1 bg-primary/10 px-2 py-0.5 rounded-md">{step.r} reps</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-center">
            <div className="text-xs font-bold text-danger mb-1">Données manquantes</div>
            <div className="text-[10px] text-danger/70">Remplissez une série de travail (Poids) pour activer le calcul.</div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <div className="text-[9px] font-black uppercase text-secondary/70 pl-1">Insérer dans la séance</div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((count) => (
              <button
                key={count}
                onClick={() => onGenerate(count)}
                disabled={!rampUp}
                className={`p-4 rounded-xl flex flex-col items-center gap-1 transition-all active:scale-95 border ${!rampUp ? 'opacity-50 grayscale cursor-not-allowed bg-surface2' : 'bg-surface2 hover:bg-surface2/80 hover:border-border'}`}
              >
                <span className="text-xl font-black text-foreground">{count}</span>
                <span className="text-[8px] uppercase text-secondary font-bold">Série{count > 1 ? 's' : ''}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Educational Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 items-start">
          <div className="text-blue-500 mt-0.5">
            <Icons.Note size={16} />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase text-blue-500">Fonctionnement Warmup</div>
            <p className="text-[10px] text-blue-500/80 leading-relaxed">
              Les séries marquées <strong className="text-foreground">"W"</strong> (Warmup) sont exclues du calcul du Volume et des Records
              (1RM).
              <br />
              Elles servent uniquement à préparer le système nerveux.
              <br />
              Cliquez sur le numéro d'une série{' '}
              <span className="inline-block bg-surface2 border border-border/50 px-1.5 rounded text-foreground font-mono text-[9px] font-bold">
                #
              </span>{' '}
              pour changer son statut manuellement.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
