import { ExerciseType } from '../types';

// --- ENUM MAPPINGS ---

export const TYPE_MAP: Record<ExerciseType, string> = {
  Polyarticulaire: 'P',
  Isolation: 'I',
  Cardio: 'C',
  Statique: 'S',
  Étirement: 'E',
};

export const REVERSE_TYPE_MAP: Record<string, ExerciseType> = Object.entries(TYPE_MAP).reduce(
  (acc, [k, v]) => {
    acc[v] = k as ExerciseType;
    return acc;
  },
  {} as Record<string, ExerciseType>
);

export const MUSCLE_MAP: Record<string, string> = {
  Pectoraux: 'PE',
  Dos: 'DO',
  Jambes: 'JA', // Legacy
  Quadriceps: 'QU',
  Ischios: 'HA',
  Fessiers: 'GL',
  Épaules: 'EP',
  Bras: 'BR',
  Abdos: 'AB',
  Mollets: 'MO',
  'Avant-bras': 'AV',
  Cou: 'CO',
  Cardio: 'CA',
};

export const REVERSE_MUSCLE_MAP: Record<string, string> = Object.entries(MUSCLE_MAP).reduce(
  (acc, [k, v]) => {
    acc[v] = k;
    return acc;
  },
  {} as Record<string, string>
);

export const EQUIPMENT_MAP: Record<string, string> = {
  Barbell: 'BB',
  Dumbbell: 'DB',
  'Barre EZ': 'EZ',
  Kettlebell: 'KB',
  'Trap Bar': 'TB',
  'Poids du corps': 'BW',
  Machine: 'EM',
  'Smith Machine': 'SM',
  'Cable (Poulie)': 'CB',
  Élastique: 'RB',
  Disque: 'PL',
  Autre: 'OT',
};

// --- DTO INTERFACES (Minified Structure) ---

export interface MinifiedSet {
  w: string | number; // weight
  r: string | number; // reps
  ri?: string; // rir
  d: number; // done (0 or 1)
  n?: string; // notes
  ca?: number; // completedAt
  wu?: number; // isWarmup (0 or 1)
}

export interface MinifiedExoInstance {
  e: number; // exerciseId
  t: string; // target
  r: number; // rest
  b?: number; // isBonus (0 or 1)
  n?: string; // notes
  s: MinifiedSet[]; // sets
  tr?: string; // targetRir
}

export interface MinifiedSession {
  i: string; // id
  pn: string; // programName
  sn: string; // sessionName
  dt: number; // startTime
  ed?: number; // endTime
  bw?: string; // bodyWeight
  f?: string; // fatigue
  e: MinifiedExoInstance[]; // exercises
}

export interface MinifiedLibraryItem {
  i: number; // id
  n: string; // name
  t: string; // type (Mapped)
  m: string; // muscle (Mapped)
  eq: string; // equipment (Key directly: BB, DB...)
  f?: number; // isFavorite (0 or 1)
  ia?: number; // isArchived (0 or 1)
  tp?: {
    // tips
    s?: string[]; // setup
    e?: string[]; // exec
    m?: string[]; // mistake
  };
}

export interface MinifiedProgramSession {
  i: string; // id
  n: string; // name
  e: {
    // exos
    e: number; // exerciseId
    s: number; // sets
    r: string; // reps
    rt: number; // rest
    tr?: string; // targetRir
  }[];
}

export interface MinifiedProgram {
  i: string; // id
  n: string; // name
  s: MinifiedProgramSession[]; // sessions
}
