import React from 'react';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Radio, 
  Wind, 
  Calendar,
  Layers,
  Database,
  Upload
} from 'lucide-react';
import { MONTH_NAMES, DAYS_IN_MONTH_2024, MadridDayOverview } from '../data/analytics';
import { POLLUTANTS } from '../data/pollutants';

interface HeaderTelemetryProps {
  month: number;
  day: number;
  overview: MadridDayOverview;
  onDateChange: (month: number, day: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onOpenDatasetModal?: () => void;
  datasetName?: string;
  isCustomDataset?: boolean;
}

export const HeaderTelemetry: React.FC<HeaderTelemetryProps> = ({
  month,
  day,
  overview,
  onDateChange,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onChangeSpeed,
  onOpenDatasetModal,
  datasetName,
  isCustomDataset
}) => {
  const maxDaysInCurrentMonth = DAYS_IN_MONTH_2024[month - 1];

  const handlePrevDay = () => {
    if (day > 1) {
      onDateChange(month, day - 1);
    } else if (month > 1) {
      const prevMonth = month - 1;
      onDateChange(prevMonth, DAYS_IN_MONTH_2024[prevMonth - 1]);
    }
  };

  const handleNextDay = () => {
    if (day < maxDaysInCurrentMonth) {
      onDateChange(month, day + 1);
    } else if (month < 11) {
      onDateChange(month + 1, 1);
    }
  };

  const dominantPollutant = overview.dominantCityPollutant 
    ? POLLUTANTS[overview.dominantCityPollutant]
    : null;

  const dominantValue = overview.dominantCityPollutant && overview.pollutantAverages[overview.dominantCityPollutant] !== null
    ? overview.pollutantAverages[overview.dominantCityPollutant]
    : null;

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      {/* Top Banner Ribbon */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Logo & Network Identifier */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wind className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  AIRE MADRID
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                    OFICIAL 2024
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Red de Vigilancia de la Calidad del Aire • Ayto. de Madrid
              </p>
            </div>
          </div>

          {/* Real-time Telemetry Metrics Pill */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            
            {/* Status ICA badge */}
            <div className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 font-medium ${overview.cityAverageICA.badgeBg}`}>
              <span 
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: overview.cityAverageICA.color }} 
              />
              <span className="font-mono uppercase tracking-wider text-[11px]">ICA MADRID:</span>
              <span className="font-bold text-white">{overview.cityAverageICA.label}</span>
            </div>

            {/* Dominant Pollutant */}
            {dominantPollutant && (
              <div className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                <span className="text-slate-400">Predominante:</span>
                <span className="font-mono font-semibold text-emerald-400">{dominantPollutant.formula}</span>
                {dominantValue !== null && (
                  <span className="font-mono text-slate-400 tabular-nums">
                    ({dominantValue} {dominantPollutant.unit})
                  </span>
                )}
              </div>
            )}

            {/* Reporting Stations */}
            <div className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Sensores:</span>
              <span className="font-mono text-white font-bold">{overview.activeStationsCount}</span>
              <span className="text-[10px] text-slate-400">estaciones</span>
            </div>

            {/* Valid Data Points */}
            <div className="hidden xl:flex px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-slate-400 items-center gap-1.5 font-mono text-[11px]">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-200 font-bold">{overview.totalValidMeasurements.toLocaleString('es-ES')}</span> mediciones
            </div>

            {/* Cargar Dataset Button */}
            {onOpenDatasetModal && (
              <button
                onClick={onOpenDatasetModal}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Cargar o cambiar dataset CSV de calidad del aire"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dataset:</span>
                <span className="max-w-[120px] truncate text-slate-200 font-normal">
                  {datasetName || 'Oficial 2024'}
                </span>
                <Upload className="w-3 h-3 text-emerald-400/80 ml-0.5" />
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Date Scrubber & Playback Controls Bar */}
      <div className="bg-slate-900/80 border-t border-slate-800/60 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Controls: Prev, Play/Pause, Next */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              title="Día anterior"
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60 disabled:opacity-30"
              disabled={month === 1 && day === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs font-medium transition-all border ${
                isPlaying 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/40'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSAR SIMULACIÓN</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>REPRODUCIR AÑO</span>
                </>
              )}
            </button>

            <button
              onClick={handleNextDay}
              title="Día siguiente"
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60 disabled:opacity-30"
              disabled={month === 11 && day === 30}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Playback speed selector */}
            {isPlaying && (
              <div className="flex items-center gap-1 ml-2 text-xs font-mono text-slate-400">
                <span className="text-[10px]">Vel:</span>
                {[1, 2, 4].map(s => (
                  <button
                    key={s}
                    onClick={() => onChangeSpeed(s)}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      playbackSpeed === s
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Current Date Display & Dropdown Picker */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <div className="flex items-center gap-1.5">
                {/* Day selector */}
                <select
                  value={day}
                  onChange={(e) => onDateChange(month, Number(e.target.value))}
                  className="bg-transparent text-white font-mono font-semibold text-sm focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: maxDaysInCurrentMonth }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d} className="bg-slate-900 text-white">
                      {String(d).padStart(2, '0')}
                    </option>
                  ))}
                </select>

                <span className="text-slate-500 text-xs">de</span>

                {/* Month selector */}
                <select
                  value={month}
                  onChange={(e) => {
                    const newMonth = Number(e.target.value);
                    const maxDaysNew = DAYS_IN_MONTH_2024[newMonth - 1];
                    const safeDay = Math.min(day, maxDaysNew);
                    onDateChange(newMonth, safeDay);
                  }}
                  className="bg-transparent text-emerald-400 font-semibold text-sm focus:outline-none cursor-pointer"
                >
                  {MONTH_NAMES.map((mName, idx) => (
                    <option key={idx + 1} value={idx + 1} className="bg-slate-900 text-white">
                      {mName}
                    </option>
                  ))}
                </select>

                <span className="text-slate-500 font-mono text-xs">2024</span>
              </div>
            </div>

            {/* Quick Season Jump shortcuts */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <span className="text-slate-500 mr-1 text-[10px]">Temporada:</span>
              <button
                onClick={() => onDateChange(1, 15)}
                className={`px-1.5 py-0.5 rounded transition-colors ${month <= 2 ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/40' : 'hover:text-slate-200'}`}
              >
                Invierno
              </button>
              <button
                onClick={() => onDateChange(4, 15)}
                className={`px-1.5 py-0.5 rounded transition-colors ${month >= 3 && month <= 5 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'hover:text-slate-200'}`}
              >
                Primavera
              </button>
              <button
                onClick={() => onDateChange(7, 15)}
                className={`px-1.5 py-0.5 rounded transition-colors ${month >= 6 && month <= 8 ? 'bg-amber-950 text-amber-400 border border-amber-800/40' : 'hover:text-slate-200'}`}
              >
                Verano
              </button>
              <button
                onClick={() => onDateChange(10, 15)}
                className={`px-1.5 py-0.5 rounded transition-colors ${month >= 9 ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/40' : 'hover:text-slate-200'}`}
              >
                Otoño
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
