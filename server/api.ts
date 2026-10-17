import { Router } from 'express';
import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import { getVeloRepository } from './repository';
import { 
  verifyPassword, 
  generateSessionToken, 
  generatePairingCode, 
  generateDeviceSecret, 
  verifyProofOfPlaySignature 
} from './crypto';
import { 
  requireAuth, 
  requireRole, 
  resolveTenant, 
  requireDeviceAuth, 
  requireUserOrDeviceAuth,
  SESSION_COOKIE_NAME,
  COOKIE_OPTIONS,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit,
  checkPairingRateLimit,
  recordFailedPairing,
  resetPairingRateLimit
} from './auth';
import { 
  LoginSchema, 
  DriverSchema, 
  DeviceSchema, 
  DevicePairingRequestSchema,
  CampaignSchema, 
  GeoFenceSchema, 
  ProofOfPlaySubmissionSchema, 
  TelemetryHeartbeatSchema,
  RemoteCommandSchema,
  OrganizationSchema,
  PairingTokenRequestSchema,
  AdvertiserSchema,
  AdvertiserInvoiceRequestSchema,
  InvoiceSchema,
  SaaSPlanSchema,
  ChangePasswordSchema,
  CreateSaaSUserSchema,
  UpdateSaaSUserSchema,
  validateBody
} from './schemas';
import { pixGateway } from './billing';
import {
  adminRequestRateLimiter,
  asaasWebhookRateLimiter,
  commandAckRateLimiter,
  deviceRequestRateLimiter,
  loginRequestRateLimiter,
  publicPlayerRateLimiter,
} from './rate-limit';
import type { Device, Driver, Campaign, GeoFence, ProofOfPlayLog, AdvertiserAccount, SaaSInvoice, SaaSPlan, SaaSUser } from '../src/types';

export const apiRouter = Router();
const repository = getVeloRepository();
const routeMethods = ['get', 'post', 'put', 'patch', 'delete'] as const;
for (const method of routeMethods) {
  const router = apiRouter as any;
  const register = router[method].bind(apiRouter);
  router[method] = (...args: unknown[]) => register(...args.map(arg =>
    typeof arg === 'function'
      ? (req: Request, res: Response, next: (error?: unknown) => void) =>
        Promise.resolve((arg as (req: Request, res: Response, next: (error?: unknown) => void) => unknown)(req, res, next)).catch(next)
      : arg,
  ));
}

function buildAdvertiserRechargeInvoice(advertiser: AdvertiserAccount, organizationId: string, amount: number): SaaSInvoice {
  const issuedAt = new Date();
  const issueDate = issuedAt.toISOString().slice(0, 10);
  const id = randomUUID();
  return {
    id: `adv_inv_${id}`,
    invoiceNumber: `ADV-${issueDate.replaceAll('-', '')}-${id.slice(0, 8).toUpperCase()}`,
    organizationId,
    organizationName: advertiser.companyName,
    advertiserId: advertiser.id,
    purpose: 'advertiser_recharge',
    issueDate,
    dueDate: new Date(issuedAt.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    month: issueDate.slice(0, 7),
    amount,
    status: 'pending',
    screensBilled: 0,
    paymentMethod: 'pix',
  };
}

// ============================================================================
// 1. HEALTH & METRICS
// ============================================================================
apiRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    await repository.ping();
  } catch {
    res.status(503).json({ status: 'unhealthy', timestamp: new Date().toISOString() });
    return;
  }
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.5.0-beta.7',
    environment: process.env.NODE_ENV || 'production',
  });
});

apiRouter.get('/player/:deviceCode', publicPlayerRateLimiter, async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  const deviceCode = req.params.deviceCode;
  if (!deviceCode || deviceCode.length > 64) {
    res.status(404).json({ error: 'player_not_found', message: 'Player não encontrado.' });
    return;
  }
  const player = await repository.getPublicPlayerBootstrap(deviceCode);
  if (!player) {
    res.status(404).json({ error: 'player_not_found', message: 'Player não encontrado.' });
    return;
  }
  res.json(player);
});

// ============================================================================
// 2. AUTHENTICATION & SESSION
// ============================================================================
apiRouter.post('/auth/login', loginRequestRateLimiter, validateBody(LoginSchema), async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip || 'unknown-ip';
  const { email, password } = req.body;

  // 1. Rate limiting against brute force
  const rateLimit = checkLoginRateLimit(ip);
  if (!rateLimit.allowed) {
    res.status(429).json({
      error: 'too_many_attempts',
      message: `Muitas tentativas incorretas. Tente novamente em ${rateLimit.retryAfterSec} segundos.`,
    });
    return;
  }

  const user = await repository.getUserByEmail(email);

  if (!user || user.status !== 'active' || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    recordFailedLogin(ip);
    await repository.logAudit({
      organizationId: user?.organizationId || 'system',
      userEmail: email,
      action: 'AUTH_LOGIN_FAILED',
      resource: 'auth',
      ipAddress: ip,
      details: { reason: 'Invalid credentials' },
    });
    res.status(401).json({ error: 'invalid_credentials', message: 'E-mail ou senha incorretos.' });
    return;
  }
  if (user.role === 'advertiser') {
    const advertiser = user.advertiserId
      ? await repository.getAdvertiserById(user.advertiserId, user.organizationId)
      : undefined;
    if (!advertiser || advertiser.status !== 'active') {
      recordFailedLogin(ip);
      res.status(401).json({ error: 'invalid_credentials', message: 'E-mail ou senha incorretos.' });
      return;
    }
  }

  // Reset rate limit on success
  resetLoginRateLimit(ip);

  // Generate 7-day session token
  const token = generateSessionToken();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  await repository.createSession({
    token,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    role: user.role,
    organizationId: user.organizationId,
    expiresAt,
    createdAt: new Date().toISOString(),
  });

  // Set secure HttpOnly cookie
  res.cookie(SESSION_COOKIE_NAME, token, COOKIE_OPTIONS);

  await repository.logAudit({
    organizationId: user.organizationId,
    userId: user.id,
    userEmail: user.email,
    action: 'AUTH_LOGIN_SUCCESS',
    resource: 'auth',
    ipAddress: ip,
  });

  const { passwordHash: _, ...safeUser } = user;
  const org = await repository.getOrganizationById(user.organizationId);

  // Section 2.2: Do NOT return the token in JSON body; keep it exclusively in HttpOnly cookie
  res.json({
    user: safeUser,
    organization: user.role === 'advertiser' ? undefined : org,
  });
});

apiRouter.post('/auth/logout', async (req: Request, res: Response) => {
  if (req.sessionToken) {
    await repository.deleteSession(req.sessionToken);
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
});

apiRouter.get('/auth/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = await repository.getUserById(req.user!.id);
  const org = await repository.getOrganizationById(req.user!.organizationId);
  const safeUser = user
    ? (({ passwordHash: _passwordHash, ...publicUser }) => publicUser)(user as SaaSUser & { passwordHash?: string })
    : undefined;

  res.json({
    authenticated: true,
    user: user ? safeUser : undefined,
    organization: req.user!.role === 'advertiser' ? undefined : org,
  });
});

apiRouter.use((req: Request, res: Response, next) => {
  const isAuthRoute = req.path.startsWith('/auth/');
  const isAdvertiserPortalRoute = req.path === '/advertiser-portal' || req.path.startsWith('/advertiser-portal/');
  if (req.user?.role === 'advertiser' && !isAuthRoute && !isAdvertiserPortalRoute) {
    return res.status(403).json({ error: 'forbidden', message: 'Acesso restrito ao portal do anunciante.' });
  }
  next();
});

apiRouter.post('/auth/change-password', requireAuth, adminRequestRateLimiter, requireRole(['super_admin']), validateBody(ChangePasswordSchema), async (req: Request, res: Response) => {
    const user = await repository.getUserByEmail(req.user!.email);
    if (!user?.passwordHash || !verifyPassword(req.body.currentPassword, user.passwordHash)) {
      return res.status(401).json({ error: 'invalid_password', message: 'A senha atual está incorreta.' });
    }
    const { passwordHash: _passwordHash, ...safeUser } = user;
    await repository.saveUser(safeUser, req.body.newPassword);
    await repository.logAudit({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'CHANGE_SUPERADMIN_PASSWORD',
      resource: 'users',
      resourceId: req.user!.id,
      ipAddress: req.ip,
    });
    await repository.deleteSessionsForUser(req.user!.id);
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.json({ success: true, reauthenticationRequired: true });
  });

apiRouter.get('/users', requireAuth, requireRole(['super_admin']), async (_req: Request, res: Response) => {
  const users = await repository.getUsers();
  res.json(users.map(user => (({ passwordHash: _passwordHash, ...publicUser }) =>
    publicUser)(user as SaaSUser & { passwordHash?: string })));
});

apiRouter.post('/users', requireAuth, adminRequestRateLimiter, requireRole(['super_admin']), validateBody(CreateSaaSUserSchema), async (req: Request, res: Response) => {
    const { password, ...user } = req.body as SaaSUser & { password: string };
    if (!await repository.getOrganizationById(user.organizationId)) {
      return res.status(400).json({ error: 'invalid_organization', message: 'A organização selecionada não existe.' });
    }
    if (user.role === 'advertiser' && !await repository.getAdvertiserById(user.advertiserId!, user.organizationId)) {
      return res.status(400).json({ error: 'invalid_advertiser', message: 'O anunciante selecionado não pertence à organização.' });
    }
    if (await repository.getUserByEmail(user.email)) {
      return res.status(409).json({ error: 'user_exists', message: 'Já existe um usuário com este e-mail.' });
    }
    await repository.saveUser(user, password);
    await repository.logAudit({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'CREATE_USER',
      resource: 'users',
      resourceId: user.id,
      details: { role: user.role },
      ipAddress: req.ip,
    });
    res.status(201).json(user);
  });

apiRouter.put('/users/:id', requireAuth, adminRequestRateLimiter, requireRole(['super_admin']), validateBody(UpdateSaaSUserSchema), async (req: Request, res: Response) => {
    const user = req.body as SaaSUser & { password?: string };
    if (req.params.id !== user.id) {
      return res.status(400).json({ error: 'id_mismatch', message: 'O ID da URL deve corresponder ao ID do usuário.' });
    }
    if (!await repository.getOrganizationById(user.organizationId)) {
      return res.status(400).json({ error: 'invalid_organization', message: 'A organização selecionada não existe.' });
    }
    if (user.role === 'advertiser' && !await repository.getAdvertiserById(user.advertiserId!, user.organizationId)) {
      return res.status(400).json({ error: 'invalid_advertiser', message: 'O anunciante selecionado não pertence à organização.' });
    }
    const existing = await repository.getUserById(user.id);
    if (!existing) return res.status(404).json({ error: 'not_found', message: 'Usuário não encontrado.' });
    const byEmail = await repository.getUserByEmail(user.email);
    if (byEmail && byEmail.id !== user.id) {
      return res.status(409).json({ error: 'user_exists', message: 'Já existe um usuário com este e-mail.' });
    }
    const { password, ...safeUser } = user;
    await repository.saveUser(safeUser, password);
    if (password) await repository.deleteSessionsForUser(user.id);
    await repository.logAudit({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: password ? 'UPDATE_USER_AND_PASSWORD' : 'UPDATE_USER',
      resource: 'users',
      resourceId: user.id,
      details: { role: user.role },
      ipAddress: req.ip,
    });
    res.json(safeUser);
  });

apiRouter.delete('/users/:id', requireAuth, adminRequestRateLimiter, requireRole(['super_admin']), async (req: Request, res: Response) => {
    const user = await repository.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'not_found', message: 'Usuário não encontrado.' });
    if (user.id === req.user!.id) {
      return res.status(409).json({ error: 'cannot_delete_self', message: 'Não é possível excluir o usuário conectado.' });
    }
    if (user.role === 'super_admin') {
      const activeAdmins = (await repository.getUsers()).filter(candidate => candidate.role === 'super_admin' && candidate.status === 'active');
      if (activeAdmins.length <= 1) {
        return res.status(409).json({ error: 'last_super_admin', message: 'O sistema precisa manter ao menos um superusuário ativo.' });
      }
    }
    await repository.deleteSessionsForUser(user.id);
    const deleted = await repository.deleteUser(user.id, user.organizationId);
    if (!deleted) return res.status(404).json({ error: 'not_found', message: 'Usuário não encontrado.' });
    await repository.logAudit({
      organizationId: req.user!.organizationId,
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'DELETE_USER',
      resource: 'users',
      resourceId: user.id,
      ipAddress: req.ip,
    });
    res.json({ success: true });
});

// ============================================================================
// 3. ORGANIZATIONS (Super Admin / Multi-Tenant Master)
// ============================================================================
apiRouter.get('/plans', requireAuth, async (_req: Request, res: Response) => {
  res.json(await repository.getPlans());
});

apiRouter.post('/plans', requireAuth, adminRequestRateLimiter, requireRole(['platform_admin', 'super_admin']), validateBody(SaaSPlanSchema), async (req: Request, res: Response) => {
  if (await repository.getPlanById(req.body.id)) {
    return res.status(409).json({ error: 'plan_exists', message: 'Já existe um plano com este identificador.' });
  }
  const saved = await repository.savePlan(req.body as SaaSPlan);
  if (!saved) return res.status(409).json({ error: 'plan_conflict', message: 'Não foi possível salvar o plano.' });
  await repository.logAudit({
    organizationId: req.user!.organizationId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'CREATE_PLAN',
    resource: 'plans',
    resourceId: saved.id,
    details: { name: saved.name },
    ipAddress: req.ip,
  });
  res.status(201).json(saved);
});

apiRouter.put('/plans/:id', requireAuth, adminRequestRateLimiter, requireRole(['platform_admin', 'super_admin']), validateBody(SaaSPlanSchema), async (req: Request, res: Response) => {
  if (req.params.id !== req.body.id) {
    return res.status(400).json({ error: 'id_mismatch', message: 'O ID da URL deve corresponder ao ID do plano.' });
  }
  if (!await repository.getPlanById(req.params.id)) {
    return res.status(404).json({ error: 'not_found', message: 'Plano não encontrado.' });
  }
  const saved = await repository.savePlan(req.body as SaaSPlan);
  if (!saved) return res.status(409).json({ error: 'plan_conflict', message: 'Não foi possível atualizar o plano.' });
  await repository.logAudit({
    organizationId: req.user!.organizationId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'UPDATE_PLAN',
    resource: 'plans',
    resourceId: saved.id,
    details: { name: saved.name },
    ipAddress: req.ip,
  });
  res.json(saved);
});

apiRouter.delete('/plans/:id', requireAuth, adminRequestRateLimiter, requireRole(['platform_admin', 'super_admin']), async (req: Request, res: Response) => {
  const plans = await repository.getPlans();
  if (plans.length <= 1) {
    return res.status(409).json({ error: 'last_plan', message: 'O sistema precisa manter ao menos um plano.' });
  }
  const plan = await repository.getPlanById(req.params.id);
  if (!plan) return res.status(404).json({ error: 'not_found', message: 'Plano não encontrado.' });

  const organizations = await repository.getOrganizations();
  for (const organization of organizations) {
    if (organization.planTier === plan.id) {
      return res.status(409).json({ error: 'plan_in_use', message: 'Não é possível excluir um plano contratado por uma organização.' });
    }
    const invoices = await repository.getInvoices(organization.id);
    if (invoices.some(invoice => invoice.planTier === plan.id)) {
      return res.status(409).json({ error: 'plan_has_invoices', message: 'Não é possível excluir um plano vinculado a faturas.' });
    }
  }

  const deleted = await repository.deletePlan(plan.id);
  if (!deleted) return res.status(404).json({ error: 'not_found', message: 'Plano não encontrado.' });
  await repository.logAudit({
    organizationId: req.user!.organizationId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'DELETE_PLAN',
    resource: 'plans',
    resourceId: plan.id,
    details: { name: plan.name },
    ipAddress: req.ip,
  });
  res.json({ success: true });
});

apiRouter.get('/organizations', requireAuth, async (req: Request, res: Response) => {
  if (req.user!.role === 'platform_admin' || req.user!.role === 'super_admin') {
    return res.json(await repository.getOrganizations());
  }
  const userOrg = await repository.getOrganizationById(req.user!.organizationId);
  res.json(userOrg ? [userOrg] : []);
});

apiRouter.post('/organizations', requireAuth, requireRole(['platform_admin', 'super_admin']), validateBody(OrganizationSchema), async (req: Request, res: Response) => {
  if (!await repository.getPlanById(req.body.planTier)) {
    return res.status(400).json({ error: 'invalid_plan', message: 'Selecione um plano cadastrado.' });
  }
  await repository.saveOrganization(req.body);
  await repository.logAudit({
    organizationId: req.body.id,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'CREATE_ORGANIZATION',
    resource: 'organizations',
    resourceId: req.body.id,
    ipAddress: req.ip,
  });
  res.status(201).json(req.body);
});

apiRouter.put('/organizations/:id', requireAuth, requireRole(['platform_admin', 'super_admin']), validateBody(OrganizationSchema), async (req: Request, res: Response) => {
  if (req.params.id !== req.body.id) {
    return res.status(400).json({ error: 'id_mismatch', message: 'O ID da URL deve corresponder ao ID da organização.' });
  }
  if (!await repository.getPlanById(req.body.planTier)) {
    return res.status(400).json({ error: 'invalid_plan', message: 'Selecione um plano cadastrado.' });
  }
  await repository.saveOrganization(req.body);
  await repository.logAudit({
    organizationId: req.user!.organizationId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'UPDATE_ORGANIZATION',
    resource: 'organizations',
    resourceId: req.body.id,
    ipAddress: req.ip,
  });
  res.json(req.body);
});

apiRouter.delete('/organizations/:id', requireAuth, requireRole(['platform_admin', 'super_admin']), async (req: Request, res: Response) => {
  const deleted = await repository.deleteOrganization(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'not_found', message: 'Organização não encontrada.' });
  }
  await repository.logAudit({
    organizationId: req.user!.organizationId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'DELETE_ORGANIZATION',
    resource: 'organizations',
    resourceId: req.params.id,
    ipAddress: req.ip,
  });
  res.json({ success: true });
});

// ============================================================================
// 4. DRIVERS (Strict Multi-Tenant Isolation)
// ============================================================================
apiRouter.get('/drivers', requireAuth, async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  res.json(await repository.getDrivers(tenantId));
});

apiRouter.post('/drivers', requireAuth, validateBody(DriverSchema), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const saved = await repository.saveDriver(req.body as Driver, tenantId);
  if (!saved) {
    return res.status(409).json({ error: 'conflict', message: 'Motorista já existe em outro tenant.' });
  }
  await repository.logAudit({
    organizationId: tenantId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'CREATE_DRIVER',
    resource: 'drivers',
    resourceId: saved.id,
    ipAddress: req.ip,
  });
  res.status(201).json(saved);
});

apiRouter.put('/drivers/:id', requireAuth, validateBody(DriverSchema), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const existing = await repository.getDriverById(req.params.id, tenantId);
  if (!existing) {
    return res.status(404).json({ error: 'not_found', message: 'Motorista não encontrado neste tenant.' });
  }

  const updated = await repository.saveDriver(req.body as Driver, tenantId);
  await repository.logAudit({
    organizationId: tenantId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'UPDATE_DRIVER',
    resource: 'drivers',
    resourceId: updated?.id || req.params.id,
    ipAddress: req.ip,
  });
  res.json(updated);
});

apiRouter.delete('/drivers/:id', requireAuth, async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const deleted = await repository.deleteDriver(req.params.id, tenantId);
  if (!deleted) {
    return res.status(404).json({ error: 'not_found', message: 'Motorista não encontrado neste tenant.' });
  }
  await repository.logAudit({
    organizationId: tenantId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'DELETE_DRIVER',
    resource: 'drivers',
    resourceId: req.params.id,
    ipAddress: req.ip,
  });
  res.json({ success: true });
});

apiRouter.post('/drivers/:id/payout', requireAuth, requireRole(['platform_admin', 'super_admin', 'operator']), async (req: Request, res: Response) => {
  await repository.logAudit({
    organizationId: req.user!.organizationId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'DRIVER_PAYOUT_REJECTED',
    resource: 'driver_payouts',
    resourceId: req.params.id,
    details: { reason: 'payment_provider_not_configured' },
    ipAddress: req.ip,
  });
  res.status(503).json({
    error: 'payment_provider_not_configured',
    message: 'Repasses PIX não podem ser processados até que um provedor transacional seja integrado.',
  });
});

// ============================================================================
// 5. DEVICES (Strict Multi-Tenant Isolation & Cryptographic Pairing)
// ============================================================================
apiRouter.get('/devices', requireAuth, async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  res.json(await repository.getDevices(tenantId));
});

apiRouter.post('/devices', requireAuth, validateBody(DeviceSchema), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const saved = await repository.saveDevice(req.body as Device, tenantId);
  if (!saved) {
    return res.status(409).json({ error: 'conflict', message: 'Dispositivo já registrado em outro tenant.' });
  }
  res.status(201).json(saved);
});

apiRouter.put('/devices/:id', requireAuth, validateBody(DeviceSchema), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const existing = await repository.getDeviceById(req.params.id, tenantId);
  if (!existing) {
    return res.status(404).json({ error: 'not_found', message: 'Dispositivo não encontrado neste tenant.' });
  }

  const updated = await repository.saveDevice(req.body as Device, tenantId);
  res.json(updated);
});

apiRouter.delete('/devices/:id', requireAuth, async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const deleted = await repository.deleteDevice(req.params.id, tenantId);
  if (!deleted) {
    return res.status(404).json({ error: 'not_found', message: 'Dispositivo não encontrado neste tenant.' });
  }
  res.json({ success: true });
});

/**
 * Generate 6-digit pairing code for in-car tablet
 */
apiRouter.post('/devices/pairing-token', requireAuth, requireRole(['platform_admin', 'operator', 'super_admin']), validateBody(PairingTokenRequestSchema), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const driverId = req.body.driverId || '';
  if (driverId && !await repository.getDriverById(driverId, tenantId)) {
    return res.status(404).json({ error: 'driver_not_found', message: 'Motorista não encontrado neste tenant.' });
  }
  const code = generatePairingCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  await repository.createPairingToken({
    token: code,
    organizationId: tenantId,
    driverId,
    screenPosition: req.body.screenPosition || 'headrest_right',
    hardwareOwnership: req.body.hardwareOwnership || 'driver_byod',
    expiresAt,
    used: false,
    createdAt: new Date().toISOString(),
  });

  res.json({
    pairingCode: code,
    expiresInSeconds: 600,
    expiresAt: new Date(expiresAt).toISOString(),
  });
});

/**
 * Cryptographic tablet pairing endpoint.
 * Generates unique deviceSecret and saves device credentials.
 */
apiRouter.post('/devices/pair', validateBody(DevicePairingRequestSchema), async (req: Request, res: Response): Promise<void> => {
  const { pairingCode, model, serialNumber, screenPosition, hardwareOwnership } = req.body;
  const ip = req.ip || 'unknown-ip';
  const rateLimit = checkPairingRateLimit(ip);
  if (!rateLimit.allowed) {
    res.status(429).json({
      error: 'too_many_attempts',
      message: `Muitas tentativas de pareamento. Tente novamente em ${rateLimit.retryAfterSec} segundos.`,
    });
    return;
  }

  const tokenRecord = await repository.getPairingToken(pairingCode);
  if (!tokenRecord) {
    recordFailedPairing(ip);
    res.status(400).json({ error: 'invalid_code', message: 'Código de pareamento inválido ou expirado.' });
    return;
  }

  const orgId = tokenRecord.organizationId;
  const driver = tokenRecord.driverId ? await repository.getDriverById(tokenRecord.driverId, orgId) : undefined;
  const deviceId = `dev_${randomUUID()}`;
  const deviceCode = `TV-${orgId.substring(0, 4).toUpperCase()}-${randomInt(1000, 10000)}`;
  const deviceSecret = generateDeviceSecret();

  const newDevice: Device = {
    id: deviceId,
    code: deviceCode,
    serialNumber: serialNumber || `SN-${Date.now()}`,
    model: model || 'Android Tablet Kiosk',
    screenPosition,
    hardwareOwnership,
    status: 'online',
    driverId: driver?.id || '',
    driverName: driver?.name || 'Não Atribuído',
    carPlate: driver?.carPlate || '',
    carModel: driver?.carModel || '',
    offlineQueueCount: 0,
    currentLocation: driver?.workingCenter ? {
      lat: driver.workingCenter.lat,
      lng: driver.workingCenter.lng,
      speedKmH: 0,
      heading: 0,
      city: driver.workingCity,
      neighborhood: 'Região Operacional',
    } : { lat: -23.561684, lng: -46.655981, speedKmH: 0, heading: 0, city: 'São Paulo', neighborhood: 'Centro' },
    telemetry: {
      powerConnected: true,
      batteryLevel: 100,
      batteryVoltage: 12.6,
      cpuTemp: 35.0,
      signalStrength: '4G_GOOD',
      signalDbm: -72,
      storageFreeGb: 16.0,
      totalStorageGb: 32.0,
      currentFps: 60,
      brightness: 80,
      volume: 50,
      appVersion: '2.5.0-beta.7',
      lastHeartbeat: new Date().toISOString(),
      kioskLocked: true,
      screenUptimeTodayHours: 0,
      uptimeHours: 0,
      screenBrightnessPct: 80,
    },
    hardwareSpecs: {
      brand: 'Android DOOH Hardware',
      tabletModel: model,
      screenSizeInches: 10.1,
      resolution: '1920x1200',
      panelType: 'IPS LCD',
      brightnessNits: 500,
      aspectRatio: '16:10',
      orientation: 'landscape',
      osVersion: 'Android 14',
      macAddress: '02:00:00:00:00:01',
      imei: '000000000000001',
      simCarrier: 'IoT M2M',
      connectivity: '4G_LTE_M2M',
      mountType: 'Suporte de Encosto Antifurto',
      powerSupply: '12V Pós-Chave',
      storageGb: 32,
      ramGb: 4,
      refreshRateHz: 60,
    },
    totalImpressionsToday: 0,
    totalInteractionsToday: 0,
    organizationId: orgId,
  };

  const paired = await repository.consumeAndProvisionDevice(pairingCode, newDevice, {
    deviceId,
    organizationId: orgId,
    deviceSecret,
    revoked: false,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  }, {
    organizationId: orgId,
    action: 'DEVICE_PAIRED',
    resource: 'devices',
    resourceId: deviceId,
    details: { model, serialNumber, driverId: driver?.id },
    ipAddress: req.ip,
  });
  if (!paired) {
    recordFailedPairing(ip);
    res.status(400).json({ error: 'invalid_code', message: 'Código de pareamento inválido, expirado ou já utilizado.' });
    return;
  }
  resetPairingRateLimit(ip);

  // Return device and one-time provisioned deviceSecret
  res.status(201).json({
    success: true,
    device: newDevice,
    deviceSecret,
    organizationId: orgId,
  });
});

// ============================================================================
// 6. CAMPAIGNS (Strict Multi-Tenant Isolation)
// ============================================================================
apiRouter.get('/campaigns', requireAuth, async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  res.json(await repository.getCampaigns(tenantId));
});

apiRouter.post('/campaigns', requireAuth, validateBody(CampaignSchema), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const saved = await repository.saveCampaign(req.body as Campaign, tenantId);
  if (!saved) {
    return res.status(409).json({ error: 'conflict', message: 'Campanha já existe em outro tenant.' });
  }
  res.status(201).json(saved);
});

apiRouter.put('/campaigns/:id', requireAuth, validateBody(CampaignSchema), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const existing = await repository.getCampaignById(req.params.id, tenantId);
  if (!existing) {
    return res.status(404).json({ error: 'not_found', message: 'Campanha não encontrada neste tenant.' });
  }

  const updated = await repository.saveCampaign(req.body as Campaign, tenantId);
  res.json(updated);
});

apiRouter.delete('/campaigns/:id', requireAuth, async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const deleted = await repository.deleteCampaign(req.params.id, tenantId);
  if (!deleted) {
    return res.status(404).json({ error: 'not_found', message: 'Campanha não encontrada neste tenant.' });
  }
  res.json({ success: true });
});

// ============================================================================
// 7. GEOFENCES (Strict Multi-Tenant Isolation)
// ============================================================================
apiRouter.get('/geofences', requireAuth, async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  res.json(await repository.getGeoFences(tenantId));
});

apiRouter.post('/geofences', requireAuth, validateBody(GeoFenceSchema), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const saved = await repository.saveGeoFence(req.body as GeoFence, tenantId);
  if (!saved) {
    return res.status(409).json({ error: 'conflict', message: 'GeoFence já existe em outro tenant.' });
  }
  res.status(201).json(saved);
});

apiRouter.put('/geofences/:id', requireAuth, validateBody(GeoFenceSchema), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const existing = await repository.getGeoFenceById(req.params.id, tenantId);
  if (!existing) {
    return res.status(404).json({ error: 'not_found', message: 'GeoFence não encontrada neste tenant.' });
  }
  const updated = await repository.saveGeoFence(req.body as GeoFence, tenantId);
  res.json(updated);
});

apiRouter.delete('/geofences/:id', requireAuth, async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const deleted = await repository.deleteGeoFence(req.params.id, tenantId);
  if (!deleted) {
    return res.status(404).json({ error: 'not_found', message: 'GeoFence não encontrada neste tenant.' });
  }
  res.json({ success: true });
});

// ============================================================================
// 8. PROOF OF PLAY (Tamper-Proof, Anti-Replay & HMAC Cryptographic Validation)
// ============================================================================
apiRouter.get('/proof-of-play', requireAuth, async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 500);
  res.json(await repository.getProofOfPlayLogs(tenantId, limit));
});

/**
 * Ingest cryptographically signed Proof-of-Play from tablet.
 * Section 6 & Fase 3: Server NEVER signs on behalf of client.
 * Requires device cryptographic auth (requireDeviceAuth), valid payload signature,
 * matching device identity, and records anti-replay nonce only after signature verification.
 */
apiRouter.post(
  '/proof-of-play',
  requireDeviceAuth,
  deviceRequestRateLimiter,
  validateBody(ProofOfPlaySubmissionSchema),
  async (req: Request, res: Response): Promise<void> => {
    const item = req.body;
    const authDevice = req.device!;
    const cred = req.deviceCredential!;

    // 1. Validate device match (authenticated device in headers vs payload deviceId)
    if (authDevice.id !== item.deviceId && authDevice.code !== item.deviceId) {
      res.status(403).json({
        error: 'device_mismatch',
        message: 'O dispositivo autenticado na requisição difere do deviceId informado no payload.',
      });
      return;
    }

    // 2. Validate device state
    if (authDevice.status === 'retired') {
      res.status(403).json({
        error: 'device_retired',
        message: 'Dispositivo desativado permanentemente.',
      });
      return;
    }

    // 3. Validate campaign exists and belongs to the device's tenant
    const tenantId = authDevice.organizationId;
    const campaign = await repository.getCampaignById(item.campaignId, tenantId);
    if (!campaign) {
      res.status(404).json({
        error: 'campaign_not_found',
        message: 'Campanha não encontrada ou pertence a outra organização.',
      });
      return;
    }

    if (campaign.status !== 'active') {
      res.status(400).json({
        error: 'campaign_not_active',
        message: 'A campanha informada não está ativa para veiculação.',
      });
      return;
    }

    // 4. Verify Proof of Play HMAC signature (BEFORE registering anti-replay nonce)
    const isSignatureValid = verifyProofOfPlaySignature(
      {
        eventId: item.eventId,
        deviceId: authDevice.id,
        campaignId: item.campaignId,
        creativeId: item.creativeId,
        startedAt: item.startedAt,
        endedAt: item.endedAt,
        durationMs: item.durationMs,
        nonce: item.nonce,
        signature: item.signature,
      },
      cred.deviceSecret
    );

    if (!isSignatureValid) {
      res.status(401).json({
        error: 'invalid_proof_of_play_signature',
        message: 'Assinatura HMAC de Proof of Play inválida ou adulterada.',
      });
      return;
    }

    // 5. Validate timestamp window and duration consistency
    const startedAtTimestamp = new Date(item.startedAt).getTime();
    const endedAtTimestamp = new Date(item.endedAt).getTime();

    if (isNaN(startedAtTimestamp) || isNaN(endedAtTimestamp) || endedAtTimestamp < startedAtTimestamp) {
      res.status(400).json({ error: 'invalid_date_window', message: 'Janela de reprodução (startedAt / endedAt) inválida.' });
      return;
    }

    const calculatedDuration = endedAtTimestamp - startedAtTimestamp;
    if (Math.abs(calculatedDuration - item.durationMs) > 2000) {
      res.status(400).json({ error: 'duration_mismatch', message: 'durationMs inconsistente com intervalo startedAt/endedAt.' });
      return;
    }

    const now = Date.now();
    const maxSkewMs = 10 * 60 * 1000; // 10 minutes
    if (Math.abs(now - endedAtTimestamp) > maxSkewMs) {
      res.status(400).json({
        error: 'timestamp_out_of_window',
        message: 'Timestamp do evento fora da janela de tolerância permitida.',
      });
      return;
    }

    // 6. Check and record anti-replay (ATOMICALLY AFTER VALID SIGNATURE)
    // 7. Record verified log
    const durationSec = Math.round(item.durationMs / 1000);
    const log: ProofOfPlayLog = {
      id: item.eventId,
      timestamp: item.startedAt || new Date().toISOString(),
      campaignId: item.campaignId,
      campaignName: campaign.name,
      advertiser: campaign.advertiser,
      deviceId: item.deviceId,
      startedAt: item.startedAt,
      endedAt: item.endedAt,
      durationWatchedSec: durationSec,
      location: item.location,
      interacted: item.interacted,
      interactionType: item.interactionType,
      verifiedHash: item.signature,
      signature: item.signature,
      nonce: item.nonce,
      syncedOnline: true,
      organizationId: tenantId,
    };

    const recorded = await repository.recordProofOfPlayAndReplay(log, tenantId);
    if (!recorded) {
      res.status(400).json({ error: 'replay_detected', message: 'Event ID or nonce already processed.' });
      return;
    }
    res.json({ success: true, recorded, eventId: item.eventId });
  }
);

// ============================================================================
// 9. TELEMETRY & HARDWARE HEARTBEAT (Authenticated)
// ============================================================================
apiRouter.post('/telemetry/heartbeat', rateLimit({ windowMs: 60_000, limit: 1_800 }), requireDeviceAuth, deviceRequestRateLimiter, validateBody(TelemetryHeartbeatSchema), async (req: Request, res: Response) => {
  const device = req.device!;
  const tenantId = req.resolvedTenantId!;
  const body = req.body;

  const existing = await repository.getDeviceById(device.id, tenantId);
  if (existing) {
    existing.currentLocation = {
      ...existing.currentLocation,
      lat: body.lat,
      lng: body.lng,
      speedKmH: body.speedKmH,
      heading: body.heading,
    };
    existing.telemetry = {
      ...existing.telemetry,
      batteryLevel: body.batteryLevel,
      powerConnected: body.powerConnected,
      signalStrength: body.signalStrength,
      cpuTemp: body.cpuTemp || existing.telemetry.cpuTemp,
      appVersion: body.appVersion,
      lastHeartbeat: new Date().toISOString(),
    };
    await repository.saveDevice(existing, tenantId);
  }

  // Get pending commands for this tablet
  const pendingCommands = await repository.getPendingCommands(device.id, tenantId);

  res.json({
    status: 'ok',
    deviceId: device.id,
    pendingCommands,
  });
});

// ============================================================================
// 10. REMOTE COMMANDS (MDM)
// ============================================================================
apiRouter.post('/remote-commands', requireAuth, requireRole(['platform_admin', 'operator', 'super_admin']), adminRequestRateLimiter, validateBody(RemoteCommandSchema), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const device = await repository.getDeviceById(req.body.deviceId, tenantId);
  if (!device) {
    return res.status(404).json({ error: 'not_found', message: 'Dispositivo não encontrado no seu tenant.' });
  }

  const cmdId = `cmd_${Date.now().toString(36)}`;
  await repository.createRemoteCommand({
    id: cmdId,
    organizationId: tenantId,
    deviceId: device.id,
    command: req.body.command,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  await repository.logAudit({
    organizationId: tenantId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'REMOTE_COMMAND_DISPATCHED',
    resource: 'remote_commands',
    resourceId: cmdId,
    details: { command: req.body.command, deviceId: device.id },
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, commandId: cmdId });
});

apiRouter.post('/remote-commands/:id/acknowledge', rateLimit({ windowMs: 60_000, limit: 1_800 }), requireUserOrDeviceAuth, commandAckRateLimiter, async (req: Request, res: Response) => {
  const tenantId = req.resolvedTenantId || await resolveTenant(req);
  const acknowledged = await repository.acknowledgeCommand(req.params.id, tenantId);
  if (!acknowledged) {
    return res.status(404).json({ error: 'not_found', message: 'Comando não encontrado.' });
  }
  res.json({ success: true });
});

// ============================================================================
// 11. ADVERTISERS & INVOICES (Strict Multi-Tenant Isolation)
// ============================================================================
apiRouter.get('/advertiser-portal', requireAuth, requireRole(['advertiser']), async (req: Request, res: Response) => {
  const advertiser = await repository.getAdvertiserById(req.user!.advertiserId!, req.user!.organizationId);
  if (!advertiser || advertiser.status !== 'active') {
    return res.status(404).json({ error: 'advertiser_not_found', message: 'Conta de anunciante não encontrada ou inativa.' });
  }
  const [allCampaigns, allProofOfPlay, invoices] = await Promise.all([
    repository.getCampaigns(req.user!.organizationId),
    repository.getProofOfPlayLogs(req.user!.organizationId, 500),
    repository.getInvoices(req.user!.organizationId),
  ]);
  const advertiserNames = new Set([advertiser.companyName, advertiser.tradeName]
    .map(name => (name ?? '').trim().toLocaleLowerCase('pt-BR')).filter(Boolean));
  const campaigns = allCampaigns.filter(campaign =>
    advertiserNames.has(campaign.advertiser.trim().toLocaleLowerCase('pt-BR')),
  );
  const campaignIds = new Set(campaigns.map(campaign => campaign.id));
  res.json({
    advertiser,
    campaigns,
    proofOfPlay: allProofOfPlay.filter(log => campaignIds.has(log.campaignId)),
    invoices: invoices.filter(invoice => invoice.advertiserId === advertiser.id),
  });
});

apiRouter.post('/advertiser-portal/invoices', requireAuth, adminRequestRateLimiter, requireRole(['advertiser']), validateBody(AdvertiserInvoiceRequestSchema), async (req: Request, res: Response) => {
  const tenantId = req.user!.organizationId;
  const advertiser = await repository.getAdvertiserById(req.user!.advertiserId!, tenantId);
  if (!advertiser || advertiser.status !== 'active') {
    return res.status(404).json({ error: 'advertiser_not_found', message: 'Conta de anunciante não encontrada ou inativa.' });
  }
  const invoice = buildAdvertiserRechargeInvoice(advertiser, tenantId, req.body.amount);
  const saved = await repository.saveInvoice(invoice, tenantId);
  if (!saved) return res.status(409).json({ error: 'invoice_conflict', message: 'Não foi possível registrar a fatura.' });
  await repository.logAudit({
    organizationId: tenantId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'ADVERTISER_PORTAL_CREATE_INVOICE',
    resource: 'invoices',
    resourceId: saved.id,
    details: { advertiserId: advertiser.id, amount: saved.amount },
    ipAddress: req.ip,
  });
  res.status(201).json(saved);
});

apiRouter.post('/advertiser-portal/invoices/:id/charge-pix', requireAuth, adminRequestRateLimiter, requireRole(['advertiser']), async (req: Request, res: Response) => {
  const tenantId = req.user!.organizationId;
  const invoice = await repository.getInvoiceById(req.params.id, tenantId);
  if (!invoice || invoice.advertiserId !== req.user!.advertiserId) {
    return res.status(404).json({ error: 'not_found', message: 'Cobrança não encontrada.' });
  }
  if (invoice.purpose !== 'advertiser_recharge') {
    return res.status(400).json({ error: 'invalid_invoice_purpose', message: 'Esta fatura não é uma recarga de anunciante.' });
  }
  if (invoice.status === 'paid') {
    return res.status(409).json({ error: 'invoice_already_paid', message: 'Esta cobrança já foi paga.' });
  }
  if (invoice.txid && invoice.pixQrCode && invoice.pixQrCodeExpiresAt && Date.parse(invoice.pixQrCodeExpiresAt) > Date.now()) {
    return res.json({
      success: true,
      txid: invoice.txid,
      copiaECola: invoice.pixQrCode,
      qrCodeUrl: invoice.pixQrCodeUrl || '',
      expiresAt: invoice.pixQrCodeExpiresAt,
    });
  }
  const advertiser = await repository.getAdvertiserById(req.user!.advertiserId!, tenantId);
  if (!advertiser || advertiser.status !== 'active') {
    return res.status(404).json({ error: 'advertiser_not_found', message: 'Conta de anunciante não encontrada ou inativa.' });
  }
  const result = await pixGateway.createPixCharge({
    invoiceId: invoice.id,
    organizationId: tenantId,
    amount: invoice.amount,
    organizationName: advertiser.companyName,
    customerReference: `advertiser:${tenantId}:${advertiser.id}`,
    description: `Recarga de mídia ${advertiser.companyName} #${invoice.invoiceNumber}`,
    dueDate: invoice.dueDate,
    cnpj: advertiser.cnpj,
    email: advertiser.email,
    phone: advertiser.phone,
  });
  if (result.status === 'payment_provider_not_configured') {
    return res.status(503).json({ error: 'payment_provider_not_configured', message: result.error || 'Provedor de pagamentos PIX não está configurado.' });
  }
  if (result.status === 'failed') {
    return res.status(502).json({ error: 'payment_creation_failed', message: result.error });
  }
  invoice.txid = result.txid;
  invoice.pixQrCode = result.copiaECola;
  invoice.pixQrCodeUrl = result.qrCodeUrl;
  invoice.pixQrCodeExpiresAt = result.expiresAt;
  const saved = await repository.saveInvoice(invoice, tenantId);
  if (!saved) return res.status(500).json({ error: 'payment_record_failed', message: 'Não foi possível salvar os dados da cobrança.' });
  res.json({ success: true, txid: result.txid, copiaECola: result.copiaECola, qrCodeUrl: result.qrCodeUrl, expiresAt: result.expiresAt });
});

apiRouter.get('/advertisers', requireAuth, requireRole(['platform_admin', 'super_admin', 'organization_admin', 'fleet_manager']), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  res.json((await repository.getAdvertisers(tenantId)).map(advertiser => ({ ...advertiser, organizationId: tenantId })));
});

apiRouter.post('/advertisers', requireAuth, requireRole(['platform_admin', 'super_admin', 'organization_admin', 'fleet_manager']), validateBody(AdvertiserSchema), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const saved = await repository.saveAdvertiser(req.body as AdvertiserAccount, tenantId);
  if (!saved) {
    return res.status(409).json({ error: 'conflict', message: 'Anunciante já existe em outro tenant.' });
  }
  await repository.logAudit({
    organizationId: tenantId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'CREATE_ADVERTISER',
    resource: 'advertisers',
    resourceId: saved.id,
    ipAddress: req.ip,
  });
  res.status(201).json(saved);
});

apiRouter.put('/advertisers/:id', requireAuth, requireRole(['platform_admin', 'super_admin', 'organization_admin', 'fleet_manager']), validateBody(AdvertiserSchema), async (req: Request, res: Response) => {
  if (req.params.id !== req.body.id) {
    return res.status(400).json({ error: 'id_mismatch', message: 'O ID da URL deve corresponder ao ID do anunciante.' });
  }
  const tenantId = await resolveTenant(req);
  if (!await repository.getAdvertiserById(req.params.id, tenantId)) {
    return res.status(404).json({ error: 'not_found', message: 'Anunciante não encontrado neste tenant.' });
  }
  const saved = await repository.saveAdvertiser(req.body as AdvertiserAccount, tenantId);
  if (!saved) return res.status(409).json({ error: 'conflict', message: 'Não foi possível atualizar o anunciante.' });
  await repository.logAudit({
    organizationId: tenantId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'UPDATE_ADVERTISER',
    resource: 'advertisers',
    resourceId: saved.id,
    ipAddress: req.ip,
  });
  res.json(saved);
});

apiRouter.delete('/advertisers/:id', requireAuth, requireRole(['platform_admin', 'super_admin', 'organization_admin']), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const deleted = await repository.deleteAdvertiser(req.params.id, tenantId);
  if (!deleted) {
    return res.status(404).json({ error: 'not_found', message: 'Anunciante não encontrado neste tenant.' });
  }
  await repository.logAudit({
    organizationId: tenantId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'DELETE_ADVERTISER',
    resource: 'advertisers',
    resourceId: req.params.id,
    ipAddress: req.ip,
  });
  res.json({ success: true });
});

apiRouter.post('/advertisers/:id/invoices', requireAuth, adminRequestRateLimiter, requireRole(['platform_admin', 'super_admin', 'organization_admin']), validateBody(AdvertiserInvoiceRequestSchema), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const advertiser = await repository.getAdvertiserById(req.params.id, tenantId);
  if (!advertiser) return res.status(404).json({ error: 'not_found', message: 'Anunciante não encontrado nesta organização.' });
  if (advertiser.status !== 'active') {
    return res.status(409).json({ error: 'advertiser_inactive', message: 'Somente anunciantes ativos podem receber cobranças.' });
  }

  const invoice = buildAdvertiserRechargeInvoice(advertiser, tenantId, req.body.amount);
  const saved = await repository.saveInvoice(invoice, tenantId);
  if (!saved) return res.status(409).json({ error: 'invoice_conflict', message: 'Não foi possível registrar a fatura do anunciante.' });
  await repository.logAudit({
    organizationId: tenantId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'CREATE_ADVERTISER_INVOICE',
    resource: 'invoices',
    resourceId: saved.id,
    details: { advertiserId: advertiser.id, amount: saved.amount },
    ipAddress: req.ip,
  });
  res.status(201).json(saved);
});

apiRouter.get('/invoices', requireAuth, requireRole(['platform_admin', 'super_admin', 'organization_admin', 'financial_auditor']), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  res.json(await repository.getInvoices(tenantId));
});

apiRouter.post('/invoices', requireAuth, requireRole(['platform_admin', 'super_admin', 'organization_admin']), validateBody(InvoiceSchema), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const invoice = req.body as SaaSInvoice;
  if (invoice.advertiserId || invoice.purpose === 'advertiser_recharge') {
    return res.status(400).json({ error: 'use_advertiser_invoice_route', message: 'Crie cobranças de anunciantes pela rota específica do anunciante.' });
  }
  if (!invoice.planTier) {
    return res.status(400).json({ error: 'plan_required', message: 'Selecione um plano para criar a fatura.' });
  }
  if (invoice.status !== 'pending') {
    return res.status(400).json({ error: 'invalid_invoice_status', message: 'Uma fatura nova deve iniciar como pendente.' });
  }
  if (await repository.getInvoiceById(invoice.id, tenantId)) {
    return res.status(409).json({ error: 'invoice_exists', message: 'Já existe uma fatura com este identificador.' });
  }
  invoice.purpose = 'saas_plan';
  const organization = await repository.getOrganizationById(tenantId);
  const plan = await repository.getPlanById(invoice.planTier);
  if (!organization || !plan) {
    return res.status(400).json({ error: 'invalid_plan', message: 'O plano selecionado não está disponível.' });
  }
  if (organization.planTier === plan.id) {
    return res.status(409).json({ error: 'plan_already_active', message: 'Este plano já está ativo na organização.' });
  }
  if (plan.maxScreens < organization.activeScreensCount) {
    return res.status(400).json({ error: 'plan_screen_limit', message: 'O plano selecionado não comporta a quantidade atual de telas.' });
  }
  const existingPlanInvoice = (await repository.getInvoices(tenantId)).find(existing =>
    existing.purpose === 'saas_plan' && !existing.advertiserId && existing.planTier === plan.id && existing.status !== 'paid',
  );
  if (existingPlanInvoice) return res.json(existingPlanInvoice);

  invoice.amount = Number((plan.baseMonthlyFee + organization.activeScreensCount * plan.pricePerScreenMonth).toFixed(2));
  invoice.screensBilled = organization.activeScreensCount;
  invoice.organizationName = organization.name;
  invoice.txid = undefined;
  invoice.pixQrCode = undefined;
  invoice.pixQrCodeUrl = undefined;
  invoice.pixQrCodeExpiresAt = undefined;
  invoice.paidAt = undefined;
  const saved = await repository.saveInvoice(invoice, tenantId);
  if (!saved) {
    return res.status(409).json({ error: 'conflict', message: 'Fatura já existe em outro tenant.' });
  }
  await repository.logAudit({
    organizationId: tenantId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'CREATE_INVOICE',
    resource: 'invoices',
    resourceId: saved.id,
    details: { amount: saved.amount, planTier: saved.planTier },
    ipAddress: req.ip,
  });
  res.status(201).json(saved);
});

/**
 * PIX charge generation with provider check.
 * Section 11: If gateway is unconfigured, explicitly returns payment_provider_not_configured.
 */
apiRouter.post('/invoices/:id/charge-pix', requireAuth, requireRole(['platform_admin', 'super_admin', 'organization_admin']), async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  const invoice = await repository.getInvoiceById(req.params.id, tenantId);
  if (!invoice) {
    return res.status(404).json({ error: 'not_found', message: 'Fatura não encontrada.' });
  }
  if (Boolean(invoice.advertiserId) !== (invoice.purpose === 'advertiser_recharge')) {
    return res.status(400).json({ error: 'invalid_invoice_purpose', message: 'A fatura não corresponde ao tipo de cobrança.' });
  }
  if (invoice.status === 'paid') {
    return res.status(409).json({ error: 'invoice_already_paid', message: 'Esta fatura já foi paga.' });
  }
  if (invoice.txid && invoice.pixQrCode && invoice.pixQrCodeExpiresAt && Date.parse(invoice.pixQrCodeExpiresAt) > Date.now()) {
    return res.json({
      success: true,
      txid: invoice.txid,
      copiaECola: invoice.pixQrCode,
      qrCodeUrl: invoice.pixQrCodeUrl || '',
      expiresAt: invoice.pixQrCodeExpiresAt,
    });
  }
  const advertiser = invoice.advertiserId
    ? await repository.getAdvertiserById(invoice.advertiserId, tenantId)
    : undefined;
  const organization = invoice.advertiserId
    ? undefined
    : await repository.getOrganizationById(tenantId);
  if (invoice.advertiserId && !advertiser) {
    return res.status(404).json({ error: 'advertiser_not_found', message: 'Anunciante da fatura não encontrado.' });
  }
  if (advertiser && advertiser.status !== 'active') {
    return res.status(409).json({ error: 'advertiser_inactive', message: 'O anunciante está inativo e não pode receber cobranças.' });
  }
  if (!advertiser && !organization) {
    return res.status(404).json({ error: 'organization_not_found', message: 'Organização da fatura não encontrada.' });
  }

  const result = await pixGateway.createPixCharge({
    invoiceId: invoice.id,
    organizationId: tenantId,
    amount: invoice.amount,
    organizationName: advertiser?.companyName || organization!.name,
    customerReference: advertiser ? `advertiser:${tenantId}:${advertiser.id}` : undefined,
    description: advertiser
      ? `Recarga de mídia ${advertiser.companyName} #${invoice.invoiceNumber}`
      : `Fatura VeloMedia DOOH #${invoice.invoiceNumber}`,
    dueDate: invoice.dueDate,
    cnpj: advertiser?.cnpj || organization!.cnpj,
    email: advertiser?.email || organization!.billingEmail,
    phone: advertiser?.phone || organization!.adminUser.phone,
  });

  if (result.status === 'payment_provider_not_configured') {
    return res.status(503).json({
      error: 'payment_provider_not_configured',
      message: result.error || 'Provedor de pagamentos PIX não está configurado neste ambiente.',
    });
  }
  if (result.status === 'failed') {
    return res.status(502).json({ error: 'payment_creation_failed', message: result.error });
  }

  invoice.txid = result.txid;
  invoice.pixQrCode = result.copiaECola;
  invoice.pixQrCodeUrl = result.qrCodeUrl;
  invoice.pixQrCodeExpiresAt = result.expiresAt;
  const saved = await repository.saveInvoice(invoice, tenantId);
  if (!saved) {
    return res.status(500).json({ error: 'payment_record_failed', message: 'A cobrança foi criada, mas não foi possível salvar os dados da fatura.' });
  }

  res.json({
    success: true,
    txid: result.txid,
    copiaECola: result.copiaECola,
    qrCodeUrl: result.qrCodeUrl,
    expiresAt: result.expiresAt,
  });
});

/**
 * Asaas webhook authenticated with the dedicated notification token.
 */
apiRouter.post('/webhooks/asaas', asaasWebhookRateLimiter, async (req: Request, res: Response) => {
  if (!pixGateway.verifyAsaasWebhookToken(req.get('asaas-access-token'))) {
    return res.status(401).json({ error: 'invalid_webhook_token' });
  }
  const event = req.body;
  if (!event || typeof event.id !== 'string' || event.id.length > 128 || typeof event.event !== 'string') {
    return res.status(400).json({ error: 'invalid_webhook_payload' });
  }

  try {
    const payment = event.payment;
    const paidEvents = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED']);
    const overdueEvents = new Set(['PAYMENT_OVERDUE']);
    if (
      payment &&
      typeof payment.id === 'string' &&
      typeof payment.externalReference === 'string' &&
      payment.externalReference.startsWith('invoice:') &&
      (paidEvents.has(event.event) || overdueEvents.has(event.event))
    ) {
      const invoiceId = payment.externalReference.slice('invoice:'.length);
      const organizations = await repository.getOrganizations();
      const matchingInvoices: Array<{ invoice: SaaSInvoice; organizationId: string }> = [];
      for (const organization of organizations) {
        const invoice = await repository.getInvoiceById(invoiceId, organization.id);
        if (invoice && invoice.txid === payment.id) {
          matchingInvoices.push({ invoice, organizationId: organization.id });
        }
      }
      if (matchingInvoices.length > 1) {
        return res.status(409).json({ error: 'ambiguous_invoice_reference' });
      }
      const match = matchingInvoices[0];
      if (match) {
        if (!Number.isFinite(Number(payment.value)) || Number(Number(payment.value).toFixed(2)) !== Number(match.invoice.amount.toFixed(2))) {
          await repository.logAudit({
            organizationId: match.organizationId,
            action: 'PAYMENT_AMOUNT_MISMATCH',
            resource: 'invoices',
            resourceId: match.invoice.id,
            details: { provider: 'asaas', txid: payment.id, expectedAmount: match.invoice.amount, receivedAmount: payment.value },
          });
          return res.status(409).json({ error: 'payment_amount_mismatch' });
        }
        if (paidEvents.has(event.event) && match.invoice.status !== 'paid') {
          const paidAt = payment.paymentDate || payment.clientPaymentDate || new Date().toISOString();
          if (match.invoice.advertiserId) {
            if (!await repository.confirmAdvertiserInvoicePayment(match.invoice.id, match.organizationId, paidAt)) {
              return res.status(409).json({ error: 'advertiser_invoice_confirmation_failed' });
            }
            match.invoice.status = 'paid';
            match.invoice.paidAt = paidAt;
          } else if (match.invoice.planTier) {
            if (!await repository.confirmPlanInvoicePayment(match.invoice.id, match.organizationId, paidAt)) {
              return res.status(409).json({ error: 'plan_invoice_confirmation_failed' });
            }
            match.invoice.status = 'paid';
            match.invoice.paidAt = paidAt;
          } else {
            match.invoice.status = 'paid';
            match.invoice.paidAt = paidAt;
            if (!await repository.saveInvoice(match.invoice, match.organizationId)) {
              return res.status(500).json({ error: 'invoice_update_failed' });
            }
          }
          await repository.logAudit({
            organizationId: match.organizationId,
            action: 'INVOICE_PAYMENT_CONFIRMED',
            resource: 'invoices',
            resourceId: match.invoice.id,
            details: {
              provider: 'asaas',
              amount: match.invoice.amount,
              planTier: match.invoice.planTier,
              advertiserId: match.invoice.advertiserId,
            },
          });
        } else if (overdueEvents.has(event.event) && match.invoice.status === 'pending') {
          match.invoice.status = 'overdue';
          if (!await repository.saveInvoice(match.invoice, match.organizationId)) {
            return res.status(500).json({ error: 'invoice_update_failed' });
          }
        }
      }
    }

    const isNew = await repository.recordWebhook({
      eventId: event.id,
      provider: 'asaas',
      processedAt: new Date().toISOString(),
      payloadHash: createHash('sha256').update(JSON.stringify(event)).digest('hex'),
    });
    return res.json({ received: true, duplicate: !isNew });
  } catch {
    return res.status(500).json({ error: 'webhook_processing_failed' });
  }
});

// ============================================================================
// 12. AUDIT LOGS
// ============================================================================
apiRouter.get('/audit-logs', requireAuth, requireRole(['super_admin']), async (req: Request, res: Response) => {
  const limit = Math.max(1, Math.min(parseInt(req.query.limit as string, 10) || 100, 1000));
  res.json(await repository.getAllAuditLogs(limit));
});

// ============================================================================
// 13. DEV SIMULATOR (Strictly Disabled in Production)
// ============================================================================
apiRouter.post('/simulate/pop', requireAuth, (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' || process.env.SIMULATION_ENABLED !== 'true') {
    return res.status(403).json({
      error: 'simulation_disabled',
      message: 'Simuladores de telemetria e PoP estão desativados neste ambiente por políticas de segurança.',
    });
  }

  res.json({ success: true, message: 'Simulação aceita em ambiente de desenvolvimento.' });
});
