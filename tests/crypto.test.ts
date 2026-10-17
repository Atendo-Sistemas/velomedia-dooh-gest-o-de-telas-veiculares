import { describe, it, expect } from 'vitest';
import { 
  hashPassword, 
  verifyPassword, 
  signProofOfPlay, 
  verifyProofOfPlaySignature, 
  generatePairingCode, 
  generateDeviceSecret 
} from '../server/crypto';
import { generatePixEmvPayload, VeloPixGatewayAdapter } from '../server/billing';
import { VeloStorage } from '../server/storage';
import path from 'node:path';
import fs from 'node:fs';

describe('VeloMedia DOOH Cryptographic Engine', () => {
  it('should hash and verify passwords with PBKDF2 and salt', () => {
    const rawPass = 'VeloAdmin2026!';
    const hash = hashPassword(rawPass);

    expect(hash).toContain(':');
    expect(verifyPassword(rawPass, hash)).toBe(true);
    expect(verifyPassword('WrongPassword123', hash)).toBe(false);
  });

  it('should sign and verify Proof of Play HMAC-SHA256 correctly', () => {
    const secret = generateDeviceSecret();
    const eventParams = {
      eventId: 'pop_test_1001',
      deviceId: 'dev_01',
      campaignId: 'camp_01',
      creativeId: 'crt_banner_01',
      startedAt: '2026-09-17T12:00:00Z',
      endedAt: '2026-09-17T12:00:15Z',
      durationMs: 15000,
      nonce: 'nonce_random_xyz_123',
    };

    const signature = signProofOfPlay(eventParams, secret);
    expect(signature).toHaveLength(64); // 256 bits in hex

    const isValid = verifyProofOfPlaySignature({
      ...eventParams,
      signature,
    }, secret);

    expect(isValid).toBe(true);

    // Tampered payload must fail
    const isTamperedValid = verifyProofOfPlaySignature({
      ...eventParams,
      campaignId: 'camp_fraudulent_99',
      signature,
    }, secret);

    expect(isTamperedValid).toBe(false);
  });

  it('should generate valid 6-digit numeric pairing codes', () => {
    const code = generatePairingCode();
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it('should generate compliant PIX EMV BR Code payload with valid CRC16', () => {
    const payload = generatePixEmvPayload({
      key: 'financeiro@velomedia.com.br',
      name: 'VELOMEDIA DOOH BRASIL',
      city: 'SAO PAULO',
      amount: 5490.0,
      txid: 'TEST1234',
    });

    expect(payload.startsWith('000201')).toBe(true);
    expect(payload).toContain('br.gov.bcb.pix');
    expect(payload).toContain('5490.00');
    expect(payload).toContain('SAO PAULO');
    expect(payload).toHaveLength(payload.lastIndexOf('6304') + 8);
  });

  it('does not enable PIX when only legacy generic gateway credentials are set', async () => {
    const previousEnv = {
      NODE_ENV: process.env.NODE_ENV,
      PIX_GATEWAY_PROVIDER: process.env.PIX_GATEWAY_PROVIDER,
      PIX_CLIENT_ID: process.env.PIX_CLIENT_ID,
      PIX_CLIENT_SECRET: process.env.PIX_CLIENT_SECRET,
      PIX_KEY: process.env.PIX_KEY,
      WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
      ASAAS_API_KEY: process.env.ASAAS_API_KEY,
      ASAAS_WEBHOOK_TOKEN: process.env.ASAAS_WEBHOOK_TOKEN,
    };

    try {
      process.env.NODE_ENV = 'production';
      process.env.PIX_GATEWAY_PROVIDER = 'efi_bank';
      process.env.PIX_CLIENT_ID = 'configured-client';
      process.env.PIX_CLIENT_SECRET = 'configured-secret';
      process.env.PIX_KEY = 'pix@example.com';
      process.env.WEBHOOK_SECRET = 'configured-webhook-secret';
      delete process.env.ASAAS_API_KEY;
      delete process.env.ASAAS_WEBHOOK_TOKEN;

      const result = await new VeloPixGatewayAdapter().createPixCharge({
        invoiceId: 'invoice-test',
        organizationId: 'org-test',
        amount: 10,
        organizationName: 'Test',
        description: 'Test charge',
        dueDate: '2026-10-30',
        cnpj: '12345678000195',
        email: 'billing@example.com',
        phone: '',
      });

      expect(result.status).toBe('payment_provider_not_configured');
    } finally {
      for (const [key, value] of Object.entries(previousEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});

describe('VeloMedia Multi-Tenant Storage Isolation', () => {
  const testDbPath = path.join(process.cwd(), 'data', 'test_store.json');

  it('should strictly isolate entities by organizationId', () => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    const store = new VeloStorage(testDbPath);

    const spDevices = store.getDevices('org_sp_matriz');
    const rioDevices = store.getDevices('org_rio_frota');

    // Devices belonging to SP must not appear in Rio
    for (const dev of spDevices) {
      expect(dev.organizationId).toBe('org_sp_matriz');
    }
    for (const dev of rioDevices) {
      expect(dev.organizationId).toBe('org_rio_frota');
    }

    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });

  it('should prevent JSON storage from being initialized in production', () => {
    const previousEnv = {
      NODE_ENV: process.env.NODE_ENV,
      DATA_FILE_PATH: process.env.DATA_FILE_PATH,
      INITIAL_ADMIN_EMAIL: process.env.INITIAL_ADMIN_EMAIL,
      INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD,
    };

    try {
      process.env.NODE_ENV = 'production';
      process.env.DATA_FILE_PATH = testDbPath;
      process.env.INITIAL_ADMIN_EMAIL = 'owner@example.com';
      process.env.INITIAL_ADMIN_PASSWORD = 'a-long-test-password';
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

      expect(() => new VeloStorage()).toThrow('O armazenamento JSON VeloStorage só pode ser usado em desenvolvimento');
      expect(fs.existsSync(testDbPath)).toBe(false);
    } finally {
      for (const [key, value] of Object.entries(previousEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    }
  });

  it('should not bootstrap a production super admin into JSON storage', () => {
    const previousEnv = {
      NODE_ENV: process.env.NODE_ENV,
      DATA_FILE_PATH: process.env.DATA_FILE_PATH,
      INITIAL_ADMIN_EMAIL: process.env.INITIAL_ADMIN_EMAIL,
      INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD,
    };
    try {
      process.env.NODE_ENV = 'production';
      process.env.DATA_FILE_PATH = testDbPath;
      process.env.INITIAL_ADMIN_EMAIL = 'owner@example.com';
      process.env.INITIAL_ADMIN_PASSWORD = 'a-long-test-password';
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

      expect(() => new VeloStorage()).toThrow('O armazenamento JSON VeloStorage só pode ser usado em desenvolvimento');
      expect(fs.existsSync(testDbPath)).toBe(false);
    } finally {
      for (const [key, value] of Object.entries(previousEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    }
  });
});
