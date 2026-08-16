import { describe, it, expect } from 'vitest';
import { calculate1RM, calculatePlates, generateWarmupSeries } from './calculations';

describe('calculate1RM', () => {
  it('returns the weight itself for a 1-rep set regardless of formula', () => {
    expect(calculate1RM(100, 1, 'wathen')).toBe(100);
    expect(calculate1RM(100, 1, 'epley')).toBe(100);
    expect(calculate1RM(100, 1, 'brzycki')).toBe(100);
    expect(calculate1RM(100, 1, 'average')).toBe(100);
  });

  it('estimates 1RM for multi-rep sets using the Wathen formula', () => {
    // 100kg x 5 reps -> Wathen: (100*100) / (48.8 + 53.8*e^(-0.075*5)) ≈ 117
    expect(calculate1RM(100, 5, 'wathen')).toBe(117);
  });

  it('estimates 1RM for multi-rep sets using Epley and Brzycki formulas', () => {
    // 100kg x 5 reps -> Epley: 100 * (1 + 5/30) = 116.67 ≈ 117
    expect(calculate1RM(100, 5, 'epley')).toBe(117);
    // 100kg x 5 reps -> Brzycki: 100 * (36 / (37 - 5)) = 112.5 ≈ 113
    expect(calculate1RM(100, 5, 'brzycki')).toBe(113);
  });

  it('returns 0 for non-numeric or non-positive inputs', () => {
    expect(calculate1RM('abc', 5)).toBe(0);
    expect(calculate1RM(100, 0)).toBe(0);
    expect(calculate1RM(-10, 5)).toBe(0);
    expect(calculate1RM(100, -5)).toBe(0);
    expect(calculate1RM(0, 0)).toBe(0);
  });

  it('accepts string inputs (as used in input fields)', () => {
    expect(calculate1RM('100', '1')).toBe(100);
    // 80kg x 8 reps -> Wathen ≈ 102
    expect(calculate1RM('80', '8')).toBe(102);
  });
});

describe('calculatePlates', () => {
  it('returns an empty array when target is below the bar weight', () => {
    expect(calculatePlates(15, 20)).toEqual([]);
  });

  it('returns an empty array when target equals the bar weight', () => {
    expect(calculatePlates(20, 20)).toEqual([]);
  });

  it('computes the plates needed per side using the largest-first greedy strategy (kg)', () => {
    // (100 - 20) / 2 = 40 per side -> 20 + 20
    expect(calculatePlates(100, 20)).toEqual([20, 20]);
    // (60 - 20) / 2 = 20 per side -> 20
    expect(calculatePlates(60, 20)).toEqual([20]);
    // (42.5 - 20) / 2 = 11.25 per side -> 10 + 1.25
    expect(calculatePlates(42.5, 20)).toEqual([10, 1.25]);
  });

  it('computes plates properly with custom plates sets (e.g. lbs)', () => {
    // 225 lbs on a 45 lbs bar -> (225 - 45) / 2 = 90 per side -> 45 + 45
    const lbsPlates = [45, 35, 25, 10, 5, 2.5];
    expect(calculatePlates(225, 45, lbsPlates)).toEqual([45, 45]);
  });

  it('returns an empty array for invalid numeric inputs', () => {
    expect(calculatePlates(NaN, 20)).toEqual([]);
    expect(calculatePlates(100, NaN)).toEqual([]);
  });
});

describe('generateWarmupSeries', () => {
  it('generates 3 progressive sets with target weight', () => {
    const sets = generateWarmupSeries('100');
    expect(sets).toHaveLength(3);
    expect(sets[0].isWarmup).toBe(true);
    expect(sets[0].weight).toBe('50'); // 50%
    expect(sets[1].weight).toBe('70'); // 70%
    expect(sets[2].weight).toBe('90'); // 90%
  });

  it('uses historical 1RM when provided to calibrate sets', () => {
    // historical 1RM 120kg, target 100kg -> 40% = 48kg, 60% = 72kg, 80% = 96kg (which is < target 100kg)
    const sets = generateWarmupSeries('100', 120);
    expect(sets).toHaveLength(3);
    expect(sets[0].weight).toBe('48'); // 40% of 120
    expect(sets[1].weight).toBe('72'); // 60% of 120
    expect(sets[2].weight).toBe('96'); // 80% of 120
  });

  it('caps warmup sets at percentages of target if calculated warmup would exceed target', () => {
    // historical 1RM 150kg, target 100kg:
    // w1 = 150 * 0.4 = 60kg (< 70kg, kept)
    // w2 = 150 * 0.6 = 90kg (>= w3 -> capped to 70kg)
    // w3 = 150 * 0.8 = 120kg (>= 100kg -> capped to 90kg)
    const sets = generateWarmupSeries('100', 150);
    expect(sets).toHaveLength(3);
    expect(sets[2].weight).toBe('90'); // 90% of target
    expect(sets[1].weight).toBe('70'); // 70% of target
    expect(sets[0].weight).toBe('60'); // 40% of 1RM (< 70kg)
  });

  it('returns empty array if target is 0 or invalid', () => {
    expect(generateWarmupSeries('')).toEqual([]);
    expect(generateWarmupSeries('0')).toEqual([]);
    expect(generateWarmupSeries('abc')).toEqual([]);
  });
});
