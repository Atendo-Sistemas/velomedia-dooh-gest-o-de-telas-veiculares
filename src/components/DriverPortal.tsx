import React, { useState } from 'react';
import { 
  DollarSign, 
  Tv, 
  TrendingUp, 
  Users, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Send, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Car, 
  Smartphone, 
  Gift, 
  Award, 
  QrCode, 
  ChevronRight, 
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
  Info,
  Layers,
  ArrowUpRight,
  BatteryCharging,
  Wifi
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Driver, Device, DriverReferral, Campaign, DriverPayoutRecord } from '../types';
import { INITIAL_REFERRALS, INITIAL_DRIVER_PAYOUTS } from '../data/mockData';

interface DriverPortalProps {
  drivers: Driver[];
  devices: Device[];
  campaigns: Campaign[];
  onOpenPlayer: (deviceId: string) => void;
  onOpenPwaModal?: () => void;
}

export const DriverPortal: React.FC<DriverPortalProps> = ({
  drivers,
  devices,
  campaigns,
  onOpenPlayer,
  onOpenPwaModal,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id || 'drv_01');
  const [activeTab, setActiveTab] = useState<'extract' | 'my_screen' | 'referrals' | 'performance' | 'support'>('extract');
  const [payouts, setPayouts] = useState<DriverPayoutRecord[]>(INITIAL_DRIVER_PAYOUTS);
  const [referrals, setReferrals] = useState<DriverReferral[]>(INITIAL_REFERRALS);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [pixRequested, setPixRequested] = useState(false);
  const [showPixWithdrawModal, setShowPixWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');

  const currentDriver = drivers.find(d => d.id === selectedDriverId) || drivers[0];
  const driverDevice = devices.find(dev => dev.driverId === currentDriver.id) || devices[0];

  const driverReferrals = referrals.filter(r => r.referrerDriverId === currentDriver.id);
  const driverPayouts = payouts.filter(p => p.driverId === currentDriver.id);

  // Referral link for WhatsApp
  const referralLink = `https://velomedia.com.br/motorista?ref=${currentDriver.referralCode}`;
  const whatsappShareText = encodeURIComponent(
    `Fala parceiro! Instalei a tela da VeloMedia no meu carro (${currentDriver.carModel}) e estou faturando mais de R$ 1.800/mês com repasse via PIX automático enquanto dirijo. Use meu código ${currentDriver.referralCode} para cadastrar seu carro ou tablet: ${referralLink}`
  );

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    confetti({ particleCount: 40, spread: 60 });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(currentDriver.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleRequestInstantPix = () => {
    const val = parseFloat(withdrawAmount) || currentDriver.monthlyEarnings;
    if (val <= 0) return;

    const newPayout: DriverPayoutRecord = {
      id: `pay_${Date.now()}`,
      driverId: currentDriver.id,
      date: new Date().toISOString().split('T')[0],
      amount: val,
      type: 'instant_pix',
      status: 'paid',
      pixKey: currentDriver.pixKey,
      transactionCode: `E00416999${Date.now().toString().slice(-14)}`,
      description: `Saque Imediato PIX solicitado pelo motorista`
    };

    setPayouts([newPayout, ...payouts]);
    setShowPixWithdrawModal(false);
    setPixRequested(true);
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    setTimeout(() => setPixRequested(false), 5000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn text-slate-100">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & DRIVER SELECTOR (SIMULATION SWITCHER)                    */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Driver Profile Info */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img 
              src={currentDriver.avatar} 
              alt={currentDriver.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md" 
            />
            <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black tracking-tight border border-slate-900">
              ATIVO
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                {currentDriver.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold">
                {currentDriver.serviceType}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1 flex-wrap gap-y-1">
              <span className="font-mono text-cyan-300 font-bold">{currentDriver.carPlate}</span>
              <span>•</span>
              <span>{currentDriver.carModel}</span>
              <span>•</span>
              <span className="text-amber-300 font-bold">★ {currentDriver.rating.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Driver Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Driver Switcher */}
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              Simular Motorista Logado:
            </label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
            >
              {drivers.map((drv) => (
                <option key={drv.id} value={drv.id}>
                  {drv.name} ({drv.carPlate} - {drv.contractType === 'byod_driver_equipment' ? 'BYOD 45%' : 'Comodato 20%'})
                </option>
              ))}
            </select>
          </div>

          {/* Quick PWA Tablet Launch Button */}
          <button
            onClick={() => onOpenPlayer(driverDevice.id)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-xl font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition transform active:scale-95 whitespace-nowrap self-end sm:self-auto"
          >
            <Tv className="w-4 h-4 text-slate-950" />
            <span>Abrir Minha Tela TV</span>
          </button>
        </div>

      </div>

      {/* Success Notification Alert if PIX Requested */}
      {pixRequested && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-300 flex items-center justify-between shadow-xl animate-bounce">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-bold block text-sm">Saque PIX Instantâneo Realizado com Sucesso!</span>
              <span className="text-xs text-emerald-400/90">O valor foi creditado em sua chave PIX: {currentDriver.pixKey}</span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30">
            COMPROVANTE GERADO
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STATS CARDS & EARNINGS OVERVIEW                                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Ganhos do Mês */}
        <div className="bg-slate-900/90 border border-emerald-500/30 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ganhos Acumulados (Mês)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            R$ {currentDriver.monthlyEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Repasse via PIX quinzenal</span>
            <button
              onClick={() => {
                setWithdrawAmount(currentDriver.monthlyEarnings.toString());
                setShowPixWithdrawModal(true);
              }}
              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center space-x-1"
            >
              <span>Sacar Agora</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Status da Tela & Uptime */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uptime da Tela</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-cyan-400">
              {currentDriver.screenUptimeRating.toFixed(1)}%
            </span>
            <span className="text-xs text-emerald-400 font-bold">Meta: 90%+</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Hoje: <strong>{driverDevice.telemetry.screenUptimeTodayHours.toFixed(1)}h ligada</strong></span>
            <span className="text-emerald-400 font-mono font-bold">● ONLINE 4G</span>
          </div>
        </div>

        {/* Card 3: Bônus de Indicação Recorrente */}
        <div className="bg-slate-900/90 border border-purple-500/30 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Indicações Recorrentes</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300">
            R$ {(currentDriver.referralRecurringBonusMonthly || 0).toFixed(2)}
            <span className="text-xs font-normal text-slate-400"> /mês</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>{currentDriver.referralsCount || 0} motoristas ativos</span>
            <span className="text-purple-400 font-bold">R$ 50/mês por carro</span>
          </div>
        </div>

        {/* Card 4: Modalidade de Contrato */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plano de Repasse</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {currentDriver.contractType === 'byod_driver_equipment' ? 'BYOD (45% Share)' : 'Comodato (20% Share)'}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate max-w-[170px]">{currentDriver.deviceModelOwned || 'Tela Homologada'}</span>
            <span className="text-cyan-400 font-bold">Ver Contrato</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. SUB-NAVIGATION TABS FOR DRIVER PORTAL                                  */}
      {/* ========================================================================= */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('extract')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'extract'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Extrato Financeiro & PIX</span>
        </button>

        <button
          onClick={() => setActiveTab('my_screen')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'my_screen'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Minha Tela & Telemetria</span>
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'referrals'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Indique & Ganhe (R$ 50/mês)</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'performance'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Desempenho & Anúncios Exibidos</span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'support'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Suporte & Suprimentos</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB CONTENT: EXTRATO FINANCEIRO & REPASSES PIX                         */}
      {/* ========================================================================= */}
      {activeTab === 'extract' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Summary Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span>Conta & Dados de Pagamento PIX</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Os repasses são feitos automaticamente a cada 15 dias na chave PIX cadastrada.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setWithdrawAmount(currentDriver.monthlyEarnings.toString());
                    setShowPixWithdrawModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5"
                >
                  <Zap className="w-4 h-4" />
                  <span>Antecipar Saque PIX</span>
                </button>
              </div>
            </div>

            {/* Pix Key Badge */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Chave PIX Titular:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono font-bold text-emerald-400">{currentDriver.pixKey}</span>
                  <button
                    onClick={handleCopyPixKey}
                    className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                    title="Copiar Chave PIX"
                  >
                    {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="text-right text-xs text-slate-400">
                <span>Banco Parceiro: <strong>Banco Inter / Nubank PJ</strong></span>
                <span className="block text-[11px] text-emerald-400">● Chave Validada no Banco Central</span>
              </div>
            </div>
          </div>

          {/* Statement History List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Histórico de Repasses & Comprovantes Bancários</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Tipo / Descrição</th>
                    <th className="pb-3">Autenticação PIX</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Valor Repassado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {driverPayouts.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 font-mono text-slate-300">
                        {pay.date}
                      </td>
                      <td className="py-3.5 font-medium text-white">
                        <div className="flex items-center space-x-2">
                          {pay.type === 'referral_bonus' ? (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                              Indicação
                            </span>
                          ) : pay.type === 'instant_pix' ? (
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                              Saque Instantâneo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              Anúncios
                            </span>
                          )}
                          <span>{pay.description}</span>
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-[11px] text-slate-400">
                        {pay.transactionCode}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center space-x-1 w-max">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>PIX PAGO</span>
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-bold text-emerald-400 text-sm">
                        + R$ {pay.amount.toFixed(2)}
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
      {/* 5. TAB CONTENT: MINHA TELA & TELEMETRIA                                  */}
      {/* ========================================================================= */}
      {activeTab === 'my_screen' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Screen Telemetry Info (7 cols) */}
            <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Dispositivo no Veículo</h3>
                    <span className="text-xs font-mono text-cyan-300">{driverDevice.code} • {driverDevice.model}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>ONLINE</span>
                </span>
              </div>

              {/* Real-time Hardware Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Sinal de Rede:</span>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <Wifi className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">{driverDevice.telemetry.signalStrength}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Bateria / Alimentação:</span>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <BatteryCharging className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">{driverDevice.telemetry.batteryVoltage}V ({driverDevice.telemetry.batteryLevel}%)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Horas Ligada Hoje:</span>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">{driverDevice.telemetry.screenUptimeTodayHours.toFixed(1)} Horas</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Temperatura do Tablet:</span>
                  <span className="text-xs font-bold text-emerald-300">{driverDevice.telemetry.cpuTemp}°C (Normal)</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Senha PIN Kiosk:</span>
                  <span className="text-xs font-mono font-bold text-purple-300">8822</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Modo Standalone PWA:</span>
                  <span className="text-xs font-bold text-cyan-400">Ativado v2.9</span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => onOpenPlayer(driverDevice.id)}
                  className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 transition"
                >
                  <Tv className="w-4 h-4" />
                  <span>Abrir Player Kiosk Agora</span>
                </button>

                {onOpenPwaModal && (
                  <button
                    onClick={onOpenPwaModal}
                    className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition"
                  >
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>Instalar PWA no Tablet</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick QR Code for Tablet (5 cols) */}
            <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <QrCode className="w-4 h-4 text-purple-400" />
                <span>QR Code de Pareamento para o Tablet</span>
              </span>

              <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-cyan-500/30">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`${window.location.origin}/?tab=player&kiosk=true&pwa=1&device=${driverDevice.code}`)}`}
                  alt="QR Code Tela"
                  className="w-32 h-32 rounded-lg"
                />
              </div>

              <p className="text-[11px] text-slate-400 max-w-xs">
                Aponte a câmera do tablet para abrir o Player com as suas configurações salvas.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB CONTENT: PROGRAMA INDIQUE E GANHE (RECORRENTE R$ 50/MÊS)          */}
      {/* ========================================================================= */}
      {activeTab === 'referrals' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Referral Hero Banner */}
          <div className="bg-gradient-to-br from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-full text-xs font-bold">
                PROGRAMA MOTORISTA PADRINHO
              </span>
              <span className="text-xs text-slate-400">Ganho Recorrente Mensal</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Ganhe <span className="text-purple-300 font-black">R$ 50,00 por mês</span> para cada amigo motorista que rodar com a tela!
            </h3>
            
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Enquanto os motoristas indicados por você estiverem ativos e com a tela ligada, o bônus cai todo mês direto no seu PIX. Sem limite de indicações!
            </p>

            {/* Share link box */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-purple-500/30 space-y-3">
              <span className="text-xs font-bold text-slate-300">Seu Link Exclusivo de Indicação:</span>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-purple-300 select-all"
                />
                
                <button
                  onClick={handleCopyReferralLink}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow transition"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                </button>

                <a
                  href={`https://wa.me/?text=${whatsappShareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Active Referrals List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Seus Motoristas Indicados ({driverReferrals.length})</span>
              </h4>
              <span className="text-xs text-purple-300 font-bold">
                Total acumulado ganho: R$ {(currentDriver.referralTotalEarnedLifetime || 0).toFixed(2)}
              </span>
            </div>

            {driverReferrals.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                Você ainda não indicou nenhum motorista. Compartilhe seu link pelo WhatsApp acima para começar a ganhar R$ 50/mês por carro!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {driverReferrals.map((ref) => (
                  <div key={ref.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={ref.referredAvatar} 
                        alt={ref.referredDriverName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700" 
                      />
                      <div>
                        <span className="font-bold text-white text-xs block">{ref.referredDriverName}</span>
                        <span className="text-[11px] font-mono text-cyan-300">{ref.referredCarPlate} • {ref.referredServiceType}</span>
                        <span className="text-[10px] text-emerald-400 block">Uptime: {ref.currentMonthUptime}%</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-purple-300 block">+ R$ {ref.monthlyRecurringBonus.toFixed(2)}/mês</span>
                      <span className="text-[10px] text-slate-400">Entrou em {ref.joinDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB CONTENT: DESEMPENHO & ANÚNCIOS EXIBIDOS                             */}
      {/* ========================================================================= */}
      {activeTab === 'performance' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Campanhas e Marcas Exibidas no seu Carro Hoje</span>
            </h4>
            
            <p className="text-xs text-slate-400">
              Cada vez que um anúncio de 15s é exibido para o passageiro, você acumula créditos de repasse financeiro.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {campaigns.slice(0, 6).map((camp) => (
                <div key={camp.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start space-x-3">
                  <img
                    src={camp.logo}
                    alt={camp.advertiser}
                    className="w-10 h-10 rounded-xl object-contain bg-slate-900 p-1 border border-slate-800"
                  />
                  <div className="space-y-1 flex-1 min-w-0">
                    <span className="font-bold text-white text-xs block truncate">{camp.name}</span>
                    <span className="text-[11px] text-slate-400 block truncate">{camp.advertiser}</span>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Duração: 15s</span>
                      <span className="text-emerald-400 font-bold">● Ativa</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TAB CONTENT: SUPORTE & SUPRIMENTOS                                     */}
      {/* ========================================================================= */}
      {activeTab === 'support' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">WhatsApp de Suporte 24h</h4>
              <p className="text-xs text-slate-400">Dúvidas sobre faturamento ou troca de tablet no carro.</p>
              <a
                href="https://wa.me/5511987210012?text=Olá,%20sou%20motorista%20parceiro%20da%20VeloMedia"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
              >
                Abrir WhatsApp
              </a>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Solicitar Suporte de Encosto</h4>
              <p className="text-xs text-slate-400">Receba um novo suporte reforçado anti-vibração para banco.</p>
              <button 
                onClick={() => alert('Solicitação de novo suporte veicular enviada com sucesso para a matriz!')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl border border-cyan-500/30 transition"
              >
                Solicitar Suporte
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Seguro Anti-Furto & Danos</h4>
              <p className="text-xs text-slate-400">Sua tela possui cobertura contra quebra e sinistros.</p>
              <span className="text-[11px] text-purple-300 font-mono block">Apólice nº VELO-491-SP</span>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: ANTECIPAÇÃO / SAQUE PIX IMEDIATO                                */}
      {/* ========================================================================= */}
      {showPixWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Solicitar Saque PIX Imediato</h3>
              </div>
              <button 
                onClick={() => setShowPixWithdrawModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300">Valor para Saque (R$):</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-black text-emerald-400 focus:outline-none focus:border-emerald-500"
                placeholder="0.00"
              />
              <span className="text-[11px] text-slate-400 block">
                Saldo disponível: <strong>R$ {currentDriver.monthlyEarnings.toFixed(2)}</strong>
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
              <span className="text-slate-400 block text-[10px]">Chave PIX de Destino:</span>
              <span className="font-mono font-bold text-emerald-400">{currentDriver.pixKey}</span>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowPixWithdrawModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleRequestInstantPix}
                className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition"
              >
                Confirmar PIX Agora
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
