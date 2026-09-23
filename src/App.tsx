/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HeaderTelemetry } from './components/HeaderTelemetry';
import { NavigationTabs, TabType } from './components/NavigationTabs';
import { MadridMap } from './components/MadridMap';
import { TimeSeriesChart } from './components/TimeSeriesChart';
import { HeatmapView } from './components/HeatmapView';
import { PollutantMatrix } from './components/PollutantMatrix';
import { StationComparator } from './components/StationComparator';
import { HealthAdvisory } from './components/HealthAdvisory';
import { DatasetView } from './components/DatasetView';
import { DatasetModal } from './components/DatasetModal';
import { DatasetProvider, useDataset } from './data/datasetContext';
import { DAYS_IN_MONTH_2024 } from './data/analytics';
import { Database } from 'lucide-react';

function DashboardContent() {
  const { 
    meta, 
    getMadridDayOverview, 
    activeStationIds,
    availableMonths 
  } = useDataset();

  // Global simulation date state
  const [month, setMonth] = useState<number>(10); // Octubre
  const [day, setDay] = useState<number>(15);

  // Modal state
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState<boolean>(false);

  // Playback animation state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Navigation state
  const [activeTab, setActiveTab] = useState<TabType>('map');

  // Deep-dive state
  const [selectedStationId, setSelectedStationId] = useState<number>(() => activeStationIds[0] || 8);
  const [selectedPollutantId, setSelectedPollutantId] = useState<number>(8); // NO2

  // Sync selectedStationId when activeStationIds change
  useEffect(() => {
    if (activeStationIds.length > 0 && !activeStationIds.includes(selectedStationId)) {
      setSelectedStationId(activeStationIds[0]);
    }
  }, [activeStationIds, selectedStationId]);

  // If current month is not in availableMonths, adjust
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(month)) {
      setMonth(availableMonths[0]);
    }
  }, [availableMonths, month]);

  // Computed Madrid daily overview using dynamic dataset context
  const overview = useMemo(() => {
    return getMadridDayOverview(month, day);
  }, [getMadridDayOverview, month, day]);

  // Handle date changes
  const handleDateChange = useCallback((newMonth: number, newDay: number) => {
    setMonth(newMonth);
    setDay(newDay);
  }, []);

  // Jump to specific time series
  const handleNavigateToSeries = useCallback((stationId: number, pollutantId: number) => {
    setSelectedStationId(stationId);
    setSelectedPollutantId(pollutantId);
    setActiveTab('timeseries');
  }, []);

  // Playback timer effect
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(200, 750 / playbackSpeed);
    const timer = setInterval(() => {
      setDay((prevDay) => {
        const maxDays = DAYS_IN_MONTH_2024[month - 1] || 30;
        if (prevDay < maxDays) {
          return prevDay + 1;
        } else {
          // Advance month
          setMonth((prevMonth) => {
            const nextIdx = availableMonths.indexOf(prevMonth) + 1;
            if (nextIdx < availableMonths.length) {
              return availableMonths[nextIdx];
            } else if (availableMonths.length > 0) {
              return availableMonths[0]; // Loop back
            }
            return 1;
          });
          return 1;
        }
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, month, availableMonths]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans bg-grid-pattern selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* 1. Top Persistent Telemetry Ribbon & Playback Bar */}
      <HeaderTelemetry
        month={month}
        day={day}
        overview={overview}
        onDateChange={handleDateChange}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={setPlaybackSpeed}
        onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
        datasetName={meta.name}
        isCustomDataset={meta.isCustom}
      />

      {/* 2. Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        datasetName={meta.name}
      />

      {/* 3. Main Dynamic Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'map' && (
          <MadridMap
            month={month}
            day={day}
            selectedStationId={selectedStationId}
            onSelectStation={setSelectedStationId}
            onNavigateToSeries={handleNavigateToSeries}
          />
        )}

        {activeTab === 'timeseries' && (
          <TimeSeriesChart
            initialStationId={selectedStationId}
            initialPollutantId={selectedPollutantId}
            currentMonth={month}
            currentDay={day}
            onSelectDate={handleDateChange}
          />
        )}

        {activeTab === 'heatmap' && (
          <HeatmapView
            currentMonth={month}
            currentDay={day}
            onSelectDate={handleDateChange}
          />
        )}

        {activeTab === 'pollutants' && (
          <PollutantMatrix
            overview={overview}
            onNavigateToSeries={handleNavigateToSeries}
          />
        )}

        {activeTab === 'compare' && (
          <StationComparator
            onNavigateToSeries={handleNavigateToSeries}
          />
        )}

        {activeTab === 'health' && (
          <HealthAdvisory
            overview={overview}
            currentMonth={month}
            currentDay={day}
          />
        )}

        {activeTab === 'dataset' && (
          <DatasetView />
        )}

      </main>

      {/* 4. Dataset Modal */}
      <DatasetModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
      />

      {/* 5. Telemetry Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>
              Dataset Activo:{' '}
              <span className="text-white font-medium">
                {meta.name}
              </span>{' '}
              ({meta.source})
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
            <span>{meta.totalRecords} series</span>
            <span>•</span>
            <span>{activeStationIds.length} estaciones</span>
            <span>•</span>
            <span>Directiva UE 2008/50/CE</span>
          </div>

        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <DatasetProvider>
      <DashboardContent />
    </DatasetProvider>
  );
}
