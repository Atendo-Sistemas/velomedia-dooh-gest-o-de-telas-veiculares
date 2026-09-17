import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  QrCode, 
  FileText, 
  Plus, 
  ExternalLink, 
  DollarSign, 
  Tv, 
  Users, 
  Layers, 
  Check, 
  Clock, 
  Copy,
  Receipt,
  Download,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SaaSPlan, SaaSOrganization, SaaSInvoice, AdvertiserClientPortal, SaaSPlanTier } from '../types';
import { SAAS_PLANS, INITIAL_ORGANIZATIONS, INITIAL_INVOICES, INITIAL_ADVERTISER_PORTALS } from '../data/mockData';

interface SaaSBillingManagerProps {
  currentOrg: SaaSOrganization;
  onUpdateOrg: (updatedOrg: SaaSOrganization) => void;
  onSwitchOrg: (orgId: string) => void;
  organizations: SaaSOrganization[];
}

export const SaaSBillingManager: React.FC<SaaSBillingManagerProps> = ({
  currentOrg,
  onUpdateOrg,
  onSwitchOrg,
  organizations,
}) => {
  const [invoices, setInvoices] = useState<SaaSInvoice[]>(INITIAL_INVOICES);
  const [advertisers, setAdvertisers] = useState<AdvertiserClientPortal[]>(INITIAL_ADVERTISER_PORTALS);
  const [selectedPlanTier, setSelectedPlanTier] = useState<SaaSPlanTier>(currentOrg.planTier);
  const [showPixModal, setShowPixModal] = useState<SaaSInvoice | null>(null);
  const [showNewAdvertiserModal, setShowNewAdvertiserModal] = useState(false);
  const [newAdvName, setNewAdvName] = useState('');
  const [newAdvContact, setNewAdvContact] = useState('');
  const [newAdvEmail, setNewAdvEmail] = useState('');
  const [newAdvBudget, setNewAdvBudget] = useState(5000);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Upgrade Plan handler
  const handleUpgradePlan = (plan: SaaSPlan) => {
    setSelectedPlanTier(plan.id);
    const updated: SaaSOrganization = {
      ...currentOrg,
      planTier: plan.id,
      maxScreensLimit: plan.maxScreens,
      monthlySoftwareCost: plan.baseMonthlyFee + (currentOrg.activeScreensCount * plan.pricePerScreenMonth),
      netProfit: currentOrg.estimatedGrossAdRevenue - currentOrg.driverPayoutTotal - (plan.baseMonthlyFee + (currentOrg.activeScreensCount * plan.pricePerScreenMonth)),
    };
    onUpdateOrg(updated);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    setToastMessage(`Plano da organização alterado para ${plan.name}!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Pay invoice via PIX
  const handlePayInvoice = (inv: SaaSInvoice) => {
    setInvoices(invoices.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i));
    setShowPixModal(null);
    confetti({ particleCount: 60, spread: 80 });
    setToastMessage(`Fatura ${inv.invoiceNumber} quitada com sucesso via PIX!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add new advertiser portal
  const handleCreateAdvertiser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvName || !newAdvEmail) return;

    const newAdv: AdvertiserClientPortal = {
      id: `adv_${Date.now()}`,
      companyName: newAdvName,
      contactName: newAdvContact || 'Responsável de Mídia',
      email: newAdvEmail,
      activeCampaignsCount: 1,
      totalBudgetManaged: Number(newAdvBudget),
      totalImpressionsDelivered: 0,
      portalAccessCode: `${newAdvName.slice(0, 4).toUpperCase()}-DOOH-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'active',
    };

    setAdvertisers([newAdv, ...advertisers]);
    setShowNewAdvertiserModal(false);
    setNewAdvName('');
    setNewAdvContact('');
    setNewAdvEmail('');
    confetti({ particleCount: 40 });
    setToastMessage(`Acesso do anunciante ${newAdv.companyName} criado!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const currentPlan = SAAS_PLANS.find(p => p.id === currentOrg.planTier) || SAAS_PLANS[1];
  const screenUsagePercent = Math.min(100, Math.round((currentOrg.activeScreensCount / currentOrg.maxScreensLimit) * 100));

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* SaaS Organization & Subscription Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-transparent rounded-full blur-3xl -z-0" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">{currentOrg.name}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                SaaS Multi-Tenant Ativo
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-slate-800 text-slate-300">
                CNPJ: {currentOrg.cnpj}
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              Gerencie a assinatura da sua rede de telas veiculares, faturas mensais, limites contratados e o portal white-label para seus clientes anunciantes.
            </p>
          </div>

          {/* Organization Switcher Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Workspace / Franquia Atual</span>
              <select
                value={currentOrg.id}
                onChange={(e) => onSwitchOrg(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs font-semibold text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-cyan-400 outline-none"
              >
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.activeScreensCount} telas)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tenant Metrics Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Capacidade de Telas</span>
              <Tv className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">{currentOrg.activeScreensCount}</span>
              <span className="text-xs text-slate-400 font-medium">/ {currentOrg.maxScreensLimit} contratadas</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${screenUsagePercent}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Custo Mensal do SaaS</span>
              <CreditCard className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-indigo-300 font-mono">
              R$ {currentOrg.monthlySoftwareCost.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Próx. vencimento: {currentOrg.nextBillingDate}
            </span>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Receita Bruta com Anúncios</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-400 font-mono">
              R$ {currentOrg.estimatedGrossAdRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-emerald-500/90 font-medium mt-1 block">
              Faturado com 3 marcas ativas
            </span>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Lucro Líquido da Franquia</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white font-mono">
              R$ {currentOrg.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Após SaaS + Repasse Motoristas (30%)
            </span>
          </div>
        </div>

      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold text-sm">{toastMessage}</span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-900/60 px-2.5 py-1 rounded-md font-bold">SUCESSO</span>
        </div>
      )}

      {/* SaaS Plans Pricing Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Planos de Assinatura da Plataforma SaaS</h2>
            <p className="text-xs text-slate-400">
              Escolha a escala ideal para sua frota. Cancele ou altere a qualquer momento sem fidelidade.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Cobrança por TV Veicular Ativa</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SAAS_PLANS.map((plan) => {
            const isCurrent = currentOrg.planTier === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                  isCurrent 
                    ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-cyan-500 shadow-2xl shadow-cyan-500/10' 
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-full text-[10px] font-black text-slate-950 uppercase tracking-wider shadow-md">
                    Mais Popular no Brasil
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    {isCurrent && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        PLANO ATUAL
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-3xl font-black text-white font-mono">
                        R$ {plan.pricePerScreenMonth.toFixed(0)}
                      </span>
                      <span className="text-xs text-slate-400">/tela/mês</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      + taxa base de R$ {plan.baseMonthlyFee.toFixed(0)}/mês
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-2.5">
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Recursos Inclusos:</span>
                    <ul className="space-y-2">
                      {plan.features.map((f, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800">
                  <button
                    disabled={isCurrent}
                    onClick={() => handleUpgradePlan(plan)}
                    className={`w-full py-3 rounded-xl font-bold text-xs transition shadow ${
                      isCurrent
                        ? 'bg-slate-800 text-slate-400 cursor-default border border-slate-700'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-cyan-500/20'
                    }`}
                  >
                    {isCurrent ? 'Plano Ativo na Frota' : `Mudar para ${plan.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advertiser Client Portal & White-Label Access Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Portal do Anunciante White-Label</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Permita que seus clientes acompanhem as veiculações de suas campanhas e relatórios de Proof-of-Play com link exclusivo.
            </p>
          </div>

          <button
            onClick={() => setShowNewAdvertiserModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Convidar Novo Anunciante</span>
          </button>
        </div>

        {/* Advertisers List Table */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {advertisers.map((adv) => (
            <div key={adv.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{adv.companyName}</h3>
                  <span className="text-[11px] text-slate-400">{adv.contactName}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {adv.status === 'active' ? 'Ativo' : 'Pendente'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-400">Campanhas na Frota:</span>
                  <span className="font-bold text-white">{adv.activeCampaignsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Verba sob Gestão:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    R$ {adv.totalBudgetManaged.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Impactos Entregues:</span>
                  <span className="font-bold text-cyan-300 font-mono">
                    {adv.totalImpressionsDelivered.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Portal Access Link / Token Box */}
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Código do Portal</span>
                  <span className="font-mono font-bold text-indigo-300 text-[11px]">{adv.portalAccessCode}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(`https://ais-dev.run.app/portal?code=${adv.portalAccessCode}`, adv.id)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold flex items-center space-x-1"
                  title="Copiar Link Seguro do Anunciante"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedCode === adv.id ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SaaS Invoices & Financial History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Faturas da Licença SaaS</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Pagamentos via PIX ou Cartão de Crédito
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Fatura</th>
                <th className="py-3 px-4">Data Emissão</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4">Telas Faturadas</th>
                <th className="py-3 px-4">Valor Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                  <td className="py-3.5 px-4 text-slate-300">{inv.issueDate}</td>
                  <td className="py-3.5 px-4 text-slate-300">{inv.dueDate}</td>
                  <td className="py-3.5 px-4 text-slate-300">{inv.screensBilled} telas</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    R$ {inv.amount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4">
                    {inv.status === 'paid' ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>PAGO</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3 h-3" />
                        <span>PENDENTE</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {inv.status === 'pending' ? (
                      <button
                        onClick={() => setShowPixModal(inv)}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs shadow-md transition"
                      >
                        Pagar via PIX
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setToastMessage(`Recibo da fatura ${inv.invoiceNumber} baixado com sucesso!`);
                          setTimeout(() => setToastMessage(null), 3000);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1 ml-auto"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Recibo PDF</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Pay SaaS Invoice with PIX */}
      {showPixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl relative text-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">Pagamento Instantâneo via PIX</h2>
              <p className="text-xs text-slate-400 mt-1">
                Fatura {showPixModal.invoiceNumber} • {showPixModal.screensBilled} telas veiculares
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl mx-auto inline-block shadow">
              <div className="w-40 h-40 bg-slate-950 p-2 rounded-xl flex items-center justify-center flex-col space-y-1">
                <QrCode className="w-28 h-28 text-emerald-400" />
                <span className="text-[9px] text-slate-400 font-mono">BANCO CENTRAL PIX</span>
              </div>
            </div>

            <div className="text-xl font-black text-emerald-400 font-mono">
              R$ {showPixModal.amount.toFixed(2)}
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-left space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">Código PIX Copia e Cola:</span>
              <div className="font-mono text-[11px] text-slate-300 truncate select-all">
                00020126580014br.gov.bcb.pix0136velomedia-faturamento-saas-2026-sp
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowPixModal(null)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => handlePayInvoice(showPixModal)}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Confirmar Pagamento PIX
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Invite New Advertiser */}
      {showNewAdvertiserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative text-slate-200">
            <h2 className="text-lg font-bold text-white">Cadastrar Anunciante no Portal White-Label</h2>
            <p className="text-xs text-slate-400">
              Gere um link seguro com login tokenizado para o cliente acompanhar impressões e campanhas em tempo real.
            </p>

            <form onSubmit={handleCreateAdvertiser} className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Empresa / Marca:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: McDonald's, Coca-Cola, Localiza"
                  value={newAdvName}
                  onChange={(e) => setNewAdvName(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome do Contato:</label>
                  <input
                    type="text"
                    placeholder="Ex: Mariana Silva"
                    value={newAdvContact}
                    onChange={(e) => setNewAdvContact(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">E-mail do Responsável:</label>
                  <input
                    type="email"
                    required
                    placeholder="midia@empresa.com.br"
                    value={newAdvEmail}
                    onChange={(e) => setNewAdvEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Verba Contratada Estimada (R$):</label>
                <input
                  type="number"
                  value={newAdvBudget}
                  onChange={(e) => setNewAdvBudget(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewAdvertiserModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md"
                >
                  Criar Acesso Anunciante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
