import React from 'react';
import { 
  HeartPulse, 
  Bike, 
  Baby, 
  Wind, 
  Home, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  Flame,
  Info
} from 'lucide-react';
import { MadridDayOverview, getHealthAdvice, MONTH_NAMES } from '../data/analytics';
import { POLLUTANTS } from '../data/pollutants';

interface HealthAdvisoryProps {
  overview: MadridDayOverview;
  currentMonth: number;
  currentDay: number;
}

export const HealthAdvisory: React.FC<HealthAdvisoryProps> = ({
  overview,
  currentMonth,
  currentDay
}) => {
  const dominantPollutant = overview.dominantCityPollutant 
    ? POLLUTANTS[overview.dominantCityPollutant]
    : null;

  const advice = getHealthAdvice(
    overview.cityAverageICA.level, 
    dominantPollutant ? dominantPollutant.formula : 'NO₂'
  );

  // Municipal Protocol Scenarios
  const PROTOCOLS = [
    {
      level: 'Escenario 1 (Preaviso)',
      condition: 'Superación de 180 µg/m³ de NO₂ en 2 estaciones durante 2 horas consecutivas.',
      measures: [
        'Velocidad máxima reducida a 70 km/h en M-30 y accesos a Madrid.',
        'Recomendación estricta de uso de transporte público colectivo.'
      ]
    },
    {
      level: 'Escenario 2 (Aviso)',
      condition: 'Superación de 200 µg/m³ de NO₂ en 2 estaciones durante 2 horas consecutivas.',
      measures: [
        'Mantenimiento de la velocidad a 70 km/h en M-30 y accesos.',
        'Prohibición de estacionamiento en plazas del Servicio de Estacionamiento Regulado (SER) a vehículos no CERO ni ECO.'
      ]
    },
    {
      level: 'Escenario 3 (Alerta Restricción)',
      condition: '3 días consecutivos de superación de nivel de aviso.',
      measures: [
        'Prohibición de circular en el interior de la M-30 a vehículos sin distintivo ambiental de la DGT.',
        'Refuerzo masivo de la red de Metro de Madrid y autobuses EMT.'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner Status */}
      <div 
        className="p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl"
        style={{
          backgroundColor: overview.cityAverageICA.bgColor,
          borderColor: overview.cityAverageICA.borderColor
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full animate-ping"
              style={{ backgroundColor: overview.cityAverageICA.color }} 
            />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              ESTADO EPIDEMIOLÓGICO Y AMBIENTAL • {currentDay} {MONTH_NAMES[currentMonth - 1]} 2024
            </span>
          </div>

          <h3 className="text-2xl font-black mt-1" style={{ color: overview.cityAverageICA.color }}>
            {advice.title}
          </h3>

          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {advice.generalPublic}
          </p>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-mono uppercase text-slate-400">
            Contaminante Clave
          </span>
          <span className="font-mono text-xl font-bold text-white mt-0.5">
            {dominantPollutant ? dominantPollutant.formula : 'NO₂'}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {dominantPollutant ? dominantPollutant.name : 'Dióxido de Nitrógeno'}
          </span>
        </div>
      </div>

      {/* 4 Actionable Category Guidance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Grupos Sensibles */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <Baby className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Población Vulnerable y Niños
                </h4>
                <span className="text-[11px] text-slate-400">
                  Asma, EPOC, cardiopatías, ancianos y lactantes
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {advice.sensitiveGroups}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <Info className="w-3.5 h-3.5 text-pink-400" />
            <span>Los niños inhalan hasta un 50% más de aire por kg de peso corporal.</span>
          </div>
        </div>

        {/* Card 2: Deporte y Actividad Física */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Deportistas y Ejercicio Exterior
                </h4>
                <span className="text-[11px] text-slate-400">
                  Running, ciclismo, entrenamientos de alta intensidad
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {advice.outdoorSports}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Se sugiere ejercitarse en parques amplios (Casa de Campo, Retiro) lejos del tráfico.</span>
          </div>
        </div>

        {/* Card 3: Ventilación en Hogares */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Ventilación de Hogares y Oficinas
                </h4>
                <span className="text-[11px] text-slate-400">
                  Renovación de aire interior y filtros de partículas
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {advice.ventilation}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span>Evite ventilar entre las 7:30-9:30 y 19:30-21:30 en días laborables.</span>
          </div>
        </div>

        {/* Card 4: Movilidad Urbana Sostenible */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Movilidad y Desplazamientos
                </h4>
                <span className="text-[11px] text-slate-400">
                  Transporte público, Metro, Cercanías y BiciMAD
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              El 75% de las emisiones de NO₂ en Madrid provienen del transporte en automóvil particular. El uso de la red de Metro y Cercanías reduce las emisiones individuales hasta en un 92%.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>Madrid ZBE restringe el acceso de vehículos sin etiqueta a toda la capital.</span>
          </div>
        </div>

      </div>

      {/* Municipal Anti-Pollution Protocol Guide */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-tight">
              Protocolo de Actuación por Alta Contaminación (Ayuntamiento de Madrid)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Decreto de Medidas Cautelares</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PROTOCOLS.map((prot, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <span className="text-xs font-mono font-bold text-amber-400 block">
                {prot.level}
              </span>
              <p className="text-[11px] text-slate-400">
                <span className="text-slate-300 font-semibold">Activación:</span> {prot.condition}
              </p>
              <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc marker:text-emerald-400">
                {prot.measures.map((m, mIdx) => (
                  <li key={mIdx}>{m}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
