// src/data/datasetContext.tsx
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { AIR_DATA, MonthlyRecord } from './airData';
import { POLLUTANTS, POLLUTANT_LIST, getICAStatus, ICAStatus } from './pollutants';
import { STATIONS, Station } from './stations';
import { 
  DAYS_IN_MONTH_2024, 
  MONTH_NAMES, 
  MONTH_SHORT_NAMES,
  DayStationReading,
  MadridDayOverview,
  PollutantAnnualStats,
  TimeSeriesPoint,
  HeatmapCell 
} from './analytics';

export interface DatasetMeta {
  id: string;
  name: string;
  description: string;
  source: string;
  totalRecords: number;
  totalMeasurements: number;
  stationsCount: number;
  pollutantsCount: number;
  dateRange: string;
  validityRate: number; // e.g. 96.4 (%)
  isCustom: boolean;
}

export interface ParseResult {
  success: boolean;
  recordsCount: number;
  stationsFound: number[];
  pollutantsFound: number[];
  monthsFound: number[];
  validMeasurements: number;
  invalidMeasurements: number;
  errors: string[];
}

interface DatasetContextType {
  meta: DatasetMeta;
  records: MonthlyRecord[];
  activeStationIds: number[];
  activePollutantIds: number[];
  availableMonths: number[];
  // Actions
  loadCsvData: (csvContent: string, customName?: string) => ParseResult;
  loadPreset: (presetKey: string) => void;
  resetToDefault: () => void;
  exportCsv: () => string;
  // Dynamic Query helpers
  getRecord: (stationId: number, pollutantId: number, month: number) => (number | null)[] | null;
  getDailyValue: (stationId: number, pollutantId: number, month: number, day: number) => number | null;
  getStationPollutantIds: (stationId: number) => number[];
  getStationDayReading: (stationId: number, month: number, day: number) => DayStationReading | null;
  getMadridDayOverview: (month: number, day: number) => MadridDayOverview;
  getPollutantAnnualStats: (stationId: number, pollutantId: number) => PollutantAnnualStats | null;
  getTimeSeries: (stationId: number, pollutantId: number) => TimeSeriesPoint[];
  getHeatmapMatrix: (pollutantId: number, stationId?: number) => HeatmapCell[][];
}

const DatasetContext = createContext<DatasetContextType | null>(null);

const DEFAULT_META: DatasetMeta = {
  id: 'official_2024',
  name: 'Red Oficial Madrid 2024',
  description: 'Datos oficiales del Sistema de Vigilancia de Calidad del Aire del Ayuntamiento de Madrid (Ene - Nov 2024)',
  source: 'Portal de Datos Abiertos del Ayuntamiento de Madrid',
  totalRecords: AIR_DATA.length,
  totalMeasurements: 17050,
  stationsCount: 8,
  pollutantsCount: 11,
  dateRange: '01/01/2024 - 30/11/2024',
  validityRate: 98.2,
  isCustom: false
};

// Parser for Madrid Open Data CSV format
export function parseMadridAirCsv(csvText: string): { records: MonthlyRecord[]; result: ParseResult } {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const errors: string[] = [];
  const recordsMap = new Map<string, MonthlyRecord>(); // key: `${s}_${m}_${y}_${mo}`
  
  let validMeasurements = 0;
  let invalidMeasurements = 0;
  const stationsSet = new Set<number>();
  const pollutantsSet = new Set<number>();
  const monthsSet = new Set<number>();

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    if (lineIndex === 0 && (line.toUpperCase().includes('PROVINCIA') || line.toUpperCase().includes('ESTACION'))) {
      continue; // Skip header
    }

    // Try semicolon first, then comma
    let delimiter = ';';
    if (!line.includes(';') && line.includes(',')) {
      delimiter = ',';
    }

    const parts = line.split(delimiter).map(p => p.trim());
    if (parts.length < 8) continue;

    // Detect format:
    // Format A (Daily): PROVINCIA;MUNICIPIO;ESTACION;MAGNITUD;PUNTO_MUESTREO;ANO;MES;D01;V01...
    // parts[2]: station, parts[3]: magnitud, parts[5]: ano, parts[6]: mes
    const stationId = parseInt(parts[2], 10);
    const magnitudeId = parseInt(parts[3], 10);
    const year = parseInt(parts[5], 10);
    const month = parseInt(parts[6], 10);

    if (isNaN(stationId) || isNaN(magnitudeId) || isNaN(month) || month < 1 || month > 12) {
      continue;
    }

    stationsSet.add(stationId);
    pollutantsSet.add(magnitudeId);
    monthsSet.add(month);

    const values: (number | null)[] = [];

    // Check if it has D01, V01... (daily format, 31 days -> up to 62 value/flag columns)
    for (let day = 1; day <= 31; day++) {
      const dIndex = 7 + (day - 1) * 2;
      const vIndex = dIndex + 1;

      if (dIndex < parts.length) {
        const valStr = parts[dIndex].replace(',', '.');
        const flag = vIndex < parts.length ? parts[vIndex].toUpperCase() : 'V';
        const num = parseFloat(valStr);

        if (!isNaN(num) && flag === 'V' && num >= 0) {
          values.push(num);
          validMeasurements++;
        } else {
          values.push(null);
          invalidMeasurements++;
        }
      } else {
        values.push(null);
      }
    }

    const key = `${stationId}_${magnitudeId}_${year}_${month}`;
    recordsMap.set(key, {
      s: stationId,
      m: magnitudeId,
      y: isNaN(year) ? 2024 : year,
      mo: month,
      v: values
    });
  }

  const parsedRecords = Array.from(recordsMap.values());
  const success = parsedRecords.length > 0;

  if (!success) {
    errors.push('No se pudieron extraer registros con el formato oficial del Ayuntamiento de Madrid (PROVINCIA;MUNICIPIO;ESTACION;MAGNITUD;PUNTO_MUESTREO;ANO;MES;D01;V01...)');
  }

  return {
    records: parsedRecords,
    result: {
      success,
      recordsCount: parsedRecords.length,
      stationsFound: Array.from(stationsSet).sort((a, b) => a - b),
      pollutantsFound: Array.from(pollutantsSet).sort((a, b) => a - b),
      monthsFound: Array.from(monthsSet).sort((a, b) => a - b),
      validMeasurements,
      invalidMeasurements,
      errors
    }
  };
}

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<MonthlyRecord[]>(AIR_DATA);
  const [meta, setMeta] = useState<DatasetMeta>(DEFAULT_META);

  // Derive unique stations present in current records
  const activeStationIds = useMemo(() => {
    const ids = new Set<number>();
    for (const r of records) {
      ids.add(r.s);
    }
    return Array.from(ids).sort((a, b) => a - b);
  }, [records]);

  // Derive unique pollutants present
  const activePollutantIds = useMemo(() => {
    const ids = new Set<number>();
    for (const r of records) {
      ids.add(r.m);
    }
    return Array.from(ids).sort((a, b) => a - b);
  }, [records]);

  // Derive available months
  const availableMonths = useMemo(() => {
    const mSet = new Set<number>();
    for (const r of records) {
      mSet.add(r.mo);
    }
    return Array.from(mSet).sort((a, b) => a - b);
  }, [records]);

  // Query helpers
  const getRecord = useCallback((stationId: number, pollutantId: number, month: number): (number | null)[] | null => {
    const found = records.find(r => r.s === stationId && r.m === pollutantId && r.mo === month);
    return found ? found.v : null;
  }, [records]);

  const getDailyValue = useCallback((stationId: number, pollutantId: number, month: number, day: number): number | null => {
    const rec = getRecord(stationId, pollutantId, month);
    if (!rec || day < 1 || day > rec.length) return null;
    return rec[day - 1];
  }, [getRecord]);

  const getStationPollutantIds = useCallback((stationId: number): number[] => {
    const ids = new Set<number>();
    for (const r of records) {
      if (r.s === stationId) ids.add(r.m);
    }
    return Array.from(ids).sort((a, b) => a - b);
  }, [records]);

  const getStationDayReading = useCallback((stationId: number, month: number, day: number): DayStationReading | null => {
    const station = STATIONS[stationId];
    if (!station) return null;

    const pollutantIds = getStationPollutantIds(stationId);
    if (pollutantIds.length === 0) return null;

    const readings: Record<number, number | null> = {};
    const LEVEL_SCORE_MAP: Record<string, number> = {
      good: 1,
      fair: 2,
      moderate: 3,
      poor: 4,
      very_poor: 5
    };

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
  }, [getStationPollutantIds, getDailyValue]);

  const getMadridDayOverview = useCallback((month: number, day: number): MadridDayOverview => {
    const dateStr = `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const stationReadings: DayStationReading[] = [];
    const pollutantSums: Record<number, { sum: number; count: number }> = {};
    let totalValid = 0;
    let cityWorstScore = 0;
    let cityWorstPollutantId: number | null = null;

    for (const sid of activeStationIds) {
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
  }, [activeStationIds, getStationDayReading]);

  const getPollutantAnnualStats = useCallback((stationId: number, pollutantId: number): PollutantAnnualStats | null => {
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
  }, [getDailyValue]);

  const getTimeSeries = useCallback((stationId: number, pollutantId: number): TimeSeriesPoint[] => {
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
  }, [getDailyValue]);

  const getHeatmapMatrix = useCallback((pollutantId: number, stationId?: number): HeatmapCell[][] => {
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
          let sum = 0;
          let count = 0;
          for (const sid of activeStationIds) {
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
  }, [activeStationIds, getDailyValue]);

  // Load custom CSV
  const loadCsvData = useCallback((csvContent: string, customName?: string): ParseResult => {
    const { records: parsedRecords, result } = parseMadridAirCsv(csvContent);
    if (result.success && parsedRecords.length > 0) {
      setRecords(parsedRecords);

      const totalMeas = result.validMeasurements + result.invalidMeasurements;
      const rate = totalMeas > 0 ? Math.round((result.validMeasurements / totalMeas) * 1000) / 10 : 100;

      const minMonth = Math.min(...result.monthsFound);
      const maxMonth = Math.max(...result.monthsFound);
      const dateRangeStr = `${MONTH_SHORT_NAMES[minMonth - 1] || 'Ene'} - ${MONTH_SHORT_NAMES[maxMonth - 1] || 'Nov'} 2024`;

      setMeta({
        id: 'custom_' + Date.now(),
        name: customName || 'Dataset Personalizado',
        description: `Dataset importado con ${result.recordsCount} series mensuales y ${result.stationsFound.length} estaciones`,
        source: 'Archivo CSV importado por el usuario',
        totalRecords: result.recordsCount,
        totalMeasurements: result.validMeasurements,
        stationsCount: result.stationsFound.length,
        pollutantsCount: result.pollutantsFound.length,
        dateRange: dateRangeStr,
        validityRate: rate,
        isCustom: true
      });
    }
    return result;
  }, []);

  // Presets
  const loadPreset = useCallback((presetKey: string) => {
    if (presetKey === 'official_2024') {
      setRecords(AIR_DATA);
      setMeta(DEFAULT_META);
    } else if (presetKey === 'summer_ozone_2024') {
      // Filter months 7 and 8 (July & August)
      const filtered = AIR_DATA.filter(r => r.mo === 7 || r.mo === 8);
      setRecords(filtered);
      setMeta({
        id: 'summer_ozone_2024',
        name: 'Episodio Estival O₃ y Calima (Jul - Ago 2024)',
        description: 'Enfoque en los meses más calurosos con intrusiones saharianas y picos de ozono troposférico',
        source: 'Red de Calidad del Aire de Madrid',
        totalRecords: filtered.length,
        totalMeasurements: filtered.length * 31,
        stationsCount: 8,
        pollutantsCount: 11,
        dateRange: 'Julio - Agosto 2024',
        validityRate: 98.6,
        isCustom: false
      });
    } else if (presetKey === 'winter_no2_2024') {
      // Filter months 10 and 11 (October & November)
      const filtered = AIR_DATA.filter(r => r.mo === 10 || r.mo === 11);
      setRecords(filtered);
      setMeta({
        id: 'winter_no2_2024',
        name: 'Episodio Inversión Térmica NO₂ (Oct - Nov 2024)',
        description: 'Condiciones anticiclónicas invernales de baja dispersión y picos de dióxido de nitrógeno',
        source: 'Red de Calidad del Aire de Madrid',
        totalRecords: filtered.length,
        totalMeasurements: filtered.length * 30,
        stationsCount: 8,
        pollutantsCount: 11,
        dateRange: 'Octubre - Noviembre 2024',
        validityRate: 97.9,
        isCustom: false
      });
    } else if (presetKey === 'traffic_hotspots') {
      // Filter only traffic stations (4: Plaza de España, 8: Escuelas Aguirre, 11: Ramón y Cajal)
      const filtered = AIR_DATA.filter(r => r.s === 4 || r.s === 8 || r.s === 11);
      setRecords(filtered);
      setMeta({
        id: 'traffic_hotspots',
        name: 'Puntos Críticos de Tráfico Urbano',
        description: 'Vigilancia en arterias principales (Plaza España, Escuelas Aguirre y M-30 Ramón y Cajal)',
        source: 'Red de Calidad del Aire de Madrid',
        totalRecords: filtered.length,
        totalMeasurements: filtered.length * 30,
        stationsCount: 3,
        pollutantsCount: 10,
        dateRange: 'Enero - Noviembre 2024',
        validityRate: 98.4,
        isCustom: false
      });
    }
  }, []);

  const resetToDefault = useCallback(() => {
    setRecords(AIR_DATA);
    setMeta(DEFAULT_META);
  }, []);

  // Export CSV
  const exportCsv = useCallback((): string => {
    const header = 'PROVINCIA;MUNICIPIO;ESTACION;MAGNITUD;PUNTO_MUESTREO;ANO;MES;' + 
      Array.from({ length: 31 }, (_, i) => `D${String(i + 1).padStart(2, '0')};V${String(i + 1).padStart(2, '0')}`).join(';');
    
    const rows = records.map(r => {
      const point = `28079${String(r.s).padStart(3, '0')}_${r.m}_8`;
      const valuesStr = r.v.map(v => (v !== null ? `${v};V` : '0;N')).join(';');
      return `28;079;${r.s};${r.m};${point};${r.y};${String(r.mo).padStart(2, '0')};${valuesStr}`;
    });

    return [header, ...rows].join('\n');
  }, [records]);

  const contextValue = useMemo(() => ({
    meta,
    records,
    activeStationIds,
    activePollutantIds,
    availableMonths,
    loadCsvData,
    loadPreset,
    resetToDefault,
    exportCsv,
    getRecord,
    getDailyValue,
    getStationPollutantIds,
    getStationDayReading,
    getMadridDayOverview,
    getPollutantAnnualStats,
    getTimeSeries,
    getHeatmapMatrix
  }), [
    meta,
    records,
    activeStationIds,
    activePollutantIds,
    availableMonths,
    loadCsvData,
    loadPreset,
    resetToDefault,
    exportCsv,
    getRecord,
    getDailyValue,
    getStationPollutantIds,
    getStationDayReading,
    getMadridDayOverview,
    getPollutantAnnualStats,
    getTimeSeries,
    getHeatmapMatrix
  ]);

  return (
    <DatasetContext.Provider value={contextValue}>
      {children}
    </DatasetContext.Provider>
  );
};

export function useDataset(): DatasetContextType {
  const ctx = useContext(DatasetContext);
  if (!ctx) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return ctx;
}
