import { WorkoutSession, LibraryExercise, ExerciseType, SetRecord, OneRMFormula } from '../types';
import { calculate1RM } from './calculations';

/**
 * Formats a number of seconds to "MM:SS".
 */
export function formatDuration(seconds: number | string): string {
  const val = parseInt(String(seconds), 10);
  if (isNaN(val)) return '-';
  const m = Math.floor(val / 60);
  const s = val % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Parses duration from "SS", "MM:SS" or "HH:MM:SS" into total seconds.
 */
export function parseDuration(input: string): number {
  if (!input) return 0;
  if (!input.includes(':')) return parseInt(input, 10) || 0;

  const parts = input.split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const s = parseInt(parts[1], 10) || 0;
    return m * 60 + s;
  }
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const s = parseInt(parts[2], 10) || 0;
    return h * 3600 + m * 60 + s;
  }
  return 0;
}

/**
 * Intelligently formats time inputs for cardio and static exercises.
 */
export function smartFormatTime(input: string, type: 'Cardio' | 'Statique' | 'Other'): string {
  if (!input) return '';
  const clean = input.replace(/[.,]/g, ':').trim();

  if (/^\d+$/.test(clean)) {
    if (type === 'Cardio') {
      return `${clean}:00`;
    } else if (type === 'Statique') {
      return `00:${clean.padStart(2, '0')}`;
    }
    return clean;
  }

  const parts = clean.split(':');
  if (parts.length === 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  if (parts.length === 3) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
  }

  return clean;
}

/**
 * Summarizes the sets of an exercise session into a clean string label.
 */
export function formatSessionSets(sets: SetRecord[], type?: ExerciseType): string {
  const doneSets = sets.filter((s) => s.done && !s.isWarmup);
  if (doneSets.length === 0) return '-';

  const isCardio = type === 'Cardio';
  const isStatic = type === 'Statique' || type === 'Étirement';

  if (isCardio) {
    const totalDist = doneSets.reduce((acc, s) => acc + (parseFloat(s.reps) || 0), 0);
    return `Total: ${totalDist}`;
  }

  if (isStatic) {
    const bestTime = Math.max(...doneSets.map((s) => parseDuration(s.reps)));
    return `Best: ${formatDuration(bestTime)}`;
  }

  let topSet = doneSets[0];
  let topWeight = parseFloat(topSet.weight) || 0;
  let topReps = parseFloat(topSet.reps) || 0;

  for (let i = 1; i < doneSets.length; i++) {
    const s = doneSets[i];
    const w = parseFloat(s.weight) || 0;
    const r = parseFloat(s.reps) || 0;

    if (w > topWeight) {
      topSet = s;
      topWeight = w;
      topReps = r;
    } else if (w === topWeight && r > topReps) {
      topSet = s;
      topReps = r;
    }
  }

  const setRequest = doneSets.length > 1 ? ` (+${doneSets.length - 1})` : '';
  return `Top: ${topSet.weight}kg x ${topSet.reps}${setRequest}`;
}

export interface ExerciseStats {
  pr: number;
  prMax: number;
  maxDuration: number;
  maxDistance: number;
  lastDetailed: string;
  lastSessionString: string;
  prSessionString: string;
  lastSessionVolume: number;
  lastBestSet: { weight: number; reps: number; e1rm: number } | null;
}

/**
 * Calculates all historical records and last session benchmarks for a specific exercise.
 */
export function getExerciseStats(
  exerciseId: number,
  history: WorkoutSession[],
  type?: ExerciseType,
  formula: OneRMFormula = 'wathen'
): ExerciseStats {
  let prE1RM = 0;
  let prMaxWeight = 0;
  let maxDuration = 0;
  let maxDistance = 0;

  let lastSessionString = '-';
  let prSessionString = '-';

  let lastSessionVolume = 0;
  let lastBestSet: { weight: number; reps: number; e1rm: number } | null = null;

  const exerciseSessions = history
    .filter((h) => h.exercises.some((e) => e.exerciseId === exerciseId))
    .sort((a, b) => b.startTime - a.startTime);

  const isCardio = type === 'Cardio';
  const isStatic = type === 'Statique' || type === 'Étirement';
  const shouldCalc1RM = !isCardio && !isStatic;

  if (exerciseSessions.length > 0) {
    const lastSess = exerciseSessions[0];
    const lastExo = lastSess.exercises.find((e) => e.exerciseId === exerciseId);
    if (lastExo) {
      lastSessionString = formatSessionSets(lastExo.sets, type);

      lastExo.sets.forEach((s) => {
        if (s.done && !s.isWarmup) {
          const w = parseFloat(s.weight) || 0;
          const r = parseFloat(s.reps) || 0;
          const dur = parseDuration(s.reps);
          const dist = r;

          if (isStatic) {
            lastSessionVolume += dur;
          } else if (isCardio) {
            lastSessionVolume += dist;
          } else {
            lastSessionVolume += w * r;
          }

          if (shouldCalc1RM) {
            const e1rm = calculate1RM(w, r, formula);
            if (!lastBestSet || e1rm > lastBestSet.e1rm) {
              lastBestSet = { weight: w, reps: r, e1rm };
            }
          } else {
            if (!lastBestSet || w > lastBestSet.weight) {
              lastBestSet = { weight: w, reps: r, e1rm: 0 };
            }
          }
        }
      });
    }

    let bestSess: WorkoutSession | null = null;
    let maxCalc = 0;

    exerciseSessions.forEach((sess) => {
      const ex = sess.exercises.find((e) => e.exerciseId === exerciseId);
      if (!ex) return;

      let sessMax = 0;
      ex.sets.forEach((s) => {
        if (s.done && !s.isWarmup) {
          const w = parseFloat(s.weight) || 0;
          const r = parseFloat(s.reps) || 0;
          const dur = parseDuration(s.reps);
          const cardioDur = parseDuration(s.rir || '0');

          if (shouldCalc1RM) {
            const e1rm = calculate1RM(w, r, formula);
            if (e1rm > sessMax) sessMax = e1rm;
            if (e1rm > prE1RM) prE1RM = e1rm;
            if (w > prMaxWeight) prMaxWeight = w;
          } else if (isStatic) {
            if (dur > maxDuration) maxDuration = dur;
            if (w > prMaxWeight) prMaxWeight = w;
            if (dur > sessMax) sessMax = dur;
          } else if (isCardio) {
            if (w > prMaxWeight) prMaxWeight = w;
            if (r > maxDistance) maxDistance = r;
            if (cardioDur > maxDuration) maxDuration = cardioDur;
            if (r > sessMax) sessMax = r;
          }
        }
      });

      if (sessMax > maxCalc) {
        maxCalc = sessMax;
        bestSess = sess;
      }
    });

    if (bestSess) {
      const bestExo = (bestSess as WorkoutSession).exercises.find((e) => e.exerciseId === exerciseId);
      if (bestExo) {
        prSessionString = formatSessionSets(bestExo.sets, type);
      }
    }
  }

  return {
    pr: prE1RM,
    prMax: prMaxWeight,
    maxDuration,
    maxDistance,
    lastDetailed: lastSessionString,
    lastSessionString,
    prSessionString,
    lastSessionVolume,
    lastBestSet,
  };
}

/**
 * Triggers a native file download in the browser.
 */
export function downloadFile(data: BlobPart, filename: string, mimeType: string = 'application/json') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generates a full CSV export from workout history and library exercises.
 */
export function generateCSV(
  history: WorkoutSession[],
  library: LibraryExercise[],
  formula: OneRMFormula = 'wathen'
): string {
  const headers = [
    'Date',
    'Program_name',
    'Session_name',
    'RPE_Session',
    'Bodyweight',
    'Exercise_Order',
    'Exercise_name',
    'Muscle_Group',
    'Exercise_Type',
    'Target',
    'Rest_Target',
    'Is_Bonus',
    'Exercise_Note',
    'Set_Order',
    'Weight_or_Lest_or_lvl',
    'Reps_or_Dist_or_Duration',
    'RIR_or_Duration',
    'Is_Warmup',
    'Estimated_1RM',
    'Tonnage',
    'Validation_Timestamp',
  ];

  const rows = [headers.join(',')];
  const safe = (str: string) => {
    if (!str) return '';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  history
    .sort((a, b) => a.startTime - b.startTime)
    .forEach((session) => {
      const date = new Date(session.startTime).toISOString().split('T')[0];

      session.exercises.forEach((ex, exIdx) => {
        const libEx = library.find((l) => l.id === ex.exerciseId);
        const exoName = libEx?.name || `Unknown ID: ${ex.exerciseId}`;
        const muscle = libEx?.muscle || 'Unknown';
        const type = libEx?.type || 'Unknown';

        const target = ex.target || '';
        const restTarget = ex.rest || 0;
        const isBonus = ex.isBonus ? 'Yes' : 'No';
        const note = ex.notes || '';

        const isCardio = type === 'Cardio';
        const isStatic = type === 'Statique' || type === 'Étirement';

        ex.sets.forEach((set, setIdx) => {
          if (!set.done) return;

          const weight = parseFloat(set.weight) || 0;
          let reps = 0;
          if (isStatic) {
            reps = parseDuration(set.reps);
          } else {
            reps = parseFloat(set.reps) || 0;
          }

          const rirMatch = (set.rir || '').match(/\d+/);
          const rirValue = isCardio ? parseDuration(set.rir || '0') : rirMatch ? parseInt(rirMatch[0], 10) : 0;
          const rirRaw = isCardio ? String(rirValue) : set.rir || '0';

          const e1RM = isCardio || isStatic || set.isWarmup ? 0 : calculate1RM(weight, reps, formula);
          const tonnage = isCardio || isStatic || set.isWarmup ? 0 : weight * reps;
          const timestamp = set.completedAt
            ? new Date(set.completedAt).toISOString()
            : new Date(session.startTime).toISOString();

          const row = [
            date,
            safe(session.programName),
            safe(session.sessionName),
            session.fatigue,
            session.bodyWeight,
            exIdx + 1,
            safe(exoName),
            safe(muscle),
            safe(type),
            safe(target),
            restTarget,
            isBonus,
            safe(note),
            setIdx + 1,
            weight,
            reps,
            safe(rirRaw),
            set.isWarmup ? 'Yes' : 'No',
            e1RM,
            tonnage,
            timestamp,
          ];

          rows.push(row.join(','));
        });
      });
    });

  return rows.join('\n');
}
