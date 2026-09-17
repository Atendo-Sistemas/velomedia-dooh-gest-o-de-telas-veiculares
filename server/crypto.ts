import crypto from 'node:crypto';

/**
 * Retrieve an environment secret safely with strict production enforcement.
 */
export function getRequiredSecret(name: string, devFallback?: string): string {
  const val = process.env[name];
  if (val && val.trim().length > 0) {
    return val.trim();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`[FATAL SECURITY CONFIG] Environment variable '${name}' is required in production.`);
  }
  if (devFallback) {
    return devFallback;
  }
  throw new Error(`[SECURITY CONFIG] Missing required variable '${name}'.`);
}

/**
 * Hash a password using PBKDF2 with 100,000 iterations and salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against stored salt:hash with constant-time comparison
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');
    if (hashBuffer.length !== computedBuffer.length) return false;
    return crypto.timingSafeEqual(hashBuffer, computedBuffer);
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically secure random session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a 6-digit numeric pairing code for automotive kiosks
 */
export function generatePairingCode(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Generate a unique device secret key
 */
export function generateDeviceSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * SHA-256 hash of a request body for payload integrity checking
 */
export function hashRequestBody(body: string | object | undefined): string {
  const str = typeof body === 'object' ? JSON.stringify(body) : (body || '');
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Canonical string representation for HTTP device requests
 */
export function buildDeviceRequestCanonicalString(params: {
  method: string;
  path: string;
  timestamp: string;
  nonce: string;
  bodyHash: string;
}): string {
  return [
    params.method.toUpperCase(),
    params.path.toLowerCase(),
    params.timestamp,
    params.nonce,
    params.bodyHash,
  ].join('\n');
}

/**
 * Sign an HTTP request using the device's secret key
 */
export function signDeviceRequest(
  params: {
    method: string;
    path: string;
    timestamp: string;
    nonce: string;
    bodyHash: string;
  },
  deviceSecret: string
): string {
  const canonical = buildDeviceRequestCanonicalString(params);
  return crypto.createHmac('sha256', deviceSecret).update(canonical).digest('hex');
}

/**
 * Verify a device HTTP request signature
 */
export function verifyDeviceRequestSignature(
  params: {
    method: string;
    path: string;
    timestamp: string;
    nonce: string;
    bodyHash: string;
    signature: string;
  },
  deviceSecret: string
): boolean {
  try {
    const expected = signDeviceRequest(params, deviceSecret);
    const expectedBuf = Buffer.from(expected, 'hex');
    const providedBuf = Buffer.from(params.signature, 'hex');
    if (expectedBuf.length !== providedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}

/**
 * Canonical payload string for Proof of Play HMAC computation
 */
export function buildProofOfPlayCanonicalString(params: {
  eventId: string;
  deviceId: string;
  campaignId: string;
  creativeId?: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  nonce: string;
}): string {
  return [
    params.eventId,
    params.deviceId,
    params.campaignId,
    params.creativeId || '',
    params.startedAt,
    params.endedAt,
    params.durationMs.toString(),
    params.nonce,
  ].join('|');
}

/**
 * Calculate HMAC-SHA256 for Proof of Play event
 */
export function signProofOfPlay(
  params: {
    eventId: string;
    deviceId: string;
    campaignId: string;
    creativeId?: string;
    startedAt: string;
    endedAt: string;
    durationMs: number;
    nonce: string;
  },
  deviceSecret: string
): string {
  if (!deviceSecret) {
    throw new Error('deviceSecret is required to sign Proof of Play.');
  }
  const canonical = buildProofOfPlayCanonicalString(params);
  return crypto.createHmac('sha256', deviceSecret).update(canonical).digest('hex');
}

/**
 * Verify Proof of Play HMAC signature
 */
export function verifyProofOfPlaySignature(
  params: {
    eventId: string;
    deviceId: string;
    campaignId: string;
    creativeId?: string;
    startedAt: string;
    endedAt: string;
    durationMs: number;
    nonce: string;
    signature: string;
  },
  deviceSecret: string
): boolean {
  try {
    if (!deviceSecret || !params.signature) return false;
    const expected = signProofOfPlay(params, deviceSecret);
    const expectedBuffer = Buffer.from(expected, 'hex');
    const providedBuffer = Buffer.from(params.signature, 'hex');

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}

/**
 * Webhook signature verification
 */
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    if (!secret || !signature) return false;
    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const computedBuf = Buffer.from(computed, 'hex');
    const providedBuf = Buffer.from(signature, 'hex');
    if (computedBuf.length !== providedBuf.length) return false;
    return crypto.timingSafeEqual(computedBuf, providedBuf);
  } catch {
    return false;
  }
}
