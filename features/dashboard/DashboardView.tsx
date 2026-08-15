import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { ProgramSession } from '../../core/types';
import { useNavigate } from 'react-router-dom';

// Sub-Components
import { DashboardHeader } from './components/DashboardHeader';
import { InsightBanner } from './components/InsightBanner';
import { ActivityChartWidget } from './components/ActivityChartWidget';
import { SmartStartWidget } from './components/SmartStartWidget';
import { BentoGrid } from './components/BentoGrid';

interface DashboardViewProps {
  onStartSession: (progName: string, sess: ProgramSession, mode: 'active' | 'log') => void;
  onOpenTools: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onStartSession, onOpenTools }) => {
  // Global Store
  const navigate = useNavigate();
  const history = useStore((s) => s.history);
  const programs = useStore((s) => s.programs);
  const library = useStore((s) => s.library);
  const activeSession = useStore((s) => s.session);
  const dashboardStats = useStore((s) => s.dashboardStats);

  // --- LOGIC: SESSIONS AVAILABILITY ---
  const availableSessions = useMemo(() => {
    const list: { progName: string; sess: ProgramSession }[] = [];
    programs.forEach((p) => {
      p.sessions.forEach((s) => {
        list.push({ progName: p.name, sess: s });
      });
    });
    return list;
  }, [programs]);

  // Fallback values if stats not yet computed
  const stats = dashboardStats || {
    volumeData: [],
    weeklySets: 0,
    insights: { title: 'Bienvenue', text: 'Chargement...' },
    monthSessionCount: 0,
    hasNewPR: false,
  };

  return (
    <div className="animate-zoom-in space-y-6 pt-4 pb-20">
      <DashboardHeader />

      <InsightBanner insight={stats.insights} />

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-2 gap-4">
        <ActivityChartWidget data={stats.volumeData} totalSets={stats.weeklySets} />

        <SmartStartWidget
          activeSession={activeSession}
          availableSessions={availableSessions}
          onStartSession={onStartSession}
          lastSession={history[0]}
        />

        <BentoGrid
          programsCount={programs.length}
          monthSessionCount={stats.monthSessionCount}
          libraryCount={library.filter((l) => !l.isArchived).length}
          hasNewPR={stats.hasNewPR}
          onOpenHistory={() => navigate('/history?tab=calendar')}
          onOpenNotes={() => navigate('/history?tab=notes')}
          onOpenRecords={() => navigate('/history?tab=records')}
          onOpenTools={onOpenTools}
        />
      </div>
    </div>
  );
};
