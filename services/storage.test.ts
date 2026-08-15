import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { storage } from './storage';
import { STORAGE_KEYS } from '../core/constants';
import { WorkoutSession, LibraryExercise, Program } from '../core/types';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const session: WorkoutSession = {
  id: 'sess_1',
  programName: 'Push',
  sessionName: 'Push Day',
  startTime: 1700000000000,
  endTime: 1700003600000,
  bodyWeight: '80',
  fatigue: '3',
  exercises: [
    {
      exerciseId: 1,
      target: '3 x 10',
      rest: 90,
      isBonus: false,
      notes: 'Focus tempo',
      sets: [
        { weight: '100', reps: '10', done: true, rir: '2', completedAt: 1700000100000 },
        { weight: '50', reps: '12', done: false, isWarmup: true },
      ],
    },
  ],
};

const libraryItem: LibraryExercise = {
  id: 1,
  name: 'Développé couché',
  type: 'Polyarticulaire',
  muscle: 'Pectoraux',
  equipment: 'Barbell',
  isFavorite: true,
  tips: { setup: ['Pieds au sol'], exec: ['Descente contrôlée'] },
};

const program: Program = {
  id: 'prog_1',
  name: 'Push Pull Legs',
  sessions: [
    {
      id: 'sess_a',
      name: 'Push',
      exos: [{ exerciseId: 1, sets: 3, reps: '10', rest: 90, targetRir: '2' }],
    },
  ],
};

describe('storage: history round-trip', () => {
  it('saves and reloads a session with lossless field mapping', () => {
    const result = storage.history.save([session]);
    expect(result.ok).toBe(true);

    const loaded = storage.history.load();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(session.id);
    expect(loaded[0].sessionName).toBe(session.sessionName);
    expect(loaded[0].startTime).toBe(session.startTime);
    expect(loaded[0].exercises[0].sets[0]).toMatchObject({
      weight: '100',
      reps: '10',
      done: true,
      rir: '2',
    });
    expect(loaded[0].exercises[0].sets[1].isWarmup).toBe(true);
  });

  it('returns an empty array when nothing has been saved yet', () => {
    expect(storage.history.load()).toEqual([]);
  });
});

describe('storage: library and programs round-trip', () => {
  it('round-trips library items including tips and flags', () => {
    storage.library.save([libraryItem]);
    const loaded = storage.library.load();
    expect(loaded[0]).toMatchObject({
      id: 1,
      name: 'Développé couché',
      type: 'Polyarticulaire',
      isFavorite: true,
    });
    expect(loaded[0].tips?.setup).toEqual(['Pieds au sol']);
  });

  it('round-trips programs and their sessions', () => {
    storage.programs.save([program]);
    const loaded = storage.programs.load();
    expect(loaded[0].id).toBe('prog_1');
    expect(loaded[0].sessions[0].exos[0]).toMatchObject({ exerciseId: 1, sets: 3, reps: '10' });
  });
});

describe('storage: quota errors are surfaced instead of swallowed', () => {
  it('reports a "quota" failure when localStorage.setItem throws QuotaExceededError', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });

    const result = storage.history.save([session]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('quota');
    }
  });

  it('reports an "unknown" failure for non-quota errors', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('boom');
    });

    const result = storage.history.save([session]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('unknown');
    }
  });
});

describe('storage: corrupted data does not crash the app', () => {
  it('falls back to an empty array when the stored value is not valid compressed/JSON data', () => {
    localStorage.setItem(STORAGE_KEYS.HIST, '%%%not-valid-anything%%%');
    expect(storage.history.load()).toEqual([]);
  });

  it('falls back to an empty array when a decoded entry is malformed', () => {
    // Valid JSON, but not an array of minified sessions - hydrate must not throw.
    localStorage.setItem(STORAGE_KEYS.HIST, JSON.stringify({ not: 'an array' }));
    expect(storage.history.load()).toEqual([]);
  });

  it('returns null for a corrupted active session instead of throwing', () => {
    localStorage.setItem(STORAGE_KEYS.SESS, '%%%garbage%%%');
    expect(storage.session.load()).toBeNull();
  });
});
