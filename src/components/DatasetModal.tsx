// src/components/DatasetModal.tsx
import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Layers, 
  FileSpreadsheet, 
  Activity, 
  Flame, 
  SunMedium, 
  Car, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useDataset, ParseResult } from '../data/datasetContext';
import { STATIONS } from '../data/stations';
import { POLLUTANTS } from '../data/pollutants';
import { MONTH_SHORT_NAMES } from '../data/analytics';

interface DatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'upload' | 'paste' | 'presets' | 'info';

const SAMPLE_CSV_SNIPPET = `PROVINCIA;MUNICIPIO;ESTACION;MAGNITUD;PUNTO_MUESTREO;ANO;MES;D01;V01;D02;V02;D03;V03;D04;V04;D05;V05;D06;V06;D07;V07;D08;V08;D09;V09;D10;V10;D11;V11;D12;V12;D13;V13;D14;V14;D15;V15;D16;V16;D17;V17;D18;V18;D19;V19;D20;V20;D21;V21;D22;V22;D23;V23;D24;V24;D25;V25;D26;V26;D27;V27;D28;V28;D29;V29;D30;V30;D31;V31
28;079;4;8;28079004_8_8;2024;11;22;V;14;V;19;V;26;V;36;V;34;V;33;V;35;V;38;V;33;V;23;V;18;V;16;V;25;V;23;V;27;V;38;V;42;V;26;V;22;V;13;V;28;V;41;V;32;V;30;V;49;V;51;V;53;V;58;V;45;V;0;N
28;079;4;12;28079004_12_8;2024;11;32;V;21;V;31;V;41;V;79;V;72;V;74;V;65;V;82;V;59;V;51;V;32;V;18;V;32;V;27;V;37;V;74;V;98;V;68;V;31;V;17;V;45;V;59;V;42;V;38;V;96;V;125;V;136;V;145;V;117;V;0;N
28;079;8;8;28079008_8_8;2024;11;33;V;22;V;31;V;33;V;46;V;42;V;39;V;46;V;51;V;45;V;31;V;24;V;0;N;35;V;31;V;34;V;40;V;49;V;41;V;26;V;20;V;34;V;40;V;36;V;30;V;58;V;48;V;51;V;58;V;49;V;0;N
28;079;8;12;28079008_12_8;2024;11;40;V;27;V;38;V;41;V;69;V;67;V;57;V;69;V;108;V;64;V;41;V;31;V;0;N;47;V;39;V;40;V;61;V;87;V;88;V;36;V;30;V;52;V;53;V;46;V;39;V;102;V;82;V;100;V;125;V;97;V;0;N
28;079;11;8;28079011_8_8;2024;11;24;V;14;V;24;V;32;V;50;V;40;V;39;V;48;V;53;V;39;V;19;V;20;V;14;V;27;V;25;V;26;V;38;V;50;V;40;V;21;V;13;V;31;V;34;V;27;V;27;V;61;V;49;V;55;V;56;V;48;V;0;N`;

export const DatasetModal: React.FC<DatasetModalProps> = ({ isOpen, onClose }) => {
  const { 
    meta, 
    loadCsvData, 
    loadPreset, 
    resetToDefault, 
    exportCsv,
    activeStationIds,
    activePollutantIds,
    availableMonths
  } = useDataset();

  const [activeTab, setActiveTab] = useState<TabType>('presets');
  const [pasteContent, setPasteContent] = useState<string>('');
  const [datasetTitle, setDatasetTitle] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [lastParseResult, setLastParseResult] = useState<ParseResult | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    setStatusMessage(null);
    setLastParseResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setStatusMessage({ type: 'error', text: 'El archivo seleccionado está vacío.' });
        return;
      }

      const fileName = file.name.replace(/\.[^/.]+$/, '');
      const result = loadCsvData(text, fileName);
      setLastParseResult(result);

      if (result.success) {
        setStatusMessage({ 
          type: 'success', 
          text: `¡Dataset cargado con éxito! Se procesaron ${result.recordsCount} series y ${result.stationsFound.length} estaciones de medición.` 
        });
      } else {
        setStatusMessage({ 
          type: 'error', 
          text: result.errors[0] || 'Error al analizar el formato del archivo CSV.' 
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
      setStatusMessage({ type: 'error', text: 'Por favor, pega el contenido CSV antes de procesar.' });
      return;
    }

    const title = datasetTitle.trim() || 'Dataset Importado';
    const result = loadCsvData(pasteContent, title);
    setLastParseResult(result);

    if (result.success) {
      setStatusMessage({ 
        type: 'success', 
        text: `¡Datos integrados correctamente! ${result.recordsCount} series mensuales activas.` 
      });
    } else {
      setStatusMessage({ 
        type: 'error', 
        text: result.errors[0] || 'No se pudo interpretar el formato CSV.' 
      });
    }
  };

  const handleDownloadCsv = () => {
    const csvData = exportCsv();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `madrid_calidad_aire_${meta.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Carga y Gestión de Datasets
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  OPEN DATA MADRID
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Compatible con el formato oficial del Ayuntamiento de Madrid (diario y mensual)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Dataset Summary Pill */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Dataset Activo:</span>
            <span className="font-semibold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {meta.name}
            </span>
            {meta.isCustom && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Personalizado
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>{meta.totalRecords} series</span>
            <span>•</span>
            <span>{activeStationIds.length} estaciones</span>
            <span>•</span>
            <span>{meta.validityRate}% validez</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('presets'); setStatusMessage(null); }}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'presets'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Catálogo Oficial (Predefinidos)
          </button>

          <button
            onClick={() => { setActiveTab('upload'); setStatusMessage(null); }}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'upload'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Subir Archivo CSV
          </button>

          <button
            onClick={() => { setActiveTab('paste'); setStatusMessage(null); }}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'paste'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Pegar Texto CSV
          </button>

          <button
            onClick={() => { setActiveTab('info'); setStatusMessage(null); }}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'info'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Detalles & Exportar
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Status Message */}
          {statusMessage && (
            <div className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                : 'bg-blue-950/40 text-blue-300 border-blue-500/40'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              )}
              <div className="flex-1 font-medium">{statusMessage.text}</div>
            </div>
          )}

          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Selecciona un escenario o periodo de 2024</h3>
                  <p className="text-xs text-slate-400">
                    Cambia al instante el conjunto de datos para analizar diferentes fenómenos atmosféricos de Madrid.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Full 2024 */}
                <div 
                  onClick={() => {
                    loadPreset('official_2024');
                    setStatusMessage({ type: 'success', text: 'Dataset oficial 2024 restaurado con las 8 estaciones completas.' });
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                    meta.id === 'official_2024'
                      ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/40'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Database className="w-4 h-4" />
                    </span>
                    {meta.id === 'official_2024' && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVO
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Año 2024 Completo (Oficial)</h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Red completa de Enero a Noviembre 2024. 17.050 registros de sensores continuos y 11 parámetros.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800">8 Estaciones</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800">11 Meses</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800">550 Series</span>
                  </div>
                </div>

                {/* 2. Summer Ozone */}
                <div 
                  onClick={() => {
                    loadPreset('summer_ozone_2024');
                    setStatusMessage({ type: 'success', text: 'Filtro aplicado: Episodio de Ozono y Polvo Sahariano (Julio - Agosto 2024).' });
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                    meta.id === 'summer_ozone_2024'
                      ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/40'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <SunMedium className="w-4 h-4" />
                    </span>
                    {meta.id === 'summer_ozone_2024' && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVO
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Episodio Estival: Ozono y Calima</h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Julio y Agosto 2024. Altas temperaturas, picos de O₃ en El Retiro y Casa de Campo, e intrusiones de polvo del Sáhara.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800">Picos O₃</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800">Jul - Ago</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800">62 Días</span>
                  </div>
                </div>

                {/* 3. Winter Inversion NO2 */}
                <div 
                  onClick={() => {
                    loadPreset('winter_no2_2024');
                    setStatusMessage({ type: 'success', text: 'Filtro aplicado: Episodio de Inversión Térmica y NO₂ (Octubre - Noviembre 2024).' });
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                    meta.id === 'winter_no2_2024'
                      ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/40'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                      <Flame className="w-4 h-4" />
                    </span>
                    {meta.id === 'winter_no2_2024' && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVO
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Inversión Térmica y Picos de NO₂</h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Octubre y Noviembre 2024. Inversión térmica de otoño con baja ventilación y acumulación en Plaza de España y Ramón y Cajal.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800">Picos NO₂</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800">Oct - Nov</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800">Anticiclón</span>
                  </div>
                </div>

                {/* 4. Traffic Hotspots */}
                <div 
                  onClick={() => {
                    loadPreset('traffic_hotspots');
                    setStatusMessage({ type: 'success', text: 'Filtro aplicado: Puntos Críticos de Tráfico Urbano.' });
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                    meta.id === 'traffic_hotspots'
                      ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/40'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <Car className="w-4 h-4" />
                    </span>
                    {meta.id === 'traffic_hotspots' && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVO
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Puntos Críticos de Tráfico</h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Estaciones con mayor impacto por circulación de vehículos: Plaza de España, Escuelas Aguirre y Ramón y Cajal (M-30).
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800">Tráfico Puro</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800">3 Estaciones</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800">M-30 y Centro</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD CSV FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Subir Archivo de Datos de Calidad del Aire</h3>
                <p className="text-xs text-slate-400">
                  Arrastra o selecciona un archivo CSV exportado desde el portal de datos abiertos del Ayuntamiento de Madrid.
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-950/20' 
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
                }`}
              >
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    Arrastra aquí tu archivo CSV o <span className="text-emerald-400 underline decoration-emerald-500/50">explora tu equipo</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Archivos admitidos: <span className="font-mono text-slate-300">.csv, .txt, .tsv</span> (separado por comas o punto y coma)
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

              {/* Format Guide Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <FileSpreadsheet className="w-4 h-4" />
                  Estructura Oficial Esperada:
                </div>
                <code className="block text-[11px] font-mono text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800 overflow-x-auto whitespace-pre">
                  PROVINCIA;MUNICIPIO;ESTACION;MAGNITUD;PUNTO_MUESTREO;ANO;MES;D01;V01;D02;V02;...;D31;V31
                </code>
                <p className="text-[11px] text-slate-400">
                  El sistema detecta automáticamente columnas numéricas, banderas de validación ('V'/'N') y estaciones de la red madrileña.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PASTE CSV */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Pegar Contenido CSV Directamente</h3>
                  <p className="text-xs text-slate-400">
                    Pega filas tabulares o del portapapeles para incorporarlas inmediatamente al cuadro de mando.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setPasteContent(SAMPLE_CSV_SNIPPET);
                    setDatasetTitle('Muestra Rápida Noviembre 2024');
                    setStatusMessage({ type: 'info', text: 'Ejemplo insertado. Pulsa "Procesar y Cargar Datos" para integrarlo.' });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Insertar Ejemplo Oficial
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre descriptivo del dataset (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej: Mediciones Estaciones Centro Noviembre 2024"
                  value={datasetTitle}
                  onChange={(e) => setDatasetTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contenido CSV (separado por ; o ,):
                </label>
                <textarea
                  rows={8}
                  placeholder={`PROVINCIA;MUNICIPIO;ESTACION;MAGNITUD;PUNTO_MUESTREO;ANO;MES;D01;V01;D02;V02;...\n28;079;4;8;28079004_8_8;2024;11;22;V;14;V;19;V;...`}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPasteContent('')}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Limpiar
                </button>
                <button
                  onClick={handlePasteSubmit}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Procesar y Cargar Datos
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: INFO & EXPORT */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Metadatos del Conjunto Activo</h3>
                <p className="text-xs text-slate-400">
                  Auditoría de estaciones, magnitudes analizadas y parámetros de calidad de los sensores.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Series Mensuales</div>
                  <div className="text-xl font-bold font-mono text-white">{meta.totalRecords}</div>
                  <div className="text-[10px] text-emerald-400 mt-1">Registros en memoria</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Estaciones Activas</div>
                  <div className="text-xl font-bold font-mono text-white">{activeStationIds.length}</div>
                  <div className="text-[10px] text-blue-400 mt-1">De la red de Madrid</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Contaminantes</div>
                  <div className="text-xl font-bold font-mono text-white">{activePollutantIds.length}</div>
                  <div className="text-[10px] text-purple-400 mt-1">Parámetros medidos</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Tasa de Validez</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">{meta.validityRate}%</div>
                  <div className="text-[10px] text-slate-400 mt-1">Banderas oficiales 'V'</div>
                </div>
              </div>

              {/* Stations List */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">
                  Estaciones Representadas en el Dataset Actual:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {activeStationIds.map(sid => {
                    const st = STATIONS[sid];
                    return (
                      <div key={sid} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-white">
                            {st ? st.name : `Estación #${sid}`}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {st ? st.district : 'Madrid'}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                          ID: {sid}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={resetToDefault}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restablecer a Red Oficial Completa
                </button>

                <button
                  onClick={handleDownloadCsv}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <Download className="w-4 h-4" />
                  Descargar Dataset Actual (.CSV)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>Fuente:</span>
            <span className="text-slate-300">Portal de Datos Abiertos del Ayto. de Madrid</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
