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
