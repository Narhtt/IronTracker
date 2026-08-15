import { LibraryExercise, Program, WorkoutSession, ExerciseInstance, SetRecord, ProgramSession, AutoSnapshot, SnapshotReason, BodyMeasurement } from '../core/types';
import {
  MinifiedLibraryItem,
  MinifiedProgram,
  MinifiedSession,
  MinifiedSet,
  MinifiedExoInstance,
  TYPE_MAP,
  REVERSE_TYPE_MAP,
  MUSCLE_MAP,
  REVERSE_MUSCLE_MAP,
  MinifiedProgramSession,
} from '../core/data/mappings';
import { STORAGE_KEYS } from '../core/constants';
import { CURRENT_SCHEMA_VERSION } from '../core/migrations';
import LZString from 'lz-string';

interface MinifiedSnapshot {
  id: string;
  ts: number;
  r: SnapshotReason;
  lbl: string;
  d: {
    v: number;
    h: MinifiedSession[];
    l: MinifiedLibraryItem[];
    p: MinifiedProgram[];
  };
}

// --- HELPERS DEHYDRATION (App -> Minified) ---

const dehydrateSet = (s: SetRecord): MinifiedSet => {
  const min: MinifiedSet = {
    w: s.weight,
    r: s.reps,
    d: s.done ? 1 : 0,
  };
  if (s.rir) min.ri = s.rir;
  if (s.notes) min.n = s.notes;
  if (s.completedAt) min.ca = s.completedAt;
  if (s.isWarmup) min.wu = 1;
  return min;
};

const dehydrateExoInstance = (e: ExerciseInstance): MinifiedExoInstance => {
  const min: MinifiedExoInstance = {
    e: e.exerciseId,
    t: e.target,
    r: e.rest,
    s: e.sets.map(dehydrateSet),
  };
  if (e.isBonus) min.b = 1;
  if (e.notes) min.n = e.notes;
  if (e.targetRir) min.tr = e.targetRir;
  return min;
};

const dehydrateSession = (s: WorkoutSession): MinifiedSession => {
  const min: MinifiedSession = {
    i: s.id,
    pn: s.programName,
    sn: s.sessionName,
    dt: s.startTime,
    e: s.exercises.map(dehydrateExoInstance),
  };
  if (s.endTime) min.ed = s.endTime;
  if (s.bodyWeight) min.bw = s.bodyWeight;
  if (s.fatigue) min.f = s.fatigue;
  return min;
};

const dehydrateLibraryItem = (l: LibraryExercise): MinifiedLibraryItem => {
  const min: MinifiedLibraryItem = {
    i: l.id,
    n: l.name,
    t: TYPE_MAP[l.type] || 'I',
    m: MUSCLE_MAP[l.muscle] || 'OT',
    eq: l.equipment,
  };
  if (l.isFavorite) min.f = 1;
  if (l.isArchived) min.ia = 1;
  if (l.tips) {
    min.tp = {};
    if (l.tips.setup && l.tips.setup.length) min.tp.s = l.tips.setup;
    if (l.tips.exec && l.tips.exec.length) min.tp.e = l.tips.exec;
    if (l.tips.mistake && l.tips.mistake.length) min.tp.m = l.tips.mistake;
    if (Object.keys(min.tp).length === 0) delete min.tp;
  }
  return min;
};

const dehydrateProgram = (p: Program): MinifiedProgram => {
  return {
    i: p.id,
    n: p.name,
    s: p.sessions.map((s) => ({
      i: s.id,
      n: s.name,
      e: s.exos.map((e) => {
        const exMin: MinifiedProgramSession['e'][number] = {
          e: e.exerciseId,
          s: e.sets,
          r: e.reps,
          rt: e.rest,
        };
        if (e.targetRir) exMin.tr = e.targetRir;
        return exMin;
      }),
    })),
  };
};

// --- HELPERS HYDRATION (Minified -> App) ---

const hydrateSet = (ms: MinifiedSet): SetRecord => {
  return {
    weight: String(ms.w),
    reps: String(ms.r),
    rir: ms.ri,
    done: ms.d === 1,
    notes: ms.n,
    completedAt: ms.ca,
    isWarmup: ms.wu === 1,
  };
};

const hydrateExoInstance = (me: MinifiedExoInstance): ExerciseInstance => {
  return {
    exerciseId: me.e,
    target: me.t,
    rest: me.r,
    isBonus: me.b === 1,
    notes: me.n || '',
    sets: (me.s || []).map(hydrateSet),
    targetRir: me.tr,
  };
};

const hydrateSession = (ms: MinifiedSession): WorkoutSession => {
  return {
    // String(...) tolerates legacy numeric ids saved before sessions used crypto.randomUUID()
    id: String(ms.i),
    programName: ms.pn,
    sessionName: ms.sn,
    startTime: ms.dt,
    endTime: ms.ed,
    bodyWeight: ms.bw || '',
    fatigue: ms.f || '3',
    exercises: (ms.e || []).map(hydrateExoInstance),
  };
};

const hydrateLibraryItem = (ml: MinifiedLibraryItem): LibraryExercise => {
  const lib: LibraryExercise = {
    id: ml.i,
    name: ml.n,
    type: REVERSE_TYPE_MAP[ml.t] || 'Isolation',
    muscle: REVERSE_MUSCLE_MAP[ml.m] || ml.m,
    equipment: ml.eq,
  };
  if (ml.f === 1) lib.isFavorite = true;
  if (ml.ia === 1) lib.isArchived = true;
  if (ml.tp) {
    lib.tips = {
      setup: ml.tp.s,
      exec: ml.tp.e,
      mistake: ml.tp.m,
    };
  }
  return lib;
};

const hydrateProgram = (mp: MinifiedProgram): Program => {
  return {
    id: mp.i,
    name: mp.n,
    sessions: (mp.s || []).map((ms: MinifiedProgramSession): ProgramSession => ({
      id: ms.i,
      name: ms.n,
      exos: (ms.e || []).map((me) => ({
        exerciseId: me.e,
        sets: me.s,
        reps: me.r,
        rest: me.rt,
        targetRir: me.tr,
      })),
    })),
  };
};

// --- COMPRESSION HELPERS ---

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unknown'; error: unknown };

const isQuotaExceeded = (e: unknown): boolean => {
  if (!(e instanceof DOMException)) return false;
  // QUOTA_EXCEEDED_ERR historically had code 22; Firefox also uses name 'NS_ERROR_DOM_QUOTA_REACHED'
  return e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22;
};

const saveCompressed = (key: string, data: unknown): SaveResult => {
  try {
    const jsonStr = JSON.stringify(data);
    const compressed = LZString.compressToUTF16(jsonStr);
    localStorage.setItem(key, compressed);
    return { ok: true };
  } catch (e) {
    console.error(`Error saving ${key}`, e);
    return { ok: false, reason: isQuotaExceeded(e) ? 'quota' : 'unknown', error: e };
  }
};

const loadCompressed = (key: string): unknown => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    // Tenter de décompresser
    const jsonStr = LZString.decompressFromUTF16(raw);

    // Si null, cela signifie peut-être que c'est une ancienne donnée non compressée
    if (!jsonStr) {
      // Tentative de parsing direct (Migration)
      try {
        const legacy = JSON.parse(raw);
        // Si ça marche, on en profite pour sauvegarder en compressé pour la prochaine fois
        saveCompressed(key, legacy);
        return legacy;
      } catch {
        // Si ce n'est ni compressé valide, ni JSON valide, c'est corrompu
        return null;
      }
    }

    return JSON.parse(jsonStr);
  } catch (e) {
    console.error(`Error loading ${key}`, e);
    return null;
  }
};

// Defensive wrapper around a hydrate step: a single corrupted entry (or an
// entirely wrong shape from a future/incompatible app version) must not
// crash the whole app at render time - it should fall back to an empty
// list instead, so the app stays usable.
function safeHydrateArray<TMin, TApp>(key: string, hydrate: (m: TMin) => TApp): TApp[] {
  const data = loadCompressed(key);
  if (!Array.isArray(data)) return [];
  try {
    return data.map((item) => hydrate(item as TMin));
  } catch (e) {
    console.error(`Corrupted data for ${key}, ignoring`, e);
    return [];
  }
}

// --- SERVICE EXPORT ---

export const storage = {
  library: {
    load: (): LibraryExercise[] => safeHydrateArray(STORAGE_KEYS.LIB, hydrateLibraryItem),
    save: (data: LibraryExercise[]): SaveResult => {
      const minified = data.map(dehydrateLibraryItem);
      return saveCompressed(STORAGE_KEYS.LIB, minified);
    },
  },
  programs: {
    load: (): Program[] => safeHydrateArray(STORAGE_KEYS.PROGS, hydrateProgram),
    save: (data: Program[]): SaveResult => {
      const minified = data.map(dehydrateProgram);
      return saveCompressed(STORAGE_KEYS.PROGS, minified);
    },
  },
  history: {
    load: (): WorkoutSession[] => safeHydrateArray(STORAGE_KEYS.HIST, hydrateSession),
    save: (data: WorkoutSession[]): SaveResult => {
      const minified = data.map(dehydrateSession);
      return saveCompressed(STORAGE_KEYS.HIST, minified);
    },
  },
  session: {
    load: (): WorkoutSession | null => {
      const data = loadCompressed(STORAGE_KEYS.SESS);
      if (!data) return null;
      try {
        return hydrateSession(data as MinifiedSession);
      } catch (e) {
        console.error('Corrupted active session, ignoring', e);
        return null;
      }
    },
    save: (data: WorkoutSession | null): SaveResult => {
      if (!data) {
        localStorage.removeItem(STORAGE_KEYS.SESS);
        return { ok: true };
      }
      const minified = dehydrateSession(data);
      return saveCompressed(STORAGE_KEYS.SESS, minified);
    },
  },
  theme: {
    load: (): string => {
      try {
        return localStorage.getItem(STORAGE_KEYS.ACCENT_COLOR) || 'blue';
      } catch {
        return 'blue';
      }
    },
    save: (t: string) => {
      try {
        localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, t);
      } catch (e) {
        console.error('Theme Save Error', e);
      }
    },
  },
  snapshots: {
    list: (): AutoSnapshot[] => {
      const data = loadCompressed(STORAGE_KEYS.AUTO_SNAPSHOTS);
      if (!Array.isArray(data)) return [];
      try {
        return data.map((ms: MinifiedSnapshot): AutoSnapshot => {
          const hist = (ms.d.h || []).map(hydrateSession);
          const lib = (ms.d.l || []).map(hydrateLibraryItem);
          const progs = (ms.d.p || []).map(hydrateProgram);
          return {
            id: ms.id,
            timestamp: ms.ts,
            reason: ms.r,
            label: ms.lbl,
            data: {
              schemaVersion: ms.d.v || CURRENT_SCHEMA_VERSION,
              history: hist,
              library: lib,
              programs: progs,
            },
            summary: {
              historyCount: hist.length,
              libraryCount: lib.length,
              programsCount: progs.length,
            },
          };
        });
      } catch (e) {
        console.error('Corrupted snapshots list, ignoring', e);
        return [];
      }
    },
    saveSnapshot: (
      reason: SnapshotReason,
      label: string,
      customData?: { history: WorkoutSession[]; library: LibraryExercise[]; programs: Program[] }
    ): SaveResult => {
      try {
        const hist = customData?.history ?? storage.history.load();
        const lib = customData?.library ?? storage.library.load();
        const progs = customData?.programs ?? storage.programs.load();

        const currentSnapshotsRaw = loadCompressed(STORAGE_KEYS.AUTO_SNAPSHOTS);
        const list: MinifiedSnapshot[] = Array.isArray(currentSnapshotsRaw)
          ? (currentSnapshotsRaw as MinifiedSnapshot[])
          : [];

        const newSnapshot: MinifiedSnapshot = {
          id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          ts: Date.now(),
          r: reason,
          lbl: label,
          d: {
            v: CURRENT_SCHEMA_VERSION,
            h: hist.map(dehydrateSession),
            l: lib.map(dehydrateLibraryItem),
            p: progs.map(dehydrateProgram),
          },
        };

        // Keep maximum 3 latest snapshots (FIFO)
        const updatedList = [newSnapshot, ...list].slice(0, 3);
        return saveCompressed(STORAGE_KEYS.AUTO_SNAPSHOTS, updatedList);
      } catch (e) {
        console.error('Failed to create snapshot', e);
        return { ok: false, reason: isQuotaExceeded(e) ? 'quota' : 'unknown', error: e };
      }
    },
    delete: (id: string): SaveResult => {
      const currentSnapshotsRaw = loadCompressed(STORAGE_KEYS.AUTO_SNAPSHOTS);
      if (!Array.isArray(currentSnapshotsRaw)) return { ok: true };
      const updatedList = (currentSnapshotsRaw as MinifiedSnapshot[]).filter((s) => s.id !== id);
      return saveCompressed(STORAGE_KEYS.AUTO_SNAPSHOTS, updatedList);
    },
    clear: () => {
      localStorage.removeItem(STORAGE_KEYS.AUTO_SNAPSHOTS);
    },
  },
  measurements: {
    load: (): BodyMeasurement[] => {
      const data = loadCompressed(STORAGE_KEYS.BODY_MEASUREMENTS);
      return Array.isArray(data) ? (data as BodyMeasurement[]) : [];
    },
    save: (measurements: BodyMeasurement[]): SaveResult => {
      return saveCompressed(STORAGE_KEYS.BODY_MEASUREMENTS, measurements);
    },
  },
  getUsageEstimate: () => {
    let totalChars = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          totalChars += key.length + val.length;
        }
      }
    } catch {
      // ignore
    }
    // Approx UTF-16 size: 2 bytes per char
    const bytes = totalChars * 2;
    const kb = Math.round((bytes / 1024) * 10) / 10;
    const maxKb = 5120; // 5MB standard quota
    const percentage = Math.min(100, Math.round((kb / maxKb) * 100));

    return {
      usedBytes: bytes,
      usedKb: kb,
      formatted: `${kb} Ko`,
      percentage,
      isNearLimit: kb > 4000,
    };
  },
};
