import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  ArrowRightLeft, 
  Trees, 
  Car, 
  Building2, 
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { STATIONS, Station } from '../data/stations';
import { POLLUTANTS, POLLUTANT_LIST, getICAStatus } from '../data/pollutants';
import { useDataset } from '../data/datasetContext';

interface StationComparatorProps {
  onNavigateToSeries: (stationId: number, pollutantId: number) => void;
}

export const StationComparator: React.FC<StationComparatorProps> = ({ onNavigateToSeries }) => {
  const { activeStationIds, getPollutantAnnualStats } = useDataset();
  const [stationAId, setStationAId] = useState<number>(() => activeStationIds[0] || 8);
  const [stationBId, setStationBId] = useState<number>(() => activeStationIds[1] || activeStationIds[0] || 24);

  const stationA = STATIONS[stationAId] || STATIONS[8];
  const stationB = STATIONS[stationBId] || STATIONS[24];

  // Common pollutants for radar
  const radarPollutants = [
    { id: 8, key: 'NO2', label: 'NO₂ (Dióxido Nitrógeno)', maxRef: 50 },
    { id: 9, key: 'PM25', label: 'PM₂.₅ (Finas)', maxRef: 25 },
    { id: 10, key: 'PM10', label: 'PM₁₀ (Respirables)', maxRef: 45 },
    { id: 14, key: 'O3', label: 'O₃ (Ozono)', maxRef: 110 },
    { id: 1, key: 'SO2', label: 'SO₂ (Azufre)', maxRef: 15 },
    { id: 6, key: 'CO', label: 'CO (Monóxido)', maxRef: 1.0 }
  ];

  // Compute stats for both stations
  const comparisonData = useMemo(() => {
    return radarPollutants.map(item => {
      const statsA = getPollutantAnnualStats(stationAId, item.id);
      const statsB = getPollutantAnnualStats(stationBId, item.id);

      const meanA = statsA ? statsA.mean : null;
      const meanB = statsB ? statsB.mean : null;

      // Normalized score 0-100 for radar
      const normA = meanA !== null ? Math.min(100, Math.round((meanA / item.maxRef) * 100)) : 0;
      const normB = meanB !== null ? Math.min(100, Math.round((meanB / item.maxRef) * 100)) : 0;

      let pctDiff = 0;
      if (meanA !== null && meanB !== null && meanB > 0) {
        pctDiff = Math.round(((meanA - meanB) / meanB) * 100);
      }

      return {
        ...item,
        statsA,
        statsB,
        meanA,
        meanB,
        normA,
        normB,
        pctDiff
      };
    });
  }, [stationAId, stationBId]);

  // Radar geometry
  const radarSize = 340;
  const center = radarSize / 2;
  const radius = center - 45;
  const totalAxes = radarPollutants.length;

  const getCoordinates = (index: number, valueNorm: number) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = (valueNorm / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate SVG polygon points
  const pointsA = comparisonData.map((d, i) => {
    const { x, y } = getCoordinates(i, d.normA);
    return `${x},${y}`;
  }).join(' ');

  const pointsB = comparisonData.map((d, i) => {
    const { x, y } = getCoordinates(i, d.normB);
    return `${x},${y}`;
  }).join(' ');

  const handleSwapStations = () => {
    const temp = stationAId;
    setStationAId(stationBId);
    setStationBId(temp);
  };

  return (
    <div className="space-y-6">
      
      {/* Station Selector Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        
        {/* Station A Selector */}
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-400" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
              ESTACIÓN A
            </span>
            <select
              value={stationAId}
              onChange={(e) => setStationAId(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {activeStationIds.map(id => (
                <option key={id} value={id} disabled={id === stationBId}>
                  {STATIONS[id]?.name || `Estación #${id}`} {STATIONS[id]?.typeLabel ? `(${STATIONS[id].typeLabel})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap button */}
        <button
          onClick={handleSwapStations}
          title="Intercambiar estaciones"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>

        {/* Station B Selector */}
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-cyan-400" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
              ESTACIÓN B
            </span>
            <select
              value={stationBId}
              onChange={(e) => setStationBId(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {activeStationIds.map(id => (
                <option key={id} value={id} disabled={id === stationAId}>
                  {STATIONS[id]?.name || `Estación #${id}`} {STATIONS[id]?.typeLabel ? `(${STATIONS[id].typeLabel})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Main Grid: Radar Polygon (Left 5 cols) + Detailed Comparative Metrics (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RADAR CHART (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between shadow-xl">
          
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-400" />
              Radar Multicriterio Normalizado
            </h4>
            <span className="text-[10px] font-mono text-slate-500">Promedios 2024</span>
          </div>

          {/* SVG Radar */}
          <div className="relative w-full aspect-square max-w-[340px] my-3">
            <svg viewBox={`0 0 ${radarSize} ${radarSize}`} className="w-full h-full select-none">
              
              {/* Concentric grid webs (25%, 50%, 75%, 100%) */}
              {[25, 50, 75, 100].map(level => {
                const r = (level / 100) * radius;
                return (
                  <circle
                    key={level}
                    cx={center}
                    cy={center}
                    r={r}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                    strokeDasharray={level === 100 ? 'none' : '3 3'}
                  />
                );
              })}

              {/* Spoke axes lines & labels */}
              {radarPollutants.map((item, idx) => {
                const { x, y } = getCoordinates(idx, 100);
                const angle = (Math.PI * 2 / totalAxes) * idx - Math.PI / 2;
                const labelRadius = radius + 22;
                const lx = center + labelRadius * Math.cos(angle);
                const ly = center + labelRadius * Math.sin(angle);

                return (
                  <g key={item.key}>
                    <line
                      x1={center}
                      y1={center}
                      x2={x}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.12)"
                      strokeWidth="1"
                    />
                    <text
                      x={lx}
                      y={ly + 3}
                      textAnchor="middle"
                      fill="#CBD5E1"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {item.key}
                    </text>
                  </g>
                );
              })}

              {/* Station B Polygon (Cyan) */}
              <polygon
                points={pointsB}
                fill="rgba(6, 182, 212, 0.20)"
                stroke="#06B6D4"
                strokeWidth="2"
              />

              {/* Station A Polygon (Emerald) */}
              <polygon
                points={pointsA}
                fill="rgba(16, 185, 129, 0.25)"
                stroke="#10B981"
                strokeWidth="2.5"
              />

              {/* Data points for Station A */}
              {comparisonData.map((d, idx) => {
                const { x, y } = getCoordinates(idx, d.normA);
                return (
                  <circle
                    key={`ptA-${idx}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#10B981"
                    stroke="#022C22"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Data points for Station B */}
              {comparisonData.map((d, idx) => {
                const { x, y } = getCoordinates(idx, d.normB);
                return (
                  <circle
                    key={`ptB-${idx}`}
                    cx={x}
                    cy={y}
                    r="3.5"
                    fill="#06B6D4"
                    stroke="#083344"
                    strokeWidth="1.5"
                  />
                );
              })}

            </svg>
          </div>

          {/* Radar Legend */}
          <div className="flex items-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-white font-bold">{stationA.shortName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block" />
              <span className="text-white font-bold">{stationB.shortName}</span>
            </div>
          </div>

        </div>

        {/* COMPARATIVE METRICS TABLE & INSIGHTS (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Comparativa Parámetro a Parámetro
              </h4>
              <span className="text-[10px] font-mono text-slate-500">
                Valores Medios Anuales 2024
              </span>
            </div>

            {/* Metrics List */}
            <div className="divide-y divide-slate-800/60 mt-2">
              {comparisonData.map((item) => {
                const p = POLLUTANTS[item.id];
                if (!p) return null;

                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs font-mono">
                    
                    {/* Pollutant Name */}
                    <div className="flex-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{p.formula}</span>
                        <span className="text-slate-400 font-normal">({p.unit})</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {p.name}
                      </span>
                    </div>

                    {/* Station A Value */}
                    <div className="text-right w-24">
                      <span className="text-[10px] text-emerald-400 uppercase block font-semibold truncate">
                        {stationA.shortName}
                      </span>
                      <span className="font-bold text-slate-100 text-sm tabular-nums">
                        {item.meanA !== null ? item.meanA : '--'}
                      </span>
                    </div>

                    {/* Station B Value */}
                    <div className="text-right w-24">
                      <span className="text-[10px] text-cyan-400 uppercase block font-semibold truncate">
                        {stationB.shortName}
                      </span>
                      <span className="font-bold text-slate-100 text-sm tabular-nums">
                        {item.meanB !== null ? item.meanB : '--'}
                      </span>
                    </div>

                    {/* Relative Delta Pill */}
                    <div className="w-24 text-right">
                      {item.meanA !== null && item.meanB !== null ? (
                        item.pctDiff > 0 ? (
                          <span className="text-[11px] font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40">
                            +{item.pctDiff}% en A
                          </span>
                        ) : item.pctDiff < 0 ? (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                            {item.pctDiff}% en A
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            Igual
                          </span>
                        )
                      ) : (
                        <span className="text-slate-600 text-[10px]">N/D</span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Scientific Atmospheric Insight Card */}
            <div className="mt-5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs leading-relaxed text-slate-300">
              <div className="flex items-center gap-1.5 font-bold text-amber-400 font-mono text-[11px] mb-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Patrón Atmosférico Observado:</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Las estaciones de tráfico intenso como <span className="text-white font-semibold">{stationA.shortName}</span> exhiben concentraciones significativamente mayores de óxidos de nitrógeno (NO₂/NOₓ) por emisiones de tubos de escape. En contraste, entornos periurbanos como <span className="text-white font-semibold">{stationB.shortName}</span> registran picos más altos de ozono troposférico (O₃) durante las tardes de verano debido a que el ozono no es "destruido" por el monóxido de nitrógeno fresco del tráfico (titration effect).
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
