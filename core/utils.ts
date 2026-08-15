import { WorkoutSession, LibraryExercise, ExerciseType, SetRecord, OneRMFormula } from './types';
import { STORAGE_KEYS } from './constants';

export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const newArr = [...arr];
  const [item] = newArr.splice(from, 1);
  newArr.splice(to, 0, item);
  return newArr;
}

export function calculate1RM(
  weight: string | number,
  reps: string | number,
  formula: OneRMFormula = 'wathen'
): number {
  const w = parseFloat(String(weight));
  const r = parseInt(String(reps), 10);
  if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return 0;
  if (r === 1) return Math.round(w);

  const wathen = (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r));
  const epley = w * (1 + r / 30);
  const brzycki = w * (36 / (37 - r));

  let result = 0;
  switch (formula) {
    case 'wathen': result = wathen; break;
    case 'epley': result = epley; break;
    case 'brzycki': result = brzycki; break;
    case 'average': result = (wathen + epley + brzycki) / 3; break;
    default: result = wathen;
  }

  return isFinite(result) ? Math.round(result) : 0;
}

export function calculatePlates(target: number, bar = 20, platesAvailable = [20, 10, 5, 2.5, 1.25]): number[] {
  if (isNaN(target) || isNaN(bar) || target < bar) return [];
  let remainder = (target - bar) / 2;
  const result: number[] = [];
  
  const sortedPlates = [...platesAvailable].sort((a, b) => b - a);

  sortedPlates.forEach((p) => {
    while (remainder >= p) {
      result.push(p);
      remainder -= p;
    }
  });
  return result;
}

export function generateWarmupSeries(targetWeight: string, historical1RM?: number): SetRecord[] {
  const target = parseFloat(targetWeight);
  const hasTarget = !isNaN(target) && target > 0;

  // Use historical 1RM if available
  if (historical1RM && historical1RM > 0) {
    let w1 = Math.round(historical1RM * 0.4);
    let w2 = Math.round(historical1RM * 0.6);
    let w3 = Math.round(historical1RM * 0.8);
    
    // If target weight is set and is lower than the calculated warmup, cap it
    if (hasTarget) {
      if (w3 >= target) w3 = Math.round(target * 0.9);
      if (w2 >= w3) w2 = Math.round(target * 0.7);
      if (w1 >= w2) w1 = Math.round(target * 0.5);
    }
    
    return [
      { weight: String(w1), reps: '10', rir: '', done: false, isWarmup: true },
      { weight: String(w2), reps: '6', rir: '', done: false, isWarmup: true },
      { weight: String(w3), reps: '3', rir: '', done: false, isWarmup: true },
    ];
  }

  // Fallback to old behavior
  if (!hasTarget) return [];

  return [
    { weight: String(Math.round(target * 0.5)), reps: '12', rir: '', done: false, isWarmup: true },
    { weight: String(Math.round(target * 0.7)), reps: '8', rir: '', done: false, isWarmup: true },
    { weight: String(Math.round(target * 0.9)), reps: '3', rir: '', done: false, isWarmup: true },
  ];
}

export function formatDuration(seconds: number | string): string {
  const val = parseInt(String(seconds));
  if (isNaN(val)) return '-';
  const m = Math.floor(val / 60);
  const s = val % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function parseDuration(input: string): number {
  if (!input) return 0;
  if (!input.includes(':')) return parseInt(input) || 0;

  const parts = input.split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0]) || 0;
    const s = parseInt(parts[1]) || 0;
    return m * 60 + s;
  }
  if (parts.length === 3) {
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    const s = parseInt(parts[2]) || 0;
    return h * 3600 + m * 60 + s;
  }
  return 0;
}

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

function formatSessionSets(sets: SetRecord[], type?: ExerciseType): string {
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

export function getExerciseStats(
  exerciseId: number, 
  history: WorkoutSession[], 
  type?: ExerciseType,
  formula: 'wathen' | 'epley' | 'brzycki' | 'average' = 'wathen'
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

    let bestSess = null;
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

export function triggerHaptic(type: 'success' | 'warning' | 'error' | 'click' | 'tick') {
  // 1. Dispatch Visual Event (Works on iOS/Desktop where vibration fails)
  // We always dispatch this, UI listens and decides if it shows based on user settings
  window.dispatchEvent(new CustomEvent('feedback-trigger', { detail: type }));

  // 2. Hardware Vibration (Android Only)
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  const isTactileOn = localStorage.getItem(STORAGE_KEYS.HAPTIC_TACTILE) !== 'false';
  const isSessionOn = localStorage.getItem(STORAGE_KEYS.HAPTIC_SESSION) !== 'false';

  if ((type === 'click' || type === 'tick') && !isTactileOn) return;
  if ((type === 'success' || type === 'warning' || type === 'error') && !isSessionOn) return;

  try {
    switch (type) {
      case 'success':
        navigator.vibrate([50, 50, 50]);
        break;
      case 'warning':
        navigator.vibrate([200, 100, 200, 100, 500]);
        break;
      case 'error':
        navigator.vibrate([50, 50, 50, 50, 100]);
        break;
      case 'click':
        navigator.vibrate(10);
        break;
      case 'tick':
        navigator.vibrate(5);
        break;
    }
  } catch {
    // Silently fail on blocked devices
  }
}

export function downloadFile(data: BlobPart, filename: string, mimeType: string = 'application/json') {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateCSV(
  history: WorkoutSession[], 
  library: LibraryExercise[],
  formula: 'wathen' | 'epley' | 'brzycki' | 'average' = 'wathen'
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
          const rirValue = isCardio ? parseDuration(set.rir || '0') : rirMatch ? parseInt(rirMatch[0]) : 0;
          const rirRaw = isCardio ? String(rirValue) : set.rir || '0';

          const e1RM = isCardio || isStatic || set.isWarmup ? 0 : calculate1RM(weight, reps, formula);
          const tonnage = isCardio || isStatic || set.isWarmup ? 0 : weight * reps;
          const timestamp = set.completedAt ? new Date(set.completedAt).toISOString() : new Date(session.startTime).toISOString();

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
