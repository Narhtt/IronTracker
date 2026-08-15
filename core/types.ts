export type OneRMFormula = 'wathen' | 'epley' | 'brzycki' | 'average';
export type WeightUnit = 'kg' | 'lbs';

export interface SetRecord {
  weight: string;
  reps: string;
  rir?: string;
  done: boolean;
  notes?: string;
  completedAt?: number;
  isWarmup?: boolean;
}

export interface ExerciseInstance {
  exerciseId: number;
  target: string;
  rest: number;
  isBonus: boolean;
  notes: string;
  sets: SetRecord[];
  targetRir?: string;
}

export interface WorkoutSession {
  id: string;
  programName: string;
  sessionName: string;
  startTime: number;
  endTime?: number;
  bodyWeight: string;
  fatigue: string; // 1 to 5
  exercises: ExerciseInstance[];
  mode?: 'active' | 'log';
}

export type ExerciseType = 'Isolation' | 'Polyarticulaire' | 'Cardio' | 'Statique' | 'Étirement';

export interface LibraryExercise {
  id: number;
  name: string;
  type: ExerciseType;
  muscle: string;
  equipment: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  tips?: {
    setup?: string[];
    exec?: string[];
    mistake?: string[];
  };
}

export interface ProgramSession {
  id: string;
  name: string;
  exos: {
    exerciseId: number;
    sets: number;
    reps: string;
    rest: number;
    targetRir?: string;
  }[];
}

export interface Program {
  id: string;
  name: string;
  sessions: ProgramSession[];
}

export type AccentColor = 'blue' | 'orange' | 'emerald' | 'gold' | 'purple' | 'red' | 'cyan' | 'gray';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface ConfirmationOptions {
  title?: string;
  message: string;
  subMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel?: () => void;
}

// --- SNAPSHOTS & BACKUPS ---

export type SnapshotReason = 'session_completed' | 'manual' | 'before_restore' | 'before_reset' | 'before_archive';

export interface AutoSnapshot {
  id: string;
  timestamp: number;
  reason: SnapshotReason;
  label: string;
  data: {
    schemaVersion: number;
    history: WorkoutSession[];
    library: LibraryExercise[];
    programs: Program[];
  };
  summary: {
    historyCount: number;
    libraryCount: number;
    programsCount: number;
  };
}

// --- ANALYTICS INDEXING ---

export interface InsightItem {
  id: string;
  title: string;
  text: string;
  level: 'info' | 'warning' | 'danger' | 'success';
  priority: number; // 1 (High) to 10 (Low)
}

export interface DashboardStats {
  volumeData: { day: string; val: number }[];
  weeklySets: number;
  insights: InsightItem[];
  monthSessionCount: number;
  hasNewPR: boolean;
  lastUpdated: number;
}

// --- BODY MEASUREMENTS ---

export interface BodyMeasurement {
  id: string;
  date: string; // ISO date 'YYYY-MM-DD'
  timestamp: number;
  weight?: number; // In user's unit (kg or lbs)
  waist?: number;  // Tour de taille (cm ou in)
  chest?: number;  // Tour de poitrine (cm ou in)
  arms?: number;   // Tour de bras (cm ou in)
  thighs?: number; // Tour de cuisses (cm ou in)
  calves?: number; // Tour de mollets (cm ou in)
  bodyFat?: number;// % Masse Grasse
  notes?: string;
}

