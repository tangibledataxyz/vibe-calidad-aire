import React, { useState, useMemo } from 'react';
import { 
  Navigation, 
  MapPin, 
  Info, 
  Layers, 
  Sliders, 
  ExternalLink, 
  ShieldCheck, 
  Activity,
  Trees,
  Car,
  Building2,
  Wind
} from 'lucide-react';
import { STATIONS, Station } from '../data/stations';
import { POLLUTANTS, getICAStatus, ICAStatus } from '../data/pollutants';
import { DayStationReading, MONTH_NAMES } from '../data/analytics';
import { useDataset } from '../data/datasetContext';

interface MadridMapProps {
  month: number;
  day: number;
  selectedStationId: number;
  onSelectStation: (stationId: number) => void;
  onNavigateToSeries?: (stationId: number, pollutantId: number) => void;
}

// Bounding box for mapping stations accurately
const GEO_BOUNDS = {
  minLat: 40.330,
  maxLat: 40.495,
  minLng: -3.775,
  maxLng: -3.565
};

export const MadridMap: React.FC<MadridMapProps> = ({
  month,
  day,
  selectedStationId,
  onSelectStation,
  onNavigateToSeries
}) => {
  const { activeStationIds, getStationDayReading } = useDataset();
  const [stationFilter, setStationFilter] = useState<'all' | 'traffic' | 'background' | 'suburban'>('all');
  const [metricDisplay, setMetricDisplay] = useState<'ica' | 8 | 10 | 9 | 14>('ica'); // 8=NO2, 10=PM10, 9=PM2.5, 14=O3
  const [showHeatGlow, setShowHeatGlow] = useState(true);

  // SVG dimensions
  const svgWidth = 780;
  const svgHeight = 620;

  // Project geographic coordinates to SVG coordinates
  const projectCoords = (lat: number, lng: number) => {
    const x = ((lng - GEO_BOUNDS.minLng) / (GEO_BOUNDS.maxLng - GEO_BOUNDS.minLng)) * (svgWidth - 100) + 50;
    const y = ((GEO_BOUNDS.maxLat - lat) / (GEO_BOUNDS.maxLat - GEO_BOUNDS.minLat)) * (svgHeight - 100) + 50;
    return { x, y };
  };

  // Get readings for all active stations for the selected day
  const stationReadings = useMemo(() => {
    const list: DayStationReading[] = [];
    for (const sid of activeStationIds) {
      const reading = getStationDayReading(sid, month, day);
      if (reading) list.push(reading);
    }
    return list;
  }, [activeStationIds, getStationDayReading, month, day]);

  // Counts by typology
  const typologyCounts = useMemo(() => {
    const c = { all: stationReadings.length, traffic: 0, background: 0, suburban: 0 };
    for (const r of stationReadings) {
      if (r.station.type === 'traffic') c.traffic++;
      else if (r.station.type === 'background') c.background++;
      else if (r.station.type === 'suburban') c.suburban++;
    }
    return c;
  }, [stationReadings]);

  // Currently inspected station
  const currentStationReading = useMemo(() => {
    return stationReadings.find(r => r.station.id === selectedStationId) || stationReadings[0];
  }, [stationReadings, selectedStationId]);

  // Filtered stations
  const visibleReadings = useMemo(() => {
    if (stationFilter === 'all') return stationReadings;
    return stationReadings.filter(r => r.station.type === stationFilter);
  }, [stationReadings, stationFilter]);

  return (
    <div className="space-y-6">
      
      {/* Control Bar: Typology Filters & Metric overlay selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        
        {/* Typology filter buttons */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-mono text-[11px] mr-1 hidden sm:inline">Tipología:</span>
          {[
            { id: 'all', label: `Todas (${typologyCounts.all})`, icon: Building2 },
            { id: 'traffic', label: `Tráfico (${typologyCounts.traffic})`, icon: Car },
            { id: 'background', label: `Fondo (${typologyCounts.background})`, icon: Building2 },
            { id: 'suburban', label: `Forestal/Sub (${typologyCounts.suburban})`, icon: Trees }
          ].map(f => {
            const Icon = f.icon;
            const active = stationFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setStationFilter(f.id as any)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Metric badge display toggle */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px] hidden md:inline">Indicador en mapa:</span>
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            {[
              { id: 'ica', label: 'ICA General' },
              { id: 8, label: 'NO₂' },
              { id: 10, label: 'PM₁₀' },
              { id: 9, label: 'PM₂.₅' },
              { id: 14, label: 'O₃' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMetricDisplay(m.id as any)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                  metricDisplay === m.id
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowHeatGlow(!showHeatGlow)}
            title="Alternar difusión atmosférica interpolada"
            className={`p-1.5 rounded-lg border transition-colors ${
              showHeatGlow 
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60' 
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Main Grid: Vector GIS Map (Left 7 cols) + Realtime Station Telemetry Inspector (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MAP CONTAINER (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between">
          
          {/* Map Header / Legend */}
          <div className="flex items-center justify-between mb-3 z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold">
                Red Geoespacial • Madrid Capital
              </span>
            </div>
            
            {/* ICA Color Palette Legend */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Muy Buena
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Buena
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Aceptable
              </span>
              <span className="flex items-center gap-1 text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Mala
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Muy Mala
              </span>
            </div>
          </div>

          {/* SVG Canvas Map */}
          <div className="relative w-full aspect-[780/620] bg-slate-950/90 rounded-xl border border-slate-900 overflow-hidden shadow-inner">
            
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full select-none"
            >
              <defs>
                {/* Radial gradients for atmospheric heat diffusion */}
                {visibleReadings.map(sr => {
                  const { x, y } = projectCoords(sr.station.lat, sr.station.lng);
                  return (
                    <radialGradient
                      key={`glow-${sr.station.id}`}
                      id={`glow-${sr.station.id}`}
                      cx="50%"
                      cy="50%"
                      r="50%"
                    >
                      <stop offset="0%" stopColor={sr.dominantICA.color} stopOpacity="0.35" />
                      <stop offset="60%" stopColor={sr.dominantICA.color} stopOpacity="0.10" />
                      <stop offset="100%" stopColor={sr.dominantICA.color} stopOpacity="0" />
                    </radialGradient>
                  );
                })}

                {/* Subtle grid pattern */}
                <pattern id="smallGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Background grid */}
              <rect width="100%" height="100%" fill="url(#smallGrid)" />

              {/* Geographic Features of Madrid */}
              {/* Casa de Campo Forest Area (West) */}
              <polygon
                points="80,180 170,170 210,240 220,340 160,370 100,320 70,240"
                fill="rgba(16, 185, 129, 0.07)"
                stroke="rgba(16, 185, 129, 0.2)"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text x="110" y="270" fill="rgba(52, 211, 153, 0.4)" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                CASA DE CAMPO
              </text>

              {/* Parque del Retiro (Central-East) */}
              <rect
                x="380"
                y="270"
                width="45"
                height="70"
                rx="8"
                fill="rgba(16, 185, 129, 0.09)"
                stroke="rgba(16, 185, 129, 0.25)"
                strokeWidth="1.5"
              />
              <text x="382" y="310" fill="rgba(52, 211, 153, 0.5)" fontSize="9" fontFamily="sans-serif">
                RETIRO
              </text>

              {/* Barajas Airport Zone (Northeast) */}
              <polygon
                points="600,100 740,110 750,210 650,220 590,160"
                fill="rgba(99, 102, 241, 0.06)"
                stroke="rgba(99, 102, 241, 0.2)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text x="630" y="150" fill="rgba(165, 180, 252, 0.4)" fontSize="10" fontFamily="sans-serif">
                AEROPUERTO MADRID-BARAJAS
              </text>

              {/* Manzanares River Corridor (Flowing NW to S) */}
              <path
                d="M 170,120 Q 230,220 225,320 T 260,420 T 320,530"
                fill="none"
                stroke="rgba(56, 189, 248, 0.25)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <text x="215" y="380" fill="rgba(56, 189, 248, 0.35)" fontSize="9" transform="rotate(75, 215, 380)">
                Río Manzanares
              </text>

              {/* M-30 Ring Highway (Approximation encircling central city) */}
              <ellipse
                cx="370"
                cy="290"
                rx="180"
                ry="190"
                fill="none"
                stroke="rgba(148, 163, 184, 0.15)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <text x="360" y="95" fill="rgba(148, 163, 184, 0.4)" fontSize="9" fontFamily="monospace">
                M-30 Norte
              </text>
              <text x="360" y="495" fill="rgba(148, 163, 184, 0.4)" fontSize="9" fontFamily="monospace">
                M-30 Sur
              </text>

              {/* Atmospheric Glow circles if enabled */}
              {showHeatGlow && visibleReadings.map(sr => {
                const { x, y } = projectCoords(sr.station.lat, sr.station.lng);
                return (
                  <circle
                    key={`glow-circle-${sr.station.id}`}
                    cx={x}
                    cy={y}
                    r={75}
                    fill={`url(#glow-${sr.station.id})`}
                    className="pointer-events-none transition-all duration-500"
                  />
                );
              })}

              {/* Station Markers */}
              {visibleReadings.map(sr => {
                const { x, y } = projectCoords(sr.station.lat, sr.station.lng);
                const isSelected = sr.station.id === selectedStationId;
                
                // Value to display
                let badgeText = sr.dominantICA.label;
                if (metricDisplay !== 'ica') {
                  const val = sr.readings[metricDisplay];
                  const p = POLLUTANTS[metricDisplay];
                  badgeText = val !== null ? `${val} ${p.unit.split('/')[0]}` : '--';
                }

                return (
                  <g
                    key={sr.station.id}
                    className="cursor-pointer transition-transform duration-200"
                    onClick={() => onSelectStation(sr.station.id)}
                  >
                    {/* Concentric pulse ring */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 18 : 12}
                      fill={sr.dominantICA.color}
                      fillOpacity={isSelected ? 0.25 : 0.15}
                      stroke={sr.dominantICA.color}
                      strokeWidth={isSelected ? 2 : 1}
                      className={isSelected ? 'animate-ping' : ''}
                    />

                    {/* Outer core circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 11 : 8}
                      fill="#0F172A"
                      stroke={sr.dominantICA.color}
                      strokeWidth={isSelected ? 3 : 2}
                    />

                    {/* Inner core pip */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 5 : 3.5}
                      fill={sr.dominantICA.color}
                    />

                    {/* Station Name Label Pill */}
                    <g transform={`translate(${x}, ${y - 20})`}>
                      <rect
                        x="-45"
                        y="-14"
                        width="90"
                        height="18"
                        rx="4"
                        fill={isSelected ? '#1E293B' : '#0B1120'}
                        stroke={isSelected ? sr.dominantICA.color : 'rgba(255,255,255,0.15)'}
                        strokeWidth={isSelected ? 1.5 : 1}
                        className="filter drop-shadow-md"
                      />
                      <text
                        x="0"
                        y="-2"
                        textAnchor="middle"
                        fill="#F8FAFC"
                        fontSize="9"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        fontFamily="sans-serif"
                      >
                        {sr.station.shortName}
                      </text>
                    </g>

                    {/* Value Badge below marker */}
                    <g transform={`translate(${x}, ${y + 14})`}>
                      <rect
                        x="-30"
                        y="0"
                        width="60"
                        height="14"
                        rx="3"
                        fill={sr.dominantICA.color}
                        fillOpacity="0.2"
                        stroke={sr.dominantICA.color}
                        strokeWidth="0.8"
                      />
                      <text
                        x="0"
                        y="10"
                        textAnchor="middle"
                        fill={sr.dominantICA.color}
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {badgeText}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Corner Compass / Spatial Indicator */}
            <div className="absolute bottom-3 left-3 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1.5 backdrop-blur-sm">
              <Navigation className="w-3.5 h-3.5 text-emerald-400 transform -rotate-45" />
              <span>MADRID UTM ED50</span>
              <span className="text-slate-600">•</span>
              <span>8 Estaciones Oficiales</span>
            </div>

          </div>

          {/* Quick Info Footer */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Haga clic en una estación para inspeccionar sus sensores.</span>
            <span>Fecha: {day} {MONTH_NAMES[month - 1]} 2024</span>
          </div>

        </div>

        {/* STATION TELEMETRY INSPECTOR (Right 5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          
          <div>
            {/* Station Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {currentStationReading.station.name}
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    ID #{currentStationReading.station.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {currentStationReading.station.address} ({currentStationReading.station.district})
                </p>
              </div>

              {/* Typology Badge */}
              <div className="px-2 py-1 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60 whitespace-nowrap">
                {currentStationReading.station.typeLabel}
              </div>
            </div>

            {/* Station Dominant Status Card */}
            <div className="mt-4 p-4 rounded-xl border flex items-center justify-between" style={{
              backgroundColor: currentStationReading.dominantICA.bgColor,
              borderColor: currentStationReading.dominantICA.borderColor
            }}>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  CALIDAD DEL AIRE ESTACIONAL
                </span>
                <div className="text-2xl font-black mt-0.5" style={{ color: currentStationReading.dominantICA.color }}>
                  {currentStationReading.dominantICA.label}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Parámetro condicionante:{' '}
                  <span className="font-bold text-white">
                    {currentStationReading.dominantPollutantId ? POLLUTANTS[currentStationReading.dominantPollutantId]?.name : 'Varios'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-slate-400">GEO COORDS</span>
                <div className="font-mono text-xs text-slate-300 mt-0.5">
                  {currentStationReading.station.lat.toFixed(4)}°N
                </div>
                <div className="font-mono text-xs text-slate-300">
                  {Math.abs(currentStationReading.station.lng).toFixed(4)}°W
                </div>
              </div>
            </div>

            {/* Complete Pollutant Telemetry Grid for this station */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Sensores Activos ({Object.keys(currentStationReading.readings).length})
                </h4>
                <span className="text-[10px] font-mono text-slate-500">Valores del día</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.entries(currentStationReading.readings).map(([pidStr, val]) => {
                  const pid = Number(pidStr);
                  const p = POLLUTANTS[pid];
                  if (!p) return null;
                  const ica = getICAStatus(pid, val);

                  return (
                    <div
                      key={pid}
                      className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
                      onClick={() => onNavigateToSeries && onNavigateToSeries(currentStationReading.station.id, pid)}
                      title={`Ver histórico de ${p.name}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
                          {p.formula}
                        </span>
                        <span 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: ica.color }}
                          title={ica.label}
                        />
                      </div>

                      <div className="mt-1.5 flex items-baseline justify-between">
                        <span className="font-mono text-base font-bold text-slate-100 tabular-nums">
                          {val !== null ? val : '--'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {p.unit}
                        </span>
                      </div>

                      <div className="mt-1 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>{ica.label}</span>
                        {p.whoGuidelineDaily && val !== null && val > p.whoGuidelineDaily && (
                          <span className="text-red-400 font-bold" title="Supera guía diaria OMS">
                            &gt;OMS
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Quick Action Button to Time Series */}
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <button
              onClick={() => onNavigateToSeries && onNavigateToSeries(
                currentStationReading.station.id, 
                currentStationReading.dominantPollutantId || 8
              )}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors border border-slate-700"
            >
              <span>Explorar Evolución Anual de {currentStationReading.station.shortName}</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
