export interface Station {
  id: number;
  name: string;
  shortName: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  type: 'traffic' | 'background' | 'suburban';
  typeLabel: string;
}

export const STATIONS: Record<number, Station> = {
  4: {
    id: 4,
    name: 'Plaza de España',
    shortName: 'Pza. España',
    address: 'Plaza de España s/n',
    district: 'Moncloa-Aravaca / Centro',
    lat: 40.423882,
    lng: -3.712257,
    type: 'traffic',
    typeLabel: 'Tráfico Urbano'
  },
  8: {
    id: 8,
    name: 'Escuelas Aguirre',
    shortName: 'Esc. Aguirre',
    address: 'Entre C/ Alcalá y C/ O\'Donnell',
    district: 'Salamanca',
    lat: 40.421553,
    lng: -3.682316,
    type: 'traffic',
    typeLabel: 'Tráfico Urbano'
  },
  11: {
    id: 11,
    name: 'Ramón y Cajal',
    shortName: 'Ramón y Cajal',
    address: 'Pabellón San Carlos (M-30)',
    district: 'Chamartín',
    lat: 40.451475,
    lng: -3.677356,
    type: 'traffic',
    typeLabel: 'Tráfico Urbano'
  },
  16: {
    id: 16,
    name: 'Arturo Soria',
    shortName: 'Arturo Soria',
    address: 'C/ Arturo Soria, 212',
    district: 'Ciudad Lineal',
    lat: 40.440046,
    lng: -3.639242,
    type: 'background',
    typeLabel: 'Fondo Urbano'
  },
  17: {
    id: 17,
    name: 'Villaverde',
    shortName: 'Villaverde',
    address: 'C/ Juan Peñalver s/n',
    district: 'Villaverde',
    lat: 40.347147,
    lng: -3.713317,
    type: 'background',
    typeLabel: 'Fondo Urbano'
  },
  18: {
    id: 18,
    name: 'Farolillo',
    shortName: 'Farolillo',
    address: 'C/ Farolillo, 16',
    district: 'Carabanchel',
    lat: 40.394782,
    lng: -3.731836,
    type: 'background',
    typeLabel: 'Fondo Urbano'
  },
  24: {
    id: 24,
    name: 'Casa de Campo',
    shortName: 'Casa de Campo',
    address: 'Terminal del Teleférico',
    district: 'Moncloa-Aravaca',
    lat: 40.419358,
    lng: -3.747345,
    type: 'suburban',
    typeLabel: 'Suburbana / Forestal'
  },
  27: {
    id: 27,
    name: 'Barajas Pueblo',
    shortName: 'Barajas',
    address: 'C/ Acuario esq. C/ Pelícano',
    district: 'Barajas',
    lat: 40.476931,
    lng: -3.580026,
    type: 'background',
    typeLabel: 'Fondo Urbano'
  },
  35: {
    id: 35,
    name: 'Plaza del Carmen',
    shortName: 'Pza. del Carmen',
    address: 'Plaza del Carmen',
    district: 'Centro (ZBE)',
    lat: 40.419209,
    lng: -3.703165,
    type: 'traffic',
    typeLabel: 'Tráfico Urbano'
  },
  36: {
    id: 36,
    name: 'Moratalaz',
    shortName: 'Moratalaz',
    address: 'Av. Moratalaz s/n',
    district: 'Moratalaz',
    lat: 40.407952,
    lng: -3.645310,
    type: 'background',
    typeLabel: 'Fondo Urbano'
  },
  38: {
    id: 38,
    name: 'Cuatro Caminos',
    shortName: 'Cuatro Caminos',
    address: 'Avda. Pablo Iglesias, 41',
    district: 'Tetuán',
    lat: 40.445544,
    lng: -3.707130,
    type: 'traffic',
    typeLabel: 'Tráfico Urbano'
  },
  39: {
    id: 39,
    name: 'Barrio del Pilar',
    shortName: 'Bº del Pilar',
    address: 'Parque de los Pinos',
    district: 'Fuencarral-El Pardo',
    lat: 40.478232,
    lng: -3.711536,
    type: 'background',
    typeLabel: 'Fondo Urbano'
  },
  40: {
    id: 40,
    name: 'Vallecas',
    shortName: 'Vallecas',
    address: 'C/ Arroyo del Olivar esq. C/ Sierra Carbonera',
    district: 'Puente de Vallecas',
    lat: 40.388148,
    lng: -3.651529,
    type: 'background',
    typeLabel: 'Fondo Urbano'
  },
  47: {
    id: 47,
    name: 'Méndez Álvaro',
    shortName: 'Méndez Álvaro',
    address: 'C/ Méndez Álvaro, 84',
    district: 'Arganzuela',
    lat: 40.398090,
    lng: -3.686814,
    type: 'traffic',
    typeLabel: 'Tráfico Urbano'
  },
  48: {
    id: 48,
    name: 'Castellana',
    shortName: 'Castellana',
    address: 'Pº de la Castellana, 100',
    district: 'Salamanca / Chamberí',
    lat: 40.439890,
    lng: -3.690372,
    type: 'traffic',
    typeLabel: 'Tráfico Urbano'
  },
  49: {
    id: 49,
    name: 'Parque del Retiro',
    shortName: 'El Retiro',
    address: 'Paseo de Venezuela (Parque del Retiro)',
    district: 'Retiro',
    lat: 40.414444,
    lng: -3.682497,
    type: 'background',
    typeLabel: 'Fondo Urbano / Parque'
  },
  50: {
    id: 50,
    name: 'Plaza Castilla',
    shortName: 'Pza. Castilla',
    address: 'Plaza de Castilla (Canal de Isabel II)',
    district: 'Chamartín',
    lat: 40.465584,
    lng: -3.688745,
    type: 'traffic',
    typeLabel: 'Tráfico Urbano'
  },
  54: {
    id: 54,
    name: 'Ensanche de Vallecas',
    shortName: 'Ensanche Vallecas',
    address: 'Av. La Gavia / C/ Sierra Díaz',
    district: 'Villa de Vallecas',
    lat: 40.373012,
    lng: -3.612139,
    type: 'background',
    typeLabel: 'Fondo Urbano'
  },
  55: {
    id: 55,
    name: 'Urb. Embajada',
    shortName: 'Urb. Embajada',
    address: 'C/ Riaño esq. C/ Yecora',
    district: 'Barajas',
    lat: 40.462363,
    lng: -3.580565,
    type: 'suburban',
    typeLabel: 'Fondo Suburbano'
  },
  56: {
    id: 56,
    name: 'Plaza Elíptica',
    shortName: 'Pza. Elíptica',
    address: 'Pza. Fernández Ladreda / Vía Lusitana',
    district: 'Carabanchel / Usera',
    lat: 40.384814,
    lng: -3.718767,
    type: 'traffic',
    typeLabel: 'Tráfico Urbano (Punto crítico)'
  },
  57: {
    id: 57,
    name: 'Sanchinarro',
    shortName: 'Sanchinarro',
    address: 'C/ Princesa de Éboli esq. C/ María Tudor',
    district: 'Hortaleza',
    lat: 40.494201,
    lng: -3.660517,
    type: 'background',
    typeLabel: 'Fondo Urbano'
  },
  58: {
    id: 58,
    name: 'El Pardo',
    shortName: 'El Pardo',
    address: 'Av. Padre Huidobro (Monte de El Pardo)',
    district: 'Fuencarral-El Pardo',
    lat: 40.518070,
    lng: -3.774611,
    type: 'suburban',
    typeLabel: 'Suburbana / Periurbana'
  },
  59: {
    id: 59,
    name: 'Parque Juan Carlos I',
    shortName: 'Juan Carlos I',
    address: 'Parque Juan Carlos I s/n',
    district: 'Barajas',
    lat: 40.465250,
    lng: -3.609072,
    type: 'suburban',
    typeLabel: 'Fondo Suburbano / Parque'
  },
  60: {
    id: 60,
    name: 'Tres Olivos',
    shortName: 'Tres Olivos',
    address: 'Plaza de la Habilitación s/n',
    district: 'Fuencarral-El Pardo',
    lat: 40.500548,
    lng: -3.689726,
    type: 'background',
    typeLabel: 'Fondo Urbano'
  }
};

export const STATION_LIST = Object.values(STATIONS);
