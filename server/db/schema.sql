-- VeloMedia DOOH Production PostgreSQL Relational Database Schema
-- Version: 2.4.0-prod
-- Multi-tenant isolation with strict foreign keys, indexes, and audit trails

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. SaaS Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(64) UNIQUE NOT NULL,
    subdomain VARCHAR(128) UNIQUE NOT NULL,
    cnpj VARCHAR(32) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    plan_tier VARCHAR(64) NOT NULL DEFAULT 'starter',
    active_screens_count INT DEFAULT 0,
    max_screens_limit INT NOT NULL DEFAULT 5,
    active_campaigns_count INT DEFAULT 0,
    max_campaigns_limit INT NOT NULL DEFAULT 10,
    active_drivers_count INT DEFAULT 0,
    max_drivers_limit INT NOT NULL DEFAULT 5,
    admin_name VARCHAR(120) NOT NULL,
    admin_email VARCHAR(120) NOT NULL,
    admin_phone VARCHAR(32) NOT NULL,
    billing_email VARCHAR(120) NOT NULL,
    billing_cycle VARCHAR(32) NOT NULL DEFAULT 'monthly',
    next_billing_date DATE,
    monthly_software_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estimated_gross_ad_revenue NUMERIC(12, 2) DEFAULT 0.00,
    driver_payout_total NUMERIC(12, 2) DEFAULT 0.00,
    net_profit NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

-- 2. Users with Multi-Tenant RBAC
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone VARCHAR(32) NOT NULL DEFAULT '',
    role VARCHAR(32) NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    password_hash VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    avatar VARCHAR(255),
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Sessions (HttpOnly Cookie Bearer)
CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(120) NOT NULL,
    user_name VARCHAR(120) NOT NULL,
    role VARCHAR(32) NOT NULL,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    expires_at BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_org ON sessions(organization_id);

-- 4. Drivers
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    avatar VARCHAR(255),
    car_plate VARCHAR(16) NOT NULL,
    car_model VARCHAR(100) NOT NULL,
    car_color VARCHAR(50) NOT NULL,
    service_type VARCHAR(50) NOT NULL DEFAULT 'Uber/99',
    phone VARCHAR(32) NOT NULL,
    pix_key VARCHAR(128) NOT NULL,
    pix_key_type VARCHAR(32) NOT NULL,
    total_rides_month INT NOT NULL DEFAULT 0,
    total_earnings_month NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    pending_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    monthly_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    screen_uptime_rating NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    referral_code VARCHAR(32),
    working_city VARCHAR(100) NOT NULL,
    working_region VARCHAR(150) NOT NULL,
    working_center_lat NUMERIC(10, 7) NOT NULL,
    working_center_lng NUMERIC(10, 7) NOT NULL,
    working_radius_km NUMERIC(5, 2) NOT NULL DEFAULT 15.0,
    working_poles JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_drivers_org ON drivers(organization_id);
CREATE INDEX IF NOT EXISTS idx_drivers_plate ON drivers(car_plate);

-- 5. Devices (In-Car Tablets)
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL UNIQUE,
    serial_number VARCHAR(64) NOT NULL,
    model VARCHAR(100) NOT NULL,
    screen_position VARCHAR(32) NOT NULL,
    hardware_ownership VARCHAR(32) NOT NULL DEFAULT 'company_owned',
    status VARCHAR(32) NOT NULL DEFAULT 'offline',
    driver_id VARCHAR(64) REFERENCES drivers(id) ON DELETE SET NULL,
    driver_name VARCHAR(120) NOT NULL,
    car_plate VARCHAR(16) NOT NULL,
    car_model VARCHAR(100) NOT NULL,
    current_lat NUMERIC(10, 7) NOT NULL DEFAULT 0.0,
    current_lng NUMERIC(10, 7) NOT NULL DEFAULT 0.0,
    speed_kmh NUMERIC(5, 2) DEFAULT 0.0,
    heading NUMERIC(5, 2) DEFAULT 0.0,
    address TEXT,
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    telemetry JSONB NOT NULL DEFAULT '{}'::jsonb,
    hardware_specs JSONB NOT NULL DEFAULT '{}'::jsonb,
    active_campaign_id VARCHAR(64),
    offline_queue_count INT NOT NULL DEFAULT 0,
    total_impressions_today INT NOT NULL DEFAULT 0,
    total_interactions_today INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_devices_org ON devices(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_driver ON devices(driver_id);
CREATE INDEX IF NOT EXISTS idx_devices_code ON devices(code);

-- 6. Device Cryptographic Credentials (HMAC Signing)
CREATE TABLE IF NOT EXISTS device_credentials (
    device_id VARCHAR(64) PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    device_secret VARCHAR(128) NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_device_credentials_org ON device_credentials(organization_id);

-- 7. Device Pairing Tokens (Single-Use, Time-Limited)
CREATE TABLE IF NOT EXISTS pairing_tokens (
    token VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    driver_id VARCHAR(64) NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    screen_position VARCHAR(32) NOT NULL,
    hardware_ownership VARCHAR(32) NOT NULL,
    expires_at BIGINT NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pairing_tokens_org ON pairing_tokens(organization_id);

-- 8. GeoFences
CREATE TABLE IF NOT EXISTS geofences (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    city VARCHAR(100) NOT NULL,
    description TEXT,
    center_lat NUMERIC(10, 7) NOT NULL,
    center_lng NUMERIC(10, 7) NOT NULL,
    radius_km NUMERIC(6, 2) NOT NULL,
    color VARCHAR(16) NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_geofences_org ON geofences(organization_id);

-- 9. Advertisers
CREATE TABLE IF NOT EXISTS advertisers (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_name VARCHAR(150) NOT NULL,
    trade_name VARCHAR(150) NOT NULL,
    cnpj VARCHAR(32) NOT NULL,
    category VARCHAR(64) NOT NULL,
    contact_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    billing_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    payment_terms VARCHAR(32) NOT NULL DEFAULT 'prepaid',
    credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    active_campaigns_count INT NOT NULL DEFAULT 0,
    total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    portal_access_code VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_advertisers_org ON advertisers(organization_id);

-- 10. Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    advertiser VARCHAR(150) NOT NULL,
    logo VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    budget_total NUMERIC(12, 2) NOT NULL,
    budget_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cpm NUMERIC(8, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    creative JSONB NOT NULL,
    target_geofences JSONB NOT NULL DEFAULT '["all"]'::jsonb,
    schedule JSONB NOT NULL,
    total_impressions INT NOT NULL DEFAULT 0,
    total_interactions INT NOT NULL DEFAULT 0,
    total_scans INT NOT NULL DEFAULT 0,
    target_impressions INT NOT NULL DEFAULT 0,
    priority INT NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- 11. Proof of Play (PoP) Logs (Tamper-Proof, Cryptographically Signed)
CREATE TABLE IF NOT EXISTS proof_of_play_logs (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_id VARCHAR(64) UNIQUE NOT NULL,
    device_id VARCHAR(64) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    campaign_id VARCHAR(64) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    creative_id VARCHAR(64),
    campaign_name VARCHAR(150) NOT NULL,
    advertiser VARCHAR(150) NOT NULL,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_watched_sec INT NOT NULL,
    location JSONB NOT NULL,
    interacted BOOLEAN NOT NULL DEFAULT FALSE,
    interaction_type VARCHAR(32),
    verified_hash VARCHAR(128) NOT NULL,
    signature VARCHAR(128) NOT NULL,
    nonce VARCHAR(64) NOT NULL,
    synced_online BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pop_org ON proof_of_play_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_pop_device ON proof_of_play_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_pop_campaign ON proof_of_play_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_pop_nonce ON proof_of_play_logs(nonce);

-- 12. Nonce Anti-Replay Ledger
CREATE TABLE IF NOT EXISTS anti_replay_nonces (
    nonce VARCHAR(64) PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_replay_ts ON anti_replay_nonces(timestamp);

-- 13. SaaS Invoices & Billing
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    organization_name VARCHAR(255) NOT NULL,
    month VARCHAR(64) NOT NULL,
    screens_billed INT NOT NULL,
    devices_billed INT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(32) NOT NULL DEFAULT 'pix',
    txid VARCHAR(64),
    pix_qr_code TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);

-- 14. Webhook Events Ledger (Idempotency)
CREATE TABLE IF NOT EXISTS webhook_events (
    event_id VARCHAR(64) PRIMARY KEY,
    provider VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(64),
    user_email VARCHAR(120),
    action VARCHAR(64) NOT NULL,
    resource VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
