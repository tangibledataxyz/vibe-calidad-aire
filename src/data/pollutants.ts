export interface PollutantInfo {
  id: number;
  code: string;
  name: string;
  formula: string;
  unit: string;
  description: string;
  sources: string;
  healthEffects: string;
  euLimitAnnual?: number;
  euLimitDaily?: number;
  euLimitHourly?: number;
  whoGuidelineDaily?: number;
  // ICA thresholds for daily averages (Good, Fair, Moderate, Poor, Very Poor)
  thresholds: [number, number, number, number, number];
}

export const POLLUTANTS: Record<number, PollutantInfo> = {
  8: {
    id: 8,
    code: 'NO2',
    name: 'Dióxido de Nitrógeno',
    formula: 'NO₂',
    unit: 'µg/m³',
    description: 'Gas asfixiante tóxico pardo-rojizo emitido principalmente por motores de combustión de vehículos diésel y gasolina.',
    sources: 'Tráfico rodado (especialmente diésel), centrales térmicas y calefacciones urbanas.',
    healthEffects: 'Irritación del tracto respiratorio, agravamiento de asma, bronquitis e incremento de afecciones cardiovasculares.',
    euLimitAnnual: 40,
    euLimitHourly: 200,
    whoGuidelineDaily: 25,
    thresholds: [20, 40, 70, 100, 200]
  },
  9: {
    id: 9,
    code: 'PM2.5',
    name: 'Partículas Finas (< 2.5 µm)',
    formula: 'PM₂.₅',
    unit: 'µg/m³',
    description: 'Partículas microscópicas en suspensión capaces de penetrar profundamente en los alvéolos pulmonares y el torrente sanguíneo.',
    sources: 'Gases de escape, fricción de neumáticos/frenos, combustión residencial e industrial.',
    healthEffects: 'Enfermedades cardiorrespiratorias crónicas, cáncer de pulmón e inflamación vascular.',
    euLimitAnnual: 25,
    whoGuidelineDaily: 15,
    thresholds: [10, 20, 25, 50, 75]
  },
  10: {
    id: 10,
    code: 'PM10',
    name: 'Partículas Respirables (< 10 µm)',
    formula: 'PM₁₀',
    unit: 'µg/m³',
    description: 'Aerosoles de polvo, hollín y cenizas que pueden inhalarse e ingresar en las vías respiratorias superiores.',
    sources: 'Obras, resuspensión del tráfico, intrusiones de polvo del desierto del Sahara e industrias.',
    healthEffects: 'Alergias respiratorias, crisis asmáticas y reducción de la capacidad pulmonar.',
    euLimitAnnual: 40,
    euLimitDaily: 50,
    whoGuidelineDaily: 45,
    thresholds: [20, 40, 50, 100, 150]
  },
  14: {
    id: 14,
    code: 'O3',
    name: 'Ozono Troposférico',
    formula: 'O₃',
    unit: 'µg/m³',
    description: 'Contaminante secundario formado en verano por reacciones fotoquímicas entre NOx y COVs en presencia de radiación solar intensa.',
    sources: 'No se emite directamente; se forma a sotavento del tráfico en días soleados de primavera y verano.',
    healthEffects: 'Fuerte irritación ocular y de garganta, tos severa y disminución de la función pulmonar en deportistas y niños.',
    euLimitDaily: 120, // valor objetivo octohorario
    whoGuidelineDaily: 100,
    thresholds: [50, 100, 120, 180, 240]
  },
  7: {
    id: 7,
    code: 'NO',
    name: 'Monóxido de Nitrógeno',
    formula: 'NO',
    unit: 'µg/m³',
    description: 'Gas primario emitido inmediatamente tras la combustión a altas temperaturas en motores y calderas.',
    sources: 'Tubo de escape de vehículos a motor y calderas de calefacción.',
    healthEffects: 'Se oxida rápidamente a NO₂ en la atmósfera. Contribuye a la formación de niebla fotoquímica.',
    thresholds: [20, 50, 100, 150, 250]
  },
  12: {
    id: 12,
    code: 'NOx',
    name: 'Óxidos de Nitrógeno Totales',
    formula: 'NOₓ',
    unit: 'µg/m³',
    description: 'Suma agregada de NO y NO₂ expresada en equivalentes de NO₂.',
    sources: 'Sector del transporte, combustión comercial y residencial.',
    healthEffects: 'Precursor de lluvia ácida y aerosoles de nitrato secundarios.',
    thresholds: [30, 75, 150, 250, 400]
  },
  1: {
    id: 1,
    code: 'SO2',
    name: 'Dióxido de Azufre',
    formula: 'SO₂',
    unit: 'µg/m³',
    description: 'Gas incoloro con olor acre procedente de impurezas de azufre en combustibles.',
    sources: 'Calefacciones de carbón/fuelóleo (casi erradicadas en Madrid), procesos industriales.',
    healthEffects: 'Broncoconstricción e irritación de mucosas.',
    euLimitDaily: 125,
    whoGuidelineDaily: 40,
    thresholds: [10, 20, 50, 125, 350]
  },
  6: {
    id: 6,
    code: 'CO',
    name: 'Monóxido de Carbono',
    formula: 'CO',
    unit: 'mg/m³',
    description: 'Gas inodoro e incoloro generado por combustiones incompletas de carbono.',
    sources: 'Tráfico urbano con motores en frío o ralentí.',
    healthEffects: 'Se une a la hemoglobina disminuyendo la oxigenación de tejidos vitales.',
    euLimitDaily: 10,
    whoGuidelineDaily: 4,
    thresholds: [1.0, 2.5, 5.0, 8.5, 15.0]
  },
  20: {
    id: 20,
    code: 'TOL',
    name: 'Tolueno',
    formula: 'C₇H₈',
    unit: 'µg/m³',
    description: 'Compuesto orgánico volátil (COV) aromático usado como disolvente y aditivo antidetonante.',
    sources: 'Vaporización de gasolinas, disolventes, pinturas y talleres.',
    healthEffects: 'Cefaleas, mareos y fatiga.',
    thresholds: [2.0, 5.0, 10.0, 20.0, 50.0]
  },
  30: {
    id: 30,
    code: 'BEN',
    name: 'Benceno',
    formula: 'C₆H₆',
    unit: 'µg/m³',
    description: 'Hidrocarburo aromático volátil con carcinogenicidad demostrada.',
    sources: 'Evaporación de carburantes e industria petroquímica.',
    healthEffects: 'Cancerígeno humano comprobado (Leucemia mieloide).',
    euLimitAnnual: 5,
    thresholds: [0.5, 1.5, 3.0, 5.0, 10.0]
  },
  35: {
    id: 35,
    code: 'EBE',
    name: 'Etilbenceno',
    formula: 'C₈H₁₀',
    unit: 'µg/m³',
    description: 'Compuesto aromático monoalquílico componente de gasolinas y manufactura de poliestireno.',
    sources: 'Tráfico e industrias químicas.',
    healthEffects: 'Irritación de vías respiratorias y efectos en sistema nervioso central.',
    thresholds: [0.5, 1.5, 3.0, 6.0, 12.0]
  }
};

export const POLLUTANT_LIST = Object.values(POLLUTANTS);

export interface ICAStatus {
  level: 'good' | 'fair' | 'moderate' | 'poor' | 'very_poor';
  label: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
}

export function getICAStatus(pollutantId: number, value: number | null): ICAStatus {
  if (value === null || isNaN(value)) {
    return {
      level: 'good',
      label: 'Sin datos',
      color: '#64748B',
      textColor: 'text-slate-400',
      bgColor: 'bg-slate-800',
      borderColor: 'border-slate-700',
      badgeBg: 'bg-slate-800/80 text-slate-300'
    };
  }

  const p = POLLUTANTS[pollutantId];
  if (!p) {
    return {
      level: 'good',
      label: 'Normal',
      color: '#10B981',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40',
      borderColor: 'border-emerald-800',
      badgeBg: 'bg-emerald-900/60 text-emerald-300'
    };
  }

  const [t1, t2, t3, t4] = p.thresholds;

  if (value <= t1) {
    return {
      level: 'good',
      label: 'Muy Buena',
      color: '#06B6D4', // Cyan
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-950/30',
      borderColor: 'border-cyan-800/60',
      badgeBg: 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50'
    };
  }
  if (value <= t2) {
    return {
      level: 'fair',
      label: 'Buena',
      color: '#10B981', // Emerald
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-950/30',
      borderColor: 'border-emerald-800/60',
      badgeBg: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
    };
  }
  if (value <= t3) {
    return {
      level: 'moderate',
      label: 'Aceptable',
      color: '#F59E0B', // Amber
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-950/30',
      borderColor: 'border-amber-800/60',
      badgeBg: 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
    };
  }
  if (value <= t4) {
    return {
      level: 'poor',
      label: 'Mala',
      color: '#F97316', // Orange
      textColor: 'text-orange-400',
      bgColor: 'bg-orange-950/30',
      borderColor: 'border-orange-800/60',
      badgeBg: 'bg-orange-950/80 text-orange-300 border border-orange-800/50'
    };
  }
  return {
    level: 'very_poor',
    label: 'Muy Mala',
    color: '#EF4444', // Red
    textColor: 'text-red-400',
    bgColor: 'bg-red-950/30',
    borderColor: 'border-red-800/60',
    badgeBg: 'bg-red-950/80 text-red-300 border border-red-800/50'
  };
}
