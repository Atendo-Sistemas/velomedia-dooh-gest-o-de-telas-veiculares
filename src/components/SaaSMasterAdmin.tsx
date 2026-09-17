import React, { useState } from 'react';
import { 
  Building2, 
  Tv, 
  Users, 
  Sliders, 
  DollarSign, 
  ShieldCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Search, 
  Filter, 
  ChevronRight, 
  Sparkles, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  X,
  CreditCard,
  QrCode,
  Globe,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';
import { SaaSOrganization, SaaSPlan, SaaSPlanTier, SaaSInvoice } from '../types';

interface SaaSMasterAdminProps {
  organizations: SaaSOrganization[];
  plans: SaaSPlan[];
  invoices: SaaSInvoice[];
  currentOrg: SaaSOrganization;
  onSelectOrg: (org: SaaSOrganization) => void;
  onUpdateOrg: (org: SaaSOrganization) => void;
  onCreateOrg: (org: SaaSOrganization) => void;
  onDeleteOrg: (orgId: string) => void;
  onExitMasterMode: () => void;
}

export const SaaSMasterAdmin: React.FC<SaaSMasterAdminProps> = ({
  organizations,
  plans,
  invoices,
  currentOrg,
  onSelectOrg,
  onUpdateOrg,
  onCreateOrg,
  onDeleteOrg,
  onExitMasterMode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<SaaSOrganization | null>(null);

  // Form states for new/edit company
  const [formName, setFormName] = useState('');
  const [formCnpj, setFormCnpj] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('SP');
  const [formPlan, setFormPlan] = useState<SaaSPlanTier>('pro_fleet');
  const [formMaxScreens, setFormMaxScreens] = useState<number>(30);
  const [formMaxCampaigns, setFormMaxCampaigns] = useState<number>(50);
  const [formMaxDrivers, setFormMaxDrivers] = useState<number>(40);
  const [formAdminName, setFormAdminName] = useState('');
  const [formAdminEmail, setFormAdminEmail] = useState('');
  const [formAdminPhone, setFormAdminPhone] = useState('');
  const [formCustomDomain, setFormCustomDomain] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'trial' | 'past_due' | 'suspended'>('active');

  // Consolidated SaaS platform metrics
  const totalScreensLicensed = organizations.reduce((sum, o) => sum + o.activeScreensCount, 0);
  const totalScreensCapacity = organizations.reduce((sum, o) => sum + o.maxScreensLimit, 0);
  const totalCampaignsRunning = organizations.reduce((sum, o) => sum + (o.activeCampaignsCount || 6), 0);
  const totalDriversActive = organizations.reduce((sum, o) => sum + (o.activeDriversCount || 5), 0);
  const totalSaaSMonthlyRevenue = organizations.reduce((sum, o) => sum + o.monthlySoftwareCost, 0);

  // Filtered organizations
  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.cnpj.includes(searchTerm) ||
      org.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.adminUser?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    const matchesPlan = planFilter === 'all' || org.planTier === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const openCreateModal = () => {
    setEditingOrg(null);
    setFormName('');
    setFormCnpj('');
    setFormCity('São Paulo');
    setFormState('SP');
    setFormPlan('pro_fleet');
    setFormMaxScreens(30);
    setFormMaxCampaigns(50);
    setFormMaxDrivers(40);
    setFormAdminName('');
    setFormAdminEmail('');
    setFormAdminPhone('');
    setFormCustomDomain('');
    setFormStatus('active');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (org: SaaSOrganization) => {
    setEditingOrg(org);
    setFormName(org.name);
    setFormCnpj(org.cnpj);
    setFormCity(org.city);
    setFormState(org.state);
    setFormPlan(org.planTier);
    setFormMaxScreens(org.maxScreensLimit);
    setFormMaxCampaigns(org.maxCampaignsLimit || 50);
    setFormMaxDrivers(org.maxDriversLimit || 40);
    setFormAdminName(org.adminUser?.name || 'Administrador');
    setFormAdminEmail(org.adminUser?.email || org.billingEmail);
    setFormAdminPhone(org.adminUser?.phone || '(11) 99999-0000');
    setFormCustomDomain(org.customDomain || '');
    setFormStatus(org.status);
    setIsCreateModalOpen(true);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();

    const planObj = plans.find(p => p.id === formPlan);
    const pricePerScreen = planObj ? planObj.pricePerScreenMonth : 39;
    const baseFee = planObj ? planObj.baseMonthlyFee : 299;
    const activeScreens = editingOrg ? editingOrg.activeScreensCount : 2;
    const monthlyCost = baseFee + (activeScreens * pricePerScreen);

    if (editingOrg) {
      // Update existing
      const updated: SaaSOrganization = {
        ...editingOrg,
        name: formName,
        cnpj: formCnpj,
        city: formCity,
        state: formState,
        planTier: formPlan,
        maxScreensLimit: Number(formMaxScreens),
        maxCampaignsLimit: Number(formMaxCampaigns),
        maxDriversLimit: Number(formMaxDrivers),
        adminUser: {
          name: formAdminName,
          email: formAdminEmail,
          phone: formAdminPhone,
        },
        billingEmail: formAdminEmail,
        monthlySoftwareCost: monthlyCost,
        status: formStatus,
        customDomain: formCustomDomain.trim() || undefined,
      };
      onUpdateOrg(updated);
    } else {
      // Create new
      const newOrg: SaaSOrganization = {
        id: `org_${Date.now()}`,
        name: formName,
        slug: formName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        cnpj: formCnpj,
        city: formCity,
        state: formState,
        planTier: formPlan,
        activeScreensCount: 0,
        maxScreensLimit: Number(formMaxScreens),
        activeCampaignsCount: 0,
        maxCampaignsLimit: Number(formMaxCampaigns),
        activeDriversCount: 0,
        maxDriversLimit: Number(formMaxDrivers),
        adminUser: {
          name: formAdminName,
          email: formAdminEmail,
          phone: formAdminPhone,
        },
        billingEmail: formAdminEmail,
        billingCycle: 'monthly',
        nextBillingDate: '2026-09-30',
        monthlySoftwareCost: baseFee,
        estimatedGrossAdRevenue: 0,
        driverPayoutTotal: 0,
        netProfit: 0,
        status: formStatus,
        customDomain: formCustomDomain.trim() || undefined,
      };
      onCreateOrg(newOrg);
    }

    setIsCreateModalOpen(false);
  };

  const handleToggleStatus = (org: SaaSOrganization) => {
    const nextStatus = org.status === 'suspended' ? 'active' : 'suspended';
    onUpdateOrg({ ...org, status: nextStatus });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Master SaaS Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 rounded-full flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>SaaS Core Master Control • Super Admin</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">v3.5 Multi-Tenant</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Gestão de Empresas & Quotas de Telas
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Módulo master independente para provisionamento de novas empresas parceiras, definição rigorosa de limites de telas veiculares, campanhas e motoristas, e faturamento recorrente.
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full lg:w-auto justify-end flex-wrap gap-2">
            <button
              onClick={onExitMasterMode}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold transition shadow-md"
            >
              <span>Voltar ao Painel da Franquia ({currentOrg.name.split(' ')[0]})</span>
              <ChevronRight className="w-4 h-4 text-blue-400" />
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/40 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Empresa Parceira</span>
            </button>
          </div>
        </div>

        {/* Global SaaS Platform Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-8">
          <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Empresas Ativas</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">{organizations.length} Franquias</p>
            <span className="text-[11px] text-emerald-400 font-medium">100% adimplentes</span>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Telas Licenciadas</span>
              <Tv className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-blue-400 mt-1">{totalScreensLicensed} Telas</p>
            <span className="text-[11px] text-slate-400">Capacidade: {totalScreensCapacity}</span>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Anúncios em Exibição</span>
              <Sliders className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-purple-400 mt-1">{totalCampaignsRunning} Anúncios</p>
            <span className="text-[11px] text-purple-300">Georreferenciados</span>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Frota de Motoristas</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{totalDriversActive} Carros</p>
            <span className="text-[11px] text-emerald-400">Repasses via PIX</span>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-indigo-500/40 bg-indigo-950/20 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-indigo-300 text-xs">
              <span>Faturamento SaaS (MRR)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              R$ {totalSaaSMonthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-indigo-300">Recorrência Mensal</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Empresa, CNPJ ou Cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativas</option>
            <option value="trial">Em Teste</option>
            <option value="suspended">Suspensas / Bloqueadas</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos os Planos</option>
            <option value="starter">Starter DOOH</option>
            <option value="pro_fleet">Pro Fleet Network</option>
            <option value="enterprise_network">Enterprise Franchise</option>
          </select>
        </div>
      </div>

      {/* Companies List / Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredOrgs.map((org) => {
          const plan = plans.find(p => p.id === org.planTier) || plans[1];
          const screensUsagePercent = Math.min(100, Math.round((org.activeScreensCount / org.maxScreensLimit) * 100));
          const campaignsUsagePercent = Math.min(100, Math.round(((org.activeCampaignsCount || 6) / (org.maxCampaignsLimit || 50)) * 100));
          const driversUsagePercent = Math.min(100, Math.round(((org.activeDriversCount || 5) / (org.maxDriversLimit || 40)) * 100));
          const isSelectedTenant = org.id === currentOrg.id;

          return (
            <div 
              key={org.id}
              className={`bg-slate-850 rounded-2xl p-5 sm:p-6 border transition-all duration-200 shadow-xl ${
                isSelectedTenant 
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-slate-800' 
                  : 'border-slate-700/80 hover:border-slate-600'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
                
                {/* Company Info */}
                <div className="flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-indigo-600/30 flex-shrink-0">
                    {org.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <h3 className="text-base font-bold text-white tracking-tight">{org.name}</h3>
                      {isSelectedTenant && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white uppercase">
                          Workspace Atual
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        org.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : org.status === 'suspended'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {org.status === 'active' ? 'Ativa' : org.status === 'suspended' ? 'Suspensa' : 'Trial'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1 flex-wrap">
                      <span>CNPJ: <strong className="text-slate-300 font-mono">{org.cnpj}</strong></span>
                      <span>•</span>
                      <span>Localidade: <strong className="text-slate-300">{org.city} - {org.state}</strong></span>
                      {org.customDomain && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-400 flex items-center space-x-1">
                            <Globe className="w-3 h-3" />
                            <span>{org.customDomain}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Plan Badge & Actions */}
                <div className="flex items-center space-x-2 w-full lg:w-auto justify-end flex-wrap">
                  <div className="text-right mr-2 hidden sm:block">
                    <span className="text-[10px] text-slate-400 font-medium">Plano Contratado</span>
                    <p className="text-xs font-bold text-indigo-300">{plan.name}</p>
                    <span className="text-[11px] font-mono text-emerald-400">
                      R$ {org.monthlySoftwareCost.toFixed(2)}/mês
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectOrg(org)}
                    title="Acessar o Painel Operacional desta empresa"
                    className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition flex items-center space-x-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Entrar no Painel</span>
                  </button>

                  <button
                    onClick={() => openEditModal(org)}
                    title="Editar Limites de Telas, Anúncios e Motoristas"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggleStatus(org)}
                    title={org.status === 'suspended' ? 'Desbloquear Franquia' : 'Suspender por Inadimplência'}
                    className={`p-2 rounded-xl border transition ${
                      org.status === 'suspended'
                        ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30'
                        : 'bg-red-600/10 border-red-500/30 text-red-400 hover:bg-red-600/20'
                    }`}
                  >
                    {org.status === 'suspended' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Resource Quotas & Limits Bars (Telas, Campanhas, Motoristas) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-2">
                
                {/* 1. Telas Veiculares Quota */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                      <Tv className="w-3.5 h-3.5 text-blue-400" />
                      <span>Limite de Telas</span>
                    </span>
                    <span className="font-mono font-bold text-white">
                      {org.activeScreensCount} <span className="text-slate-500 font-normal">/ {org.maxScreensLimit}</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        screensUsagePercent >= 90 ? 'bg-amber-500' : 'bg-blue-500'
                      }`} 
                      style={{ width: `${screensUsagePercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{screensUsagePercent}% utilizado</span>
                    <span className="text-blue-300">R$ {plan.pricePerScreenMonth}/tela adicional</span>
                  </div>
                </div>

                {/* 2. Anúncios / Campanhas Quota */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      <span>Limite de Campanhas</span>
                    </span>
                    <span className="font-mono font-bold text-white">
                      {org.activeCampaignsCount || 6} <span className="text-slate-500 font-normal">/ {org.maxCampaignsLimit || 50}</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all" 
                      style={{ width: `${campaignsUsagePercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{campaignsUsagePercent}% utilizado</span>
                    <span className="text-purple-300">Geofencing incluso</span>
                  </div>
                </div>

                {/* 3. Frota de Motoristas Quota */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Limite de Motoristas</span>
                    </span>
                    <span className="font-mono font-bold text-white">
                      {org.activeDriversCount || 5} <span className="text-slate-500 font-normal">/ {org.maxDriversLimit || 40}</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all" 
                      style={{ width: `${driversUsagePercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{driversUsagePercent}% cadastrados</span>
                    <span className="text-emerald-300">PIX automatizado</span>
                  </div>
                </div>

              </div>

              {/* Company Admin & Contact details */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                <div className="flex items-center space-x-4">
                  <span>Gestor: <strong className="text-slate-300">{org.adminUser?.name || 'Administrador'}</strong></span>
                  <span>Email: <strong className="text-slate-300">{org.adminUser?.email || org.billingEmail}</strong></span>
                  <span>Tel: <strong className="text-slate-300">{org.adminUser?.phone || '(11) 98721-0012'}</strong></span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Próxima fatura SaaS: <strong className="text-white font-mono">{org.nextBillingDate}</strong>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal: Create or Edit Partner Company */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingOrg ? 'Editar Empresa & Limites de Recursos' : 'Cadastrar Nova Empresa Parceira'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina as cotas máximas de telas, campanhas e motoristas homologados no SaaS.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Razão Social / Nome da Franquia</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: MídiaCar Salvador DOOH"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">CNPJ</label>
                  <input
                    type="text"
                    required
                    value={formCnpj}
                    onChange={(e) => setFormCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cidade</label>
                  <input
                    type="text"
                    required
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="São Paulo"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estado (UF)</label>
                  <select
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {['SP', 'RJ', 'PR', 'MG', 'BA', 'RS', 'SC', 'PE', 'DF', 'CE', 'GO'].map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plano SaaS</label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value as SaaSPlanTier)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="starter">Starter DOOH (R$ 49/tela)</option>
                    <option value="pro_fleet">Pro Fleet Network (R$ 39/tela)</option>
                    <option value="enterprise_network">Enterprise Franchise (R$ 29/tela)</option>
                  </select>
                </div>
              </div>

              {/* Limites e Quotas da Franquia */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-indigo-500/30 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-300 font-bold">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Configuração de Limites & Quotas do Sistema</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Qtd. Máxima de Telas</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      required
                      value={formMaxScreens}
                      onChange={(e) => setFormMaxScreens(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Dispositivos Kiosk</span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Qtd. Máxima de Campanhas</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      required
                      value={formMaxCampaigns}
                      onChange={(e) => setFormMaxCampaigns(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Anúncios ativos</span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Qtd. Máxima de Motoristas</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      required
                      value={formMaxDrivers}
                      onChange={(e) => setFormMaxDrivers(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Contas com PIX</span>
                  </div>
                </div>
              </div>

              {/* Admin Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome do Gestor / Diretor</label>
                  <input
                    type="text"
                    required
                    value={formAdminName}
                    onChange={(e) => setFormAdminName(e.target.value)}
                    placeholder="Ex: Carlos Mendes"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email de Cobrança / Acesso</label>
                  <input
                    type="email"
                    required
                    value={formAdminEmail}
                    onChange={(e) => setFormAdminEmail(e.target.value)}
                    placeholder="contato@empresa.com.br"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    required
                    value={formAdminPhone}
                    onChange={(e) => setFormAdminPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Domínio Próprio White-Label (Opcional)</label>
                  <input
                    type="text"
                    value={formCustomDomain}
                    onChange={(e) => setFormCustomDomain(e.target.value)}
                    placeholder="app.minhafranquia.com.br"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status da Conta</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="active">Ativa (Acesso Liberado)</option>
                    <option value="trial">Período de Demonstração (Trial)</option>
                    <option value="suspended">Suspensa / Bloqueada</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Empresa & Aplicar Quotas</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
