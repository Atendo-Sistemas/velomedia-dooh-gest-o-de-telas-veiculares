import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PostgresRepository } from '../server/postgres-repository';

const baseUrl = process.env.VELOMEDIA_TEST_DATABASE_URL;
const integration = baseUrl ? describe : describe.skip;

const migrationsDir = join(process.cwd(), 'server/db/migrations');

describe('migration files', () => {
  it('wrap every JSON expression index in its own parentheses', () => {
    for (const name of readdirSync(migrationsDir).filter(file => file.endsWith('.sql'))) {
      const sql = readFileSync(join(migrationsDir, name), 'utf8');
      expect(sql, name).not.toMatch(/ON\s+repository_records\s*\(\s*payload\s*->>/i);
    }
  });
});

integration('PostgreSQL migrations on a clean database', () => {
  const admin = new Pool({ connectionString: baseUrl });
  const created: string[] = [];
  const url = (db: string) => { const u = new URL(baseUrl!); u.pathname = `/${db}`; return u.toString(); };
  const freshDb = async () => {
    const name = `velomedia_test_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    await admin.query(`CREATE DATABASE ${name}`);
    created.push(name);
    return name;
  };

  beforeAll(() => {
    vi.stubEnv('INITIAL_ADMIN_EMAIL', 'Admin@Example.com');
    vi.stubEnv('INITIAL_ADMIN_PASSWORD', 'a-very-long-test-password');
  });
  afterAll(async () => {
    vi.unstubAllEnvs();
    for (const name of created) await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await admin.end();
  });

  const applied = async (repo: PostgresRepository) =>
    (await repo.pool.query('SELECT version FROM schema_migrations ORDER BY version')).rows.map(r => r.version);
  const expectedVersions = () => ['000_initial_schema.sql', ...readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()];

  it('applies schema.sql and all migrations once, creating a single super admin', async () => {
    const repo = new PostgresRepository(url(await freshDb()));
    try {
      await repo.initialize();
      await repo.initialize();
      expect(await applied(repo)).toEqual(expectedVersions());
      const admins = await repo.pool.query(
        `SELECT payload->>'email' AS email FROM repository_records WHERE kind='user' AND payload->>'role'='super_admin'`);
      expect(admins.rows).toEqual([{ email: 'admin@example.com' }]);
      const idx = await repo.pool.query(
        `SELECT indexdef FROM pg_indexes WHERE indexname='idx_repository_records_device_code'`);
      expect(idx.rows[0].indexdef).toContain("((payload ->> 'code'::text))");
    } finally { await repo.close(); }
  });

  it('rolls back a failing migration atomically and succeeds when retried', async () => {
    const repo = new PostgresRepository(url(await freshDb()));
    try {
      await repo.initialize({ bootstrapAdmin: false });
      const before = await applied(repo);
      await repo.pool.query(`DELETE FROM schema_migrations WHERE version <> '000_initial_schema.sql'`);
      await repo.pool.query('DROP INDEX idx_repository_records_device_code');
      for (const id of ['a', 'b']) {
        await repo.pool.query(
          `INSERT INTO repository_records(kind,id,payload) VALUES ('device',$1,'{"code":"DUP"}')`, [id]);
      }
      await expect(repo.initialize({ bootstrapAdmin: false })).rejects.toThrow(/Falha na migration 00\d_/);
      expect(await applied(repo)).toEqual(['000_initial_schema.sql']);
      await repo.pool.query(`DELETE FROM repository_records WHERE id='b'`);
      await repo.initialize({ bootstrapAdmin: false });
      expect(await applied(repo)).toEqual(before);
      expect((await repo.pool.query('SELECT 1 FROM repository_records')).rowCount).toBe(1);
    } finally { await repo.close(); }
  });

  it('upgrades a database whose baseline is already registered and preserves the admin', async () => {
    const repo = new PostgresRepository(url(await freshDb()));
    try {
      await repo.initialize();
      const { rows: [before] } = await repo.pool.query(
        `SELECT payload FROM repository_records WHERE kind='user' AND payload->>'role'='super_admin'`);
      await repo.pool.query(`DELETE FROM schema_migrations WHERE version <> '000_initial_schema.sql'`);
      await repo.initialize();
      expect(await applied(repo)).toEqual(expectedVersions());
      const { rows } = await repo.pool.query(
        `SELECT payload FROM repository_records WHERE kind='user' AND payload->>'role'='super_admin'`);
      expect(rows).toHaveLength(1);
      expect(rows[0].payload.id).toBe(before.payload.id);
    } finally { await repo.close(); }
  });
});
