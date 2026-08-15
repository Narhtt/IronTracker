import { WorkoutSession, LibraryExercise, DashboardStats, InsightItem } from '../core/types';
import { STORAGE_KEYS } from '../core/constants';

// Helper pour le numéro de semaine
const getWeekKey = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
};

export const indexer = {
  calculateDashboardStats: (history: WorkoutSession[], library: LibraryExercise[]): DashboardStats => {
    const now = Date.now();
    const today = new Date();

    // --- OPTIMIZATION: LIBRARY MAP O(1) ---
    const libMap = new Map<number, LibraryExercise>();
    library.forEach((l) => libMap.set(l.id, l));

    // --- 1. VOLUME CHART DATA ---
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const volumeData = days.map((d) => ({ day: d, val: 0 }));
    let weeklySets = 0;

    // --- 2. MONTH STATS ---
    let monthSessionCount = 0;
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // --- 3. PR DETECTION ---
    let hasNewPR = false;

    // --- 4. PREP DATA FOR INSIGHTS ---
    const muscleVolumes: Record<string, number> = {};
    const last14Days = now - 14 * 24 * 3600 * 1000;

    // History Traversal
    if (history.length > 0) {
      history.forEach((s) => {
        const d = new Date(s.startTime);

        // Month Count
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          monthSessionCount++;
        }

        // Weekly Volume
        if (s.startTime >= startOfWeek.getTime()) {
          let sDayIdx = d.getDay() - 1;
          if (sDayIdx === -1) sDayIdx = 6;
          const setPayload = s.exercises.reduce((acc, ex) => acc + ex.sets.filter((st) => st.done && !st.isWarmup).length, 0);
          if (volumeData[sDayIdx]) {
            volumeData[sDayIdx].val += setPayload;
          }
          weeklySets += setPayload;
        }

        // Muscle Volume (Last 14d) for Focus Insight
        if (s.startTime > last14Days) {
          s.exercises.forEach((e) => {
            const lib = libMap.get(e.exerciseId);
            if (lib && lib.muscle) {
              muscleVolumes[lib.muscle] = (muscleVolumes[lib.muscle] || 0) + e.sets.filter((st) => st.done && !st.isWarmup).length;
            }
          });
        }
      });

      // PR Check (Simplified)
      if (history.length >= 2) {
        const lastSession = history[0];
        const lastSeen = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_SEEN_PR) || '0');
        if (lastSession.startTime > lastSeen) {
          hasNewPR = true;
        }
      }
    }

    // --- 5. GENERATE TRI-FORCE INSIGHTS ---
    const insightsList: InsightItem[] = [];

    if (history.length === 0) {
      insightsList.push({
        id: 'welcome',
        title: 'Démarrage',
        text: 'Bienvenue. Lancez votre première séance.',
        level: 'info',
        priority: 1,
      });
    } else {
      // A. CONSISTENCY FLAME (Streak)
      let streak = 0;
      const weeksSet = new Set<string>();
      history.forEach((h) => weeksSet.add(getWeekKey(new Date(h.startTime))));

      // Check consecutive weeks backwards from current week
      const checkDate = new Date();
      const currentWeekKey = getWeekKey(checkDate);

      // If trained this week, count it
      if (weeksSet.has(currentWeekKey)) streak++;

      // Check previous weeks
      while (true) {
        checkDate.setDate(checkDate.getDate() - 7);
        const prevKey = getWeekKey(checkDate);
        if (weeksSet.has(prevKey)) {
          streak++;
        } else {
          break;
        }
      }

      insightsList.push({
        id: 'streak',
        title: 'Régularité',
        text: streak > 1 ? `Série en cours : ${streak} semaines.` : 'Objectif : une séance par semaine.',
        level: streak > 2 ? 'success' : 'info',
        priority: 1,
      });

      // B. READINESS MONITOR (Fatigue)
      const recentSessions = history.slice(0, 3);
      if (recentSessions.length > 0) {
        const avgRPE = recentSessions.reduce((acc, s) => acc + (parseInt(s.fatigue) || 3), 0) / recentSessions.length;
        let rpeText = 'Système opérationnel. Go hard.';
        let rpeLevel: 'success' | 'warning' | 'danger' = 'success';

        if (avgRPE >= 4.0) {
          rpeText = 'Surcharge détectée. Deload conseillé.';
          rpeLevel = 'danger';
        } else if (avgRPE >= 3.2) {
          rpeText = 'Fatigue croissante. Surveillez la récup.';
          rpeLevel = 'warning';
        }

        insightsList.push({
          id: 'readiness',
          title: 'État de Forme',
          text: rpeText,
          level: rpeLevel,
          priority: 2,
        });
      }

      // C. SMART FOCUS (Lagging Part)
      const trackedMuscles = ['Pectoraux', 'Dos', 'Jambes', 'Épaules', 'Bras'];
      let minVol = 999;
      let focusMuscle = null;

      trackedMuscles.forEach((m) => {
        let vol = 0;

        // Aggregation Logic for Legs
        if (m === 'Jambes') {
          vol =
            (muscleVolumes['Jambes'] || 0) +
            (muscleVolumes['Quadriceps'] || 0) +
            (muscleVolumes['Ischios'] || 0) +
            (muscleVolumes['Fessiers'] || 0) +
            (muscleVolumes['Mollets'] || 0);
        } else {
          vol = muscleVolumes[m] || 0;
        }

        if (vol < minVol) {
          minVol = vol;
          focusMuscle = m;
        }
      });

      if (focusMuscle) {
        insightsList.push({
          id: 'focus',
          title: 'Focus Prioritaire',
          text: minVol === 0 ? `Aucun volume sur ${focusMuscle} (14j).` : `Faible volume sur ${focusMuscle}.`,
          level: 'info',
          priority: 3,
        });
      }
    }

    return {
      volumeData,
      weeklySets,
      insights: insightsList,
      monthSessionCount,
      hasNewPR,
      lastUpdated: now,
    };
  },
};
