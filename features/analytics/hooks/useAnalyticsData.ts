import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../../store/useStore';
import { calculate1RM, parseDuration } from '../../../core/utils';
import { LibraryExercise } from '../../../core/types';

export interface SBDStatItem {
  name: string;
  value: number;
  displayRatio: string;
  raw: number;
}

export interface VolumeFatigueItem {
  date: string;
  volume: number;
  fatigue: number;
}

export interface WeeklyVolumeItem {
  name: string;
  realName: string;
  avgSets: number;
}

export interface ExerciseDetailItem {
  date: string;
  val: number;
}

// Constants locales au hook (Ordre d'affichage des graphiques)
const MUSCLE_ORDER = [
  'Pectoraux',
  'Dos',
  'Quadriceps',
  'Ischios',
  'Fessiers',
  'Jambes', // New + Legacy
  'Épaules',
  'Bras',
  'Abdos',
];
const TYPE_ORDER = ['Polyarticulaire', 'Isolation', 'Cardio', 'Statique'];
const SBD_STANDARDS = { S: 2.2, B: 1.7, D: 2.8 };

const EQUIP_CAT_MAP: Record<string, string> = {
  BB: 'Lib. 2m.',
  EZ: 'Lib. 2m.',
  TB: 'Lib. 2m.',
  DB: 'Lib. 1m.',
  KB: 'Lib. 1m.',
  PL: 'Lib. 1m.',
  EM: 'Machine',
  SM: 'Machine',
  CB: 'Poulie',
  BW: 'PDC',
  RB: 'Divers',
  OT: 'Divers',
};

export const useAnalyticsData = () => {
  const rawHistory = useStore((s) => s.history);
  const rawLibrary = useStore((s) => s.library);
  const rawMeasurements = useStore((s) => s.measurements);

  const history = useMemo(() => rawHistory || [], [rawHistory]);
  const library = useMemo(() => rawLibrary || [], [rawLibrary]);
  const measurements = useMemo(() => rawMeasurements || [], [rawMeasurements]);

  // State - Default period set to 7d
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedDetailExo, setSelectedDetailExo] = useState<number>(33);
  const [detailMetric, setDetailMetric] = useState<'1rm' | 'max' | 'volume' | 'tonnage'>('1rm');
  const [volumeMode, setVolumeMode] = useState<'muscle' | 'type'>('muscle');

  // Optimization: Pre-compute Map for fast lookup
  const libMap = useMemo(() => {
    const map = new Map<number, LibraryExercise>();
    library.forEach((l) => map.set(l.id, l));
    return map;
  }, [library]);

  // Identify if selected exercise is Static/Cardio (Time based)
  const selectedLib = libMap.get(selectedDetailExo);
  const isTimeBased = selectedLib ? selectedLib.type === 'Statique' || selectedLib.type === 'Étirement' : false;
  const isCardio = selectedLib?.type === 'Cardio';

  // Auto-switch metric
  useEffect(() => {
    if ((isTimeBased || isCardio) && detailMetric === '1rm') {
      setDetailMetric('max');
    }
  }, [selectedDetailExo, isTimeBased, isCardio, detailMetric]);

  // --- DATA TRANSFORMATION ---

  const relevantHistory = useMemo(() => {
    const now = Date.now();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = now - days * 24 * 3600 * 1000;
    return history.filter((s) => s.startTime >= cutoff).sort((a, b) => a.startTime - b.startTime);
  }, [history, period]);

  const overviewStats = useMemo(() => {
    const totalSessions = relevantHistory.length;
    const totalSets = relevantHistory.reduce(
      (acc, s) => acc + s.exercises.reduce((ac, e) => ac + e.sets.filter((st) => st.done && !st.isWarmup).length, 0),
      0
    );
    const totalTonnage = relevantHistory.reduce((acc, s) => {
      return (
        acc +
        s.exercises.reduce((ac, e) => {
          const lib = libMap.get(e.exerciseId);
          if (lib && (lib.type === 'Cardio' || lib.type === 'Statique' || lib.type === 'Étirement')) return ac;
          return (
            acc +
            e.sets
              .filter((st) => st.done && !st.isWarmup)
              .reduce((a, st) => a + (parseFloat(st.weight) || 0) * (parseFloat(st.reps) || 0), 0)
          );
        }, 0)
      );
    }, 0);
    return { totalSessions, totalSets, totalTonnage: Math.round(totalTonnage / 1000) };
  }, [relevantHistory, libMap]);

  const volFatigueData = useMemo(() => {
    return relevantHistory.map((s) => ({
      date: new Date(s.startTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' }),
      volume: s.exercises.reduce((acc, e) => acc + e.sets.filter((st) => st.done && !st.isWarmup).length, 0),
      fatigue: parseInt(s.fatigue) || 3,
    }));
  }, [relevantHistory]);

  const weeklyVolumeData = useMemo(() => {
    const counts: Record<string, number> = {};
    if (volumeMode === 'muscle') MUSCLE_ORDER.forEach((m) => (counts[m] = 0));
    else TYPE_ORDER.forEach((t) => (counts[t] = 0));

    relevantHistory.forEach((s) => {
      s.exercises.forEach((e) => {
        const lib = libMap.get(e.exerciseId);
        if (lib) {
          const key = volumeMode === 'muscle' ? lib.muscle : lib.type;
          // Support new muscles even if not in default MUSCLE_ORDER
          if (counts[key] === undefined && volumeMode === 'muscle') {
            counts[key] = 0;
          }
          if (counts[key] !== undefined) {
            counts[key] += e.sets.filter((st) => st.done && !st.isWarmup).length;
          }
        }
      });
    });

    const weeks = period === '7d' ? 1 : period === '30d' ? 4 : 12;

    // Dynamically include active keys for the chart
    const activeKeys = Object.keys(counts).filter((k) => {
      const count = counts[k];
      // SMART-FILTER: Hide 'Jambes' (Legacy) if 0, even if it is in MUSCLE_ORDER
      if (k === 'Jambes' && count === 0) return false;

      return count > 0 || (volumeMode === 'muscle' ? MUSCLE_ORDER.includes(k) : TYPE_ORDER.includes(k));
    });

    // Sort based on predefined order if possible
    activeKeys.sort((a, b) => {
      const idxA = volumeMode === 'muscle' ? MUSCLE_ORDER.indexOf(a) : TYPE_ORDER.indexOf(a);
      const idxB = volumeMode === 'muscle' ? MUSCLE_ORDER.indexOf(b) : TYPE_ORDER.indexOf(b);
      // Put unlisted items at the end
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return activeKeys.map((label) => ({
      name: volumeMode === 'muscle' ? label.substring(0, 3).toUpperCase() : label.substring(0, 4).toUpperCase(),
      realName: label,
      avgSets: Math.round((counts[label] / weeks) * 10) / 10,
    }));
  }, [relevantHistory, libMap, period, volumeMode]);

  const equipmentData = useMemo(() => {
    const counts: Record<string, number> = {};
    relevantHistory.forEach((s) => {
      s.exercises.forEach((e) => {
        const lib = libMap.get(e.exerciseId);
        if (lib && lib.equipment) {
          const cat = EQUIP_CAT_MAP[lib.equipment] || 'Divers';
          counts[cat] = (counts[cat] || 0) + e.sets.filter((st) => st.done && !st.isWarmup).length;
        }
      });
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [relevantHistory, libMap]);

  const exerciseDetailData = useMemo(() => {
    return relevantHistory
      .filter((h) => h.exercises.some((e) => e.exerciseId === selectedDetailExo))
      .map((h) => {
        const ex = h.exercises.find((e) => e.exerciseId === selectedDetailExo);
        if (!ex) return null;
        const validSets = ex.sets.filter((s) => s.done && !s.isWarmup);
        if (validSets.length === 0) return null;
        let val = 0;

        const isTime = isTimeBased;

        if (detailMetric === 'volume') {
          val = validSets.length;
        } else if (isTime) {
          if (detailMetric === '1rm') val = Math.max(...validSets.map((s) => parseFloat(s.weight) || 0));
          else if (detailMetric === 'max') val = Math.max(...validSets.map((s) => parseDuration(s.reps)));
          else val = validSets.reduce((acc, s) => acc + parseDuration(s.reps), 0);
        } else if (isCardio) {
          if (detailMetric === '1rm') val = Math.max(...validSets.map((s) => parseFloat(s.weight) || 0));
          else if (detailMetric === 'max') val = Math.max(...validSets.map((s) => parseFloat(s.reps) || 0));
          else val = validSets.reduce((acc, s) => acc + (parseFloat(s.reps) || 0), 0);
        } else {
          if (detailMetric === '1rm') val = Math.max(...validSets.map((s) => calculate1RM(s.weight, s.reps)));
          else if (detailMetric === 'max') val = Math.max(...validSets.map((s) => parseFloat(s.weight) || 0));
          else val = validSets.reduce((acc, s) => acc + (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0), 0);
        }

        return {
          date: new Date(h.startTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          val: val,
        };
      })
      .filter(Boolean);
  }, [relevantHistory, selectedDetailExo, detailMetric, isTimeBased, isCardio]);

  const sbdStats = useMemo(() => {
    // Bench & Deadlift rely on known IDs or Types, but let's stick to IDs/Standard logic for now.
    const benchIds = [1, 2, 3, 4];
    const deadliftIds = [20, 40];

    let maxSquatQuad = 0;
    let maxSquatLegs = 0; // Legacy Fallback
    const maxes = { S: 0, B: 0, D: 0 };

    history.forEach((s) => {
      s.exercises.forEach((e) => {
        const libEx = libMap.get(e.exerciseId);
        if (!libEx) return;

        // SQUAT LOGIC (Dynamic + Fallback)
        if (libEx.type === 'Polyarticulaire') {
          e.sets.forEach((st) => {
            if (st.done && !st.isWarmup) {
              const e1rm = calculate1RM(st.weight, st.reps);

              // Check for Quadriceps Compound (Priority)
              if (libEx.muscle === 'Quadriceps') {
                if (e1rm > maxSquatQuad) maxSquatQuad = e1rm;
              }
              // Check for Legacy Legs Compound (Fallback)
              else if (libEx.muscle === 'Jambes') {
                if (e1rm > maxSquatLegs) maxSquatLegs = e1rm;
              }
            }
          });
        }

        // BENCH & DEADLIFT LOGIC (ID Based for now, safer for these specific lifts)
        let category: 'B' | 'D' | null = null;
        if (benchIds.includes(e.exerciseId)) category = 'B';
        else if (deadliftIds.includes(e.exerciseId)) category = 'D';

        if (category) {
          e.sets.forEach((st) => {
            if (st.done && !st.isWarmup) {
              let w = parseFloat(st.weight) || 0;
              if (category === 'B' && libEx?.equipment === 'DB') {
                w = (w * 2) / 0.8;
              }
              const e1rm = calculate1RM(w, st.reps);
              if (e1rm > maxes[category!]) maxes[category!] = e1rm;
            }
          });
        }
      });
    });

    // APPLY SQUAT FALLBACK
    maxes.S = maxSquatQuad > 0 ? maxSquatQuad : maxSquatLegs;

    let lastBW = 75;
    const latestMeasWithWeight = (measurements || []).find((m) => m && m.weight && m.weight > 0);
    if (latestMeasWithWeight && latestMeasWithWeight.weight) {
      lastBW = latestMeasWithWeight.weight;
    } else if (history.length > 0 && history[0].bodyWeight) {
      const parsed = parseFloat(history[0].bodyWeight);
      if (!isNaN(parsed) && parsed > 0) lastBW = parsed;
    }

    const total = Math.round(maxes.S + maxes.B + maxes.D);
    const currentRatio = (total / lastBW).toFixed(2);
    const getNormValue = (max: number, elite: number) => {
      const ratio = max / lastBW;
      return Math.min(100, Math.round((ratio / elite) * 100));
    };

    return {
      data: [
        {
          name: 'Squat',
          value: getNormValue(maxes.S, SBD_STANDARDS.S),
          displayRatio: (maxes.S / lastBW).toFixed(2),
          raw: Math.round(maxes.S),
        },
        {
          name: 'Bench',
          value: getNormValue(maxes.B, SBD_STANDARDS.B),
          displayRatio: (maxes.B / lastBW).toFixed(2),
          raw: Math.round(maxes.B),
        },
        {
          name: 'Deadlift',
          value: getNormValue(maxes.D, SBD_STANDARDS.D),
          displayRatio: (maxes.D / lastBW).toFixed(2),
          raw: Math.round(maxes.D),
        },
      ],
      total,
      ratio: currentRatio,
    };
  }, [history, libMap, measurements]);

  return {
    // State
    period,
    setPeriod,
    selectedDetailExo,
    setSelectedDetailExo,
    detailMetric,
    setDetailMetric,
    volumeMode,
    setVolumeMode,
    isTimeBased,
    isCardio,

    // Data
    history,
    library,
    overviewStats,
    volFatigueData,
    weeklyVolumeData,
    equipmentData,
    exerciseDetailData,
    sbdStats,
  };
};
