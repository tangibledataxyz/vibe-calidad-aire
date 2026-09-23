// src/components/DatasetView.tsx
import React, { useState, useRef } from 'react';
import { 
  Database, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Sparkles, 
  Car, 
  SunMedium, 
  Flame, 
  Layers, 
  FileSpreadsheet,
  MapPin,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useDataset, ParseResult } from '../data/datasetContext';
import { STATIONS } from '../data/stations';
import { POLLUTANTS } from '../data/pollutants';

const SAMPLE_CSV_SNIPPET = `PROVINCIA;MUNICIPIO;ESTACION;MAGNITUD;PUNTO_MUESTREO;ANO;MES;D01;V01;D02;V02;D03;V03;D04;V04;D05;V05;D06;V06;D07;V07;D08;V08;D09;V09;D10;V10;D11;V11;D12;V12;D13;V13;D14;V14;D15;V15;D16;V16;D17;V17;D18;V18;D19;V19;D20;V20;D21;V21;D22;V22;D23;V23;D24;V24;D25;V25;D26;V26;D27;V27;D28;V28;D29;V29;D30;V30;D31;V31
28;079;4;8;28079004_8_8;2024;11;22;V;14;V;19;V;26;V;36;V;34;V;33;V;35;V;38;V;33;V;23;V;18;V;16;V;25;V;23;V;27;V;38;V;42;V;26;V;22;V;13;V;28;V;41;V;32;V;30;V;49;V;51;V;53;V;58;V;45;V;0;N
28;079;4;12;28079004_12_8;2024;11;32;V;21;V;31;V;41;V;79;V;72;V;74;V;65;V;82;V;59;V;51;V;32;V;18;V;32;V;27;V;37;V;74;V;98;V;68;V;31;V;17;V;45;V;59;V;42;V;38;V;96;V;125;V;136;V;145;V;117;V;0;N
28;079;8;8;28079008_8_8;2024;11;33;V;22;V;31;V;33;V;46;V;42;V;39;V;46;V;51;V;45;V;31;V;24;V;0;N;35;V;31;V;34;V;40;V;49;V;41;V;26;V;20;V;34;V;40;V;36;V;30;V;58;V;48;V;51;V;58;V;49;V;0;N
28;079;8;12;28079008_12_8;2024;11;40;V;27;V;38;V;41;V;69;V;67;V;57;V;69;V;108;V;64;V;41;V;31;V;0;N;47;V;39;V;40;V;61;V;87;V;88;V;36;V;30;V;52;V;53;V;46;V;39;V;102;V;82;V;100;V;125;V;97;V;0;N
28;079;11;8;28079011_8_8;2024;11;24;V;14;V;24;V;32;V;50;V;40;V;39;V;48;V;53;V;39;V;19;V;20;V;14;V;27;V;25;V;26;V;38;V;50;V;40;V;21;V;13;V;31;V;34;V;27;V;27;V;61;V;49;V;55;V;56;V;48;V;0;N`;

export const DatasetView: React.FC = () => {
  const { 
    meta, 
    loadCsvData, 
    loadPreset, 
    resetToDefault, 
    exportCsv,
    activeStationIds,
    activePollutantIds 
  } = useDataset();

  const [pasteContent, setPasteContent] = useState<string>('');
  const [datasetName, setDatasetName] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setStatusMessage({ type: 'error', text: 'El archivo está vacío o no se pudo leer.' });
        return;
      }
      const title = file.name.replace(/\.[^/.]+$/, '');
      const result = loadCsvData(text, title);
      if (result.success) {
        setStatusMessage({ 
          type: 'success', 
          text: `¡Dataset "${title}" cargado con éxito! Se procesaron ${result.recordsCount} series y ${result.stationsFound.length} estaciones.` 
        });
      } else {
        setStatusMessage({ 
          type: 'error', 
          text: result.errors[0] || 'Error en la estructura del archivo CSV.' 
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteContent.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor, introduce contenido CSV antes de procesar.' });
      return;
    }
    const title = datasetName.trim() || 'Dataset Pegado';
    const result = loadCsvData(pasteContent, title);
    if (result.success) {
      setStatusMessage({ 
        type: 'success', 
        text: `¡Datos integrados correctamente! ${result.recordsCount} series mensuales activas.` 
      });
    } else {
      setStatusMessage({ 
        type: 'error', 
        text: result.errors[0] || 'El formato CSV no coincide con la especificación del Ayuntamiento de Madrid.' 
      });
    }
  };

  const handleDownloadCsv = () => {
    const csvData = exportCsv();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `madrid_aire_${meta.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Hero Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Database className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Carga y Gestión de Datasets de Calidad del Aire
              </h2>
              {meta.isCustom && (
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Personalizado
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {meta.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 font-mono">
              <span>📅 {meta.dateRange}</span>
              <span>•</span>
              <span>🏛️ {meta.source}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadCsv}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Descargar CSV Actual
            </button>

            <button
              onClick={() => {
                resetToDefault();
                setStatusMessage({ type: 'success', text: 'Dataset oficial 2024 restablecido.' });
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              Restablecer Oficial
            </button>
          </div>
        </div>

        {/* 4 Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] text-slate-400">Series Mensuales</div>
            <div className="text-2xl font-bold font-mono text-white mt-0.5">{meta.totalRecords}</div>
            <div className="text-[10px] text-emerald-400 mt-1">Registros cargados</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] text-slate-400">Estaciones Activas</div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-0.5">{activeStationIds.length}</div>
            <div className="text-[10px] text-slate-400 mt-1">Puntos geográficos</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] text-slate-400">Contaminantes</div>
            <div className="text-2xl font-bold font-mono text-purple-400 mt-0.5">{activePollutantIds.length}</div>
            <div className="text-[10px] text-slate-400 mt-1">Magnitudes analizadas</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] text-slate-400">Tasa de Validez</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">{meta.validityRate}%</div>
            <div className="text-[10px] text-slate-400 mt-1">Banderas oficiales 'V'</div>
          </div>
        </div>
      </div>

      {/* Status Feedback Notification */}
      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs sm:text-sm flex items-start gap-3 border shadow-md ${
          statusMessage.type === 'success'
            ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
            : statusMessage.type === 'error'
            ? 'bg-rose-950/50 text-rose-300 border-rose-500/40'
            : 'bg-blue-950/50 text-blue-300 border-blue-500/40'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          )}
          <div className="flex-1 font-medium">{statusMessage.text}</div>
        </div>
      )}

      {/* 2. Main Grid: Presets & Uploaders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Upload File & Paste CSV (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Uploader Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Upload className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-white">Subir Archivo CSV Oficial</h3>
            </div>
            <p className="text-xs text-slate-400">
              Compatible con los ficheros descargados desde el portal de datos abiertos del Ayuntamiento de Madrid (como <span className="font-mono text-slate-300">calidad_aire_datos_2024.csv</span>).
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-950/20 shadow-inner' 
                  : 'border-slate-700 bg-slate-950/40 hover:border-slate-500 hover:bg-slate-950/70'
              }`}
            >
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  Haz clic o arrastra tu archivo CSV aquí
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  Soporta .csv, .txt, .tsv delimitados por ';' o ','
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </div>
          </div>

          {/* Paste CSV Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <FileText className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-white">Pegar Registros CSV</h3>
              </div>

              <button
                onClick={() => {
                  setPasteContent(SAMPLE_CSV_SNIPPET);
                  setDatasetName('Muestra Rápida Noviembre 2024');
                  setStatusMessage({ type: 'info', text: 'Muestra oficial insertada. Haz clic en "Cargar Datos" para visualizar.' });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Pegar Muestra de Prueba
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Nombre identificador (ej: Noviembre Inversión Térmica)"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <textarea
                  rows={6}
                  placeholder={`PROVINCIA;MUNICIPIO;ESTACION;MAGNITUD;PUNTO_MUESTREO;ANO;MES;D01;V01;D02;V02;...\n28;079;4;8;28079004_8_8;2024;11;22;V;14;V;...`}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => setPasteContent('')}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Limpiar
                </button>
                <button
                  onClick={handlePasteSubmit}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Cargar Datos en el Cuadro de Mando
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Presets & Stations Present (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Preset Scenarios */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-white">Conjuntos Preconfigurados</h3>
            </div>
            <p className="text-xs text-slate-400">
              Selecciona periodos o estaciones específicas para realizar análisis focalizados:
            </p>

            <div className="space-y-2.5">
              {/* Preset 1: Full 2024 */}
              <div
                onClick={() => {
                  loadPreset('official_2024');
                  setStatusMessage({ type: 'success', text: 'Dataset oficial 2024 completo cargado.' });
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  meta.id === 'official_2024'
                    ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/40'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    Red Oficial Madrid 2024
                    {meta.id === 'official_2024' && (
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">ACTIVO</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Enero a Noviembre 2024. 8 estaciones y 11 parámetros continuos.
                  </div>
                </div>
                <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              </div>

              {/* Preset 2: Summer Ozone */}
              <div
                onClick={() => {
                  loadPreset('summer_ozone_2024');
                  setStatusMessage({ type: 'success', text: 'Episodio estival de Ozono y Calima Sahariana cargado.' });
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  meta.id === 'summer_ozone_2024'
                    ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/40'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    Episodio Estival: Ozono y Calima
                    {meta.id === 'summer_ozone_2024' && (
                      <span className="text-[10px] font-mono text-amber-400 font-semibold">ACTIVO</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Julio y Agosto 2024. Picos de O₃ y partículas saharianas PM10.
                  </div>
                </div>
                <SunMedium className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              </div>

              {/* Preset 3: Winter NO2 */}
              <div
                onClick={() => {
                  loadPreset('winter_no2_2024');
                  setStatusMessage({ type: 'success', text: 'Episodio de inversión térmica y NO₂ cargado.' });
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  meta.id === 'winter_no2_2024'
                    ? 'bg-rose-950/30 border-rose-500/60 ring-1 ring-rose-500/40'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    Inversión Térmica: NO₂
                    {meta.id === 'winter_no2_2024' && (
                      <span className="text-[10px] font-mono text-rose-400 font-semibold">ACTIVO</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Octubre y Noviembre 2024. Escaso viento y concentración de NO₂.
                  </div>
                </div>
                <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              </div>

              {/* Preset 4: Traffic Hotspots */}
              <div
                onClick={() => {
                  loadPreset('traffic_hotspots');
                  setStatusMessage({ type: 'success', text: 'Puntos críticos de tráfico cargados.' });
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  meta.id === 'traffic_hotspots'
                    ? 'bg-cyan-950/30 border-cyan-500/60 ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    Puntos Críticos de Tráfico
                    {meta.id === 'traffic_hotspots' && (
                      <span className="text-[10px] font-mono text-cyan-400 font-semibold">ACTIVO</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Plaza de España, Escuelas Aguirre y Ramón y Cajal (M-30).
                  </div>
                </div>
                <Car className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              </div>
            </div>
          </div>

          {/* Active Stations Breakdown */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Estaciones Activas</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {activeStationIds.length} operativas
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {activeStationIds.map(sid => {
                const st = STATIONS[sid];
                return (
                  <div key={sid} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {st ? st.name : `Estación #${sid}`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {st ? st.district : 'Madrid'} • {st ? st.typeLabel : 'Urbana'}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                      ID {sid}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
