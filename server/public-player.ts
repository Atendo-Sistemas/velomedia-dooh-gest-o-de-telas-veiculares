import type { Campaign, Device, GeoFence, PublicPlayerBootstrap } from '../src/types';
export type { PublicPlayerBootstrap } from '../src/types';

function campaignMatchesDeviceArea(campaign: Campaign, device: Device, geoFences: GeoFence[]): boolean {
  const targetIds = campaign.targetGeoFences || [];
  if (targetIds.length === 0 || targetIds.includes('all')) return true;
  const location = device.currentLocation;
  if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) return false;
  return geoFences.some(fence => {
    if (!targetIds.includes(fence.id)) return false;
    const lat1 = location.lat * Math.PI / 180;
    const lat2 = fence.center.lat * Math.PI / 180;
    const dLat = lat2 - lat1;
    const dLng = (fence.center.lng - location.lng) * Math.PI / 180;
    const haversine = Math.min(
      1,
      Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2,
    );
    const distanceKm = 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    return distanceKm <= fence.radiusKm;
  });
}

export function projectPublicPlayer(device: Device, campaigns: Campaign[], geoFences: GeoFence[] = []): PublicPlayerBootstrap {
  return {
    device: {
      id: device.id,
      code: device.code,
      model: device.model,
      screenPosition: device.screenPosition,
      status: device.status,
    },
    campaigns: campaigns
      .filter(campaign => campaign.status === 'active')
      .filter(campaign => campaignMatchesDeviceArea(campaign, device, geoFences))
      .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id))
      .map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        advertiser: campaign.advertiser,
        creative: campaign.creative,
        schedule: { endDate: campaign.schedule.endDate },
      })),
    geoFences: [],
  };
}
