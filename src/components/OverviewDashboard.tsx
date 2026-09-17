import React from 'react';
import { 
  Tv, 
  Eye, 
  QrCode, 
  DollarSign, 
  MapPin, 
  TrendingUp, 
  CheckCircle2, 
  Activity,
  Play,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  HardDrive
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Campaign, Device, Driver, GeoFence, ProofOfPlayLog } from '../types';

interface OverviewDashboardProps {
  devices: Device[];
  campaigns: Campaign[];
  drivers: Driver[];
  geoFences: GeoFence[];
  proofOfPlayLogs: ProofOfPlayLog[];
  onSelectDevice: (device: Device) => void;
  onLaunchPlayerForDevice: (deviceId: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  devices,
  campaigns,
  drivers,
  geoFences,
  proofOfPlayLogs,
  onSelectDevice,
  onLaunchPlayerForDevice,
  onNavigateToTab
}) => {
  const onlineDevices = devices.filter((d) => d.status === 'online');
  const totalImpressions = campaigns.reduce((acc, c) => acc + c.totalImpressions, 0);
  const totalInteractions = campaigns.reduce((acc, c) => acc + c.totalInteractions, 0);
  const totalScans = campaigns.reduce((acc, c) => acc + c.totalScans, 0);
  const totalRevenue = campaigns.reduce((acc, c) => acc + c.budgetSpent, 0);
  const totalDriversPayout = drivers.reduce((acc, d) => acc + d.monthlyEarnings, 0);

  // Hourly data for impressions trend
  const hourlyData = [
    { hour: '06h', impressions: 1840, scans: 64 },
    { hour: '07h', impressions: 4210, scans: 180 },
    { hour: '08h', impressions: 7890, scans: 310 },
    { hour: '09h', impressions: 6940, scans: 275 },
    { hour: '10h', impressions: 5320, scans: 198 },
    { hour: '11h', impressions: 5800, scans: 240 },
    { hour: '12h', impressions: 7200, scans: 390 },
    { hour: '13h', impressions: 6400, scans: 290 },
    { hour: '14h', impressions: 5100, scans: 210 },
    { hour: '15h', impressions: 6300, scans: 280 },
    { hour: '16h', impressions: 7900, scans: 360 },
    { hour: '17h', impressions: 9400, scans: 480 },
    { hour: '18h', impressions: 11200, scans: 620 },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Operations Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1E293B] border border-slate-700 p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-white tracking-tight">Real-time Operations Center</h1>
            <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>98.2% Nodes Online</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Auditoria Proof-of-Play criptográfica, telemetria veicular e distribuição inteligente de criativos.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Current Impressions</p>
            <p className="text-xl font-mono font-bold text-blue-400">
              {totalImpressions.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab('registrations')}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold border border-cyan-500/30 transition shadow-sm"
              title="Acessar Central de Cadastros de Motoristas, TVs, Anunciantes e Usuários"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>+ Cadastros</span>
            </button>
            <button
              onClick={() => onNavigateToTab('campaigns')}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
            >
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Campanhas</span>
            </button>
            <button
              onClick={() => onNavigateToTab('devices')}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold border border-blue-500/30 transition shadow-sm"
            >
              <Tv className="w-4 h-4" />
              <span>Ver Matriz de TVs</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Screens */}
        <div className="bg-[#1E293B] p-5 rounded-xl border border-slate-700 shadow-sm hover:border-slate-600 transition">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Screens</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-white font-mono">
              {onlineDevices.length} <span className="text-xs text-green-400 font-normal font-sans ml-1">+{Math.round((onlineDevices.length / devices.length) * 100)}% uptime</span>
            </p>
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-600/30">
              <Tv className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex justify-between">
            <span>Standby: {devices.filter(d => d.status === 'standby').length} unidades</span>
            <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => onNavigateToTab('devices')}>Ver todas</span>
          </p>
        </div>

        {/* Live Campaigns */}
        <div className="bg-[#1E293B] p-5 rounded-xl border border-slate-700 shadow-sm hover:border-slate-600 transition">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Live Campaigns</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-white font-mono">
              {campaigns.filter(c => c.status === 'active').length} <span className="text-xs text-blue-400 font-normal font-sans ml-1">Ativas</span>
            </p>
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-600/30">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex justify-between">
            <span>Geofences ativas: {geoFences.length} zonas</span>
            <span className="text-blue-400 font-mono font-medium">CPM R$ 23</span>
          </p>
        </div>

        {/* Device Health */}
        <div className="bg-[#1E293B] p-5 rounded-xl border border-slate-700 shadow-sm hover:border-slate-600 transition">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Device Health</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-green-400 font-mono">99.4%</p>
            <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Voltagem e temperatura nominais em 100% da frota
          </p>
        </div>

        {/* Engagement & QR Conversions */}
        <div className="bg-[#1E293B] p-5 rounded-xl border border-slate-700 shadow-sm hover:border-slate-600 transition">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Engajamento & Cupons</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-white font-mono">
              {totalScans.toLocaleString()} <span className="text-xs text-blue-400 font-normal font-sans ml-1">scans</span>
            </p>
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-600/30">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex justify-between">
            <span>Taxa CTR: {((totalInteractions / totalImpressions) * 100).toFixed(1)}%</span>
            <span className="text-green-400 font-medium">100% Auditado</span>
          </p>
        </div>

      </div>

      {/* Main Grid: Live Device Matrix (8 cols) & Geo-Targeting Radar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Live Device Matrix (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-[#1E293B] rounded-xl border border-slate-700 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/60 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Tv className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-white">Live Device Matrix</h3>
              </div>
              <span className="text-xs bg-slate-900 border border-slate-700 text-slate-400 px-2.5 py-1 rounded font-mono">
                Auto-refresh: 4s
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-700 bg-slate-900/40">
                    <th className="px-5 py-3">Unit ID</th>
                    <th className="px-5 py-3">Driver / Car</th>
                    <th className="px-5 py-3">Location (Geo)</th>
                    <th className="px-5 py-3">Current Content</th>
                    <th className="px-5 py-3 text-right">Status</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {devices.map((device) => {
                    const activeCmp = campaigns.find((c) => c.id === device.activeCampaignId);
                    return (
                      <tr key={device.id} className="hover:bg-slate-700/30 transition">
                        <td className="px-5 py-3.5 font-mono font-bold text-white whitespace-nowrap">
                          {device.code}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-slate-200 font-medium block">{device.driverName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{device.carPlate} • {device.carModel}</span>
                        </td>
                        <td className="px-5 py-3.5 text-blue-400 font-mono whitespace-nowrap">
                          <span className="text-slate-200 block font-sans text-xs">{device.currentLocation.neighborhood}</span>
                          <span className="text-[10px] text-blue-400/90">{device.currentLocation.lat.toFixed(4)}, {device.currentLocation.lng.toFixed(4)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-slate-200 font-medium block">{activeCmp ? activeCmp.advertiser : 'Modo Padrão'}</span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">{activeCmp ? activeCmp.name : 'Grade Geral'}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          {device.status === 'online' && (
                            <span className="px-2.5 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-[11px] font-mono font-bold">
                              ONLINE
                            </span>
                          )}
                          {device.status === 'standby' && (
                            <span className="px-2.5 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-[11px] font-mono font-bold">
                              SYNCING
                            </span>
                          )}
                          {device.status === 'offline' && (
                            <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[11px] font-mono font-bold">
                              OFFLINE
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => onSelectDevice(device)}
                              title="Diagnóstico & Controle Remoto"
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] font-medium"
                            >
                              Config
                            </button>
                            <button
                              onClick={() => onLaunchPlayerForDevice(device.id)}
                              title="Testar Player na TV deste Carro"
                              className="p-1 bg-blue-600 hover:bg-blue-500 text-white rounded shadow-sm"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Impressions Trend Chart */}
          <div className="bg-[#1E293B] rounded-xl border border-slate-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm text-white">Impressions & Traffic Density</h3>
                <p className="text-xs text-slate-400">Distribuição horária de visualizações</p>
              </div>
              <span className="text-xs bg-slate-900 border border-slate-700 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">
                24h Window
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="impressions"
                    name="Impressões"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorImpressions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right: Geo-Targeting Map & Edge Optimization (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-[#1E293B] rounded-xl border border-slate-700 p-6 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-white">Geo-Targeting Map</h3>
              </div>
              <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded font-mono">
                GPS LOCK
              </span>
            </div>

            {/* Simulated Radar Visual */}
            <div className="h-56 bg-slate-900 rounded-lg relative overflow-hidden flex items-center justify-center border border-slate-700">
              <div
                className="absolute inset-0 opacity-25 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#334155 1.5px, transparent 1.5px)',
                  backgroundSize: '18px 18px',
                }}
              />
              
              {/* Radar Rings */}
              <div className="relative w-44 h-44 border border-blue-500/30 rounded-full animate-pulse flex items-center justify-center">
                <div className="w-28 h-28 border border-blue-500/40 rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 border border-blue-500/60 rounded-full" />
                </div>
                
                {/* Vehicle Nodes */}
                <div className="absolute top-6 left-10 w-2.5 h-2.5 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa]" title="TV-SP-8491" />
                <div className="absolute bottom-10 right-8 w-2.5 h-2.5 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa]" title="TV-SP-9204" />
                <div className="absolute top-12 right-12 w-2.5 h-2.5 bg-green-400 rounded-full shadow-[0_0_8px_#4ade80]" title="TV-SP-7102" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]" title="Centro de Controle" />
              </div>

              {/* Bottom active zone info tag */}
              <div className="absolute bottom-3 left-3 right-3 bg-slate-800/90 backdrop-blur-sm p-2 rounded text-[11px] text-slate-300 border border-slate-700">
                <p className="font-semibold text-white">Zone: AV. PAULISTA (ID: Z-102)</p>
                <p className="text-[10px] text-slate-400 font-mono">Active Ads: {campaigns.filter(c => c.status === 'active').length} | Target Devices: {devices.length}</p>
              </div>
            </div>

            {/* Optimization Strategy Cards */}
            <div className="mt-5 space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Edge Optimization Strategy</h4>
              
              <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-2 text-blue-400">
                  <Zap className="w-3.5 h-3.5" />
                  <p className="text-xs font-semibold text-white">Delta Sync Protocol</p>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Atualização apenas de metadados modificados reduz consumo de 4G para ~8MB/mês por carro.
                </p>
              </div>

              <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-2 text-green-400">
                  <HardDrive className="w-3.5 h-3.5" />
                  <p className="text-xs font-semibold text-white">Edge Asset Caching</p>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Armazenamento local de criativos na memória flash do monitor evita travamentos em túneis.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
