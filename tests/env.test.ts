import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '../server/env';
import { InvoiceSchema, OrganizationSchema } from '../server/schemas';

const validProductionEnv: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  WEBHOOK_SECRET: 'a'.repeat(64),
  CORS_ALLOWED_ORIGINS: 'https://app.example.com',
  DATABASE_URL: 'postgresql://db.example.com:5432/velomedia',
  INITIAL_ADMIN_EMAIL: 'admin@example.com',
  INITIAL_ADMIN_PASSWORD: 'a-long-test-password',
  PORT: '3000',
};

describe('production environment validation', () => {
  it('accepts a complete single-VPS configuration', () => {
    expect(validateEnvironment(validProductionEnv)).toEqual({
      valid: true,
      missing: [],
      errors: [],
    });
  });

  it('rejects wildcard CORS, weak secrets, and malformed database URLs', () => {
    const result = validateEnvironment({
      ...validProductionEnv,
      WEBHOOK_SECRET: 'short',
      INITIAL_ADMIN_PASSWORD: 'short',
      DATABASE_URL: 'not-a-postgres-url',
      CORS_ALLOWED_ORIGINS: '*',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(5);
  });

  it('requires the production bootstrap and persistence settings', () => {
    const result = validateEnvironment({ NODE_ENV: 'production' });

    expect(result.valid).toBe(false);
    expect(result.missing).toEqual([
      'WEBHOOK_SECRET',
      'CORS_ALLOWED_ORIGINS',
      'DATABASE_URL',
      'INITIAL_ADMIN_EMAIL',
      'INITIAL_ADMIN_PASSWORD',
    ]);
  });

  it('rejects non-loopback binds in production', () => {
    const result = validateEnvironment({
      ...validProductionEnv,
      HOST: '0.0.0.0',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('HOST deve ser localhost ou um endereço de loopback em produção.');
  });

  it('requires PostgreSQL rather than JSON persistence in production', () => {
    const { DATABASE_URL: _databaseUrl, ...withoutDatabase } = validProductionEnv;
    expect(validateEnvironment(withoutDatabase).missing).toContain('DATABASE_URL');
  });

  it('allows a Docker-internal bind only when the container deployment flag is set', () => {
    const result = validateEnvironment({
      ...validProductionEnv,
      HOST: '0.0.0.0',
      DOCKERIZED: 'true',
    });

    expect(result.valid).toBe(true);
  });

  it('requires valid Asaas credentials and webhook token when Asaas is selected', () => {
    const missing = validateEnvironment({
      ...validProductionEnv,
      PIX_GATEWAY_PROVIDER: 'asaas',
    });
    expect(missing.missing).toEqual(['ASAAS_API_KEY', 'ASAAS_WEBHOOK_TOKEN']);

    const configured = validateEnvironment({
      ...validProductionEnv,
      PIX_GATEWAY_PROVIDER: 'asaas',
      ASAAS_ENVIRONMENT: 'sandbox',
      ASAAS_API_KEY: 'test-api-key',
      ASAAS_WEBHOOK_TOKEN: 'a'.repeat(48),
    });
    expect(configured.valid).toBe(true);
  });

  it('rejects an invalid Asaas environment and webhook token', () => {
    const result = validateEnvironment({
      ...validProductionEnv,
      PIX_GATEWAY_PROVIDER: 'asaas',
      ASAAS_ENVIRONMENT: 'test',
      ASAAS_API_KEY: 'test-api-key',
      ASAAS_WEBHOOK_TOKEN: 'short token',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('ASAAS_ENVIRONMENT deve ser sandbox ou production.');
    expect(result.errors).toContain('ASAAS_WEBHOOK_TOKEN deve ter entre 32 e 255 caracteres e não conter espaços.');
  });
});

describe('API write schemas', () => {
  it('rejects malformed organizations and negative invoice amounts', () => {
    expect(OrganizationSchema.safeParse({ id: 'org_invalid', adminUser: {} }).success).toBe(false);
    expect(InvoiceSchema.safeParse({
      id: 'inv_1',
      invoiceNumber: 'INV-1',
      issueDate: '2026-10-14',
      dueDate: '2026-10-30',
      amount: -1,
      status: 'pending',
      screensBilled: 1,
      paymentMethod: 'pix',
    }).success).toBe(false);
  });
});

describe('payment configuration in production', () => {
  it('boots with payments disabled and without Asaas credentials', () => {
    expect(validateEnvironment({ ...validProductionEnv, PIX_GATEWAY_PROVIDER: 'disabled' }).valid).toBe(true);
    expect(validateEnvironment(validProductionEnv).valid).toBe(true);
  });

  it('requires Asaas credentials only when asaas is selected', () => {
    const result = validateEnvironment({ ...validProductionEnv, PIX_GATEWAY_PROVIDER: 'asaas' });
    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(['ASAAS_API_KEY', 'ASAAS_WEBHOOK_TOKEN']);
    expect(validateEnvironment({
      ...validProductionEnv, PIX_GATEWAY_PROVIDER: 'asaas', ASAAS_ENVIRONMENT: 'sandbox',
      ASAAS_API_KEY: 'fake-key', ASAAS_WEBHOOK_TOKEN: 'w'.repeat(32),
    }).valid).toBe(true);
  });

  it('rejects mock_dev, unknown providers and simulation in production', () => {
    for (const provider of ['mock_dev', 'efi_bank', 'bogus']) {
      expect(validateEnvironment({ ...validProductionEnv, PIX_GATEWAY_PROVIDER: provider }).valid).toBe(false);
    }
    expect(validateEnvironment({ ...validProductionEnv, SIMULATION_ENABLED: 'true' }).valid).toBe(false);
  });
});
