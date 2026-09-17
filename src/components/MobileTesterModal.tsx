import React, { useState } from 'react';
import { 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  Wifi, 
  Navigation, 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  ArrowRight,
  Tv,
  Activity,
  Zap,
  Globe
} from 'lucide-react';
import { Device, Driver } from '../types';

interface MobileTesterModalProps {
  device?: Device;
  drivers: Driver[];
  onClose: () => void;
  onLaunchPlayer: (deviceId: string) => void;
}

export const MobileTesterModal: React.FC<MobileTesterModalProps> = ({
  device,
  drivers,
  onClose,
  onLaunchPlayer
}) => {
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [deviceCode, setDeviceCode] = useState(device?.code || 'TV-SP-8491');

  // Direct live URL of the player
  const currentOrigin = window.location.origin;
  const directPlayerUrl = `${currentOrigin}/?tab=player&device=${deviceCode}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(directPlayerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl text-slate-100 flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">Testar no Celular (Modo Kiosk / PWA)</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 font-mono">
                  AO VIVO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transforme qualquer smartphone Android ou iPhone em uma TV de bordo em tempo real.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition border border-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* Main Quick Scan Card */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center bg-slate-900/80 p-5 rounded-xl border border-slate-700">
            
            {/* Left QR Code Container */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center text-center p-3 bg-white rounded-xl shadow-md border border-slate-300">
              {/* Dynamic QR Code Generator via SVG / API */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(directPlayerUrl)}&color=0f172a&bgcolor=ffffff&margin=1`}
                alt="QR Code para conectar celular"
                className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
              />
              <span className="mt-2 text-[11px] font-bold text-slate-800 flex items-center space-x-1">
                <QrCode className="w-3.5 h-3.5 text-blue-600 inline mr-1" />
                Aponte a câmera do celular
              </span>
            </div>

            {/* Right Instructions */}
            <div className="sm:col-span-7 space-y-3">
              <div>
                <span className="text-[10px] text-blue-400 uppercase font-mono font-bold tracking-wider">
                  Link Direto de Conexão
                </span>
                <div className="mt-1 flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={directPlayerUrl}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 font-mono text-[11px] select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="flex-shrink-0 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition flex items-center space-x-1"
                    title="Copiar Link"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400 font-medium">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-lg text-blue-200 text-[11px] space-y-1">
                <p className="font-semibold flex items-center text-blue-300">
                  <Zap className="w-3.5 h-3.5 mr-1 text-blue-400" />
                  Conexão Instantânea com a Central
                </p>
                <p className="text-slate-300">
                  O celular conectará ao nó <strong>{deviceCode}</strong> via WebSockets/MQTT, transmitindo GPS em tempo real e gravando Proof-of-Play.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onLaunchPlayer(device?.id || 'dev_1');
                  }}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition text-xs"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Simular Player Nesta Tela</span>
                </button>
              </div>
            </div>

          </div>

          {/* 3 Simple Steps for Testing on Mobile */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Como testar a conectividade no celular (Passo a Passo)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span className="font-semibold text-white">Escaneie o QR Code</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Abra a câmera do seu smartphone (Android ou iPhone) e toque na notificação para abrir o link.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span className="font-semibold text-white">Adicione à Tela Inicial</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  No Chrome/Safari, toque em <em>"Adicionar à Tela de Início"</em> para rodar em modo Kiosk (Full-Screen sem barra de URL).
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-green-600 text-white font-bold flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span className="font-semibold text-white">Valide a Telemetria</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Toque nos anúncios, responda ao Quiz ou escaneie o cupom. Veja os logs aparecerem instantaneamente no painel!
                </p>
              </div>

            </div>
          </div>

          {/* Device Telemetry Specs */}
          <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-300 text-[11px]">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Modo Offline-First com Cache Local</p>
                <p className="text-slate-400 text-[10px]">
                  Os criativos são baixados na memória do celular. Se o 4G oscilar, os vídeos não travam.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg font-mono text-[10px] whitespace-nowrap">
              Protocolo: MQTT v3.1.1 TLS
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Servidor de Telemetria Pronto para receber conexões</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition"
          >
            Fechar Janela
          </button>
        </div>

      </div>
    </div>
  );
};
