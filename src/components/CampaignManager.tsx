import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Eye, 
  QrCode, 
  Play, 
  Pause, 
  Tag, 
  CheckCircle2, 
  Sparkles, 
  Layers,
  CloudSun,
  Flame,
  CloudRain,
  ExternalLink
} from 'lucide-react';
import { Campaign, GeoFence } from '../types';

interface CampaignManagerProps {
  campaigns: Campaign[];
  geoFences: GeoFence[];
  onCreateNewCampaign: () => void;
  onToggleCampaignStatus: (campaignId: string) => void;
  onSelectCampaignForPreview: (campaign: Campaign) => void;
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({
  campaigns,
  geoFences,
  onCreateNewCampaign,
  onToggleCampaignStatus,
  onSelectCampaignForPreview,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesCategory && matchesStatus;
  });

  const getGeofenceNames = (ids: string[]) => {
    if (ids.includes('all')) return 'Todas as Cidades & Bairros (Geral)';
    return ids
      .map((id) => geoFences.find((g) => g.id === id)?.name.split('(')[0] || id)
      .join(', ');
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'tech_finance':
        return { label: 'Finanças & Tech', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
      case 'food_beverage':
        return { label: 'Gastronomia & Bebidas', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'automotive':
        return { label: 'Automotivo & Frotas', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
      case 'retail':
        return { label: 'Varejo & Moda', color: 'bg-pink-500/15 text-pink-400 border-pink-500/30' };
      default:
        return { label: cat, color: 'bg-slate-800 text-slate-300' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Gestão de Campanhas & Agendamento</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Crie anúncios segmentados por geolocalização (Geofencing), horários específicos (Dayparting) e clima.
          </p>
        </div>

        <button
          onClick={onCreateNewCampaign}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Publicação / Anúncio</span>
        </button>
      </div>

      {/* Geofence Map Summary Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Zonas de Geofencing Ativas no Sistema</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Disparo Automático via GPS Local</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {geoFences.map((gf) => {
            const linkedCampaigns = campaigns.filter(
              (c) => c.targetGeoFences.includes('all') || c.targetGeoFences.includes(gf.id)
            );
            return (
              <div
                key={gf.id}
                className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: gf.color }} />
                      <span>{gf.name}</span>
                    </span>
                    <span className="text-[10px] text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded font-mono">
                      {gf.radiusKm} km raio
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{gf.description}</p>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{gf.city}</span>
                  <span className="text-slate-300 font-medium">
                    {linkedCampaigns.length} campanha(s) vinculadas
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'tech_finance', 'food_beverage', 'automotive'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all'
                ? 'Todas as Categorias'
                : cat === 'tech_finance'
                ? 'Finanças & Tech'
                : cat === 'food_beverage'
                ? 'Gastronomia'
                : 'Automotivo'}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Apenas Ativas</option>
            <option value="paused">Pausadas</option>
          </select>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredCampaigns.map((campaign) => {
          const catBadge = getCategoryBadge(campaign.category);
          const progressPercent = Math.min(100, Math.round((campaign.totalImpressions / campaign.targetImpressions) * 100));

          return (
            <div
              key={campaign.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={campaign.creative.mediaUrl}
                      alt={campaign.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catBadge.color}`}>
                          {catBadge.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Prioridade: {campaign.priority}/10
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold font-mono">
                          {campaign.creative.type === 'video' || campaign.creative.mediaUrl.includes('.mp4') ? '🎬 Vídeo 15s' : '📸 Banner 15s'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1 line-clamp-1">{campaign.name}</h3>
                      <p className="text-xs text-cyan-300 font-medium">{campaign.advertiser}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleCampaignStatus(campaign.id)}
                    title={campaign.status === 'active' ? 'Pausar Campanha' : 'Ativar Campanha'}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition ${
                      campaign.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {campaign.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Creative Tagline & CTA preview */}
                <div className="mt-4 p-3 bg-slate-800/40 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                  <div className="text-slate-300 font-medium italic">
                    "{campaign.creative.title}"
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>CTA na TV: <strong className="text-cyan-400">{campaign.creative.ctaText}</strong></span>
                    {campaign.creative.discountPercentage && (
                      <span className="bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        {campaign.creative.discountPercentage}
                      </span>
                    )}
                  </div>
                </div>

                {/* Targeting: Geofence & Schedule */}
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className="text-slate-400">Geofence:</span>
                    <span className="font-medium text-white truncate">
                      {getGeofenceNames(campaign.targetGeoFences)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span className="text-slate-400">Horários:</span>
                    <span className="font-medium text-white">
                      {campaign.schedule.timeSlots.map(s => `${s.startHour}h às ${s.endHour}h`).join(' e ')}
                    </span>
                  </div>

                  {campaign.schedule.serviceTypeFilter && (
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Tag className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="text-slate-400">Veículos:</span>
                      <span className="font-medium text-white">
                        {campaign.schedule.serviceTypeFilter.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pacing & Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Progresso de Impressões:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {campaign.totalImpressions.toLocaleString()} / {campaign.targetImpressions.toLocaleString()} ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

              </div>

              {/* Metrics Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Investido</span>
                    <span className="font-mono font-bold text-white">R$ {(campaign.budgetSpent / 1000).toFixed(1)}k</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">CPM</span>
                    <span className="font-mono font-bold text-slate-300">R$ {campaign.cpm.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Scans QR</span>
                    <span className="font-mono font-bold text-emerald-400">{campaign.totalScans}</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectCampaignForPreview(campaign)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Criativo</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
