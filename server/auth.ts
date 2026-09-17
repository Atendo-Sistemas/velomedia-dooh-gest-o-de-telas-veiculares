import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { SessionRecord } from './storage';
import type { SaaSUserRole } from '../src/types';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: SaaSUserRole;
  organizationId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionToken?: string;
      deviceId?: string;
    }
  }
}

/**
 * Authentication middleware for web users and APIs
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Extract token from HttpOnly Cookie or Authorization header
  let token: string | undefined = req.cookies?.velo_session;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
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

  // Device hardware authentication (for Kiosk IoT tablets)
  const deviceIdHeader = req.headers['x-device-id'] as string | undefined;
  if (deviceIdHeader) {
    req.deviceId = deviceIdHeader;
  }

  next();
}

/**
 * Guard that requires an active authenticated session
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Sessão inválida ou expirada. Por favor, autentique-se novamente.',
    });
    return;
  }
  next();
}

/**
 * Guard that requires specific RBAC roles
 */
export function requireRole(allowedRoles: AuthenticatedUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Autenticação necessária.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Acesso negado para o perfil '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
}

/**
 * Resolves the effective tenant:
 * - If user is platform_admin, they can specify an org via query/header or default to their own.
 * - For any other role, forces their assigned organizationId, strictly blocking data leakage.
 */
export function resolveTenant(req: Request): string {
  if (!req.user) {
    return 'org_sp_matriz'; // fallback for public routes if any
  }

  if (req.user.role === 'platform_admin' || req.user.role === 'super_admin') {
    const requestedOrg = (req.query.orgId as string) || (req.headers['x-organization-id'] as string);
    if (requestedOrg) return requestedOrg;
  }

  return req.user.organizationId;
}
