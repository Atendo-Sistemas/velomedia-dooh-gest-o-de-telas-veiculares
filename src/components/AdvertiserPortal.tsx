import React, { useCallback, useEffect, useState } from 'react';
import { LogOut, RefreshCw, Wallet, ReceiptText, Megaphone, Copy, QrCode } from 'lucide-react';
import type { AdvertiserAccount, Campaign, ProofOfPlayLog, SaaSInvoice } from '../types';
import { apiClient } from '../services/apiClient';

interface AdvertiserPortalProps {
  onLogout: () => void;
}

export const AdvertiserPortal: React.FC<AdvertiserPortalProps> = ({ onLogout }) => {
  const [advertiser, setAdvertiser] = useState<AdvertiserAccount | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [proofOfPlay, setProofOfPlay] = useState<ProofOfPlayLog[]>([]);
  const [invoices, setInvoices] = useState<SaaSInvoice[]>([]);
  const [amount, setAmount] = useState('500');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.getAdvertiserPortal();
      setAdvertiser(data.advertiser);
      setCampaigns(data.campaigns);
      setProofOfPlay(data.proofOfPlay);
      setInvoices(data.invoices);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o portal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const createRecharge = async () => {
    const rechargeAmount = Number(amount.replace(',', '.'));
    if (!Number.isFinite(rechargeAmount) || rechargeAmount < 5 || rechargeAmount > 100000) {
      setError('Informe um valor entre R$ 5,00 e R$ 100.000,00.');
      return;
    }
    setWorking(true);
    setError('');
    setNotice('');
    try {
      const invoice = await apiClient.createAdvertiserPortalInvoice(rechargeAmount);
      setInvoices(current => [invoice, ...current.filter(existing => existing.id !== invoice.id)]);
      setNotice('Cobrança criada. Gere o PIX para concluir o pagamento.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar a cobrança.');
    } finally {
      setWorking(false);
    }
  };

  const generatePix = async (invoiceId: string) => {
    setWorking(true);
    setError('');
    setNotice('');
    try {
      await apiClient.chargeAdvertiserPortalInvoice(invoiceId);
      await refresh();
      setNotice('PIX gerado. O pagamento será confirmado após a notificação do provedor.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível gerar o PIX.');
    } finally {
      setWorking(false);
    }
  };

  const copyPix = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setNotice('Código PIX copiado.');
    } catch {
      setError('Não foi possível copiar o código PIX neste navegador.');
    }
  };

  const prepaidBalance = advertiser?.prepaidBalance ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">VeloMedia</p>
            <h1 className="mt-1 text-xl font-bold">Portal do anunciante</h1>
            {advertiser && <p className="text-sm text-slate-400">{advertiser.companyName}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void refresh()} disabled={loading} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800" aria-label="Atualizar">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onLogout} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
        {notice && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-200">{notice}</p>}
        {loading && !advertiser ? (
          <div className="py-20 text-center text-slate-400">Carregando seus dados...</div>
        ) : advertiser && (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center gap-2 text-sm text-slate-400"><Wallet size={17} /> Saldo pré-pago</div>
                <p className="mt-3 text-2xl font-bold text-emerald-300">{prepaidBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </article>
              <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center gap-2 text-sm text-slate-400"><Megaphone size={17} /> Campanhas</div>
                <p className="mt-3 text-2xl font-bold">{campaigns.length}</p>
                <p className="text-xs text-slate-500">{campaigns.filter(campaign => campaign.status === 'active').length} ativas</p>
              </article>
              <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center gap-2 text-sm text-slate-400"><ReceiptText size={17} /> Impressões verificadas</div>
                <p className="mt-3 text-2xl font-bold">{proofOfPlay.length.toLocaleString('pt-BR')}</p>
              </article>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="font-semibold">Adicionar saldo por PIX</h2>
              <p className="mt-1 text-sm text-slate-400">A cobrança ficará pendente até a confirmação do pagamento pelo provedor.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <label className="flex-1">
                  <span className="mb-1 block text-xs text-slate-400">Valor da recarga (R$)</span>
                  <input type="number" min="5" max="100000" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
                </label>
                <button onClick={() => void createRecharge()} disabled={working} className="self-end rounded-lg bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
                  Criar cobrança
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="mb-4 font-semibold">Cobranças</h2>
              {invoices.length === 0 ? <p className="text-sm text-slate-400">Você ainda não possui cobranças.</p> : (
                <div className="space-y-3">
                  {invoices.map(invoice => (
                    <article key={invoice.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="mt-1 text-xs text-slate-500">Vencimento: {new Date(`${invoice.dueDate}T12:00:00`).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{invoice.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                          <p className={`mt-1 text-xs ${invoice.status === 'paid' ? 'text-emerald-300' : invoice.status === 'overdue' ? 'text-rose-300' : 'text-amber-300'}`}>
                            {invoice.status === 'paid' ? 'Pago confirmado' : invoice.status === 'overdue' ? 'Vencida' : 'Pendente'}
                          </p>
                        </div>
                      </div>
                      {invoice.status !== 'paid' && (
                        <div className="mt-4 space-y-3">
                          {invoice.pixQrCode && (
                            <div className="flex flex-col gap-3 rounded-lg border border-slate-800 p-3 sm:flex-row sm:items-center">
                              {invoice.pixQrCodeUrl && <img src={invoice.pixQrCodeUrl} alt="QR code PIX" className="h-28 w-28 rounded bg-white p-1" />}
                              <div className="min-w-0 flex-1">
                                <p className="mb-1 text-xs text-slate-400">PIX copia e cola</p>
                                <p className="break-all text-xs text-slate-300">{invoice.pixQrCode}</p>
                                <button onClick={() => void copyPix(invoice.pixQrCode!)} className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 hover:text-cyan-200"><Copy size={14} /> Copiar código</button>
                              </div>
                            </div>
                          )}
                          {!invoice.pixQrCode && (
                            <button onClick={() => void generatePix(invoice.id)} disabled={working} className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 px-3 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-50">
                              <QrCode size={16} /> Gerar PIX
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="mb-4 font-semibold">Campanhas vinculadas</h2>
              {campaigns.length === 0 ? <p className="text-sm text-slate-400">Nenhuma campanha está vinculada a esta conta.</p> : (
                <div className="divide-y divide-slate-800">
                  {campaigns.map(campaign => (
                    <div key={campaign.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-xs text-slate-500">{campaign.totalImpressions.toLocaleString('pt-BR')} impressões · Orçamento {campaign.budgetTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs ${campaign.status === 'active' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                        {campaign.status === 'active' ? 'Ativa' : campaign.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};
