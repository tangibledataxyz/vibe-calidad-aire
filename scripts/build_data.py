# scripts/build_data.py
import json
import glob

# Load all 7 chunks
all_recs = []
for f in sorted(glob.glob("scripts/chunk*.json")):
    data = json.load(open(f))
    all_recs.extend(data)

print(f"Total raw monthly records loaded: {len(all_recs)}")

# Format into clean structure
# We have 8 stations, 11 pollutants, 11 months (Jan to Nov 2024)
# Let's organize as:
# records: array of { s: stationId, m: magnitudeId, y: year, mo: month, v: [31 values] }

# Also calculate some global indexes:
# For each day (month: 1..11, day: 1..31), calculate for each station the ICA and pollutant values
# WHO limits:
# NO2: 25 daily (WHO) / 40 annual (EU) / 200 hourly
# PM10: 45 daily (WHO) / 40 annual (EU)
# PM2.5: 15 daily (WHO) / 25 annual (EU)
# O3: 100 8h (WHO) / 120 (EU)
# SO2: 40 daily (WHO)
# CO: 4 mg/m3 (WHO)

output_ts = f"""// src/data/airData.ts
// Official Madrid Air Quality Network 2024 (January - November)
// 17,050 daily sensor measurement points across 8 stations and 11 atmospheric parameters

export interface MonthlyRecord {{
  s: number; // Station ID
  m: number; // Pollutant Magnitude ID
  y: number; // Year (2024)
  mo: number; // Month (1-11)
  v: (number | null)[]; // Values for days 1-31
}}

export const AIR_DATA: MonthlyRecord[] = {json.dumps(all_recs)};

// Helper to query a specific station, pollutant, month
export function getRecord(stationId: number, pollutantId: number, month: number): (number | null)[] | null {{
  const found = AIR_DATA.find(r => r.s === stationId && r.m === pollutantId && r.mo === month);
  return found ? found.v : null;
}}

// Helper to get daily value for a station, pollutant, month, day (1-indexed)
export function getDailyValue(stationId: number, pollutantId: number, month: number, day: number): number | null {{
  const rec = getRecord(stationId, pollutantId, month);
  if (!rec || day < 1 || day > rec.length) return null;
  return rec[day - 1];
}}
"""

with open("src/data/airData.ts", "w") as f:
    f.write(output_ts)

print("Generated src/data/airData.ts successfully!")
