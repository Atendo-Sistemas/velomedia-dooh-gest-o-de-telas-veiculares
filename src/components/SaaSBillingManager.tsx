import React, { useEffect, useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SaaSPlan, SaaSOrganization, SaaSInvoice, AdvertiserAccount } from '../types';
import { apiClient } from '../services/apiClient';

interface SaaSBillingManagerProps {
  currentOrg: SaaSOrganization;
  onSwitchOrg: (orgId: string) => void;
  organizations: SaaSOrganization[];
  plans: SaaSPlan[];
  advertisers: AdvertiserAccount[];
  onManageClients: () => void;
}

export const SaaSBillingManager: React.FC<SaaSBillingManagerProps> = ({
  currentOrg,
  onSwitchOrg,
  organizations,
  plans,
  advertisers,
  onManageClients,
}) => {
  const [invoices, setInvoices] = useState<SaaSInvoice[]>([]);
  const [advertiserAccounts, setAdvertiserAccounts] = useState(advertisers);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isCreatingPix, setIsCreatingPix] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [showPixModal, setShowPixModal] = useState<SaaSInvoice | null>(null);
  const [isCreatingPlanInvoice, setIsCreatingPlanInvoice] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [advertiserInvoiceError, setAdvertiserInvoiceError] = useState<string | null>(null);
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState(advertisers.find(advertiser => advertiser.status === 'active')?.id || '');
  const [advertiserInvoiceAmount, setAdvertiserInvoiceAmount] = useState('');
  const [isCreatingAdvertiserInvoice, setIsCreatingAdvertiserInvoice] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const activeAdvertisers = advertiserAccounts.filter(advertiser => advertiser.status === 'active');

  const refreshInvoices = async () => {
    setInvoiceError(null);
    try {
      const [result, refreshedAdvertisers] = await Promise.all([
        apiClient.getInvoices(),
        apiClient.getAdvertisers(),
      ]);
      setInvoices(result);
      setAdvertiserAccounts(refreshedAdvertisers);
      setShowPixModal(current => current ? result.find(invoice => invoice.id === current.id) || current : null);
    } catch (error) {
      setInvoiceError(error instanceof Error ? error.message : 'Não foi possível carregar as faturas.');
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  useEffect(() => {
    void refreshInvoices();
  }, []);

  useEffect(() => {
    setAdvertiserAccounts(advertisers);
  }, [advertisers]);

  useEffect(() => {
    const activeAdvertisers = advertiserAccounts.filter(advertiser => advertiser.status === 'active');
    if (!activeAdvertisers.some(advertiser => advertiser.id === selectedAdvertiserId)) {
      setSelectedAdvertiserId(activeAdvertisers[0]?.id || '');
    }
  }, [advertiserAccounts, selectedAdvertiserId]);

  const handleCreateAdvertiserInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAdvertiserId || isCreatingAdvertiserInvoice) return;
    const amount = Number(advertiserInvoiceAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      setAdvertiserInvoiceError('Informe um valor maior que zero e de até R$ 1.000.000,00.');
      return;
    }
    setIsCreatingAdvertiserInvoice(true);
    setAdvertiserInvoiceError(null);
    try {
      const invoice = await apiClient.createAdvertiserInvoice(selectedAdvertiserId, amount);
      setInvoices(current => [invoice, ...current.filter(existing => existing.id !== invoice.id)]);
      setAdvertiserInvoiceAmount('');
      setToastMessage(`Cobrança ${invoice.invoiceNumber} criada para ${invoice.organizationName}.`);
      setTimeout(() => setToastMessage(null), 4500);
    } catch (error) {
      setAdvertiserInvoiceError(error instanceof Error ? error.message : 'Não foi possível criar a cobrança do anunciante.');
    } finally {
      setIsCreatingAdvertiserInvoice(false);
    }
  };

  // Upgrade Plan handler
  const handleUpgradePlan = async (plan: SaaSPlan) => {
    if (isCreatingPlanInvoice) return;
    setIsCreatingPlanInvoice(true);
    setPlanError(null);
    const now = new Date();
    const issueDate = now.toISOString().slice(0, 10);
    const dueDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const id = crypto.randomUUID();
    try {
      const invoice = await apiClient.createInvoice({
        id: `inv_${id}`,
        invoiceNumber: `INV-${issueDate.replaceAll('-', '')}-${id.slice(0, 8).toUpperCase()}`,
        organizationId: currentOrg.id,
        organizationName: currentOrg.name,
        month: issueDate.slice(0, 7),
        issueDate,
        dueDate,
        status: 'pending',
        screensBilled: currentOrg.activeScreensCount,
        paymentMethod: 'pix',
        planTier: plan.id,
      });
      setInvoices(current => [invoice, ...current.filter(existing => existing.id !== invoice.id)]);
      setToastMessage(`Fatura de ${plan.name} criada. O plano será ativado após a confirmação do pagamento.`);
      setTimeout(() => setToastMessage(null), 4500);
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : 'Não foi possível criar a fatura do plano.');
    } finally {
      setIsCreatingPlanInvoice(false);
    }
  };

  const handleGeneratePix = async (invoice: SaaSInvoice) => {
    if (isCreatingPix) return;
    setIsCreatingPix(true);
    setInvoiceError(null);
    try {
      const charge = await apiClient.chargeInvoicePix(invoice.id);
      const updated = {
        ...invoice,
        txid: charge.txid,
        pixQrCode: charge.copiaECola,
        pixQrCodeUrl: charge.qrCodeUrl,
        pixQrCodeExpiresAt: charge.expiresAt,
      };
      setInvoices(current => current.map(item => item.id === updated.id ? updated : item));
      setShowPixModal(updated);
    } catch (error) {
      setInvoiceError(error instanceof Error ? error.message : 'Não foi possível gerar a cobrança PIX.');
    } finally {
      setIsCreatingPix(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2500);
  };

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
          {planError && <div className="md:col-span-3 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-200" role="alert">{planError}</div>}
          {plans.map((plan) => {
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
                    disabled={isCurrent || isCreatingPlanInvoice}
                    onClick={() => void handleUpgradePlan(plan)}
                    className={`w-full py-3 rounded-xl font-bold text-xs transition shadow ${
                      isCurrent || isCreatingPlanInvoice
                        ? 'bg-slate-800 text-slate-400 cursor-default border border-slate-700'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-cyan-500/20'
                    }`}
                  >
                    {isCurrent ? 'Plano Ativo na Frota' : isCreatingPlanInvoice ? 'Criando fatura…' : `Contratar ${plan.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Registered advertiser clients, persisted through the registration center */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Clientes anunciantes</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Os cadastros são compartilhados com a central de registros e persistidos por organização.
            </p>
          </div>

          <button
            onClick={onManageClients}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Gerenciar clientes</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {advertiserAccounts.map(advertiser => (
            <article key={advertiser.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{advertiser.companyName}</h3>
                  <p className="mt-1 text-[11px] text-slate-400">{advertiser.contactName} · {advertiser.email}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] ${
                  advertiser.status === 'active'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : advertiser.status === 'blocked'
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                }`}>
                  {advertiser.status === 'active' ? 'Ativo' : advertiser.status === 'blocked' ? 'Bloqueado' : 'Aguardando validação'}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-400">{advertiser.activeCampaignsCount} campanhas · Saldo R$ {advertiser.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="mt-1 text-xs text-emerald-300">Crédito pré-pago: R$ {(advertiser.prepaidBalance ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="mt-2 font-mono text-[10px] text-indigo-300">Portal: {advertiser.portalAccessCode}</p>
            </article>
          ))}
          {advertiserAccounts.length === 0 && <p className="text-xs text-slate-400">Nenhum cliente cadastrado para esta organização.</p>}
        </div>
      </div>

      <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white">Cobranças de anunciantes</h2>
          <p className="mt-1 text-xs text-slate-400">Emita uma cobrança PIX via Asaas. O crédito só é liberado após a confirmação do pagamento.</p>
        </div>
        {advertiserInvoiceError && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-200">{advertiserInvoiceError}</p>}
        <form onSubmit={handleCreateAdvertiserInvoice} className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="text-xs font-semibold text-slate-300">
            Anunciante
            <select required value={selectedAdvertiserId} onChange={event => setSelectedAdvertiserId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white">
              <option value="" disabled>Selecione um anunciante</option>
              {activeAdvertisers.map(advertiser => <option key={advertiser.id} value={advertiser.id}>{advertiser.companyName}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-300">
            Valor da recarga (R$)
            <input required type="number" min="0.01" max="1000000" step="0.01" value={advertiserInvoiceAmount} onChange={event => setAdvertiserInvoiceAmount(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" />
          </label>
          <button disabled={!selectedAdvertiserId || isCreatingAdvertiserInvoice} type="submit" className="self-end rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50">
            {isCreatingAdvertiserInvoice ? 'Criando…' : 'Criar cobrança PIX'}
          </button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-slate-800 text-[10px] uppercase text-slate-400"><tr><th className="px-3 py-3">Fatura</th><th className="px-3 py-3">Anunciante</th><th className="px-3 py-3">Vencimento</th><th className="px-3 py-3">Valor</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Ação</th></tr></thead>
            <tbody className="divide-y divide-slate-800/70">
              {invoices.filter(invoice => Boolean(invoice.advertiserId)).map(invoice => {
                const advertiser = advertiserAccounts.find(item => item.id === invoice.advertiserId);
                return <tr key={invoice.id}>
                  <td className="px-3 py-3 font-mono text-white">{invoice.invoiceNumber}</td>
                  <td className="px-3 py-3 text-slate-300">{advertiser?.companyName || invoice.organizationName || invoice.advertiserId}</td>
                  <td className="px-3 py-3 text-slate-300">{invoice.dueDate}</td>
                  <td className="px-3 py-3 font-mono text-emerald-300">R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-3 py-3 text-slate-300">{invoice.status === 'paid' ? 'Paga' : invoice.status === 'overdue' ? 'Vencida' : 'Pendente'}</td>
                  <td className="px-3 py-3 text-right">{invoice.status === 'paid' ? <span className="text-emerald-300">Crédito confirmado</span> : <button onClick={() => setShowPixModal(invoice)} className="rounded-lg bg-emerald-700 px-3 py-1.5 font-bold text-white hover:bg-emerald-600">{invoice.txid ? 'Ver PIX' : 'Gerar PIX'}</button>}</td>
                </tr>;
              })}
              {!isLoadingInvoices && invoices.filter(invoice => invoice.advertiserId).length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">Nenhuma cobrança de anunciante cadastrada.</td></tr>}
              {isLoadingInvoices && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">Carregando cobranças…</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* SaaS Invoices & Financial History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Faturas da Licença SaaS</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">Cobranças via PIX (Asaas)</span>
            <button
              onClick={() => void refreshInvoices()}
              disabled={isLoadingInvoices}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-semibold"
            >
              Atualizar
            </button>
          </div>
        </div>

        {invoiceError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-200" role="alert">
            {invoiceError}
          </div>
        )}

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
              {invoices.filter(invoice => !invoice.advertiserId).map((inv) => (
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
                    ) : inv.status === 'overdue' ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <AlertCircle className="w-3 h-3" />
                        <span>VENCIDO</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3 h-3" />
                        <span>PENDENTE</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {inv.status !== 'paid' ? (
                      <button
                        onClick={() => setShowPixModal(inv)}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs shadow-md transition"
                      >
                        {inv.txid ? 'Ver PIX' : 'Gerar PIX'}
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-300">Pago confirmado</span>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoadingInvoices && invoices.every(invoice => invoice.advertiserId) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">Nenhuma fatura cadastrada para esta organização.</td>
                </tr>
              )}
              {isLoadingInvoices && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">Carregando faturas…</td>
                </tr>
              )}
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
                Fatura {showPixModal.invoiceNumber} • {showPixModal.advertiserId ? advertiserAccounts.find(advertiser => advertiser.id === showPixModal.advertiserId)?.companyName || 'Anunciante' : `${showPixModal.screensBilled} telas veiculares`}
                {showPixModal.planTier && ` • ${plans.find(plan => plan.id === showPixModal.planTier)?.name || showPixModal.planTier}`}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl mx-auto inline-block shadow">
              {showPixModal.pixQrCodeUrl?.startsWith('data:image/png;base64,') ? (
                <img src={showPixModal.pixQrCodeUrl} alt="QR Code de pagamento PIX Asaas" className="w-40 h-40" />
              ) : (
                <div className="w-40 h-40 bg-slate-950 p-2 rounded-xl flex items-center justify-center text-center">
                  <span className="text-xs text-slate-400">Gere a cobrança para obter o QR Code PIX.</span>
                </div>
              )}
            </div>

            <div className="text-xl font-black text-emerald-400 font-mono">
              R$ {showPixModal.amount.toFixed(2)}
            </div>

            {showPixModal.status === 'paid' && (
              <p className="text-sm font-semibold text-emerald-300">Pagamento confirmado pelo Asaas.</p>
            )}
            {invoiceError && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-950/40 p-2 text-xs text-rose-200" role="alert">
                {invoiceError}
              </p>
            )}

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-left space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">Código PIX Copia e Cola:</span>
              <div className="font-mono text-[11px] text-slate-300 break-all select-all">
                {showPixModal.pixQrCode || 'O código será exibido após a criação da cobrança.'}
              </div>
              {showPixModal.pixQrCodeExpiresAt && (
                <span className="block text-[10px] text-slate-400">
                  Expira em {new Date(showPixModal.pixQrCodeExpiresAt).toLocaleString('pt-BR')}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowPixModal(null)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Fechar
              </button>
              <button
                onClick={() => showPixModal.status === 'paid'
                  ? setShowPixModal(null)
                  : showPixModal.txid
                  ? void refreshInvoices()
                  : void handleGeneratePix(showPixModal)}
                disabled={isCreatingPix || isLoadingInvoices}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md"
              >
                {isCreatingPix ? 'Gerando cobrança…' : showPixModal.status === 'paid' ? 'Concluir' : showPixModal.txid ? 'Verificar pagamento' : 'Gerar cobrança PIX'}
              </button>
            </div>
            {showPixModal.pixQrCode && (
              <button
                onClick={() => copyToClipboard(showPixModal.pixQrCode!, 'pix')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedCode === 'pix' ? 'Código copiado' : 'Copiar código PIX'}
              </button>
            )}
            <p className="text-[11px] text-slate-400">
              A fatura só muda para paga após a confirmação enviada pelo Asaas.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
