import React from 'react';
import { 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  Factory, 
  Flame, 
  HeartPulse,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { POLLUTANTS, POLLUTANT_LIST, PollutantInfo, getICAStatus } from '../data/pollutants';
import { 
  MadridDayOverview, 
  getPollutantAnnualStats,
  MONTH_SHORT_NAMES 
} from '../data/analytics';

interface PollutantMatrixProps {
  overview: MadridDayOverview;
  onNavigateToSeries: (stationId: number, pollutantId: number) => void;
}

export const PollutantMatrix: React.FC<PollutantMatrixProps> = ({
  overview,
  onNavigateToSeries
}) => {
  return (
    <div className="space-y-6">
      
      {/* Intro banner */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white font-mono tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Matriz de Parámetros Atmosféricos y Normativa Ambiental
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Valores de referencia fijados por la Directiva 2008/50/CE de la Unión Europea y Guías de Calidad del Aire de la OMS (2021).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Fecha activa:</span>
          <span className="px-2 py-1 rounded bg-slate-950 text-white font-bold border border-slate-800">
            {overview.day} / {overview.month} / 2024
          </span>
        </div>
      </div>

      {/* Grid of Pollutant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {POLLUTANT_LIST.map((pollutant) => {
          const currentVal = overview.pollutantAverages[pollutant.id];
          const ica = getICAStatus(pollutant.id, currentVal);

          // Get network stats for this pollutant (using Escuelas Aguirre 8 or Casa de Campo 24 as benchmark)
          const benchmarkStationId = (pollutant.id === 20 || pollutant.id === 30 || pollutant.id === 35) ? 24 : 8;
          const stats = getPollutantAnnualStats(benchmarkStationId, pollutant.id);

          return (
            <div
              key={pollutant.id}
              className="bg-slate-950/70 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-lg group"
            >
              <div>
                
                {/* Header: Formula, Name, and ICA Status Pill */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black font-mono text-white tracking-tight">
                        {pollutant.formula}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        ID {pollutant.id}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-300 mt-0.5">
                      {pollutant.name}
                    </h4>
                  </div>

                  <div className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1.5 ${ica.badgeBg}`}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ica.color }} />
                    <span>{ica.label}</span>
                  </div>
                </div>

                {/* Main Value Display on Selected Day */}
                <div className="my-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      MEDIA MADRID HOY
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-2xl font-black font-mono text-white tabular-nums">
                        {currentVal !== null ? currentVal : '--'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {pollutant.unit}
                      </span>
                    </div>
                  </div>

                  {/* Monthly Progression Micro Sparkline */}
                  {stats && stats.monthlyMeans.length > 0 && (
                    <div className="flex flex-col items-end">
                      <span className="text-[9.5px] font-mono text-slate-500 uppercase">
                        Ciclo Anual 2024
                      </span>
                      <div className="flex items-end gap-1 h-7 mt-1">
                        {stats.monthlyMeans.map((mm) => {
                          const maxMonthly = Math.max(...stats.monthlyMeans.map(m => m.mean)) || 1;
                          const heightPct = Math.max(15, Math.round((mm.mean / maxMonthly) * 100));
                          const isCurrent = mm.month === overview.month;

                          return (
                            <div
                              key={mm.month}
                              title={`${MONTH_SHORT_NAMES[mm.month - 1]}: ${mm.mean} ${pollutant.unit}`}
                              className={`w-1.5 rounded-t-sm transition-all ${
                                isCurrent 
                                  ? 'bg-emerald-400' 
                                  : 'bg-slate-700 hover:bg-slate-500'
                              }`}
                              style={{ height: `${heightPct}%` }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Normative & Regulatory Thresholds */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono py-2">
                  
                  {/* WHO Guideline */}
                  <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/50">
                    <span className="text-[10px] text-amber-400 block font-semibold">
                      Guía Diaria OMS
                    </span>
                    <span className="text-slate-200 font-bold tabular-nums">
                      {pollutant.whoGuidelineDaily ? `${pollutant.whoGuidelineDaily} ${pollutant.unit}` : 'N/D'}
                    </span>
                  </div>

                  {/* EU Legal Limit */}
                  <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/50">
                    <span className="text-[10px] text-red-400 block font-semibold">
                      Límite Directiva UE
                    </span>
                    <span className="text-slate-200 font-bold tabular-nums">
                      {pollutant.euLimitDaily ?? pollutant.euLimitAnnual ? `${pollutant.euLimitDaily ?? pollutant.euLimitAnnual} ${pollutant.unit}` : 'N/D'}
                    </span>
                  </div>

                </div>

                {/* Description, Sources, and Health Effects */}
                <div className="mt-3 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Origen en Madrid
                    </span>
                    <p className="text-slate-300 mt-0.5 line-clamp-2">
                      {pollutant.sources}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Efectos en la Salud
                    </span>
                    <p className="text-slate-400 mt-0.5 line-clamp-2">
                      {pollutant.healthEffects}
                    </p>
                  </div>
                </div>

              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => onNavigateToSeries(benchmarkStationId, pollutant.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono transition-colors border border-slate-800"
                >
                  <span>Ver serie temporal completa</span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
