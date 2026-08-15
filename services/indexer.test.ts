import { describe, it, expect } from 'vitest';
import { indexer } from './indexer';
import { WorkoutSession, LibraryExercise } from '../core/types';

const libExercise: LibraryExercise = {
  id: 1,
  name: 'Développé couché',
  type: 'Polyarticulaire',
  muscle: 'Pectoraux',
  equipment: 'Barbell',
};

function makeSession(startTime: number, overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: `sess_${startTime}`,
    programName: 'Push',
    sessionName: 'Push Day',
    startTime,
    bodyWeight: '',
    fatigue: '3',
    exercises: [
      {
        exerciseId: 1,
        target: '3 x 10',
        rest: 90,
        isBonus: false,
        notes: '',
        sets: [
          { weight: '100', reps: '5', done: true },
          { weight: '100', reps: '5', done: true },
        ],
      },
    ],
    ...overrides,
  };
}

describe('indexer.calculateDashboardStats', () => {
  it('returns a "welcome" insight and zeroed stats for an empty history', () => {
    const stats = indexer.calculateDashboardStats([], []);
    expect(stats.insights).toHaveLength(1);
    expect(stats.insights[0].id).toBe('welcome');
    expect(stats.monthSessionCount).toBe(0);
    expect(stats.weeklySets).toBe(0);
    expect(stats.volumeData).toHaveLength(7);
  });

  it('counts sessions started in the current calendar month', () => {
    const now = Date.now();
    // Small offset (not a day) to stay safely within "now"'s calendar month
    // regardless of which day-of-month the test happens to run on.
    const history = [makeSession(now), makeSession(now - 5 * 60 * 1000)];
    const stats = indexer.calculateDashboardStats(history, [libExercise]);
    expect(stats.monthSessionCount).toBe(2);
  });

  it('counts completed (non-warmup) sets that fall within the current week', () => {
    const now = Date.now();
    const history = [makeSession(now)];
    const stats = indexer.calculateDashboardStats(history, [libExercise]);
    // 2 done sets in the single session, both within "this week"
    expect(stats.weeklySets).toBe(2);
  });

  it('does not count sets from long-past sessions towards the weekly volume', () => {
    const twoMonthsAgo = Date.now() - 60 * 24 * 3600 * 1000;
    const history = [makeSession(twoMonthsAgo)];
    const stats = indexer.calculateDashboardStats(history, [libExercise]);
    expect(stats.weeklySets).toBe(0);
  });
});
