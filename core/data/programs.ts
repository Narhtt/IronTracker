import { Program } from '../types';

export const DEFAULT_PROGRAMS: Program[] = [
  {
    id: 'prog_full_body',
    name: 'Full Body (Débutant - 3j)',
    sessions: [
      {
        id: 'fb_a',
        name: 'Séance A',
        exos: [
          { exerciseId: 33, sets: 3, reps: '6-8', rest: 180, targetRir: '2' }, // barbell_squat
          { exerciseId: 1, sets: 3, reps: '8-10', rest: 120, targetRir: '2' }, // barbell_bench_press
          { exerciseId: 27, sets: 3, reps: '10-12', rest: 90, targetRir: '1' }, // seated_cable_row
          { exerciseId: 11, sets: 3, reps: '10-12', rest: 90, targetRir: '1' }, // dumbbell_shoulder_press
          { exerciseId: 45, sets: 3, reps: '10-12', rest: 60, targetRir: '0' }, // barbell_curl
        ],
      },
      {
        id: 'fb_b',
        name: 'Séance B',
        exos: [
          { exerciseId: 40, sets: 3, reps: '8-10', rest: 180, targetRir: '2' }, // romanian_deadlift
          { exerciseId: 12, sets: 3, reps: '6-8', rest: 120, targetRir: '2' }, // barbell_overhead_press
          { exerciseId: 23, sets: 3, reps: '10-12', rest: 90, targetRir: '1' }, // lat_pulldown
          { exerciseId: 36, sets: 3, reps: '10-12', rest: 120, targetRir: '1' }, // leg_press
          { exerciseId: 61, sets: 3, reps: '45', rest: 60, targetRir: '0' }, // plank
        ],
      },
      {
        id: 'fb_c',
        name: 'Séance C',
        exos: [
          { exerciseId: 38, sets: 3, reps: '10-12', rest: 90, targetRir: '1' }, // dumbbell_lunge
          { exerciseId: 2, sets: 3, reps: '8-10', rest: 120, targetRir: '1' }, // dumbbell_bench_press
          { exerciseId: 24, sets: 3, reps: '8-10', rest: 120, targetRir: '2' }, // barbell_bent_over_row
          { exerciseId: 15, sets: 3, reps: '12-15', rest: 60, targetRir: '0' }, // dumbbell_lateral_raise
          { exerciseId: 42, sets: 3, reps: '12-15', rest: 60, targetRir: '0' }, // lying_leg_curl
        ],
      },
    ],
  },
  {
    id: 'prog_upper_lower',
    name: 'Upper / Lower (Intermédiaire - 4j)',
    sessions: [
      {
        id: 'ul_upper1',
        name: 'Upper A (Force)',
        exos: [
          { exerciseId: 1, sets: 4, reps: '5-6', rest: 180, targetRir: '2' },
          { exerciseId: 24, sets: 4, reps: '6-8', rest: 150, targetRir: '2' },
          { exerciseId: 12, sets: 3, reps: '6-8', rest: 120, targetRir: '1' },
          { exerciseId: 6, sets: 3, reps: '8-10', rest: 90, targetRir: '1' },
          { exerciseId: 45, sets: 3, reps: '8-10', rest: 90, targetRir: '1' },
        ],
      },
      {
        id: 'ul_lower1',
        name: 'Lower A (Force)',
        exos: [
          { exerciseId: 33, sets: 4, reps: '5-6', rest: 180, targetRir: '2' },
          { exerciseId: 40, sets: 3, reps: '6-8', rest: 150, targetRir: '2' },
          { exerciseId: 36, sets: 3, reps: '8-10', rest: 120, targetRir: '1' },
          { exerciseId: 42, sets: 3, reps: '10-12', rest: 90, targetRir: '0' },
          { exerciseId: 62, sets: 4, reps: '10-12', rest: 60, targetRir: '1' },
        ],
      },
      {
        id: 'ul_upper2',
        name: 'Upper B (Hypertrophie)',
        exos: [
          { exerciseId: 2, sets: 3, reps: '8-12', rest: 120, targetRir: '1' },
          { exerciseId: 23, sets: 3, reps: '10-12', rest: 90, targetRir: '1' },
          { exerciseId: 11, sets: 3, reps: '10-12', rest: 90, targetRir: '1' },
          { exerciseId: 15, sets: 3, reps: '12-15', rest: 60, targetRir: '0' },
          { exerciseId: 51, sets: 3, reps: '12-15', rest: 60, targetRir: '0' },
        ],
      },
      {
        id: 'ul_lower2',
        name: 'Lower B (Hypertrophie)',
        exos: [
          { exerciseId: 34, sets: 3, reps: '8-10', rest: 120, targetRir: '2' },
          { exerciseId: 38, sets: 3, reps: '10-12', rest: 90, targetRir: '1' },
          { exerciseId: 41, sets: 3, reps: '12-15', rest: 60, targetRir: '0' },
          { exerciseId: 43, sets: 3, reps: '12-15', rest: 60, targetRir: '0' },
          { exerciseId: 63, sets: 3, reps: '15-20', rest: 60, targetRir: '0' },
        ],
      },
    ],
  },
  {
    id: 'prog_ppl',
    name: 'Push Pull Legs (Avancé - 3/6j)',
    sessions: [
      {
        id: 'ppl_push',
        name: 'PUSH (Pecs/Epaules/Tri)',
        exos: [
          { exerciseId: 1, sets: 4, reps: '6-8', rest: 180, targetRir: '2' },
          { exerciseId: 4, sets: 3, reps: '8-10', rest: 120, targetRir: '1' },
          { exerciseId: 11, sets: 3, reps: '10-12', rest: 90, targetRir: '1' },
          { exerciseId: 15, sets: 4, reps: '12-15', rest: 60, targetRir: '0' },
          { exerciseId: 51, sets: 3, reps: '12-15', rest: 60, targetRir: '0' },
        ],
      },
      {
        id: 'ppl_pull',
        name: 'PULL (Dos/Bi/Arrière)',
        exos: [
          { exerciseId: 21, sets: 3, reps: '6-8', rest: 120, targetRir: '1' },
          { exerciseId: 27, sets: 3, reps: '10-12', rest: 90, targetRir: '1' },
          { exerciseId: 17, sets: 3, reps: '15-20', rest: 60, targetRir: '1' },
          { exerciseId: 32, sets: 3, reps: '10-12', rest: 60, targetRir: '1' },
          { exerciseId: 45, sets: 3, reps: '10-12', rest: 60, targetRir: '0' },
        ],
      },
      {
        id: 'ppl_legs',
        name: 'LEGS (Jambes)',
        exos: [
          { exerciseId: 33, sets: 3, reps: '6-8', rest: 180, targetRir: '2' },
          { exerciseId: 40, sets: 3, reps: '8-10', rest: 150, targetRir: '2' },
          { exerciseId: 36, sets: 3, reps: '10-12', rest: 120, targetRir: '1' },
          { exerciseId: 41, sets: 3, reps: '12-15', rest: 60, targetRir: '0' },
          { exerciseId: 62, sets: 4, reps: '12-15', rest: 60, targetRir: '0' },
        ],
      },
    ],
  },
];
