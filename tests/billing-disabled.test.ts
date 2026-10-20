import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../server/repository', () => ({ getVeloRepository: () => ({}) }));

describe('payment gateway without credentials', () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  const params = {
    invoiceId: 'inv', organizationId: 'org', amount: 10, organizationName: 'Org',
    description: 'd', dueDate: '2030-01-01', cnpj: '12345678000199', email: 'a@b.co', phone: '',
  };

  it('returns a controlled error and never creates a charge when disabled', async () => {
    vi.stubEnv('PIX_GATEWAY_PROVIDER', 'disabled');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { VeloPixGatewayAdapter } = await import('../server/billing');
    const result = await new VeloPixGatewayAdapter().createPixCharge(params);
    expect(result.status).toBe('payment_provider_not_configured');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('is not configured when Asaas credentials are missing', async () => {
    vi.stubEnv('PIX_GATEWAY_PROVIDER', 'asaas');
    vi.stubEnv('ASAAS_API_KEY', '');
    vi.stubEnv('ASAAS_WEBHOOK_TOKEN', '');
    const { VeloPixGatewayAdapter } = await import('../server/billing');
    const adapter = new VeloPixGatewayAdapter();
    expect(adapter.isProviderConfigured()).toBe(false);
    expect((await adapter.createPixCharge(params)).status).toBe('payment_provider_not_configured');
  });
});
