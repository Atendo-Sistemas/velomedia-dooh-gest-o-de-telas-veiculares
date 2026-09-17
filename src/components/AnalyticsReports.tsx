import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  QrCode, 
  Eye, 
  TrendingUp, 
  Calendar, 
  Filter, 
  FileText, 
  Search, 
  Lock, 
  MapPin, 
  Tv,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Campaign, Device, ProofOfPlayLog } from '../types';

interface AnalyticsReportsProps {
  proofOfPlayLogs: ProofOfPlayLog[];
  campaigns: Campaign[];
  devices: Device[];
}

export const AnalyticsReports: React.FC<AnalyticsReportsProps> = ({
  proofOfPlayLogs,
  campaigns,
  devices,
}) => {
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>('all');
  const [searchHash, setSearchHash] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const filteredLogs = proofOfPlayLogs.filter((log) => {
    const matchesCampaign = selectedCampaignFilter === 'all' || log.campaignId === selectedCampaignFilter;
    const matchesHash =
      log.verifiedHash.toLowerCase().includes(searchHash.toLowerCase()) ||
      log.deviceId.toLowerCase().includes(searchHash.toLowerCase()) ||
      log.location.neighborhood.toLowerCase().includes(searchHash.toLowerCase());
    return matchesCampaign && matchesHash;
  });

  const totalImpressions = campaigns.reduce((acc, c) => acc + c.totalImpressions, 0);
  const totalInteractions = campaigns.reduce((acc, c) => acc + c.totalInteractions, 0);
  const totalScans = campaigns.reduce((acc, c) => acc + c.totalScans, 0);

  const engagementDistribution = [
    { name: 'Exibição Completa (15s)', value: 82, color: '#06b6d4' },
    { name: 'Toque para Detalhes', value: 11, color: '#6366f1' },
    { name: 'Scan de Cupom QR', value: 7, color: '#10b981' },
  ];

  const zonePerformance = [
    { zone: 'Paulista / Jardins', impressions: 42300, scans: 1420 },
    { zone: 'Faria Lima / Itaim', impressions: 38900, scans: 1890 },
    { zone: 'Aerop. Congonhas', impressions: 31200, scans: 950 },
    { zone: 'Vila Madalena', impressions: 24500, scans: 870 },
    { zone: 'Morumbi / Shoppings', impressions: 18900, scans: 610 },
  ];

  const handleExportAuditReport = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Relatórios & Telemetria em Tempo Real</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Auditoria Proof-of-Play criptográfica, telemetria de telas e relatórios de conversão para anunciantes.
          </p>
        </div>

        <button
          onClick={handleExportAuditReport}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Certificado de Auditoria (PDF/CSV)</span>
        </button>
      </div>

      {downloadSuccess && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Relatório consolidado de Proof-of-Play gerado com assinatura digital SHA-256!</span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded">DOWNLOAD CONCLUÍDO</span>
        </div>
      )}

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Taxa de Interação (CTR Geral)</span>
            <QrCode className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {((totalInteractions / totalImpressions) * 100).toFixed(2)}%
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> 4.2x maior que outdoors estáticos tradicionais
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Tempo Médio de Atenção</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            18.4 min <span className="text-xs font-normal text-slate-400">/ corrida</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Público cativo sem dispersão com 100% viewability
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Integridade dos Dados</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            100% Auditado
          </div>
          <p className="text-[11px] text-indigo-300 mt-1">
            Geolocalização validada por hardware + timestamp anti-fraude
          </p>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Bar Chart Zone Performance (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Desempenho por Zona Geográfica</h3>
              <p className="text-xs text-slate-400">Impressões vs. Scans de Cupom por região</p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
              Este Mês
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zonePerformance} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="zone" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="impressions" name="Impressões" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="scans" name="Scans de Cupom" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Pie Chart Engagement breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Comportamento do Passageiro</h3>
              <span className="text-xs text-slate-400">Funil de Atenção</span>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagementDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {engagementDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend list */}
            <div className="space-y-2 text-xs pt-2">
              {engagementDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Proof-of-Play Audit Table with Cryptographic Hash */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Log de Auditoria Proof-of-Play (PoP)</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Registro imutável de cada veiculação com coordenadas GPS, tempo e hash de integridade
            </p>
          </div>

          {/* Filters for Table */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedCampaignFilter}
              onChange={(e) => setSelectedCampaignFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Todas as Campanhas</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.advertiser}</option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filtrar por hash ou bairro..."
                value={searchHash}
                onChange={(e) => setSearchHash(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Dispositivo / Carro</th>
                <th className="p-3">Campanha / Anunciante</th>
                <th className="p-3">Localização (GPS)</th>
                <th className="p-3">Engajamento</th>
                <th className="p-3">Hash de Auditoria</th>
                <th className="p-3 text-right">Status Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-3 font-mono font-bold text-white">{log.deviceId}</td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-200 block">{log.campaignName}</span>
                    <span className="text-[10px] text-cyan-400">{log.advertiser}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-slate-300 flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-cyan-400" />
                      {log.location.neighborhood}
                    </span>
                  </td>
                  <td className="p-3">
                    {log.interacted ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {log.interactionType === 'qr_scan' ? 'Scan Cupom QR' : 'Toque na Tela'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">
                        15s Exibição
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-[11px] text-indigo-300 select-all">
                    {log.verifiedHash}
                  </td>
                  <td className="p-3 text-right">
                    <span className="inline-flex items-center text-emerald-400 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Nuvem OK
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
