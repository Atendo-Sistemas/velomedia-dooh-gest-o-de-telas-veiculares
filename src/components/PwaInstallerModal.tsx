import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Smartphone, 
  Download, 
  Check, 
  Share2, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  QrCode, 
  Layers, 
  Wifi, 
  Zap, 
  ShieldCheck, 
  Lock,
  Compass,
  Laptop,
  CheckCircle2,
  HelpCircle,
  Maximize2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Device } from '../types';

interface PwaInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  onLaunchPlayer: (deviceId: string) => void;
}

export const PwaInstallerModal: React.FC<PwaInstallerModalProps> = ({
  isOpen,
  onClose,
  devices,
  onLaunchPlayer,
}) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.id || 'dev_01');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'android_chrome' | 'samsung_internet' | 'ios_safari' | 'windows_chrome'>('android_chrome');

  // Detect PWA Install Prompt & Standalone Mode
  useEffect(() => {
    // Check if already in standalone display mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || devices[0];
  
  // Construct direct PWA launch URL
  const origin = window.location.origin;
  const pwaPlayerUrl = `${origin}/?tab=player&kiosk=true&pwa=1&device=${selectedDevice?.code || 'TV-SP-8491'}`;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        confetti({ particleCount: 50, spread: 60 });
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instruction trigger
      confetti({ particleCount: 30, spread: 45 });
      alert('Para instalar:\n• No Android/Chrome: Toque no menu (3 pontos) > "Adicionar à tela inicial" ou "Instalar Aplicativo".\n• No iOS Safari: Toque em Compartilhar > "Adicionar à Tela de Início".');
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(pwaPlayerUrl);
    setCopiedLink(true);
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLaunchNow = () => {
    onLaunchPlayer(selectedDevice.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl text-slate-100 flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Tv className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  PWA Exclusivo para Tela Veicular (VeloPlayer Kiosk)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  v2.9 PWA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Transforme qualquer Tablet Android, iPad ou Celular em uma tela profissional de publicidade veicular.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">

          {/* Quick Action Hero Banner */}
          <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-cyan-950/60 border border-indigo-500/40 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5 shadow-xl">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-md text-[10px] font-mono font-bold">
                  INSTALAÇÃO STANDALONE EM 1-CLIQUE
                </span>
                {isInstalled && (
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md text-[10px] font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>PWA Já Instalado Neste Navegador</span>
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Pronto para rodar em tela cheia sem barras de navegação!
              </h3>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                O PWA opera com <strong>Service Worker offline</strong> para salvar anúncios em cache, <strong>Wake Lock</strong> (tela sempre ligada), <strong>bloqueio Kiosk com senha PIN</strong> e suporte à telemetria em segundo plano.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-shrink-0">
              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto px-5 py-3.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 transition transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Aplicativo PWA</span>
              </button>

              <button
                onClick={handleLaunchNow}
                className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition"
              >
                <Maximize2 className="w-4 h-4 text-cyan-400" />
                <span>Executar Player Agora</span>
              </button>
            </div>
          </div>

          {/* Device Assignment Selector & QR Code for Direct Tablet Pairing */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Left: Device Selection & URL Box (7 cols) */}
            <div className="md:col-span-7 bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Selecionar Tela / Carro para Gerar o Link PWA:</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {devices.length} Telas Cadastradas
                </span>
              </div>

              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {devices.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.code} • {dev.driverName} ({dev.carModel} - {dev.carPlate}) {dev.hardwareOwnership === 'driver_byod' ? '[BYOD]' : '[Comodato]'}
                  </option>
                ))}
              </select>

              {/* URL Box & Copy */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium">URL Direta para o Tablet / PWA do Carro:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={pwaPlayerUrl}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[11px] font-mono text-cyan-300 select-all"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow transition"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copiado</span>
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

              {/* Selected Device Preview info */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Motorista Parceiro:</span>
                  <span className="font-bold text-white">{selectedDevice.driverName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Placa / Carro:</span>
                  <span className="font-mono text-cyan-300 font-bold">{selectedDevice.carPlate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tipo de Equipamento:</span>
                  <span className="text-slate-300 font-medium">
                    {selectedDevice.hardwareOwnership === 'driver_byod' ? 'BYOD (Tablet do Motorista - 45%)' : 'Comodato da Empresa (20%)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Senha PIN Kiosk:</span>
                  <span className="font-mono text-emerald-400 font-bold">8822 (Padrão)</span>
                </div>
              </div>

            </div>

            {/* Right: QR Code for Instant Tablet Scan (5 cols) */}
            <div className="md:col-span-5 bg-gradient-to-br from-slate-950 to-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <QrCode className="w-4 h-4 text-purple-400" />
                <span>Escanear com a Câmera do Tablet</span>
              </span>

              {/* Dynamic QR Code Render */}
              <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-cyan-500/30">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(pwaPlayerUrl)}`}
                  alt="QR Code PWA Player"
                  className="w-36 h-36 rounded-lg"
                />
              </div>

              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                Abra a câmera do Tablet no carro para abrir o PWA instantaneamente vinculado a este veículo.
              </p>
            </div>

          </div>

          {/* Step-by-Step Installation Guides by Operating System */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Instruções de Instalação e Bloqueio Kiosk por Sistema:</span>
              </h4>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActivePlatformTab('android_chrome')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                  activePlatformTab === 'android_chrome'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android (Google Chrome)</span>
              </button>

              <button
                onClick={() => setActivePlatformTab('samsung_internet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                  activePlatformTab === 'samsung_internet'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Samsung Galaxy Tab</span>
              </button>

              <button
                onClick={() => setActivePlatformTab('ios_safari')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                  activePlatformTab === 'ios_safari'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Apple iPad (Safari)</span>
              </button>

              <button
                onClick={() => setActivePlatformTab('windows_chrome')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                  activePlatformTab === 'windows_chrome'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>TV Box / Mini PC (Chrome/Edge)</span>
              </button>
            </div>

            {/* Platform Guides Content */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-3">
              {activePlatformTab === 'android_chrome' && (
                <div className="space-y-2.5">
                  <div className="flex items-start space-x-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                    <p className="text-slate-300">
                      Abra a URL no <strong>Google Chrome</strong> do tablet ou celular.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                    <p className="text-slate-300">
                      Toque nos <strong>três pontinhos (⋮)</strong> no canto superior direito e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">3</span>
                    <p className="text-slate-300">
                      O ícone do <strong>VeloPlayer TV</strong> aparecerá na tela de início. Ao abrir, ele roda em <strong>modo Kiosk fullscreen 100% limpo</strong>.
                    </p>
                  </div>
                </div>
              )}

              {activePlatformTab === 'samsung_internet' && (
                <div className="space-y-2.5">
                  <div className="flex items-start space-x-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                    <p className="text-slate-300">
                      No navegador Samsung Internet, toque no menu inferior (três linhas ☰).
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                    <p className="text-slate-300">
                      Selecione <strong>"Adicionar página a..."</strong> e escolha <strong>"Tela de início / App"</strong>.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">3</span>
                    <p className="text-slate-300">
                      Dica Pro: Ative o recurso <em>"Fixar Aplicativo"</em> nas configurações do Android (Segurança) para travar a tela permanentemente no carro!
                    </p>
                  </div>
                </div>
              )}

              {activePlatformTab === 'ios_safari' && (
                <div className="space-y-2.5">
                  <div className="flex items-start space-x-3">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                    <p className="text-slate-300">
                      Abra a URL no navegador <strong>Safari</strong> do iPad.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                    <p className="text-slate-300">
                      Toque no botão de <strong>Compartilhar (quadrado com seta para cima ⎋)</strong>.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">3</span>
                    <p className="text-slate-300">
                      Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>. O app abrirá em tela cheia sem a barra de endereços da Apple.
                    </p>
                  </div>
                </div>
              )}

              {activePlatformTab === 'windows_chrome' && (
                <div className="space-y-2.5">
                  <div className="flex items-start space-x-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                    <p className="text-slate-300">
                      No Google Chrome ou Edge, clique no ícone de <strong>Instalar App (computador com seta)</strong> na barra de endereços.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                    <p className="text-slate-300">
                      Marque a opção "Iniciar com o sistema" para que o player suba automaticamente na inicialização da TV veicular.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Built-in PWA Features Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3">
              <Wifi className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-white block">Offline First & Cache</span>
                <span className="text-[11px] text-slate-400">Continua exibindo anúncios mesmo ao passar por túneis ou zonas sem 4G.</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3">
              <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-white block">Bloqueio Kiosk com PIN</span>
                <span className="text-[11px] text-slate-400">Passageiros não conseguem sair ou fechar o player sem a senha master (8822).</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3">
              <Zap className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-white block">Wake Lock & Fullscreen</span>
                <span className="text-[11px] text-slate-400">Impede que o tablet apague a tela ou entre em modo de suspensão durante a corrida.</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Compatível com tablets Android 9.0+, iPads iOS 14+ e Android TV Boxes.
          </span>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Fechar
            </button>
            <button
              onClick={handleLaunchNow}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 transition flex items-center justify-center space-x-1.5"
            >
              <Tv className="w-4 h-4" />
              <span>Abrir Player nesta Tela</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
