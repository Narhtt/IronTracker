import { WorkoutSession, LibraryExercise, Program, SetRecord, ExerciseInstance, ProgramSession } from './types';

export interface BackupValidationResult {
  valid: boolean;
  errors: string[];
  data: {
    history: WorkoutSession[];
    library: LibraryExercise[];
    programs: Program[];
  } | null;
  schemaVersion: number;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function validateSet(s: unknown, path: string, errors: string[]): s is SetRecord {
  if (!isObject(s)) {
    errors.push(`${path}: série invalide`);
    return false;
  }
  if (typeof s.weight !== 'string' || typeof s.reps !== 'string' || typeof s.done !== 'boolean') {
    errors.push(`${path}: champs weight/reps/done manquants ou invalides`);
    return false;
  }
  return true;
}

function validateExercise(e: unknown, path: string, errors: string[]): e is ExerciseInstance {
  if (!isObject(e)) {
    errors.push(`${path}: exercice invalide`);
    return false;
  }
  if (typeof e.exerciseId !== 'number' || typeof e.rest !== 'number' || !Array.isArray(e.sets)) {
    errors.push(`${path}: champs exerciseId/rest/sets manquants ou invalides`);
    return false;
  }
  return e.sets.every((s, i) => validateSet(s, `${path}.sets[${i}]`, errors));
}

function validateSession(s: unknown, path: string, errors: string[]): s is WorkoutSession {
  if (!isObject(s)) {
    errors.push(`${path}: séance invalide`);
    return false;
  }
  if (
    (typeof s.id !== 'string' && typeof s.id !== 'number') ||
    typeof s.startTime !== 'number' ||
    typeof s.sessionName !== 'string' ||
    !Array.isArray(s.exercises)
  ) {
    errors.push(`${path}: champs id/startTime/sessionName/exercises manquants ou invalides`);
    return false;
  }
  return s.exercises.every((e, i) => validateExercise(e, `${path}.exercises[${i}]`, errors));
}

function validateLibraryItem(l: unknown, path: string, errors: string[]): l is LibraryExercise {
  if (!isObject(l)) {
    errors.push(`${path}: exercice de bibliothèque invalide`);
    return false;
  }
  if (typeof l.id !== 'number' || typeof l.name !== 'string' || typeof l.type !== 'string' || typeof l.muscle !== 'string') {
    errors.push(`${path}: champs id/name/type/muscle manquants ou invalides`);
    return false;
  }
  return true;
}

function validateProgramSession(s: unknown, path: string, errors: string[]): s is ProgramSession {
  if (!isObject(s)) {
    errors.push(`${path}: séance de programme invalide`);
    return false;
  }
  if (typeof s.id !== 'string' || typeof s.name !== 'string' || !Array.isArray(s.exos)) {
    errors.push(`${path}: champs id/name/exos manquants ou invalides`);
    return false;
  }
  return s.exos.every((e, i) => {
    if (!isObject(e) || typeof e.exerciseId !== 'number' || typeof e.sets !== 'number') {
      errors.push(`${path}.exos[${i}]: champs exerciseId/sets manquants ou invalides`);
      return false;
    }
    return true;
  });
}

function validateProgram(p: unknown, path: string, errors: string[]): p is Program {
  if (!isObject(p)) {
    errors.push(`${path}: programme invalide`);
    return false;
  }
  if (typeof p.id !== 'string' || typeof p.name !== 'string' || !Array.isArray(p.sessions)) {
    errors.push(`${path}: champs id/name/sessions manquants ou invalides`);
    return false;
  }
  return p.sessions.every((s, i) => validateProgramSession(s, `${path}.sessions[${i}]`, errors));
}

/**
 * Validates the shape of a parsed backup JSON before it's allowed to
 * overwrite the store. Rejects the whole file (rather than partially
 * applying it) if anything doesn't match the expected structure, so a
 * corrupted or incompatible file can't leave the app in a broken state.
 */
export function validateBackup(input: unknown): BackupValidationResult {
  const errors: string[] = [];

  if (!isObject(input)) {
    return { valid: false, errors: ['Le fichier ne contient pas un objet JSON valide.'], data: null, schemaVersion: 0 };
  }

  const schemaVersion = typeof input.schemaVersion === 'number' ? input.schemaVersion : 0;

  const history = Array.isArray(input.history) ? input.history : [];
  const library = Array.isArray(input.library) ? input.library : [];
  const programs = Array.isArray(input.programs) ? input.programs : [];

  if (!Array.isArray(input.history) && input.history !== undefined) errors.push('history: doit être un tableau');
  if (!Array.isArray(input.library) && input.library !== undefined) errors.push('library: doit être un tableau');
  if (!Array.isArray(input.programs) && input.programs !== undefined) errors.push('programs: doit être un tableau');

  const historyValid = history.every((s, i) => validateSession(s, `history[${i}]`, errors));
  const libraryValid = library.every((l, i) => validateLibraryItem(l, `library[${i}]`, errors));
  const programsValid = programs.every((p, i) => validateProgram(p, `programs[${i}]`, errors));

  if (!historyValid || !libraryValid || !programsValid || errors.length > 0) {
    return { valid: false, errors, data: null, schemaVersion };
  }

  return {
    valid: true,
    errors: [],
    schemaVersion,
    data: {
      history: history as WorkoutSession[],
      library: library as LibraryExercise[],
      programs: programs as Program[],
    },
  };
}
