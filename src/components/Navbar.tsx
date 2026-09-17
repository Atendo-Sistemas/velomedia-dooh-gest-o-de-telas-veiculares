import React, { useState } from 'react';
import { 
  Tv, 
  BarChart3, 
  Layers, 
  Users, 
  Sliders, 
  Radio, 
  Maximize2,
  Signal,
  Building2,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  Plus,
  Download,
  Smartphone,
  Car,
  Briefcase,
  Gift,
  Heart,
  Menu,
  X,
  Sparkles,
  Activity,
  CheckCircle2,
  QrCode
} from 'lucide-react';
import { SaaSOrganization } from '../types';

export type ActiveTab = 
  | 'overview' 
  | 'registrations'
  | 'mapbox' 
  | 'devices' 
  | 'campaigns' 
  | 'analytics' 
  | 'drivers' 
  | 'driver_portal' 
  | 'advertiser_portal' 
  | 'passenger_portal' 
  | 'saas' 
  | 'player' 
  | 'architecture';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onlineDevicesCount: number;
  totalDevicesCount: number;
  onLaunchKiosk: () => void;
  onOpenMobileTester: () => void;
  onOpenPwaInstaller?: () => void;
  isSimulating: boolean;
  setIsSimulating: (val: boolean | ((prev: boolean) => boolean)) => void;
  currentOrg: SaaSOrganization;
  isMasterMode: boolean;
  onToggleMasterMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onlineDevicesCount,
  totalDevicesCount,
  onLaunchKiosk,
  onOpenMobileTester,
  onOpenPwaInstaller,
  isSimulating,
  setIsSimulating,
  currentOrg,
  isMasterMode,
  onToggleMasterMode,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'overview' as ActiveTab, label: 'Monitor Geral', icon: Layers, title: 'Fleet Monitor & Visão Geral em Tempo Real', category: 'operacional' },
    { id: 'registrations' as ActiveTab, label: 'Central Cadastros', icon: ShieldCheck, title: 'Central Unificada de Cadastros (Motoristas, TVs, Anunciantes e Usuários SaaS)', category: 'operacional', badge: 'Novo' },
    { id: 'mapbox' as ActiveTab, label: 'Mapbox GPS', icon: MapPin, title: 'Geolocalização Mapbox & Geofencing', category: 'operacional' },
    { id: 'devices' as ActiveTab, label: 'Telas Veiculares', icon: Tv, badge: `${onlineDevicesCount}/${totalDevicesCount}`, title: 'Gerenciar Telas & Hardware', category: 'operacional' },
    { id: 'campaigns' as ActiveTab, label: 'Campanhas & Vídeos', icon: Sliders, title: 'Campanhas 15s & Geofencing', category: 'operacional' },
    { id: 'analytics' as ActiveTab, label: 'Auditoria PoP', icon: BarChart3, title: 'Proof-of-Play & Métricas SHA-256', category: 'operacional' },
    { id: 'drivers' as ActiveTab, label: 'Gestão Motoristas', icon: Users, title: 'Motoristas, BYOD & Bônus de Indicação', category: 'operacional' },
    { id: 'driver_portal' as ActiveTab, label: 'Portal do Motorista', icon: Car, title: 'Painel Exclusivo do Motorista Parceiro (PIX & Ganhos)', category: 'portais', badge: 'PIX' },
    { id: 'advertiser_portal' as ActiveTab, label: 'Portal Anunciante', icon: Briefcase, title: 'Portal do Cliente Anunciante (Métricas & Faturas)', category: 'portais', badge: 'PoP' },
    { id: 'passenger_portal' as ActiveTab, label: 'Hub Passageiro', icon: Gift, title: 'Experiência Interativa do Passageiro (Cupons & Quiz)', category: 'portais', badge: 'Cupons' },
    { id: 'saas' as ActiveTab, label: 'Meu Plano & Franquia', icon: Building2, title: 'Gestão da Franquia & Faturamento', category: 'sistema' },
    { id: 'architecture' as ActiveTab, label: 'IoT Docs & Guia', icon: Radio, title: 'Guia de Arquitetura & Otimização', category: 'sistema' },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-slate-900/98 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 text-slate-100 select-none shadow-xl">
        
        {/* ========================================================================= */}
        {/* 1. CABEÇALHO PRINCIPAL (TOP HEADER ROW)                                  */}
        {/* ========================================================================= */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {isMasterMode ? (
            /* Master SaaS Super Admin Header */
            <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
              <div className="flex items-center space-x-2 sm:space-x-3 truncate">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl flex items-center justify-center font-black text-sm tracking-tight shadow-md shadow-indigo-600/30 flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex flex-col truncate">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
                    <span className="font-extrabold text-sm sm:text-base tracking-tight text-white truncate">
                      AdVantage DOOH
                    </span>
                    <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 whitespace-nowrap">
                      Master Admin
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate hidden sm:inline-block">
                    Módulo Master • Gestão Global de Franquias
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 sm:space-x-2.5 flex-shrink-0">
                <button
                  onClick={onToggleMasterMode}
                  className="flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold transition shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                  <span className="hidden sm:inline">Voltar à Franquia ({currentOrg.name.split(' ')[0]})</span>
                  <span className="sm:hidden">Voltar</span>
                </button>

                <button
                  onClick={onLaunchKiosk}
                  title="Abrir Player na TV"
                  className="flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Player na TV</span>
                  <span className="sm:hidden">Player</span>
                </button>
              </div>
            </div>
          ) : (
            /* Operational Tenant Workspace Header */
            <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
              
              {/* Left: Brand Identity & Tenant Info */}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 truncate">
                <div 
                  className="flex items-center space-x-2 sm:space-x-2.5 cursor-pointer group" 
                  onClick={() => handleSelectTab('overview')}
                  title="Ir para Visão Geral"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xs sm:text-sm tracking-tight shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform flex-shrink-0">
                    AV
                  </div>
                  <div className="flex flex-col truncate">
                    <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
                      <span className="font-extrabold text-sm sm:text-base tracking-tight text-white whitespace-nowrap">
                        VeloMedia
                      </span>
                      <span className="text-[9px] sm:text-[10px] uppercase font-extrabold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 whitespace-nowrap">
                        {currentOrg.slug.split('-')[1]?.toUpperCase() || 'SP'}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium whitespace-nowrap hidden sm:inline-block truncate max-w-[200px]">
                      {currentOrg.name}
                    </span>
                  </div>
                </div>

                {/* Master Super Admin Quick Switcher (Desktop only) */}
                <button
                  onClick={onToggleMasterMode}
                  title="Abrir Módulo Master de Gestão de Franquias & Quotas"
                  className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/40"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>SaaS Master</span>
                </button>

                <button
                  onClick={() => handleSelectTab('registrations')}
                  title="Central Unificada de Cadastros (Motoristas, TVs, Anunciantes e Usuários)"
                  className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                    activeTab === 'registrations'
                      ? 'bg-blue-600 text-white border border-blue-400'
                      : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>+ Cadastros</span>
                </button>

                {/* Quick Role Portal Buttons (Desktop only) */}
                <div className="hidden lg:flex items-center space-x-1 pl-2 border-l border-slate-800">
                  <button
                    onClick={() => handleSelectTab('driver_portal')}
                    title="Abrir Painel do Motorista Parceiro"
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      activeTab === 'driver_portal'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-900/90 text-slate-300 hover:text-emerald-300 hover:bg-slate-800'
                    }`}
                  >
                    <Car className="w-3 h-3 text-emerald-400" />
                    <span>Motorista</span>
                  </button>

                  <button
                    onClick={() => handleSelectTab('advertiser_portal')}
                    title="Abrir Portal da Empresa Anunciante"
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      activeTab === 'advertiser_portal'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-slate-900/90 text-slate-300 hover:text-purple-300 hover:bg-slate-800'
                    }`}
                  >
                    <Briefcase className="w-3 h-3 text-purple-400" />
                    <span>Anunciante</span>
                  </button>

                  <button
                    onClick={() => handleSelectTab('passenger_portal')}
                    title="Abrir Hub Interativo do Passageiro"
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      activeTab === 'passenger_portal'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-900/90 text-slate-300 hover:text-amber-300 hover:bg-slate-800'
                    }`}
                  >
                    <Gift className="w-3 h-3 text-amber-400" />
                    <span>Passageiro</span>
                  </button>
                </div>
              </div>

              {/* Right: Quick Actions & Status */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
                
                {/* Telemetry Live Status (Desktop & Mobile Compact) */}
                <button
                  onClick={() => setIsSimulating((prev) => !prev)}
                  title={isSimulating ? "Telemetria MQTT Ativa: clique para pausar" : "Telemetria pausada: clique para ativar"}
                  className={`flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                    isSimulating
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    {isSimulating && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulating ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  </span>
                  <span className="font-sans font-medium whitespace-nowrap text-[11px] sm:text-xs">
                    {isSimulating ? '98.2%' : 'Pausado'}
                  </span>
                </button>

                {/* Testar Celular (Desktop only) */}
                <button
                  onClick={onOpenMobileTester}
                  title="Abrir QR Code para testar no smartphone"
                  className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold shadow-sm transition whitespace-nowrap"
                >
                  <Signal className="w-3.5 h-3.5 text-blue-400" />
                  <span>Testar Celular</span>
                </button>

                {/* PWA Kiosk App Installer (Desktop only) */}
                {onOpenPwaInstaller && (
                  <button
                    id="btn-open-pwa-installer-nav"
                    onClick={onOpenPwaInstaller}
                    title="Instalar e Gerar PWA para Tablet / Tela Veicular"
                    className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-bold shadow-sm transition whitespace-nowrap"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden md:inline">PWA Kiosk</span>
                    <span className="md:hidden">PWA</span>
                  </button>
                )}

                {/* Player na TV Button (All screen sizes) */}
                <button
                  id="btn-launch-kiosk-navbar"
                  onClick={onLaunchKiosk}
                  title="Abrir a interface que roda no monitor do carro"
                  className={`flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap ${
                    activeTab === 'player'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25 border border-blue-400/30'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">
                    {activeTab === 'player' ? 'Player Ativo' : 'Player TV'}
                  </span>
                </button>

                {/* Mobile Menu Toggle Button (Mobile only) */}
                <button
                  id="btn-toggle-mobile-menu"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Abrir Menu de Navegação Completo"
                  className="md:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5 text-cyan-400" />}
                </button>
              </div>

            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. SUB-NAVBAR HORIZONTAL MENU (DESKTOP & TABLET >= 768px)                */}
        {/* ========================================================================= */}
        {!isMasterMode && (
          <div className="hidden md:block bg-slate-950/80 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar py-1.5">
              <nav className="flex items-center space-x-1.5 sm:space-x-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`nav-btn-${tab.id}`}
                      onClick={() => handleSelectTab(tab.id)}
                      title={tab.title}
                      className={`relative flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold ring-1 ring-blue-400/40'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className={`ml-1 px-2 py-0.5 text-[10px] font-mono rounded-full font-bold whitespace-nowrap ${
                          isActive
                            ? 'bg-blue-700 text-blue-100 border border-blue-400/40'
                            : 'bg-slate-900 text-emerald-400 border border-slate-800'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

      </header>

      {/* ========================================================================= */}
      {/* 3. MOBILE MENU DRAWER (SLIDE-IN MODAL FOR SMALL SCREENS)                  */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fadeIn">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-10 overflow-y-auto">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-xs text-white">
                  AV
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Menu do Sistema DOOH</h3>
                  <p className="text-[11px] text-slate-400">{currentOrg.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Portal Switcher Banner */}
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Acesso Rápido por Perfil:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSelectTab('driver_portal')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center space-y-1 transition ${
                      activeTab === 'driver_portal'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-emerald-500/30'
                    }`}
                  >
                    <Car className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] leading-tight">Motorista</span>
                  </button>

                  <button
                    onClick={() => handleSelectTab('advertiser_portal')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center space-y-1 transition ${
                      activeTab === 'advertiser_portal'
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-purple-500/30'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] leading-tight">Anunciante</span>
                  </button>

                  <button
                    onClick={() => handleSelectTab('passenger_portal')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center space-y-1 transition ${
                      activeTab === 'passenger_portal'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/30'
                    }`}
                  >
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] leading-tight">Passageiro</span>
                  </button>
                </div>
              </div>

              {/* Categorized Nav Links */}
              <div className="space-y-4 pt-2">
                
                {/* Category 1: Operacional */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-2">
                    Operação & Frota
                  </span>
                  {tabs.filter(t => t.category === 'operacional').map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleSelectTab(tab.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{tab.label}</span>
                        </div>
                        {tab.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isActive ? 'bg-blue-700 text-white' : 'bg-slate-950 text-emerald-400 border border-slate-800'
                          }`}>
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Category 2: Gestão SaaS & Docs */}
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-2">
                    Franquia & Sistema
                  </span>
                  {tabs.filter(t => t.category === 'sistema').map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleSelectTab(tab.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{tab.label}</span>
                        </div>
                      </button>
                    );
                  })}

                  {/* SaaS Master Super Admin Option */}
                  <button
                    onClick={() => {
                      onToggleMasterMode();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 hover:bg-indigo-900/60 transition mt-2"
                  >
                    <div className="flex items-center space-x-3">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>{isMasterMode ? 'Voltar à Franquia' : 'Painel SaaS Master'}</span>
                    </div>
                    <span className="text-[10px] uppercase px-2 py-0.5 bg-indigo-500/20 rounded-full font-bold">
                      Admin
                    </span>
                  </button>
                </div>

                {/* Mobile Quick Hardware Tools */}
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-2">
                    Ferramentas & Emulador
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onOpenMobileTester();
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left hover:border-slate-700 transition flex items-center space-x-2"
                    >
                      <Signal className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block">Testar Celular</span>
                        <span className="text-[10px] text-slate-400">QR Code</span>
                      </div>
                    </button>

                    {onOpenPwaInstaller && (
                      <button
                        onClick={() => {
                          onOpenPwaInstaller();
                          setIsMobileMenuOpen(false);
                        }}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left hover:border-slate-700 transition flex items-center space-x-2"
                      >
                        <Smartphone className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <div className="truncate">
                          <span className="text-xs font-bold text-white block">PWA Kiosk</span>
                          <span className="text-[10px] text-slate-400">Instalar Tablet</span>
                        </div>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onLaunchKiosk();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 mt-2"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>Lançar Player na TV (Modo Kiosk)</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 mt-auto border-t border-slate-800 bg-slate-950 text-center text-[11px] text-slate-500">
              VeloMedia DOOH v2.4 • Suporte Multi-Tenant & BYOD
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MOBILE BOTTOM NAVIGATION BAR (FIXED ON SMARTPHONES < 768px)            */}
      {/* ========================================================================= */}
      {!isMasterMode && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 md:hidden flex items-center justify-around px-2 py-2 safe-area-bottom shadow-2xl">
          
          {/* Tab 1: Monitor Geral */}
          <button
            onClick={() => handleSelectTab('overview')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
              activeTab === 'overview' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className={`w-5 h-5 mb-0.5 ${activeTab === 'overview' ? 'text-blue-400 scale-110' : 'text-slate-400'}`} />
            <span className="text-[10px] font-medium">Monitor</span>
          </button>

          {/* Tab 2: Telas */}
          <button
            onClick={() => handleSelectTab('devices')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
              activeTab === 'devices' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className={`w-5 h-5 mb-0.5 ${activeTab === 'devices' ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} />
            <span className="text-[10px] font-medium">Telas</span>
            {onlineDevicesCount > 0 && (
              <span className="absolute top-0 right-1/4 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
            )}
          </button>

          {/* Tab 3: Portal Motorista */}
          <button
            onClick={() => handleSelectTab('driver_portal')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
              activeTab === 'driver_portal' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className={`w-5 h-5 mb-0.5 ${activeTab === 'driver_portal' ? 'text-emerald-400 scale-110' : 'text-slate-400'}`} />
            <span className="text-[10px] font-medium">Motorista</span>
          </button>

          {/* Tab 4: Portal Anunciante */}
          <button
            onClick={() => handleSelectTab('advertiser_portal')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
              activeTab === 'advertiser_portal' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className={`w-5 h-5 mb-0.5 ${activeTab === 'advertiser_portal' ? 'text-purple-400 scale-110' : 'text-slate-400'}`} />
            <span className="text-[10px] font-medium">Anúncios</span>
          </button>

          {/* Tab 5: Mais / Menu Completo */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
              isMobileMenuOpen ? 'text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Menu className="w-5 h-5 mb-0.5 text-slate-400" />
            <span className="text-[10px] font-medium">Mais</span>
          </button>

        </nav>
      )}

    </>
  );
};
