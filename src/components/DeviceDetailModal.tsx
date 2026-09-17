import React, { useState } from 'react';
import { 
  X, 
  Tv, 
  Power, 
  RotateCw, 
  Camera, 
  Sliders, 
  Sun, 
  Volume2, 
  Wifi, 
  BatteryCharging, 
  Thermometer, 
  HardDrive, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  MapPin, 
  Car, 
  User, 
  Play, 
  Activity, 
  ShieldCheck, 
  AlertCircle,
  Radio,
  QrCode,
  Smartphone,
  Download
} from 'lucide-react';
import { Device, Driver } from '../types';

interface DeviceDetailModalProps {
  device: Device;
  drivers: Driver[];
  onClose: () => void;
  onLaunchPlayer: (deviceId: string) => void;
  onUpdateDevice: (updated: Device) => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  drivers,
  onClose,
  onLaunchPlayer,
  onUpdateDevice,
}) => {
  const [brightness, setBrightness] = useState(device.telemetry.brightness);
  const [volume, setVolume] = useState(device.telemetry.volume);
  const [isLocked, setIsLocked] = useState(device.telemetry.kioskLocked);
  const [status, setStatus] = useState(device.status);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isTakingScreenshot, setIsTakingScreenshot] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [showPwaQr, setShowPwaQr] = useState(false);

  const pwaUrl = `${window.location.origin}/?tab=player&kiosk=true&pwa=1&device=${device.code}`;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveSettings = () => {
    const updated: Device = {
      ...device,
      status,
      telemetry: {
        ...device.telemetry,
        brightness,
        volume,
        kioskLocked: isLocked,
      }
    };
    onUpdateDevice(updated);
    showToast('Configurações salvas e transmitidas via MQTT!');
  };

  const handleTakeScreenshot = () => {
    setIsTakingScreenshot(true);
    setTimeout(() => {
      setIsTakingScreenshot(false);
      setScreenshotPreview('https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop&q=80');
      showToast('Captura de tela recebida com sucesso da TV!');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white font-mono">{device.code}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {device.serialNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">{device.model}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {toastMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{toastMsg}</span>
              </div>
            </div>
          )}

          {/* Quick Info & Telemetry Dials */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Alimentação 12V</span>
                <BatteryCharging className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-white font-mono">{device.telemetry.batteryVoltage}V</div>
              <div className="text-[10px] text-emerald-400">Ligado na Ignição</div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Rede 4G/5G</span>
                <Wifi className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-base font-bold text-white font-mono">{device.telemetry.signalDbm} dBm</div>
              <div className="text-[10px] text-cyan-400">{device.telemetry.signalStrength} Conectado</div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Temperatura</span>
                <Thermometer className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-base font-bold text-white font-mono">{device.telemetry.cpuTemp}°C</div>
              <div className="text-[10px] text-slate-400">Normal (Anti-Overheat)</div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Modo Kiosk</span>
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-base font-bold text-white font-mono">{isLocked ? 'ATIVO' : 'LIVRE'}</div>
              <div className="text-[10px] text-indigo-400">Lock Task Mode</div>
            </div>
          </div>

          {/* Vehicle & Driver Association */}
          <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Vínculo Veicular & Modalidade</h3>
              {device.hardwareOwnership === 'driver_byod' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold">
                  BYOD (Equipamento Próprio - 45% Repasse)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                  Frota Empresa (Comodato - 20% Repasse)
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Motorista:</span>
                <div className="font-semibold text-white mt-0.5">{device.driverName}</div>
              </div>
              <div>
                <span className="text-slate-400">Placa / Modelo:</span>
                <div className="font-semibold text-cyan-300 font-mono mt-0.5">{device.carPlate} ({device.carModel})</div>
              </div>
              <div>
                <span className="text-slate-400">Posição da Tela:</span>
                <div className="font-semibold text-slate-200 mt-0.5">
                  {device.screenPosition === 'headrest_right' ? 'Encosto Traseiro Direito' :
                   device.screenPosition === 'headrest_left' ? 'Encosto Traseiro Esquerdo' :
                   device.screenPosition === 'center_console' ? 'Console Central' : 'Painel Frontal'}
                </div>
              </div>
            </div>
          </div>

          {/* Real Monitor Hardware Technical Specifications */}
          {device.hardwareSpecs && (
            <div className="p-4 bg-slate-850/80 rounded-2xl border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tv className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Ficha Técnica Real do Hardware / Monitor
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  {device.hardwareSpecs.brand} • {device.hardwareSpecs.screenSizeInches}" {device.hardwareSpecs.resolution}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-850">
                  <span className="text-[10px] text-slate-400 block">Tipo de Painel</span>
                  <span className="font-bold text-white text-[11px] truncate block" title={device.hardwareSpecs.panelType}>
                    {device.hardwareSpecs.panelType}
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                    {device.hardwareSpecs.brightnessNits} nits
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-850">
                  <span className="text-[10px] text-slate-400 block">Sistema Operacional</span>
                  <span className="font-bold text-white text-[11px] truncate block" title={device.hardwareSpecs.osVersion}>
                    {device.hardwareSpecs.osVersion}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {device.hardwareSpecs.ramGb}GB RAM / {device.hardwareSpecs.internalStorageGb}GB
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-850">
                  <span className="text-[10px] text-slate-400 block">Identificação de Rede</span>
                  <span className="font-bold text-cyan-300 text-[10px] font-mono truncate block" title={device.hardwareSpecs.macAddress}>
                    MAC: {device.hardwareSpecs.macAddress}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate block" title={device.hardwareSpecs.imei}>
                    IMEI: {device.hardwareSpecs.imei}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-850">
                  <span className="text-[10px] text-slate-400 block">Chip & Conectividade</span>
                  <span className="font-bold text-white text-[11px] truncate block">
                    {device.hardwareSpecs.simCarrier}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {device.hardwareSpecs.connectivity}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-850">
                  <span className="text-slate-400">Fixação Veicular: </span>
                  <span className="text-slate-200 font-medium">{device.hardwareSpecs.mountType}</span>
                </div>
                <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-850">
                  <span className="text-slate-400">Alimentação Elétrica: </span>
                  <span className="text-slate-200 font-medium">{device.hardwareSpecs.powerSupply}</span>
                </div>
              </div>
            </div>
          )}

          {/* Hardware Remote Settings */}
          <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ajustes Remotos de Exibição</h3>

            {/* Brightness slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center space-x-1.5">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Brilho da Tela da TV</span>
                </span>
                <span className="font-mono font-bold text-amber-400">{brightness}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-amber-400 bg-slate-700 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Volume slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center space-x-1.5">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>Volume Máximo de Anúncios Interativos</span>
                </span>
                <span className="font-mono font-bold text-cyan-400">{volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-700 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Kiosk Mode Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
              <div>
                <div className="text-xs font-semibold text-white">Trava de Sistema Kiosk (Full Screen Bloqueado)</div>
                <div className="text-[11px] text-slate-400">Impede que o passageiro minimize ou acesse o Android</div>
              </div>
              <button
                type="button"
                onClick={() => setIsLocked(!isLocked)}
                className={`p-2 rounded-xl border flex items-center space-x-1.5 text-xs font-semibold transition ${
                  isLocked
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                <span>{isLocked ? 'Kiosk Travado' : 'Kiosk Destravado'}</span>
              </button>
            </div>
          </div>

          {/* Dedicated PWA Kiosk Link & QR Code */}
          <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>PWA Exclusivo para Esta Tela (Kiosk)</span>
                </h3>
                <p className="text-[11px] text-slate-400">Gere o QR Code de pareamento direto para instalar no tablet deste veículo</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPwaQr(!showPwaQr)}
                className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition border border-cyan-500/30"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showPwaQr ? 'Ocultar QR Code' : 'Ver QR Code PWA'}</span>
              </button>
            </div>

            {showPwaQr && (
              <div className="mt-3 p-4 rounded-xl border border-cyan-500/30 bg-slate-950 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(pwaUrl)}`}
                  alt="QR PWA Player"
                  className="w-28 h-28 rounded-lg bg-white p-1.5 border border-slate-700 flex-shrink-0"
                />
                <div className="space-y-2 text-xs">
                  <div className="text-white font-bold">Instale o VeloPlayer TV neste veículo:</div>
                  <div className="text-[11px] text-slate-300 font-mono break-all bg-slate-900 p-2 rounded-lg border border-slate-800">
                    {pwaUrl}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Ao escanear no tablet do motorista ({device.driverName}), o PWA inicia configurado automaticamente com o PIN <strong>8822</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Remote Screenshot Inspection */}
          <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Captura de Tela ao Vivo</h3>
                <p className="text-[11px] text-slate-400">Verifique exatamente o que está sendo exibido na tela no banco de trás</p>
              </div>
              <button
                onClick={handleTakeScreenshot}
                disabled={isTakingScreenshot}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isTakingScreenshot ? 'Capturando...' : 'Tirar Screenshot'}</span>
              </button>
            </div>

            {screenshotPreview && (
              <div className="mt-3 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2 text-center">
                <img
                  src={screenshotPreview}
                  alt="Live Screenshot"
                  className="w-full max-h-48 object-cover rounded-lg"
                />
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Capturado às {new Date().toLocaleTimeString()} • Resolução: 1920x1200 IPS
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 flex items-center justify-between sticky bottom-0">
          <button
            onClick={() => onLaunchPlayer(device.id)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold flex items-center space-x-2 border border-slate-700 transition"
          >
            <Play className="w-4 h-4" />
            <span>Simular Esta Tela no Carro</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Fechar
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 transition"
            >
              Salvar & Transmitir
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
