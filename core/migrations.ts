import { WorkoutSession, LibraryExercise, Program } from './types';

// Bump this whenever the shape of WorkoutSession/LibraryExercise/Program changes
// in a way that requires transforming previously-saved data.
export const CURRENT_SCHEMA_VERSION = 1;

export interface BackupData {
  history: WorkoutSession[];
  library: LibraryExercise[];
  programs: Program[];
}

// Registry of migrations, keyed by the version they migrate *from*.
// Add an entry here (and bump CURRENT_SCHEMA_VERSION) whenever a future
// change needs to transform older data instead of just adding new fields.
type Migration = (data: BackupData) => BackupData;
const MIGRATIONS: Record<number, Migration> = {};

/**
 * Runs any registered migrations needed to bring `data` from `fromVersion`
 * up to CURRENT_SCHEMA_VERSION. A missing/unknown fromVersion is treated as
 * pre-versioning legacy data (version 0) and passed through unchanged if no
 * migration is registered for it.
 */
export function migrateBackup(data: BackupData, fromVersion: number): BackupData {
  let migrated = data;
  let version = Number.isFinite(fromVersion) ? fromVersion : 0;

  while (version < CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) break;
    migrated = step(migrated);
    version++;
  }

  return migrated;
}
