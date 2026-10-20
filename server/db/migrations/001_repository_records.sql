CREATE TABLE IF NOT EXISTS repository_records (
    kind VARCHAR(48) NOT NULL,
    id VARCHAR(128) NOT NULL,
    organization_id VARCHAR(64),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (kind, id)
);
CREATE INDEX IF NOT EXISTS idx_repository_records_tenant_kind
    ON repository_records(organization_id, kind, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_repository_records_user_email
    ON repository_records ((lower(payload->>'email'))) WHERE kind = 'user';
CREATE UNIQUE INDEX IF NOT EXISTS idx_repository_records_device_code
    ON repository_records ((payload->>'code'))
    WHERE kind = 'device';

ALTER TABLE anti_replay_nonces ADD COLUMN IF NOT EXISTS event_id VARCHAR(64);
ALTER TABLE anti_replay_nonces ALTER COLUMN event_id TYPE VARCHAR(256);
CREATE UNIQUE INDEX IF NOT EXISTS idx_replay_event_id ON anti_replay_nonces(event_id) WHERE event_id IS NOT NULL;

ALTER TABLE pairing_tokens ALTER COLUMN driver_id DROP NOT NULL;
ALTER TABLE pairing_tokens DROP CONSTRAINT IF EXISTS pairing_tokens_driver_id_fkey;
ALTER TABLE pairing_tokens DROP CONSTRAINT IF EXISTS pairing_tokens_organization_id_fkey;

ALTER TABLE device_credentials DROP CONSTRAINT IF EXISTS device_credentials_device_id_fkey;
ALTER TABLE device_credentials DROP CONSTRAINT IF EXISTS device_credentials_organization_id_fkey;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_organization_id_fkey;

CREATE TABLE IF NOT EXISTS remote_commands (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL,
    device_id VARCHAR(64) NOT NULL,
    command VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_remote_commands_pending
    ON remote_commands(organization_id, device_id, status, created_at);
