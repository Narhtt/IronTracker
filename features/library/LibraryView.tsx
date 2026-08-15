import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { LibraryExercise, ExerciseType } from '../../core/types';
import { triggerHaptic } from '../../core/utils';
import { Icons } from '../../components/icons/Icons';
import { TYPE_COLORS } from '../../core/constants';
import { EQUIPMENTS } from '../../core/data/equipments';
import { EXERCISE_TYPE_LIST } from '../../core/data/exerciseTypes';
import { Modal } from '../../components/ui/Modal';
import { useConfirm } from '../../hooks/useConfirm';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';
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

// Configuration des cycles de filtres
const MUSCLE_FILTERS = [null, ...MUSCLE_ORDER];

const TYPE_FILTERS = [null, ...EXERCISE_TYPE_LIST];
const TYPE_LABELS: Record<string, string> = {
  Polyarticulaire: 'Poly.',
  Isolation: 'Isol.',
  Statique: 'Stat.',
  Cardio: 'Card.',
  Étirement: 'Etir.',
};

// Ordre optimisé pour les équipements les plus courants
const EQUIP_FILTERS = [
  null,
  'BW',
  'BB',
  'DB',
  'CB',
  'EM', // Top 5
  'SM',
  'EZ',
  'KB',
  'RB',
  'PL',
  'TB',
  'OT', // Reste
];

export const LibraryView: React.FC = () => {
  const library = useStore((s) => s.library);
  const setLibrary = useStore((s) => s.setLibrary);
  const confirm = useConfirm();

  const [libraryFilter, setLibraryFilter] = useState('');
  const [typeFilterIdx, setTypeFilterIdx] = useState(0);
  const [equipFilterIdx, setEquipFilterIdx] = useState(0);
  const [muscleFilterIdx, setMuscleFilterIdx] = useState(0);

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

  // --- Filter Logic ---
  const activeType = TYPE_FILTERS[typeFilterIdx];
  const activeEquip = EQUIP_FILTERS[equipFilterIdx];
  const activeMuscle = MUSCLE_FILTERS[muscleFilterIdx];

  const cycleType = () => {
    triggerHaptic('click');
    setTypeFilterIdx((prev) => (prev + 1) % TYPE_FILTERS.length);
  };

  const cycleEquip = () => {
    triggerHaptic('click');
    setEquipFilterIdx((prev) => (prev + 1) % EQUIP_FILTERS.length);
  };

  const cycleMuscle = () => {
    triggerHaptic('click');
    setMuscleFilterIdx((prev) => (prev + 1) % MUSCLE_FILTERS.length);
  };

  // Reset rapide au clic long
  const resetFilter = (setter: React.Dispatch<React.SetStateAction<number>>) => (e: React.MouseEvent) => {
    e.preventDefault();
    triggerHaptic('warning');
    setter(0);
  };

  const filteredLibrary = useMemo(() => {
    return library
      .filter((l) => {
        if (l.isArchived) return false;

        // Text Search
        if (libraryFilter) {
          const searchLower = libraryFilter.toLowerCase();
          const matchName = l.name.toLowerCase().includes(searchLower);
          const matchMuscle = l.muscle.toLowerCase().includes(searchLower);
          if (!matchName && !matchMuscle) return false;
        }

        // Type Filter
        if (activeType && l.type !== activeType) return false;

        // Equip Filter
        if (activeEquip && l.equipment !== activeEquip) return false;

        // Muscle Filter
        if (activeMuscle && l.muscle !== activeMuscle) return false;

        return true;
      })
      .sort((a, b) => (a.isFavorite === b.isFavorite ? a.name.localeCompare(b.name) : a.isFavorite ? -1 : 1));
  }, [library, libraryFilter, activeType, activeEquip, activeMuscle]);

  return (
    <div className="space-y-4 animate-fade-in pb-24 h-full flex flex-col">
      <div className="flex justify-between items-center px-1 gap-2 flex-shrink-0">
        <h2 className="text-2xl font-black italic uppercase truncate">Bibliothèque</h2>

        {/* Filter Pills Group */}
        <div className="flex items-center gap-1.5 flex-shrink-0 overflow-x-auto no-scrollbar">
          {/* Muscle Filter */}
          <button
            onClick={cycleMuscle}
            onContextMenu={resetFilter(setMuscleFilterIdx)}
            className={`h-7 px-2.5 rounded-full text-[9px] font-black uppercase transition-all border border-transparent whitespace-nowrap ${activeMuscle ? 'bg-primary text-background shadow-[0_0_10px_rgba(var(--primary),0.4)] scale-105' : 'bg-surface2 text-secondary hover:border-white/10'}`}
          >
            {activeMuscle ? activeMuscle.substring(0, 4) : 'Musc.'}
          </button>

          {/* Type Filter */}
          <button
            onClick={cycleType}
            onContextMenu={resetFilter(setTypeFilterIdx)}
            className={`h-7 px-2.5 rounded-full text-[9px] font-black uppercase transition-all border border-transparent whitespace-nowrap ${activeType ? 'bg-primary text-background shadow-[0_0_10px_rgba(var(--primary),0.4)] scale-105' : 'bg-surface2 text-secondary hover:border-white/10'}`}
          >
            {activeType && typeof activeType === 'string' ? TYPE_LABELS[activeType] : 'Type'}
          </button>

          {/* Equip Filter */}
          <button
            onClick={cycleEquip}
            onContextMenu={resetFilter(setEquipFilterIdx)}
            className={`h-7 px-2.5 rounded-full text-[9px] font-black uppercase transition-all border border-transparent whitespace-nowrap ${activeEquip ? 'bg-primary text-background shadow-[0_0_10px_rgba(var(--primary),0.4)] scale-105' : 'bg-surface2 text-secondary hover:border-white/10'}`}
          >
            {activeEquip ? activeEquip : 'Equip.'}
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
            <EmptyState
              icon={<Icons.Dumbbell />}
              title="Aucun exercice"
              subtitle={
                libraryFilter || activeType || activeEquip || activeMuscle
                  ? 'Aucun résultat pour ces filtres.'
                  : 'La bibliothèque est vide.'
              }
            />
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
                    {activeEquip && (
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
    </div>
  );
};
