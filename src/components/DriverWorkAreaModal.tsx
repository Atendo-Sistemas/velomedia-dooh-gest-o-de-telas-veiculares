import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Car, 
  Compass, 
  Target, 
  CheckCircle2, 
  Building2, 
  Navigation, 
  Sliders, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  ArrowRight,
  Radio,
  Plus,
  Globe,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Driver, Device, GeographicPole } from '../types';
import { 
  getAllCities, 
  findCityData, 
  searchCitySuggestions, 
  getCityPoles, 
  registerCustomCity, 
  addCustomPoleToCity,
  geocodeCityOnline 
} from '../data/geographicPoles';

export interface DriverWorkAreaConfig {
  workingCity: string;
  workingRegion: string;
  workingCenter: { lat: number; lng: number };
  workingRadiusKm: number;
  workingPoles: string[];
}

interface DriverWorkAreaModalProps {
  driver: Driver;
  device?: Device;
  onClose: () => void;
  onSaveWorkArea?: (driverId: string, updatedConfig: DriverWorkAreaConfig) => void;
  onSave?: (updatedConfig: DriverWorkAreaConfig) => void;
}

export const DriverWorkAreaModal: React.FC<DriverWorkAreaModalProps> = ({
  driver,
  device,
  onClose,
  onSaveWorkArea,
  onSave,
}) => {
  // State for city selection
  const [selectedCity, setSelectedCity] = useState<string>(driver.workingCity || device?.currentLocation?.city || 'São Paulo');
  const [citySearchInput, setCitySearchInput] = useState<string>(selectedCity);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [customPoleName, setCustomPoleName] = useState('');
  const [customPoleAddress, setCustomPoleAddress] = useState('');
  const [showAddPoleInline, setShowAddPoleInline] = useState(false);

  // Region and coordinates
  const cityData = findCityData(selectedCity) || getAllCities()[0];
  const [workingRegion, setWorkingRegion] = useState<string>(
    driver.workingRegion || 'Pólo Central & Aeroportos'
  );
  const [lat, setLat] = useState<number>(
    driver.workingCenter?.lat || device?.currentLocation?.lat || cityData.lat
  );
  const [lng, setLng] = useState<number>(
    driver.workingCenter?.lng || device?.currentLocation?.lng || cityData.lng
  );
  const [radiusKm, setRadiusKm] = useState<number>(driver.workingRadiusKm || 15);
  const [selectedPoles, setSelectedPoles] = useState<string[]>(
    driver.workingPoles || (cityData.poles.slice(0, 2).map(p => p.id))
  );

  const cityPoles = getCityPoles(selectedCity);
  const filteredCitySuggestions = searchCitySuggestions(citySearchInput);

  // When city changes, update lat/lng default if not already customized
  const handleSelectCity = (cityName: string) => {
    const data = findCityData(cityName);
    if (data) {
      setSelectedCity(data.city);
      setCitySearchInput(`${data.city}, ${data.state}`);
      setLat(data.lat);
      setLng(data.lng);
      setShowCitySuggestions(false);
      // Select first two poles of the new city
      setSelectedPoles(data.poles.slice(0, 2).map(p => p.id));
      setWorkingRegion(`Região de ${data.city}`);
    }
  };

  // Handler to geocode and register a completely new city that is not in the database
  const handleRegisterNewCityFromSearch = async () => {
    if (!citySearchInput.trim()) return;
    setIsGeocoding(true);
    try {
      const geocoded = await geocodeCityOnline(citySearchInput);
      if (geocoded) {
        const newCity = registerCustomCity({
          city: geocoded.city,
          state: geocoded.state || 'BR',
          lat: geocoded.lat,
          lng: geocoded.lng,
          region: `Praça Operacional de ${geocoded.city}`,
        });
        setSelectedCity(newCity.city);
        setCitySearchInput(`${newCity.city}, ${newCity.state}`);
        setLat(newCity.lat);
        setLng(newCity.lng);
        setSelectedPoles(newCity.poles.map(p => p.id));
        setWorkingRegion(`Região Central de ${newCity.city}`);
        setShowCitySuggestions(false);
        confetti({ particleCount: 40, spread: 60 });
      } else {
        // Fallback with custom coordinates based on current or default center
        const newCity = registerCustomCity({
          city: citySearchInput.trim(),
          state: 'BR',
          lat: lat || -23.5505,
          lng: lng || -46.6333,
          region: `Praça ${citySearchInput.trim()}`,
        });
        setSelectedCity(newCity.city);
        setShowCitySuggestions(false);
      }
    } catch (err) {
      console.error('Error geocoding city:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleAddCustomPole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPoleName.trim()) return;

    const newPoleId = `pole_${Date.now()}`;
    const newPole: GeographicPole = {
      id: newPoleId,
      name: customPoleName.trim(),
      category: 'urban_hub',
      city: selectedCity,
      state: cityData.state,
      lat: lat,
      lng: lng,
      address: customPoleAddress.trim() || `Endereço em ${selectedCity}`,
      dailyEstimatedFootfall: 25000,
      recommendedAudience: 'Passageiros Locais e Motoristas de Aplicativo',
      description: 'Polo customizado cadastrado pelo operador.'
    };

    addCustomPoleToCity(selectedCity, newPole);
    setSelectedPoles([...selectedPoles, newPoleId]);
    setCustomPoleName('');
    setCustomPoleAddress('');
    setShowAddPoleInline(false);
  };

  const handleSelectPole = (pole: GeographicPole) => {
    setLat(pole.lat);
    setLng(pole.lng);
    setWorkingRegion(pole.name);
    if (!selectedPoles.includes(pole.id)) {
      setSelectedPoles([...selectedPoles, pole.id]);
    }
  };

  const togglePole = (poleId: string) => {
    if (selectedPoles.includes(poleId)) {
      setSelectedPoles(selectedPoles.filter(id => id !== poleId));
    } else {
      setSelectedPoles([...selectedPoles, poleId]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const config: DriverWorkAreaConfig = {
      workingCity: selectedCity,
      workingRegion,
      workingCenter: { lat: Number(lat), lng: Number(lng) },
      workingRadiusKm: Number(radiusKm),
      workingPoles: selectedPoles,
    };

    if (typeof onSaveWorkArea === 'function') {
      onSaveWorkArea(driver.id, config);
    }
    if (typeof onSave === 'function') {
      onSave(config);
    }

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 },
    });

    onClose();
  };

  const isExactCityMatch = filteredCitySuggestions.some(
    c => c.city.toLowerCase() === citySearchInput.trim().toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900/40 via-slate-800 to-slate-850 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">Geolocalização de Atuação do Motorista</h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full">
                  GPS & Geocerca
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Defina a praça operacional, polos de circulação prioritária e o raio de cobertura do motorista parceiro.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Driver Summary Banner */}
        <div className="px-6 py-3.5 bg-slate-850/90 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <img 
              src={driver.avatar} 
              alt={driver.name} 
              className="w-10 h-10 rounded-full object-cover border border-blue-500/50" 
            />
            <div>
              <div className="font-bold text-white text-sm">{driver.name}</div>
              <div className="text-slate-400 flex items-center space-x-2 mt-0.5">
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-emerald-400 border border-slate-700">
                  {driver.carPlate}
                </span>
                <span>{driver.carModel}</span>
                <span>•</span>
                <span className="text-blue-300 font-medium">{driver.serviceType}</span>
              </div>
            </div>
          </div>
          {device && (
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Tela Veicular</span>
              <span className="text-xs font-bold text-amber-300 font-mono">{device.code}</span>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* City Autocomplete Search */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Cidade & Praça de Atuação</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Identificação Automática & Geocoding</span>
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={citySearchInput}
                onChange={(e) => {
                  setCitySearchInput(e.target.value);
                  setShowCitySuggestions(true);
                }}
                onFocus={() => setShowCitySuggestions(true)}
                placeholder="Digite qualquer cidade (Ex: Franca, São Carlos, Joinville, Sorocaba, Maringá...)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-24 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500 shadow-inner"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {selectedCity}
                </span>
              </div>
            </div>

            {/* City Autocomplete Dropdown */}
            {showCitySuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50 divide-y divide-slate-800">
                {filteredCitySuggestions.map((c) => (
                  <button
                    key={c.city}
                    type="button"
                    onClick={() => handleSelectCity(c.city)}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <span className="font-bold text-white">{c.city}</span>
                      <span className="text-slate-400 ml-1.5">({c.state} - {c.region})</span>
                      <p className="text-[11px] text-slate-400">{c.poles.length} polos estratégicos mapeados</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
                    </span>
                  </button>
                ))}

                {/* Direct Register Custom City Action if not listed */}
                {!isExactCityMatch && citySearchInput.trim().length > 1 && (
                  <div className="p-3 bg-blue-950/70 border-t border-blue-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Cidade fora do catálogo padrão: "{citySearchInput}"
                      </span>
                      <span className="text-[11px] text-blue-300">
                        Geocodificar coordenadas GPS reais via OpenStreetMap & Cadastrar como nova praça
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isGeocoding}
                      onClick={handleRegisterNewCityFromSearch}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow transition flex-shrink-0"
                    >
                      {isGeocoding ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Globe className="w-3.5 h-3.5" />
                      )}
                      <span>{isGeocoding ? 'Geocodificando...' : 'Cadastrar Praça'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Select Geographic Poles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Polos Geográficos Estratégicos ({selectedCity})</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddPoleInline(!showAddPoleInline)}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar Polo Local</span>
              </button>
            </div>

            {showAddPoleInline && (
              <div className="mb-3 p-3 bg-slate-950 border border-slate-700 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-white text-[11px] block">Cadastrar Novo Polo em {selectedCity}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nome do Polo (Ex: Shopping Center Franca, Rodoviária...)"
                    value={customPoleName}
                    onChange={(e) => setCustomPoleName(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Endereço / Av. Principal"
                    value={customPoleAddress}
                    onChange={(e) => setCustomPoleAddress(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddPoleInline(false)}
                    className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-md text-[11px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomPole}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-bold text-[11px]"
                  >
                    Salvar Polo
                  </button>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
              {cityPoles.map((pole) => {
                const isSelected = selectedPoles.includes(pole.id);
                return (
                  <div
                    key={pole.id}
                    className={`p-2.5 rounded-xl border text-xs transition flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-blue-900/30 border-blue-500/50 text-white shadow-sm' 
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="font-semibold text-white text-[11px] flex items-center space-x-1.5">
                        <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        <span className="truncate">{pole.name}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePole(pole.id)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        title="Vincular polo à rota"
                      />
                    </div>
                    
                    <p className="text-[10px] text-slate-400 truncate mt-1">{pole.address}</p>

                    <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-400 font-mono">
                        {(pole.dailyEstimatedFootfall / 1000).toFixed(0)}k pessoas/dia
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectPole(pole)}
                        className="px-2 py-0.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded font-semibold transition"
                      >
                        Centralizar GPS
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Region & Coordinates Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome da Região / Bairro Base
              </label>
              <input
                type="text"
                value={workingRegion}
                onChange={(e) => setWorkingRegion(e.target.value)}
                placeholder="Ex: Zona Sul / Faria Lima, Savassi..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Raio Operacional Máximo</span>
                <span className="font-mono text-blue-400 font-bold">{radiusKm} km</span>
              </label>
              <div className="flex items-center space-x-3 pt-1">
                <input
                  type="range"
                  min="2"
                  max="60"
                  step="1"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Latitude and Longitude Coordinates */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Coordenadas GPS de Base (Ponto de Partida)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">WGS84 / Mapbox Standard</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Geolocalização de Trabalho</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
