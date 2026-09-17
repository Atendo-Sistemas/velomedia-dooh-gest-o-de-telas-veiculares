import type { 
  Campaign, 
  Device, 
  Driver, 
  GeoFence, 
  ProofOfPlayLog, 
  SaaSOrganization, 
  SaaSUser, 
  AdvertiserAccount, 
  SaaSInvoice 
} from '../types';

const API_BASE = '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.message) errorMsg = errJson.message;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const apiClient = {
  // Organizations
  async getOrganizations(): Promise<SaaSOrganization[]> {
    return request<SaaSOrganization[]>('/organizations');
  },
  async saveOrganization(org: SaaSOrganization): Promise<SaaSOrganization> {
    return request<SaaSOrganization>('/organizations', {
      method: 'POST',
      body: JSON.stringify(org),
    });
  },
  async updateOrganization(org: SaaSOrganization): Promise<SaaSOrganization> {
    return request<SaaSOrganization>(`/organizations/${org.id}`, {
      method: 'PUT',
      body: JSON.stringify(org),
    });
  },
  async deleteOrganization(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/organizations/${id}`, { method: 'DELETE' });
  },

  // Drivers
  async getDrivers(): Promise<Driver[]> {
    return request<Driver[]>('/drivers');
  },
  async saveDriver(driver: Driver): Promise<Driver> {
    return request<Driver>('/drivers', {
      method: 'POST',
      body: JSON.stringify(driver),
    });
  },
  async updateDriver(driver: Driver): Promise<Driver> {
    return request<Driver>(`/drivers/${driver.id}`, {
      method: 'PUT',
      body: JSON.stringify(driver),
    });
  },
  async deleteDriver(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/drivers/${id}`, { method: 'DELETE' });
  },
  async payoutDriverPix(driverId: string): Promise<{ success: boolean; paidAmount: number }> {
    return request<{ success: boolean; paidAmount: number }>(`/drivers/${driverId}/payout`, {
      method: 'POST',
    });
  },

  // Devices
  async getDevices(): Promise<Device[]> {
    return request<Device[]>('/devices');
  },
  async saveDevice(device: Device): Promise<Device> {
    return request<Device>('/devices', {
      method: 'POST',
      body: JSON.stringify(device),
    });
  },
  async updateDevice(device: Device): Promise<Device> {
    return request<Device>(`/devices/${device.id}`, {
      method: 'PUT',
      body: JSON.stringify(device),
    });
  },
  async deleteDevice(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/devices/${id}`, { method: 'DELETE' });
  },
  async createPairToken(params: {
    driverId: string;
    screenPosition: string;
    hardwareOwnership: string;
  }): Promise<{ token: string; expiresAt: string; expiresInSeconds: number }> {
    return request('/devices/pair-token', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
  async pairDeviceKiosk(params: {
    token: string;
    serialNumber?: string;
    model?: string;
    macAddress?: string;
  }): Promise<{ success: boolean; deviceId: string; deviceCode: string; deviceSecret: string }> {
    return request('/devices/pair', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
  async sendRemoteCommand(deviceId: string, command: string): Promise<{ success: boolean; commandId: string }> {
    return request(`/devices/${deviceId}/command`, {
      method: 'POST',
      body: JSON.stringify({ command }),
    });
  },

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return request<Campaign[]>('/campaigns');
  },
  async saveCampaign(campaign: Campaign): Promise<Campaign> {
    return request<Campaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaign),
    });
  },
  async updateCampaign(campaign: Campaign): Promise<Campaign> {
    return request<Campaign>(`/campaigns/${campaign.id}`, {
      method: 'PUT',
      body: JSON.stringify(campaign),
    });
  },
  async toggleCampaignStatus(campaignId: string): Promise<Campaign> {
    return request<Campaign>(`/campaigns/${campaignId}/status`, {
      method: 'PATCH',
    });
  },
  async deleteCampaign(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/campaigns/${id}`, { method: 'DELETE' });
  },

  // GeoFences
  async getGeoFences(): Promise<GeoFence[]> {
    return request<GeoFence[]>('/geofences');
  },
  async saveGeoFence(geofence: GeoFence): Promise<GeoFence> {
    return request<GeoFence>('/geofences', {
      method: 'POST',
      body: JSON.stringify(geofence),
    });
  },
  async updateGeoFence(geofence: GeoFence): Promise<GeoFence> {
    return request<GeoFence>(`/geofences/${geofence.id}`, {
      method: 'PUT',
      body: JSON.stringify(geofence),
    });
  },
  async deleteGeoFence(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/geofences/${id}`, { method: 'DELETE' });
  },

  // Telemetry & Proof of Play
  async sendHeartbeat(data: {
    deviceId: string;
    batteryVoltage?: number;
    cpuTemp?: number;
    signalStrength?: string;
    lat?: number;
    lng?: number;
    speedKmH?: number;
  }): Promise<{ success: boolean }> {
    return request('/telemetry/heartbeat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async recordProofOfPlay(log: ProofOfPlayLog | ProofOfPlayLog[]): Promise<{ success: boolean; count: number }> {
    return request('/proof-of-play/log', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },
  async getProofOfPlayLogs(limit = 100): Promise<ProofOfPlayLog[]> {
    return request<ProofOfPlayLog[]>(`/proof-of-play/logs?limit=${limit}`);
  },
  async verifyProofOfPlay(data: {
    eventId: string;
    deviceId: string;
    campaignId: string;
    signature: string;
  }): Promise<{ verified: boolean; algorithm: string }> {
    return request('/proof-of-play/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Advertisers & Billing
  async getAdvertisers(): Promise<AdvertiserAccount[]> {
    return request<AdvertiserAccount[]>('/advertisers');
  },
  async saveAdvertiser(adv: AdvertiserAccount): Promise<AdvertiserAccount> {
    return request<AdvertiserAccount>('/advertisers', {
      method: 'POST',
      body: JSON.stringify(adv),
    });
  },
  async getInvoices(): Promise<SaaSInvoice[]> {
    return request<SaaSInvoice[]>('/billing/invoices');
  },
  async generateInvoicePix(invoiceId: string): Promise<any> {
    return request(`/billing/invoices/${invoiceId}/generate-pix`, {
      method: 'POST',
    });
  },
};
