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
import { PostgresRepository } from './postgres-repository';
import { projectPublicPlayer } from './public-player';
import type { PublicPlayerBootstrap } from './public-player';

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
  getPublicPlayerBootstrap(deviceCode: string): Promise<PublicPlayerBootstrap | undefined>;
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

  // Sessions
  createSession(session: import('./storage').SessionRecord): Promise<void>;
  getSession(token: string): Promise<import('./storage').SessionRecord | undefined>;
  deleteSession(token: string): Promise<boolean>;

  // Atomic device security operations
  consumePairingToken(token: string): Promise<PairingTokenRecord | undefined>;
  consumeAndProvisionDevice(
    token: string,
    device: Device,
    credential: DeviceCredentialRecord,
    audit?: Omit<AuditLog, 'id' | 'createdAt'>,
  ): Promise<boolean>;
  recordProofOfPlayAndReplay(log: ProofOfPlayLog, orgId: string): Promise<boolean>;
  close?(): Promise<void>;
  ping(): Promise<void>;
}

/**
 * Development implementation backed by VeloStorage (strictly blocked in production)
 */
export class JsonDevelopmentRepository implements VeloRepository {
  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Segurança Crítica: JsonDevelopmentRepository não pode ser instanciado em ambiente de produção estrita. Use PostgresRepository com DATABASE_URL.'
      );
    }
  }
  async ping(): Promise<void> {}

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
  async getPublicPlayerBootstrap(deviceCode: string): Promise<PublicPlayerBootstrap | undefined> {
    const matches = storage.getOrganizations()
      .flatMap(org => storage.getDevices(org.id))
      .filter(candidate => candidate.code === deviceCode && candidate.status !== 'retired');
    if (matches.length !== 1) return undefined;
    const device = matches[0];
    if (!device?.organizationId) return undefined;
    return projectPublicPlayer(
      device,
      storage.getCampaigns(device.organizationId),
      storage.getGeoFences(device.organizationId),
    );
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

  async createSession(session: import('./storage').SessionRecord): Promise<void> { storage.createSession(session); }
  async getSession(token: string): Promise<import('./storage').SessionRecord | undefined> { return storage.getSession(token); }
  async deleteSession(token: string): Promise<boolean> { return storage.deleteSession(token); }
  async consumePairingToken(token: string): Promise<PairingTokenRecord | undefined> {
    const record = storage.getPairingToken(token);
    if (record) storage.markPairingTokenUsed(token);
    return record;
  }
  async consumeAndProvisionDevice(token: string, device: Device, credential: DeviceCredentialRecord, audit?: Omit<AuditLog, 'id' | 'createdAt'>): Promise<boolean> {
    const record = storage.getPairingToken(token);
    if (!record || record.organizationId !== device.organizationId) return false;
    storage.markPairingTokenUsed(token);
    const saved = storage.saveDevice(device, record.organizationId);
    if (!saved) return false;
    storage.saveDeviceCredential(credential);
    if (audit) storage.logAudit(audit);
    return true;
  }
  async recordProofOfPlayAndReplay(log: ProofOfPlayLog, orgId: string): Promise<boolean> {
    if (!log.nonce) return false;
    const replay = storage.checkAndRecordReplay(log.id, log.nonce, new Date(log.endedAt || log.timestamp).getTime());
    return replay.valid && storage.recordProofOfPlay(log, orgId);
  }
}

export { PostgresRepository };

let repository: VeloRepository | undefined;

export function getVeloRepository(): VeloRepository {
  if (repository) return repository;
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (process.env.NODE_ENV === 'production') {
    if (!dbUrl) throw new Error('O ambiente de produção exige DATABASE_URL; o armazenamento em arquivo JSON está desabilitado.');
    return repository = new PostgresRepository(dbUrl);
  }
  return repository = dbUrl ? new PostgresRepository(dbUrl) : new JsonDevelopmentRepository();
}

export async function initializeVeloRepository(): Promise<void> {
  const repo = getVeloRepository();
  if (repo instanceof PostgresRepository) await repo.initialize();
}

export async function closeVeloRepository(): Promise<void> {
  await repository?.close?.();
}
