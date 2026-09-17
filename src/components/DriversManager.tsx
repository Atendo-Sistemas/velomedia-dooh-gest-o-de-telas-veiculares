import React, { useState } from 'react';
import { 
  Users, 
  Car, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Award, 
  Phone, 
  Send, 
  Search, 
  Sparkles,
  TrendingUp,
  Share2,
  Gift,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  Percent,
  Calculator,
  UserCheck,
  Zap,
  ArrowUpRight,
  Smartphone,
  Tv,
  Layers,
  HelpCircle,
  TrendingDown,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Driver, DriverReferral } from '../types';
import { INITIAL_REFERRALS } from '../data/mockData';

interface DriversManagerProps {
  drivers: Driver[];
  onPayDriverPix: (driverId: string) => void;
}

export const DriversManager: React.FC<DriversManagerProps> = ({
  drivers,
  onPayDriverPix,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'drivers_list' | 'byod_contracts' | 'referral_network' | 'simulator'>('drivers_list');
  const [searchTerm, setSearchTerm] = useState('');
  const [contractFilter, setContractFilter] = useState<'all' | 'byod' | 'company'>('all');
  const [paidDrivers, setPaidDrivers] = useState<string[]>([]);
  const [referrals, setReferrals] = useState<DriverReferral[]>(INITIAL_REFERRALS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New Driver / BYOD Form Modal
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [referrerId, setReferrerId] = useState(drivers[0]?.id || 'drv_01');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverCarPlate, setNewDriverCarPlate] = useState('');
  const [newDriverCarModel, setNewDriverCarModel] = useState('');
  const [newDriverContractType, setNewDriverContractType] = useState<'byod_driver_equipment' | 'company_equipment'>('byod_driver_equipment');
  const [newDriverDeviceModel, setNewDriverDeviceModel] = useState('Samsung Galaxy Tab A9+ 11" 4G');
  const [newDriverService, setNewDriverService] = useState<'Uber Black' | 'Uber Comfort' | 'UberX' | 'Taxi Especial' | '99 Pop'>('Uber Comfort');
  const [newDriverPix, setNewDriverPix] = useState('');

  // Referral Simulator State
  const [simContractType, setSimContractType] = useState<'byod' | 'company'>('byod');
  const [simGrossAdRevenue, setSimGrossAdRevenue] = useState<number>(1200); // R$ 1.200 faturamento bruto médio gerado pela tela
  const [simCarsCount, setSimCarsCount] = useState<number>(6);
  const [simBonusPerCar, setSimBonusPerCar] = useState<number>(50); // R$ 50/mês por carro ativo

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.carPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.referralCode && d.referralCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.deviceModelOwned && d.deviceModelOwned.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesContract =
      contractFilter === 'all' ||
      (contractFilter === 'byod' && d.contractType === 'byod_driver_equipment') ||
      (contractFilter === 'company' && d.contractType !== 'byod_driver_equipment');

    return matchesSearch && matchesContract;
  });

  const handlePixPayment = (driver: Driver) => {
    setPaidDrivers([...paidDrivers, driver.id]);
    onPayDriverPix(driver.id);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
    });
    const totalAmount = driver.monthlyEarnings + (driver.referralRecurringBonusMonthly || 0);
    setToastMessage(`Repasse PIX de R$ ${totalAmount.toFixed(2)} (incluindo R$ ${(driver.referralRecurringBonusMonthly || 0).toFixed(2)} de bônus indicação) enviado para ${driver.name}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyReferralCode = (code: string) => {
    navigator.clipboard.writeText(`https://velomedia.com.br/parceiro?ref=${code}`);
    setCopiedCode(code);
    confetti({ particleCount: 25, spread: 45, origin: { y: 0.85 } });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName || !newDriverCarPlate) return;

    const isByod = newDriverContractType === 'byod_driver_equipment';

    // Also register referral link if chosen
    if (referrerId) {
      const newRef: DriverReferral = {
        id: `ref_${Date.now()}`,
        referrerDriverId: referrerId,
        referredDriverId: `drv_${Date.now()}`,
        referredDriverName: newDriverName,
        referredCarPlate: newDriverCarPlate.toUpperCase(),
        referredServiceType: newDriverService,
        referredAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active',
        currentMonthUptime: 99.2,
        monthlyRecurringBonus: 50.00,
        totalBonusEarned: 50.00,
        lastPayoutDate: '2026-08-25',
      };
      setReferrals([newRef, ...referrals]);
    }

    setShowAddDriverModal(false);
    confetti({ particleCount: 55, spread: 75 });
    setToastMessage(`Motorista ${newDriverName} cadastrado na modalidade ${isByod ? 'BYOD (Equipamento Próprio - 45% Repasse)' : 'Comodato da Empresa (20% Repasse)'}!`);
    
    // Clear inputs
    setNewDriverName('');
    setNewDriverCarPlate('');
    setNewDriverCarModel('');
    setNewDriverPix('');
    setTimeout(() => setToastMessage(null), 4500);
  };

  const byodDriversCount = drivers.filter(d => d.contractType === 'byod_driver_equipment').length;
  const companyDriversCount = drivers.length - byodDriversCount;

  const totalBaseEarnings = drivers.reduce((acc, d) => acc + d.monthlyEarnings, 0);
  const totalReferralBonuses = referrals.filter(r => r.status === 'active').reduce((acc, r) => acc + r.monthlyRecurringBonus, 0);
  const totalMonthlyEarningsWithBonus = totalBaseEarnings + totalReferralBonuses;

  // Simulator Calculations
  const simDriverSharePct = simContractType === 'byod' ? 0.45 : 0.20;
  const simDriverOwnScreenPay = simGrossAdRevenue * simDriverSharePct;
  const simReferralTotal = simCarsCount * simBonusPerCar;
  const simDriverGrandTotal = simDriverOwnScreenPay + simReferralTotal;

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Motoristas Parceiros, BYOD & Bônus de Indicação</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Gestão da frota própria vs. motoristas com equipamento pessoal (BYOD), repasses PIX por revenue share e renda passiva recorrente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Repasses + Bônus (Mês)</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              R$ {totalMonthlyEarningsWithBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => setShowAddDriverModal(true)}
            className="px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-500/20 transition"
          >
            <Smartphone className="w-4 h-4" />
            <span>Cadastrar Motorista / BYOD</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-900/80 px-2 py-0.5 rounded font-bold">PIX PROCESSADO</span>
        </div>
      )}

      {/* Program Summary Cards (4 KPI blocks) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: BYOD (Motorista Entra com Hardware) */}
        <div className="bg-gradient-to-br from-indigo-950/70 to-slate-900 border border-indigo-500/40 p-4 rounded-2xl flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-indigo-300 font-bold">Modalidade BYOD</span>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1 py-0.2 rounded font-mono font-bold">45% PIX</span>
            </div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {byodDriversCount} carros <span className="text-xs text-slate-400 font-normal">({Math.round((byodDriversCount/drivers.length)*100)}%)</span>
            </div>
            <span className="text-[10px] text-indigo-200/70">Zero investimento em hardware</span>
          </div>
        </div>

        {/* KPI 2: Frota Própria (Comodato) */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Frota Empresa (Comodato)</span>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {companyDriversCount} carros <span className="text-xs text-slate-400 font-normal">(20% repasse)</span>
            </div>
            <span className="text-[10px] text-slate-500">Hardware da empresa</span>
          </div>
        </div>

        {/* KPI 3: Bônus Recorrente de Indicação */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-purple-300 font-bold">Bônus de Indicações</span>
            </div>
            <div className="text-lg font-bold text-purple-300 font-mono mt-0.5">
              R$ {totalReferralBonuses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">/mês</span>
            </div>
            <span className="text-[10px] text-purple-200/70">{referrals.filter(r => r.status === 'active').length} vínculos ativos</span>
          </div>
        </div>

        {/* KPI 4: Uptime & Qualidade da Frota */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Uptime Médio das Telas</span>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              98.4%
            </div>
            <span className="text-[10px] text-emerald-500/80">Meta &gt; 95% para repasse integral</span>
          </div>
        </div>

      </div>

      {/* Sub-Tabs: Lista de Motoristas | Comparativo Modalidades (BYOD vs Comodato) | Rede de Indicações | Simulador */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('drivers_list')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'drivers_list'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Frota de Motoristas ({drivers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('byod_contracts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'byod_contracts'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Modelo de Negócios BYOD</span>
        </button>

        <button
          onClick={() => setActiveSubTab('referral_network')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'referral_network'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Rede de Indicações ({referrals.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'simulator'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Simulador de Ganhos & BYOD</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: LISTA PRINCIPAL DE MOTORISTAS                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'drivers_list' && (
        <div className="space-y-5">
          
          {/* Filter / Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por nome, placa, modelo ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Filtrar Contrato:</span>
              <select
                value={contractFilter}
                onChange={(e) => setContractFilter(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Todos os Contratos ({drivers.length})</option>
                <option value="byod">Equipamento Próprio / BYOD ({byodDriversCount})</option>
                <option value="company">Comodato da Empresa ({companyDriversCount})</option>
              </select>
            </div>
          </div>

          {/* Driver Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDrivers.map((driver) => {
              const isPaid = paidDrivers.includes(driver.id);
              const recurringBonus = driver.referralRecurringBonusMonthly || 0;
              const totalPayout = driver.monthlyEarnings + recurringBonus;
              const isByod = driver.contractType === 'byod_driver_equipment';

              return (
                <div
                  key={driver.id}
                  className={`bg-slate-900 border rounded-2xl p-5 shadow-sm transition flex flex-col justify-between ${
                    isByod ? 'border-indigo-500/40 hover:border-indigo-400/70' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Driver Top Info */}
                    <div className="flex items-start space-x-3 pb-3 border-b border-slate-800">
                      <img
                        src={driver.avatar}
                        alt={driver.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white truncate">{driver.name}</h3>
                          <span className="text-xs text-amber-400 font-semibold flex items-center">
                            ★ {driver.rating}
                          </span>
                        </div>
                        
                        {/* Contract Badge */}
                        <div className="flex items-center space-x-1.5 mt-1">
                          {isByod ? (
                            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded text-[10px] font-bold flex items-center space-x-1">
                              <Smartphone className="w-3 h-3 mr-0.5" />
                              BYOD (45% Repasse)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px] font-medium flex items-center space-x-1">
                              <Tv className="w-3 h-3 mr-0.5" />
                              Comodato (20% Repasse)
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400 flex items-center space-x-1 mt-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{driver.phone}</span>
                        </span>
                      </div>
                    </div>

                    {/* Vehicle & Device Details */}
                    <div className="mt-3 p-3 bg-slate-800/50 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Veículo:</span>
                        <span className="font-semibold text-slate-200">{driver.carModel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Placa:</span>
                        <span className="font-mono font-bold text-cyan-300">{driver.carPlate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Equipamento:</span>
                        <span className="text-slate-300 truncate max-w-[170px]" title={driver.deviceModelOwned || 'Padrão'}>
                          {driver.deviceModelOwned || 'VeloTab 10.1 IPS'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Corridas no Mês:</span>
                        <span className="font-semibold text-white">{driver.totalRidesMonth} viagens</span>
                      </div>
                    </div>

                    {/* Referral Code & Passive Bonus Tag */}
                    <div className="mt-3 p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium flex items-center space-x-1">
                          <Gift className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Link de Indicação:</span>
                        </span>
                        <button
                          onClick={() => handleCopyReferralCode(driver.referralCode || 'VELO-REF')}
                          className="flex items-center space-x-1 px-2 py-0.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-md text-[10px] font-mono font-bold text-indigo-300 transition"
                          title="Copiar Link de Indicação para o WhatsApp do Motorista"
                        >
                          {copiedCode === driver.referralCode ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <span>{driver.referralCode || 'GERAR-REF'}</span>
                              <Copy className="w-3 h-3 ml-0.5 text-indigo-400" />
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-400">Indicados Ativos na Rede:</span>
                        <span className="font-bold text-white">
                          {driver.referralsCount || 0} motoristas
                        </span>
                      </div>

                      {recurringBonus > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-indigo-300 font-semibold bg-indigo-900/40 px-2 py-1 rounded-lg">
                          <span>Bônus Recorrente:</span>
                          <span className="font-mono">+ R$ {recurringBonus.toFixed(2)}/mês</span>
                        </div>
                      )}
                    </div>

                    {/* Screen Uptime Rating Metric */}
                    <div className="mt-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Uptime da Tela no Carro:</span>
                        <span className={`font-mono font-bold ${
                          driver.screenUptimeRating >= 95 ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {driver.screenUptimeRating}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            driver.screenUptimeRating >= 95 ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                          style={{ width: `${driver.screenUptimeRating}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Earnings & PIX Payment Button */}
                  <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Repasse Anúncios ({driver.revenueSharePercent || (isByod ? 45 : 20)}%):</span>
                        <span className="font-mono text-slate-200">R$ {driver.monthlyEarnings.toFixed(2)}</span>
                      </div>
                      {recurringBonus > 0 && (
                        <div className="flex items-center justify-between text-xs text-indigo-300">
                          <span>Bônus de Indicação ({driver.referralsCount}x R$ 50):</span>
                          <span className="font-mono font-bold">+ R$ {recurringBonus.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                        <span className="text-xs font-bold text-white">Total a Receber (PIX):</span>
                        <span className="text-base font-bold text-emerald-400 font-mono">
                          R$ {totalPayout.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 truncate bg-slate-950 px-2 py-1 rounded border border-slate-800 font-mono">
                      Chave PIX: {driver.pixKey}
                    </div>

                    <button
                      onClick={() => handlePixPayment(driver)}
                      disabled={isPaid}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-md ${
                        isPaid
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 cursor-default'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Repasse PIX Efetuado</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Pagar Repasse + Bônus via PIX</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: MODELO DE NEGÓCIOS BYOD (EQUIPAMENTO DO MOTORISTA)            */}
      {/* ========================================================================= */}
      {activeSubTab === 'byod_contracts' && (
        <div className="space-y-6">
          
          {/* Top Banner Explanatório */}
          <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-cyan-950/60 border border-indigo-500/40 p-6 rounded-3xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/30 text-indigo-300 font-mono font-bold text-xs border border-indigo-500/40">
                    ESTRATÉGIA DE HIPER-ESCALA
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Investimento Inicial Zero em Hardware</span>
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-2">
                  Modalidade BYOD: "O Motorista entra com o Equipamento, Nós com a Tecnologia e os Anunciantes"
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  Ao permitir que o motorista use seu próprio tablet (Samsung, Xiaomi, Lenovo ou iPad) ou celular secundário, a sua empresa elimina 100% do CAPEX de hardware. Em troca, repassa uma comissão maior (45% vs 20%), criando um incentivo gigantesco para adesão imediata em massa.
                </p>
              </div>

              <button
                onClick={() => setShowAddDriverModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-lg flex items-center space-x-2 flex-shrink-0"
              >
                <Smartphone className="w-4 h-4" />
                <span>Ativar Novo Motorista BYOD</span>
              </button>
            </div>
          </div>

          {/* Comparison Matrix: BYOD vs. Comodato da Empresa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Box 1: BYOD (Equipamento do Motorista) */}
            <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-3xl p-6 space-y-5 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Recomendado p/ Escala Rápida
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Modalidade BYOD (Bring Your Own Device)</h3>
                  <p className="text-xs text-indigo-300">Motorista disponibiliza o próprio tablet/celular</p>
                </div>
              </div>

              {/* Financial terms */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Repasse para o Motorista:</span>
                  <span className="font-mono font-black text-emerald-400 text-base">45% da Receita Bruta</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Margem Líquida da Empresa:</span>
                  <span className="font-mono font-bold text-cyan-300">55% (Zero risco de hardware)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Investimento Inicial da Empresa:</span>
                  <span className="font-mono font-bold text-emerald-300">R$ 0,00 por carro</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Responsabilidade por Reparo / Quebra:</span>
                  <span className="font-semibold text-slate-300">Do próprio Motorista</span>
                </div>
              </div>

              {/* Vantagens */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-200 block">Vantagens Estratégicas:</span>
                <ul className="space-y-1.5 text-slate-300">
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Escala Ilimitada:</strong> Cadastre 100 ou 1.000 carros em dias, sem precisar comprar telas.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Cuidado Extremo:</strong> Como o equipamento é dele, o motorista não estraga nem deixa cair.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Ativação Instantânea:</strong> Basta o motorista acessar a URL do Web Kiosk ou instalar o PWA.</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* Box 2: Frota Própria (Comodato) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 relative shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Tv className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Modalidade Comodato (Frota da Empresa)</h3>
                  <p className="text-xs text-slate-400">Empresa compra o hardware e instala no carro</p>
                </div>
              </div>

              {/* Financial terms */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Repasse para o Motorista:</span>
                  <span className="font-mono font-bold text-slate-200 text-base">20% a 25% da Receita</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Margem Bruta da Empresa:</span>
                  <span className="font-mono font-bold text-cyan-300">75% a 80%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Investimento Inicial da Empresa:</span>
                  <span className="font-mono font-bold text-rose-400">~R$ 600 a R$ 850 / tela</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Responsabilidade por Manutenção:</span>
                  <span className="font-semibold text-slate-300">Da Empresa</span>
                </div>
              </div>

              {/* Vantagens */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-200 block">Vantagens & Desafios:</span>
                <ul className="space-y-1.5 text-slate-300">
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Maior Margem Unitária:</strong> A empresa retém 80% do faturamento de cada anúncio.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Padronização Visual:</strong> Todas as telas são idênticas com acabamento anti-reflexo.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <TrendingDown className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span><strong>CAPEX Elevado:</strong> Requer capital inicial e tempo de recuperação (payback de 2-4 meses).</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>

          {/* Requisitos Mínimos para o Tablet do Motorista */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Requisitos Mínimos de Hardware para Aceitar o Equipamento do Motorista (BYOD)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Tamanho de Tela:</span>
                <strong className="text-white">Mínimo 8.7" até 11"</strong>
                <span className="text-[10px] text-slate-500 block mt-1">Garante boa visibilidade traseira</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Sistema Operacional:</span>
                <strong className="text-white">Android 9.0+ ou iOS 14+</strong>
                <span className="text-[10px] text-slate-500 block mt-1">Suporte pleno a WebSockets/PWA</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Conectividade:</span>
                <strong className="text-white">Chip 4G/5G ou Roteador</strong>
                <span className="text-[10px] text-slate-500 block mt-1">Telemetria GPS e troca de mídia</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Fixação e Energia:</span>
                <strong className="text-white">Suporte Encosto + Cabo 12V</strong>
                <span className="text-[10px] text-slate-500 block mt-1">Alimentação contínua na chave</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: REDE DE INDICAÇÕES & PADRINHOS                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'referral_network' && (
        <div className="space-y-4">
          
          <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/30 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-purple-400" />
                <span>Como Funciona o Bônus Recorrente por Indicação:</span>
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Cada motorista possui um link exclusivo no WhatsApp. Quando ele indica outro parceiro (com carro próprio ou BYOD), ele passa a receber <strong>R$ 50,00 mensais recorrentes</strong> via PIX por cada tela ativa que mantiver uptime acima de 95%.
              </p>
            </div>

            <button
              onClick={() => setShowAddDriverModal(true)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg flex-shrink-0"
            >
              <Gift className="w-4 h-4" />
              <span>Cadastrar Novo Vínculo</span>
            </button>
          </div>

          {/* Active Referrals Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Vínculos de Indicação Ativos no Sistema ({referrals.length})</span>
              </h3>
              <span className="text-xs text-purple-300 font-mono font-bold">
                Total Bônus Recorrente: R$ {totalReferralBonuses.toFixed(2)}/mês
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Padrinho (Quem Indicou)</th>
                    <th className="p-3.5">Indicado (Novo Motorista)</th>
                    <th className="p-3.5">Categoria / Placa</th>
                    <th className="p-3.5">Data Início</th>
                    <th className="p-3.5 text-center">Uptime Tela</th>
                    <th className="p-3.5 text-right">Bônus Recorrente</th>
                    <th className="p-3.5 text-right">Total Acumulado</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {referrals.map((ref) => {
                    const referrer = drivers.find(d => d.id === ref.referrerDriverId);

                    return (
                      <tr key={ref.id} className="hover:bg-slate-800/40 transition">
                        {/* Referrer */}
                        <td className="p-3.5 font-medium text-white">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-xs">
                              {referrer?.name.charAt(0) || 'M'}
                            </div>
                            <div>
                              <div className="font-bold text-white">{referrer?.name || 'Motorista'}</div>
                              <div className="text-[10px] text-purple-300 font-mono">{referrer?.referralCode}</div>
                            </div>
                          </div>
                        </td>

                        {/* Referred */}
                        <td className="p-3.5">
                          <div className="flex items-center space-x-2">
                            <img src={ref.referredAvatar} alt={ref.referredDriverName} className="w-6 h-6 rounded-full object-cover border border-slate-700" />
                            <span className="font-semibold text-slate-200">{ref.referredDriverName}</span>
                          </div>
                        </td>

                        {/* Category / Plate */}
                        <td className="p-3.5">
                          <div>
                            <span className="text-slate-300 font-medium">{ref.referredServiceType}</span>
                            <span className="block text-[10px] font-mono text-cyan-400">{ref.referredCarPlate}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                          {ref.joinDate}
                        </td>

                        {/* Uptime */}
                        <td className="p-3.5 text-center font-mono font-bold text-emerald-400">
                          {ref.currentMonthUptime}%
                        </td>

                        {/* Bonus Recorrente */}
                        <td className="p-3.5 text-right font-mono font-bold text-purple-300">
                          R$ {ref.monthlyRecurringBonus.toFixed(2)}/mês
                        </td>

                        {/* Total Acumulado */}
                        <td className="p-3.5 text-right font-mono text-emerald-400">
                          R$ {ref.totalBonusEarned.toFixed(2)}
                        </td>

                        {/* Status */}
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Ativo & Qualificado
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: SIMULADOR DE GANHOS & RENDA PASSIVA PARA APRESENTAÇÃO          */}
      {/* ========================================================================= */}
      {activeSubTab === 'simulator' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <span>Simulador de Ganhos: BYOD + Bônus Recorrente de Indicação</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Apresente aos motoristas o potencial de faturamento trazendo o equipamento próprio e indicando a rede de amigos.
              </p>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-semibold">
              Simulador Comercial para Recrutamento
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Input Controls */}
            <div className="lg:col-span-6 space-y-5 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
              
              {/* Modalidade Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Modalidade da Tela do Motorista:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSimContractType('byod')}
                    className={`p-3 rounded-xl border text-left transition ${
                      simContractType === 'byod'
                        ? 'bg-indigo-950/80 border-indigo-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Equipamento Próprio (BYOD)</span>
                      {simContractType === 'byod' && <span className="text-emerald-400">✓</span>}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold block mt-1">45% de Repasse</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimContractType('company')}
                    className={`p-3 rounded-xl border text-left transition ${
                      simContractType === 'company'
                        ? 'bg-blue-950/80 border-blue-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Comodato da Empresa</span>
                      {simContractType === 'company' && <span className="text-blue-400">✓</span>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">20% de Repasse</span>
                  </button>
                </div>
              </div>

              {/* Slider 1: Faturamento Bruto Médio de Anúncios na Tela */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">Faturamento Bruto Gerado pela Tela / Mês:</span>
                  <span className="text-base font-black text-cyan-400 font-mono bg-cyan-950 px-2.5 py-0.5 rounded-lg border border-cyan-800">
                    R$ {simGrossAdRevenue.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="600"
                  max="2500"
                  step="50"
                  value={simGrossAdRevenue}
                  onChange={(e) => setSimGrossAdRevenue(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>R$ 600 (Conservador)</span>
                  <span>R$ 1.200 (Médio)</span>
                  <span>R$ 2.500 (Alta Demanda)</span>
                </div>
              </div>

              {/* Slider 2: Quantidade de amigos motoristas que ele indica */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">Quantos amigos motoristas ele indica:</span>
                  <span className="text-base font-black text-purple-400 font-mono bg-purple-950 px-2.5 py-0.5 rounded-lg border border-purple-800">
                    {simCarsCount} amigos motoristas
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={simCarsCount}
                  onChange={(e) => setSimCarsCount(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0 carros</span>
                  <span>5 carros</span>
                  <span>15 carros</span>
                  <span>30 carros</span>
                </div>
              </div>

              {/* Slider 3: Bônus por amigo ativo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">Bônus por Indicação Ativa / Mês:</span>
                  <span className="text-base font-black text-emerald-400 font-mono bg-emerald-950 px-2.5 py-0.5 rounded-lg border border-emerald-800">
                    R$ {simBonusPerCar.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  step="5"
                  value={simBonusPerCar}
                  onChange={(e) => setSimBonusPerCar(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
              </div>

            </div>

            {/* Right: Projected Income Breakdown Card */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
              
              <div className="bg-gradient-to-br from-indigo-900/50 via-slate-900 to-emerald-950/40 border border-indigo-500/40 p-6 rounded-3xl space-y-4 shadow-2xl">
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">
                    Extrato de Ganhos Estimados do Parceiro
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                    PIX MENSAL
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                    <div>
                      <span className="font-bold block text-white">1. Repasse da Tela Própria ({simDriverSharePct * 100}%):</span>
                      <span className="text-[11px] text-slate-400">Baseado em R$ {simGrossAdRevenue.toFixed(2)} de faturamento bruto</span>
                    </div>
                    <span className="font-mono font-bold text-cyan-300 text-sm">
                      R$ {simDriverOwnScreenPay.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                    <div>
                      <span className="font-bold block text-purple-300">2. Renda Passiva de Indicações:</span>
                      <span className="text-[11px] text-slate-400">{simCarsCount} carros x R$ {simBonusPerCar.toFixed(2)}/mês recorrente</span>
                    </div>
                    <span className="font-mono font-bold text-purple-300 text-sm">
                      + R$ {simReferralTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Renda Total Mensal Líquida:</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono block">
                        R$ {simDriverGrandTotal.toFixed(2)} <span className="text-xs text-slate-300 font-normal">/mês</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Projeção Anual:</span>
                      <span className="text-sm font-bold text-slate-200 font-mono">
                        R$ {(simDriverGrandTotal * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1">
                  <p className="text-slate-300 font-medium flex items-center text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Argumento de Venda Comercial:
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    "Com o seu próprio tablet rodando e indicando {simCarsCount} colegas de ponto ou aplicativo, você ganha <strong>R$ {simDriverGrandTotal.toFixed(2)} todos os meses</strong> via PIX para pagar combustível e IPVA sem trabalhar 1 minuto a mais."
                  </p>
                </div>

              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300">Deseja cadastrar um parceiro com esta simulação agora?</span>
                </div>
                <button
                  onClick={() => setShowAddDriverModal(true)}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition"
                >
                  Cadastrar Agora
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CADASTRAR NOVO MOTORISTA (BYOD OU COMODATO) + INDICAÇÃO           */}
      {/* ========================================================================= */}
      {showAddDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl text-slate-100 p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Cadastrar Motorista Parceiro</h2>
                <p className="text-xs text-slate-400">Defina o contrato (BYOD ou Comodato) e o padrinho indicador</p>
              </div>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4 pt-1 text-xs">
              
              {/* Modalidade de Contrato */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Modalidade de Hardware:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewDriverContractType('byod_driver_equipment')}
                    className={`p-3 rounded-xl border text-left transition ${
                      newDriverContractType === 'byod_driver_equipment'
                        ? 'bg-indigo-950/90 border-indigo-400 text-white shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs text-indigo-300 flex items-center justify-between">
                      <span>BYOD (Equipamento Próprio)</span>
                      {newDriverContractType === 'byod_driver_equipment' && <span className="text-cyan-400">✓</span>}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold block mt-1">45% de Repasse PIX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewDriverContractType('company_equipment')}
                    className={`p-3 rounded-xl border text-left transition ${
                      newDriverContractType === 'company_equipment'
                        ? 'bg-blue-950/90 border-blue-400 text-white shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs text-blue-300 flex items-center justify-between">
                      <span>Comodato da Empresa</span>
                      {newDriverContractType === 'company_equipment' && <span className="text-blue-400">✓</span>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">20% de Repasse PIX</span>
                  </button>
                </div>
              </div>

              {/* Nome & Telefone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Nome do Motorista:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fernando Albuquerque"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">WhatsApp / Telefone:</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={newDriverPhone}
                    onChange={(e) => setNewDriverPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Placa & Veículo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Placa do Veículo:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ABC1D23"
                    value={newDriverCarPlate}
                    onChange={(e) => setNewDriverCarPlate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Modelo do Veículo:</label>
                  <input
                    type="text"
                    placeholder="Ex: Chevrolet Tracker Premier"
                    value={newDriverCarModel}
                    onChange={(e) => setNewDriverCarModel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Modelo do Tablet / Aparelho se for BYOD */}
              {newDriverContractType === 'byod_driver_equipment' && (
                <div className="space-y-1">
                  <label className="font-bold text-indigo-300">Modelo do Tablet Pessoal do Motorista:</label>
                  <input
                    type="text"
                    value={newDriverDeviceModel}
                    onChange={(e) => setNewDriverDeviceModel(e.target.value)}
                    className="w-full bg-slate-800 border border-indigo-500/50 rounded-xl px-3 py-2 text-white font-medium"
                    placeholder="Ex: Samsung Galaxy Tab A9+, Xiaomi Pad 6, iPad 9th"
                  />
                </div>
              )}

              {/* Categoria */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Categoria:</label>
                  <select
                    value={newDriverService}
                    onChange={(e) => setNewDriverService(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Uber Black">Uber Black</option>
                    <option value="Uber Comfort">Uber Comfort</option>
                    <option value="UberX">UberX</option>
                    <option value="Taxi Especial">Taxi Especial</option>
                    <option value="99 Pop">99 Pop</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Chave PIX:</label>
                  <input
                    type="text"
                    placeholder="CPF, E-mail ou Telefone"
                    value={newDriverPix}
                    onChange={(e) => setNewDriverPix(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Quem é o padrinho indicador */}
              <div className="space-y-1 pt-1">
                <label className="font-bold text-slate-300 flex items-center justify-between">
                  <span>Padrinho Indicador (Bônus R$ 50/mês):</span>
                  <span className="text-[10px] text-purple-300 font-normal">Opcional</span>
                </label>
                <select
                  value={referrerId}
                  onChange={(e) => setReferrerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">Sem Padrinho (Cadastro Direto)</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.carModel} - {d.carPlate}) • Código: {d.referralCode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  Cadastrar & Ativar
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
