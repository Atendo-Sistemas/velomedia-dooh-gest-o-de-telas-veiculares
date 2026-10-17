import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { VeloStorage } from '../server/storage';
import { adminRequestRateLimiter } from '../server/rate-limit';

const environmentKeys = ['NODE_ENV', 'DATA_FILE_PATH', 'PIX_GATEWAY_PROVIDER', 'ASAAS_API_KEY', 'ASAAS_ENVIRONMENT', 'ASAAS_WEBHOOK_TOKEN'];
const originalEnvironment = new Map(environmentKeys.map(key => [key, process.env[key]]));
let temporaryDirectory: string | undefined;
let activeServer: ReturnType<typeof createServer> | undefined;

afterEach(async () => {
  vi.unstubAllGlobals();
  if (activeServer?.listening) {
    await new Promise<void>(resolve => activeServer!.close(() => resolve()));
  }
  activeServer = undefined;
  if (temporaryDirectory) fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = undefined;
  for (const [key, value] of originalEnvironment) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('Asaas payment webhooks', () => {
  it('marks only the matching invoice as paid and acknowledges duplicate events', async () => {
    temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'velomedia-asaas-'));
    process.env.NODE_ENV = 'development';
    process.env.DATA_FILE_PATH = path.join(temporaryDirectory, 'store.json');
    process.env.PIX_GATEWAY_PROVIDER = 'asaas';
    process.env.ASAAS_API_KEY = 'test-api-key';
    process.env.ASAAS_ENVIRONMENT = 'sandbox';
    process.env.ASAAS_WEBHOOK_TOKEN = 'a'.repeat(48);

    const store = new VeloStorage(process.env.DATA_FILE_PATH);
    const organization = store.getOrganizations()[0];
    const invoice = {
      id: 'invoice-webhook-test',
      invoiceNumber: 'INV-WEBHOOK-1',
      organizationId: organization.id,
      organizationName: organization.name,
      issueDate: '2026-10-16',
      dueDate: '2026-10-30',
      amount: 149.9,
      status: 'pending' as const,
      screensBilled: 1,
      paymentMethod: 'pix' as const,
      txid: 'pay_asaas_test',
    };
    store.saveInvoice(invoice, organization.id);
    const advertiser = {
      ...store.getAdvertisers(organization.id)[0],
      id: 'advertiser-webhook-test',
      prepaidBalance: 12.5,
    };
    store.saveAdvertiser(advertiser, organization.id);
    const otherAdvertiser = { ...advertiser, id: 'advertiser-webhook-other', companyName: 'Other Advertiser' };
    store.saveAdvertiser(otherAdvertiser, organization.id);
    store.saveInvoice({
      id: 'invoice-other-advertiser',
      invoiceNumber: 'ADV-OTHER-1',
      organizationId: organization.id,
      organizationName: otherAdvertiser.companyName,
      advertiserId: otherAdvertiser.id,
      purpose: 'advertiser_recharge',
      issueDate: '2026-10-16',
      dueDate: '2026-10-30',
      amount: 200,
      status: 'pending',
      screensBilled: 0,
      paymentMethod: 'pix',
    }, organization.id);
    const { apiRouter } = await import('../server/api');
    const originalFetch = globalThis.fetch;
    vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
      const providerUrl = new URL(String(input));
      if (providerUrl.hostname === '127.0.0.1') return originalFetch(input, init);
      if (providerUrl.pathname === '/v3/customers' && init?.method === 'POST') {
        const customer = JSON.parse(String(init.body));
        expect(customer).toMatchObject({
          externalReference: `advertiser:${organization.id}:${advertiser.id}`,
          name: advertiser.companyName,
          cpfCnpj: advertiser.cnpj.replace(/\D/g, ''),
        });
        return new Response(JSON.stringify({ id: 'cus_advertiser_billing' }), { status: 200 });
      }
      if (providerUrl.pathname === '/v3/customers') return new Response(JSON.stringify({ data: [] }), { status: 200 });
      if (providerUrl.pathname === '/v3/payments' && init?.method === 'POST') {
        const payment = JSON.parse(String(init.body));
        expect(payment).toMatchObject({
          customer: 'cus_advertiser_billing',
          value: 100,
          externalReference: expect.stringMatching(/^invoice:adv_inv_/),
        });
        return new Response(JSON.stringify({ id: 'pay_advertiser_billing' }), { status: 200 });
      }
      if (providerUrl.pathname === '/v3/payments') return new Response(JSON.stringify({ data: [] }), { status: 200 });
      if (providerUrl.pathname === '/v3/payments/pay_advertiser_billing/pixQrCode') {
        return new Response(JSON.stringify({ payload: 'advertiser-copy-code', encodedImage: 'aW1hZ2U=' }), { status: 200 });
      }
      throw new Error(`Unexpected Asaas request ${providerUrl}`);
    });
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = req.header('x-test-role') === 'advertiser'
        ? {
          id: 'user-advertiser',
          email: 'advertiser@example.com',
          name: advertiser.companyName,
          role: 'advertiser',
          organizationId: organization.id,
          advertiserId: advertiser.id,
        }
        : {
          id: 'user_master',
          email: 'admin@velomedia.com.br',
          name: 'Administrador Velo Master',
          role: 'platform_admin',
          organizationId: organization.id,
        };
      next();
    });
    app.use(adminRequestRateLimiter);
    app.use('/api/v1', apiRouter);
    activeServer = createServer(app);
    await new Promise<void>(resolve => activeServer!.listen(0, '127.0.0.1', () => resolve()));
    const { port } = activeServer.address() as AddressInfo;
    const url = `http://127.0.0.1:${port}/api/v1/webhooks/asaas`;
    const createdInvoiceResponse = await fetch(`http://127.0.0.1:${port}/api/v1/advertisers/${advertiser.id}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: 100 }),
    });
    expect(createdInvoiceResponse.status).toBe(201);
    const createdInvoice = await createdInvoiceResponse.json();
    expect(createdInvoice).toMatchObject({
      advertiserId: advertiser.id,
      purpose: 'advertiser_recharge',
      amount: 100,
      status: 'pending',
    });
    const chargeResponse = await fetch(`http://127.0.0.1:${port}/api/v1/invoices/${createdInvoice.id}/charge-pix`, {
      method: 'POST',
    });
    expect(chargeResponse.status).toBe(200);
    expect(await chargeResponse.json()).toMatchObject({
      success: true,
      txid: 'pay_advertiser_billing',
      copiaECola: 'advertiser-copy-code',
    });
    const advertiserHeaders = { 'x-test-role': 'advertiser' };
    const portalResponse = await fetch(`http://127.0.0.1:${port}/api/v1/advertiser-portal`, { headers: advertiserHeaders });
    expect(portalResponse.status).toBe(200);
    const portalData = await portalResponse.json();
    expect(portalData.advertiser.id).toBe(advertiser.id);
    expect(portalData.invoices.map((item: { advertiserId: string }) => item.advertiserId)).not.toContain(otherAdvertiser.id);
    const isolatedCampaignResponse = await fetch(`http://127.0.0.1:${port}/api/v1/campaigns`, { headers: advertiserHeaders });
    expect(isolatedCampaignResponse.status).toBe(403);
    const crossAdvertiserCharge = await fetch(`http://127.0.0.1:${port}/api/v1/advertiser-portal/invoices/invoice-other-advertiser/charge-pix`, {
      method: 'POST',
      headers: advertiserHeaders,
    });
    expect(crossAdvertiserCharge.status).toBe(404);
    const mismatchedPayment = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'asaas-access-token': 'a'.repeat(48) },
      body: JSON.stringify({
        id: 'evt_asaas_mismatched_amount',
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_advertiser_billing',
          externalReference: `invoice:${createdInvoice.id}`,
          value: createdInvoice.amount - 1,
        },
      }),
    });
    expect(mismatchedPayment.status).toBe(409);
    expect(new VeloStorage(process.env.DATA_FILE_PATH).getAdvertisers(organization.id)
      .find(item => item.id === advertiser.id)?.prepaidBalance).toBe(12.5);
    const body = {
      id: 'evt_asaas_test',
      event: 'PAYMENT_CONFIRMED',
      payment: {
        id: 'pay_asaas_test',
        externalReference: `invoice:${invoice.id}`,
        value: 149.9,
        paymentDate: '2026-10-16',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'asaas-access-token': 'a'.repeat(48) },
      body: JSON.stringify(body),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, duplicate: false });
    expect(new VeloStorage(process.env.DATA_FILE_PATH).getInvoiceById(invoice.id, organization.id)?.status).toBe('paid');

    const duplicate = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'asaas-access-token': 'a'.repeat(48) },
      body: JSON.stringify(body),
    });
    expect(duplicate.status).toBe(200);
    expect(await duplicate.json()).toEqual({ received: true, duplicate: true });

    const advertiserPayment = {
      id: 'evt_asaas_advertiser_test',
      event: 'PAYMENT_CONFIRMED',
      payment: {
        id: 'pay_advertiser_billing',
        externalReference: `invoice:${createdInvoice.id}`,
        value: createdInvoice.amount,
        paymentDate: '2026-10-16',
      },
    };
    const advertiserResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'asaas-access-token': 'a'.repeat(48) },
      body: JSON.stringify(advertiserPayment),
    });
    expect(advertiserResponse.status).toBe(200);
    expect((await advertiserResponse.json()).received).toBe(true);

    const distinctDuplicate = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'asaas-access-token': 'a'.repeat(48) },
      body: JSON.stringify({ ...advertiserPayment, id: 'evt_asaas_advertiser_retry' }),
    });
    expect(distinctDuplicate.status).toBe(200);

    const updatedStore = new VeloStorage(process.env.DATA_FILE_PATH);
    expect(updatedStore.getAdvertiserById(advertiser.id, organization.id)?.prepaidBalance).toBe(112.5);
    expect(updatedStore.getInvoiceById(createdInvoice.id, organization.id)?.status).toBe('paid');
  });
});
