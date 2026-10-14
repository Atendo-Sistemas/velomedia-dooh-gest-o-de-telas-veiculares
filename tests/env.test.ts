import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '../server/env';
import { InvoiceSchema, OrganizationSchema } from '../server/schemas';

const validProductionEnv: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  WEBHOOK_SECRET: 'a'.repeat(64),
  CORS_ALLOWED_ORIGINS: 'https://app.example.com',
  DATA_FILE_PATH: '/var/lib/velomedia/data.json',
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

  it('rejects wildcard CORS, weak secrets, and non-persistent relative paths', () => {
    const result = validateEnvironment({
      ...validProductionEnv,
      WEBHOOK_SECRET: 'short',
      INITIAL_ADMIN_PASSWORD: 'short',
      DATA_FILE_PATH: 'data.json',
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
      'DATA_FILE_PATH',
      'INITIAL_ADMIN_EMAIL',
      'INITIAL_ADMIN_PASSWORD',
    ]);
  });

  it('rejects non-loopback binds and storage paths outside the persistent data directory', () => {
    const result = validateEnvironment({
      ...validProductionEnv,
      HOST: '0.0.0.0',
      DATA_FILE_PATH: '/tmp/velomedia.json',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('DATA_FILE_PATH deve apontar para um arquivo dentro de /var/lib/velomedia.');
    expect(result.errors).toContain('HOST deve ser localhost ou um endereço de loopback em produção.');
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
