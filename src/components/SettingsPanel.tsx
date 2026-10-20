import React, { useEffect, useState } from 'react';
import { apiClient, SystemSettingsView } from '../services/apiClient';

export const SettingsPanel: React.FC = () => {
  const [view, setView] = useState<SystemSettingsView | null>(null);
  const [provider, setProvider] = useState<'' | 'asaas'>('');
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [mapboxToken, setMapboxToken] = useState('');
  const [asaasApiKey, setAsaasApiKey] = useState('');
  const [asaasWebhookToken, setAsaasWebhookToken] = useState('');
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const apply = (v: SystemSettingsView) => {
    setView(v);
    setProvider(v.pixGatewayProvider);
    setEnvironment(v.asaasEnvironment);
    setMapboxToken(v.mapboxAccessToken);
    setAsaasApiKey('');
    setAsaasWebhookToken('');
  };

  useEffect(() => {
    apiClient.getSettings().then(apply).catch(e => setMessage({ type: 'error', text: e.message }));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const patch: Parameters<typeof apiClient.updateSettings>[0] = {
        pixGatewayProvider: provider,
        asaasEnvironment: environment,
        mapboxAccessToken: mapboxToken,
      };
      // Segredos só são enviados quando preenchidos; vazio mantém o valor atual.
      if (asaasApiKey) patch.asaasApiKey = asaasApiKey;
      if (asaasWebhookToken) patch.asaasWebhookToken = asaasWebhookToken;
      apply(await apiClient.updateSettings(patch));
      setMessage({ type: 'ok', text: 'Configurações salvas com sucesso.' });
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono';
  const label = 'block text-xs font-semibold text-slate-300 mb-1';

  return (
    <form onSubmit={save} className="max-w-2xl space-y-6 text-slate-200">
      <div>
        <h1 className="text-xl font-bold text-white">Configurações &amp; Integrações</h1>
        <p className="text-sm text-slate-400">
          APIs e tokens são configurados aqui, após a instalação. Chaves já salvas aparecem mascaradas; deixe em branco para mantê-las.
        </p>
      </div>

      <section className="space-y-3 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <h2 className="font-bold text-white">Pagamentos PIX (Asaas)</h2>
        <div>
          <label className={label} htmlFor="provider">Provedor</label>
          <select id="provider" className={input} value={provider} onChange={e => setProvider(e.target.value as '' | 'asaas')}>
            <option value="">Não configurado</option>
            <option value="asaas">Asaas</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="env">Ambiente</label>
          <select id="env" className={input} value={environment} onChange={e => setEnvironment(e.target.value as 'sandbox' | 'production')}>
            <option value="sandbox">Sandbox (testes)</option>
            <option value="production">Produção</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="apikey">Chave de API {view?.asaasApiKeyConfigured && `(atual: ${view.asaasApiKeyMasked})`}</label>
          <input id="apikey" type="password" autoComplete="off" className={input} value={asaasApiKey} onChange={e => setAsaasApiKey(e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="whtoken">Token do webhook (32 a 255 caracteres) {view?.asaasWebhookTokenConfigured && `(atual: ${view.asaasWebhookTokenMasked})`}</label>
          <input id="whtoken" type="password" autoComplete="off" className={input} value={asaasWebhookToken} onChange={e => setAsaasWebhookToken(e.target.value)} />
          <p className="text-[11px] text-slate-500 mt-1">
            Cadastre no painel Asaas a URL <code>{window.location.origin}/api/v1/webhooks/asaas</code> com o mesmo token.
          </p>
        </div>
      </section>

      <section className="space-y-3 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <h2 className="font-bold text-white">Mapbox</h2>
        <div>
          <label className={label} htmlFor="mapbox">Access Token público</label>
          <input id="mapbox" className={input} value={mapboxToken} onChange={e => setMapboxToken(e.target.value)} placeholder="pk.eyJ..." />
        </div>
      </section>

      {message && (
        <p role="status" className={message.type === 'ok' ? 'text-emerald-400 text-sm' : 'text-red-400 text-sm'}>{message.text}</p>
      )}
      <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:opacity-50">
        {saving ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </form>
  );
};
