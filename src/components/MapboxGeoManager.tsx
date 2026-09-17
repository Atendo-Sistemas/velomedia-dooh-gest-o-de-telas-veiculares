import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Layers, 
  Navigation, 
  Crosshair, 
  Radio, 
  Plus, 
  Sliders, 
  Sparkles, 
  Car, 
  Maximize2, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Settings2, 
  Flame, 
  Map as MapIcon, 
  ShieldCheck, 
  Info, 
  TrendingUp,
  Key,
  Compass,
  Zap,
  Play,
  Pause,
  Filter,
  Search,
  Building2,
  Plane,
  ShoppingBag,
  Hotel,
  Users,
  Target,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GeoFence, Device, Campaign, Driver, GeographicPole } from '../types';
import { 
  CITIES_GEOGRAPHIC_DATABASE, 
  CityGeographicData, 
  findCityData, 
  searchCitySuggestions, 
  getCityPoles, 
  geocodeCityOnline 
} from '../data/geographicPoles';
import { DriverWorkAreaModal } from './DriverWorkAreaModal';

interface MapboxGeoManagerProps {
  geoFences: GeoFence[];
  devices: Device[];
  drivers?: Driver[];
  campaigns: Campaign[];
  onAddGeoFence: (fence: GeoFence) => void;
  onUpdateGeoFence: (fence: GeoFence) => void;
  onDeleteGeoFence: (id: string) => void;
  onUpdateDriver?: (driver: Driver) => void;
  onUpdateDevice?: (device: Device) => void;
  onSelectDevice?: (deviceId: string) => void;
}

export const MapboxGeoManager: React.FC<MapboxGeoManagerProps> = ({
  geoFences,
  devices,
  drivers = [],
  campaigns,
  onAddGeoFence,
  onUpdateGeoFence,
  onDeleteGeoFence,
  onUpdateDriver,
  onUpdateDevice,
  onSelectDevice,
}) => {
  // Current active city on map
  const [currentCityName, setCurrentCityName] = useState<string>('São Paulo');
  const activeCityData: CityGeographicData = findCityData(currentCityName) || CITIES_GEOGRAPHIC_DATABASE[0];

  // Map center and zoom
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: activeCityData.lat,
    lng: activeCityData.lng,
  });
  const [zoomLevel, setZoomLevel] = useState<number>(12);
  const [mapStyle, setMapStyle] = useState<'dark' | 'streets' | 'satellite' | 'heatmap'>('dark');
  
  // Selection states
  const [selectedFenceId, setSelectedFenceId] = useState<string | null>(geoFences[0]?.id || null);
  const [selectedPole, setSelectedPole] = useState<GeographicPole | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [filterCampaign, setFilterCampaign] = useState<string>('all');
  const [showPolesLayer, setShowPolesLayer] = useState<boolean>(true);
  const [showGeofencesLayer, setShowGeofencesLayer] = useState<boolean>(true);
  const [showCarsLayer, setShowCarsLayer] = useState<boolean>(true);

  // City Search & Geocoding State
  const [searchCityQuery, setSearchCityQuery] = useState<string>('');
  const [isSearchingCity, setIsSearchingCity] = useState<boolean>(false);
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);
  const [citySearchResults, setCitySearchResults] = useState<CityGeographicData[]>([]);

  // Driver Work Area Modal & Configuration
  const [driverToConfigure, setDriverToConfigure] = useState<Driver | null>(null);
  const [isConfiguringWorkArea, setIsConfiguringWorkArea] = useState<boolean>(false);
  const [activeDriverFilter, setActiveDriverFilter] = useState<string>('all');

  // GPS Movement Simulation State
  const [isSimulatingCarMovement, setIsSimulatingCarMovement] = useState<boolean>(true);
  const [carPositions, setCarPositions] = useState<{ [deviceId: string]: { lat: number; lng: number; speed: number; heading: number } }>({});

  // Mapbox Token settings
  const [mapboxToken, setMapboxToken] = useState<string>(
    localStorage.getItem('velomedia_mapbox_token') || 'pk.eyJ1IjoiZG9vaC1tYXBib3giLCJhIjoiY2x2NGhpYnN6MHNxdTJrbzlyYmN2N3N4dyJ9.demo_token'
  );
  const [showTokenSettings, setShowTokenSettings] = useState<boolean>(false);
  const [isCreatingFence, setIsCreatingFence] = useState<boolean>(false);

  // New fence form state
  const [newFenceName, setNewFenceName] = useState('');
  const [newFenceCity, setNewFenceCity] = useState('São Paulo');
  const [newFenceRadius, setNewFenceRadius] = useState<number>(3.0);
  const [newFenceColor, setNewFenceColor] = useState('#3B82F6');
  const [newFenceDesc, setNewFenceDesc] = useState('');
  const [newFenceLat, setNewFenceLat] = useState(-23.561684);
  const [newFenceLng, setNewFenceLng] = useState(-46.655981);

  // Mouse map coordinate inspector
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Initialize car positions
  useEffect(() => {
    const initial: { [key: string]: { lat: number; lng: number; speed: number; heading: number } } = {};
    devices.forEach((dev, idx) => {
      initial[dev.id] = {
        lat: dev.currentLocation?.lat || (mapCenter.lat + (Math.random() - 0.5) * 0.04),
        lng: dev.currentLocation?.lng || (mapCenter.lng + (Math.random() - 0.5) * 0.04),
        speed: 38 + (idx * 7) % 25,
        heading: (idx * 65) % 360,
      };
    });
    setCarPositions(initial);
  }, [devices]);

  // Real-time subtle vehicle GPS simulation
  useEffect(() => {
    if (!isSimulatingCarMovement) return;

    const interval = setInterval(() => {
      setCarPositions(prev => {
        const next = { ...prev };
        devices.forEach(dev => {
          if (next[dev.id]) {
            const current = next[dev.id];
            const angleRad = (current.heading * Math.PI) / 180;
            const deltaLat = (Math.cos(angleRad) * 0.00035) * (0.8 + Math.random() * 0.4);
            const deltaLng = (Math.sin(angleRad) * 0.00035) * (0.8 + Math.random() * 0.4);

            const nextHeading = (current.heading + (Math.random() - 0.5) * 15 + 360) % 360;
            const nextSpeed = Math.max(15, Math.min(75, current.speed + (Math.random() - 0.5) * 6));

            next[dev.id] = {
              lat: current.lat + deltaLat,
              lng: current.lng + deltaLng,
              speed: Math.round(nextSpeed),
              heading: Math.round(nextHeading),
            };
          }
        });
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulatingCarMovement, devices]);

  // Handle City search change
  const handleCitySearchChange = (query: string) => {
    setSearchCityQuery(query);
    setShowCityDropdown(true);
    if (!query.trim()) {
      setCitySearchResults(CITIES_GEOGRAPHIC_DATABASE);
    } else {
      setCitySearchResults(searchCitySuggestions(query));
    }
  };

  // Select a city from search or quick chips
  const handleSelectCity = (cityData: CityGeographicData) => {
    setCurrentCityName(cityData.city);
    setMapCenter({ lat: cityData.lat, lng: cityData.lng });
    setZoomLevel(cityData.zoom || 12);
    setSearchCityQuery(`${cityData.city}, ${cityData.state}`);
    setShowCityDropdown(false);
    setSelectedPole(null);
    setNewFenceCity(cityData.city);
    setNewFenceLat(cityData.lat);
    setNewFenceLng(cityData.lng);

    // If there are poles, select first pole for inspection
    if (cityData.poles && cityData.poles.length > 0) {
      setSelectedPole(cityData.poles[0]);
    }
  };

  // Perform geocoding when user presses Enter on search
  const handleExecuteGeocode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCityQuery.trim()) return;

    setIsSearchingCity(true);
    const result = await geocodeCityOnline(searchCityQuery);
    setIsSearchingCity(false);

    if (result) {
      setCurrentCityName(result.city);
      setMapCenter({ lat: result.lat, lng: result.lng });
      setZoomLevel(12);
      setShowCityDropdown(false);
      setNewFenceCity(result.city);
      setNewFenceLat(result.lat);
      setNewFenceLng(result.lng);
    }
  };

  // Quick preset: create a geofence around a geographic pole
  const handleCreateFenceFromPole = (pole: GeographicPole) => {
    const newFence: GeoFence = {
      id: `geo_${Date.now()}`,
      name: pole.name,
      city: pole.city,
      center: { lat: pole.lat, lng: pole.lng },
      radiusKm: pole.category === 'airport' ? 5.0 : pole.category === 'financial' ? 3.0 : 2.0,
      color: pole.category === 'airport' ? '#3B82F6' : pole.category === 'financial' ? '#10B981' : '#F59E0B',
      description: pole.description || `Geocerca inteligente de alto impacto no polo ${pole.name} (${(pole.dailyEstimatedFootfall / 1000).toFixed(0)}k pessoas/dia).`,
    };

    onAddGeoFence(newFence);
    setSelectedFenceId(newFence.id);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
  };

  // Quick preset: assign driver base to pole
  const handleAssignDriverToPole = (driverId: string, pole: GeographicPole) => {
    const targetDriver = drivers.find(d => d.id === driverId);
    if (!targetDriver || !onUpdateDriver) return;

    const updatedDriver: Driver = {
      ...targetDriver,
      workingCity: pole.city,
      workingRegion: pole.name,
      workingCenter: { lat: pole.lat, lng: pole.lng },
      workingRadiusKm: 15,
      workingPoles: [pole.id],
    };

    onUpdateDriver(updatedDriver);

    // Also update device location if linked
    if (onUpdateDevice) {
      const linkedDevice = devices.find(dev => dev.driverId === driverId);
      if (linkedDevice) {
        onUpdateDevice({
          ...linkedDevice,
          currentLocation: {
            lat: pole.lat,
            lng: pole.lng,
            neighborhood: pole.name,
            city: pole.city,
          }
        });
      }
    }

    confetti({ particleCount: 25, spread: 45, origin: { y: 0.8 } });
  };

  // Save work area from DriverWorkAreaModal
  const handleSaveDriverWorkArea = (driverId: string, config: {
    workingCity: string;
    workingRegion: string;
    workingCenter: { lat: number; lng: number };
    workingRadiusKm: number;
    workingPoles: string[];
  }) => {
    const targetDriver = drivers.find(d => d.id === driverId);
    if (!targetDriver || !onUpdateDriver) return;

    const updatedDriver: Driver = {
      ...targetDriver,
      ...config,
    };
    onUpdateDriver(updatedDriver);

    // Also update device location if linked
    if (onUpdateDevice) {
      const linkedDevice = devices.find(dev => dev.driverId === driverId);
      if (linkedDevice) {
        onUpdateDevice({
          ...linkedDevice,
          currentLocation: {
            lat: config.workingCenter.lat,
            lng: config.workingCenter.lng,
            neighborhood: config.workingRegion,
            city: config.workingCity,
          }
        });
      }
    }

    // Move map to driver's new center
    setMapCenter(config.workingCenter);
    setCurrentCityName(config.workingCity);
  };

  const handleCreateFenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFenceName.trim()) return;

    const newFence: GeoFence = {
      id: `geo_${Date.now()}`,
      name: newFenceName,
      city: newFenceCity,
      center: { lat: Number(newFenceLat), lng: Number(newFenceLng) },
      radiusKm: Number(newFenceRadius),
      color: newFenceColor,
      description: newFenceDesc || `Geocerca inteligente DOOH com raio de ${newFenceRadius}km em ${newFenceCity}.`,
    };

    onAddGeoFence(newFence);
    setSelectedFenceId(newFence.id);
    setIsCreatingFence(false);
    setNewFenceName('');
    setNewFenceDesc('');
  };

  const handleSaveToken = () => {
    localStorage.setItem('velomedia_mapbox_token', mapboxToken);
    setShowTokenSettings(false);
  };

  // Coordinate projection from GPS to container % relative to mapCenter & zoomLevel
  const projectCoord = (lat: number, lng: number) => {
    const zoomScale = Math.pow(2, zoomLevel - 12) * 1100;
    const offsetX = ((lng - mapCenter.lng) * zoomScale) + 50;
    const offsetY = ((mapCenter.lat - lat) * zoomScale) + 50;
    return { x: offsetX, y: offsetY };
  };

  // Category Icon & Color for Geographic Poles
  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'airport':
        return { icon: Plane, color: '#3B82F6', label: 'Aeroporto Internacional' };
      case 'financial':
        return { icon: Building2, color: '#10B981', label: 'Polo Financeiro & Negócios' };
      case 'shopping':
        return { icon: ShoppingBag, color: '#EC4899', label: 'Shopping de Luxo' };
      case 'hotel':
      case 'nightlife':
        return { icon: Hotel, color: '#F59E0B', label: 'Hotelaria & Gastronomia' };
      case 'convention':
        return { icon: Users, color: '#8B5CF6', label: 'Centro de Convenções' };
      default:
        return { icon: Target, color: '#06B6D4', label: 'Polo Estratégico' };
    }
  };

  // Get devices inside a geofence
  const getDevicesInsideFence = (fence: GeoFence) => {
    return devices.filter(dev => {
      const pos = carPositions[dev.id] || dev.currentLocation;
      if (!pos) return false;
      const dLat = (pos.lat - fence.center.lat) * 111;
      const dLng = (pos.lng - fence.center.lng) * 111 * Math.cos((fence.center.lat * Math.PI) / 180);
      const distanceKm = Math.sqrt(dLat * dLat + dLng * dLng);
      return distanceKm <= fence.radiusKm;
    });
  };

  const cityPoles = getCityPoles(currentCityName);

  return (
    <div className="space-y-6">
      
      {/* Top Header & Mapbox Integration Status */}
      <div className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <MapIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Geolocalização Mapbox & Polos DOOH</h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Geocoding & GPS Ativos</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Localização em tempo real de polos geográficos, busca inteligente de cidades e configuração de área de atuação dos motoristas parceiros.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Driver Geolocation Button */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end flex-wrap gap-2">
          
          <button
            onClick={() => {
              const firstDriver = drivers[0];
              if (firstDriver) setDriverToConfigure(firstDriver);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition"
          >
            <Compass className="w-4 h-4 text-cyan-200" />
            <span>Configurar Área do Motorista</span>
          </button>

          <button
            onClick={() => setIsSimulatingCarMovement(prev => !prev)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              isSimulatingCarMovement 
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {isSimulatingCarMovement ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulatingCarMovement ? 'GPS Live Ativo' : 'GPS Pausado'}</span>
          </button>

          <button
            onClick={() => setShowTokenSettings(!showTokenSettings)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold transition"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Token Mapbox</span>
          </button>

          <button
            onClick={() => setIsCreatingFence(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Geocerca</span>
          </button>
        </div>
      </div>

      {/* Mapbox Token Modal / Dropdown */}
      {showTokenSettings && (
        <div className="bg-slate-850 rounded-2xl p-5 border border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Chave de API / Access Token Mapbox</h3>
            </div>
            <button 
              onClick={() => setShowTokenSettings(false)}
              className="text-slate-400 hover:text-white text-xs font-semibold"
            >
              Fechar
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Insira o seu token público do Mapbox (<code className="text-amber-300">pk.eyJ...</code>) para carregar estilos vetoriais customizados, visualização 3D de edifícios e satélite em alta resolução.
          </p>

          <div className="mt-3 flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              placeholder="pk.eyJ1Ijoi..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleSaveToken}
              className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition flex-shrink-0"
            >
              Salvar & Aplicar
            </button>
          </div>
          <div className="mt-2 flex items-center space-x-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mapbox GL JS v3.0 Vector Layers & Geocoding Service integrados.</span>
          </div>
        </div>
      )}

      {/* Smart City Search Bar & Quick City Pills */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input with Autocomplete */}
          <div className="relative flex-1">
            <form onSubmit={handleExecuteGeocode} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchCityQuery}
                onChange={(e) => handleCitySearchChange(e.target.value)}
                onFocus={() => {
                  setShowCityDropdown(true);
                  if (!searchCityQuery.trim()) setCitySearchResults(CITIES_GEOGRAPHIC_DATABASE);
                }}
                placeholder="Buscar Cidade no Mapbox (ex: Ribeirão Preto, São Paulo, Rio de Janeiro, Curitiba, Campinas...)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-24 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 shadow-inner"
              />
              <button
                type="submit"
                disabled={isSearchingCity}
                className="absolute inset-y-1 right-1 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1"
              >
                {isSearchingCity ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <span>Identificar</span>
                )}
              </button>
            </form>

            {/* City Search Dropdown Suggestions */}
            {showCityDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50 divide-y divide-slate-800">
                {citySearchResults.map((city) => (
                  <button
                    key={city.city}
                    type="button"
                    onClick={() => handleSelectCity(city)}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <span className="font-bold text-white">{city.city}</span>
                      <span className="text-slate-400 ml-1.5">({city.state} - {city.region})</span>
                      <p className="text-[11px] text-slate-400">{city.poles.length} polos estratégicos de alta visibilidade</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Current City Coordinates Badge */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs flex-shrink-0">
            <MapPin className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Cidade Selecionada</div>
              <div className="font-bold text-white">{currentCityName} <span className="text-slate-400 font-normal">({mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)})</span></div>
            </div>
          </div>
        </div>

        {/* Quick Popular City Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1 flex-shrink-0 flex items-center space-x-1">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span>Praças DOOH:</span>
          </span>
          {CITIES_GEOGRAPHIC_DATABASE.map(c => {
            const isActive = c.city === currentCityName;
            return (
              <button
                key={c.city}
                onClick={() => handleSelectCity(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400' 
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>{c.city}</span>
                <span className="text-[10px] opacity-70">({c.state})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Map & GeoFence Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Center: Interactive Map Canvas */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl relative flex flex-col">
            
            {/* Map Top Bar with Style Toggles and Layer Toggles */}
            <div className="p-3 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between flex-wrap gap-2 z-10">
              
              {/* Map Layer Style */}
              <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setMapStyle('dark')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    mapStyle === 'dark' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dark Vector
                </button>
                <button
                  onClick={() => setMapStyle('streets')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    mapStyle === 'streets' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ruas
                </button>
                <button
                  onClick={() => setMapStyle('satellite')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    mapStyle === 'satellite' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Satélite
                </button>
                <button
                  onClick={() => setMapStyle('heatmap')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    mapStyle === 'heatmap' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3 h-3 text-orange-300" />
                  <span>Heatmap</span>
                </button>
              </div>

              {/* Layer Visibility Toggles */}
              <div className="flex items-center space-x-1 text-xs">
                <button
                  onClick={() => setShowPolesLayer(!showPolesLayer)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition ${
                    showPolesLayer ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  Polos ({cityPoles.length})
                </button>
                <button
                  onClick={() => setShowGeofencesLayer(!showGeofencesLayer)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition ${
                    showGeofencesLayer ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  Geocercas ({geoFences.length})
                </button>
                <button
                  onClick={() => setShowCarsLayer(!showCarsLayer)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition ${
                    showCarsLayer ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  Telas ({devices.length})
                </button>
              </div>

              {/* Campaign Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterCampaign}
                  onChange={(e) => setFilterCampaign(e.target.value)}
                  className="bg-slate-900 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Todas as Campanhas</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Mapbox Viewport with Real Map Tiles */}
            <div 
              ref={mapContainerRef}
              onMouseMove={(e) => {
                if (!mapContainerRef.current) return;
                const rect = mapContainerRef.current.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                const zoomScale = Math.pow(2, zoomLevel - 12) * 1100;
                const calcLng = mapCenter.lng + ((x - 50) / zoomScale);
                const calcLat = mapCenter.lat - ((y - 50) / zoomScale);
                setHoverCoords({ lat: calcLat, lng: calcLng });
              }}
              onMouseLeave={() => setHoverCoords(null)}
              className="relative w-full h-[540px] bg-[#0b1329] overflow-hidden select-none"
            >
              
              {/* Real Map Tiles Layer & Stylized Canvas */}
              <div 
                className={`absolute inset-0 transition-opacity duration-500 ${
                  mapStyle === 'satellite' 
                    ? 'opacity-85 bg-[radial-gradient(#1e3a5f_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950'
                    : mapStyle === 'heatmap'
                    ? 'opacity-90 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950'
                    : mapStyle === 'streets'
                    ? 'opacity-100 bg-[#0f172a]'
                    : 'opacity-100 bg-[#090d16]'
                }`}
              >
                {/* SVG Vector Map Arterial Grid */}
                <svg className="w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                    </pattern>
                    <radialGradient id="heatGradientA" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.75" />
                      <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#gridPattern)" />
                  
                  {/* City Vector Road System */}
                  <path d="M 50 120 Q 250 180 500 150 T 800 300" fill="none" stroke="#334155" strokeWidth="6" />
                  <path d="M 120 450 Q 300 320 600 380 T 850 200" fill="none" stroke="#334155" strokeWidth="5" />
                  <path d="M 380 50 L 390 480" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="4 2" />
                  <path d="M 100 280 L 750 240" fill="none" stroke="#38bdf8" strokeWidth="3" opacity="0.6" />
                  <path d="M 480 80 Q 520 280 440 460" fill="none" stroke="#475569" strokeWidth="4" />
                  <circle cx="50%" cy="50%" r="180" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" opacity="0.2" />

                  {/* Heatmap Mode Overlays */}
                  {mapStyle === 'heatmap' && (
                    <>
                      <circle cx="50%" cy="50%" r="160" fill="url(#heatGradientA)" />
                      <circle cx="35%" cy="40%" r="110" fill="url(#heatGradientA)" />
                      <circle cx="65%" cy="60%" r="130" fill="url(#heatGradientA)" />
                    </>
                  )}
                </svg>
              </div>

              {/* Geographic Poles Layer (Real Landmarks: Airports, Financial Centers, Malls) */}
              {showPolesLayer && (
                <div className="absolute inset-0 pointer-events-none">
                  {cityPoles.map((pole) => {
                    const pos = projectCoord(pole.lat, pole.lng);
                    const isSelected = selectedPole?.id === pole.id;
                    const meta = getCategoryMeta(pole.category);
                    const IconComponent = meta.icon;

                    return (
                      <div
                        key={pole.id}
                        style={{
                          left: `${Math.max(6, Math.min(94, pos.x))}%`,
                          top: `${Math.max(6, Math.min(94, pos.y))}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute pointer-events-auto cursor-pointer group z-25"
                        onClick={() => setSelectedPole(pole)}
                      >
                        {/* Pole Marker Icon */}
                        <div className="relative flex items-center justify-center">
                          <span 
                            className="animate-ping absolute inline-flex h-7 w-7 rounded-full opacity-30" 
                            style={{ backgroundColor: meta.color }}
                          />
                          
                          <div 
                            style={{ 
                              backgroundColor: isSelected ? meta.color : '#0f172a',
                              borderColor: meta.color,
                            }}
                            className={`p-2 rounded-xl border-2 shadow-2xl transition-transform transform group-hover:scale-110 flex items-center justify-center ${
                              isSelected ? 'text-white ring-4 ring-blue-400/40' : 'text-slate-200'
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>

                          {/* Pole Label */}
                          <div className="absolute top-full mt-1 px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-700 text-[10px] font-bold text-white whitespace-nowrap shadow-lg flex items-center space-x-1 pointer-events-none">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                            <span>{pole.name.split('&')[0]}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Render GeoFence Perimeters (Circles and Radii) */}
              {showGeofencesLayer && (
                <div className="absolute inset-0 pointer-events-none">
                  {geoFences.map((fence) => {
                    const pos = projectCoord(fence.center.lat, fence.center.lng);
                    const radiusPixels = fence.radiusKm * Math.pow(2, zoomLevel - 12) * 22;
                    const isSelected = fence.id === selectedFenceId;
                    const insideCount = getDevicesInsideFence(fence).length;

                    return (
                      <div
                        key={fence.id}
                        style={{
                          left: `${Math.max(5, Math.min(95, pos.x))}%`,
                          top: `${Math.max(5, Math.min(95, pos.y))}%`,
                          width: `${radiusPixels * 2}px`,
                          height: `${radiusPixels * 2}px`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className={`absolute rounded-full border-2 transition-all duration-300 flex items-center justify-center pointer-events-auto cursor-pointer ${
                          isSelected 
                            ? 'border-blue-400 bg-blue-500/20 ring-4 ring-blue-500/20 shadow-lg shadow-blue-500/30' 
                            : 'border-slate-500/60 bg-slate-700/10 hover:bg-slate-700/20 hover:border-slate-400'
                        }`}
                        onClick={() => setSelectedFenceId(fence.id)}
                      >
                        {/* Center Point Icon */}
                        <div 
                          style={{ backgroundColor: fence.color }} 
                          className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md flex items-center justify-center"
                        >
                          <div className="w-1 h-1 rounded-full bg-white"></div>
                        </div>

                        {/* Label Tag on Top */}
                        <div 
                          className="absolute -top-7 px-2.5 py-1 rounded-md bg-slate-900/90 border text-[10px] font-bold text-white shadow-lg whitespace-nowrap flex items-center space-x-1.5 pointer-events-none"
                          style={{ borderColor: isSelected ? fence.color : '#475569' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: fence.color }}></span>
                          <span>{fence.name}</span>
                          <span className="px-1 py-0.2 rounded bg-slate-800 text-[9px] text-emerald-400 font-mono">
                            {insideCount} telas
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Render Driver Working Area Perimeter (If driver selected) */}
              {driverToConfigure && driverToConfigure.workingCenter && (
                <div className="absolute inset-0 pointer-events-none">
                  {(() => {
                    const pos = projectCoord(driverToConfigure.workingCenter.lat, driverToConfigure.workingCenter.lng);
                    const radiusPixels = (driverToConfigure.workingRadiusKm || 15) * Math.pow(2, zoomLevel - 12) * 22;
                    return (
                      <div
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          width: `${radiusPixels * 2}px`,
                          height: `${radiusPixels * 2}px`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute rounded-full border-2 border-dashed border-cyan-400/80 bg-cyan-500/10 flex items-center justify-center pointer-events-none z-10"
                      >
                        <div className="absolute -top-5 px-2 py-0.5 rounded bg-cyan-900/90 border border-cyan-400 text-[9px] font-bold text-cyan-200 uppercase font-mono">
                          Área de Atuação: {driverToConfigure.name.split(' ')[0]} ({driverToConfigure.workingRadiusKm || 15}km)
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Render Live Moving Cars / Screens */}
              {showCarsLayer && (
                <div className="absolute inset-0 pointer-events-none">
                  {devices.map((device) => {
                    const pos = carPositions[device.id] || {
                      lat: device.currentLocation?.lat || mapCenter.lat,
                      lng: device.currentLocation?.lng || mapCenter.lng,
                      speed: 42,
                      heading: 90,
                    };

                    const projected = projectCoord(pos.lat, pos.lng);
                    const isSelectedCar = selectedCarId === device.id;
                    const activeCamp = campaigns.find(c => c.id === device.activeCampaignId);
                    const driver = drivers.find(d => d.id === device.driverId);

                    return (
                      <div
                        key={device.id}
                        style={{
                          left: `${Math.max(4, Math.min(96, projected.x))}%`,
                          top: `${Math.max(4, Math.min(96, projected.y))}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute pointer-events-auto cursor-pointer group z-30"
                        onClick={() => {
                          setSelectedCarId(device.id);
                          if (onSelectDevice) onSelectDevice(device.id);
                          if (driver) setDriverToConfigure(driver);
                        }}
                      >
                        {/* Car Marker */}
                        <div className="relative flex items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-40"></span>
                          
                          <div className={`p-1.5 rounded-xl border shadow-xl transition-transform transform group-hover:scale-110 ${
                            isSelectedCar 
                              ? 'bg-blue-600 border-white text-white ring-4 ring-blue-400/40'
                              : 'bg-slate-900/95 border-blue-500/70 text-blue-400'
                          }`}>
                            <Car className="w-4 h-4" />
                          </div>

                          {/* Heading Direction Arrow */}
                          <div 
                            style={{ transform: `rotate(${pos.heading}deg)` }}
                            className="absolute -top-1 right-0 text-[10px] text-emerald-400"
                          >
                            ▲
                          </div>
                        </div>

                        {/* Tooltip Card on Hover */}
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-900/95 border border-slate-700 rounded-xl p-2.5 shadow-2xl transition-opacity pointer-events-none z-40 ${
                          isSelectedCar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-white">{device.code}</span>
                            <span className="font-mono text-emerald-400">{pos.speed} km/h</span>
                          </div>
                          <p className="text-[10px] text-slate-300 truncate mt-0.5">{device.driverName}</p>
                          <p className="text-[9px] text-slate-400">{device.carModel} • {device.carPlate}</p>
                          {driver?.workingCity && (
                            <p className="text-[9px] text-cyan-300 mt-0.5">Praça: {driver.workingCity} ({driver.workingRegion || 'Geral'})</p>
                          )}
                          
                          {activeCamp && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center space-x-1 text-[9px] text-blue-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                              <span className="truncate">{activeCamp.advertiser}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Right Map HUD Controls (Zoom & Center Reset) */}
              <div className="absolute bottom-3 right-3 flex flex-col space-y-1.5 z-20">
                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 1, 16))}
                  title="Aproximar Zoom (+)"
                  className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl shadow-lg transition"
                >
                  <ZoomIn className="w-4 h-4 text-blue-400" />
                </button>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 1, 9))}
                  title="Afastar Zoom (-)"
                  className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl shadow-lg transition"
                >
                  <ZoomOut className="w-4 h-4 text-blue-400" />
                </button>
                <button
                  onClick={() => {
                    setMapCenter({ lat: activeCityData.lat, lng: activeCityData.lng });
                    setZoomLevel(activeCityData.zoom || 12);
                  }}
                  title="Centralizar na Cidade Atual"
                  className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl shadow-lg transition"
                >
                  <Crosshair className="w-4 h-4 text-emerald-400" />
                </button>
              </div>

              {/* Bottom Left Live Telemetry & Mouse Inspector */}
              <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 shadow-xl flex items-center space-x-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Mapbox Engine: <strong>{currentCityName}</strong></span>
                {hoverCoords && (
                  <>
                    <span className="text-slate-600">|</span>
                    <span className="text-emerald-400">{hoverCoords.lat.toFixed(4)}, {hoverCoords.lng.toFixed(4)}</span>
                  </>
                )}
                <span className="text-slate-600">|</span>
                <span>Zoom {zoomLevel}x</span>
              </div>
            </div>
          </div>

          {/* Quick Stats of Geo-Network */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium">Polos Mapeados</span>
              <p className="text-lg font-bold text-white mt-0.5">{cityPoles.length} em {currentCityName}</p>
            </div>
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium">Telas em Trânsito</span>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">{devices.filter(d => d.status === 'online').length} Ativas</p>
            </div>
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium">Geocercas Cadastradas</span>
              <p className="text-lg font-bold text-blue-400 mt-0.5">{geoFences.length} Ativas</p>
            </div>
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium">Precisão GPS</span>
              <p className="text-lg font-bold text-purple-400 mt-0.5">WGS84 Sub-metro</p>
            </div>
          </div>
        </div>

        {/* Right Column: Geographic Pole Details & Driver Geolocation Manager */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Selected Pole Inspector Card */}
          {selectedPole ? (
            <div className="bg-slate-850 rounded-2xl p-5 border border-blue-500/50 shadow-2xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedPole.name}</h3>
                    <p className="text-[11px] text-slate-400">{selectedPole.city}, {selectedPole.state}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPole(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Fluxo Diário Estimado:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {(selectedPole.dailyEstimatedFootfall).toLocaleString('pt-BR')} pessoas/dia
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Coordenadas:</span>
                  <span className="text-slate-300 font-mono text-[10px]">
                    {selectedPole.lat.toFixed(5)}, {selectedPole.lng.toFixed(5)}
                  </span>
                </div>
                <div className="pt-1 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Público Recomendado:</span>
                  <span className="text-blue-300 font-medium text-[11px]">{selectedPole.recommendedAudience}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{selectedPole.description}</p>
              </div>

              {/* 1-Click Quick Actions for Pole */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleCreateFenceFromPole(selectedPole)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar Geocerca neste Polo</span>
                </button>

                {drivers.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
                      Fixar Base de Motorista neste Polo:
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <select
                        id="quick-driver-assign-select"
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 flex-1 focus:outline-none focus:border-blue-500"
                      >
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.carPlate})</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const select = document.getElementById('quick-driver-assign-select') as HTMLSelectElement;
                          if (select && select.value) {
                            handleAssignDriverToPole(select.value, selectedPole);
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition"
                      >
                        Fixar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Create GeoFence Drawer / Form */}
          {isCreatingFence && (
            <div className="bg-slate-800/95 rounded-2xl p-5 border border-blue-500/50 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Criar Nova Geocerca</h3>
                </div>
                <button
                  onClick={() => setIsCreatingFence(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleCreateFenceSubmit} className="space-y-3 mt-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nome do Polo / Região</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Polo RibeirãoShopping & Fiusa"
                    value={newFenceName}
                    onChange={(e) => setNewFenceName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Cidade</label>
                    <input
                      type="text"
                      value={newFenceCity}
                      onChange={(e) => setNewFenceCity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Raio (Km)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="20"
                      value={newFenceRadius}
                      onChange={(e) => setNewFenceRadius(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={newFenceLat}
                      onChange={(e) => setNewFenceLat(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={newFenceLng}
                      onChange={(e) => setNewFenceLng(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Cor da Geocerca</label>
                  <div className="flex items-center space-x-2">
                    {['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'].map(c => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setNewFenceColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-lg transition-transform ${
                          newFenceColor === c ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Geocerca</span>
                </button>
              </form>
            </div>
          )}

          {/* List of Geographic Poles in this City */}
          <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Polos Geográficos de {currentCityName} ({cityPoles.length})</span>
              </h3>
              <span className="text-[10px] text-slate-400">Clique para focar</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {cityPoles.map((pole) => {
                const isSelected = selectedPole?.id === pole.id;
                const meta = getCategoryMeta(pole.category);
                const IconComponent = meta.icon;

                return (
                  <div
                    key={pole.id}
                    onClick={() => {
                      setSelectedPole(pole);
                      setMapCenter({ lat: pole.lat, lng: pole.lng });
                    }}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/80 shadow-md ring-1 ring-blue-500/40'
                        : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div 
                        style={{ backgroundColor: meta.color }} 
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{pole.name}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{pole.address}</p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-2">
                      <span className="text-[10px] font-mono text-emerald-400 block font-bold">
                        {(pole.dailyEstimatedFootfall / 1000).toFixed(0)}k/dia
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drivers Working Geolocation Card */}
          <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Área de Atuação dos Motoristas ({drivers.length})</span>
              </h3>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {drivers.map((driver) => {
                const isSelected = driverToConfigure?.id === driver.id;
                return (
                  <div
                    key={driver.id}
                    className={`p-2.5 rounded-xl border transition flex items-center justify-between ${
                      isSelected 
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30' 
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img 
                        src={driver.avatar} 
                        alt={driver.name} 
                        className="w-8 h-8 rounded-full object-cover border border-cyan-500/40 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">{driver.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <span className="text-cyan-300 font-medium">{driver.workingCity || 'São Paulo'}</span>
                          <span>•</span>
                          <span className="truncate">{driver.workingRegion || 'Polo Geral'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setDriverToConfigure(driver)}
                      className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center space-x-1"
                    >
                      <span>Configurar</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Driver Work Area Modal */}
      {driverToConfigure && (
        <DriverWorkAreaModal
          driver={driverToConfigure}
          device={devices.find(d => d.driverId === driverToConfigure.id)}
          onClose={() => setDriverToConfigure(null)}
          onSaveWorkArea={handleSaveDriverWorkArea}
        />
      )}

    </div>
  );
};
