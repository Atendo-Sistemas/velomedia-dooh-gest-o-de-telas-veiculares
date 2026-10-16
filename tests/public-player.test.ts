import { describe, expect, it } from 'vitest';
import type { Campaign, Device, GeoFence } from '../src/types';
import { projectPublicPlayer } from '../server/public-player';

describe('public player projection', () => {
  it('returns only display-safe device fields and active campaign creative data', () => {
    const device = {
      id: 'device-1',
      code: 'TV-SP-0001',
      model: 'Display',
      screenPosition: 'headrest_right',
      status: 'online',
      organizationId: 'org-private',
      serialNumber: 'serial-private',
      driverName: 'Driver private',
      carPlate: 'plate-private',
      currentLocation: { lat: -23.5, lng: -46.6, city: 'private', neighborhood: 'private' },
      telemetry: { batteryVoltage: 12 },
      deviceSecret: 'secret-private',
    } as unknown as Device;
    const campaign = (id: string, status: Campaign['status'], priority: number) => ({
      id,
      organizationId: 'org-private',
      name: id,
      advertiser: 'Public advertiser',
      logo: '/creative-logo.png',
      category: 'retail',
      status,
      priority,
      budgetTotal: 1000,
      budgetSpent: 50,
      totalImpressions: 10,
      targetGeoFences: ['private-geofence'],
      creative: { id: 'creative', title: 'Public creative', mediaUrl: '/ad.mp4', durationSeconds: 15 },
      schedule: { endDate: '2026-12-31', startDate: '2026-01-01', daysOfWeek: [], timeSlots: [] },
    }) as Campaign;

    const result = projectPublicPlayer(
      device,
      [
        campaign('paused', 'paused', 100),
        campaign('lower', 'active', 1),
        campaign('higher', 'active', 5),
      ],
      [{ id: 'private-geofence', center: { lat: -23.5, lng: -46.6 }, radiusKm: 5 } as GeoFence],
    );

    expect(result.device).toEqual({
      id: 'device-1',
      code: 'TV-SP-0001',
      model: 'Display',
      screenPosition: 'headrest_right',
      status: 'online',
    });
    expect(result.campaigns.map(item => item.id)).toEqual(['higher', 'lower']);
    expect(result.campaigns[0]).not.toHaveProperty('budgetTotal');
    expect(result.campaigns[0]).not.toHaveProperty('organizationId');
    expect(result.geoFences).toEqual([]);
    const serialized = JSON.stringify(result);
    for (const privateValue of ['private', 'serial-private', 'secret-private', 'batteryVoltage']) {
      expect(serialized).not.toContain(privateValue);
    }
  });
});
