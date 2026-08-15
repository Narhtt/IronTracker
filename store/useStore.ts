import { create } from 'zustand';
import { WorkoutSession, LibraryExercise, Program, AccentColor, ConfirmationOptions, DashboardStats, OneRMFormula, WeightUnit, SnapshotReason, BodyMeasurement } from '../core/types';
import { storage } from '../services/storage';
import { indexer } from '../services/indexer';
import { DEFAULT_LIBRARY } from '../core/data/exerciseLibrary';
import { DEFAULT_PROGRAMS } from '../core/data/programs';
import { STORAGE_KEYS } from '../core/constants';
import { CURRENT_SCHEMA_VERSION } from '../core/migrations';

type SetStateAction<S> = S | ((prevState: S) => S);

function resolveAction<S>(action: SetStateAction<S>, prevState: S): S {
  return typeof action === 'function' ? (action as (prevState: S) => S)(prevState) : action;
}

export interface Toast {
  id: string;
  type: 'error' | 'success' | 'info';
  message: string;
}

interface StoreState {
  history: WorkoutSession[];
  library: LibraryExercise[];
  programs: Program[];
  session: WorkoutSession | null;
  measurements: BodyMeasurement[];
  accentColor: AccentColor;
  themeMode: 'light' | 'dark';
  weightUnit: WeightUnit;
  isLoaded: boolean;
  restTarget: number | null;
  barWeight: number;
  availablePlates: number[];
  formula1RM: OneRMFormula;

  // Computed Data (Cached)
  dashboardStats: DashboardStats | null;

  // Global Confirmation State
  confirmation: ConfirmationOptions | null;

  // Global Toasts (non-blocking notifications, e.g. save failures)
  toasts: Toast[];
  pushToast: (type: Toast['type'], message: string) => void;
  dismissToast: (id: string) => void;

  setHistory: (action: SetStateAction<WorkoutSession[]>) => void;
  setLibrary: (action: SetStateAction<LibraryExercise[]>) => void;
  setPrograms: (action: SetStateAction<Program[]>) => void;
  setSession: (action: SetStateAction<WorkoutSession | null>) => void;
  setMeasurements: (action: SetStateAction<BodyMeasurement[]>) => void;
  addMeasurement: (measurement: Omit<BodyMeasurement, 'id'>) => void;
  updateMeasurement: (measurement: BodyMeasurement) => void;
  deleteMeasurement: (id: string) => void;
  setAccentColor: (action: SetStateAction<AccentColor>) => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  setWeightUnit: (unit: WeightUnit) => void;
  setIsLoaded: (isLoaded: boolean) => void;
  setRestTarget: (action: SetStateAction<number | null>) => void;
  setBarWeight: (weight: number) => void;
  setAvailablePlates: (plates: number[]) => void;
  setFormula1RM: (formula: OneRMFormula) => void;

  // Snapshot Actions
  createSnapshot: (reason: SnapshotReason, label: string) => void;

  // Confirmation Actions
  requestConfirmation: (options: ConfirmationOptions) => void;
  closeConfirmation: () => void;

  initData: () => void;
  resetData: () => void;
  restoreBackup: (data: { history: WorkoutSession[]; library: LibraryExercise[]; programs: Program[] }) => void;

  // Helper to force re-indexing (internal use mainly)
  reindexDashboard: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  history: [],
  library: [],
  programs: [],
  session: null,
  measurements: [],
  accentColor: 'blue',
  themeMode: 'dark',
  weightUnit: 'kg',
  isLoaded: false,
  restTarget: null,
  barWeight: 20,
  availablePlates: [20, 10, 5, 2.5, 1.25],
  formula1RM: 'wathen',
  dashboardStats: null,
  confirmation: null,
  toasts: [],

  pushToast: (type, message) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setHistory: (action) => {
    set((state) => {
      const newHistory = resolveAction(action, state.history);
      // Re-index stats immediately when history changes
      const newStats = indexer.calculateDashboardStats(newHistory, state.library);
      return { history: newHistory, dashboardStats: newStats };
    });
  },

  setLibrary: (action) => set((state) => ({ library: resolveAction(action, state.library) })),
  setPrograms: (action) => set((state) => ({ programs: resolveAction(action, state.programs) })),
  setSession: (action) => set((state) => ({ session: resolveAction(action, state.session) })),
  setMeasurements: (action) => {
    set((state) => {
      const updated = resolveAction(action, state.measurements);
      storage.measurements.save(updated);
      return { measurements: updated };
    });
  },
  addMeasurement: (measurement) => {
    const newEntry: BodyMeasurement = {
      id: crypto.randomUUID(),
      ...measurement,
    };
    set((state) => {
      const prev = state.measurements || [];
      // Sort newest first
      const updated = [newEntry, ...prev.filter((m) => m.date !== newEntry.date)].sort(
        (a, b) => b.timestamp - a.timestamp
      );
      storage.measurements.save(updated);
      return { measurements: updated };
    });
  },
  updateMeasurement: (measurement) => {
    set((state) => {
      const prev = state.measurements || [];
      const updated = prev
        .map((m) => (m.id === measurement.id ? measurement : m))
        .sort((a, b) => b.timestamp - a.timestamp);
      storage.measurements.save(updated);
      return { measurements: updated };
    });
  },
  deleteMeasurement: (id) => {
    set((state) => {
      const prev = state.measurements || [];
      const updated = prev.filter((m) => m.id !== id);
      storage.measurements.save(updated);
      return { measurements: updated };
    });
  },
  setAccentColor: (action) => set((state) => ({ accentColor: resolveAction(action, state.accentColor) })),
  setThemeMode: (mode) => {
    set({ themeMode: mode });
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  },
  setWeightUnit: (unit) => {
    const current = get().weightUnit;
    if (current === unit) return;
    
    // Smart adaptation of bar and plate defaults when switching unit
    let newBar = get().barWeight;
    let newPlates = get().availablePlates;
    if (unit === 'lbs' && current === 'kg') {
      if (newBar === 20) newBar = 45;
      newPlates = [45, 35, 25, 10, 5, 2.5];
    } else if (unit === 'kg' && current === 'lbs') {
      if (newBar === 45) newBar = 20;
      newPlates = [20, 10, 5, 2.5, 1.25];
    }

    set({ weightUnit: unit, barWeight: newBar, availablePlates: newPlates });
    localStorage.setItem(STORAGE_KEYS.WEIGHT_UNIT, unit);
    localStorage.setItem(STORAGE_KEYS.BAR_WEIGHT, String(newBar));
    localStorage.setItem(STORAGE_KEYS.AVAILABLE_PLATES, JSON.stringify(newPlates));
  },
  setIsLoaded: (isLoaded) => set({ isLoaded }),
  setRestTarget: (action) => set((state) => ({ restTarget: resolveAction(action, state.restTarget) })),
  setBarWeight: (weight) => {
    set({ barWeight: weight });
    localStorage.setItem(STORAGE_KEYS.BAR_WEIGHT, String(weight));
  },
  setAvailablePlates: (plates) => {
    set({ availablePlates: plates });
    localStorage.setItem(STORAGE_KEYS.AVAILABLE_PLATES, JSON.stringify(plates));
  },
  setFormula1RM: (formula) => {
    set({ formula1RM: formula });
    localStorage.setItem(STORAGE_KEYS.FORMULA_1RM, formula);
  },

  createSnapshot: (reason, label) => {
    const { history, library, programs } = get();
    storage.snapshots.saveSnapshot(reason, label, { history, library, programs });
  },

  requestConfirmation: (options) => set({ confirmation: options }),
  closeConfirmation: () => set({ confirmation: null }),

  reindexDashboard: () => {
    const state = get();
    const stats = indexer.calculateDashboardStats(state.history, state.library);
    set({ dashboardStats: stats });
  },

  initData: () => {
    let loadedLib = storage.library.load();
    let loadedProgs = storage.programs.load();
    const loadedHist = storage.history.load();
    const loadedSess = storage.session.load();
    const t = storage.theme.load() as AccentColor;
    const m = (localStorage.getItem(STORAGE_KEYS.THEME_MODE) as 'light' | 'dark') || 'dark';
    const u = (localStorage.getItem(STORAGE_KEYS.WEIGHT_UNIT) as WeightUnit) || 'kg';
    const bwStr = localStorage.getItem(STORAGE_KEYS.BAR_WEIGHT);
    const apStr = localStorage.getItem(STORAGE_KEYS.AVAILABLE_PLATES);
    
    let bw = u === 'lbs' ? 45 : 20;
    if (bwStr && !isNaN(parseFloat(bwStr))) {
      bw = parseFloat(bwStr);
    }
    
    let ap = u === 'lbs' ? [45, 35, 25, 10, 5, 2.5] : [20, 10, 5, 2.5, 1.25];
    if (apStr) {
      try {
        const parsed = JSON.parse(apStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          ap = parsed;
        }
      } catch {
        // Fallback to default
      }
    }
    
    const fStr = localStorage.getItem(STORAGE_KEYS.FORMULA_1RM) as OneRMFormula;
    const formula = fStr || 'wathen';

    let loadedMeasurements = storage.measurements.load();
    if (loadedMeasurements.length === 0 && loadedHist.length > 0) {
      // Auto-migration: create measurement entries from past sessions with bodyWeight
      const map = new Map<string, BodyMeasurement>();
      loadedHist.forEach((s) => {
        const val = parseFloat(s.bodyWeight);
        if (!isNaN(val) && val > 0) {
          const dStr = new Date(s.startTime).toISOString().split('T')[0];
          if (!map.has(dStr)) {
            map.set(dStr, {
              id: crypto.randomUUID(),
              date: dStr,
              timestamp: s.startTime,
              weight: val,
            });
          }
        }
      });
      if (map.size > 0) {
        loadedMeasurements = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
        storage.measurements.save(loadedMeasurements);
      }
    }

    if (loadedLib.length === 0) loadedLib = DEFAULT_LIBRARY;
    if (loadedProgs.length === 0) loadedProgs = DEFAULT_PROGRAMS;

    // Schema versioning: stamp the current version once data has been loaded
    // (and migrated, if a future version adds migration steps).
    localStorage.setItem(STORAGE_KEYS.SCHEMA, String(CURRENT_SCHEMA_VERSION));

    // Initial Indexing
    const initialStats = indexer.calculateDashboardStats(loadedHist, loadedLib);

    set({
      library: loadedLib,
      programs: loadedProgs,
      history: loadedHist,
      session: loadedSess,
      measurements: loadedMeasurements,
      accentColor: t || 'blue',
      themeMode: m,
      weightUnit: u,
      barWeight: bw,
      availablePlates: ap,
      formula1RM: formula,
      dashboardStats: initialStats,
      isLoaded: true,
    });
  },

  resetData: () => {
    // Snapshot before reset for safety!
    const { history, library, programs } = get();
    storage.snapshots.saveSnapshot('before_reset', 'Point de sécurité avant réinitialisation', { history, library, programs });

    set({ isLoaded: false });
    localStorage.clear();

    storage.library.save(DEFAULT_LIBRARY);
    storage.programs.save(DEFAULT_PROGRAMS);

    get().initData();
  },

  restoreBackup: ({ history, library, programs }) => {
    // Snapshot before restore for safety!
    const current = get();
    storage.snapshots.saveSnapshot('before_restore', 'Point de sécurité avant restauration', {
      history: current.history,
      library: current.library,
      programs: current.programs,
    });

    const newStats = indexer.calculateDashboardStats(history, library);
    set({ history, library, programs, dashboardStats: newStats });
    storage.history.save(history);
    storage.library.save(library);
    storage.programs.save(programs);
  },
}));
