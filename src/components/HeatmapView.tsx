import React, { useState, useMemo } from 'react';
import { 
  CalendarRange, 
  Info, 
  Flame, 
  Wind, 
  Sun, 
  CloudRain,
  SlidersHorizontal 
} from 'lucide-react';
import { STATIONS } from '../data/stations';
import { POLLUTANTS, POLLUTANT_LIST, PollutantInfo, getICAStatus } from '../data/pollutants';
import { 
  HeatmapCell, 
  MONTH_NAMES, 
  MONTH_SHORT_NAMES, 
  DAYS_IN_MONTH_2024 
} from '../data/analytics';
import { useDataset } from '../data/datasetContext';

interface HeatmapViewProps {
  currentMonth: number;
  currentDay: number;
  onSelectDate: (month: number, day: number) => void;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({
  currentMonth,
  currentDay,
  onSelectDate
}) => {
  const { activeStationIds, getHeatmapMatrix } = useDataset();
  const [pollutantId, setPollutantId] = useState<number>(8); // NO2 default
  const [selectedStationId, setSelectedStationId] = useState<number | 'avg'>('avg'); // City average or specific station
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  const pollutant = POLLUTANTS[pollutantId] || POLLUTANTS[8];

  // Generate heatmap matrix (11 rows x 31 cols)
  const matrix = useMemo(() => {
    const sid = selectedStationId === 'avg' ? undefined : selectedStationId;
    return getHeatmapMatrix(pollutantId, sid);
  }, [getHeatmapMatrix, pollutantId, selectedStationId]);

  // Notable 2024 Atmospheric Episodes in Madrid for educational context
  const EPISODES = [
    {
      title: 'Episodio Inversión Térmica Invernal',
      period: 'Enero - Febrero',
      description: 'Anticiclón persistente con estancamiento de aire frío en el fondo de la cuenca de Madrid, atrapando emisiones de NO₂ y calefacciones.',
      color: 'text-amber-400',
      badge: 'NO₂ elevado',
      jumpDate: { month: 1, day: 22 }
    },
    {
      title: 'Intrusión de Polvo Sahariano (Calima)',
      period: 'Marzo / Agosto',
      description: 'Masa de aire desértico africano cargada de partículas minerales finas elevando drásticamente los registros de PM₁₀ y PM₂.₅.',
      color: 'text-orange-400',
      badge: 'PM₁₀ elevado',
      jumpDate: { month: 3, day: 20 }
    },
    {
      title: 'Ola de Calor y Máximos de Ozono',
      period: 'Julio - Agosto',
      description: 'Intensa radiación ultravioleta y temperaturas > 38°C catalizando la formación fotoquímica de Ozono troposférico a sotavento.',
      color: 'text-red-400',
      badge: 'O₃ troposférico',
      jumpDate: { month: 8, day: 10 }
    },
    {
      title: 'Lavado Atmosférico por Borrascas',
      period: 'Octubre / Noviembre',
      description: 'Entrada de frentes atlánticos con vientos y lluvias que limpiaron eficazmente el cielo de Madrid, logrando niveles de aire óptimos.',
      color: 'text-emerald-400',
      badge: 'Calidad Excelente',
      jumpDate: { month: 10, day: 26 }
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Filters and Header Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Selector dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Contaminante
            </label>
            <select
              value={pollutantId}
              onChange={(e) => setPollutantId(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {POLLUTANT_LIST.map(p => (
                <option key={p.id} value={p.id}>
                  {p.formula} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Ámbito Geográfico
            </label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value === 'avg' ? 'avg' : Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="avg">Promedio Red Madrid (Todas las estaciones)</option>
              {activeStationIds.map(id => (
                <option key={id} value={id}>
                  Estación {STATIONS[id]?.name || `#${id}`}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Right: Color Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 text-[10px] mr-1">Escala ICA:</span>
          {[
            { label: 'Muy Buena', color: '#06B6D4' },
            { label: 'Buena', color: '#10B981' },
            { label: 'Aceptable', color: '#F59E0B' },
            { label: 'Mala', color: '#F97316' },
            { label: 'Muy Mala', color: '#EF4444' }
          ].map(lvl => (
            <div key={lvl.label} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: lvl.color }} />
              <span className="text-slate-300 text-[11px]">{lvl.label}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Main Heatmap Matrix Container */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-2xl overflow-x-auto">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono tracking-tight">
              Matriz Cronológica Anual 2024 • {pollutant.name} ({pollutant.formula})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Haga clic en cualquier celda para viajar a ese día
          </span>
        </div>

        {/* Heatmap Grid */}
        <div className="min-w-[720px] select-none">
          
          {/* Days numbers header (1 to 31) */}
          <div className="grid grid-cols-[80px_repeat(31,1fr)] gap-1 mb-1.5 text-center">
            <span className="text-[10px] font-mono text-slate-500 font-bold text-left pl-2">
              MES
            </span>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <span 
                key={d} 
                className={`text-[9.5px] font-mono ${d % 5 === 0 ? 'text-slate-300 font-bold' : 'text-slate-600'}`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Month rows */}
          <div className="space-y-1">
            {matrix.map((row, mIdx) => {
              const monthNum = mIdx + 1;
              const monthName = MONTH_SHORT_NAMES[mIdx];

              return (
                <div key={monthNum} className="grid grid-cols-[80px_repeat(31,1fr)] gap-1 items-center">
                  
                  {/* Month Label */}
                  <div className="text-xs font-mono text-slate-300 font-semibold pl-2">
                    {monthName}
                  </div>

                  {/* Day cells */}
                  {row.map((cell) => {
                    const isValidDay = cell.value !== null;
                    const isSelected = cell.month === currentMonth && cell.day === currentDay;

                    if (!cell.dateStr) {
                      // Non-existent day in month (e.g. Feb 30)
                      return (
                        <div 
                          key={cell.day}
                          className="h-6 rounded-sm bg-slate-900/20 border border-slate-900/40 opacity-20"
                        />
                      );
                    }

                    return (
                      <button
                        key={cell.day}
                        onClick={() => onSelectDate(cell.month, cell.day)}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`h-6 rounded-sm transition-all duration-150 relative group flex items-center justify-center border ${
                          isSelected 
                            ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-950 z-10 scale-110' 
                            : 'hover:scale-115 hover:z-10'
                        }`}
                        style={{
                          backgroundColor: isValidDay ? cell.ica.color + '33' : '#1E293B',
                          borderColor: isValidDay ? cell.ica.color + '88' : '#334155'
                        }}
                      >
                        {/* Inner color pip */}
                        {isValidDay && (
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cell.ica.color }}
                          />
                        )}
                      </button>
                    );
                  })}

                </div>
              );
            })}
          </div>

        </div>

        {/* Hover Inspector Card */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 min-h-[40px] flex items-center justify-between text-xs font-mono">
          {hoveredCell && hoveredCell.dateStr ? (
            <div className="flex items-center gap-4">
              <span className="text-white font-bold">{hoveredCell.dateStr} 2024:</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Concentración {pollutant.formula}:</span>
                <span className="font-bold text-emerald-400 tabular-nums">
                  {hoveredCell.value !== null ? `${hoveredCell.value} ${pollutant.unit}` : 'Sin datos'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredCell.ica.color }} />
                <span style={{ color: hoveredCell.ica.color }} className="font-bold">
                  {hoveredCell.ica.label}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-slate-500 italic">
              Pase el cursor por cualquier celda para consultar el nivel exacto o haga clic para seleccionarlo.
            </span>
          )}

          <div className="text-[11px] text-slate-500">
            Día actualmente activo:{' '}
            <span className="text-white font-bold">
              {currentDay} {MONTH_NAMES[currentMonth - 1]} 2024
            </span>
          </div>
        </div>

      </div>

      {/* Notable Atmospheric Episodes Showcase (Educational & Analytical) */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          Hitos Atmosféricos Clave Detectados en Madrid Durante 2024
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {EPISODES.map((ep, idx) => (
            <div
              key={idx}
              className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono uppercase font-bold ${ep.color}`}>
                    {ep.period}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {ep.badge}
                  </span>
                </div>
                <h5 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {ep.title}
                </h5>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {ep.description}
                </p>
              </div>

              <button
                onClick={() => onSelectDate(ep.jumpDate.month, ep.jumpDate.day)}
                className="mt-3 w-full py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors border border-slate-700/60"
              >
                Ver {ep.jumpDate.day} {MONTH_SHORT_NAMES[ep.jumpDate.month - 1]} en simulador →
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
