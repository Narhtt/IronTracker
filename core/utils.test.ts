import { describe, it, expect } from 'vitest';
import { calculate1RM, calculatePlates } from './utils';

describe('calculate1RM', () => {
  it('returns the weight itself for a 1-rep set', () => {
    expect(calculate1RM(100, 1)).toBe(100);
  });

  it('estimates 1RM for multi-rep sets using the Wathen formula', () => {
    // 100kg x 5 reps -> Wathen: (100*100) / (48.8 + 53.8*e^(-0.075*5)) ≈ 117
    expect(calculate1RM(100, 5)).toBe(117);
  });

  it('returns 0 for non-numeric or non-positive inputs', () => {
    expect(calculate1RM('abc', 5)).toBe(0);
    expect(calculate1RM(100, 0)).toBe(0);
    expect(calculate1RM(-10, 5)).toBe(0);
    expect(calculate1RM(100, -5)).toBe(0);
  });

  it('accepts string inputs (as used throughout the app)', () => {
    expect(calculate1RM('100', '1')).toBe(100);
  });
});

describe('calculatePlates', () => {
  it('returns an empty array when target is below the bar weight', () => {
    expect(calculatePlates(15, 20)).toEqual([]);
  });

  it('returns an empty array when target equals the bar weight', () => {
    expect(calculatePlates(20, 20)).toEqual([]);
  });

  it('computes the plates needed per side using the largest-first greedy strategy', () => {
    // (100 - 20) / 2 = 40 per side -> 20 + 20
    expect(calculatePlates(100, 20)).toEqual([20, 20]);
    // (60 - 20) / 2 = 20 per side -> 20
    expect(calculatePlates(60, 20)).toEqual([20]);
    // (42.5 - 20) / 2 = 11.25 per side -> 10 + 1.25
    expect(calculatePlates(42.5, 20)).toEqual([10, 1.25]);
  });

  it('returns an empty array for invalid numeric inputs', () => {
    expect(calculatePlates(NaN, 20)).toEqual([]);
    expect(calculatePlates(100, NaN)).toEqual([]);
  });
});
