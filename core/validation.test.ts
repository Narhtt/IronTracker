import { describe, it, expect } from 'vitest';
import { validateBackup } from './validation';

const validBackup = {
  schemaVersion: 1,
  history: [
    {
      id: 'sess_1',
      startTime: 1700000000000,
      sessionName: 'Push Day',
      exercises: [
        {
          exerciseId: 1,
          rest: 90,
          sets: [{ weight: '100', reps: '10', done: true }],
        },
      ],
    },
  ],
  library: [{ id: 1, name: 'Développé couché', type: 'Polyarticulaire', muscle: 'Pectoraux' }],
  programs: [
    {
      id: 'prog_1',
      name: 'Push Pull Legs',
      sessions: [{ id: 'sess_a', name: 'Push', exos: [{ exerciseId: 1, sets: 3 }] }],
    },
  ],
};

describe('validateBackup', () => {
  it('accepts a well-formed backup', () => {
    const result = validateBackup(validBackup);
    expect(result.valid).toBe(true);
    expect(result.data?.history).toHaveLength(1);
    expect(result.schemaVersion).toBe(1);
  });

  it('rejects non-object input entirely', () => {
    const result = validateBackup('not an object');
    expect(result.valid).toBe(false);
    expect(result.data).toBeNull();
  });

  it('rejects a file where a session is missing required fields', () => {
    const broken = { ...validBackup, history: [{ id: 'x' }] };
    const result = validateBackup(broken);
    expect(result.valid).toBe(false);
    expect(result.data).toBeNull();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects the whole file rather than partially applying it when only one section is broken', () => {
    // library is valid, history is corrupt -> nothing should be applied
    const broken = { ...validBackup, history: 'not-an-array' };
    const result = validateBackup(broken);
    expect(result.valid).toBe(false);
    expect(result.data).toBeNull();
  });

  it('defaults schemaVersion to 0 for legacy backups without the field', () => {
    const legacy = { history: [], library: [], programs: [] };
    const result = validateBackup(legacy);
    expect(result.valid).toBe(true);
    expect(result.schemaVersion).toBe(0);
  });
});
