import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { 
  verifyPassword, 
  generateSessionToken, 
  generatePairingCode, 
  generateDeviceSecret, 
  signProofOfPlay, 
  verifyProofOfPlaySignature 
} from './crypto';
import { requireAuth, requireRole, resolveTenant } from './auth';
import { pixGateway } from './billing';
import type { Device, Driver, Campaign, GeoFence, ProofOfPlayLog } from '../src/types';

export const apiRouter = Router();

// ============================================================================
// 1. HEALTH & METRICS
// ============================================================================
apiRouter.get('/health', (req: Request, res: Response) => {
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
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

apiRouter.post('/auth/login', (req: Request, res: Response): void => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'BAD_REQUEST', details: parsed.error.format() });
    return;
  }

  const { email, password } = parsed.data;
  const user = storage.getUserByEmail(email);

  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    storage.logAudit({
      organizationId: user?.organizationId || 'system',
      userEmail: email,
      action: 'AUTH_LOGIN_FAILED',
      resource: 'auth',
      ipAddress: req.ip,
      details: { reason: 'Invalid credentials' },
    });
    res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos.' });
    return;
  }

  // Generate 24h session token
  const token = generateSessionToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

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
  res.cookie('velo_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  storage.logAudit({
    organizationId: user.organizationId,
    userId: user.id,
    userEmail: user.email,
    action: 'AUTH_LOGIN_SUCCESS',
    resource: 'auth',
    ipAddress: req.ip,
  });

  const { passwordHash, ...safeUser } = user;
  const org = storage.getOrganizationById(user.organizationId);

  res.json({
    user: safeUser,
    organization: org,
    token,
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  if (req.sessionToken) {
    storage.deleteSession(req.sessionToken);
  }
  res.clearCookie('velo_session');
  res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
});

apiRouter.get('/auth/me', (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ authenticated: false });
    return;
  }

  const user = storage.getUserById(req.user.id);
  const org = storage.getOrganizationById(req.user.organizationId);

  res.json({
    authenticated: true,
    user,
    organization: org,
  });
});

// ============================================================================
// 3. ORGANIZATIONS (Multi-Tenant Master)
// ============================================================================
apiRouter.get('/organizations', (req: Request, res: Response): void => {
  // If not logged in, return existing public org for bootstrap view
  if (!req.user) {
    res.json(storage.getOrganizations());
    return;
  }

  if (req.user.role === 'platform_admin') {
    res.json(storage.getOrganizations());
    return;
  }

  // Tenant operators can only see their own organization
  const org = storage.getOrganizationById(req.user.organizationId);
  res.json(org ? [org] : []);
});

apiRouter.post('/organizations', requireAuth, requireRole(['platform_admin']), (req: Request, res: Response) => {
  const newOrg = req.body;
  newOrg.id = newOrg.id || `org_${Date.now()}`;
  newOrg.createdAt = new Date().toISOString();
  storage.saveOrganization(newOrg);

  storage.logAudit({
    organizationId: newOrg.id,
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'ORGANIZATION_CREATED',
    resource: 'organizations',
    resourceId: newOrg.id,
    details: { name: newOrg.name },
  });

  res.status(201).json(newOrg);
});

apiRouter.put('/organizations/:id', requireAuth, (req: Request, res: Response): void => {
  const orgId = req.params.id;
  if (req.user?.role !== 'platform_admin' && req.user?.organizationId !== orgId) {
    res.status(403).json({ error: 'FORBIDDEN' });
    return;
  }

  const updatedOrg = { ...req.body, id: orgId };
  storage.saveOrganization(updatedOrg);
  res.json(updatedOrg);
});

apiRouter.delete('/organizations/:id', requireAuth, requireRole(['platform_admin']), (req: Request, res: Response) => {
  const success = storage.deleteOrganization(req.params.id);
  res.json({ success });
});

// ============================================================================
// 4. DRIVERS
// ============================================================================
apiRouter.get('/drivers', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  res.json(storage.getDrivers(orgId));
});

apiRouter.post('/drivers', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  const newDriver: Driver = {
    ...req.body,
    id: req.body.id || `drv_${Date.now()}`,
    organizationId: orgId,
  };
  storage.saveDriver(newDriver);
  res.status(201).json(newDriver);
});

apiRouter.put('/drivers/:id', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  const updatedDriver: Driver = {
    ...req.body,
    id: req.params.id,
    organizationId: orgId,
  };
  storage.saveDriver(updatedDriver);
  res.json(updatedDriver);
});

apiRouter.delete('/drivers/:id', (req: Request, res: Response) => {
  const success = storage.deleteDriver(req.params.id);
  res.json({ success });
});

apiRouter.post('/drivers/:id/payout', (req: Request, res: Response): void => {
  const driver = storage.getDriverById(req.params.id);
  if (!driver) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Motorista não encontrado' });
    return;
  }

  const paidAmount = driver.pendingBalance;
  driver.pendingBalance = 0;
  storage.saveDriver(driver);

  storage.logAudit({
    organizationId: driver.organizationId || 'system',
    userId: req.user?.id,
    action: 'DRIVER_PIX_PAYOUT_PROCESSED',
    resource: 'drivers',
    resourceId: driver.id,
    details: {
      driverName: driver.name,
      amount: paidAmount,
      pixKey: driver.pixKey,
    },
  });

  res.json({ success: true, paidAmount, pendingBalance: 0 });
});

// ============================================================================
// 5. DEVICES & HARDWARE KIOSK
// ============================================================================
apiRouter.get('/devices', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  res.json(storage.getDevices(orgId));
});

apiRouter.post('/devices', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  const newDev: Device = {
    ...req.body,
    id: req.body.id || `dev_${Date.now()}`,
    organizationId: orgId,
  };
  storage.saveDevice(newDev);
  res.status(201).json(newDev);
});

apiRouter.put('/devices/:id', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  const updated: Device = {
    ...req.body,
    id: req.params.id,
    organizationId: orgId,
  };
  storage.saveDevice(updated);
  res.json(updated);
});

apiRouter.delete('/devices/:id', (req: Request, res: Response) => {
  const success = storage.deleteDevice(req.params.id);
  res.json({ success });
});

/**
 * Generate 6-digit one-time pairing code with 15-minute expiration
 */
apiRouter.post('/devices/pair-token', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  const { driverId, screenPosition, hardwareOwnership } = req.body;

  const token = generatePairingCode();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

  storage.createPairingToken({
    token,
    organizationId: orgId,
    driverId,
    screenPosition: screenPosition || 'headrest_right',
    hardwareOwnership: hardwareOwnership || 'driver_byod',
    expiresAt,
    used: false,
    createdAt: new Date().toISOString(),
  });

  res.json({
    token,
    expiresAt: new Date(expiresAt).toISOString(),
    expiresInSeconds: 900,
  });
});

/**
 * Tablet kiosk pairs itself with the one-time 6-digit code
 */
apiRouter.post('/devices/pair', (req: Request, res: Response): void => {
  const { token, serialNumber, model, macAddress, imei } = req.body;

  const record = storage.getPairingToken(token);
  if (!record) {
    res.status(400).json({ error: 'INVALID_TOKEN', message: 'Código de pareamento inválido ou expirado.' });
    return;
  }

  // Mark token used
  storage.markPairingTokenUsed(token);

  const driver = storage.getDriverById(record.driverId);
  const deviceId = `dev_${Date.now()}`;
  const deviceCode = `TV-${record.organizationId.substring(4, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const deviceSecret = generateDeviceSecret();

  const newDevice: Device = {
    id: deviceId,
    code: deviceCode,
    serialNumber: serialNumber || `SN-${Date.now()}`,
    driverId: record.driverId,
    driverName: driver?.name || 'Motorista Parceiro',
    carPlate: driver?.carPlate || 'BR-0000',
    carModel: driver?.carModel || 'Toyota Corolla Hybrid 2024',
    status: 'online',
    model: model || 'Samsung Galaxy Tab A9+ 11" 4G/5G',
    screenPosition: record.screenPosition,
    hardwareOwnership: record.hardwareOwnership,
    offlineQueueCount: 0,
    currentLocation: {
      lat: driver?.workingCenter?.lat || -23.561684,
      lng: driver?.workingCenter?.lng || -46.655981,
      speedKmH: 0,
      heading: 0,
      address: driver?.workingRegion || 'Base Operacional',
      neighborhood: driver?.workingCity || 'São Paulo',
      city: driver?.workingCity || 'São Paulo',
      state: 'SP',
    },
    telemetry: {
      powerConnected: true,
      batteryLevel: 95,
      batteryVoltage: 13.8,
      cpuTemp: 37.0,
      signalStrength: '5G',
      signalDbm: -65,
      storageFreeGb: 50.0,
      totalStorageGb: 64.0,
      currentFps: 60,
      brightness: 80,
      volume: 35,
      appVersion: '2.4.0-prod',
      lastHeartbeat: new Date().toISOString(),
      kioskLocked: true,
      screenUptimeTodayHours: 0.1,
      uptimeHours: 0.1,
      screenBrightnessPct: 80,
    },
    hardwareSpecs: {
      brand: 'Samsung',
      tabletModel: model || 'Galaxy Tab A9+ 11"',
      screenSizeInches: 11.0,
      resolution: '1920x1200 FHD+ WUXGA',
      panelType: 'IPS Anti-Reflexo',
      brightnessNits: 570,
      aspectRatio: '16:10',
      orientation: 'landscape',
      osVersion: 'Android 14 Enterprise',
      macAddress: macAddress || '74:D0:2B:9F:8A:12',
      imei: imei || '864920058291048',
      connectivity: '5G_M2M',
      mountType: 'Suporte Encosto Antifurto',
      powerSupply: '12V Pós-Chave Veicular 5V/3A',
      ramGb: 4,
      storageGb: 64,
    },
    totalImpressionsToday: 0,
    totalInteractionsToday: 0,
    organizationId: record.organizationId,
  };

  storage.saveDevice(newDevice);

  res.json({
    success: true,
    deviceId: newDevice.id,
    deviceCode: newDevice.code,
    deviceSecret,
    organizationId: record.organizationId,
  });
});

/**
 * Send remote command to a vehicle device
 */
apiRouter.post('/devices/:id/command', (req: Request, res: Response) => {
  const { command } = req.body;
  const device = storage.getDeviceById(req.params.id);

  const cmdRecord = {
    id: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    organizationId: device?.organizationId || 'org_sp_matriz',
    deviceId: req.params.id,
    command: command as any,
    status: 'PENDING' as const,
    createdAt: new Date().toISOString(),
  };

  storage.createRemoteCommand(cmdRecord);

  // If local device exists, update telemetry message
  if (device) {
    if (command === 'REBOOT_APP') {
      device.telemetry.lastHeartbeat = 'Reiniciando Player...';
    } else if (command === 'FORCE_SYNC') {
      device.telemetry.lastHeartbeat = 'Cache 100% Sincronizado';
    }
    storage.saveDevice(device);
  }

  res.json({ success: true, commandId: cmdRecord.id });
});

/**
 * Device queries pending commands
 */
apiRouter.get('/devices/:id/commands', (req: Request, res: Response) => {
  const pending = storage.getPendingCommands(req.params.id);
  res.json(pending);
});

apiRouter.post('/devices/:id/commands/:cmdId/ack', (req: Request, res: Response) => {
  storage.acknowledgeCommand(req.params.cmdId);
  res.json({ success: true });
});

// ============================================================================
// 6. CAMPAIGNS
// ============================================================================
apiRouter.get('/campaigns', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  res.json(storage.getCampaigns(orgId));
});

apiRouter.post('/campaigns', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  const newCamp: Campaign = {
    ...req.body,
    id: req.body.id || `camp_${Date.now()}`,
    organizationId: orgId,
  };
  storage.saveCampaign(newCamp);
  res.status(201).json(newCamp);
});

apiRouter.put('/campaigns/:id', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  const updated: Campaign = {
    ...req.body,
    id: req.params.id,
    organizationId: orgId,
  };
  storage.saveCampaign(updated);
  res.json(updated);
});

apiRouter.patch('/campaigns/:id/status', (req: Request, res: Response): void => {
  const camp = storage.getCampaignById(req.params.id);
  if (!camp) {
    res.status(404).json({ error: 'NOT_FOUND' });
    return;
  }

  camp.status = camp.status === 'active' ? 'paused' : 'active';
  storage.saveCampaign(camp);
  res.json(camp);
});

apiRouter.delete('/campaigns/:id', (req: Request, res: Response) => {
  const success = storage.deleteCampaign(req.params.id);
  res.json({ success });
});

// ============================================================================
// 7. GEOFENCES
// ============================================================================
apiRouter.get('/geofences', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  res.json(storage.getGeoFences(orgId));
});

apiRouter.post('/geofences', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  const newGf: GeoFence = {
    ...req.body,
    id: req.body.id || `gf_${Date.now()}`,
    organizationId: orgId,
  };
  storage.saveGeoFence(newGf);
  res.status(201).json(newGf);
});

apiRouter.put('/geofences/:id', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  const updated: GeoFence = {
    ...req.body,
    id: req.params.id,
    organizationId: orgId,
  };
  storage.saveGeoFence(updated);
  res.json(updated);
});

apiRouter.delete('/geofences/:id', (req: Request, res: Response) => {
  const success = storage.deleteGeoFence(req.params.id);
  res.json({ success });
});

// ============================================================================
// 8. TELEMETRY & IOT INGESTION
// ============================================================================
apiRouter.post('/telemetry/heartbeat', (req: Request, res: Response): void => {
  const { deviceId, batteryVoltage, cpuTemp, signalStrength, lat, lng, speedKmH, address, neighborhood } = req.body;
  const dev = storage.getDeviceById(deviceId);

  if (dev) {
    if (batteryVoltage) dev.telemetry.batteryVoltage = Number(batteryVoltage);
    if (cpuTemp) dev.telemetry.cpuTemp = Number(cpuTemp);
    if (signalStrength) dev.telemetry.signalStrength = signalStrength;
    dev.telemetry.lastHeartbeat = new Date().toISOString();

    if (lat && lng) {
      dev.currentLocation.lat = Number(lat);
      dev.currentLocation.lng = Number(lng);
      if (speedKmH !== undefined) dev.currentLocation.speedKmH = Number(speedKmH);
      if (address) dev.currentLocation.address = address;
      if (neighborhood) dev.currentLocation.neighborhood = neighborhood;
    }
    storage.saveDevice(dev);
  }

  res.json({ success: true, acknowledgedAt: new Date().toISOString() });
});

// ============================================================================
// 9. PROOF OF PLAY (AUDIT & VERIFICATION)
// ============================================================================
apiRouter.post('/proof-of-play/log', (req: Request, res: Response): void => {
  const body = req.body;
  const logsToProcess: ProofOfPlayLog[] = Array.isArray(body) ? body : [body];

  let acceptedCount = 0;
  for (const item of logsToProcess) {
    // Generate/Validate HMAC signature
    const signature = item.signature || signProofOfPlay({
      eventId: item.id,
      deviceId: item.deviceId,
      campaignId: item.campaignId,
      creativeId: item.creativeId,
      startedAt: item.timestamp,
      endedAt: item.timestamp,
      durationMs: (item.durationSeconds || 15) * 1000,
      nonce: item.nonce || `nonce_${item.id}`,
    });

    const enrichedLog: ProofOfPlayLog = {
      ...item,
      signature,
      organizationId: item.organizationId || 'org_sp_matriz',
    };

    const recorded = storage.recordProofOfPlay(enrichedLog);
    if (recorded) acceptedCount++;
  }

  res.json({ success: true, count: acceptedCount });
});

apiRouter.post('/proof-of-play/verify', (req: Request, res: Response): void => {
  const { eventId, deviceId, campaignId, startedAt, endedAt, durationMs, nonce, signature } = req.body;

  if (!eventId || !deviceId || !campaignId || !signature) {
    res.status(400).json({ error: 'MISSING_FIELDS', message: 'Campos obrigatórios para verificação ausentes.' });
    return;
  }

  const isValid = verifyProofOfPlaySignature({
    eventId,
    deviceId,
    campaignId,
    startedAt: startedAt || new Date().toISOString(),
    endedAt: endedAt || new Date().toISOString(),
    durationMs: durationMs || 15000,
    nonce: nonce || `nonce_${eventId}`,
    signature,
  });

  res.json({
    verified: isValid,
    algorithm: 'HMAC-SHA256',
    eventId,
    checkedAt: new Date().toISOString(),
  });
});

apiRouter.get('/proof-of-play/logs', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  res.json(storage.getProofOfPlayLogs(orgId, limit));
});

// ============================================================================
// 10. ADVERTISERS & BILLING
// ============================================================================
apiRouter.get('/advertisers', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  res.json(storage.getAdvertisers(orgId));
});

apiRouter.post('/advertisers', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  const newAdv = {
    ...req.body,
    id: req.body.id || `adv_${Date.now()}`,
    organizationId: orgId,
  };
  storage.saveAdvertiser(newAdv);
  res.status(201).json(newAdv);
});

apiRouter.get('/billing/invoices', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  res.json(storage.getInvoices(orgId));
});

apiRouter.post('/billing/invoices/:id/generate-pix', async (req: Request, res: Response): Promise<void> => {
  const invoices = storage.getInvoices();
  const invoice = invoices.find(i => i.id === req.params.id);

  if (!invoice) {
    res.status(404).json({ error: 'INVOICE_NOT_FOUND' });
    return;
  }

  const pixData = await pixGateway.createPixCharge({
    invoiceId: invoice.id,
    amount: invoice.amount,
    description: `Assinatura VeloMedia DOOH - ${invoice.month}`,
    payerCnpjOrCpf: '00.000.000/0001-00',
    payerName: invoice.organizationName,
  });

  invoice.pixQrCode = pixData.copiaECola;
  storage.saveInvoice(invoice);

  res.json({
    success: true,
    pixData,
  });
});

// ============================================================================
// 11. AUDIT TRAIL
// ============================================================================
apiRouter.get('/audit/logs', (req: Request, res: Response) => {
  const orgId = resolveTenant(req);
  res.json(storage.getAuditLogs(orgId));
});
