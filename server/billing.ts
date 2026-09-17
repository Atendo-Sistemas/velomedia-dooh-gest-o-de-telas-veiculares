import { verifyWebhookSignature } from './crypto';
import type { SaaSInvoice } from '../src/types';

export interface PixChargeRequest {
  invoiceId: string;
  amount: number;
  description: string;
  payerCnpjOrCpf: string;
  payerName: string;
}

export interface PixChargeResponse {
  txid: string;
  copiaECola: string;
  qrCodeBase64: string;
  expiresAt: string;
}

export interface PaymentGatewayAdapter {
  createPixCharge(req: PixChargeRequest): Promise<PixChargeResponse>;
  verifyWebhook(rawBody: string, signature: string): boolean;
}

/**
 * Generates an official compliant EMV BR Code (PIX) payload
 */
export function generatePixEmvPayload(params: {
  key: string;
  name: string;
  city: string;
  amount: number;
  txid: string;
}): string {
  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const cleanName = params.name.substring(0, 25).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanCity = params.city.substring(0, 15).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const amountStr = params.amount.toFixed(2);
  const cleanTxid = params.txid.replace(/[^A-Za-z0-9]/g, '').substring(0, 25) || '***';

  const merchantAccountInfo = 
    formatField('00', 'br.gov.bcb.pix') +
    formatField('01', params.key);

  const additionalDataField = formatField('05', cleanTxid);

  let raw = 
    formatField('00', '01') + // Format indicator
    formatField('26', merchantAccountInfo) +
    formatField('52', '0000') + // Merchant category
    formatField('53', '986') + // Currency Real BRL
    formatField('54', amountStr) +
    formatField('58', 'BR') +
    formatField('59', cleanName) +
    formatField('60', cleanCity) +
    formatField('62', additionalDataField) +
    '6304';

  // CRC16 CCITT polynomial 0x1021
  let crc = 0xFFFF;
  for (let i = 0; i < raw.length; i++) {
    crc ^= (raw.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  return raw + crcHex;
}

export class VeloPixGatewayAdapter implements PaymentGatewayAdapter {
  private webhookSecret: string;
  private pixKey: string;
  private beneficiaryName: string;

  constructor(pixKey?: string, webhookSecret?: string) {
    this.pixKey = pixKey || 'financeiro@velomedia.com.br';
    this.webhookSecret = webhookSecret || process.env.WEBHOOK_SECRET || 'velo-webhook-signing-secret-2026';
    this.beneficiaryName = 'VELOMEDIA DOOH BRASIL';
  }

  public async createPixCharge(req: PixChargeRequest): Promise<PixChargeResponse> {
    const txid = `TX${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const copiaECola = generatePixEmvPayload({
      key: this.pixKey,
      name: this.beneficiaryName,
      city: 'SAO PAULO',
      amount: req.amount,
      txid,
    });

    return {
      txid,
      copiaECola,
      qrCodeBase64: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(copiaECola)}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  public verifyWebhook(rawBody: string, signature: string): boolean {
    return verifyWebhookSignature(rawBody, signature, this.webhookSecret);
  }
}

export const pixGateway = new VeloPixGatewayAdapter();
