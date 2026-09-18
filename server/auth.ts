import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { SessionRecord, DeviceCredentialRecord } from './storage';
import type { SaaSUserRole, DeviceStatus } from '../src/types';
import { 
  verifyDeviceRequestSignature, 
  hashRequestBody 
} from './crypto';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: SaaSUserRole;
  organizationId: string;
}

export interface AuthenticatedDevice {
  id: string;
  organizationId: string;
  code: string;
  model: string;
  status: DeviceStatus;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionToken?: string;
      device?: AuthenticatedDevice;
      deviceCredential?: DeviceCredentialRecord;
      resolvedTenantId?: string;
    }
  }
}

export const SESSION_COOKIE_NAME = 'velo_session';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

// Rate limiting against login brute force
interface LoginAttempt {
  count: number;
  firstAttempt: number;
  blockedUntil: number;
}
const loginAttempts = new Map<string, LoginAttempt>();

export function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (!attempt) return { allowed: true };

  if (attempt.blockedUntil > now) {
    const retryAfterSec = Math.ceil((attempt.blockedUntil - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  // If window expired (15 min), reset
  if (now - attempt.firstAttempt > 15 * 60 * 1000) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(key) || { count: 0, firstAttempt: now, blockedUntil: 0 };
  attempt.count += 1;

  if (attempt.count >= 5) {
    attempt.blockedUntil = now + 15 * 60 * 1000; // 15-minute lock
  }

  loginAttempts.set(key, attempt);
}

export function resetLoginRateLimit(key: string): void {
  loginAttempts.delete(key);
}

// Pairing Rate Limiting (Brute-force protection on 6-digit codes)
const pairingAttempts = new Map<string, LoginAttempt>();

export function checkPairingRateLimit(key: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const attempt = pairingAttempts.get(key);
  if (!attempt) return { allowed: true };

  if (attempt.blockedUntil > now) {
    const retryAfterSec = Math.ceil((attempt.blockedUntil - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  if (now - attempt.firstAttempt > 10 * 60 * 1000) {
    pairingAttempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedPairing(key: string): void {
  const now = Date.now();
  const attempt = pairingAttempts.get(key) || { count: 0, firstAttempt: now, blockedUntil: 0 };
  attempt.count += 1;

  if (attempt.count >= 5) {
    attempt.blockedUntil = now + 10 * 60 * 1000;
  }

  pairingAttempts.set(key, attempt);
}

export function resetPairingRateLimit(key: string): void {
  pairingAttempts.delete(key);
}

/**
 * Authentication middleware for web users and APIs
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Extract session token from HttpOnly Cookie or Bearer header (dev support)
  let token: string | undefined = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (token) {
    const session = storage.getSession(token);
    if (session) {
      req.user = {
        id: session.userId,
        email: session.userEmail,
        name: session.userName,
        role: session.role,
        organizationId: session.organizationId,
      };
      req.sessionToken = token;
    }
  }

  next();
}

/**
 * Guard that requires an active authenticated user session.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'unauthorized',
      message: 'Sessão inválida ou expirada. Autentique-se novamente.',
    });
    return;
  }
  next();
}

/**
 * Guard that requires specific RBAC roles.
 */
export function requireRole(allowedRoles: SaaSUserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'unauthorized', message: 'Autenticação necessária.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'forbidden',
        message: `Acesso negado para o perfil '${req.user.role}'. Permissão insuficiente.`,
      });
      return;
    }

    next();
  };
}

/**
 * Cryptographic device authentication for in-car tablets.
 * Requires HMAC-SHA256 signature over method, path, timestamp, nonce, and bodyHash.
 */
export function requireDeviceAuth(req: Request, res: Response, next: NextFunction): void {
  const deviceId = req.headers['x-device-id'] as string | undefined;
  const timestamp = req.headers['x-device-timestamp'] as string | undefined;
  const nonce = req.headers['x-device-nonce'] as string | undefined;
  const signature = req.headers['x-device-signature'] as string | undefined;

  if (!deviceId || !timestamp || !nonce || !signature) {
    res.status(401).json({
      error: 'device_authentication_required',
      message: 'Cabeçalhos de autenticação de dispositivo ausentes (x-device-id, x-device-timestamp, x-device-nonce, x-device-signature).',
    });
    return;
  }

  const timestampMs = parseInt(timestamp, 10);
  if (isNaN(timestampMs)) {
    res.status(400).json({ error: 'invalid_timestamp', message: 'x-device-timestamp deve ser numérico (ms).' });
    return;
  }

  // 1. Check time skew (max 5 minutes)
  const now = Date.now();
  if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
    res.status(401).json({
      error: 'device_clock_skew',
      message: 'Timestamp fora da janela aceitável de 5 minutos.',
    });
    return;
  }

  // 2. Anti-replay check for nonce
  const replayCheck = storage.checkAndRecordReplay(`req_${deviceId}_${timestamp}`, nonce, timestampMs);
  if (!replayCheck.valid) {
    res.status(401).json({
      error: 'device_replay_detected',
      message: replayCheck.reason || 'Replay de requisição detectado.',
    });
    return;
  }

  // 3. Find device credential
  const cred = storage.getDeviceCredential(deviceId);
  if (!cred || cred.revoked) {
    res.status(401).json({
      error: 'device_credentials_not_found',
      message: 'Credenciais criptográficas do dispositivo não encontradas ou revogadas.',
    });
    return;
  }

  // 4. Verify HMAC signature
  const bodyHash = hashRequestBody(req.body);
  const isValidSig = verifyDeviceRequestSignature(
    {
      method: req.method,
      path: req.originalUrl.split('?')[0],
      timestamp,
      nonce,
      bodyHash,
      signature,
    },
    cred.deviceSecret
  );

  if (!isValidSig) {
    res.status(401).json({
      error: 'invalid_device_signature',
      message: 'Assinatura HMAC-SHA256 do dispositivo inválida.',
    });
    return;
  }

  // 5. Look up device entity
  const device = storage.getDeviceByIdInternal(deviceId);
  if (!device || device.status === 'retired') {
    res.status(403).json({
      error: 'device_disabled',
      message: 'Dispositivo desativado ou não registrado.',
    });
    return;
  }

  req.deviceCredential = cred;
  req.device = {
    id: device.id,
    organizationId: device.organizationId,
    code: device.code,
    model: device.model,
    status: device.status,
  };
  req.resolvedTenantId = device.organizationId;

  next();
}

/**
 * Guard that allows either a valid user session OR valid cryptographic device authentication.
 */
export function requireUserOrDeviceAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.user) {
    req.resolvedTenantId = req.user.organizationId;
    return next();
  }

  // Check if device auth headers exist
  if (req.headers['x-device-id'] && req.headers['x-device-signature']) {
    return requireDeviceAuth(req, res, next);
  }

  res.status(401).json({
    error: 'unauthorized',
    message: 'Autenticação de usuário ou de dispositivo obrigatória.',
  });
}

/**
 * Resolves the effective tenant with strict multi-tenant isolation.
 * Throws an error if called without an authenticated principal.
 */
export function resolveTenant(req: Request): string {
  // 1. Device identity
  if (req.deviceCredential) {
    return req.deviceCredential.organizationId;
  }

  // 2. User identity
  if (req.user) {
    // Only platform_admin or super_admin may switch tenant context
    if (req.user.role === 'platform_admin' || req.user.role === 'super_admin') {
      const requestedOrg = (req.query.orgId as string) || (req.headers['x-organization-id'] as string);
      if (requestedOrg && requestedOrg.trim().length > 0) {
        const org = storage.getOrganizationById(requestedOrg);
        if (org && org.status === 'active') {
          // Log context switch audit
          storage.logAudit({
            organizationId: requestedOrg,
            userId: req.user.id,
            userEmail: req.user.email,
            action: 'ADMIN_TENANT_SWITCH',
            resource: 'organizations',
            resourceId: requestedOrg,
            details: { previousOrg: req.user.organizationId, targetOrg: requestedOrg },
            ipAddress: req.ip,
          });
          return requestedOrg;
        }
      }
    }

    // Standard users are strictly bound to their authenticated organization
    return req.user.organizationId;
  }

  throw new Error('Tenant resolution requires an authenticated user or device principal.');
}
