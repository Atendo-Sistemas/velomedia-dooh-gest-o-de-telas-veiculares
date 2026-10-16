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
