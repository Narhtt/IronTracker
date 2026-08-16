import { OneRMFormula, SetRecord } from '../types';

/**
 * Calculates estimated 1RM (One Rep Max) from weight and repetitions
 * Supported formulas: Wathen, Epley, Brzycki, or their Average.
 */
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
    case 'wathen':
      result = wathen;
      break;
    case 'epley':
      result = epley;
      break;
    case 'brzycki':
      result = brzycki;
      break;
    case 'average':
      result = (wathen + epley + brzycki) / 3;
      break;
    default:
      result = wathen;
  }

  return isFinite(result) ? Math.round(result) : 0;
}

/**
 * Calculates the plates needed on each side of the barbell using a greedy (largest-first) strategy.
 */
export function calculatePlates(
  target: number,
  bar = 20,
  platesAvailable = [20, 10, 5, 2.5, 1.25]
): number[] {
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

/**
 * Generates progressive warmup sets based on target weight and/or historical 1RM.
 */
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

  // Fallback to target weight percentage
  if (!hasTarget) return [];

  return [
    { weight: String(Math.round(target * 0.5)), reps: '12', rir: '', done: false, isWarmup: true },
    { weight: String(Math.round(target * 0.7)), reps: '8', rir: '', done: false, isWarmup: true },
    { weight: String(Math.round(target * 0.9)), reps: '3', rir: '', done: false, isWarmup: true },
  ];
}

/**
 * Helper to reorder an array by moving an item from index `from` to index `to`.
 */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const newArr = [...arr];
  const [item] = newArr.splice(from, 1);
  newArr.splice(to, 0, item);
  return newArr;
}
