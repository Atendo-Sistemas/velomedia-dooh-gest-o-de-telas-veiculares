import React, { useState } from 'react';
import { 
  X, 
  Tv, 
  QrCode, 
  Car, 
  User, 
  CheckCircle2, 
  Plus, 
  Layers,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Zap,
  Percent,
  Check,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Device, Driver, ScreenPosition, DeviceHardwareOwnership } from '../types';

interface PairDeviceModalProps {
  drivers: Driver[];
  onClose: () => void;
  onSaveNewDevice: (device: Device) => void;
}

export const PairDeviceModal: React.FC<PairDeviceModalProps> = ({
  drivers,
  onClose,
  onSaveNewDevice,
}) => {
  const [hardwareOwnership, setHardwareOwnership] = useState<DeviceHardwareOwnership>('driver_byod');
  const [code, setCode] = useState(`TV-SP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [serialNumber, setSerialNumber] = useState(`SN-VK${Date.now().toString().slice(-6)}G`);
  const [model, setModel] = useState('Samsung Galaxy Tab A9+ / Xiaomi Pad / Lenovo (BYOD Motorista)');
  const [screenPosition, setScreenPosition] = useState<ScreenPosition>('headrest_right');
  const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id || '');
  const [carPlate, setCarPlate] = useState('BRA9Z12');
  const [carModel, setCarModel] = useState('Toyota Corolla 2024');

  const handleOwnershipChange = (type: DeviceHardwareOwnership) => {
    setHardwareOwnership(type);
    if (type === 'driver_byod') {
      setModel('Tablet Pessoal do Motorista (Samsung/Lenovo/iPad)');
    } else {
      setModel('VeloTab Pro 10.1" IPS Anti-Glare Kiosk (Comodato)');
    }
  };

  const handleDriverChange = (driverId: string) => {
    setSelectedDriverId(driverId);
    const d = drivers.find((drv) => drv.id === driverId);
    if (d) {
      setCarPlate(d.carPlate);
      setCarModel(d.carModel);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const driver = drivers.find((d) => d.id === selectedDriverId) || drivers[0];

    const newDev: Device = {
      id: `dev_${Date.now()}`,
      code,
      serialNumber,
      model: hardwareOwnership === 'driver_byod' ? `${model} (BYOD Motorista)` : model,
      hardwareOwnership,
      screenPosition,
      status: 'online',
      driverId: driver.id,
      driverName: driver.name,
      carPlate: carPlate || driver.carPlate,
      carModel: carModel || driver.carModel,
      currentLocation: {
        lat: -23.561684,
        lng: -46.655981,
        neighborhood: 'Bela Vista / Av. Paulista',
        city: 'São Paulo',
        address: 'Av. Paulista, 1578',
      },
      telemetry: {
        powerConnected: true,
        batteryLevel: 100,
        batteryVoltage: 13.8,
        cpuTemp: 38.0,
        signalStrength: '5G',
        signalDbm: -67,
        storageFreeGb: 28.0,
        totalStorageGb: 32,
        currentFps: 60,
        brightness: 85,
        volume: 50,
        appVersion: 'v2.8.4-kiosk-locked',
        lastHeartbeat: 'Agora mesmo',
        kioskLocked: true,
        screenUptimeTodayHours: 0.1,
      },
      activeCampaignId: 'cmp_nubank_ultravioleta',
      offlineQueueCount: 0,
      totalImpressionsToday: 0,
      totalInteractionsToday: 0,
    };

    confetti({
      particleCount: 45,
      spread: 65,
      origin: { y: 0.75 }
    });

    onSaveNewDevice(newDev);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Parear & Cadastrar TV de Bordo</h2>
                <span className="text-[10px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-mono">
                  AUTO-PROVISIONAMENTO
                </span>
              </div>
              <p className="text-xs text-slate-400">Escolha entre equipamento próprio do motorista (BYOD) ou comodato</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          
          {/* Modalidade de Equipamento (BYOD vs Comodato da Empresa) */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block">
              Modalidade de Hardware & Repasse:
            </label>
            <div className="grid grid-cols-2 gap-3">
              
              {/* Option 1: BYOD (Motorista Entra com o Equipamento) */}
              <button
                type="button"
                onClick={() => handleOwnershipChange('driver_byod')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  hardwareOwnership === 'driver_byod'
                    ? 'bg-gradient-to-br from-indigo-950/80 to-cyan-950/60 border-cyan-400/80 ring-1 ring-cyan-400/50 shadow-lg'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[11px] font-black text-cyan-300 flex items-center space-x-1">
                    <Smartphone className="w-3.5 h-3.5 mr-1" />
                    BYOD (Motorista)
                  </span>
                  {hardwareOwnership === 'driver_byod' && (
                    <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold text-[9px]">✓</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-300 font-medium">Motorista usa tablet/celular próprio.</p>
                <div className="mt-2 pt-2 border-t border-cyan-500/20 text-[10px] text-emerald-300 font-bold flex items-center justify-between">
                  <span>Repasse Motorista:</span>
                  <span className="font-mono bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">45% da Receita</span>
                </div>
                <span className="text-[9px] text-cyan-200/70 mt-1 block">Zero custo de hardware para a empresa</span>
              </button>

              {/* Option 2: Comodato da Empresa */}
              <button
                type="button"
                onClick={() => handleOwnershipChange('company_owned')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  hardwareOwnership === 'company_owned'
                    ? 'bg-gradient-to-br from-slate-900 to-blue-950/60 border-blue-400/80 ring-1 ring-blue-400/50 shadow-lg'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[11px] font-black text-blue-300 flex items-center space-x-1">
                    <Tv className="w-3.5 h-3.5 mr-1" />
                    Frota da Empresa
                  </span>
                  {hardwareOwnership === 'company_owned' && (
                    <span className="w-4 h-4 rounded-full bg-blue-400 text-slate-950 flex items-center justify-center font-bold text-[9px]">✓</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-300 font-medium">Empresa fornece a TV de bordo.</p>
                <div className="mt-2 pt-2 border-t border-blue-500/20 text-[10px] text-blue-300 font-bold flex items-center justify-between">
                  <span>Repasse Motorista:</span>
                  <span className="font-mono bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800">20% da Receita</span>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 block">Hardware fornecido em comodato</span>
              </button>

            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Código de Identificação</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Número de Série / IMEI</label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Modelo do Tablet / Dispositivo</label>
            <input
              type="text"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              placeholder="Ex: Samsung Galaxy Tab A9+, Xiaomi Redmi Pad SE, Lenovo Tab M10"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Posição de Fixação no Carro</label>
            <select
              value={screenPosition}
              onChange={(e) => setScreenPosition(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="headrest_right">Encosto Traseiro Direito (Passageiro)</option>
              <option value="headrest_left">Encosto Traseiro Esquerdo (Motorista)</option>
              <option value="center_console">Console Central</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Motorista Vinculado</label>
            <select
              value={selectedDriverId}
              onChange={(e) => handleDriverChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              {drivers.map((drv) => (
                <option key={drv.id} value={drv.id}>
                  {drv.name} — {drv.carModel} ({drv.carPlate}) {drv.contractType === 'byod_driver_equipment' ? '• [Equipamento Próprio]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Placa do Veículo</label>
              <input
                type="text"
                value={carPlate}
                onChange={(e) => setCarPlate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Modelo do Carro</label>
              <input
                type="text"
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {hardwareOwnership === 'driver_byod' ? (
            <div className="p-3.5 bg-indigo-950/60 rounded-xl border border-indigo-500/40 space-y-1 text-indigo-200">
              <div className="flex items-center space-x-2 font-bold text-indigo-300">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Ativação BYOD Imediata</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                O motorista só precisa abrir o link do Web Kiosk ou baixar o app no tablet dele. A tela começará a receber anunciantes da cidade e monetizar instantaneamente.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center space-x-2.5 text-slate-300">
              <QrCode className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <span className="text-[11px]">
                Ao salvar, o dispositivo receberá o certificado TLS de autenticação e o manifesto de campanhas automaticamente.
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
            >
              Concluir Pareamento {hardwareOwnership === 'driver_byod' ? '(BYOD)' : ''}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
