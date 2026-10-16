import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { PostgresRepository } from '../postgres-repository';

type LegacyStore = {
  organizations?: Array<Record<string, any>>;
  users?: Array<Record<string, any>>;
  drivers?: Array<Record<string, any>>;
  devices?: Array<Record<string, any>>;
  campaigns?: Array<Record<string, any>>;
  geofences?: Array<Record<string, any>>;
  proofOfPlayLogs?: Array<Record<string, any>>;
  advertisers?: Array<Record<string, any>>;
  invoices?: Array<Record<string, any>>;
  auditLogs?: Array<Record<string, any>>;
  pairingTokens?: Array<Record<string, any>>;
  remoteCommands?: Array<Record<string, any>>;
  sessions?: Array<Record<string, any>>;
  deviceCredentials?: Array<Record<string, any>>;
  replayLogs?: Array<Record<string, any>>;
  webhooks?: Array<Record<string, any>>;
};

const categories: Array<[keyof LegacyStore, string]> = [
  ['organizations', 'organization'], ['users', 'user'], ['drivers', 'driver'],
  ['devices', 'device'], ['campaigns', 'campaign'], ['geofences', 'geofence'],
  ['proofOfPlayLogs', 'proof_of_play'], ['advertisers', 'advertiser'],
  ['invoices', 'invoice'], ['auditLogs', 'audit'],
];

async function importFile(filePath: string): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  const parsed: LegacyStore = JSON.parse(await readFile(filePath, 'utf8'));
  if (!Array.isArray(parsed.organizations) || !Array.isArray(parsed.users)) {
    throw new Error('Input file is not a VeloMedia JSON store (organizations/users arrays are required).');
  }
  const repo = new PostgresRepository(databaseUrl);
  try {
    await repo.initialize({ bootstrapAdmin: false });
    const client = await repo.pool.connect();
    try {
      const existing = await client.query<{ count: string }>(`
        SELECT (
          (SELECT COUNT(*) FROM repository_records) +
          (SELECT COUNT(*) FROM sessions) +
          (SELECT COUNT(*) FROM pairing_tokens) +
          (SELECT COUNT(*) FROM remote_commands) +
          (SELECT COUNT(*) FROM device_credentials) +
          (SELECT COUNT(*) FROM anti_replay_nonces) +
          (SELECT COUNT(*) FROM webhook_events) +
          (SELECT COUNT(*) FROM organizations) +
          (SELECT COUNT(*) FROM users) +
          (SELECT COUNT(*) FROM drivers) +
          (SELECT COUNT(*) FROM devices) +
          (SELECT COUNT(*) FROM campaigns) +
          (SELECT COUNT(*) FROM geofences) +
          (SELECT COUNT(*) FROM proof_of_play_logs) +
          (SELECT COUNT(*) FROM advertisers) +
          (SELECT COUNT(*) FROM invoices) +
          (SELECT COUNT(*) FROM audit_logs)
        )::text AS count
      `);
      if (Number(existing.rows[0].count) !== 0) {
        throw new Error('Import target is not empty. Export/backup it and choose a fresh PostgreSQL database.');
      }

      await client.query('BEGIN');
      for (const [property, kind] of categories) {
        const values = parsed[property] || [];
        for (const payload of values) {
          const id = String(payload.id || payload.token || payload.eventId || '');
          if (!id) throw new Error(`A ${kind} record is missing its id.`);
          const organizationId = typeof payload.organizationId === 'string' ? payload.organizationId : null;
          await client.query(
            'INSERT INTO repository_records(kind,id,organization_id,payload) VALUES($1,$2,$3,$4::jsonb)',
            [kind, id, organizationId, JSON.stringify(payload)],
          );
        }
      }
      for (const session of parsed.sessions || []) {
        if (session.expiresAt > Date.now()) {
          await client.query(`INSERT INTO sessions(token,user_id,user_email,user_name,role,organization_id,expires_at,created_at)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
          [session.token, session.userId, session.userEmail, session.userName, session.role, session.organizationId, session.expiresAt, session.createdAt]);
        }
      }
      for (const cred of parsed.deviceCredentials || []) {
        await client.query(`INSERT INTO device_credentials(device_id,organization_id,device_secret,revoked,created_at,last_seen_at)
          VALUES($1,$2,$3,$4,$5,$6)`,
        [cred.deviceId, cred.organizationId, cred.deviceSecret, cred.revoked, cred.createdAt, cred.lastSeenAt || null]);
      }
      for (const token of parsed.pairingTokens || []) {
        await client.query(`INSERT INTO pairing_tokens(token,organization_id,driver_id,screen_position,hardware_ownership,expires_at,used,created_at)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [token.token, token.organizationId, token.driverId || null, token.screenPosition, token.hardwareOwnership, token.expiresAt, token.used, token.createdAt]);
      }
      for (const command of parsed.remoteCommands || []) {
        await client.query(`INSERT INTO remote_commands(id,organization_id,device_id,command,status,created_at,acknowledged_at)
          VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [command.id, command.organizationId, command.deviceId, command.command, command.status, command.createdAt, command.acknowledgedAt || null]);
      }
      for (const replay of parsed.replayLogs || []) {
        await client.query('INSERT INTO anti_replay_nonces(nonce,event_id,timestamp) VALUES($1,$2,$3)', [replay.nonce, replay.eventId, replay.timestamp]);
      }
      for (const webhook of parsed.webhooks || []) {
        await client.query(`INSERT INTO webhook_events(event_id,provider,status,payload,processed_at)
          VALUES($1,$2,'processed',$3::jsonb,$4)`,
        [webhook.eventId, webhook.provider, JSON.stringify({ payloadHash: webhook.payloadHash }), webhook.processedAt]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    await repo.bootstrapSuperAdmin();
    console.log('Legacy VeloMedia JSON data imported. Keep the source file as a backup until verified.');
  } finally {
    await repo.close();
  }
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: DATABASE_URL=postgres://... npx tsx server/db/import-json.ts /path/to/velomedia_store.json');
  process.exitCode = 2;
} else {
  importFile(filePath).catch(error => {
    console.error('JSON import failed:', error);
    process.exitCode = 1;
  });
}
