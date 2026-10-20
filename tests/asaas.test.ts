import { afterEach, describe, expect, it, vi } from 'vitest';
import { VeloPixGatewayAdapter } from '../server/billing';

const environmentKeys = [
  'PIX_GATEWAY_PROVIDER',
  'ASAAS_ENVIRONMENT',
  'ASAAS_API_KEY',
  'ASAAS_WEBHOOK_TOKEN',
];

const originalEnvironment = new Map(environmentKeys.map(key => [key, process.env[key]]));

function configureAsaas(environment = 'sandbox') {
  process.env.PIX_GATEWAY_PROVIDER = 'asaas';
  process.env.ASAAS_ENVIRONMENT = environment;
  process.env.ASAAS_API_KEY = 'test-api-key';
  process.env.ASAAS_WEBHOOK_TOKEN = 'a'.repeat(48);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  for (const [key, value] of originalEnvironment) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('Asaas PIX gateway', () => {
  it('creates or reuses a customer, creates a PIX payment and returns the provider QR code', async () => {
    configureAsaas();
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input));
      expect(url.origin).toBe('https://api-sandbox.asaas.com');
      expect(new Headers(init?.headers).get('access_token')).toBe('test-api-key');

      if (url.pathname === '/v3/customers' && init?.method === 'POST') {
        const customer = JSON.parse(String(init.body));
        expect(customer.externalReference).toBe('organization:org-1');
        expect(customer.cpfCnpj).toBe('12345678000195');
        return jsonResponse({ id: 'cus_123' });
      }
      if (url.pathname === '/v3/customers') return jsonResponse({ data: [] });
      if (url.pathname === '/v3/payments' && init?.method === 'POST') {
        const payment = JSON.parse(String(init.body));
        expect(payment).toMatchObject({
          customer: 'cus_123',
          billingType: 'PIX',
          value: 149.9,
          externalReference: 'invoice:inv-1',
        });
        return jsonResponse({ id: 'pay_123' });
      }
      if (url.pathname === '/v3/payments') return jsonResponse({ data: [] });
      if (url.pathname === '/v3/payments/pay_123/pixQrCode') {
        return jsonResponse({
          payload: 'pix-copy-paste',
          encodedImage: 'cXItY29kZQ==',
          expirationDate: '2026-10-20T23:59:00Z',
        });
      }
      throw new Error(`Unexpected Asaas URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await new VeloPixGatewayAdapter().createPixCharge({
      invoiceId: 'inv-1',
      organizationId: 'org-1',
      organizationName: 'Organization',
      amount: 149.9,
      dueDate: '2026-10-20',
      description: 'Monthly invoice',
      cnpj: '12.345.678/0001-95',
      email: 'billing@example.com',
      phone: '(11) 99999-0000',
    });

    expect(result).toEqual({
      status: 'created',
      txid: 'pay_123',
      copiaECola: 'pix-copy-paste',
      qrCodeUrl: 'data:image/png;base64,cXItY29kZQ==',
      expiresAt: '2026-10-20T23:59:00Z',
    });
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('reuses an existing payment instead of creating a duplicate', async () => {
    configureAsaas('production');
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input));
      expect(url.origin).toBe('https://api.asaas.com');
      if (url.pathname === '/v3/customers') {
        return jsonResponse({ data: [{ id: 'cus_existing', externalReference: 'organization:org-1' }] });
      }
      if (url.pathname === '/v3/payments') {
        return jsonResponse({ data: [{ id: 'pay_existing', status: 'PENDING' }] });
      }
      if (url.pathname === '/v3/payments/pay_existing/pixQrCode') {
        return jsonResponse({ payload: 'existing-pix', encodedImage: 'aW1hZ2U=' });
      }
      throw new Error(`Unexpected Asaas URL or method: ${url} ${init?.method}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await new VeloPixGatewayAdapter().createPixCharge({
      invoiceId: 'inv-1',
      organizationId: 'org-1',
      organizationName: 'Organization',
      amount: 149.9,
      dueDate: '2026-10-20',
      description: 'Monthly invoice',
      cnpj: '12345678000195',
      email: 'billing@example.com',
      phone: '',
    });

    expect(result.status).toBe('created');
    expect(result.txid).toBe('pay_existing');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('rejects webhook tokens that do not match the configured Asaas token', async () => {
    configureAsaas();
    const gateway = new VeloPixGatewayAdapter();
    expect(await gateway.verifyAsaasWebhookToken('a'.repeat(48))).toBe(true);
    expect(await gateway.verifyAsaasWebhookToken('wrong')).toBe(false);
    expect(await gateway.verifyAsaasWebhookToken(undefined)).toBe(false);
  });

  it('does not return provider response details when Asaas fails', async () => {
    configureAsaas();
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ errors: [{ description: 'private provider detail' }] }, 401)));

    const result = await new VeloPixGatewayAdapter().createPixCharge({
      invoiceId: 'inv-1',
      organizationId: 'org-1',
      organizationName: 'Organization',
      amount: 149.9,
      dueDate: '2026-10-20',
      description: 'Monthly invoice',
      cnpj: '12345678000195',
      email: 'billing@example.com',
      phone: '',
    });

    expect(result.status).toBe('failed');
    expect(result.error).not.toContain('private provider detail');
  });
});
