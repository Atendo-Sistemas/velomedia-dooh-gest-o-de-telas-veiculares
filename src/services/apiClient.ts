import type { 
  Campaign, 
  Device, 
  Driver, 
  GeoFence, 
  ProofOfPlayLog, 
  SaaSOrganization, 
  SaaSUser, 
  AdvertiserAccount, 
  SaaSInvoice,
  SaaSPlan,
  SystemAuditLog,
  PublicPlayerBootstrap,
} from '../types';

const API_BASE = '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // Transmit HttpOnly session cookies
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
      else if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const apiClient = {
  // Authentication & Session
  async login(email: string, password: string): Promise<{ user: SaaSUser; organization?: SaaSOrganization }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  async logout(): Promise<{ success: boolean }> {
    return request('/auth/logout', { method: 'POST' });
  },
  async getMe(): Promise<{ authenticated: boolean; user?: SaaSUser; organization?: SaaSOrganization }> {
    return request('/auth/me');
  },
  async changeSuperAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; reauthenticationRequired: boolean }> {
    return request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
  async getSaaSUsers(): Promise<SaaSUser[]> {
    return request<SaaSUser[]>('/users');
  },
  async createSaaSUser(user: SaaSUser, password: string): Promise<SaaSUser> {
    return request<SaaSUser>('/users', {
      method: 'POST',
      body: JSON.stringify({ ...user, password }),
    });
  },
  async updateSaaSUser(user: SaaSUser, password?: string): Promise<SaaSUser> {
    return request<SaaSUser>(`/users/${encodeURIComponent(user.id)}`, {
      method: 'PUT',
      body: JSON.stringify({ ...user, ...(password ? { password } : {}) }),
    });
  },
  async deleteSaaSUser(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  async getPublicPlayer(deviceCode: string): Promise<PublicPlayerBootstrap> {
    return request<PublicPlayerBootstrap>(`/player/${encodeURIComponent(deviceCode)}`);
  },

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
  async getPlans(): Promise<SaaSPlan[]> {
    return request<SaaSPlan[]>('/plans');
  },
  async createPlan(plan: SaaSPlan): Promise<SaaSPlan> {
    return request<SaaSPlan>('/plans', { method: 'POST', body: JSON.stringify(plan) });
  },
  async updatePlan(plan: SaaSPlan): Promise<SaaSPlan> {
    return request<SaaSPlan>(`/plans/${encodeURIComponent(plan.id)}`, {
      method: 'PUT',
      body: JSON.stringify(plan),
    });
  },
  async deletePlan(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/plans/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
  async generatePairingToken(data?: { driverId?: string; screenPosition?: string; hardwareOwnership?: string }): Promise<{ pairingCode: string; expiresInSeconds: number; expiresAt: string }> {
    return request('/devices/pairing-token', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },
  async pairDevice(data: {
    pairingCode: string;
    model: string;
    serialNumber: string;
    screenPosition?: string;
    hardwareOwnership?: string;
  }): Promise<{ success: boolean; device: Device; deviceSecret: string }> {
    return request('/devices/pair', {
      method: 'POST',
      body: JSON.stringify(data),
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
  async deleteCampaign(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/campaigns/${id}`, { method: 'DELETE' });
  },
  async toggleCampaignStatus(campaignId: string): Promise<Campaign> {
    const campaigns = await this.getCampaigns();
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) throw new Error('Campanha não encontrada');
    const updated = { ...campaign, status: (campaign.status === 'active' ? 'paused' : 'active') as Campaign['status'] };
    return this.updateCampaign(updated);
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

  // Proof of Play
  async getProofOfPlayLogs(limit = 100): Promise<ProofOfPlayLog[]> {
    return request<ProofOfPlayLog[]>(`/proof-of-play?limit=${limit}`);
  },
  async submitProofOfPlay(log: any): Promise<{ success: boolean; recorded: boolean; eventId: string }> {
    return request('/proof-of-play', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },
  async recordProofOfPlay(log: any): Promise<{ success: boolean; recorded: boolean; eventId: string }> {
    return this.submitProofOfPlay(log);
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
  async updateAdvertiser(adv: AdvertiserAccount): Promise<AdvertiserAccount> {
    return request<AdvertiserAccount>(`/advertisers/${encodeURIComponent(adv.id)}`, {
      method: 'PUT',
      body: JSON.stringify(adv),
    });
  },
  async deleteAdvertiser(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/advertisers/${id}`, { method: 'DELETE' });
  },
  async getInvoices(): Promise<SaaSInvoice[]> {
    return request<SaaSInvoice[]>('/invoices');
  },
  async createInvoice(invoice: SaaSInvoice): Promise<SaaSInvoice> {
    return request<SaaSInvoice>('/invoices', { method: 'POST', body: JSON.stringify(invoice) });
  },
  async chargeInvoicePix(invoiceId: string): Promise<{
    success: boolean;
    txid: string;
    copiaECola: string;
    qrCodeUrl: string;
    expiresAt?: string;
  }> {
    return request(`/invoices/${encodeURIComponent(invoiceId)}/charge-pix`, {
      method: 'POST',
    });
  },

  // MDM Remote Commands
  async sendRemoteCommand(
    arg: string | { deviceId: string; command: string },
    cmd?: string
  ): Promise<{ success: boolean; commandId: string }> {
    const payload = typeof arg === 'string' ? { deviceId: arg, command: cmd! } : arg;
    return request('/remote-commands', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async acknowledgeRemoteCommand(commandId: string): Promise<{ success: boolean }> {
    return request(`/remote-commands/${commandId}/acknowledge`, {
      method: 'POST',
    });
  },

  // Audit Logs
  async getAuditLogs(limit = 100): Promise<SystemAuditLog[]> {
    return request<SystemAuditLog[]>(`/audit-logs?limit=${limit}`);
  },
};
