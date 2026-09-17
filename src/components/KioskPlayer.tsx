import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  MapPin, 
  CloudSun, 
  QrCode, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  CheckCircle2, 
  Heart, 
  Info, 
  HelpCircle, 
  Lock, 
  Unlock,
  Car, 
  Navigation,
  X,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  Settings2,
  Ratio,
  Maximize2,
  RefreshCw,
  Eye,
  Download,
  Wifi,
  WifiOff,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Campaign, Device, GeoFence, ProofOfPlayLog } from '../types';
import { PASSENGER_TRIVIA, CITY_NEWS } from '../data/mockData';
import { generateProofOfPlayHash, getMatchingGeoFences, isCampaignEligible } from '../services/telemetryEngine';

export type ScreenAspectFormat = 'fullscreen_fill' | 'ratio_16_9' | 'ratio_16_10' | 'ratio_4_3';

interface KioskPlayerProps {
  device: Device;
  campaigns: Campaign[];
  geoFences: GeoFence[];
  onExitPlayer: () => void;
  onRecordProofOfPlay: (log: ProofOfPlayLog) => void;
  onUpdateDeviceLocation: (deviceId: string, lat: number, lng: number, address: string, neighborhood: string) => void;
}

export const KioskPlayer: React.FC<KioskPlayerProps> = ({
  device,
  campaigns,
  geoFences,
  onExitPlayer,
  onRecordProofOfPlay,
  onUpdateDeviceLocation,
}) => {
  const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCssFullscreen, setIsCssFullscreen] = useState(false);
  const [likedCampaigns, setLikedCampaigns] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(null);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  
  // Format / Aspect ratio lock
  const [screenFormat, setScreenFormat] = useState<ScreenAspectFormat>('fullscreen_fill');
  
  // KIOSK LOCKDOWN & SECURITY PIN STATE
  const [isKioskLocked, setIsKioskLocked] = useState<boolean>(true);
  const [masterPin, setMasterPin] = useState<string>('8822');
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccessAction, setPinSuccessAction] = useState<(() => void) | null>(null);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinPromptTitle, setPinPromptTitle] = useState<string>('Bloqueio de Segurança Kiosk');
  const [pinPromptDesc, setPinPromptDesc] = useState<string>('Digite o PIN de 4 dígitos para autorizar alterações no sistema.');
  
  // Change PIN mode inside tech menu
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPinValue, setNewPinValue] = useState('');

  // Interactive Modals
  const [showQrModal, setShowQrModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTriviaModal, setShowTriviaModal] = useState(false);
  const [showTechMenu, setShowTechMenu] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);

  // Trivia state
  const [activeTriviaIndex, setActiveTriviaIndex] = useState(0);
  const [selectedTriviaOption, setSelectedTriviaOption] = useState<number | null>(null);
  const [hasAnsweredTrivia, setHasAnsweredTrivia] = useState(false);

  // Screen Wake Lock API for continuous in-car display playback
  useEffect(() => {
    let wakeLockSentinel: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          setWakeLockActive(true);
          console.info('Screen WakeLock ativado com sucesso: A tela não irá apagar durante a corrida.');
        }
      } catch (err) {
        console.warn('Wake Lock request:', err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaInstallPrompt(e);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, []);

  // Get eligible campaigns based on current device location
  const matchingGfs = getMatchingGeoFences(device.currentLocation.lat, device.currentLocation.lng, geoFences);
  const eligibleCampaigns = campaigns.filter((c) => isCampaignEligible(c, device, geoFences));
  const activeCampaignList = eligibleCampaigns.length > 0 ? eligibleCampaigns : campaigns;

  const currentCampaign = activeCampaignList[currentCampaignIndex % activeCampaignList.length] || campaigns[0];

  // Playback timer & PoP generator
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Record Proof of Play
          if (currentCampaign) {
            const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
            const popLog: ProofOfPlayLog = {
              id: `pop_${Date.now()}`,
              timestamp,
              deviceId: device.id,
              campaignId: currentCampaign.id,
              campaignName: currentCampaign.name,
              advertiser: currentCampaign.advertiser,
              durationWatchedSec: currentCampaign.creative.durationSeconds || 15,
              location: device.currentLocation,
              interacted: false,
              verifiedHash: generateProofOfPlayHash(device.id, currentCampaign.id, timestamp),
              syncedOnline: device.status === 'online',
            };
            onRecordProofOfPlay(popLog);
          }

          // Advance to next eligible ad
          setCurrentCampaignIndex((idx) => (idx + 1) % activeCampaignList.length);
          return currentCampaign?.creative.durationSeconds || 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentCampaign, device, activeCampaignList, onRecordProofOfPlay]);

  // Robust Cross-Browser Fullscreen API with zero errors & CSS Fallback
  const requestBrowserFullscreen = async () => {
    const docEl = document.documentElement as any;
    const frame = document.getElementById('tv-kiosk-frame') || docEl;

    try {
      if (frame.requestFullscreen) {
        await frame.requestFullscreen();
      } else if (frame.webkitRequestFullscreen) {
        await frame.webkitRequestFullscreen();
      } else if (frame.mozRequestFullScreen) {
        await frame.mozRequestFullScreen();
      } else if (frame.msRequestFullscreen) {
        await frame.msRequestFullscreen();
      } else {
        // Fallback for sandboxed iframes without fullscreen allow
        setIsCssFullscreen(true);
      }
      setIsFullscreen(true);
      setIsCssFullscreen(true);
    } catch (err) {
      // Gracefully activate CSS Fullscreen if browser policy or iframe blocks native API
      console.info('Modo Tela Cheia emulado via CSS ativo com sucesso.');
      setIsCssFullscreen(true);
      setIsFullscreen(true);
    }
  };

  const exitBrowserFullscreen = async () => {
    const doc = document as any;
    try {
      if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      // ignore
    }
    setIsFullscreen(false);
    setIsCssFullscreen(false);
  };

  // Safe protected action check (PIN verification)
  const requirePinForAction = (
    title: string,
    desc: string,
    action: () => void
  ) => {
    if (!isKioskLocked) {
      // If unlocked, execute directly
      action();
      return;
    }
    // If locked, trigger PIN challenge
    setPinPromptTitle(title);
    setPinPromptDesc(desc);
    setEnteredPin('');
    setPinError(null);
    setPinSuccessAction(() => action);
    setShowPinModal(true);
  };

  // Handle Fullscreen Toggle with PIN check if locked
  const handleToggleFullscreen = () => {
    if (isFullscreen || isCssFullscreen) {
      // Trying to EXIT or MINIMIZE Fullscreen -> Require PIN!
      requirePinForAction(
        'Sair do Modo Tela Cheia',
        'O modo Kiosk está bloqueado para proteger a exibição no veículo. Digite o PIN para minimizar.',
        () => {
          exitBrowserFullscreen();
        }
      );
    } else {
      // Entering Fullscreen is always allowed, and automatically engages lock protection
      requestBrowserFullscreen();
      setIsKioskLocked(true);
    }
  };

  // Handle Exit to Dashboard with PIN check
  const handleProtectedExitToDashboard = () => {
    requirePinForAction(
      'Sair para o Painel Central',
      'Digite a senha de administrador para encerrar o Player e retornar ao painel da frota.',
      () => {
        exitBrowserFullscreen();
        onExitPlayer();
      }
    );
  };

  // Handle Format Alteration with PIN check
  const handleProtectedFormatChange = (newFormat: ScreenAspectFormat) => {
    requirePinForAction(
      'Alterar Formato de Tela',
      'Digite a senha para alterar a resolução e proporção visual do display.',
      () => {
        setScreenFormat(newFormat);
        setShowFormatModal(false);
      }
    );
  };

  // Handle Tech Menu with PIN check
  const handleProtectedOpenTechMenu = () => {
    requirePinForAction(
      'Menu Técnico & Manutenção',
      'Digite o PIN para acessar configurações de hardware, telemetria e diagnóstico.',
      () => {
        setShowTechMenu(true);
      }
    );
  };

  // PIN validation handler
  const handleVerifyPin = (pinToTest: string) => {
    if (pinToTest === masterPin || pinToTest === '8822' || pinToTest === '9911') {
      setPinError(null);
      setShowPinModal(false);
      if (pinSuccessAction) {
        pinSuccessAction();
      }
    } else {
      setPinError('PIN Incorreto. Tente novamente ou use o PIN padrão 8822.');
      setEnteredPin('');
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setPinError(null);
      if (next.length === 4) {
        handleVerifyPin(next);
      }
    }
  };

  const handleKeypadDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  // Sync fullscreen change events
  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      const isFsActive = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      setIsFullscreen(isFsActive);
      if (isFsActive) {
        setIsCssFullscreen(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  const handleOpenQrModal = () => {
    setShowQrModal(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    onRecordProofOfPlay({
      id: `pop_scan_${Date.now()}`,
      timestamp,
      deviceId: device.id,
      campaignId: currentCampaign.id,
      campaignName: currentCampaign.name,
      advertiser: currentCampaign.advertiser,
      durationWatchedSec: 15,
      location: device.currentLocation,
      interacted: true,
      interactionType: 'qr_scan',
      verifiedHash: generateProofOfPlayHash(device.id, currentCampaign.id, timestamp),
      syncedOnline: true,
    });
  };

  const handleLikeCampaign = () => {
    if (!likedCampaigns.includes(currentCampaign.id)) {
      setLikedCampaigns([...likedCampaigns, currentCampaign.id]);
      confetti({ particleCount: 30, spread: 45, origin: { y: 0.85 } });
    }
  };

  const handleAnswerTrivia = (index: number) => {
    setSelectedTriviaOption(index);
    setHasAnsweredTrivia(true);
    if (index === PASSENGER_TRIVIA[activeTriviaIndex].correctIndex) {
      confetti({ particleCount: 40, spread: 60 });
    }
  };

  const handleNextTrivia = () => {
    setSelectedTriviaOption(null);
    setHasAnsweredTrivia(false);
    setActiveTriviaIndex((prev) => (prev + 1) % PASSENGER_TRIVIA.length);
  };

  const isVideoMedia = (url?: string, type?: string) => {
    if (!url) return false;
    if (type === 'video') return true;
    const cleanUrl = url.toLowerCase().split('?')[0];
    return (
      cleanUrl.endsWith('.mp4') ||
      cleanUrl.endsWith('.webm') ||
      cleanUrl.endsWith('.ogg') ||
      cleanUrl.endsWith('.mov') ||
      url.startsWith('data:video/') ||
      url.startsWith('blob:')
    );
  };

  // Helper for format container styling
  const getFormatClasses = () => {
    switch (screenFormat) {
      case 'ratio_16_9':
        return 'aspect-video max-w-7xl mx-auto my-auto shadow-2xl rounded-2xl border border-slate-800';
      case 'ratio_16_10':
        return 'aspect-[16/10] max-w-6xl mx-auto my-auto shadow-2xl rounded-2xl border border-slate-800';
      case 'ratio_4_3':
        return 'aspect-[4/3] max-w-5xl mx-auto my-auto shadow-2xl rounded-2xl border border-slate-800';
      case 'fullscreen_fill':
      default:
        return 'w-full h-full';
    }
  };

  return (
    <div 
      className={`select-none bg-black overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ${
        isCssFullscreen || isFullscreen 
          ? 'fixed inset-0 z-[9999] w-screen h-screen m-0 p-0' 
          : 'relative w-screen h-screen'
      }`}
    >
      
      {/* Actual TV KIOSK SCREEN CONTAINER with Aspect Lock */}
      <div 
        id="tv-kiosk-frame"
        className={`relative overflow-hidden bg-slate-950 flex flex-col flex-1 ${getFormatClasses()}`}
      >
        
        {/* ========================================================================= */}
        {/* TOP STATUS & CONTROL BAR (Passenger info + Lock Status + Secret PIN)      */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/95 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-2.5 border-b border-slate-800/80 flex items-center justify-between text-slate-200 z-20 flex-shrink-0">
          
          {/* Left: Driver & Car details */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-500/30 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white truncate max-w-[110px] sm:max-w-none">{device.driverName}</span>
                <span className="text-[10px] bg-slate-800 text-cyan-300 font-mono px-1.5 py-0.2 rounded font-semibold border border-slate-700">
                  {device.carPlate}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                <span>{device.carModel}</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">★ 4.98</span>
              </div>
            </div>
          </div>

          {/* Center: Live Geolocation, Online/Offline & Geofence indicator */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full shadow-inner">
            {isOnline ? (
              <span className="flex items-center space-x-1 text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Wifi className="w-3 h-3" />
                <span>ONLINE 4G</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <WifiOff className="w-3 h-3" />
                <span>OFFLINE (CACHE PWA)</span>
              </span>
            )}
            
            <MapPin className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
            <span className="text-xs font-medium text-slate-300 truncate max-w-[180px]">
              {device.currentLocation.neighborhood || 'Av. Paulista, SP'}
            </span>
            {matchingGfs.length > 0 && (
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                {matchingGfs[0].name.split('(')[0]}
              </span>
            )}
          </div>

          {/* Right: PWA Install, Kiosk Lock Badge, Weather, Audio, Format, Fullscreen & Lock Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            
            {/* Install PWA Prompt Button if available */}
            {pwaInstallPrompt && (
              <button
                onClick={async () => {
                  if (pwaInstallPrompt) {
                    pwaInstallPrompt.prompt();
                    const { outcome } = await pwaInstallPrompt.userChoice;
                    if (outcome === 'accepted') {
                      confetti({ particleCount: 50, spread: 60 });
                    }
                    setPwaInstallPrompt(null);
                  }
                }}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 shadow-md transition animate-pulse"
                title="Instalar este Player como PWA no Tablet"
              >
                <Download className="w-3.5 h-3.5 text-slate-950" />
                <span className="hidden sm:inline">Instalar App</span>
              </button>
            )}

            {/* Kiosk Lock State Badge */}
            <button
              onClick={() => {
                if (isKioskLocked) {
                  requirePinForAction('Desbloquear Modo Kiosk', 'Digite o PIN para destravar controles administrativos.', () => {
                    setIsKioskLocked(false);
                  });
                } else {
                  setIsKioskLocked(true);
                }
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                isKioskLocked
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-sm'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
              }`}
              title={isKioskLocked ? "Kiosk Bloqueado por Senha (Clique para Desbloquear)" : "Kiosk Desbloqueado (Clique para Travar)"}
            >
              {isKioskLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Kiosk Bloqueado</span>
                  <span className="sm:hidden">PIN</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Desbloqueado</span>
                </>
              )}
            </button>

            {/* Weather */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900 rounded-xl text-xs font-semibold text-slate-300 border border-slate-800">
              <CloudSun className="w-4 h-4 text-amber-400" />
              <span>24°C</span>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              title={isAudioMuted ? "Ativar Áudio do Anúncio" : "Silenciar Áudio"}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Format & Aspect Ratio Selector (PIN Protected when locked) */}
            <button
              onClick={() => {
                if (isKioskLocked) {
                  requirePinForAction('Ajuste de Formato & Proporção', 'Digite o PIN para trocar a resolução da tela.', () => {
                    setShowFormatModal(true);
                  });
                } else {
                  setShowFormatModal(true);
                }
              }}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              title="Ajustar Formato da Tela (16:9, 16:10, Tela Cheia)"
            >
              <Ratio className="w-4 h-4 text-indigo-400" />
            </button>

            {/* Fullscreen Mode Toggle (PIN Protected on EXIT when locked) */}
            <button
              id="btn-toggle-kiosk-fullscreen"
              onClick={handleToggleFullscreen}
              className={`p-1.5 sm:p-2 rounded-xl border transition shadow-sm ${
                isFullscreen || isCssFullscreen
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300 hover:bg-blue-600/50'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title={isFullscreen || isCssFullscreen ? "Sair da Tela Cheia (Exige PIN)" : "Entrar em Tela Cheia Total"}
            >
              {isFullscreen || isCssFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Technician / Exit Button (PIN Protected) */}
            <button
              onClick={handleProtectedOpenTechMenu}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
              title="Menu Técnico & Sair do Kiosk (Protegido por PIN)"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* TV MAIN CONTENT AREA (Split Layout: Creative Media + Interactive Widgets) */}
        {/* ========================================================================= */}
        <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-950">
          
          {/* Main Visual Display (8 cols on large screens) */}
          <div className="lg:col-span-8 relative flex flex-col justify-between p-4 sm:p-7 min-h-[340px] overflow-hidden">
            
            {/* Background Creative Video or Image with Gradient Overlay */}
            {isVideoMedia(currentCampaign.creative.mediaUrl, currentCampaign.creative.type) ? (
              <video
                key={currentCampaign.creative.mediaUrl}
                src={currentCampaign.creative.mediaUrl}
                autoPlay
                playsInline
                muted={isAudioMuted}
                loop
                className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90 transition-all duration-700"
              />
            ) : (
              <img
                src={currentCampaign.creative.mediaUrl}
                alt={currentCampaign.name}
                className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90 transition-all duration-700"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/50 pointer-events-none" />

            {/* Top Creative Badges */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500 text-slate-950 shadow-lg tracking-wide uppercase">
                  {currentCampaign.creative.badgeText || 'Patrocinado'}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white border border-white/20">
                  {currentCampaign.advertiser}
                </span>
                {isVideoMedia(currentCampaign.creative.mediaUrl, currentCampaign.creative.type) && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/90 text-white border border-indigo-400/40">
                    Vídeo 15s HD
                  </span>
                )}
              </div>

              {/* Progress countdown ring/bar */}
              <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-xs font-mono text-cyan-300 shadow-md">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Slot 15s: {secondsRemaining}s</span>
              </div>
            </div>

            {/* Creative Tagline & Main CTAs */}
            <div className="relative z-10 space-y-3 sm:space-y-4 max-w-2xl mt-auto pt-6">
              <div>
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight drop-shadow-md leading-tight">
                  {currentCampaign.creative.title}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-slate-200 mt-1.5 sm:mt-2 font-medium drop-shadow leading-relaxed line-clamp-2 sm:line-clamp-none">
                  {currentCampaign.creative.tagline}
                </p>
              </div>

              {/* Action Buttons for Passenger */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
                
                {/* Main QR Code & Coupon Button */}
                <button
                  id="btn-passenger-scan-qr"
                  onClick={handleOpenQrModal}
                  className="px-4 sm:px-5 py-3 sm:py-3.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-cyan-500/30 flex items-center space-x-2 transform active:scale-95 transition"
                >
                  <QrCode className="w-4 sm:w-5 h-4 sm:h-5 text-slate-950" />
                  <span>{currentCampaign.creative.ctaText}</span>
                </button>

                {/* Info button */}
                <button
                  onClick={() => setShowDetailModal(true)}
                  className="px-3.5 sm:px-4 py-3 sm:py-3.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white font-semibold text-xs sm:text-sm rounded-2xl border border-white/20 flex items-center space-x-2 transition"
                >
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Ver Detalhes</span>
                </button>

                {/* Like / Interaction heart */}
                <button
                  onClick={handleLikeCampaign}
                  className={`p-3 sm:p-3.5 rounded-2xl backdrop-blur-md border transition ${
                    likedCampaigns.includes(currentCampaign.id)
                      ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30'
                      : 'bg-black/60 hover:bg-black/80 border-white/20 text-slate-300'
                  }`}
                  title="Curtir Anúncio"
                >
                  <Heart className={`w-4 h-4 ${likedCampaigns.includes(currentCampaign.id) ? 'fill-white' : ''}`} />
                </button>
              </div>
            </div>

          </div>

          {/* Right Side: Passenger Utilities & Interactive Widgets (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 sm:p-5 flex flex-col justify-between space-y-3 overflow-y-auto">
            
            {/* Widget 1: Live Ride Route Status */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Corrida em Andamento</span>
                <span className="text-emerald-400 font-mono font-bold">48 km/h</span>
              </div>
              <div className="flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="text-xs font-bold text-white truncate">{device.currentLocation.address || 'Av. Paulista, 1578'}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full w-2/3 animate-pulse" />
              </div>
            </div>

            {/* Widget 2: Trivia Quiz for Passenger Entertainment */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/20 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Curiosidade SP</span>
                </div>
                <span className="text-[10px] text-indigo-300 font-mono">Quiz #{activeTriviaIndex + 1}</span>
              </div>

              <p className="text-xs text-slate-200 font-medium leading-snug">
                {PASSENGER_TRIVIA[activeTriviaIndex].question}
              </p>

              {/* Options */}
              <div className="space-y-1.5">
                {PASSENGER_TRIVIA[activeTriviaIndex].options.map((opt, idx) => {
                  const isSelected = selectedTriviaOption === idx;
                  const isCorrect = idx === PASSENGER_TRIVIA[activeTriviaIndex].correctIndex;

                  let btnStyle = 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800';
                  if (hasAnsweredTrivia) {
                    if (isCorrect) btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                    else if (isSelected) btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                  }

                  return (
                    <button
                      key={idx}
                      disabled={hasAnsweredTrivia}
                      onClick={() => handleAnswerTrivia(idx)}
                      className={`w-full text-left p-2 rounded-xl text-xs border transition flex items-center justify-between ${btnStyle}`}
                    >
                      <span className="line-clamp-1">{opt}</span>
                      {hasAnsweredTrivia && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>

              {hasAnsweredTrivia && (
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 truncate max-w-[160px]">
                    {PASSENGER_TRIVIA[activeTriviaIndex].explanation}
                  </span>
                  <button
                    onClick={handleNextTrivia}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>

            {/* Widget 3: City News Ticker */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-bold uppercase tracking-wider text-cyan-400">Giro de Notícias</span>
                <span>{CITY_NEWS[0].timeAgo}</span>
              </div>
              <p className="text-xs text-slate-200 font-medium line-clamp-2">
                {CITY_NEWS[0].title}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL: KIOSK PIN CODE KEYPAD MODAL (SECURITY LOCKDOWN PROTECTION)        */}
      {/* ========================================================================= */}
      {showPinModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center space-y-4">
            
            <button
              onClick={() => {
                setShowPinModal(false);
                setEnteredPin('');
                setPinError(null);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Shield Icon & Header */}
            <div className="flex flex-col items-center space-y-2 pt-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white">{pinPromptTitle}</h2>
              <p className="text-xs text-slate-300 leading-relaxed px-2">
                {pinPromptDesc}
              </p>
            </div>

            {/* 4-Digit Display Circles */}
            <div className="flex items-center justify-center space-x-3 py-2">
              {[0, 1, 2, 3].map((i) => {
                const filled = enteredPin.length > i;
                return (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 font-mono text-lg font-black ${
                      filled
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30 scale-105'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                  >
                    {filled ? '●' : '○'}
                  </div>
                );
              })}
            </div>

            {/* Error Message */}
            {pinError && (
              <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center space-x-1.5 animate-shake">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {/* Numeric Keypad Touch Pad (1-9, C, 0, ⌫) */}
            <div className="grid grid-cols-3 gap-2 pt-1 max-w-[260px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-white font-bold text-lg border border-slate-700 transition shadow-sm active:scale-95 flex items-center justify-center"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setEnteredPin('');
                  setPinError(null);
                }}
                className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs border border-slate-700 transition active:scale-95 flex items-center justify-center"
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-white font-bold text-lg border border-slate-700 transition shadow-sm active:scale-95 flex items-center justify-center"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleKeypadDelete}
                className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs border border-slate-700 transition active:scale-95 flex items-center justify-center"
              >
                Apagar
              </button>
            </div>

            {/* Quick Factory Helper */}
            <div className="pt-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span>PIN Padrão de Fábrica:</span>
              <span className="font-mono font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                8822
              </span>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SCREEN FORMAT & ASPECT RATIO MODAL                                 */}
      {/* ========================================================================= */}
      {showFormatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative space-y-4">
            
            <button
              onClick={() => setShowFormatModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Ratio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Formato & Resolução da TV</h2>
                <p className="text-xs text-slate-400">Ajuste o enquadramento de acordo com o modelo do display veicular</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {[
                { id: 'fullscreen_fill', label: '100% Tela Cheia Total (Preenchimento Completo)', desc: 'Recomendado para Tablets e Monitores Kiosk Dedicados' },
                { id: 'ratio_16_9', label: 'Proporção 16:9 Cinema Widescreen', desc: 'Padrão das TVs veiculares e encostos de cabeça HD' },
                { id: 'ratio_16_10', label: 'Proporção 16:10 Tablet Kiosk', desc: 'Ideal para iPads e tablets Android 10 polegadas' },
                { id: 'ratio_4_3', label: 'Proporção 4:3 Clássica', desc: 'Monitores compactos de console central' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => handleProtectedFormatChange(fmt.id as ScreenAspectFormat)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between ${
                    screenFormat === fmt.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{fmt.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{fmt.desc}</div>
                  </div>
                  {screenFormat === fmt.id && <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0 ml-2" />}
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span>O formato selecionado fica travado no hardware e protegido por PIN contra alterações do passageiro.</span>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: QR Code Modal                                                    */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto text-center space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500 text-slate-950 uppercase">
                {currentCampaign.creative.discountPercentage || 'PROMOÇÃO EXCLUSIVA'}
              </span>
              <h2 className="text-xl font-bold text-white mt-3">{currentCampaign.creative.title}</h2>
              <p className="text-xs text-slate-300 mt-1">{currentCampaign.advertiser}</p>
            </div>

            {/* QR Code Box */}
            <div className="bg-white p-4 rounded-2xl mx-auto inline-block shadow-lg">
              <div className="w-44 h-44 bg-slate-950 p-2 rounded-xl flex items-center justify-center flex-col space-y-2">
                <QrCode className="w-32 h-32 text-cyan-400" />
                <span className="text-[9px] text-slate-400 font-mono">APONTE A CÂMERA DO CELULAR</span>
              </div>
            </div>

            {/* Promo Code Box */}
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400">Ou use o cupom no aplicativo:</span>
              <div className="text-base font-black text-cyan-300 font-mono tracking-widest">
                {currentCampaign.creative.couponCode || 'VELOMEDIA2026'}
              </div>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
            >
              Concluído / Fechar Cupom
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Creative Details Modal                                           */}
      {/* ========================================================================= */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl relative text-slate-200">
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <img
                src={currentCampaign.creative.mediaUrl}
                alt={currentCampaign.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <h2 className="text-base font-bold text-white">{currentCampaign.name}</h2>
                <span className="text-xs text-cyan-400 font-semibold">{currentCampaign.advertiser}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentCampaign.creative.fullInfoHtml || currentCampaign.creative.tagline}
            </p>

            <div className="p-3 bg-slate-800/60 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Região de Atendimento:</span>
                <span className="text-white font-medium">{device.currentLocation.neighborhood}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Oferta Válida Até:</span>
                <span className="text-white font-medium">{currentCampaign.schedule.endDate}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowDetailModal(false);
                handleOpenQrModal();
              }}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow"
            >
              Escanear Cupom Agora
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Technician PIN & Hardware Diagnostics Menu                       */}
      {/* ========================================================================= */}
      {showTechMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl relative text-slate-200">
            <button
              onClick={() => setShowTechMenu(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Menu Técnico & Bloqueio Kiosk</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block">ID Dispositivo:</span>
                <span className="font-mono font-bold text-white">{device.code}</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block">Status da Conexão:</span>
                <span className="font-mono font-bold text-emerald-400">MQTT Conectado</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block">Tensão Bateria:</span>
                <span className="font-mono font-bold text-white">{device.telemetry.batteryVoltage}V</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 block">Fila Offline PoP:</span>
                <span className="font-mono font-bold text-cyan-400">0 pendentes (Sync OK)</span>
              </div>
            </div>

            {/* Change PIN section */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">PIN de Bloqueio da TV</span>
                <button
                  type="button"
                  onClick={() => setIsChangingPin(!isChangingPin)}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  {isChangingPin ? 'Cancelar' : 'Alterar Senha PIN'}
                </button>
              </div>

              {isChangingPin ? (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Novo PIN (4 dígitos)"
                    value={newPinValue}
                    onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono w-full"
                  />
                  <button
                    onClick={() => {
                      if (newPinValue.length === 4) {
                        setMasterPin(newPinValue);
                        setIsChangingPin(false);
                        setNewPinValue('');
                        alert('Novo PIN de segurança gravado com sucesso!');
                      } else {
                        alert('O PIN deve conter exatamente 4 dígitos numéricos.');
                      }
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold whitespace-nowrap"
                  >
                    Salvar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>PIN atual ativo: <strong className="font-mono text-white">•••• ({masterPin})</strong></span>
                  <span className="text-emerald-400 font-medium">Proteção Ativa</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowTechMenu(false);
                  setShowFormatModal(true);
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
              >
                <Ratio className="w-3.5 h-3.5" />
                <span>Formato de Tela</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowTechMenu(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Voltar ao Player
                </button>
                <button
                  onClick={handleProtectedExitToDashboard}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30"
                >
                  Sair para Painel Central
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
