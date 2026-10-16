import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Campaign, Device, Driver, ProofOfPlayLog } from '../src/types';
import { PostgresRepository } from '../server/postgres-repository';

const testDatabaseUrl = process.env.VELOMEDIA_TEST_DATABASE_URL;
const integration = testDatabaseUrl ? describe : describe.skip;

integration('PostgresRepository integration', () => {
  if (testDatabaseUrl && !new URL(testDatabaseUrl).pathname.toLowerCase().includes('test')) {
    throw new Error('VELOMEDIA_TEST_DATABASE_URL must point to a database with "test" in its name.');
  }
  const repo = new PostgresRepository(testDatabaseUrl || 'postgresql://localhost/velomedia_test');

  beforeAll(async () => repo.initialize({ bootstrapAdmin: false }));
  beforeEach(async () => {
    await repo.pool.query('TRUNCATE repository_records, pairing_tokens, anti_replay_nonces');
  });
  afterAll(async () => repo.close());

  it('consumes each pairing token once, even across concurrent requests', async () => {
    const token = randomUUID();
    await repo.createPairingToken({
      token, organizationId: 'org_test', screenPosition: 'headrest_right',
      hardwareOwnership: 'driver_byod', expiresAt: Date.now() + 60_000,
      used: false, createdAt: new Date().toISOString(),
    });

    const consumed = await Promise.all([
      repo.consumePairingToken(token),
      repo.consumePairingToken(token),
    ]);
    expect(consumed.filter(Boolean)).toHaveLength(1);
  });

  it('returns a tenant-filtered, display-safe public player bootstrap by exact device code', async () => {
    const tenant = `org_${randomUUID()}`;
    const otherTenant = `org_${randomUUID()}`;
    const code = `TV-${randomUUID().slice(0, 8)}`;
    await repo.saveDevice({
      id: `device_${randomUUID()}`,
      code,
      model: 'Public model',
      screenPosition: 'headrest_right',
      status: 'online',
      driverId: 'private-driver',
      driverName: 'Private driver',
      carPlate: 'PRIVATE',
      serialNumber: 'PRIVATE-SERIAL',
      currentLocation: { lat: 12, lng: 34, city: 'Private city', neighborhood: 'Private neighborhood' },
      telemetry: { batteryVoltage: 12 },
    } as Device, tenant);
    const campaign = (name: string, organizationId: string, status: Campaign['status'], priority: number) => ({
      id: `${name}_${randomUUID()}`,
      name,
      organizationId,
      advertiser: 'Public advertiser',
      logo: '/ad.png',
      category: 'retail',
      status,
      priority,
      budgetTotal: 1000,
      budgetSpent: 1,
      totalImpressions: 1,
      targetGeoFences: ['all'],
      creative: { id: 'creative', title: 'Public creative', mediaUrl: '/ad.mp4', durationSeconds: 15 },
      schedule: { startDate: '2026-01-01', endDate: '2026-12-31', daysOfWeek: [], timeSlots: [] },
    }) as Campaign;
    await repo.saveCampaign(campaign('active-own', tenant, 'active', 1), tenant);
    await repo.saveCampaign(campaign('paused-own', tenant, 'paused', 100), tenant);
    await repo.saveCampaign(campaign('active-other', otherTenant, 'active', 100), otherTenant);

    const result = await repo.getPublicPlayerBootstrap(code);
    expect(result?.device).toEqual({
      id: expect.any(String),
      code,
      model: 'Public model',
      screenPosition: 'headrest_right',
      status: 'online',
    });
    expect(result?.campaigns.map(item => item.name)).toEqual(['active-own']);
    expect(result?.geoFences).toEqual([]);
    expect(JSON.stringify(result)).not.toContain('PRIVATE');
    expect(await repo.getPublicPlayerBootstrap('missing-code')).toBeUndefined();
  });

  it('isolates tenant lookups and commits PoP counters with replay protection', async () => {
    const orgId = `org_${randomUUID()}`;
    const campaignId = `campaign_${randomUUID()}`;
    const deviceId = `device_${randomUUID()}`;
    const driverId = `driver_${randomUUID()}`;
    const campaign = {
      id: campaignId, name: 'Test', advertiser: 'Test', logo: '', category: 'retail',
      budgetTotal: 100, budgetSpent: 0, cpm: 200, status: 'active',
      creative: {}, targetGeoFences: [], schedule: {}, totalImpressions: 0,
      totalInteractions: 0, totalScans: 0, targetImpressions: 1, priority: 1,
    } as Campaign;
    const device = {
      id: deviceId, code: deviceId, driverId, hardwareOwnership: 'driver_byod',
      totalImpressionsToday: 0, totalInteractionsToday: 0,
    } as Device;
    const driver = { id: driverId, totalEarningsMonth: 0, pendingBalance: 0 } as Driver;
    await repo.saveCampaign(campaign, orgId);
    await repo.saveDevice(device, orgId);
    await repo.saveDriver(driver, orgId);
    expect(await repo.getCampaignById(campaignId, 'another_org')).toBeUndefined();

    const now = new Date().toISOString();
    const log = {
      id: `event_${randomUUID()}`, organizationId: orgId, timestamp: now,
      startedAt: now, endedAt: now, deviceId, campaignId, campaignName: 'Test',
      advertiser: 'Test', durationWatchedSec: 1,
      location: { lat: 0, lng: 0, city: '', neighborhood: '' },
      interacted: true, verifiedHash: 'signature', nonce: randomUUID(), syncedOnline: true,
    } as ProofOfPlayLog;
    const results = await Promise.all([
      repo.recordProofOfPlayAndReplay(log, orgId),
      repo.recordProofOfPlayAndReplay(log, orgId),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await repo.getCampaignById(campaignId, orgId))?.totalImpressions).toBe(1);
    expect((await repo.getDeviceById(deviceId, orgId))?.totalInteractionsToday).toBe(1);
    expect((await repo.getDriverById(driverId, orgId))?.pendingBalance).toBe(0.09);
  });
});
