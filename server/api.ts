import { Router } from 'express';
import type { Request, Response } from 'express';
import { storage } from './storage';
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
  resetLoginRateLimit
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
  validateBody
} from './schemas';
import { pixGateway } from './billing';
import type { Device, Driver, Campaign, GeoFence, ProofOfPlayLog, AdvertiserAccount, SaaSInvoice } from '../src/types';

export const apiRouter = Router();

// ============================================================================
// 1. HEALTH & METRICS
// ============================================================================
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.4.0-prod',
    environment: process.env.NODE_ENV || 'production',
  });
});

// ============================================================================
// 2. AUTHENTICATION & SESSION
// ============================================================================
apiRouter.post('/auth/login', validateBody(LoginSchema), (req: Request, res: Response): void => {
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

  const user = storage.getUserByEmail(email);

  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    recordFailedLogin(ip);
    storage.logAudit({
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

  // Reset rate limit on success
  resetLoginRateLimit(ip);

  // Generate 7-day session token
  const token = generateSessionToken();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  storage.createSession({
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

  storage.logAudit({
    organizationId: user.organizationId,
    userId: user.id,
    userEmail: user.email,
    action: 'AUTH_LOGIN_SUCCESS',
    resource: 'auth',
    ipAddress: ip,
  });

  const { passwordHash: _, ...safeUser } = user;
  const org = storage.getOrganizationById(user.organizationId);

  // Section 2.2: Do NOT return the token in JSON body; keep it exclusively in HttpOnly cookie
  res.json({
    user: safeUser,
    organization: org,
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  if (req.sessionToken) {
    storage.deleteSession(req.sessionToken);
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
});

apiRouter.get('/auth/me', requireAuth, (req: Request, res: Response): void => {
  const user = storage.getUserById(req.user!.id);
  const org = storage.getOrganizationById(req.user!.organizationId);

  res.json({
    authenticated: true,
    user,
    organization: org,
  });
});

// ============================================================================
// 3. ORGANIZATIONS (Super Admin / Multi-Tenant Master)
// ============================================================================
apiRouter.get('/organizations', requireAuth, (req: Request, res: Response) => {
  if (req.user!.role === 'platform_admin' || req.user!.role === 'super_admin') {
    return res.json(storage.getOrganizations());
  }
  const userOrg = storage.getOrganizationById(req.user!.organizationId);
  res.json(userOrg ? [userOrg] : []);
});

apiRouter.post('/organizations', requireAuth, requireRole(['platform_admin', 'super_admin']), (req: Request, res: Response) => {
  storage.saveOrganization(req.body);
  storage.logAudit({
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

apiRouter.put('/organizations/:id', requireAuth, requireRole(['platform_admin', 'super_admin']), (req: Request, res: Response) => {
  storage.saveOrganization(req.body);
  res.json(req.body);
});

apiRouter.delete('/organizations/:id', requireAuth, requireRole(['platform_admin', 'super_admin']), (req: Request, res: Response) => {
  const deleted = storage.deleteOrganization(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'not_found', message: 'Organização não encontrada.' });
  }
  res.json({ success: true });
});

// ============================================================================
// 4. DRIVERS (Strict Multi-Tenant Isolation)
// ============================================================================
apiRouter.get('/drivers', requireAuth, (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  res.json(storage.getDrivers(tenantId));
});

apiRouter.post('/drivers', requireAuth, validateBody(DriverSchema), (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const saved = storage.saveDriver(req.body as Driver, tenantId);
  if (!saved) {
    return res.status(409).json({ error: 'conflict', message: 'Motorista já existe em outro tenant.' });
  }
  res.status(201).json(saved);
});

apiRouter.put('/drivers/:id', requireAuth, validateBody(DriverSchema), (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const existing = storage.getDriverById(req.params.id, tenantId);
  if (!existing) {
    return res.status(404).json({ error: 'not_found', message: 'Motorista não encontrado neste tenant.' });
  }

  const updated = storage.saveDriver(req.body as Driver, tenantId);
  res.json(updated);
});

apiRouter.delete('/drivers/:id', requireAuth, (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const deleted = storage.deleteDriver(req.params.id, tenantId);
  if (!deleted) {
    return res.status(404).json({ error: 'not_found', message: 'Motorista não encontrado neste tenant.' });
  }
  res.json({ success: true });
});

apiRouter.post('/drivers/:id/payout', requireAuth, requireRole(['platform_admin', 'super_admin', 'operator']), (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const driver = storage.getDriverById(req.params.id, tenantId);
  if (!driver) {
    return res.status(404).json({ error: 'not_found', message: 'Motorista não encontrado.' });
  }

  const payoutAmount = driver.pendingBalance;
  if (payoutAmount <= 0) {
    return res.status(400).json({ error: 'no_balance', message: 'Sem saldo pendente para repasse.' });
  }

  driver.pendingBalance = 0;
  storage.saveDriver(driver, tenantId);

  storage.logAudit({
    organizationId: tenantId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'DRIVER_PIX_PAYOUT',
    resource: 'drivers',
    resourceId: driver.id,
    details: { amount: payoutAmount, pixKey: driver.pixKey },
    ipAddress: req.ip,
  });

  res.json({ success: true, paidAmount: payoutAmount });
});

// ============================================================================
// 5. DEVICES (Strict Multi-Tenant Isolation & Cryptographic Pairing)
// ============================================================================
apiRouter.get('/devices', requireAuth, (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  res.json(storage.getDevices(tenantId));
});

apiRouter.post('/devices', requireAuth, validateBody(DeviceSchema), (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const saved = storage.saveDevice(req.body as Device, tenantId);
  if (!saved) {
    return res.status(409).json({ error: 'conflict', message: 'Dispositivo já registrado em outro tenant.' });
  }
  res.status(201).json(saved);
});

apiRouter.put('/devices/:id', requireAuth, validateBody(DeviceSchema), (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const existing = storage.getDeviceById(req.params.id, tenantId);
  if (!existing) {
    return res.status(404).json({ error: 'not_found', message: 'Dispositivo não encontrado neste tenant.' });
  }

  const updated = storage.saveDevice(req.body as Device, tenantId);
  res.json(updated);
});

apiRouter.delete('/devices/:id', requireAuth, (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const deleted = storage.deleteDevice(req.params.id, tenantId);
  if (!deleted) {
    return res.status(404).json({ error: 'not_found', message: 'Dispositivo não encontrado neste tenant.' });
  }
  res.json({ success: true });
});

/**
 * Generate 6-digit pairing code for in-car tablet
 */
apiRouter.post('/devices/pairing-token', requireAuth, requireRole(['platform_admin', 'operator', 'super_admin']), (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const code = generatePairingCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  storage.createPairingToken({
    token: code,
    organizationId: tenantId,
    driverId: req.body.driverId || '',
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
apiRouter.post('/devices/pair', validateBody(DevicePairingRequestSchema), (req: Request, res: Response): void => {
  const { pairingCode, model, serialNumber, screenPosition, hardwareOwnership } = req.body;

  const tokenRecord = storage.getPairingToken(pairingCode);
  if (!tokenRecord) {
    res.status(400).json({ error: 'invalid_code', message: 'Código de pareamento inválido ou expirado.' });
    return;
  }

  storage.markPairingTokenUsed(pairingCode);

  const orgId = tokenRecord.organizationId;
  const driver = tokenRecord.driverId ? storage.getDriverById(tokenRecord.driverId, orgId) : undefined;
  const deviceId = `dev_${Date.now().toString(36)}`;
  const deviceCode = `TV-${orgId.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
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
      appVersion: '2.4.0-prod',
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

  storage.saveDevice(newDevice, orgId);

  // Store cryptographic credentials for this tablet
  storage.saveDeviceCredential({
    deviceId,
    organizationId: orgId,
    deviceSecret,
    revoked: false,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  });

  storage.logAudit({
    organizationId: orgId,
    action: 'DEVICE_PAIRED',
    resource: 'devices',
    resourceId: deviceId,
    details: { model, serialNumber, driverId: driver?.id },
    ipAddress: req.ip,
  });

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
apiRouter.get('/campaigns', requireAuth, (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  res.json(storage.getCampaigns(tenantId));
});

apiRouter.post('/campaigns', requireAuth, validateBody(CampaignSchema), (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const saved = storage.saveCampaign(req.body as Campaign, tenantId);
  if (!saved) {
    return res.status(409).json({ error: 'conflict', message: 'Campanha já existe em outro tenant.' });
  }
  res.status(201).json(saved);
});

apiRouter.put('/campaigns/:id', requireAuth, validateBody(CampaignSchema), (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const existing = storage.getCampaignById(req.params.id, tenantId);
  if (!existing) {
    return res.status(404).json({ error: 'not_found', message: 'Campanha não encontrada neste tenant.' });
  }

  const updated = storage.saveCampaign(req.body as Campaign, tenantId);
  res.json(updated);
});

apiRouter.delete('/campaigns/:id', requireAuth, (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const deleted = storage.deleteCampaign(req.params.id, tenantId);
  if (!deleted) {
    return res.status(404).json({ error: 'not_found', message: 'Campanha não encontrada neste tenant.' });
  }
  res.json({ success: true });
});

// ============================================================================
// 7. GEOFENCES (Strict Multi-Tenant Isolation)
// ============================================================================
apiRouter.get('/geofences', requireAuth, (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  res.json(storage.getGeoFences(tenantId));
});

apiRouter.post('/geofences', requireAuth, validateBody(GeoFenceSchema), (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const saved = storage.saveGeoFence(req.body as GeoFence, tenantId);
  if (!saved) {
    return res.status(409).json({ error: 'conflict', message: 'GeoFence já existe em outro tenant.' });
  }
  res.status(201).json(saved);
});

apiRouter.put('/geofences/:id', requireAuth, validateBody(GeoFenceSchema), (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const existing = storage.getGeoFenceById(req.params.id, tenantId);
  if (!existing) {
    return res.status(404).json({ error: 'not_found', message: 'GeoFence não encontrada neste tenant.' });
  }
  const updated = storage.saveGeoFence(req.body as GeoFence, tenantId);
  res.json(updated);
});

apiRouter.delete('/geofences/:id', requireAuth, (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const deleted = storage.deleteGeoFence(req.params.id, tenantId);
  if (!deleted) {
    return res.status(404).json({ error: 'not_found', message: 'GeoFence não encontrada neste tenant.' });
  }
  res.json({ success: true });
});

// ============================================================================
// 8. PROOF OF PLAY (Tamper-Proof, Anti-Replay & HMAC Cryptographic Validation)
// ============================================================================
apiRouter.get('/proof-of-play', requireAuth, (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 500);
  res.json(storage.getProofOfPlayLogs(tenantId, limit));
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
  validateBody(ProofOfPlaySubmissionSchema),
  (req: Request, res: Response): void => {
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
    const campaign = storage.getCampaignById(item.campaignId, tenantId);
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
        deviceId: item.deviceId,
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
    const replayResult = storage.checkAndRecordReplay(item.eventId, item.nonce, endedAtTimestamp);
    if (!replayResult.valid) {
      res.status(400).json({
        error: 'replay_detected',
        message: replayResult.reason || 'Replay de Proof of Play detectado.',
      });
      return;
    }

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

    const recorded = storage.recordProofOfPlay(log, tenantId);
    res.json({ success: true, recorded, eventId: item.eventId });
  }
);

// ============================================================================
// 9. TELEMETRY & HARDWARE HEARTBEAT (Authenticated)
// ============================================================================
apiRouter.post('/telemetry/heartbeat', requireDeviceAuth, validateBody(TelemetryHeartbeatSchema), (req: Request, res: Response) => {
  const device = req.device!;
  const tenantId = req.resolvedTenantId!;
  const body = req.body;

  const existing = storage.getDeviceById(device.id, tenantId);
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
    storage.saveDevice(existing, tenantId);
  }

  // Get pending commands for this tablet
  const pendingCommands = storage.getPendingCommands(device.id, tenantId);

  res.json({
    status: 'ok',
    deviceId: device.id,
    pendingCommands,
  });
});

// ============================================================================
// 10. REMOTE COMMANDS (MDM)
// ============================================================================
apiRouter.post('/remote-commands', requireAuth, requireRole(['platform_admin', 'operator', 'super_admin']), validateBody(RemoteCommandSchema), (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const device = storage.getDeviceById(req.body.deviceId, tenantId);
  if (!device) {
    return res.status(404).json({ error: 'not_found', message: 'Dispositivo não encontrado no seu tenant.' });
  }

  const cmdId = `cmd_${Date.now().toString(36)}`;
  storage.createRemoteCommand({
    id: cmdId,
    organizationId: tenantId,
    deviceId: device.id,
    command: req.body.command,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  storage.logAudit({
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

apiRouter.post('/remote-commands/:id/acknowledge', requireUserOrDeviceAuth, (req: Request, res: Response) => {
  const tenantId = req.resolvedTenantId || resolveTenant(req);
  const acknowledged = storage.acknowledgeCommand(req.params.id, tenantId);
  if (!acknowledged) {
    return res.status(404).json({ error: 'not_found', message: 'Comando não encontrado.' });
  }
  res.json({ success: true });
});

// ============================================================================
// 11. ADVERTISERS & INVOICES (Strict Multi-Tenant Isolation)
// ============================================================================
apiRouter.get('/advertisers', requireAuth, (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  res.json(storage.getAdvertisers(tenantId));
});

apiRouter.post('/advertisers', requireAuth, (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const saved = storage.saveAdvertiser(req.body as AdvertiserAccount, tenantId);
  if (!saved) {
    return res.status(409).json({ error: 'conflict', message: 'Anunciante já existe em outro tenant.' });
  }
  res.status(201).json(saved);
});

apiRouter.delete('/advertisers/:id', requireAuth, (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const deleted = storage.deleteAdvertiser(req.params.id, tenantId);
  if (!deleted) {
    return res.status(404).json({ error: 'not_found', message: 'Anunciante não encontrado neste tenant.' });
  }
  res.json({ success: true });
});

apiRouter.get('/invoices', requireAuth, (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  res.json(storage.getInvoices(tenantId));
});

apiRouter.post('/invoices', requireAuth, (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const saved = storage.saveInvoice(req.body as SaaSInvoice, tenantId);
  if (!saved) {
    return res.status(409).json({ error: 'conflict', message: 'Fatura já existe em outro tenant.' });
  }
  res.status(201).json(saved);
});

/**
 * PIX charge generation with provider check.
 * Section 11: If gateway is unconfigured, explicitly returns payment_provider_not_configured.
 */
apiRouter.post('/invoices/:id/charge-pix', requireAuth, async (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const invoice = storage.getInvoiceById(req.params.id, tenantId);
  if (!invoice) {
    return res.status(404).json({ error: 'not_found', message: 'Fatura não encontrada.' });
  }

  const result = await pixGateway.createPixCharge({
    invoiceId: invoice.id,
    amount: invoice.amount,
    organizationName: invoice.organizationName,
    description: `Fatura VeloMedia DOOH #${invoice.invoiceNumber}`,
  });

  if (result.status === 'payment_provider_not_configured') {
    return res.status(503).json({
      error: 'payment_provider_not_configured',
      message: result.error || 'Provedor de pagamentos PIX não está configurado neste ambiente.',
    });
  }

  invoice.txid = result.txid;
  invoice.pixQrCode = result.copiaECola;
  storage.saveInvoice(invoice, tenantId);

  res.json({
    success: true,
    txid: result.txid,
    copiaECola: result.copiaECola,
    qrCodeSvg: result.qrCodeSvg,
    expiresAt: result.expiresAt,
  });
});

/**
 * Webhook callback with signature verification & deduplication
 */
apiRouter.post('/webhooks/pix', (req: Request, res: Response) => {
  const signature = req.headers['x-webhook-signature'] as string || '';
  const rawBody = JSON.stringify(req.body);

  const result = pixGateway.processWebhookEvent(rawBody, signature);
  if (!result.success) {
    return res.status(401).json({ error: 'invalid_signature', message: result.reason });
  }

  if (result.duplicate) {
    return res.json({ status: 'ignored_duplicate' });
  }

  // Update invoice if matched
  const event = result.event;
  if (event?.invoiceId && event?.status === 'paid') {
    const orgs = storage.getOrganizations();
    for (const org of orgs) {
      const inv = storage.getInvoiceById(event.invoiceId, org.id);
      if (inv) {
        inv.status = 'paid';
        inv.paidAt = new Date().toISOString();
        storage.saveInvoice(inv, org.id);
        break;
      }
    }
  }

  res.json({ status: 'processed' });
});

// ============================================================================
// 12. AUDIT LOGS
// ============================================================================
apiRouter.get('/audit-logs', requireAuth, requireRole(['platform_admin', 'super_admin']), (req: Request, res: Response) => {
  const tenantId = resolveTenant(req);
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 100, 1000);
  res.json(storage.getAuditLogs(tenantId, limit));
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
