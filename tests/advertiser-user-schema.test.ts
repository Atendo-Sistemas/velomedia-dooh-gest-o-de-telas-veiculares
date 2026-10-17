import { describe, expect, it } from 'vitest';
import { SaaSUserSchema } from '../server/schemas';

const user = {
  id: 'user-1',
  name: 'Advertiser User',
  email: 'advertiser@example.com',
  phone: '',
  role: 'advertiser',
  organizationId: 'org-1',
  organizationName: 'Organization',
  status: 'active',
  createdAt: '2026-10-17',
  permissions: [],
};

describe('advertiser user association', () => {
  it('requires an advertiser account for advertiser-role users', () => {
    expect(SaaSUserSchema.safeParse(user).success).toBe(false);
    expect(SaaSUserSchema.safeParse({ ...user, advertiserId: 'adv-1' }).success).toBe(true);
  });

  it('does not allow advertiser account associations on other roles', () => {
    expect(SaaSUserSchema.safeParse({ ...user, role: 'fleet_manager', advertiserId: 'adv-1' }).success).toBe(false);
    expect(SaaSUserSchema.safeParse({ ...user, role: 'fleet_manager' }).success).toBe(true);
  });
});
