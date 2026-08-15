import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HistoryCalendar } from './components/HistoryCalendar';
import { HistoryNotes } from './components/HistoryNotes';
import { RecordsView } from './RecordsView';
import { Icons } from '../../components/icons/Icons';
import { triggerHaptic } from '../../core/utils';
import { ProgramSession } from '../../core/types';
import { useStore } from '../../store/useStore';
import { STORAGE_KEYS } from '../../core/constants';

interface HistoryHubViewProps {
  onStartSession: (progName: string, sess: ProgramSession, mode: 'active' | 'log') => void;
}

export const HistoryHubView: React.FC<HistoryHubViewProps> = ({ onStartSession }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const reindexDashboard = useStore((s) => s.reindexDashboard);

  const getTabFromURL = useCallback(() => {
    const params = new URLSearchParams(location.search);
    return (params.get('tab') as 'calendar' | 'records' | 'notes') || 'calendar';
  }, [location.search]);

  const initialTab = getTabFromURL();
  const [activeTab, setActiveTab] = useState<'calendar' | 'records' | 'notes'>(initialTab);

  // Sync tab state with URL without pushing to history stack on every click
  useEffect(() => {
    const tab = getTabFromURL();
    if (tab && ['calendar', 'records', 'notes'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [getTabFromURL]);

  // Handle "Mark as Seen" for PRs when visiting Records tab
  useEffect(() => {
    if (activeTab === 'records') {
      localStorage.setItem(STORAGE_KEYS.LAST_SEEN_PR, Date.now().toString());
      // Trigger a re-calculation of dashboard stats (to remove the Notification Dot)
      reindexDashboard();
    }
  }, [activeTab, reindexDashboard]);

  const handleTabChange = (tab: 'calendar' | 'records' | 'notes') => {
    triggerHaptic('click');
    setActiveTab(tab);
    navigate(`?tab=${tab}`, { replace: true });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-zoom-in pt-2">
      {/* HUB HEADER & TABS */}
      <div className="flex flex-col gap-4 mb-4 flex-shrink-0">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-2xl font-black italic uppercase text-foreground">
            {activeTab === 'calendar' ? 'Journal' : activeTab === 'records' ? 'Records' : 'Carnet'}
          </h2>
          <div className="bg-surface2/50 p-1 rounded-[1.2rem] border border-white/5 flex gap-1">
            <button
              onClick={() => handleTabChange('calendar')}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'calendar' ? 'bg-primary text-black shadow-lg' : 'text-secondary hover:text-foreground'}`}
            >
              <Icons.Calendar size={20} />
            </button>
            <button
              onClick={() => handleTabChange('records')}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'records' ? 'bg-primary text-black shadow-lg' : 'text-secondary hover:text-foreground'}`}
            >
              <Icons.Records size={20} />
            </button>
            <button
              onClick={() => handleTabChange('notes')}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'notes' ? 'bg-primary text-black shadow-lg' : 'text-secondary hover:text-foreground'}`}
            >
              <Icons.Note size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 min-h-0 relative">
        {activeTab === 'calendar' && <HistoryCalendar onStartSession={onStartSession} />}
        {activeTab === 'records' && <RecordsView />}
        {activeTab === 'notes' && <HistoryNotes />}
      </div>
    </div>
  );
};
