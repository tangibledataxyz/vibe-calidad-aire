export interface RawAirRecord {
  stationId: number;
  pollutantId: number;
  year: number;
  month: number;
  // 1-indexed days: dailyValues[1] is day 1, up to day 31. null if invalid or nonexistent day
  values: (number | null)[];
}

export interface DayMeasurement {
  date: string; // YYYY-MM-DD
  day: number;
  month: number;
  year: number;
  value: number;
  stationId: number;
  pollutantId: number;
}

export interface StationStats {
  stationId: number;
  pollutantId: number;
  count: number;
  average: number;
  min: number;
  max: number;
  exceedanceCount: number; // days exceeding EU standard
  latestValue: number | null;
  dailyValues: { date: string; value: number }[];
}

export interface DailyMadridSummary {
  date: string;
  day: number;
  month: number;
  avgValue: number;
  minValue: number;
  maxValue: number;
  worstStationId: number;
  stationCount: number;
}
