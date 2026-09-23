import React from 'react';
import { 
  MapPin, 
  LineChart, 
  CalendarRange, 
  Activity, 
  Scale, 
  HeartPulse,
  Database
} from 'lucide-react';

export type TabType = 'map' | 'timeseries' | 'heatmap' | 'pollutants' | 'compare' | 'health' | 'dataset';

interface NavigationTabsProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  datasetName?: string;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onChangeTab, datasetName }) => {
  const tabs = [
    {
      id: 'map' as TabType,
      label: 'Mapa y Sensores',
      icon: MapPin,
      badge: 'Red GIS'
    },
    {
      id: 'timeseries' as TabType,
      label: 'Series Cronológicas',
      icon: LineChart,
      badge: 'Evolución 2024'
    },
    {
      id: 'heatmap' as TabType,
      label: 'Calendario Térmico',
      icon: CalendarRange,
      badge: 'Análisis Anual'
    },
    {
      id: 'pollutants' as TabType,
      label: 'Parámetros y Normativa',
      icon: Activity,
      badge: 'Límites UE/OMS'
    },
    {
      id: 'compare' as TabType,
      label: 'Comparador',
      icon: Scale,
      badge: 'Radar Multicriterio'
    },
    {
      id: 'health' as TabType,
      label: 'Salud y Alertas',
      icon: HeartPulse,
      badge: 'Recomendaciones'
    },
    {
      id: 'dataset' as TabType,
      label: 'Cargar Dataset',
      icon: Database,
      badge: 'CSV / Open Data'
    }
  ];

  return (
    <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-150 border ${
                  isActive
                    ? 'bg-slate-800 text-white border-slate-700 shadow-sm shadow-emerald-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isActive 
                    ? 'bg-slate-900/80 text-emerald-400 border border-emerald-900/50' 
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
