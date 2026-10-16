import { afterEach, describe, expect, it } from 'vitest';
import express from 'express';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { VeloStorage } from '../server/storage';

const environmentKeys = ['NODE_ENV', 'DATA_FILE_PATH', 'PIX_GATEWAY_PROVIDER', 'ASAAS_WEBHOOK_TOKEN'];
const originalEnvironment = new Map(environmentKeys.map(key => [key, process.env[key]]));
let temporaryDirectory: string | undefined;
let activeServer: ReturnType<typeof createServer> | undefined;

afterEach(async () => {
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

    const { apiRouter } = await import('../server/api');
    const app = express();
    app.use(express.json());
    app.use('/api/v1', apiRouter);
    activeServer = createServer(app);
    await new Promise<void>(resolve => activeServer!.listen(0, '127.0.0.1', () => resolve()));
    const { port } = activeServer.address() as AddressInfo;
    const url = `http://127.0.0.1:${port}/api/v1/webhooks/asaas`;
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
  });
});
