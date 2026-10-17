import crypto from 'node:crypto';
import { verifyWebhookSignature, getRequiredSecret } from './crypto';
import { getVeloRepository } from './repository';

export type InvoicePaymentStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded';

export interface PixChargeResult {
  status: 'created' | 'payment_provider_not_configured' | 'failed';
  txid?: string;
  copiaECola?: string;
  qrCodeUrl?: string;
  expiresAt?: string;
  error?: string;
}

export interface PaymentGatewayConfig {
  provider: 'efi_bank' | 'mercadopago' | 'asaas' | 'mock_dev';
  apiKey?: string;
  webhookToken?: string;
  environment: 'sandbox' | 'production';
  webhookSecret?: string;
  isConfigured: boolean;
}

export class VeloPixGatewayAdapter {
  private config: PaymentGatewayConfig;
  private repository = getVeloRepository();
  private inFlightCharges = new Map<string, Promise<PixChargeResult>>();

  constructor() {
    const provider = (process.env.PIX_GATEWAY_PROVIDER as PaymentGatewayConfig['provider']) || 'efi_bank';
    const apiKey = process.env.ASAAS_API_KEY?.trim();
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN?.trim();
    const environment = process.env.ASAAS_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production';

    const isConfigured = provider === 'asaas' && Boolean(apiKey && webhookToken);

    this.config = {
      provider,
      apiKey,
      webhookToken,
      environment,
      webhookSecret: process.env.WEBHOOK_SECRET,
      isConfigured,
    };
  }

  public isProviderConfigured(): boolean {
    return this.config.isConfigured;
  }

  private get apiBaseUrl(): string {
    return this.config.environment === 'sandbox'
      ? 'https://api-sandbox.asaas.com/v3'
      : 'https://api.asaas.com/v3';
  }

  private async asaasRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      ...init,
      signal: AbortSignal.timeout(10_000),
      headers: {
        access_token: this.config.apiKey!,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...init.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`Asaas request failed (${response.status})`);
    }
    return response.json() as Promise<T>;
  }

  private async ensureAsaasCustomer(params: {
    externalReference: string;
    organizationName: string;
    cnpj: string;
    email: string;
    phone: string;
  }): Promise<string> {
    const reference = params.externalReference;
    const query = new URLSearchParams({ externalReference: reference, limit: '100' });
    const customers = await this.asaasRequest<{ data?: Array<{ id: string; externalReference?: string }> }>(
      `/customers?${query.toString()}`,
    );
    const existing = customers.data?.find(customer => customer.externalReference === reference);
    if (existing) return existing.id;

    const created = await this.asaasRequest<{ id?: string }>('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: params.organizationName.trim().slice(0, 100),
        cpfCnpj: params.cnpj.replace(/\D/g, ''),
        email: params.email.trim(),
        phone: params.phone.replace(/\D/g, '') || undefined,
        notificationDisabled: false,
        externalReference: reference,
      }),
    });
    if (!created.id) throw new Error('Asaas customer response did not include an ID');
    return created.id;
  }

  private async getPaymentQrCode(paymentId: string): Promise<{ payload?: string; encodedImage?: string; expirationDate?: string }> {
    return this.asaasRequest(`/payments/${encodeURIComponent(paymentId)}/pixQrCode`);
  }

  /**
   * Creates a PIX charge.
   * If the real payment provider is not configured, explicitly returns payment_provider_not_configured.
   */
  public createPixCharge(params: {
    invoiceId: string;
    organizationId: string;
    customerReference?: string;
    amount: number;
    organizationName: string;
    description: string;
    dueDate: string;
    cnpj: string;
    email: string;
    phone: string;
  }): Promise<PixChargeResult> {
    const key = `${params.organizationId}:${params.invoiceId}`;
    const existing = this.inFlightCharges.get(key);
    if (existing) return existing;
    const charge = this.createPixChargeOnce(params);
    this.inFlightCharges.set(key, charge);
    return charge.finally(() => {
      if (this.inFlightCharges.get(key) === charge) this.inFlightCharges.delete(key);
    });
  }

  private async createPixChargeOnce(params: {
    invoiceId: string;
    organizationId: string;
    customerReference?: string;
    amount: number;
    organizationName: string;
    description: string;
    dueDate: string;
    cnpj: string;
    email: string;
    phone: string;
  }): Promise<PixChargeResult> {
    if (!this.config.isConfigured) {
      return {
        status: 'payment_provider_not_configured',
        error: 'Configure PIX_GATEWAY_PROVIDER=asaas, ASAAS_API_KEY e ASAAS_WEBHOOK_TOKEN.',
      };
    }

    if (!Number.isFinite(params.amount) || params.amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(params.dueDate)) {
      return { status: 'failed', error: 'Valor ou vencimento da fatura inválido para gerar o PIX.' };
    }
    const document = params.cnpj.replace(/\D/g, '');
    if (![11, 14].includes(document.length) || !params.email.includes('@')) {
      return { status: 'failed', error: 'Complete o CPF/CNPJ e o e-mail de cobrança da organização antes de gerar o PIX.' };
    }

    try {
      const customerId = await this.ensureAsaasCustomer({
        externalReference: params.customerReference || `organization:${params.organizationId}`,
        organizationName: params.organizationName,
        cnpj: document,
        email: params.email,
        phone: params.phone,
      });
      const reference = `invoice:${params.invoiceId}`;
      const query = new URLSearchParams({ externalReference: reference, limit: '100' });
      const existingPayments = await this.asaasRequest<{ data?: Array<{ id: string; status?: string }> }>(
        `/payments?${query.toString()}`,
      );
      const existing = existingPayments.data?.find(payment =>
        ['PENDING', 'OVERDUE', 'AWAITING_RISK_ANALYSIS', 'RECEIVED', 'CONFIRMED'].includes(payment.status || ''),
      );
      const payment = existing || await this.asaasRequest<{ id?: string }>('/payments', {
        method: 'POST',
        body: JSON.stringify({
          customer: customerId,
          billingType: 'PIX',
          value: Number(params.amount.toFixed(2)),
          dueDate: params.dueDate,
          description: params.description.slice(0, 500),
          externalReference: reference,
        }),
      });
      if (!payment.id) throw new Error('Asaas payment response did not include an ID');

      const pix = await this.getPaymentQrCode(payment.id);
      if (!pix.payload || !pix.encodedImage) {
        throw new Error('Asaas PIX response did not include a QR code');
      }
      return {
        status: 'created',
        txid: payment.id,
        copiaECola: pix.payload,
        qrCodeUrl: `data:image/png;base64,${pix.encodedImage}`,
        expiresAt: pix.expirationDate,
      };
    } catch {
      return {
        status: 'failed',
        error: 'Não foi possível gerar a cobrança PIX no Asaas. Confira os dados da organização e tente novamente.',
      };
    }
  }

  public verifyAsaasWebhookToken(token: string | undefined): boolean {
    const expected = this.config.webhookToken;
    if (!expected || !token) return false;
    const supplied = Buffer.from(token);
    const configured = Buffer.from(expected);
    return supplied.length === configured.length && crypto.timingSafeEqual(supplied, configured);
  }

  /**
   * Verifies incoming webhook signature and prevents replay/duplicate execution.
   */
  public async processWebhookEvent(rawBody: string, signature: string): Promise<{ 
    success: boolean; 
    duplicate?: boolean; 
    reason?: string; 
    event?: any 
  }> {
    const webhookSecret = this.config.webhookSecret || (
      process.env.NODE_ENV === 'production' 
        ? getRequiredSecret('WEBHOOK_SECRET')
        : 'velo-webhook-dev-secret-2026'
    );

    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return { success: false, reason: 'Invalid webhook HMAC signature.' };
    }

    try {
      const parsed = JSON.parse(rawBody);
      const eventId = parsed.eventId || parsed.id || crypto.createHash('sha256').update(rawBody).digest('hex');

      const isNew = await this.repository.recordWebhook({
        eventId,
        provider: this.config.provider,
        processedAt: new Date().toISOString(),
        payloadHash: crypto.createHash('sha256').update(rawBody).digest('hex'),
      });

      if (!isNew) {
        return { success: true, duplicate: true, event: parsed };
      }

      return { success: true, duplicate: false, event: parsed };
    } catch {
      return { success: false, reason: 'Invalid JSON payload.' };
    }
  }
}

export const pixGateway = new VeloPixGatewayAdapter();

function computeCrc16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePixEmvPayload(params: {
  key: string;
  name: string;
  city: string;
  amount?: number;
  txid?: string;
  description?: string;
}): string {
  const formatField = (id: string, value: string): string => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const gui = formatField('00', 'br.gov.bcb.pix');
  const key = formatField('01', params.key);
  const desc = params.description ? formatField('02', params.description) : '';
  const merchantAccount = formatField('26', `${gui}${key}${desc}`);

  const merchantCategory = formatField('52', '0000');
  const currency = formatField('53', '986');
  const amountStr = params.amount !== undefined ? formatField('54', params.amount.toFixed(2)) : '';
  const country = formatField('58', 'BR');
  const name = formatField('59', params.name.substring(0, 25).toUpperCase());
  const city = formatField('60', params.city.substring(0, 15).toUpperCase());
  
  const txid = formatField('05', (params.txid || '***').substring(0, 25));
  const additionalData = formatField('62', txid);

  const rawPayload = `000201${merchantAccount}${merchantCategory}${currency}${amountStr}${country}${name}${city}${additionalData}6304`;
  const checksum = computeCrc16(rawPayload);
  return `${rawPayload}${checksum}`;
}
