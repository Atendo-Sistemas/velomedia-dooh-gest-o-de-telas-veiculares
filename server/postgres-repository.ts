import crypto from 'node:crypto';
import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import type {
  SaaSOrganization, SaaSUser, Driver, Device, Campaign, GeoFence,
  AdvertiserAccount, SaaSInvoice, ProofOfPlayLog,
} from '../src/types';
import type {
  VeloRepository,
} from './repository';
import { projectPublicPlayer } from './public-player';
import type { PublicPlayerBootstrap } from './public-player';
import type {
  AuditLog, DeviceCredentialRecord, PairingTokenRecord, RemoteCommandRecord,
  SessionRecord, WebhookRecord,
} from './storage';
import { hashPassword } from './crypto';

type StoredRow<T> = { payload: T };

export class PostgresRepository implements VeloRepository {
  readonly pool: Pool;

  constructor(databaseUrl: string) {
    if (!databaseUrl?.trim()) throw new Error('O PostgresRepository exige a variável DATABASE_URL.');
    this.pool = new Pool({
      connectionString: databaseUrl,
      max: Number(process.env.PG_POOL_MAX || 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      application_name: 'velomedia-api',
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: true } : undefined,
    });
    this.pool.on('error', error => console.error('[PostgreSQL] Idle client error:', error.message));
  }

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  async initialize(options: { bootstrapAdmin?: boolean } = {}): Promise<void> {
    await this.pool.query('SELECT 1');
    const { readFile } = await import('node:fs/promises');
    const { readdir } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const migrationsDir = join(process.cwd(), 'server/db/migrations');
    const migrations = (await readdir(migrationsDir)).filter(name => name.endsWith('.sql')).sort();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['velomedia-schema-migrations']);
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      const baseline = await client.query('SELECT 1 FROM schema_migrations WHERE version=$1', ['000_initial_schema.sql']);
      if (!baseline.rowCount) {
        const schema = await readFile(join(process.cwd(), 'server/db/schema.sql'), 'utf8');
        await client.query(schema);
        await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', ['000_initial_schema.sql']);
      }
      for (const name of migrations) {
        const { rowCount } = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [name]);
        if (rowCount) continue;
        const sql = await readFile(join(migrationsDir, name), 'utf8');
        try {
          await client.query(sql);
        } catch (error) {
          const pgError = error as { message?: string; code?: string };
          throw new Error(`Falha na migration ${name} (SQLSTATE ${pgError.code ?? 'desconhecido'}): ${pgError.message ?? 'erro desconhecido'}`, { cause: error });
        }
        await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [name]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
    if (options.bootstrapAdmin !== false) await this.bootstrapSuperAdmin();
  }

  async bootstrapSuperAdmin(): Promise<void> {
    const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    if (!email || !password) {
      if (process.env.NODE_ENV === 'production') throw new Error('INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD são obrigatórias.');
      return;
    }
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['velomedia-super-admin-bootstrap']);
      const existing = await this.findUserByEmail(email, client);
      if (!existing) {
        const currentAdmin = await client.query<StoredRow<SaaSUser & { passwordHash?: string }>>(
          `SELECT payload FROM repository_records WHERE kind='user'
           AND payload->>'role'='super_admin' ORDER BY created_at LIMIT 1`,
        );
        if (currentAdmin.rowCount) {
          await client.query('COMMIT');
          return;
        }
      }
      let orgId = existing?.organizationId;
      if (!orgId) {
        const org = await client.query<StoredRow<SaaSOrganization>>(
          `SELECT payload FROM repository_records WHERE kind='organization'
           AND payload->>'status'='active' ORDER BY created_at LIMIT 1`,
        );
        orgId = org.rows[0]?.payload.id;
      }
      if (!orgId) {
        orgId = `org_${crypto.randomUUID()}`;
        const orgName = process.env.INITIAL_ORGANIZATION_NAME?.trim() || 'VeloMedia';
        const adminName = process.env.INITIAL_ADMIN_NAME?.trim() || 'Administrador';
        const org: SaaSOrganization = {
          id: orgId, name: orgName, slug: `velomedia-${crypto.randomUUID().slice(0, 8)}`,
          cnpj: '', city: '', state: '', planTier: 'starter', activeScreensCount: 0,
          maxScreensLimit: 5, activeCampaignsCount: 0, maxCampaignsLimit: 10,
          activeDriversCount: 0, maxDriversLimit: 5,
          adminUser: { name: adminName, email, phone: '' }, billingEmail: email,
          billingCycle: 'monthly', nextBillingDate: new Date().toISOString().slice(0, 10),
          monthlySoftwareCost: 0, estimatedGrossAdRevenue: 0, driverPayoutTotal: 0,
          netProfit: 0, status: 'active',
        };
        await this.saveOrganization(org, client);
      }
      if (existing) {
        const { passwordHash: preservedHash } = existing;
        await this.saveUser({
          ...existing, role: 'super_admin', organizationId: orgId, status: 'active',
          permissions: ['*'],
        }, undefined, client, preservedHash);
      } else {
        const org = await this.getOrganizationById(orgId, client);
        const name = process.env.INITIAL_ADMIN_NAME?.trim() || 'Administrador';
        await this.saveUser({
          id: `user_${crypto.randomUUID()}`, name, email, phone: '', role: 'super_admin',
          organizationId: orgId, organizationName: org?.name || 'VeloMedia', status: 'active',
          permissions: ['*'], createdAt: new Date().toISOString(),
        }, password, client);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  private async list<T>(kind: string, orgId?: string): Promise<T[]> {
    const result = orgId
      ? await this.pool.query<StoredRow<T>>('SELECT payload FROM repository_records WHERE kind=$1 AND organization_id=$2 ORDER BY created_at DESC', [kind, orgId])
      : await this.pool.query<StoredRow<T>>('SELECT payload FROM repository_records WHERE kind=$1 ORDER BY created_at DESC', [kind]);
    return result.rows.map(row => row.payload);
  }
  private async byId<T>(kind: string, id: string, orgId?: string, client: Pool | PoolClient = this.pool): Promise<T | undefined> {
    const result = orgId
      ? await client.query<StoredRow<T>>('SELECT payload FROM repository_records WHERE kind=$1 AND id=$2 AND organization_id=$3', [kind, id, orgId])
      : await client.query<StoredRow<T>>('SELECT payload FROM repository_records WHERE kind=$1 AND id=$2', [kind, id]);
    return result.rows[0]?.payload;
  }
  private async byIdForUpdate<T>(kind: string, id: string, orgId: string, client: import('pg').PoolClient): Promise<T | undefined> {
    const result = await client.query<StoredRow<T>>(
      'SELECT payload FROM repository_records WHERE kind=$1 AND id=$2 AND organization_id=$3 FOR UPDATE',
      [kind, id, orgId],
    );
    return result.rows[0]?.payload;
  }
  private async save<T extends { id: string }>(kind: string, value: T, orgId?: string, client: Pool | PoolClient = this.pool): Promise<boolean> {
    const current = await client.query<{ organization_id: string | null }>(
      'SELECT organization_id FROM repository_records WHERE kind=$1 AND id=$2', [kind, value.id],
    );
    if (current.rowCount && current.rows[0].organization_id !== (orgId || null)) return false;
    const result = await client.query(
      `INSERT INTO repository_records(kind,id,organization_id,payload,created_at)
       VALUES($1,$2,$3,$4::jsonb,NOW())
       ON CONFLICT(kind,id) DO UPDATE SET payload=EXCLUDED.payload
       WHERE repository_records.organization_id IS NOT DISTINCT FROM EXCLUDED.organization_id
       RETURNING id`,
      [kind, value.id, orgId || null, JSON.stringify(value)],
    );
    return Boolean(result.rowCount);
  }
  private async remove(kind: string, id: string, orgId?: string): Promise<boolean> {
    const result = orgId
      ? await this.pool.query('DELETE FROM repository_records WHERE kind=$1 AND id=$2 AND organization_id=$3', [kind, id, orgId])
      : await this.pool.query('DELETE FROM repository_records WHERE kind=$1 AND id=$2', [kind, id]);
    return (result.rowCount || 0) > 0;
  }
  private async findUserByEmail(email: string, client: Pool | PoolClient = this.pool): Promise<(SaaSUser & { passwordHash?: string }) | undefined> {
    const result = await client.query<StoredRow<SaaSUser & { passwordHash?: string }>>(
      `SELECT payload FROM repository_records WHERE kind='user' AND lower(payload->>'email')=lower($1) LIMIT 1`, [email],
    );
    return result.rows[0]?.payload;
  }

  async getOrganizations() { return this.list<SaaSOrganization>('organization'); }
  async getOrganizationById(id: string, client: Pool | PoolClient = this.pool) { return this.byId<SaaSOrganization>('organization', id, undefined, client); }
  async saveOrganization(org: SaaSOrganization, client: Pool | PoolClient = this.pool) { await this.save('organization', org, undefined, client); }
  async deleteOrganization(id: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM sessions WHERE organization_id=$1', [id]);
      await client.query('DELETE FROM pairing_tokens WHERE organization_id=$1', [id]);
      await client.query('DELETE FROM device_credentials WHERE organization_id=$1', [id]);
      await client.query('DELETE FROM remote_commands WHERE organization_id=$1', [id]);
      await client.query('DELETE FROM repository_records WHERE organization_id=$1', [id]);
      const result = await client.query('DELETE FROM repository_records WHERE kind=$1 AND id=$2', ['organization', id]);
      await client.query('DELETE FROM organizations WHERE id=$1', [id]);
      await client.query('COMMIT');
      return (result.rowCount || 0) > 0;
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  async getUsers(orgId?: string) {
    return (await this.list<SaaSUser & { passwordHash?: string }>('user', orgId)).map(({ passwordHash: _hash, ...user }) => user);
  }
  async getUserById(id: string, orgId?: string) {
    const user = await this.byId<SaaSUser & { passwordHash?: string }>('user', id, orgId);
    if (!user) return undefined;
    const { passwordHash: _hash, ...safe } = user;
    return safe;
  }
  async getUserByEmail(email: string) { return this.findUserByEmail(email); }
  async saveUser(user: SaaSUser, password?: string, client: Pool | PoolClient = this.pool, preserveHash?: string) {
    const existing = await this.byId<SaaSUser & { passwordHash?: string }>('user', user.id, undefined, client);
    const passwordHash = password ? hashPassword(password) : (preserveHash || existing?.passwordHash);
    await this.save('user', { ...user, passwordHash }, user.organizationId, client);
  }
  async deleteUser(id: string, orgId: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM sessions WHERE user_id=$1', [id]);
      const deleted = await client.query('DELETE FROM repository_records WHERE kind=$1 AND id=$2 AND organization_id=$3', ['user', id, orgId]);
      await client.query('DELETE FROM users WHERE id=$1', [id]);
      await client.query('COMMIT');
      return Boolean(deleted.rowCount);
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async getDrivers(orgId: string) { return this.list<Driver>('driver', orgId); }
  async getDriverById(id: string, orgId: string) { return this.byId<Driver>('driver', id, orgId); }
  async saveDriver(value: Driver, orgId: string) { const item = { ...value, organizationId: orgId }; return await this.save('driver', item, orgId) ? item : null; }
  async deleteDriver(id: string, orgId: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM pairing_tokens WHERE driver_id=$1 AND organization_id=$2', [id, orgId]);
      const deleted = await client.query('DELETE FROM repository_records WHERE kind=$1 AND id=$2 AND organization_id=$3', ['driver', id, orgId]);
      await client.query('COMMIT');
      return Boolean(deleted.rowCount);
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async getDevices(orgId: string) { return this.list<Device>('device', orgId); }
  async getDeviceById(id: string, orgId: string) {
    const found = await this.byId<Device>('device', id, orgId);
    if (found) return found;
    const result = await this.pool.query<StoredRow<Device>>('SELECT payload FROM repository_records WHERE kind=$1 AND organization_id=$2 AND payload->>$3=$4 LIMIT 1', ['device', orgId, 'code', id]);
    return result.rows[0]?.payload;
  }
  async getDeviceByIdInternal(id: string) {
    const byId = await this.byId<Device>('device', id);
    if (byId) return byId;
    const result = await this.pool.query<StoredRow<Device>>("SELECT payload FROM repository_records WHERE kind='device' AND payload->>'code'=$1 LIMIT 1", [id]);
    return result.rows[0]?.payload;
  }
  async getPublicPlayerBootstrap(deviceCode: string): Promise<PublicPlayerBootstrap | undefined> {
    if (!deviceCode || deviceCode.length > 64) return undefined;
    const result = await this.pool.query<StoredRow<Device>>(
      `SELECT payload FROM repository_records
       WHERE kind='device' AND payload->>'code'=$1 AND payload->>'status'<>'retired'
       LIMIT 1`,
      [deviceCode],
    );
    const device = result.rows[0]?.payload;
    if (!device?.organizationId) return undefined;
    const campaigns = await this.getCampaigns(device.organizationId);
    const geoFences = await this.getGeoFences(device.organizationId);
    return projectPublicPlayer(device, campaigns, geoFences);
  }
  async saveDevice(value: Device, orgId: string) { const item = { ...value, organizationId: orgId }; return await this.save('device', item, orgId) ? item : null; }
  async deleteDevice(id: string, orgId: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM remote_commands WHERE device_id=$1 AND organization_id=$2', [id, orgId]);
      await client.query('UPDATE device_credentials SET revoked=true WHERE device_id=$1 AND organization_id=$2', [id, orgId]);
      const deleted = await client.query('DELETE FROM repository_records WHERE kind=$1 AND id=$2 AND organization_id=$3', ['device', id, orgId]);
      await client.query('COMMIT');
      return Boolean(deleted.rowCount);
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  async getDeviceCredential(deviceId: string) {
    const { rows } = await this.pool.query<DeviceCredentialRecord>('SELECT device_id AS "deviceId", organization_id AS "organizationId", device_secret AS "deviceSecret", revoked, created_at AS "createdAt", last_seen_at AS "lastSeenAt" FROM device_credentials WHERE device_id=$1 AND revoked=false', [deviceId]);
    return rows[0];
  }
  async saveDeviceCredential(cred: DeviceCredentialRecord) {
    await this.pool.query(`INSERT INTO device_credentials(device_id,organization_id,device_secret,revoked,created_at,last_seen_at)
      VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(device_id) DO UPDATE SET organization_id=EXCLUDED.organization_id,device_secret=EXCLUDED.device_secret,revoked=EXCLUDED.revoked,last_seen_at=EXCLUDED.last_seen_at`,
    [cred.deviceId, cred.organizationId, cred.deviceSecret, cred.revoked, cred.createdAt, cred.lastSeenAt || null]);
  }
  async revokeDeviceCredential(deviceId: string, orgId: string) {
    const result = await this.pool.query('UPDATE device_credentials SET revoked=true WHERE device_id=$1 AND organization_id=$2 AND revoked=false', [deviceId, orgId]);
    return (result.rowCount || 0) > 0;
  }

  async getCampaigns(orgId: string) { return this.list<Campaign>('campaign', orgId); }
  async getCampaignById(id: string, orgId: string) { return this.byId<Campaign>('campaign', id, orgId); }
  async saveCampaign(v: Campaign, orgId: string) { const item = { ...v, organizationId: orgId }; return await this.save('campaign', item, orgId) ? item : null; }
  async deleteCampaign(id: string, orgId: string) { return this.remove('campaign', id, orgId); }
  async getGeoFences(orgId: string) { return this.list<GeoFence>('geofence', orgId); }
  async getGeoFenceById(id: string, orgId: string) { return this.byId<GeoFence>('geofence', id, orgId); }
  async saveGeoFence(v: GeoFence, orgId: string) { const item = { ...v, organizationId: orgId }; return await this.save('geofence', item, orgId) ? item : null; }
  async deleteGeoFence(id: string, orgId: string) { return this.remove('geofence', id, orgId); }
  async getAdvertisers(orgId: string) { return this.list<AdvertiserAccount>('advertiser', orgId); }
  async getAdvertiserById(id: string, orgId: string) { return this.byId<AdvertiserAccount>('advertiser', id, orgId); }
  async saveAdvertiser(v: AdvertiserAccount, orgId: string) { const item = { ...v, organizationId: orgId }; return await this.save('advertiser', item, orgId) ? item : null; }
  async deleteAdvertiser(id: string, orgId: string) { return this.remove('advertiser', id, orgId); }
  async getInvoices(orgId: string) { return this.list<SaaSInvoice>('invoice', orgId); }
  async getInvoiceById(id: string, orgId: string) { return this.byId<SaaSInvoice>('invoice', id, orgId); }
  async saveInvoice(v: SaaSInvoice, orgId: string) { const item = { ...v, organizationId: orgId }; return await this.save('invoice', item, orgId) ? item : null; }

  async getProofOfPlayLogs(orgId: string, limit = 100) {
    const result = await this.pool.query<StoredRow<ProofOfPlayLog>>(
      `SELECT payload FROM repository_records WHERE kind='proof_of_play' AND organization_id=$1
       ORDER BY created_at DESC LIMIT $2`,
      [orgId, Math.max(0, Math.floor(limit))],
    );
    return result.rows.map(row => row.payload);
  }
  async recordProofOfPlay(log: ProofOfPlayLog, orgId: string) {
    const result = await this.recordProofOfPlayAndReplay(log, orgId);
    return result;
  }
  async recordProofOfPlayAndReplay(log: ProofOfPlayLog, orgId: string): Promise<boolean> {
    if (!log.nonce || (log.organizationId && log.organizationId !== orgId)) return false;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const replay = await client.query(
        `INSERT INTO anti_replay_nonces(nonce,event_id,timestamp) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING nonce`,
        [log.nonce, log.id, new Date(log.endedAt || log.timestamp).getTime()],
      );
      if (!replay.rowCount) { await client.query('ROLLBACK'); return false; }
      const item = { ...log, organizationId: orgId };
      const inserted = await client.query(
        `INSERT INTO repository_records(kind,id,organization_id,payload,created_at)
         VALUES('proof_of_play',$1,$2,$3::jsonb,NOW()) ON CONFLICT(kind,id) DO NOTHING RETURNING id`,
        [item.id, orgId, JSON.stringify(item)],
      );
      if (!inserted.rowCount) { await client.query('ROLLBACK'); return false; }
      const campaign = await this.byIdForUpdate<Campaign>('campaign', log.campaignId, orgId, client);
      const device = await this.byIdForUpdate<Device>('device', log.deviceId, orgId, client);
      if (!campaign || !device) {
        await client.query('ROLLBACK');
        return false;
      }
      if (campaign) {
        campaign.totalImpressions++;
        if (log.interacted) campaign.totalInteractions++;
        if (log.interactionType === 'qr_scan') campaign.totalScans++;
        campaign.budgetSpent += campaign.cpm / 1000;
        await this.save('campaign', campaign, orgId, client);
      }
      if (device) {
        device.totalImpressionsToday++;
        if (log.interacted) device.totalInteractionsToday++;
        await this.save('device', device, orgId, client);
      }
      if (campaign && device?.driverId) {
        const driver = await this.byIdForUpdate<Driver>('driver', device.driverId, orgId, client);
        if (driver) {
          const payout = campaign.cpm / 1000 * (device.hardwareOwnership === 'driver_byod' ? 0.45 : 0.2);
          driver.totalEarningsMonth = Number(((driver.totalEarningsMonth || 0) + payout).toFixed(2));
          driver.pendingBalance = Number(((driver.pendingBalance || 0) + payout).toFixed(2));
          await this.save('driver', driver, orgId, client);
        }
      }
      await client.query('COMMIT');
      return true;
    } catch (error) { await client.query('ROLLBACK'); if ((error as { code?: string }).code === '23505') return false; throw error; } finally { client.release(); }
  }

  async checkAndRecordReplay(eventId: string, nonce: string, timestampMs: number) {
    const now = Date.now();
    if (Math.abs(now - timestampMs) > 5 * 60 * 1000) return { valid: false, reason: 'Timestamp outside acceptable window (clock skew > 5m)' };
    const result = await this.pool.query(
      'INSERT INTO anti_replay_nonces(nonce,event_id,timestamp) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING nonce',
      [nonce, eventId, timestampMs],
    );
    if (!result.rowCount) return { valid: false, reason: 'Event ID or nonce already processed (replay detected)' };
    await this.pool.query('DELETE FROM anti_replay_nonces WHERE created_at < NOW() - INTERVAL \'30 minutes\'');
    return { valid: true };
  }
  async recordWebhook(record: WebhookRecord) {
    const eventId = record.eventId.length <= 64
      ? record.eventId
      : crypto.createHash('sha256').update(record.eventId).digest('hex');
    const result = await this.pool.query(
      'INSERT INTO webhook_events(event_id,provider,status,payload,processed_at) VALUES($1,$2,$3,$4::jsonb,$5) ON CONFLICT(event_id) DO NOTHING RETURNING event_id',
      [eventId, record.provider, 'processed', JSON.stringify({ payloadHash: record.payloadHash }), record.processedAt],
    );
    return Boolean(result.rowCount);
  }

  async createPairingToken(token: PairingTokenRecord) {
    await this.pool.query(`INSERT INTO pairing_tokens(token,organization_id,driver_id,screen_position,hardware_ownership,expires_at,used,created_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [token.token, token.organizationId, token.driverId || null, token.screenPosition, token.hardwareOwnership, token.expiresAt, token.used, token.createdAt]);
  }
  async getPairingToken(token: string) {
    const result = await this.pool.query<PairingTokenRecord & { expiresAt: number | string }>(
      `SELECT token,organization_id AS "organizationId",driver_id AS "driverId",screen_position AS "screenPosition",hardware_ownership AS "hardwareOwnership",expires_at AS "expiresAt",used,created_at AS "createdAt" FROM pairing_tokens WHERE token=$1 AND used=false AND expires_at>$2`,
      [token, Date.now()],
    );
    const row = result.rows[0];
    return row ? { ...row, expiresAt: Number(row.expiresAt) } : undefined;
  }
  async consumePairingToken(token: string) {
    const result = await this.pool.query<PairingTokenRecord & { expiresAt: number | string }>(
      `UPDATE pairing_tokens SET used=true WHERE token=$1 AND used=false AND expires_at>$2
       RETURNING token,organization_id AS "organizationId",driver_id AS "driverId",screen_position AS "screenPosition",hardware_ownership AS "hardwareOwnership",expires_at AS "expiresAt",used,created_at AS "createdAt"`,
      [token, Date.now()],
    );
    const row = result.rows[0];
    return row ? { ...row, expiresAt: Number(row.expiresAt) } : undefined;
  }
  async consumeAndProvisionDevice(
    token: string,
    device: Device,
    credential: DeviceCredentialRecord,
    audit?: Omit<AuditLog, 'id' | 'createdAt'>,
  ) {
    if (
      device.id !== credential.deviceId ||
      device.organizationId !== credential.organizationId
    ) return false;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const consumed = await client.query<{ organization_id: string; driver_id: string | null }>(
        `UPDATE pairing_tokens SET used=true
         WHERE token=$1 AND used=false AND expires_at>$2
         RETURNING organization_id,driver_id`,
        [token, Date.now()],
      );
      const record = consumed.rows[0];
      if (!record || record.organization_id !== device.organizationId) {
        await client.query('ROLLBACK');
        return false;
      }
      if ((record.driver_id || '') !== (device.driverId || '')) {
        await client.query('ROLLBACK');
        return false;
      }
      if (device.driverId && !(await this.byIdForUpdate<Driver>('driver', device.driverId, record.organization_id, client))) {
        await client.query('ROLLBACK');
        return false;
      }
      if (!(await this.save('device', device, record.organization_id, client))) {
        await client.query('ROLLBACK');
        return false;
      }
      await client.query(
        `INSERT INTO device_credentials(device_id,organization_id,device_secret,revoked,created_at,last_seen_at)
         VALUES($1,$2,$3,$4,$5,$6)`,
        [credential.deviceId, credential.organizationId, credential.deviceSecret, credential.revoked, credential.createdAt, credential.lastSeenAt || null],
      );
      if (audit) {
        const auditRecord: AuditLog = {
          ...audit,
          id: `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
          createdAt: new Date().toISOString(),
        };
        if (!(await this.save('audit', auditRecord, auditRecord.organizationId, client))) {
          await client.query('ROLLBACK');
          return false;
        }
      }
      await client.query('COMMIT');
      return true;
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  async markPairingTokenUsed(token: string) { await this.pool.query('UPDATE pairing_tokens SET used=true WHERE token=$1', [token]); }
  async createRemoteCommand(cmd: RemoteCommandRecord) {
    await this.pool.query(`INSERT INTO remote_commands(id,organization_id,device_id,command,status,created_at)
      VALUES($1,$2,$3,$4,$5,$6)`, [cmd.id, cmd.organizationId, cmd.deviceId, cmd.command, cmd.status, cmd.createdAt]);
  }
  async getPendingCommands(deviceId: string, orgId?: string) {
    const result = orgId
      ? await this.pool.query<RemoteCommandRecord>(`SELECT id,organization_id AS "organizationId",device_id AS "deviceId",command,status,created_at AS "createdAt",acknowledged_at AS "acknowledgedAt" FROM remote_commands WHERE device_id=$1 AND organization_id=$2 AND status='PENDING' ORDER BY created_at`, [deviceId, orgId])
      : await this.pool.query<RemoteCommandRecord>(`SELECT id,organization_id AS "organizationId",device_id AS "deviceId",command,status,created_at AS "createdAt",acknowledged_at AS "acknowledgedAt" FROM remote_commands WHERE device_id=$1 AND status='PENDING' ORDER BY created_at`, [deviceId]);
    return result.rows;
  }
  async acknowledgeCommand(id: string, orgId?: string) {
    const result = orgId
      ? await this.pool.query("UPDATE remote_commands SET status='ACKNOWLEDGED',acknowledged_at=NOW() WHERE id=$1 AND organization_id=$2 AND status='PENDING'", [id, orgId])
      : await this.pool.query("UPDATE remote_commands SET status='ACKNOWLEDGED',acknowledged_at=NOW() WHERE id=$1 AND status='PENDING'", [id]);
    return (result.rowCount || 0) > 0;
  }
  async logAudit(log: Omit<AuditLog, 'id' | 'createdAt'>) {
    const item: AuditLog = { ...log, id: `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`, createdAt: new Date().toISOString() };
    await this.save('audit', item, item.organizationId);
  }
  async getAuditLogs(orgId: string, limit = 100) {
    const result = await this.pool.query<StoredRow<AuditLog>>(
      `SELECT payload FROM repository_records WHERE kind='audit' AND organization_id=$1
       ORDER BY created_at DESC LIMIT $2`,
      [orgId, Math.max(0, Math.floor(limit))],
    );
    return result.rows.map(row => row.payload);
  }

  async createSession(session: SessionRecord) {
    await this.pool.query('DELETE FROM sessions WHERE expires_at <= $1', [Date.now()]);
    await this.pool.query(`INSERT INTO sessions(token,user_id,user_email,user_name,role,organization_id,expires_at,created_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [session.token, session.userId, session.userEmail, session.userName, session.role, session.organizationId, session.expiresAt, session.createdAt]);
  }
  async getSession(token: string) {
    const result = await this.pool.query<SessionRecord>(
      'SELECT token,user_id AS "userId",user_email AS "userEmail",user_name AS "userName",role,organization_id AS "organizationId",expires_at AS "expiresAt",created_at AS "createdAt" FROM sessions WHERE token=$1 AND expires_at>$2',
      [token, Date.now()],
    );
    const row = result.rows[0];
    return row ? { ...row, expiresAt: Number(row.expiresAt), createdAt: new Date(row.createdAt).toISOString() } : undefined;
  }
  async deleteSession(token: string) { const result = await this.pool.query('DELETE FROM sessions WHERE token=$1', [token]); return Boolean(result.rowCount); }
  async close() { await this.pool.end(); }
}
