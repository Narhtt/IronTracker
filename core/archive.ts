import { WorkoutSession, LibraryExercise, Program } from './types';
import { downloadFile } from './utils';

export interface ArchivePackage {
  type: 'irontracker_archive';
  version: number;
  archiveDate: string;
  dateRange: {
    from: string;
    to: string;
  };
  count: number;
  history: WorkoutSession[];
  library: LibraryExercise[];
  programs: Program[];
}

export function getHistoryDateRange(history: WorkoutSession[]) {
  if (!history.length) {
    return { oldest: null, newest: null, totalSessions: 0 };
  }
  const sorted = [...history].sort((a, b) => a.startTime - b.startTime);
  return {
    oldest: new Date(sorted[0].startTime),
    newest: new Date(sorted[sorted.length - 1].startTime),
    totalSessions: history.length,
  };
}

export function filterSessionsByCutoff(
  history: WorkoutSession[],
  cutoffTimestamp: number
): { toArchive: WorkoutSession[]; toKeep: WorkoutSession[] } {
  const toArchive: WorkoutSession[] = [];
  const toKeep: WorkoutSession[] = [];

  history.forEach((session) => {
    if (session.startTime < cutoffTimestamp) {
      toArchive.push(session);
    } else {
      toKeep.push(session);
    }
  });

  return { toArchive, toKeep };
}

export function filterSessionsByYears(
  history: WorkoutSession[],
  years: number
): { toArchive: WorkoutSession[]; toKeep: WorkoutSession[] } {
  const now = new Date();
  const cutoffDate = new Date(now.getFullYear() - years, now.getMonth(), now.getDate()).getTime();
  return filterSessionsByCutoff(history, cutoffDate);
}

export function downloadArchiveFile(
  sessionsToArchive: WorkoutSession[],
  library: LibraryExercise[],
  programs: Program[]
): void {
  if (sessionsToArchive.length === 0) return;

  const sorted = [...sessionsToArchive].sort((a, b) => a.startTime - b.startTime);
  const from = new Date(sorted[0].startTime).toISOString().split('T')[0];
  const to = new Date(sorted[sorted.length - 1].startTime).toISOString().split('T')[0];

  const archivePackage: ArchivePackage = {
    type: 'irontracker_archive',
    version: 1,
    archiveDate: new Date().toISOString(),
    dateRange: { from, to },
    count: sessionsToArchive.length,
    history: sessionsToArchive,
    library,
    programs,
  };

  const today = new Date().toISOString().split('T')[0];
  downloadFile(
    JSON.stringify(archivePackage, null, 2),
    `irontracker_archive_${from}_to_${to}_(${today}).json`
  );
}

export function mergeSessionsWithoutDuplicates(
  currentHistory: WorkoutSession[],
  importedSessions: WorkoutSession[]
): { merged: WorkoutSession[]; addedCount: number } {
  const existingIds = new Set(currentHistory.map((s) => s.id));
  const existingKeySet = new Set(currentHistory.map((s) => `${s.startTime}_${s.sessionName}`));

  const newSessions: WorkoutSession[] = [];

  importedSessions.forEach((s) => {
    const key = `${s.startTime}_${s.sessionName}`;
    if (!existingIds.has(s.id) && !existingKeySet.has(key)) {
      newSessions.push(s);
      existingIds.add(s.id);
      existingKeySet.add(key);
    }
  });

  const merged = [...currentHistory, ...newSessions].sort((a, b) => b.startTime - a.startTime);

  return {
    merged,
    addedCount: newSessions.length,
  };
}
