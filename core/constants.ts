import { ExerciseType } from './types';
import { PALETTE } from '../styles/tokens';

export const STORAGE_KEYS = {
  LIB: 'iron_v1_lib',
  PROGS: 'iron_v1_progs',
  HIST: 'iron_v1_hist',
  SESS: 'iron_v1_sess',
  SCHEMA: 'iron_v1_schema', // Schema version of the data stored under the keys above
  ACCENT_COLOR: 'iron_v1_accent', // Renamed from THEME for clarity
  THEME_MODE: 'iron_v1_mode', // New: 'light' | 'dark'
  HAPTIC_TACTILE: 'iron_v1_haptic_tactile', // Vibration Only
  VISUAL_FEEDBACK: 'iron_v1_visual_feedback', // Flash Only
  HAPTIC_SESSION: 'iron_v1_haptic_session',
  NOTIFICATIONS_ENABLED: 'iron_v1_notifications_enabled',
  LAST_SEEN_PR: 'iron_v1_last_seen_pr',
  BAR_WEIGHT: 'iron_v1_bar_weight',
  AVAILABLE_PLATES: 'iron_v1_available_plates',
  FORMULA_1RM: 'iron_v1_formula_1rm',
  WEIGHT_UNIT: 'iron_v1_weight_unit',
  AUTO_SNAPSHOTS: 'iron_v1_auto_snapshots',
  BODY_MEASUREMENTS: 'iron_v1_body_measurements',
};

export const THEMES = PALETTE.accents;

export const TYPE_COLORS: Record<ExerciseType, string> = {
  Polyarticulaire: PALETTE.accents.red.primary,
  Isolation: PALETTE.accents.blue.primary,
  Cardio: PALETTE.accents.emerald.primary,
  Statique: PALETTE.accents.purple.primary,
  Étirement: PALETTE.text.secondary,
};

export const MUSCLE_COLORS: Record<string, string> = {
  Pectoraux: PALETTE.muscle.pecs,
  Dos: PALETTE.muscle.back,
  Quadriceps: PALETTE.muscle.quads,
  Ischios: PALETTE.muscle.hamstrings,
  Fessiers: PALETTE.muscle.glutes,
  Jambes: PALETTE.muscle.legs, // Legacy Fallback
  Épaules: PALETTE.muscle.shoulders,
  Bras: PALETTE.muscle.arms,
  Abdos: PALETTE.muscle.abs,
  Mollets: PALETTE.muscle.calves,
  'Avant-bras': PALETTE.muscle.forearms,
  Cardio: PALETTE.muscle.cardio,
  Cou: PALETTE.muscle.neck,
};

export const MUSCLE_GROUPS = {
  PRIMARY: ['Pectoraux', 'Dos', 'Quadriceps', 'Ischios', 'Fessiers', 'Jambes'],
  SECONDARY: ['Biceps', 'Triceps', 'Bras', 'Épaules', 'Mollets', 'Abdos', 'Avant-bras', 'Cou'],
};

export const FATIGUE_COLORS: Record<string, string> = PALETTE.fatigue;
