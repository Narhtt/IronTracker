import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { LibraryExercise } from '../../core/types';
import { triggerHaptic } from '../../core/utils';
import { Icons } from '../../components/icons/Icons';
import { TYPE_COLORS } from '../../core/constants';
import { EQUIPMENTS } from '../../core/data/equipments';
import { Modal } from '../../components/ui/Modal';
import { useConfirm } from '../../hooks/useConfirm';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';
import { FilterSheetModal, FilterSheetType } from './components/FilterSheetModal';
import { VirtualList } from '../../components/ui/VirtualList';
import { EmptyState } from '../../components/ui/EmptyState';

const MUSCLE_ORDER = [
  'Pectoraux',
  'Dos',
  'Quadriceps',
  'Ischios',
  'Fessiers',
  'Jambes', // New + Legacy
  'Épaules',
  'Bras',
  'Avant-bras',
  'Abdos',
  'Mollets',
  'Cou',
  'Cardio',
];

export const LibraryView: React.FC = () => {
  const library = useStore((s) => s.library);
  const setLibrary = useStore((s) => s.setLibrary);
  const confirm = useConfirm();

  const [libraryFilter, setLibraryFilter] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Active Bottom Sheet
  const [activeSheet, setActiveSheet] = useState<FilterSheetType>(null);

  // States for Modals
  const [editingExercise, setEditingExercise] = useState<LibraryExercise | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);

  const onDeleteExercise = (id: number) => {
    confirm({
      title: 'ARCHIVER ?',
      message: 'Voulez-vous archiver cet exercice ?',
      subMessage: 'Il sera masqué de la liste mais conservé dans votre historique.',
      variant: 'danger',
      onConfirm: () => {
        setLibrary((prev) => prev.map((l) => (l.id === id ? { ...l, isArchived: true } : l)));
        triggerHaptic('success');
      },
    });
  };

  const onToggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('tick');
    setLibrary((prev) => prev.map((l) => (l.id === id ? { ...l, isFavorite: !l.isFavorite } : l)));
  };

  // --- Filter Toggle Logic ---
  const hasActiveFilters = Boolean(
    selectedMuscles.length > 0 ||
    selectedTypes.length > 0 ||
    selectedEquipments.length > 0 ||
    showFavoritesOnly ||
    libraryFilter
  );

  const resetAllFilters = () => {
    triggerHaptic('click');
    setSelectedMuscles([]);
    setSelectedTypes([]);
    setSelectedEquipments([]);
    setShowFavoritesOnly(false);
    setLibraryFilter('');
  };

  const toggleMuscleFilter = (muscle: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleEquipmentFilter = (equip: string) => {
    setSelectedEquipments((prev) =>
      prev.includes(equip) ? prev.filter((e) => e !== equip) : [...prev, equip]
    );
  };

  const resetFilterCategory = (category: 'muscle' | 'type' | 'equip') => {
    if (category === 'muscle') setSelectedMuscles([]);
    if (category === 'type') setSelectedTypes([]);
    if (category === 'equip') setSelectedEquipments([]);
  };

  const filteredLibrary = useMemo(() => {
    return library
      .filter((l) => {
        if (l.isArchived) return false;

        // Favorites filter
        if (showFavoritesOnly && !l.isFavorite) return false;

        // Text Search
        if (libraryFilter) {
          const searchLower = libraryFilter.toLowerCase();
          const matchName = l.name.toLowerCase().includes(searchLower);
          const matchMuscle = l.muscle.toLowerCase().includes(searchLower);
          if (!matchName && !matchMuscle) return false;
        }

        // Multi Type Filter
        if (selectedTypes.length > 0 && !selectedTypes.includes(l.type)) return false;

        // Multi Equip Filter
        if (selectedEquipments.length > 0 && !selectedEquipments.includes(l.equipment)) return false;

        // Multi Muscle Filter
        if (selectedMuscles.length > 0 && !selectedMuscles.includes(l.muscle)) return false;

        return true;
      })
      .sort((a, b) => (a.isFavorite === b.isFavorite ? a.name.localeCompare(b.name) : a.isFavorite ? -1 : 1));
  }, [library, libraryFilter, selectedTypes, selectedEquipments, selectedMuscles, showFavoritesOnly]);

  return (
    <div className="space-y-4 animate-fade-in pb-24 h-full flex flex-col">
      <div className="flex justify-between items-center px-1 gap-2 flex-shrink-0">
        <h2 className="text-2xl font-black italic uppercase truncate">Bibliothèque</h2>

        {/* Filter Pills Group */}
        <div className="flex items-center gap-1.5 flex-shrink-0 overflow-x-auto no-scrollbar">
          {/* Reset All Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              title="Réinitialiser tous les filtres"
              className="h-7 w-7 flex items-center justify-center rounded-full bg-danger/15 text-danger hover:bg-danger/25 border border-danger/30 transition-all active:scale-90 flex-shrink-0 animate-fade-in"
            >
              <Icons.Reset size={12} strokeWidth={2.5} />
            </button>
          )}

          {/* Muscle Filter Button */}
          <button
            onClick={() => {
              triggerHaptic('click');
              setActiveSheet('muscle');
            }}
            title="Ouvrir les filtres de muscles"
            className={`h-7 px-2.5 rounded-full text-[9px] font-black uppercase transition-all border whitespace-nowrap flex items-center gap-1 active:scale-95 ${
              selectedMuscles.length > 0
                ? 'bg-primary text-background border-primary shadow-[0_0_10px_rgba(var(--primary),0.4)] scale-105'
                : 'bg-surface2 text-secondary border-transparent hover:border-white/10'
            }`}
          >
            <span>
              {selectedMuscles.length === 0
                ? 'Musc.'
                : selectedMuscles.length === 1
                  ? selectedMuscles[0].substring(0, 4)
                  : `Musc. (${selectedMuscles.length})`}
            </span>
            <Icons.ChevronDown size={10} strokeWidth={3} className="opacity-70" />
          </button>

          {/* Type Filter Button */}
          <button
            onClick={() => {
              triggerHaptic('click');
              setActiveSheet('type');
            }}
            title="Ouvrir les filtres de types d'exercice"
            className={`h-7 px-2.5 rounded-full text-[9px] font-black uppercase transition-all border whitespace-nowrap flex items-center gap-1 active:scale-95 ${
              selectedTypes.length > 0
                ? 'bg-primary text-background border-primary shadow-[0_0_10px_rgba(var(--primary),0.4)] scale-105'
                : 'bg-surface2 text-secondary border-transparent hover:border-white/10'
            }`}
          >
            <span>
              {selectedTypes.length === 0
                ? 'Type'
                : selectedTypes.length === 1
                  ? selectedTypes[0].substring(0, 4)
                  : `Type (${selectedTypes.length})`}
            </span>
            <Icons.ChevronDown size={10} strokeWidth={3} className="opacity-70" />
          </button>

          {/* Equip Filter Button */}
          <button
            onClick={() => {
              triggerHaptic('click');
              setActiveSheet('equip');
            }}
            title="Ouvrir les filtres d'équipements"
            className={`h-7 px-2.5 rounded-full text-[9px] font-black uppercase transition-all border whitespace-nowrap flex items-center gap-1 active:scale-95 ${
              selectedEquipments.length > 0
                ? 'bg-primary text-background border-primary shadow-[0_0_10px_rgba(var(--primary),0.4)] scale-105'
                : 'bg-surface2 text-secondary border-transparent hover:border-white/10'
            }`}
          >
            <span>
              {selectedEquipments.length === 0
                ? 'Equip.'
                : selectedEquipments.length === 1
                  ? selectedEquipments[0]
                  : `Equip. (${selectedEquipments.length})`}
            </span>
            <Icons.ChevronDown size={10} strokeWidth={3} className="opacity-70" />
          </button>

          {/* Favorites Filter Toggle Button */}
          <button
            onClick={() => {
              triggerHaptic('tick');
              setShowFavoritesOnly(!showFavoritesOnly);
            }}
            title={showFavoritesOnly ? 'Afficher tous les exercices' : 'Afficher uniquement les favoris'}
            className={`h-7 px-2 rounded-full text-[9px] font-black uppercase transition-all border whitespace-nowrap flex items-center gap-1 active:scale-95 ${
              showFavoritesOnly
                ? 'bg-gold/20 text-gold border-gold/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                : 'bg-surface2 text-secondary border-transparent hover:border-white/10 hover:text-gold'
            }`}
          >
            <Icons.Star size={11} className={showFavoritesOnly ? 'text-gold fill-gold' : ''} />
          </button>

          {/* Count Pill */}
          <div className="h-7 px-2.5 flex items-center justify-center rounded-full bg-surface2 text-secondary text-[9px] font-bold border border-white/5">
            {filteredLibrary.length}
          </div>
        </div>
      </div>

      <div className="space-y-2 flex-shrink-0">
        <button
          onClick={() => {
            triggerHaptic('click');
            setEditingExercise({ id: 0, name: '', type: 'Isolation', muscle: 'Pectoraux', equipment: 'BB' });
          }}
          className="w-full py-4 bg-primary text-background font-black uppercase rounded-[2rem] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-primary/20"
        >
          <Icons.Plus size={18} strokeWidth={3} />
          <span>Nouveau</span>
        </button>

        <div className="bg-surface2 p-2 rounded-2xl flex items-center gap-2 border border-transparent focus-within:border-primary/50 transition-colors">
          <span className="text-secondary pl-2">
            <Icons.Search size={16} />
          </span>
          <input
            className="bg-transparent w-full p-2 outline-none font-bold text-sm placeholder-secondary/50"
            placeholder="Rechercher (nom, muscle...)"
            value={libraryFilter}
            onChange={(e) => setLibraryFilter(e.target.value)}
          />
          {libraryFilter && (
            <button onClick={() => setLibraryFilter('')} className="p-2 text-secondary hover:text-white">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* VIRTUALIZED LIST CONTAINER */}
      <div className="flex-1 min-h-0 border-t border-transparent">
        <VirtualList<LibraryExercise>
          items={filteredLibrary}
          itemHeight={72}
          gap={8}
          emptyMessage={
            <div className="flex flex-col items-center justify-center p-4">
              <EmptyState
                icon={<Icons.Dumbbell />}
                title="Aucun exercice"
                subtitle={
                  hasActiveFilters
                    ? 'Aucun résultat correspondant aux critères de recherche et filtres.'
                    : 'La bibliothèque est vide.'
                }
              />
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="mt-3 px-4 py-2 bg-surface2 hover:bg-surface2/80 text-primary rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/5 active:scale-95 transition-all shadow-sm"
                >
                  <Icons.Reset size={14} />
                  <span>Réinitialiser les filtres</span>
                </button>
              )}
            </div>
          }
          renderItem={(l) => (
            <div
              className="bg-surface border border-transparent hover:border-border p-3 rounded-2xl flex justify-between items-center group cursor-pointer transition-all active:scale-95 h-full"
              onClick={() => {
                triggerHaptic('click');
                setSelectedDetailId(l.id);
              }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  onClick={(e) => onToggleFavorite(l.id, e)}
                  className={`text-lg transition-transform hover:scale-110 flex-shrink-0 ${l.isFavorite ? 'text-gold' : 'text-secondary/20'}`}
                >
                  {l.isFavorite ? <Icons.Star /> : <Icons.StarOutline />}
                </button>
                <div className="min-w-0">
                  <div className="font-bold text-sm leading-tight truncate">{l.name}</div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-surface2 text-secondary whitespace-nowrap">
                      {l.muscle}
                    </span>
                    <span
                      className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-surface2 whitespace-nowrap"
                      style={{ color: TYPE_COLORS[l.type] }}
                    >
                      {l.type}
                    </span>
                    {/* Badge Équipement discret si filtre actif pour confirmer visuellement */}
                    {selectedEquipments.length > 0 && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-surface2 text-white/50">{l.equipment}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 flex-shrink-0 pl-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteExercise(l.id);
                  }}
                  className="p-2 text-danger/50 hover:text-danger bg-danger/10 rounded-lg"
                >
                  <Icons.Trash size={16} />
                </button>
              </div>
            </div>
          )}
        />
      </div>

      {/* DETAIL MODAL (Consultation) */}
      {selectedDetailId !== null && (
        <ExerciseDetailModal
          exerciseId={selectedDetailId}
          onClose={() => setSelectedDetailId(null)}
          onEdit={() => {
            const exo = library.find((l) => l.id === selectedDetailId);
            if (exo) {
              // MOBILE FIX: Race condition on History API
              // Close first modal
              setSelectedDetailId(null);
              // Wait for unmount/history.back() to settle before opening new modal
              setTimeout(() => {
                setEditingExercise(exo);
              }, 100);
            }
          }}
        />
      )}

      {/* EDIT MODAL (Modification) */}
      {editingExercise && (
        <Modal title={editingExercise.id ? 'Modifier' : 'Créer'} onClose={() => setEditingExercise(null)}>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-secondary">Nom</label>
              <input
                value={editingExercise.name}
                onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
                className="w-full bg-surface2 p-3 rounded-xl outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-secondary">Type</label>
                <select
                  value={editingExercise.type}
                  onChange={(e) => setEditingExercise({ ...editingExercise, type: e.target.value as ExerciseType })}
                  className="w-full bg-surface2 p-3 rounded-xl outline-none"
                >
                  {EXERCISE_TYPE_LIST.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-secondary">Muscle</label>
                <select
                  value={editingExercise.muscle}
                  onChange={(e) => setEditingExercise({ ...editingExercise, muscle: e.target.value })}
                  className="w-full bg-surface2 p-3 rounded-xl outline-none"
                >
                  {MUSCLE_ORDER.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-secondary">Équipement</label>
              <select
                value={editingExercise.equipment}
                onChange={(e) => setEditingExercise({ ...editingExercise, equipment: e.target.value })}
                className="w-full bg-surface2 p-3 rounded-xl outline-none"
              >
                {Object.entries(EQUIPMENTS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 pt-2 border-t border-border/50">
              <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Conseils Techniques</label>
              <div className="space-y-2">
                <textarea
                  placeholder="Setup (1 par ligne)"
                  rows={2}
                  className="w-full bg-surface2 p-3 rounded-xl text-xs outline-none"
                  value={editingExercise.tips?.setup?.join('\n') || ''}
                  onChange={(e) =>
                    setEditingExercise({ ...editingExercise, tips: { ...editingExercise.tips, setup: e.target.value.split('\n') } })
                  }
                />
                <textarea
                  placeholder="Exécution (1 par ligne)"
                  rows={2}
                  className="w-full bg-surface2 p-3 rounded-xl text-xs outline-none"
                  value={editingExercise.tips?.exec?.join('\n') || ''}
                  onChange={(e) =>
                    setEditingExercise({ ...editingExercise, tips: { ...editingExercise.tips, exec: e.target.value.split('\n') } })
                  }
                />
                <textarea
                  placeholder="Erreurs (1 par ligne)"
                  rows={2}
                  className="w-full bg-surface2 p-3 rounded-xl text-xs outline-none"
                  value={editingExercise.tips?.mistake?.join('\n') || ''}
                  onChange={(e) =>
                    setEditingExercise({ ...editingExercise, tips: { ...editingExercise.tips, mistake: e.target.value.split('\n') } })
                  }
                />
              </div>
            </div>
            <button
              onClick={() => {
                if (!editingExercise.name) return;
                if (editingExercise.id) {
                  setLibrary((prev) => prev.map((l) => (l.id === editingExercise.id ? editingExercise : l)));
                } else {
                  const maxId = library.reduce((max, l) => Math.max(max, l.id), 0);
                  setLibrary((prev) => [...prev, { ...editingExercise, id: maxId + 1 }]);
                }
                setEditingExercise(null);
              }}
              className="w-full py-3 bg-primary text-background font-black uppercase rounded-[2rem]"
            >
              Sauvegarder
            </button>
          </div>
        </Modal>
      )}
      {/* Filter Bottom Sheet Modal */}
      <FilterSheetModal
        type={activeSheet}
        onClose={() => setActiveSheet(null)}
        selectedMuscles={selectedMuscles}
        selectedTypes={selectedTypes}
        selectedEquipments={selectedEquipments}
        onToggleMuscle={toggleMuscleFilter}
        onToggleType={toggleTypeFilter}
        onToggleEquipment={toggleEquipmentFilter}
        onResetCategory={resetFilterCategory}
        muscleOptions={MUSCLE_ORDER}
      />
    </div>
  );
};
