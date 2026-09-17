import React, { useState } from 'react';
import { 
  BarChart3, 
  Tv, 
  Layers, 
  MapPin, 
  Upload, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  Download, 
  Sparkles, 
  QrCode, 
  ExternalLink, 
  TrendingUp, 
  Play, 
  Pause, 
  DollarSign, 
  FileText, 
  Plus, 
  Check, 
  ChevronRight, 
  Eye, 
  Info,
  Calendar,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Campaign, GeoFence, ProofOfPlayLog, AdvertiserClientPortal, AdvertiserBillingRecord } from '../types';
import { INITIAL_ADVERTISER_PORTALS, INITIAL_ADVERTISER_BILLINGS } from '../data/mockData';

interface AdvertiserPortalProps {
  campaigns: Campaign[];
  geoFences: GeoFence[];
  proofOfPlayLogs: ProofOfPlayLog[];
  onAddNewCampaign: (newCamp: Campaign) => void;
  onOpenPlayerPreview?: (campaignId?: string) => void;
}

export const AdvertiserPortal: React.FC<AdvertiserPortalProps> = ({
  campaigns,
  geoFences,
  proofOfPlayLogs,
  onAddNewCampaign,
  onOpenPlayerPreview,
}) => {
  const [advertisers, setAdvertisers] = useState<AdvertiserClientPortal[]>(INITIAL_ADVERTISER_PORTALS);
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<string>(advertisers[0]?.id || 'adv_starbucks');
  const [activeTab, setActiveTab] = useState<'campaigns' | 'pop_audit' | 'impact_map' | 'new_campaign' | 'billing'>('campaigns');
  
  const [billings, setBillings] = useState<AdvertiserBillingRecord[]>(INITIAL_ADVERTISER_BILLINGS);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<string>('5000');
  const [copiedPix, setCopiedPix] = useState(false);
  const [rechargeSuccess, setRechargeSuccess] = useState(false);

  // New Campaign Form State
  const [campName, setCampName] = useState('');
  const [campBudget, setCampBudget] = useState('7500');
  const [campTargetImpressions, setCampTargetImpressions] = useState('15000');
  const [campCtaText, setCampCtaText] = useState('Escanear QR Code & Resgatar 20% OFF');
  const [campCouponCode, setCampCouponCode] = useState('VELO20');
  const [campMediaUrl, setCampMediaUrl] = useState('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1080&auto=format&fit=crop&q=80');
  const [selectedGeos, setSelectedGeos] = useState<string[]>(['geo_paulista', 'geo_itaim_farialima']);

  const currentAdvertiser = advertisers.find(a => a.id === selectedAdvertiserId) || advertisers[0];

  // Filter campaigns belonging to this advertiser
  const advertiserCampaigns = campaigns.filter(c => 
    c.advertiser.toLowerCase().includes(currentAdvertiser.companyName.toLowerCase().split(' ')[0]) ||
    currentAdvertiser.companyName.toLowerCase().includes(c.advertiser.toLowerCase())
  );

  // Fallback to active campaigns if strict match is empty
  const displayedCampaigns = advertiserCampaigns.length > 0 ? advertiserCampaigns : [campaigns[0]];

  // PoP logs for this advertiser
  const advertiserLogs = proofOfPlayLogs.filter(p => 
    displayedCampaigns.some(c => c.id === p.campaignId) ||
    p.advertiser.toLowerCase().includes(currentAdvertiser.companyName.toLowerCase().split(' ')[0])
  );

  // Stats calculation
  const totalBudget = displayedCampaigns.reduce((acc, c) => acc + c.budgetTotal, 0);
  const totalSpent = displayedCampaigns.reduce((acc, c) => acc + c.budgetSpent, 0);
  const totalImpressions = displayedCampaigns.reduce((acc, c) => acc + c.totalImpressions, 0);
  const totalTargetImpressions = displayedCampaigns.reduce((acc, c) => acc + c.targetImpressions, 0);
  const totalInteractions = displayedCampaigns.reduce((acc, c) => acc + c.totalInteractions, 0);
  const totalScans = displayedCampaigns.reduce((acc, c) => acc + c.totalScans, 0);
  const ctrRate = totalImpressions > 0 ? ((totalInteractions + totalScans) / totalImpressions) * 100 : 4.8;
  const avgCpm = totalImpressions > 0 ? (totalSpent / (totalImpressions / 1000)) : 38.5;

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim()) return;

    const newCamp: Campaign = {
      id: `camp_${Date.now()}`,
      name: campName,
      advertiser: currentAdvertiser.companyName,
      logo: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=100&auto=format&fit=crop&q=80',
      category: 'food_beverage',
      budgetTotal: parseFloat(campBudget) || 5000,
      budgetSpent: 0,
      cpm: 38.0,
      status: 'active',
      priority: 8,
      totalImpressions: 0,
      totalInteractions: 0,
      totalScans: 0,
      targetImpressions: parseInt(campTargetImpressions) || 12000,
      targetGeoFences: selectedGeos,
      schedule: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2026-10-30',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        timeSlots: [{ startHour: 6, endHour: 23 }],
      },
      creative: {
        id: `creat_${Date.now()}`,
        title: campName,
        tagline: 'Exclusivo para Passageiros em Trânsito',
        type: 'video',
        mediaUrl: campMediaUrl,
        badgeText: 'PATROCÍNIO EXCLUSIVO',
        ctaText: campCtaText,
        couponCode: campCouponCode,
        discountPercentage: '20% OFF',
        audioEnabledByDefault: false,
        durationSeconds: 15,
        qrCodeUrl: 'https://velomedia.com.br/promo',
      },
    };

    onAddNewCampaign(newCamp);
    setActiveTab('campaigns');
    confetti({ particleCount: 80, spread: 80 });
  };

  const handleConfirmRecharge = () => {
    const val = parseFloat(rechargeAmount) || 5000;
    const newBill: AdvertiserBillingRecord = {
      id: `bill_${Date.now()}`,
      advertiserId: currentAdvertiser.id,
      date: new Date().toISOString().split('T')[0],
      amount: val,
      campaignName: 'Recarga de Saldo de Veiculação (PIX Instantâneo)',
      method: 'pix',
      status: 'paid',
      receiptNumber: `REC-2026-ADV-${Date.now().toString().slice(-4)}`,
      invoiceUrl: '#'
    };

    setBillings([newBill, ...billings]);
    setShowRechargeModal(false);
    setRechargeSuccess(true);
    confetti({ particleCount: 70, spread: 70 });
    setTimeout(() => setRechargeSuccess(false), 5000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn text-slate-100">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & ADVERTISER SELECTOR                                      */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Tv className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                {currentAdvertiser.companyName}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                PORTAL DO ANUNCIANTE
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
              <span>{currentAdvertiser.contactName}</span>
              <span>•</span>
              <span className="font-mono text-cyan-300">{currentAdvertiser.email}</span>
              <span>•</span>
              <span className="text-purple-300 font-mono">Código: {currentAdvertiser.portalAccessCode}</span>
            </div>
          </div>
        </div>

        {/* Advertiser Switcher & Quick Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              Simular Marca Anunciante:
            </label>
            <select
              value={selectedAdvertiserId}
              onChange={(e) => setSelectedAdvertiserId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
            >
              {advertisers.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  {adv.companyName} ({adv.portalAccessCode})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowRechargeModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center space-x-1.5 transition active:scale-95 whitespace-nowrap self-end sm:self-auto"
          >
            <CreditCard className="w-4 h-4" />
            <span>Recarregar Saldo</span>
          </button>
        </div>

      </div>

      {/* Success Alert */}
      {rechargeSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-300 flex items-center justify-between shadow-xl animate-bounce">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-bold block text-sm">Créditos de Veiculação Adicionados com Sucesso!</span>
              <span className="text-xs text-emerald-400/90">Seu saldo foi atualizado instantaneamente para novas impressões.</span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30">
            COMPROVANTE DISPONÍVEL
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STATS CARDS & PERFORMANCE METRICS                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Saldo & Investimento */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Orçamento / Saldo</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Contratado: R$ {totalBudget.toFixed(2)}</span>
            <span className="text-emerald-400 font-bold">● Ativo</span>
          </div>
        </div>

        {/* Card 2: Impressões Entregues */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Impressões Entregues</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-cyan-400">
              {totalImpressions.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-slate-400">/ {totalTargetImpressions.toLocaleString('pt-BR')}</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-cyan-400 h-full rounded-full" 
              style={{ width: `${Math.min(100, (totalImpressions / (totalTargetImpressions || 1)) * 100)}%` }} 
            />
          </div>
        </div>

        {/* Card 3: Taxa de Interação & QR Scans */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engajamento / CTR</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300">
            {ctrRate.toFixed(1)}%
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>{totalScans + totalInteractions} interações registradas</span>
            <span className="text-purple-400 font-bold">+18.4% vs OOH Tradicional</span>
          </div>
        </div>

        {/* Card 4: Auditoria PoP Garantida */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auditoria Criptográfica</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            100% Auditado
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>SHA-256 Proof-of-Play</span>
            <span className="text-cyan-400 font-bold">Ver Hash</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. SUB-NAVIGATION TABS                                                    */}
      {/* ========================================================================= */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'campaigns'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Minhas Campanhas ({displayedCampaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pop_audit')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'pop_audit'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Auditoria Proof-of-Play (PoP)</span>
        </button>

        <button
          onClick={() => setActiveTab('impact_map')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'impact_map'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Mapa de Impacto Geográfico</span>
        </button>

        <button
          onClick={() => setActiveTab('new_campaign')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'new_campaign'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Solicitar Nova Campanha</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'billing'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Faturamento & Notas Fiscais</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB: MINHAS CAMPANHAS & VÍDEOS                                         */}
      {/* ========================================================================= */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedCampaigns.map((camp) => (
              <div key={camp.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={camp.logo}
                      alt={camp.advertiser}
                      className="w-12 h-12 rounded-xl object-contain bg-slate-950 p-1 border border-slate-800"
                    />
                    <div>
                      <h3 className="text-base font-extrabold text-white">{camp.name}</h3>
                      <span className="text-xs text-slate-400 block">{camp.creative.tagline}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    EM VEICULAÇÃO
                  </span>
                </div>

                {/* Creative Poster / Video Preview */}
                <div className="relative rounded-2xl overflow-hidden aspect-video border border-slate-800 group">
                  <img
                    src={camp.creative.mediaUrl}
                    alt={camp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-end p-4">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 text-[10px] font-black uppercase">
                        VÍDEO 15s HD
                      </span>
                      <p className="text-xs font-bold text-white">{camp.creative.ctaText}</p>
                    </div>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Impressões:</span>
                    <span className="text-xs font-bold text-white">{camp.totalImpressions.toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Scans QR:</span>
                    <span className="text-xs font-bold text-purple-300">{camp.totalScans}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Consumido:</span>
                    <span className="text-xs font-bold text-emerald-400">R$ {camp.budgetSpent.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    Geofences: <strong>{camp.targetGeoFences.length === 0 ? 'Toda a Cidade' : `${camp.targetGeoFences.length} Polos Alvo`}</strong>
                  </span>

                  {onOpenPlayerPreview && (
                    <button
                      onClick={() => onOpenPlayerPreview(camp.id)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition flex items-center space-x-1 border border-cyan-500/30"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Ver na Tela TV</span>
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: AUDITORIA PROOF-OF-PLAY (PoP)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'pop_audit' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Certificado Criptográfico de Veiculação (Proof-of-Play)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cada exibição de 15s gera uma assinatura SHA-256 única com coordenadas GPS, horário e placa do veículo.
                </p>
              </div>

              <button
                onClick={() => {
                  alert('Certificado de Auditoria PoP (PDF) gerado e pronto para download!');
                  confetti({ particleCount: 30, spread: 50 });
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Exportar Relatório PoP (PDF/CSV)</span>
              </button>
            </div>

            {/* Audit Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3">Data / Hora</th>
                    <th className="pb-3">Campanha</th>
                    <th className="pb-3">Localização / Bairro</th>
                    <th className="pb-3">Duração</th>
                    <th className="pb-3">Hash SHA-256 de Auditoria</th>
                    <th className="pb-3 text-right">Status PoP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {advertiserLogs.slice(0, 8).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 font-mono text-slate-300">
                        {log.timestamp.replace('T', ' ').slice(0, 19)}
                      </td>
                      <td className="py-3 font-bold text-white">
                        {log.campaignName}
                      </td>
                      <td className="py-3 text-slate-300">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>{log.location.neighborhood}, {log.location.city}</span>
                        </span>
                      </td>
                      <td className="py-3 font-mono text-emerald-300">
                        {log.durationWatchedSec}s (100% Completo)
                      </td>
                      <td className="py-3 font-mono text-[10px] text-purple-300 truncate max-w-[140px]" title={log.verifiedHash}>
                        {log.verifiedHash.slice(0, 16)}...
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          ✓ VERIFICADO
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB: MAPA DE IMPACTO GEOGRÁFICO                                       */}
      {/* ========================================================================= */}
      {activeTab === 'impact_map' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <span>Polos Geográficos de Maior Audiência Alcançada</span>
            </h3>
            
            <p className="text-xs text-slate-400">
              Distribuição de visualizações e rotas de circulação da frota veicular nos bairros de São Paulo:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {geoFences.map((gf) => (
                <div key={gf.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{gf.name}</span>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: gf.color }} />
                  </div>
                  <p className="text-[11px] text-slate-400">{gf.description}</p>
                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Raio: {gf.radiusKm} km</span>
                    <span className="text-cyan-400 font-bold">Alta Densidade</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB: SOLICITAR / CRIAR NOVA CAMPANHA                                   */}
      {/* ========================================================================= */}
      {activeTab === 'new_campaign' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl animate-fadeIn">
          
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Criar ou Solicitar Nova Veiculação de Anúncio 15s</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Envie os detalhes da sua campanha para aprovação e entrada imediata na programação das telas nos carros.
            </p>
          </div>

          <form onSubmit={handleCreateCampaignSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Nome da Campanha / Produto:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lançamento Menu de Verão 2026"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Orçamento Total da Campanha (R$):</label>
                <input
                  type="number"
                  required
                  value={campBudget}
                  onChange={(e) => setCampBudget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Meta de Impressões Contratadas:</label>
                <input
                  type="number"
                  required
                  value={campTargetImpressions}
                  onChange={(e) => setCampTargetImpressions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Código do Cupom de Desconto:</label>
                <input
                  type="text"
                  value={campCouponCode}
                  onChange={(e) => setCampCouponCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono text-cyan-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Texto de Chamada para Ação (CTA):</label>
              <input
                type="text"
                value={campCtaText}
                onChange={(e) => setCampCtaText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">URL do Vídeo / Banner do Anúncio:</label>
              <input
                type="url"
                value={campMediaUrl}
                onChange={(e) => setCampMediaUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono text-slate-300 text-[11px]"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Salvar & Ativar Campanha na Frota</span>
              </button>
            </div>
          </form>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TAB: FATURAMENTO & NOTAS FISCAIS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>Extrato de Pagamentos & Faturas Comerciais</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Campanha / Referência</th>
                    <th className="pb-3">Nº Recibo / NF-e</th>
                    <th className="pb-3">Método</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {billings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 font-mono text-slate-300">{b.date}</td>
                      <td className="py-3.5 font-bold text-white">{b.campaignName}</td>
                      <td className="py-3.5 font-mono text-[11px] text-cyan-300">{b.receiptNumber}</td>
                      <td className="py-3.5 text-slate-300 uppercase font-medium">{b.method}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          PAGO
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-bold text-white text-sm">
                        R$ {b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: RECARGA DE SALDO VIA PIX / CARTÃO                               */}
      {/* ========================================================================= */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Recarga de Créditos de Mídia</h3>
              </div>
              <button 
                onClick={() => setShowRechargeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-300">Valor da Recarga (R$):</label>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-black text-cyan-400 focus:outline-none focus:border-cyan-500"
              />
              
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Estimativa de Impressões:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  ~ {((parseFloat(rechargeAmount) || 0) / 0.038).toFixed(0)} visualizações
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowRechargeModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRecharge}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
              >
                Confirmar PIX / Cartão
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
