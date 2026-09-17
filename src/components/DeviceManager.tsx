import React, { useState } from 'react';
import { 
  Tv, 
  Search, 
  Filter, 
  RotateCw, 
  Camera, 
  Sliders, 
  Power, 
  Wifi, 
  BatteryCharging, 
  Thermometer, 
  HardDrive, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Plus,
  Car,
  User,
  MapPin,
  RefreshCw,
  Sparkles,
  Settings
} from 'lucide-react';
import { Device, Driver } from '../types';

interface DeviceManagerProps {
  devices: Device[];
  drivers: Driver[];
  onSelectDevice: (device: Device) => void;
  onLaunchPlayerForDevice: (deviceId: string) => void;
  onSendRemoteCommand: (deviceId: string, command: string) => void;
  onPairNewDevice: () => void;
  onOpenMobileTester?: () => void;
  onOpenPwaInstaller?: () => void;
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({
  devices,
  drivers,
  onSelectDevice,
  onLaunchPlayerForDevice,
  onSendRemoteCommand,
  onPairNewDevice,
  onOpenMobileTester,
  onOpenPwaInstaller,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'standby' | 'offline'>('all');
  const [positionFilter, setPositionFilter] = useState<'all' | 'headrest_left' | 'headrest_right' | 'center_console'>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'company_owned' | 'driver_byod'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredDevices = devices.filter((dev) => {
    const matchesSearch =
      dev.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.carPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.model.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || dev.status === statusFilter;
    const matchesPosition = positionFilter === 'all' || dev.screenPosition === positionFilter;
    const matchesOwnership = ownershipFilter === 'all' || (dev.hardwareOwnership || 'company_owned') === ownershipFilter;

    return matchesSearch && matchesStatus && matchesPosition && matchesOwnership;
  });

  const handleCommand = (deviceId: string, code: string, label: string) => {
    onSendRemoteCommand(deviceId, code);
    setActionNotice(`Comando enviado para ${deviceId}: "${label}" via MQTT com sucesso!`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const getPositionLabel = (pos: string) => {
    switch (pos) {
      case 'headrest_left':
        return 'Encosto Traseiro Esquerdo';
      case 'headrest_right':
        return 'Encosto Traseiro Direito';
      case 'center_console':
        return 'Console Central';
      case 'dashboard':
        return 'Painel Frontal';
      default:
        return pos;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Title & Add Device */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <Tv className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Gerenciador de Equipamentos (TVs)</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Controle de hardware veicular, status de energia, telemetria 5G, pareamento de motoristas e comandos remotos.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          {onOpenPwaInstaller && (
            <button
              onClick={onOpenPwaInstaller}
              className="flex items-center space-x-2 px-3.5 py-2.5 bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>Instalar PWA no Tablet</span>
            </button>
          )}

          {onOpenMobileTester && (
            <button
              onClick={onOpenMobileTester}
              className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Wifi className="w-4 h-4 text-blue-400" />
              <span>QR Code Celular</span>
            </button>
          )}

          <button
            onClick={onPairNewDevice}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar / Parear Nova TV</span>
          </button>
        </div>
      </div>

      {/* Action Notice toast */}
      {actionNotice && (
        <div className="p-3 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-cyan-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{actionNotice}</span>
          </div>
          <span className="font-mono text-[10px] bg-cyan-900/60 px-2 py-0.5 rounded">ACK 200 OK</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
        
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por código (ex: TV-SP-8491), motorista, placa ou modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Status filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Todos os Status ({devices.length})</option>
            <option value="online">Online / Exibindo ({devices.filter(d => d.status === 'online').length})</option>
            <option value="standby">Em Espera / Standby ({devices.filter(d => d.status === 'standby').length})</option>
            <option value="offline">Offline ({devices.filter(d => d.status === 'offline').length})</option>
          </select>
        </div>

        {/* Ownership filter */}
        <div>
          <select
            value={ownershipFilter}
            onChange={(e) => setOwnershipFilter(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Todas as Modalidades</option>
            <option value="driver_byod">Equipamento Próprio (BYOD)</option>
            <option value="company_owned">Frota Própria (Comodato)</option>
          </select>
        </div>

        {/* Position filter */}
        <div>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Todas as Posições</option>
            <option value="headrest_left">Encosto Esquerdo</option>
            <option value="headrest_right">Encosto Direito</option>
            <option value="center_console">Console Central</option>
          </select>
        </div>

      </div>

      {/* Devices Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDevices.map((device) => {
          const isOnline = device.status === 'online';
          const isStandby = device.status === 'standby';
          const isByod = device.hardwareOwnership === 'driver_byod';

          return (
            <div
              key={device.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition flex flex-col justify-between group"
            >
              <div>
                {/* Card Header: Device Code & Status */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isOnline 
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                        : isStandby
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      <Tv className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm font-mono">{device.code}</span>
                        {isByod ? (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] font-bold">
                            BYOD (45% PIX)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[9px]">
                            COMODATO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-cyan-300 font-medium">
                        {getPositionLabel(device.screenPosition)}
                      </p>
                    </div>
                  </div>

                  <span className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    isOnline
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : isStandby
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : isStandby ? 'bg-amber-400' : 'bg-rose-400'}`} />
                    <span>{isOnline ? 'ONLINE' : isStandby ? 'STANDBY' : 'OFFLINE'}</span>
                  </span>
                </div>

                {/* Driver & Vehicle Association */}
                <div className="mt-4 p-3 bg-slate-800/60 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center">
                      <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Motorista:
                    </span>
                    <span className="font-semibold text-slate-200">{device.driverName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center">
                      <Car className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Veículo / Placa:
                    </span>
                    <span className="font-mono text-cyan-300 font-semibold">{device.carPlate} <span className="font-sans text-slate-400 font-normal">({device.carModel})</span></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center">
                      <Tv className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Modelo Hardware:
                    </span>
                    <span className="text-slate-300 font-mono text-[11px] truncate max-w-[170px]" title={device.model}>
                      {device.model}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                      Localização Atual:
                    </span>
                    <span className="text-slate-300 truncate max-w-[160px]" title={device.currentLocation.address}>
                      {device.currentLocation.neighborhood}
                    </span>
                  </div>
                </div>

                {/* Live Hardware Telemetry Bar */}
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-slate-800/40 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-center text-slate-400 mb-1">
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-[11px] font-bold text-white font-mono">{device.telemetry.batteryVoltage}V</div>
                    <div className="text-[9px] text-slate-500 uppercase">Alimentação</div>
                  </div>

                  <div className="p-2 bg-slate-800/40 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-center text-slate-400 mb-1">
                      <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="text-[11px] font-bold text-white font-mono">{device.telemetry.signalStrength.split('_')[0]}</div>
                    <div className="text-[9px] text-slate-500 uppercase">{device.telemetry.signalDbm} dBm</div>
                  </div>

                  <div className="p-2 bg-slate-800/40 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-center text-slate-400 mb-1">
                      <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-[11px] font-bold text-white font-mono">{device.telemetry.cpuTemp}°C</div>
                    <div className="text-[9px] text-slate-500 uppercase">Temp CPU</div>
                  </div>

                  <div className="p-2 bg-slate-800/40 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-center text-slate-400 mb-1">
                      <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="text-[11px] font-bold text-white font-mono">{device.telemetry.storageFreeGb}GB</div>
                    <div className="text-[9px] text-slate-500 uppercase">Livre</div>
                  </div>
                </div>

                {/* Daily stats */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Hoje: <strong className="text-white">{device.totalImpressionsToday}</strong> impressões</span>
                  <span>Uptime: <strong className="text-white">{device.telemetry.screenUptimeTodayHours}h</strong></span>
                </div>
              </div>

              {/* Card Footer: Remote Actions */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onLaunchPlayerForDevice(device.id)}
                    className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow transition"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Ver Player na TV</span>
                  </button>

                  <button
                    onClick={() => onSelectDevice(device)}
                    title="Configurações e Telemetria Detalhada"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                {/* Remote Quick Command Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={() => handleCommand(device.id, 'REBOOT_APP', 'Reiniciar Player')}
                    title="Reiniciar Aplicativo Kiosk"
                    className="py-1.5 px-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-medium rounded-lg flex items-center justify-center space-x-1 transition"
                  >
                    <RotateCw className="w-3 h-3 text-cyan-400" />
                    <span>Reiniciar</span>
                  </button>
                  <button
                    onClick={() => handleCommand(device.id, 'CAPTURE_SCREEN', 'Captura de Tela')}
                    title="Capturar Screenshot em Tempo Real"
                    className="py-1.5 px-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-medium rounded-lg flex items-center justify-center space-x-1 transition"
                  >
                    <Camera className="w-3 h-3 text-indigo-400" />
                    <span>Screenshot</span>
                  </button>
                  <button
                    onClick={() => handleCommand(device.id, 'FORCE_SYNC', 'Sincronizar Cache')}
                    title="Forçar Download do Novo Pacote de Vídeos"
                    className="py-1.5 px-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-medium rounded-lg flex items-center justify-center space-x-1 transition"
                  >
                    <RefreshCw className="w-3 h-3 text-emerald-400" />
                    <span>Sync Cache</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
