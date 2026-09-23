// src/data/analytics.ts
import { AIR_DATA, getDailyValue } from './airData';
import { POLLUTANTS, POLLUTANT_LIST, getICAStatus, ICAStatus } from './pollutants';
import { STATIONS, Station } from './stations';

export const ACTIVE_STATION_IDS = [4, 8, 11, 16, 17, 18, 24, 27];

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre'
];

export const MONTH_SHORT_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov'
];

export const DAYS_IN_MONTH_2024 = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30];

// Return which pollutant IDs are measured by a given station
export function getStationPollutantIds(stationId: number): number[] {
  const pollutantIds = new Set<number>();
  for (const rec of AIR_DATA) {
    if (rec.s === stationId) {
      pollutantIds.add(rec.m);
    }
  }
  return Array.from(pollutantIds).sort((a, b) => a - b);
}

export interface DayStationReading {
  station: Station;
  readings: Record<number, number | null>; // pollutantId -> value
  dominantPollutantId: number | null;
  dominantICA: ICAStatus;
  overallScore: number; // 1-5 for ICA level
}

const LEVEL_SCORE_MAP: Record<string, number> = {
  good: 1,
  fair: 2,
  moderate: 3,
  poor: 4,
  very_poor: 5
};

export function getStationDayReading(stationId: number, month: number, day: number): DayStationReading | null {
  const station = STATIONS[stationId];
  if (!station) return null;

  const pollutantIds = getStationPollutantIds(stationId);
  const readings: Record<number, number | null> = {};

  let worstScore = 0;
  let worstPollutantId: number | null = null;
  let worstICA = getICAStatus(8, null);

  for (const pid of pollutantIds) {
    const val = getDailyValue(stationId, pid, month, day);
    readings[pid] = val;
    if (val !== null) {
      const ica = getICAStatus(pid, val);
      const score = LEVEL_SCORE_MAP[ica.level] || 1;
      if (score > worstScore) {
        worstScore = score;
        worstPollutantId = pid;
        worstICA = ica;
      }
    }
  }

  return {
    station,
    readings,
    dominantPollutantId: worstPollutantId,
    dominantICA: worstICA,
    overallScore: worstScore || 1
  };
}

export interface MadridDayOverview {
  dateStr: string;
  month: number;
  day: number;
  stationReadings: DayStationReading[];
  cityAverageICA: ICAStatus;
  dominantCityPollutant: number | null;
  pollutantAverages: Record<number, number | null>;
  activeStationsCount: number;
  totalValidMeasurements: number;
}

export function getMadridDayOverview(month: number, day: number): MadridDayOverview {
  const dateStr = `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const stationReadings: DayStationReading[] = [];

  const pollutantSums: Record<number, { sum: number; count: number }> = {};
  let totalValid = 0;
  let cityWorstScore = 0;
  let cityWorstPollutantId: number | null = null;

  for (const sid of ACTIVE_STATION_IDS) {
    const sr = getStationDayReading(sid, month, day);
    if (sr) {
      stationReadings.push(sr);
      if (sr.overallScore > cityWorstScore) {
        cityWorstScore = sr.overallScore;
        cityWorstPollutantId = sr.dominantPollutantId;
      }
      for (const [pidStr, val] of Object.entries(sr.readings)) {
        const pid = Number(pidStr);
        if (val !== null) {
          totalValid++;
          if (!pollutantSums[pid]) pollutantSums[pid] = { sum: 0, count: 0 };
          pollutantSums[pid].sum += val;
          pollutantSums[pid].count += 1;
        }
      }
    }
  }

  const pollutantAverages: Record<number, number | null> = {};
  for (const p of POLLUTANT_LIST) {
    if (pollutantSums[p.id] && pollutantSums[p.id].count > 0) {
      pollutantAverages[p.id] = Math.round((pollutantSums[p.id].sum / pollutantSums[p.id].count) * 10) / 10;
    } else {
      pollutantAverages[p.id] = null;
    }
  }

  // Calculate city average ICA based on mean of key pollutants (NO2, PM10, PM2.5, O3)
  let cityICA = getICAStatus(cityWorstPollutantId || 8, null);
  if (cityWorstPollutantId && pollutantAverages[cityWorstPollutantId] !== null) {
    cityICA = getICAStatus(cityWorstPollutantId, pollutantAverages[cityWorstPollutantId]);
  } else if (pollutantAverages[8] !== null) {
    cityICA = getICAStatus(8, pollutantAverages[8]);
  }

  return {
    dateStr,
    month,
    day,
    stationReadings,
    cityAverageICA: cityICA,
    dominantCityPollutant: cityWorstPollutantId,
    pollutantAverages,
    activeStationsCount: stationReadings.length,
    totalValidMeasurements: totalValid
  };
}

// Annual statistics for a given station and pollutant
export interface PollutantAnnualStats {
  stationId: number;
  pollutantId: number;
  mean: number;
  median: number;
  max: number;
  maxDate: string;
  min: number;
  totalValidDays: number;
  daysExceedingWho: number;
  daysExceedingEu: number;
  monthlyMeans: { month: number; mean: number }[];
}

export function getPollutantAnnualStats(stationId: number, pollutantId: number): PollutantAnnualStats | null {
  const pollutant = POLLUTANTS[pollutantId];
  if (!pollutant) return null;

  const validValues: { val: number; month: number; day: number }[] = [];
  const monthlySums: Record<number, { sum: number; count: number }> = {};

  for (let m = 1; m <= 11; m++) {
    monthlySums[m] = { sum: 0, count: 0 };
    const daysInM = DAYS_IN_MONTH_2024[m - 1];
    for (let d = 1; d <= daysInM; d++) {
      const val = getDailyValue(stationId, pollutantId, m, d);
      if (val !== null) {
        validValues.push({ val, month: m, day: d });
        monthlySums[m].sum += val;
        monthlySums[m].count += 1;
      }
    }
  }

  if (validValues.length === 0) return null;

  validValues.sort((a, b) => a.val - b.val);
  const sum = validValues.reduce((acc, curr) => acc + curr.val, 0);
  const mean = Math.round((sum / validValues.length) * 10) / 10;
  const median = validValues[Math.floor(validValues.length / 2)].val;
  const min = validValues[0].val;

  let maxItem = validValues[0];
  for (const item of validValues) {
    if (item.val > maxItem.val) {
      maxItem = item;
    }
  }

  const whoThreshold = pollutant.whoGuidelineDaily ?? null;
  const euThreshold = pollutant.euLimitDaily ?? pollutant.euLimitAnnual ?? null;

  let daysWho = 0;
  let daysEu = 0;
  for (const item of validValues) {
    if (whoThreshold !== null && item.val > whoThreshold) daysWho++;
    if (euThreshold !== null && item.val > euThreshold) daysEu++;
  }

  const monthlyMeans = Object.entries(monthlySums).map(([mStr, data]) => ({
    month: Number(mStr),
    mean: data.count > 0 ? Math.round((data.sum / data.count) * 10) / 10 : 0
  }));

  return {
    stationId,
    pollutantId,
    mean,
    median,
    max: maxItem.val,
    maxDate: `${maxItem.day} ${MONTH_SHORT_NAMES[maxItem.month - 1]} 2024`,
    min,
    totalValidDays: validValues.length,
    daysExceedingWho: daysWho,
    daysExceedingEu: daysEu,
    monthlyMeans
  };
}

// Time series point for charts
export interface TimeSeriesPoint {
  index: number;
  dateStr: string;
  month: number;
  day: number;
  label: string;
  value: number | null;
  ica: ICAStatus;
}

export function getTimeSeries(stationId: number, pollutantId: number): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  let index = 0;

  for (let m = 1; m <= 11; m++) {
    const days = DAYS_IN_MONTH_2024[m - 1];
    for (let d = 1; d <= days; d++) {
      const val = getDailyValue(stationId, pollutantId, m, d);
      points.push({
        index,
        dateStr: `2024-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        month: m,
        day: d,
        label: `${d} ${MONTH_SHORT_NAMES[m - 1]}`,
        value: val,
        ica: getICAStatus(pollutantId, val)
      });
      index++;
    }
  }

  return points;
}

// Heatmap matrix generation for annual calendar
export interface HeatmapCell {
  month: number;
  day: number;
  dateStr: string;
  value: number | null;
  ica: ICAStatus;
}

export function getHeatmapMatrix(pollutantId: number, stationId?: number): HeatmapCell[][] {
  const matrix: HeatmapCell[][] = [];

  for (let m = 1; m <= 11; m++) {
    const row: HeatmapCell[] = [];
    const maxDays = DAYS_IN_MONTH_2024[m - 1];
    for (let d = 1; d <= 31; d++) {
      if (d > maxDays) {
        row.push({
          month: m,
          day: d,
          dateStr: '',
          value: null,
          ica: getICAStatus(pollutantId, null)
        });
        continue;
      }

      let val: number | null = null;
      if (stationId) {
        val = getDailyValue(stationId, pollutantId, m, d);
      } else {
        // Average across all active stations
        let sum = 0;
        let count = 0;
        for (const sid of ACTIVE_STATION_IDS) {
          const v = getDailyValue(sid, pollutantId, m, d);
          if (v !== null) {
            sum += v;
            count++;
          }
        }
        val = count > 0 ? Math.round((sum / count) * 10) / 10 : null;
      }

      row.push({
        month: m,
        day: d,
        dateStr: `${d} ${MONTH_NAMES[m - 1]}`,
        value: val,
        ica: getICAStatus(pollutantId, val)
      });
    }
    matrix.push(row);
  }

  return matrix;
}

// Health advice generator based on ICA
export interface HealthAdvice {
  title: string;
  generalPublic: string;
  sensitiveGroups: string; // Children, elderly, respiratory/asthma
  outdoorSports: string;
  ventilation: string;
  recommendationLevel: 'safe' | 'caution' | 'warning' | 'alert';
}

export function getHealthAdvice(icaLevel: string, dominantPollutantName: string = 'NO₂'): HealthAdvice {
  switch (icaLevel) {
    case 'good':
      return {
        title: 'Calidad del Aire Excelente',
        generalPublic: 'Las condiciones son óptimas para cualquier actividad en exteriores. Ningún impacto previsible.',
        sensitiveGroups: 'Sin restricciones. Ideal para paseos de niños y ancianos.',
        outdoorSports: 'Excelente momento para realizar entrenamientos intensos, ciclismo o correr al aire libre.',
        ventilation: 'Excelente momento para ventilar hogares y oficinas en cualquier horario.',
        recommendationLevel: 'safe'
      };
    case 'fair':
      return {
        title: 'Calidad del Aire Aceptable',
        generalPublic: 'La calidad del aire es satisfactoria. Cumple la mayor parte de normativas de salubridad.',
        sensitiveGroups: 'Personas inusualmente sensibles a ' + dominantPollutantName + ' deben prestar atención si presentan síntomas respiratorios.',
        outdoorSports: 'Actividades al aire libre seguras para la gran mayoría.',
        ventilation: 'Se recomienda ventilar temprano por la mañana o al atardecer.',
        recommendationLevel: 'safe'
      };
    case 'moderate':
      return {
        title: 'Calidad del Aire Moderada / Regular',
        generalPublic: 'Se aprecian concentraciones moderadas. Las personas sanas pueden percibir ligera irritación ocular o sequedad.',
        sensitiveGroups: 'Personas con asma, EPOC, niños y mayores deben reducir los esfuerzos prolongados al aire libre.',
        outdoorSports: 'Considere moderar la intensidad del entrenamiento aeróbico cerca de vías de tráfico denso.',
        ventilation: 'Ventile brevemente durante las horas centrales en invierno, o a primera hora en verano.',
        recommendationLevel: 'caution'
      };
    case 'poor':
      return {
        title: 'Calidad del Aire Desfavorable / Mala',
        generalPublic: 'Toda la población puede comenzar a experimentar molestias respiratorias (tos, picor de garganta).',
        sensitiveGroups: 'EVITAR actividades prolongadas y ejercicios intensos en el exterior. Mantenga la medicación de rescate a mano.',
        outdoorSports: 'Desaconsejado ejercicio cardiovascular intenso en exteriores. Prefiera espacios interiores bien acondicionados.',
        ventilation: 'Mantenga ventanas cerradas durante las horas punta de tráfico o de máxima radiación solar.',
        recommendationLevel: 'warning'
      };
    case 'very_poor':
    default:
      return {
        title: 'Alerta por Contaminación Severa',
        generalPublic: 'Riesgo significativo para la salud general. Se recomienda limitar el tiempo de permanencia en la calle.',
        sensitiveGroups: 'PERMANEZCA EN INTERIORES. Evite cualquier salida no indispensable.',
        outdoorSports: 'CANCELAR entrenamientos deportivos en exteriores.',
        ventilation: 'No ventilar. Utilice sistemas de filtración HEPA si están disponibles.',
        recommendationLevel: 'alert'
      };
  }
}
