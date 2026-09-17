import { Campaign, Device, GeoFence, ProofOfPlayLog } from '../types';
import { INITIAL_CAMPAIGNS, INITIAL_DEVICES, INITIAL_GEOFENCES } from '../data/mockData';

// Haversine formula to compute distance between 2 coordinates in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find matched geofences for a location
export function getMatchingGeoFences(lat: number, lng: number, geoFences: GeoFence[]): GeoFence[] {
  return geoFences.filter((gf) => {
    const dist = calculateDistanceKm(lat, lng, gf.center.lat, gf.center.lng);
    return dist <= gf.radiusKm;
  });
}

// Check if a campaign matches the device context
export function isCampaignEligible(
  campaign: Campaign,
  device: Device,
  geoFences: GeoFence[],
  currentHour: number = new Date().getHours(),
  currentDay: number = new Date().getDay()
): boolean {
  if (campaign.status !== 'active') return false;

  // 1. Time Slot check
  if (campaign.schedule.timeSlots && campaign.schedule.timeSlots.length > 0) {
    const matchHour = campaign.schedule.timeSlots.some(
      (slot) => currentHour >= slot.startHour && currentHour < slot.endHour
    );
    if (!matchHour) return false;
  }

  // 2. Day of week check
  if (campaign.schedule.daysOfWeek && campaign.schedule.daysOfWeek.length > 0) {
    if (!campaign.schedule.daysOfWeek.includes(currentDay)) return false;
  }

  // 3. Geofence matching
  if (!campaign.targetGeoFences.includes('all')) {
    const matchingGfs = getMatchingGeoFences(
      device.currentLocation.lat,
      device.currentLocation.lng,
      geoFences
    );
    const hasMatchingGeofence = matchingGfs.some((gf) =>
      campaign.targetGeoFences.includes(gf.id)
    );
    if (!hasMatchingGeofence) return false;
  }

  return true;
}

export function pickBestCampaign(
  device: Device,
  campaigns: Campaign[],
  geoFences: GeoFence[]
): Campaign {
  const eligible = campaigns.filter((c) => isCampaignEligible(c, device, geoFences));
  if (eligible.length === 0) {
    // Fallback to highest priority active campaign or first
    const active = campaigns.filter((c) => c.status === 'active');
    return active[0] || campaigns[0];
  }
  // Sort by priority desc
  eligible.sort((a, b) => b.priority - a.priority);
  return eligible[0];
}

// Real Cryptographic SHA-256 calculation for Proof of Play (PoP) audit log
export function generateProofOfPlayHash(deviceId: string, campaignId: string, timestamp: string, nonce?: string): string {
  const secretKey = 'VELO_VERIFIED_SIGNATURE_2026';
  const effectiveNonce = nonce || `nonce_${Date.now()}`;
  const str = `${deviceId}:${campaignId}:${timestamp}:${effectiveNonce}:${secretKey}`;
  
  // Real SHA-256 implementation for universal browser/worker environments
  function sha256(ascii: string): string {
    function rightRotate(value: number, amount: number) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let lengthProperty = 'length';
    let i, j;
    let result = '';
    const words: number[] = [];
    const asciiBitLength = ascii[lengthProperty] * 8;
    
    let hash: number[] = [];
    const k: number[] = [];
    let primeCounter = 0;

    const isPrime: Record<number, boolean> = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isPrime[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isPrime[i] = true;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    
    ascii += '\x80';
    while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return '';
      words[i >> 2] |= j << (((3 - i) % 4) * 8);
    }
    words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
    words[words[lengthProperty]] = asciiBitLength;
    
    for (j = 0; j < words[lengthProperty]; ) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash;
      hash = hash.slice(0, 8);
      
      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15],
          w2 = w[i - 2];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
        const temp1 =
          hash[7] +
          (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
          ch +
          k[i] +
          (w[i] =
            i < 16
              ? w[i]
              : (w[i - 16] + s0 + w[i - 7] + s1) | 0);
        const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        const temp2 =
          (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) +
          maj;
        
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }
    
    for (i = 0; i < 8; i++) {
      for (let b = 3; b >= 0; b--) {
        const byte = (hash[i] >> (b * 8)) & 255;
        result += (byte < 16 ? '0' : '') + byte.toString(16);
      }
    }
    return result;
  }

  return sha256(str);
}

export interface TelemetryState {
  devices: Device[];
  campaigns: Campaign[];
  geoFences: GeoFence[];
  proofOfPlayLogs: ProofOfPlayLog[];
  isSimulatingOnline: boolean;
  activeDeviceIdForPlayer: string;
}

export const INITIAL_PROOF_OF_PLAY: ProofOfPlayLog[] = [
  {
    id: 'pop_849201',
    timestamp: '2026-08-24 09:28:45',
    deviceId: 'dev_01',
    campaignId: 'cmp_nubank_ultravioleta',
    campaignName: 'Nubank Ultravioleta - Alta Renda',
    advertiser: 'Nubank Brasil',
    durationWatchedSec: 15,
    location: {
      lat: -23.561684,
      lng: -46.655981,
      neighborhood: 'Bela Vista / Av. Paulista',
      city: 'São Paulo',
      address: 'Av. Paulista, 1578 (Masp)',
    },
    interacted: true,
    interactionType: 'qr_scan',
    verifiedHash: '0x8f4c2193b2a9...d9a',
    syncedOnline: true,
  },
  {
    id: 'pop_849202',
    timestamp: '2026-08-24 09:29:10',
    deviceId: 'dev_03',
    campaignId: 'cmp_ifood_gourmet',
    campaignName: 'iFood Gourmet - Jantar Perfeito',
    advertiser: 'iFood Brasil',
    durationWatchedSec: 15,
    location: {
      lat: -23.585556,
      lng: -46.681111,
      neighborhood: 'Itaim Bibi / Faria Lima',
      city: 'São Paulo',
      address: 'Av. Brigadeiro Faria Lima, 3477',
    },
    interacted: true,
    interactionType: 'card_tap',
    verifiedHash: '0x3e17b841a0e1...d9a',
    syncedOnline: true,
  },
  {
    id: 'pop_849203',
    timestamp: '2026-08-24 09:30:02',
    deviceId: 'dev_04',
    campaignId: 'cmp_heineken_zero',
    campaignName: 'Heineken 0.0 - Volta da Balada',
    advertiser: 'Heineken Global',
    durationWatchedSec: 15,
    location: {
      lat: -23.555278,
      lng: -46.689722,
      neighborhood: 'Vila Madalena',
      city: 'São Paulo',
      address: 'Rua Fradique Coutinho, 1200',
    },
    interacted: false,
    verifiedHash: '0x99a2c34ff102...d9a',
    syncedOnline: true,
  },
  {
    id: 'pop_849204',
    timestamp: '2026-08-24 09:31:18',
    deviceId: 'dev_05',
    campaignId: 'cmp_localiza_empresas',
    campaignName: 'Localiza Meoo - Frotas & Aeroportos',
    advertiser: 'Localiza & Co',
    durationWatchedSec: 15,
    location: {
      lat: -23.627778,
      lng: -46.656944,
      neighborhood: 'Aeroporto de Congonhas',
      city: 'São Paulo',
      address: 'Av. Washington Luís, Terminal 1',
    },
    interacted: true,
    interactionType: 'qr_scan',
    verifiedHash: '0x4b78912eac55...d9a',
    syncedOnline: true,
  }
];
