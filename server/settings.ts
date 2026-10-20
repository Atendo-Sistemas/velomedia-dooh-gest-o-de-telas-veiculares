import crypto from 'node:crypto';
import { getVeloRepository } from './repository';

export const SETTING_KEYS = [
  'pixGatewayProvider',
  'asaasEnvironment',
  'asaasApiKey',
  'asaasWebhookToken',
  'mapboxAccessToken',
  'webhookSecret',
] as const;
export type SettingKey = typeof SETTING_KEYS[number];

/** Chaves cujos valores nunca são devolvidos ao navegador. */
export const SECRET_SETTING_KEYS: SettingKey[] = ['asaasApiKey', 'asaasWebhookToken', 'webhookSecret'];
/** Chaves editáveis pelo painel de configuração (webhookSecret é gerado automaticamente). */
export const EDITABLE_SETTING_KEYS: SettingKey[] = ['pixGatewayProvider', 'asaasEnvironment', 'asaasApiKey', 'asaasWebhookToken', 'mapboxAccessToken'];

const ENV_FALLBACKS: Record<SettingKey, string> = {
  pixGatewayProvider: 'PIX_GATEWAY_PROVIDER',
  asaasEnvironment: 'ASAAS_ENVIRONMENT',
  asaasApiKey: 'ASAAS_API_KEY',
  asaasWebhookToken: 'ASAAS_WEBHOOK_TOKEN',
  mapboxAccessToken: 'MAPBOX_ACCESS_TOKEN',
  webhookSecret: 'WEBHOOK_SECRET',
};

export type ResolvedSettings = Record<SettingKey, string | undefined>;

/**
 * Resolve as configurações: valores salvos no painel têm prioridade; variáveis de ambiente
 * continuam aceitas como alternativa opcional (compatibilidade), mas não são exigidas.
 */
export async function getResolvedSettings(): Promise<ResolvedSettings> {
  let stored: Record<string, string> = {};
  try {
    stored = await getVeloRepository().getSystemSettings();
  } catch (error) {
    console.error('[Settings] Falha ao ler configurações:', (error as Error).message);
  }
  const resolved = {} as ResolvedSettings;
  for (const key of SETTING_KEYS) {
    resolved[key] = stored[key]?.trim() || process.env[ENV_FALLBACKS[key]]?.trim() || undefined;
  }
  return resolved;
}

/** Retorna o segredo HMAC de webhooks, gerando e persistindo um automaticamente se necessário. */
export async function ensureWebhookSecret(): Promise<string> {
  const current = (await getResolvedSettings()).webhookSecret;
  if (current) return current;
  const repository = getVeloRepository();
  const stored = await repository.getSystemSettings();
  const secret = crypto.randomBytes(32).toString('hex');
  await repository.saveSystemSettings({ ...stored, webhookSecret: secret });
  return secret;
}

export function maskSecret(value: string | undefined): string {
  if (!value) return '';
  return value.length <= 4 ? '••••' : `••••${value.slice(-4)}`;
}

/** Visão segura das configurações para o painel: segredos aparecem apenas mascarados. */
export async function getSettingsView() {
  const s = await getResolvedSettings();
  return {
    pixGatewayProvider: s.pixGatewayProvider || '',
    asaasEnvironment: s.asaasEnvironment === 'production' ? 'production' : 'sandbox',
    mapboxAccessToken: s.mapboxAccessToken || '',
    asaasApiKeyConfigured: Boolean(s.asaasApiKey),
    asaasApiKeyMasked: maskSecret(s.asaasApiKey),
    asaasWebhookTokenConfigured: Boolean(s.asaasWebhookToken),
    asaasWebhookTokenMasked: maskSecret(s.asaasWebhookToken),
  };
}

/** Aplica atualização parcial. Strings vazias removem o valor; chaves ausentes são preservadas. */
export async function updateSettings(patch: Partial<Record<SettingKey, string>>): Promise<void> {
  const repository = getVeloRepository();
  const stored = { ...(await repository.getSystemSettings()) };
  for (const key of EDITABLE_SETTING_KEYS) {
    const value = patch[key];
    if (value === undefined) continue;
    const trimmed = value.trim();
    if (trimmed) stored[key] = trimmed;
    else delete stored[key];
  }
  await repository.saveSystemSettings(stored);
}
