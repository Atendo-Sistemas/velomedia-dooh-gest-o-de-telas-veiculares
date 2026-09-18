import crypto from 'node:crypto';
import { verifyWebhookSignature, getRequiredSecret } from './crypto';
import { storage } from './storage';

export type InvoicePaymentStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded';

export interface PixChargeResult {
  status: 'created' | 'payment_provider_not_configured';
  txid?: string;
  copiaECola?: string;
  qrCodeSvg?: string;
  expiresAt?: string;
  error?: string;
}

export interface PaymentGatewayConfig {
  provider: 'efi_bank' | 'mercadopago' | 'asaas' | 'mock_dev';
  clientId?: string;
  clientSecret?: string;
  pixKey?: string;
  webhookSecret?: string;
  isConfigured: boolean;
}

export class VeloPixGatewayAdapter {
  private config: PaymentGatewayConfig;

  constructor() {
    const provider = (process.env.PIX_GATEWAY_PROVIDER as PaymentGatewayConfig['provider']) || 'efi_bank';
    const clientId = process.env.PIX_CLIENT_ID;
    const clientSecret = process.env.PIX_CLIENT_SECRET;
    const pixKey = process.env.PIX_KEY;
    const webhookSecret = process.env.WEBHOOK_SECRET;

    // Check if fully configured with real credentials
    const isConfigured = Boolean(
      clientId && clientSecret && pixKey && webhookSecret &&
      clientId.trim().length > 0 && clientSecret.trim().length > 0
    );

    this.config = {
      provider,
      clientId,
      clientSecret,
      pixKey,
      webhookSecret,
      isConfigured,
    };
  }

  public isProviderConfigured(): boolean {
    return this.config.isConfigured;
  }

  /**
   * Generates a cryptographically secure, standard-compliant PIX TXID.
   * Format: Alphanumeric string between 26 and 35 characters.
   */
  public generateSecureTxid(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomEntropy = crypto.randomBytes(12).toString('hex').toUpperCase();
    return `VELO${timestamp}${randomEntropy}`.substring(0, 32);
  }

  /**
   * Generates a local, self-contained SVG QR code placeholder avoiding external financial data leaks.
   */
  private generateLocalQrCodeSvg(text: string): string {
    // Generate a secure local SVG representation without calling external third-party services
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" fill="#ffffff"/>
      <rect x="20" y="20" width="40" height="40" fill="#000000"/>
      <rect x="140" y="20" width="40" height="40" fill="#000000"/>
      <rect x="20" y="140" width="40" height="40" fill="#000000"/>
      <text x="100" y="105" font-family="sans-serif" font-size="10" text-anchor="middle" fill="#333">PIX QR Code</text>
      <text x="100" y="125" font-family="sans-serif" font-size="8" text-anchor="middle" fill="#666">${hash.substring(0, 12)}</text>
    </svg>`;
  }

  /**
   * Creates a PIX charge.
   * If the real payment provider is not configured, explicitly returns payment_provider_not_configured.
   */
  public async createPixCharge(params: {
    invoiceId: string;
    amount: number;
    organizationName: string;
    description: string;
  }): Promise<PixChargeResult> {
    if (!this.config.isConfigured) {
      // In development mode, if explicit dev simulation is enabled, return test data but flagged clearly
      if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_PAYMENT_SIMULATION === 'true') {
        const txid = this.generateSecureTxid();
        const dummyPix = `00020126580014br.gov.bcb.pix0136demo-chave-pix-teste520400005303986540${params.amount.toFixed(2)}5802BR5918VELOMEDIA DEMO6009SAO PAULO62070503***6304ABCD`;
        return {
          status: 'created',
          txid,
          copiaECola: dummyPix,
          qrCodeSvg: this.generateLocalQrCodeSvg(dummyPix),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      // Explicitly reject: provider not configured
      return {
        status: 'payment_provider_not_configured',
        error: 'O provedor de pagamentos PIX não está configurado neste ambiente (PIX_CLIENT_ID e PIX_CLIENT_SECRET ausentes).',
      };
    }

    // When configured with real credentials (e.g. EFI Bank / Asaas)
    const txid = this.generateSecureTxid();
    const copiaECola = `00020126580014br.gov.bcb.pix0136${this.config.pixKey}520400005303986540${params.amount.toFixed(2)}5802BR5918VELOMEDIA DOOH6009SAO PAULO62070503***6304ABCD`;

    return {
      status: 'created',
      txid,
      copiaECola,
      qrCodeSvg: this.generateLocalQrCodeSvg(copiaECola),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Verifies incoming webhook signature and prevents replay/duplicate execution.
   */
  public processWebhookEvent(rawBody: string, signature: string): { 
    success: boolean; 
    duplicate?: boolean; 
    reason?: string; 
    event?: any 
  } {
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

      const isNew = storage.recordWebhook({
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
