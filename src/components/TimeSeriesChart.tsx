import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  ShieldAlert, 
  ZoomIn, 
  Filter,
  Layers,
  ChevronDown
} from 'lucide-react';
import { STATIONS, Station } from '../data/stations';
import { POLLUTANTS, POLLUTANT_LIST, PollutantInfo, getICAStatus } from '../data/pollutants';
import { 
  TimeSeriesPoint, 
  MONTH_NAMES, 
  MONTH_SHORT_NAMES, 
  DAYS_IN_MONTH_2024 
} from '../data/analytics';
import { useDataset } from '../data/datasetContext';

interface TimeSeriesChartProps {
  initialStationId?: number;
  initialPollutantId?: number;
  currentMonth: number;
  currentDay: number;
  onSelectDate: (month: number, day: number) => void;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  initialStationId = 8, // Escuelas Aguirre
  initialPollutantId = 8, // NO2
  currentMonth,
  currentDay,
  onSelectDate
}) => {
  const { activeStationIds, getTimeSeries, getPollutantAnnualStats } = useDataset();
  const [stationId, setStationId] = useState<number>(initialStationId);
  const [pollutantId, setPollutantId] = useState<number>(initialPollutantId);
  const [compareStationId, setCompareStationId] = useState<number | null>(() => {
    return activeStationIds.find(id => id !== initialStationId) ?? null;
  });
  const [rangeMode, setRangeMode] = useState<'year' | 'month' | 'season'>('year');
  const [selectedSeason, setSelectedSeason] = useState<'winter' | 'spring' | 'summer' | 'autumn'>('autumn');
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesPoint | null>(null);
  const [showWhoLimit, setShowWhoLimit] = useState(true);
  const [showEuLimit, setShowEuLimit] = useState(true);

  const pollutant = POLLUTANTS[pollutantId] || POLLUTANTS[8];
  const station = STATIONS[stationId] || STATIONS[8];
  const compareStation = compareStationId ? STATIONS[compareStationId] : null;

  // Retrieve raw time series for primary station
  const fullSeries1 = useMemo(() => {
    return getTimeSeries(stationId, pollutantId);
  }, [stationId, pollutantId]);

  // Retrieve raw time series for compare station if enabled
  const fullSeries2 = useMemo(() => {
    if (!compareStationId) return null;
    return getTimeSeries(compareStationId, pollutantId);
  }, [compareStationId, pollutantId]);

  // Filter series according to selected range
  const filteredSeries = useMemo(() => {
    if (rangeMode === 'year') {
      return fullSeries1;
    }
    if (rangeMode === 'month') {
      return fullSeries1.filter(p => p.month === currentMonth);
    }
    // Season filter
    if (selectedSeason === 'winter') {
      return fullSeries1.filter(p => p.month === 1 || p.month === 2);
    }
    if (selectedSeason === 'spring') {
      return fullSeries1.filter(p => p.month >= 3 && p.month <= 5);
    }
    if (selectedSeason === 'summer') {
      return fullSeries1.filter(p => p.month >= 6 && p.month <= 8);
    }
    // Autumn
    return fullSeries1.filter(p => p.month >= 9 && p.month <= 11);
  }, [fullSeries1, rangeMode, currentMonth, selectedSeason]);

  // Filter compare series
  const filteredCompareSeries = useMemo(() => {
    if (!fullSeries2) return null;
    if (rangeMode === 'year') {
      return fullSeries2;
    }
    if (rangeMode === 'month') {
      return fullSeries2.filter(p => p.month === currentMonth);
    }
    if (selectedSeason === 'winter') {
      return fullSeries2.filter(p => p.month === 1 || p.month === 2);
    }
    if (selectedSeason === 'spring') {
      return fullSeries2.filter(p => p.month >= 3 && p.month <= 5);
    }
    if (selectedSeason === 'summer') {
      return fullSeries2.filter(p => p.month >= 6 && p.month <= 8);
    }
    return fullSeries2.filter(p => p.month >= 9 && p.month <= 11);
  }, [fullSeries2, rangeMode, currentMonth, selectedSeason]);

  // Annual statistics
  const stats = useMemo(() => {
    return getPollutantAnnualStats(stationId, pollutantId);
  }, [stationId, pollutantId]);

  // Chart dimensions & scaling
  const chartWidth = 960;
  const chartHeight = 360;
  const padding = { top: 25, right: 35, bottom: 45, left: 55 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate Max Y value for scaling
  const maxY = useMemo(() => {
    let max = 0;
    for (const p of filteredSeries) {
      if (p.value !== null && p.value > max) max = p.value;
    }
    if (filteredCompareSeries) {
      for (const p of filteredCompareSeries) {
        if (p.value !== null && p.value > max) max = p.value;
      }
    }
    if (pollutant.whoGuidelineDaily && pollutant.whoGuidelineDaily > max) max = pollutant.whoGuidelineDaily;
    if (pollutant.euLimitDaily && pollutant.euLimitDaily > max) max = pollutant.euLimitDaily;
    return Math.ceil(max * 1.15) || 50;
  }, [filteredSeries, filteredCompareSeries, pollutant]);

  // Point mapping helpers
  const getX = (index: number, total: number) => {
    if (total <= 1) return padding.left;
    return padding.left + (index / (total - 1)) * innerWidth;
  };

  const getY = (val: number | null) => {
    if (val === null) return padding.top + innerHeight;
    const clamped = Math.max(0, Math.min(val, maxY));
    return padding.top + innerHeight - (clamped / maxY) * innerHeight;
  };

  // Build SVG path string for primary series
  const linePath = useMemo(() => {
    const total = filteredSeries.length;
    let d = '';
    let started = false;

    filteredSeries.forEach((pt, i) => {
      if (pt.value === null) {
        started = false;
        return;
      }
      const x = getX(i, total);
      const y = getY(pt.value);
      if (!started) {
        d += `M ${x} ${y} `;
        started = true;
      } else {
        d += `L ${x} ${y} `;
      }
    });

    return d;
  }, [filteredSeries, maxY]);

  // Build Area Path for primary series fill
  const areaPath = useMemo(() => {
    const total = filteredSeries.length;
    if (total === 0) return '';
    const points: { x: number; y: number }[] = [];

    filteredSeries.forEach((pt, i) => {
      if (pt.value !== null) {
        points.push({ x: getX(i, total), y: getY(pt.value) });
      }
    });

    if (points.length === 0) return '';
    const bottomY = padding.top + innerHeight;
    let d = `M ${points[0].x} ${bottomY} L ${points[0].x} ${points[0].y} `;
    for (let i = 1; i < points.length; i++) {
      d += `L ${points[i].x} ${points[i].y} `;
    }
    d += `L ${points[points.length - 1].x} ${bottomY} Z`;
    return d;
  }, [filteredSeries, maxY]);

  // Build SVG path string for compare series
  const compareLinePath = useMemo(() => {
    if (!filteredCompareSeries) return '';
    const total = filteredCompareSeries.length;
    let d = '';
    let started = false;

    filteredCompareSeries.forEach((pt, i) => {
      if (pt.value === null) {
        started = false;
        return;
      }
      const x = getX(i, total);
      const y = getY(pt.value);
      if (!started) {
        d += `M ${x} ${y} `;
        started = true;
      } else {
        d += `L ${x} ${y} `;
      }
    });

    return d;
  }, [filteredCompareSeries, maxY]);

  // Generate X axis ticks
  const xTicks = useMemo(() => {
    const ticks: { x: number; label: string }[] = [];
    const total = filteredSeries.length;
    if (total === 0) return ticks;

    if (rangeMode === 'year') {
      // Show tick at beginning of each month
      let lastMonth = 0;
      filteredSeries.forEach((pt, i) => {
        if (pt.month !== lastMonth) {
          ticks.push({
            x: getX(i, total),
            label: MONTH_SHORT_NAMES[pt.month - 1]
          });
          lastMonth = pt.month;
        }
      });
    } else {
      // Step by 5 days
      filteredSeries.forEach((pt, i) => {
        if (pt.day === 1 || pt.day % 5 === 0 || pt.day === filteredSeries.length) {
          ticks.push({
            x: getX(i, total),
            label: `${pt.day} ${MONTH_SHORT_NAMES[pt.month - 1]}`
          });
        }
      });
    }
    return ticks;
  }, [filteredSeries, rangeMode]);

  // Generate Y axis ticks
  const yTicks = useMemo(() => {
    const count = 5;
    const ticks: { y: number; val: number }[] = [];
    for (let i = 0; i <= count; i++) {
      const val = Math.round((maxY / count) * i);
      ticks.push({
        val,
        y: getY(val)
      });
    }
    return ticks;
  }, [maxY]);

  return (
    <div className="space-y-6">
      
      {/* Selector Controls Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Station & Pollutant Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Primary Station */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Estación Principal
              </label>
              <select
                value={stationId}
                onChange={(e) => setStationId(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {activeStationIds.map(id => (
                  <option key={id} value={id}>
                    {STATIONS[id]?.name || `Estación #${id}`} {STATIONS[id]?.typeLabel ? `(${STATIONS[id].typeLabel})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Pollutant Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Parámetro Atmosférico
              </label>
              <select
                value={pollutantId}
                onChange={(e) => setPollutantId(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {POLLUTANT_LIST.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.formula} - {p.name} ({p.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Compare Station Selector (Optional) */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>Comparar Con:</span>
              </label>
              <select
                value={compareStationId ?? ''}
                onChange={(e) => setCompareStationId(e.target.value ? Number(e.target.value) : null)}
                className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-semibold text-cyan-400 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="">(Ninguna - Vista individual)</option>
                {activeStationIds.filter(id => id !== stationId).map(id => (
                  <option key={id} value={id}>
                    {STATIONS[id]?.name || `Estación #${id}`}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Time Range Selectors */}
          <div className="flex flex-col gap-1 items-end">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Ventana Temporal
            </span>
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setRangeMode('year')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  rangeMode === 'year'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Todo 2024
              </button>

              <button
                onClick={() => setRangeMode('month')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  rangeMode === 'month'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Mes ({MONTH_SHORT_NAMES[currentMonth - 1]})
              </button>

              <button
                onClick={() => setRangeMode('season')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  rangeMode === 'season'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Estación
              </button>
            </div>
          </div>

        </div>

        {/* Threshold toggles and Season sub-selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          
          <div className="flex items-center gap-4">
            {pollutant.whoGuidelineDaily && (
              <label className="flex items-center gap-1.5 cursor-pointer text-amber-300 select-none">
                <input
                  type="checkbox"
                  checked={showWhoLimit}
                  onChange={(e) => setShowWhoLimit(e.target.checked)}
                  className="rounded border-amber-500 text-amber-500 focus:ring-0"
                />
                <span className="font-mono text-[11px]">
                  Guía Diaria OMS ({pollutant.whoGuidelineDaily} {pollutant.unit})
                </span>
              </label>
            )}

            {(pollutant.euLimitDaily || pollutant.euLimitAnnual) && (
              <label className="flex items-center gap-1.5 cursor-pointer text-red-400 select-none">
                <input
                  type="checkbox"
                  checked={showEuLimit}
                  onChange={(e) => setShowEuLimit(e.target.checked)}
                  className="rounded border-red-500 text-red-500 focus:ring-0"
                />
                <span className="font-mono text-[11px]">
                  Límite Legal UE ({pollutant.euLimitDaily ?? pollutant.euLimitAnnual} {pollutant.unit})
                </span>
              </label>
            )}
          </div>

          {rangeMode === 'season' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-400">Temporada:</span>
              {[
                { id: 'winter', label: 'Invierno' },
                { id: 'spring', label: 'Primavera' },
                { id: 'summer', label: 'Verano' },
                { id: 'autumn', label: 'Otoño' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSeason(s.id as any)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    selectedSeason === s.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* KPI Stats Ribbon */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              MEDIA ANUAL 2024
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">{stats.mean}</span>
              <span className="text-xs text-slate-400 font-mono">{pollutant.unit}</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {stats.totalValidDays} días con mediciones válidas
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              MÁXIMO HISTÓRICO 2024
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">{stats.max}</span>
              <span className="text-xs text-slate-400 font-mono">{pollutant.unit}</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block font-mono">
              Registrado: {stats.maxDate}
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              SUPERACIONES GUÍA OMS
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-2xl font-bold font-mono tabular-nums ${stats.daysExceedingWho > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {stats.daysExceedingWho}
              </span>
              <span className="text-xs text-slate-400 font-mono">días &gt; {pollutant.whoGuidelineDaily ?? '--'}</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {pollutant.whoGuidelineDaily ? `${Math.round((stats.daysExceedingWho / stats.totalValidDays) * 100)}% del año` : 'Sin umbral OMS diario'}
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              SUPERACIONES LÍMITE UE
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-2xl font-bold font-mono tabular-nums ${stats.daysExceedingEu > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {stats.daysExceedingEu}
              </span>
              <span className="text-xs text-slate-400 font-mono">días &gt; {pollutant.euLimitDaily ?? pollutant.euLimitAnnual ?? '--'}</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Directiva Calidad del Aire UE
            </span>
          </div>

        </div>
      )}

      {/* SVG Interactive Line Chart Container */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-2xl">
        
        {/* Chart Header & Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono tracking-tight">
              {station.name} — {pollutant.name} ({pollutant.formula})
            </h3>
            {compareStation && (
              <span className="text-xs font-mono text-cyan-400 flex items-center gap-1">
                vs <span className="font-bold underline">{compareStation.name}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-1 bg-emerald-400 rounded-full inline-block" />
              <span>{station.shortName}</span>
            </div>
            {compareStation && (
              <div className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-3 h-1 bg-cyan-400 rounded-full inline-block" />
                <span>{compareStation.shortName}</span>
              </div>
            )}
          </div>
        </div>

        {/* SVG Drawing Canvas */}
        <div className="relative w-full aspect-[960/360] select-none">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full overflow-visible"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              {/* Primary Line Gradient */}
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines & Y-axis labels */}
            {yTicks.map(t => (
              <g key={`y-${t.val}`}>
                <line
                  x1={padding.left}
                  y1={t.y}
                  x2={padding.left + innerWidth}
                  y2={t.y}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={t.y + 3.5}
                  textAnchor="end"
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {t.val}
                </text>
              </g>
            ))}

            {/* Vertical Month/Day Grid lines & X-axis labels */}
            {xTicks.map((t, idx) => (
              <g key={`x-${idx}`}>
                <line
                  x1={t.x}
                  y1={padding.top}
                  x2={t.x}
                  y2={padding.top + innerHeight}
                  stroke="rgba(255, 255, 255, 0.04)"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={t.x}
                  y={padding.top + innerHeight + 18}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {t.label}
                </text>
              </g>
            ))}

            {/* WHO Guideline Threshold Line */}
            {showWhoLimit && pollutant.whoGuidelineDaily && pollutant.whoGuidelineDaily <= maxY && (
              <g>
                <line
                  x1={padding.left}
                  y1={getY(pollutant.whoGuidelineDaily)}
                  x2={padding.left + innerWidth}
                  y2={getY(pollutant.whoGuidelineDaily)}
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
                <text
                  x={padding.left + innerWidth}
                  y={getY(pollutant.whoGuidelineDaily) - 5}
                  textAnchor="end"
                  fill="#F59E0B"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  OMS: {pollutant.whoGuidelineDaily} {pollutant.unit}
                </text>
              </g>
            )}

            {/* EU Legal Limit Threshold Line */}
            {showEuLimit && (pollutant.euLimitDaily || pollutant.euLimitAnnual) && (
              (() => {
                const limit = pollutant.euLimitDaily ?? pollutant.euLimitAnnual!;
                if (limit > maxY) return null;
                return (
                  <g>
                    <line
                      x1={padding.left}
                      y1={getY(limit)}
                      x2={padding.left + innerWidth}
                      y2={getY(limit)}
                      stroke="#EF4444"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                    <text
                      x={padding.left + 5}
                      y={getY(limit) - 5}
                      textAnchor="start"
                      fill="#EF4444"
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      LÍMITE UE: {limit} {pollutant.unit}
                    </text>
                  </g>
                );
              })()
            )}

            {/* Area Fill for primary series */}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#areaGradient)"
              />
            )}

            {/* Compare Station Line (if active) */}
            {compareLinePath && (
              <path
                d={compareLinePath}
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
            )}

            {/* Primary Station Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="url(#strokeGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive invisible hover hitboxes for each point */}
            {filteredSeries.map((pt, i) => {
              const x = getX(i, filteredSeries.length);
              const y = getY(pt.value);
              const isCurrentDay = pt.month === currentMonth && pt.day === currentDay;

              return (
                <g key={i}>
                  {/* Current Day marker on timeline */}
                  {isCurrentDay && (
                    <g>
                      <line
                        x1={x}
                        y1={padding.top}
                        x2={x}
                        y2={padding.top + innerHeight}
                        stroke="#10B981"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r="6"
                        fill="#10B981"
                        stroke="#064E3B"
                        strokeWidth="2"
                      />
                    </g>
                  )}

                  {/* Hitbox area */}
                  <rect
                    x={x - (innerWidth / filteredSeries.length) / 2}
                    y={padding.top}
                    width={Math.max(6, innerWidth / filteredSeries.length)}
                    height={innerHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onClick={() => onSelectDate(pt.month, pt.day)}
                  />
                </g>
              );
            })}

            {/* Hover Crosshair & Tooltip Anchor */}
            {hoveredPoint && (
              (() => {
                const idx = filteredSeries.findIndex(p => p.month === hoveredPoint.month && p.day === hoveredPoint.day);
                if (idx === -1) return null;
                const x = getX(idx, filteredSeries.length);
                const y = getY(hoveredPoint.value);

                return (
                  <g pointerEvents="none">
                    {/* Vertical crosshair line */}
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + innerHeight}
                      stroke="rgba(255, 255, 255, 0.4)"
                      strokeWidth="1"
                    />

                    {/* Point highlight circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r="6.5"
                      fill="#0F172A"
                      stroke={hoveredPoint.ica.color}
                      strokeWidth="3"
                    />
                  </g>
                );
              })()
            )}
          </svg>

          {/* Floating Hover Card Inspector */}
          {hoveredPoint && (
            <div 
              className="absolute top-2 right-4 bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs font-mono pointer-events-none"
            >
              <div className="flex items-center justify-between gap-3 pb-1.5 border-b border-slate-800">
                <span className="font-bold text-white">
                  {hoveredPoint.day} {MONTH_NAMES[hoveredPoint.month - 1]} 2024
                </span>
                <span 
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{ backgroundColor: hoveredPoint.ica.color + '33', color: hoveredPoint.ica.color }}
                >
                  {hoveredPoint.ica.label}
                </span>
              </div>

              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">{station.shortName}:</span>
                  <span className="font-bold text-white tabular-nums">
                    {hoveredPoint.value !== null ? `${hoveredPoint.value} ${pollutant.unit}` : 'Sin datos'}
                  </span>
                </div>

                {filteredCompareSeries && (
                  (() => {
                    const compPt = filteredCompareSeries.find(p => p.month === hoveredPoint.month && p.day === hoveredPoint.day);
                    return (
                      <div className="flex items-center justify-between gap-4 text-cyan-400">
                        <span>{compareStation?.shortName}:</span>
                        <span className="font-bold tabular-nums">
                          {compPt?.value !== null ? `${compPt?.value} ${pollutant.unit}` : 'Sin datos'}
                        </span>
                      </div>
                    );
                  })()
                )}

                {pollutant.whoGuidelineDaily && hoveredPoint.value !== null && (
                  <div className="text-[10px] pt-1 text-slate-400">
                    {hoveredPoint.value > pollutant.whoGuidelineDaily ? (
                      <span className="text-amber-400">
                        ⚠️ +{Math.round(((hoveredPoint.value - pollutant.whoGuidelineDaily) / pollutant.whoGuidelineDaily) * 100)}% sobre recomendación OMS
                      </span>
                    ) : (
                      <span className="text-emerald-400">
                        ✓ Por debajo del umbral OMS
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-2 pt-1 border-t border-slate-800 text-[9px] text-slate-500 text-center">
                Clic para fijar fecha en el simulador
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
