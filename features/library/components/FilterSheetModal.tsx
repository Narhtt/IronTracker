import React from 'react';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { Icons } from '../../../components/icons/Icons';
import { triggerHaptic } from '../../../core/utils';
import { MUSCLE_COLORS, TYPE_COLORS } from '../../../core/constants';
import { EQUIPMENTS } from '../../../core/data/equipments';
import { EXERCISE_TYPE_LIST } from '../../../core/data/exerciseTypes';

export type FilterSheetType = 'muscle' | 'type' | 'equip' | null;

interface FilterSheetModalProps {
  type: FilterSheetType;
  onClose: () => void;
  selectedMuscles: string[];
  selectedTypes: string[];
  selectedEquipments: string[];
  onToggleMuscle: (muscle: string) => void;
  onToggleType: (type: string) => void;
  onToggleEquipment: (equipment: string) => void;
  onResetCategory: (category: 'muscle' | 'type' | 'equip') => void;
  muscleOptions: string[];
}

export const FilterSheetModal: React.FC<FilterSheetModalProps> = ({
  type,
  onClose,
  selectedMuscles,
  selectedTypes,
  selectedEquipments,
  onToggleMuscle,
  onToggleType,
  onToggleEquipment,
  onResetCategory,
  muscleOptions,
}) => {
  if (!type) return null;

  const isMuscle = type === 'muscle';
  const isType = type === 'type';
  const isEquip = type === 'equip';

  const sheetTitle = isMuscle
    ? 'Filtrer par Groupe Musculaire'
    : isType
      ? "Filtrer par Type d'Exercice"
      : 'Filtrer par Équipement';

  const selectedCount = isMuscle
    ? selectedMuscles.length
    : isType
      ? selectedTypes.length
      : selectedEquipments.length;

  const subtitle =
    selectedCount > 0
      ? `${selectedCount} sélectionné${selectedCount > 1 ? 's' : ''} (choix multiple possible)`
      : 'Sélectionnez un ou plusieurs critères';

  return (
    <BottomSheet
      isOpen={Boolean(type)}
      onClose={onClose}
      title={sheetTitle}
      subtitle={subtitle}
    >
      <div className="space-y-4">
        {/* Actions Bar: Quick Clear Category */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <span className="text-xs text-secondary font-semibold">Options</span>
          {selectedCount > 0 && (
            <button
              onClick={() => {
                triggerHaptic('warning');
                onResetCategory(type);
              }}
              className="text-[11px] font-bold text-danger hover:underline flex items-center gap-1 active:scale-95 transition-all"
            >
              <Icons.Reset size={11} strokeWidth={2.5} />
              <span>Tout désélectionner</span>
            </button>
          )}
        </div>

        {/* Muscle Grid */}
        {isMuscle && (
          <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
            {muscleOptions.map((muscle) => {
              const isSelected = selectedMuscles.includes(muscle);
              const color = MUSCLE_COLORS[muscle] || '#10b981';

              return (
                <button
                  key={muscle}
                  onClick={() => {
                    triggerHaptic('click');
                    onToggleMuscle(muscle);
                  }}
                  className={`p-3 rounded-2xl flex items-center justify-between text-left border transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-surface2 text-foreground border-white/20 shadow-md ring-1 ring-white/10'
                      : 'bg-surface2/40 text-secondary hover:text-foreground border-transparent hover:border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-bold truncate">{muscle}</span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 ml-1">
                      <Icons.Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Type Grid */}
        {isType && (
          <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-1">
            {EXERCISE_TYPE_LIST.map((t) => {
              const isSelected = selectedTypes.includes(t);
              const color = TYPE_COLORS[t as keyof typeof TYPE_COLORS] || '#3b82f6';

              return (
                <button
                  key={t}
                  onClick={() => {
                    triggerHaptic('click');
                    onToggleType(t);
                  }}
                  className={`p-3.5 rounded-2xl flex items-center justify-between text-left border transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-surface2 text-foreground border-white/20 shadow-md ring-1 ring-white/10'
                      : 'bg-surface2/40 text-secondary hover:text-foreground border-transparent hover:border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <div className="text-xs font-bold text-foreground">{t}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                      <Icons.Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Equipment Grid */}
        {isEquip && (
          <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
            {Object.entries(EQUIPMENTS).map(([code, name]) => {
              const isSelected = selectedEquipments.includes(code);

              return (
                <button
                  key={code}
                  onClick={() => {
                    triggerHaptic('click');
                    onToggleEquipment(code);
                  }}
                  className={`p-3 rounded-2xl flex items-center justify-between text-left border transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-surface2 text-foreground border-white/20 shadow-md ring-1 ring-white/10'
                      : 'bg-surface2/40 text-secondary hover:text-foreground border-transparent hover:border-white/5'
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <div className="text-[10px] font-black uppercase text-secondary/60">{code}</div>
                    <div className="text-xs font-bold truncate text-foreground">{name}</div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                      <Icons.Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom Done Button */}
        <button
          onClick={() => {
            triggerHaptic('click');
            onClose();
          }}
          className="w-full py-3.5 bg-primary text-background font-black uppercase rounded-2xl active:scale-95 transition-all text-xs tracking-wider shadow-lg shadow-primary/20 mt-2"
        >
          Valider {selectedCount > 0 ? `(${selectedCount})` : ''}
        </button>
      </div>
    </BottomSheet>
  );
};
