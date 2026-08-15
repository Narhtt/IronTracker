import React, { useState } from 'react';
import { useAnalyticsData } from './hooks/useAnalyticsData';

// Components
import { AnalyticsHeader } from './components/AnalyticsHeader';
import { OverviewCards } from './components/OverviewCards';
import { VolumeFatigueChart } from './components/VolumeFatigueChart';
import { WeeklyVolumeChart } from './components/WeeklyVolumeChart';
import { EquipmentDonut } from './components/EquipmentDonut';
import { SBDRadar } from './components/SBDRadar';
import { ExerciseDetailChart } from './components/ExerciseDetailChart';
import { SBDInfoModal, VolumeInfoModal, FatigueInfoModal, EquipmentInfoModal } from './components/AnalyticsModals';

export const AnalyticsView: React.FC = () => {
  const {
    period,
    setPeriod,
    selectedDetailExo,
    setSelectedDetailExo,
    detailMetric,
    setDetailMetric,
    volumeMode,
    setVolumeMode,
    isTimeBased,
    isCardio,
    library,
    overviewStats,
    volFatigueData,
    weeklyVolumeData,
    equipmentData,
    exerciseDetailData,
    sbdStats,
  } = useAnalyticsData();

  // Modal States
  const [showSBDInfo, setShowSBDInfo] = useState(false);
  const [showVolumeInfo, setShowVolumeInfo] = useState(false);
  const [showFatigueInfo, setShowFatigueInfo] = useState(false);
  const [showEquipInfo, setShowEquipInfo] = useState(false);

  return (
    <div className="space-y-6 pb-24 animate-zoom-in relative pt-4">
      <AnalyticsHeader period={period} setPeriod={setPeriod} />

      <OverviewCards stats={overviewStats} />

      <VolumeFatigueChart data={volFatigueData} onInfoClick={() => setShowFatigueInfo(true)} />

      <WeeklyVolumeChart data={weeklyVolumeData} mode={volumeMode} setMode={setVolumeMode} onInfoClick={() => setShowVolumeInfo(true)} />

      <div className="grid grid-cols-2 gap-3 relative">
        <EquipmentDonut data={equipmentData} onInfoClick={() => setShowEquipInfo(true)} />
        <SBDRadar stats={sbdStats} onInfoClick={() => setShowSBDInfo(true)} />
      </div>

      <ExerciseDetailChart
        data={exerciseDetailData}
        library={library}
        selectedExo={selectedDetailExo}
        setSelectedExo={setSelectedDetailExo}
        metric={detailMetric}
        setMetric={setDetailMetric}
        isTimeBased={isTimeBased || false}
        isCardio={isCardio || false}
      />

      {/* MODALS */}
      {showSBDInfo && <SBDInfoModal onClose={() => setShowSBDInfo(false)} />}
      {showVolumeInfo && <VolumeInfoModal onClose={() => setShowVolumeInfo(false)} />}
      {showFatigueInfo && <FatigueInfoModal onClose={() => setShowFatigueInfo(false)} />}
      {showEquipInfo && <EquipmentInfoModal onClose={() => setShowEquipInfo(false)} />}
    </div>
  );
};
