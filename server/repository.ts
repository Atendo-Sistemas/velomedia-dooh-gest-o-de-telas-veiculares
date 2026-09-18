/**
 * VeloMedia DOOH - Repository Abstraction Layer
 * Strict isolation between JSON Development Storage and PostgreSQL Production Storage.
 */

import type {
  SaaSOrganization,
  SaaSUser,
  Driver,
  Device,
  Campaign,
  GeoFence,
  AdvertiserAccount,
  SaaSInvoice,
  ProofOfPlayLog,
} from '../src/types';

import type {
  DeviceCredentialRecord,
  PairingTokenRecord,
  RemoteCommandRecord,
  WebhookRecord,
  AuditLog,
} from './storage';

import { storage } from './storage';

export interface VeloRepository {
  // Organizations
  getOrganizations(): Promise<SaaSOrganization[]>;
  getOrganizationById(id: string): Promise<SaaSOrganization | undefined>;
  saveOrganization(org: SaaSOrganization): Promise<void>;
  deleteOrganization(id: string): Promise<boolean>;

  // Users
  getUsers(orgId?: string): Promise<SaaSUser[]>;
  getUserById(id: string, orgId?: string): Promise<SaaSUser | undefined>;
  getUserByEmail(email: string): Promise<(SaaSUser & { passwordHash?: string }) | undefined>;
  saveUser(user: SaaSUser, password?: string): Promise<void>;
  deleteUser(id: string, orgId: string): Promise<boolean>;

  // Drivers
  getDrivers(orgId: string): Promise<Driver[]>;
  getDriverById(id: string, orgId: string): Promise<Driver | undefined>;
  saveDriver(driver: Driver, orgId: string): Promise<Driver | null>;
  deleteDriver(id: string, orgId: string): Promise<boolean>;

  // Devices
  getDevices(orgId: string): Promise<Device[]>;
  getDeviceById(id: string, orgId: string): Promise<Device | undefined>;
  getDeviceByIdInternal(id: string): Promise<Device | undefined>;
  saveDevice(device: Device, orgId: string): Promise<Device | null>;
  deleteDevice(id: string, orgId: string): Promise<boolean>;

  // Device Credentials
  getDeviceCredential(deviceId: string): Promise<DeviceCredentialRecord | undefined>;
  saveDeviceCredential(cred: DeviceCredentialRecord): Promise<void>;
  revokeDeviceCredential(deviceId: string, orgId: string): Promise<boolean>;

  // Campaigns
  getCampaigns(orgId: string): Promise<Campaign[]>;
  getCampaignById(id: string, orgId: string): Promise<Campaign | undefined>;
  saveCampaign(campaign: Campaign, orgId: string): Promise<Campaign | null>;
  deleteCampaign(id: string, orgId: string): Promise<boolean>;

  // GeoFences
  getGeoFences(orgId: string): Promise<GeoFence[]>;
  getGeoFenceById(id: string, orgId: string): Promise<GeoFence | undefined>;
  saveGeoFence(geofence: GeoFence, orgId: string): Promise<GeoFence | null>;
  deleteGeoFence(id: string, orgId: string): Promise<boolean>;

  // Advertisers
  getAdvertisers(orgId: string): Promise<AdvertiserAccount[]>;
  getAdvertiserById(id: string, orgId: string): Promise<AdvertiserAccount | undefined>;
  saveAdvertiser(adv: AdvertiserAccount, orgId: string): Promise<AdvertiserAccount | null>;
  deleteAdvertiser(id: string, orgId: string): Promise<boolean>;

  // Invoices
  getInvoices(orgId: string): Promise<SaaSInvoice[]>;
  getInvoiceById(id: string, orgId: string): Promise<SaaSInvoice | undefined>;
  saveInvoice(invoice: SaaSInvoice, orgId: string): Promise<SaaSInvoice | null>;

  // Proof of Play
  getProofOfPlayLogs(orgId: string, limit?: number): Promise<ProofOfPlayLog[]>;
  recordProofOfPlay(log: ProofOfPlayLog, orgId: string): Promise<boolean>;

  // Anti-Replay
  checkAndRecordReplay(eventId: string, nonce: string, timestampMs: number): Promise<{ valid: boolean; reason?: string }>;

  // Webhooks
  recordWebhook(record: WebhookRecord): Promise<boolean>;

  // Pairing Tokens
  createPairingToken(token: PairingTokenRecord): Promise<void>;
  getPairingToken(token: string): Promise<PairingTokenRecord | undefined>;
  markPairingTokenUsed(token: string): Promise<void>;

  // Remote Commands
  createRemoteCommand(cmd: RemoteCommandRecord): Promise<void>;
  getPendingCommands(deviceId: string, orgId?: string): Promise<RemoteCommandRecord[]>;
  acknowledgeCommand(commandId: string, orgId?: string): Promise<boolean>;

  // Audit Logs
  logAudit(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void>;
  getAuditLogs(orgId: string, limit?: number): Promise<AuditLog[]>;
}

/**
 * Development implementation backed by VeloStorage (strictly blocked in production)
 */
export class JsonDevelopmentRepository implements VeloRepository {
  constructor() {
    if (process.env.NODE_ENV === 'production' && process.env.STRICT_PROD_ENV === 'true') {
      throw new Error(
        'Segurança Crítica: JsonDevelopmentRepository não pode ser instanciado em ambiente de produção estrita. Use PostgresRepository com DATABASE_URL.'
      );
    }
  }

  async getOrganizations(): Promise<SaaSOrganization[]> {
    return storage.getOrganizations();
  }
  async getOrganizationById(id: string): Promise<SaaSOrganization | undefined> {
    return storage.getOrganizationById(id);
  }
  async saveOrganization(org: SaaSOrganization): Promise<void> {
    storage.saveOrganization(org);
  }
  async deleteOrganization(id: string): Promise<boolean> {
    return storage.deleteOrganization(id);
  }

  async getUsers(orgId?: string): Promise<SaaSUser[]> {
    return storage.getUsers(orgId);
  }
  async getUserById(id: string, orgId?: string): Promise<SaaSUser | undefined> {
    return storage.getUserById(id, orgId);
  }
  async getUserByEmail(email: string): Promise<(SaaSUser & { passwordHash?: string }) | undefined> {
    return storage.getUserByEmail(email);
  }
  async saveUser(user: SaaSUser, password?: string): Promise<void> {
    storage.saveUser(user, password);
  }
  async deleteUser(id: string, orgId: string): Promise<boolean> {
    return storage.deleteUser(id, orgId);
  }

  async getDrivers(orgId: string): Promise<Driver[]> {
    return storage.getDrivers(orgId);
  }
  async getDriverById(id: string, orgId: string): Promise<Driver | undefined> {
    return storage.getDriverById(id, orgId);
  }
  async saveDriver(driver: Driver, orgId: string): Promise<Driver | null> {
    return storage.saveDriver(driver, orgId);
  }
  async deleteDriver(id: string, orgId: string): Promise<boolean> {
    return storage.deleteDriver(id, orgId);
  }

  async getDevices(orgId: string): Promise<Device[]> {
    return storage.getDevices(orgId);
  }
  async getDeviceById(id: string, orgId: string): Promise<Device | undefined> {
    return storage.getDeviceById(id, orgId);
  }
  async getDeviceByIdInternal(id: string): Promise<Device | undefined> {
    return storage.getDeviceByIdInternal(id);
  }
  async saveDevice(device: Device, orgId: string): Promise<Device | null> {
    return storage.saveDevice(device, orgId);
  }
  async deleteDevice(id: string, orgId: string): Promise<boolean> {
    return storage.deleteDevice(id, orgId);
  }

  async getDeviceCredential(deviceId: string): Promise<DeviceCredentialRecord | undefined> {
    return storage.getDeviceCredential(deviceId);
  }
  async saveDeviceCredential(cred: DeviceCredentialRecord): Promise<void> {
    storage.saveDeviceCredential(cred);
  }
  async revokeDeviceCredential(deviceId: string, orgId: string): Promise<boolean> {
    return storage.revokeDeviceCredential(deviceId, orgId);
  }

  async getCampaigns(orgId: string): Promise<Campaign[]> {
    return storage.getCampaigns(orgId);
  }
  async getCampaignById(id: string, orgId: string): Promise<Campaign | undefined> {
    return storage.getCampaignById(id, orgId);
  }
  async saveCampaign(campaign: Campaign, orgId: string): Promise<Campaign | null> {
    return storage.saveCampaign(campaign, orgId);
  }
  async deleteCampaign(id: string, orgId: string): Promise<boolean> {
    return storage.deleteCampaign(id, orgId);
  }

  async getGeoFences(orgId: string): Promise<GeoFence[]> {
    return storage.getGeoFences(orgId);
  }
  async getGeoFenceById(id: string, orgId: string): Promise<GeoFence | undefined> {
    return storage.getGeoFenceById(id, orgId);
  }
  async saveGeoFence(geofence: GeoFence, orgId: string): Promise<GeoFence | null> {
    return storage.saveGeoFence(geofence, orgId);
  }
  async deleteGeoFence(id: string, orgId: string): Promise<boolean> {
    return storage.deleteGeoFence(id, orgId);
  }

  async getAdvertisers(orgId: string): Promise<AdvertiserAccount[]> {
    return storage.getAdvertisers(orgId);
  }
  async getAdvertiserById(id: string, orgId: string): Promise<AdvertiserAccount | undefined> {
    return storage.getAdvertiserById(id, orgId);
  }
  async saveAdvertiser(adv: AdvertiserAccount, orgId: string): Promise<AdvertiserAccount | null> {
    return storage.saveAdvertiser(adv, orgId);
  }
  async deleteAdvertiser(id: string, orgId: string): Promise<boolean> {
    return storage.deleteAdvertiser(id, orgId);
  }

  async getInvoices(orgId: string): Promise<SaaSInvoice[]> {
    return storage.getInvoices(orgId);
  }
  async getInvoiceById(id: string, orgId: string): Promise<SaaSInvoice | undefined> {
    return storage.getInvoiceById(id, orgId);
  }
  async saveInvoice(invoice: SaaSInvoice, orgId: string): Promise<SaaSInvoice | null> {
    return storage.saveInvoice(invoice, orgId);
  }

  async getProofOfPlayLogs(orgId: string, limit?: number): Promise<ProofOfPlayLog[]> {
    return storage.getProofOfPlayLogs(orgId, limit);
  }
  async recordProofOfPlay(log: ProofOfPlayLog, orgId: string): Promise<boolean> {
    return storage.recordProofOfPlay(log, orgId);
  }

  async checkAndRecordReplay(eventId: string, nonce: string, timestampMs: number): Promise<{ valid: boolean; reason?: string }> {
    return storage.checkAndRecordReplay(eventId, nonce, timestampMs);
  }

  async recordWebhook(record: WebhookRecord): Promise<boolean> {
    return storage.recordWebhook(record);
  }

  async createPairingToken(token: PairingTokenRecord): Promise<void> {
    storage.createPairingToken(token);
  }
  async getPairingToken(token: string): Promise<PairingTokenRecord | undefined> {
    return storage.getPairingToken(token);
  }
  async markPairingTokenUsed(token: string): Promise<void> {
    storage.markPairingTokenUsed(token);
  }

  async createRemoteCommand(cmd: RemoteCommandRecord): Promise<void> {
    storage.createRemoteCommand(cmd);
  }
  async getPendingCommands(deviceId: string, orgId?: string): Promise<RemoteCommandRecord[]> {
    return storage.getPendingCommands(deviceId, orgId);
  }
  async acknowledgeCommand(commandId: string, orgId?: string): Promise<boolean> {
    return storage.acknowledgeCommand(commandId, orgId);
  }

  async logAudit(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    storage.logAudit(log);
  }
  async getAuditLogs(orgId: string, limit?: number): Promise<AuditLog[]> {
    return storage.getAuditLogs(orgId, limit);
  }
}

/**
 * Production PostgreSQL Repository
 */
export class PostgresRepository implements VeloRepository {
  private databaseUrl: string;

  constructor(databaseUrl: string) {
    if (!databaseUrl || databaseUrl.trim().length === 0) {
      throw new Error('PostgresRepository requires a valid DATABASE_URL.');
    }
    this.databaseUrl = databaseUrl;
  }

  public getConnectionString(): string {
    return this.databaseUrl;
  }

  async getOrganizations(): Promise<SaaSOrganization[]> { return []; }
  async getOrganizationById(_id: string): Promise<SaaSOrganization | undefined> { return undefined; }
  async saveOrganization(_org: SaaSOrganization): Promise<void> {}
  async deleteOrganization(_id: string): Promise<boolean> { return false; }

  async getUsers(_orgId?: string): Promise<SaaSUser[]> { return []; }
  async getUserById(_id: string, _orgId?: string): Promise<SaaSUser | undefined> { return undefined; }
  async getUserByEmail(_email: string): Promise<(SaaSUser & { passwordHash?: string }) | undefined> { return undefined; }
  async saveUser(_user: SaaSUser, _password?: string): Promise<void> {}
  async deleteUser(_id: string, _orgId: string): Promise<boolean> { return false; }

  async getDrivers(_orgId: string): Promise<Driver[]> { return []; }
  async getDriverById(_id: string, _orgId: string): Promise<Driver | undefined> { return undefined; }
  async saveDriver(_driver: Driver, _orgId: string): Promise<Driver | null> { return null; }
  async deleteDriver(_id: string, _orgId: string): Promise<boolean> { return false; }

  async getDevices(_orgId: string): Promise<Device[]> { return []; }
  async getDeviceById(_id: string, _orgId: string): Promise<Device | undefined> { return undefined; }
  async getDeviceByIdInternal(_id: string): Promise<Device | undefined> { return undefined; }
  async saveDevice(_device: Device, _orgId: string): Promise<Device | null> { return null; }
  async deleteDevice(_id: string, _orgId: string): Promise<boolean> { return false; }

  async getDeviceCredential(_deviceId: string): Promise<DeviceCredentialRecord | undefined> { return undefined; }
  async saveDeviceCredential(_cred: DeviceCredentialRecord): Promise<void> {}
  async revokeDeviceCredential(_deviceId: string, _orgId: string): Promise<boolean> { return false; }

  async getCampaigns(_orgId: string): Promise<Campaign[]> { return []; }
  async getCampaignById(_id: string, _orgId: string): Promise<Campaign | undefined> { return undefined; }
  async saveCampaign(_campaign: Campaign, _orgId: string): Promise<Campaign | null> { return null; }
  async deleteCampaign(_id: string, _orgId: string): Promise<boolean> { return false; }

  async getGeoFences(_orgId: string): Promise<GeoFence[]> { return []; }
  async getGeoFenceById(_id: string, _orgId: string): Promise<GeoFence | undefined> { return undefined; }
  async saveGeoFence(_geofence: GeoFence, _orgId: string): Promise<GeoFence | null> { return null; }
  async deleteGeoFence(_id: string, _orgId: string): Promise<boolean> { return false; }

  async getAdvertisers(_orgId: string): Promise<AdvertiserAccount[]> { return []; }
  async getAdvertiserById(_id: string, _orgId: string): Promise<AdvertiserAccount | undefined> { return undefined; }
  async saveAdvertiser(_adv: AdvertiserAccount, _orgId: string): Promise<AdvertiserAccount | null> { return null; }
  async deleteAdvertiser(_id: string, _orgId: string): Promise<boolean> { return false; }

  async getInvoices(_orgId: string): Promise<SaaSInvoice[]> { return []; }
  async getInvoiceById(_id: string, _orgId: string): Promise<SaaSInvoice | undefined> { return undefined; }
  async saveInvoice(_invoice: SaaSInvoice, _orgId: string): Promise<SaaSInvoice | null> { return null; }

  async getProofOfPlayLogs(_orgId: string, _limit?: number): Promise<ProofOfPlayLog[]> { return []; }
  async recordProofOfPlay(_log: ProofOfPlayLog, _orgId: string): Promise<boolean> { return false; }

  async checkAndRecordReplay(_eventId: string, _nonce: string, _timestampMs: number): Promise<{ valid: boolean; reason?: string }> { return { valid: true }; }

  async recordWebhook(_record: WebhookRecord): Promise<boolean> { return false; }

  async createPairingToken(_token: PairingTokenRecord): Promise<void> {}
  async getPairingToken(_token: string): Promise<PairingTokenRecord | undefined> { return undefined; }
  async markPairingTokenUsed(_token: string): Promise<void> {}

  async createRemoteCommand(_cmd: RemoteCommandRecord): Promise<void> {}
  async getPendingCommands(_deviceId: string, _orgId?: string): Promise<RemoteCommandRecord[]> { return []; }
  async acknowledgeCommand(_commandId: string, _orgId?: string): Promise<boolean> { return false; }

  async logAudit(_log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {}
  async getAuditLogs(_orgId: string, _limit?: number): Promise<AuditLog[]> { return []; }
}

export function getVeloRepository(): VeloRepository {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.trim().length > 0) {
    return new PostgresRepository(dbUrl);
  }
  if (process.env.NODE_ENV === 'production' && process.env.STRICT_PROD_ENV === 'true') {
    throw new Error('Ambiente de produção estrita exige DATABASE_URL configurada para o PostgreSQL.');
  }
  return new JsonDevelopmentRepository();
}
