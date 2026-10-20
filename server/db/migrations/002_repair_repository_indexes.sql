-- Reparo idempotente: garante os índices únicos de repository_records mesmo em
-- bancos que registraram a migration 001 com uma versão anterior da expressão.
CREATE UNIQUE INDEX IF NOT EXISTS idx_repository_records_user_email
    ON repository_records ((lower(payload->>'email')))
    WHERE kind = 'user';
CREATE UNIQUE INDEX IF NOT EXISTS idx_repository_records_device_code
    ON repository_records ((payload->>'code'))
    WHERE kind = 'device';
