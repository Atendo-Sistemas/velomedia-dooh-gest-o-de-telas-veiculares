import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { VeloStorage } from '../server/storage';

let temporaryDirectory: string | undefined;

afterEach(() => {
  if (temporaryDirectory) fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = undefined;
});

describe('SaaS plan invoice confirmation', () => {
  it('activates the plan and marks its invoice paid idempotently', () => {
    temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'velomedia-plan-payment-'));
    const store = new VeloStorage(path.join(temporaryDirectory, 'store.json'));
    const organization = store.getOrganizations()[0];
    const plan = store.getPlans().find(candidate => candidate.id !== organization.planTier)!;
    const invoice = {
      id: 'plan-payment-test-invoice',
      invoiceNumber: 'PLAN-TEST-1',
      organizationId: organization.id,
      organizationName: organization.name,
      planTier: plan.id,
      purpose: 'saas_plan' as const,
      issueDate: '2026-10-17',
      dueDate: '2026-10-22',
      amount: plan.baseMonthlyFee,
      status: 'pending' as const,
      screensBilled: organization.activeScreensCount,
      paymentMethod: 'pix' as const,
    };
    store.saveInvoice(invoice, organization.id);

    expect(store.confirmPlanInvoicePayment(invoice.id, organization.id, '2026-10-17T00:00:00.000Z')).toBe(true);
    expect(store.getInvoiceById(invoice.id, organization.id)).toMatchObject({ status: 'paid', planTier: plan.id });
    expect(store.getOrganizationById(organization.id)).toMatchObject({ planTier: plan.id, maxScreensLimit: plan.maxScreens });

    expect(store.confirmPlanInvoicePayment(invoice.id, organization.id, '2026-10-18T00:00:00.000Z')).toBe(true);
    expect(store.getInvoiceById(invoice.id, organization.id)?.paidAt).toBe('2026-10-17T00:00:00.000Z');
  });
});

describe('advertiser invoice confirmation', () => {
  it('credits prepaid funds exactly once for duplicate payment confirmations', () => {
    temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'velomedia-advertiser-payment-'));
    const store = new VeloStorage(path.join(temporaryDirectory, 'store.json'));
    const organization = store.getOrganizations()[0];
    const advertiser = { ...store.getAdvertisers(organization.id)[0], prepaidBalance: 12.5 };
    store.saveAdvertiser(advertiser, organization.id);
    const invoice = {
      id: 'advertiser-payment-test-invoice',
      invoiceNumber: 'ADV-TEST-1',
      organizationId: organization.id,
      organizationName: advertiser.companyName,
      advertiserId: advertiser.id,
      purpose: 'advertiser_recharge' as const,
      issueDate: '2026-10-17',
      dueDate: '2026-10-22',
      amount: 100,
      status: 'pending' as const,
      screensBilled: 0,
      paymentMethod: 'pix' as const,
    };
    store.saveInvoice(invoice, organization.id);

    expect(store.confirmAdvertiserInvoicePayment(invoice.id, organization.id, '2026-10-17T00:00:00.000Z')).toBe(true);
    expect(store.confirmAdvertiserInvoicePayment(invoice.id, organization.id, '2026-10-18T00:00:00.000Z')).toBe(true);
    expect(store.getAdvertisers(organization.id).find(item => item.id === advertiser.id)?.prepaidBalance).toBe(112.5);
    expect(store.getInvoiceById(invoice.id, organization.id)).toMatchObject({
      status: 'paid',
      paidAt: '2026-10-17T00:00:00.000Z',
    });
  });

  it('rolls back in-memory balance and invoice state if JSON persistence fails', () => {
    temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'velomedia-advertiser-payment-failure-'));
    const storeFilePath = path.join(temporaryDirectory, 'store.json');
    const store = new VeloStorage(storeFilePath);
    const organization = store.getOrganizations()[0];
    const advertiser = { ...store.getAdvertisers(organization.id)[0], prepaidBalance: 12.5 };
    store.saveAdvertiser(advertiser, organization.id);
    const invoice = {
      id: 'advertiser-payment-failure-test',
      invoiceNumber: 'ADV-TEST-2',
      organizationId: organization.id,
      organizationName: advertiser.companyName,
      advertiserId: advertiser.id,
      purpose: 'advertiser_recharge' as const,
      issueDate: '2026-10-17',
      dueDate: '2026-10-22',
      amount: 100,
      status: 'pending' as const,
      screensBilled: 0,
      paymentMethod: 'pix' as const,
    };
    store.saveInvoice(invoice, organization.id);
    fs.rmSync(storeFilePath);
    fs.mkdirSync(storeFilePath);

    expect(() => store.confirmAdvertiserInvoicePayment(invoice.id, organization.id, '2026-10-17T00:00:00.000Z')).toThrow();
    expect(store.getAdvertisers(organization.id).find(item => item.id === advertiser.id)?.prepaidBalance).toBe(12.5);
    expect(store.getInvoiceById(invoice.id, organization.id)?.status).toBe('pending');
  });
});
