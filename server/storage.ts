import fs from 'node:crypto';
import fsPromises from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { hashPassword } from './crypto';
import type { 
  Campaign, 
  Device, 
  Driver, 
  GeoFence, 
  ProofOfPlayLog, 
  SaaSOrganization, 
  SaaSUser, 
  SaaSUserRole,
  AdvertiserAccount, 
  SaaSInvoice 
} from '../src/types';

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface PairingTokenRecord {
  token: string;
  organizationId: string;
  driverId: string;
  screenPosition: 'headrest_right' | 'headrest_left' | 'center_console' | 'front_dash';
  hardwareOwnership: 'company_owned' | 'driver_byod';
  expiresAt: number; // timestamp ms
  used: boolean;
  createdAt: string;
}

export interface RemoteCommandRecord {
  id: string;
  organizationId: string;
  deviceId: string;
  command: 'REBOOT_APP' | 'FORCE_SYNC' | 'SCREEN_ON' | 'SCREEN_OFF' | 'CLEAR_CACHE';
  status: 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'FAILED';
  createdAt: string;
  acknowledgedAt?: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: SaaSUserRole;
  organizationId: string;
  expiresAt: number; // timestamp ms
  createdAt: string;
}

export interface DeviceCredentialRecord {
  deviceId: string;
  organizationId: string;
  deviceSecret: string;
  revoked: boolean;
  createdAt: string;
  lastSeenAt?: string;
}

export interface ReplayRecord {
  eventId: string;
  nonce: string;
  timestamp: number;
}

export interface WebhookRecord {
  eventId: string;
  provider: string;
  processedAt: string;
  payloadHash: string;
}

interface DatabaseSchema {
  version: number;
  organizations: SaaSOrganization[];
  users: (SaaSUser & { passwordHash?: string })[];
  drivers: Driver[];
  devices: Device[];
  campaigns: Campaign[];
  geofences: GeoFence[];
  proofOfPlayLogs: ProofOfPlayLog[];
  advertisers: AdvertiserAccount[];
  invoices: SaaSInvoice[];
  auditLogs: AuditLog[];
  pairingTokens: PairingTokenRecord[];
  remoteCommands: RemoteCommandRecord[];
  sessions: SessionRecord[];
  deviceCredentials: DeviceCredentialRecord[];
  replayLogs: ReplayRecord[];
  webhooks: WebhookRecord[];
}

export class VeloStorage {
  private dataFilePath: string;
  private memoryDb: DatabaseSchema;
  private isSaving: boolean = false;
  private pendingSave: boolean = false;

  constructor(filePath?: string) {
    this.dataFilePath = filePath || path.join(process.cwd(), 'data', 'velomedia_store.json');
    
    // Production Persistence Guard: JSON storage is prohibited in production unless explicitly allowed for testing
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEV_STORAGE_IN_PROD) {
      if (!process.env.DATABASE_URL) {
        throw new Error(
          '[FATAL SECURITY EXCEPTION] Production requires PostgreSQL persistence (DATABASE_URL is missing). ' +
          'JSON file storage is strictly prohibited in production mode.'
        );
      }
    }

    this.memoryDb = this.loadInitial();
  }

  private loadInitial(): DatabaseSchema {
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fsSync.existsSync(dir)) {
        fsSync.mkdirSync(dir, { recursive: true });
      }

      if (fsSync.existsSync(this.dataFilePath)) {
        const raw = fsSync.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.deviceCredentials) parsed.deviceCredentials = [];
        if (!parsed.replayLogs) parsed.replayLogs = [];
        if (!parsed.webhooks) parsed.webhooks = [];
        return parsed;
      }
    } catch (err) {
      console.warn('[VeloStorage] Could not read existing store, creating fresh store with seed:', err);
    }

    return this.createSeedDatabase();
  }

  private createSeedDatabase(): DatabaseSchema {
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || (
      process.env.NODE_ENV === 'production'
        ? (() => { throw new Error('[SECURITY CONFIG] INITIAL_ADMIN_PASSWORD must be defined in production.'); })()
        : 'VeloAdminDemo2026!'
    );
    const adminHash = hashPassword(adminPassword);

    // LGPD-compliant seed data with sanitized demo domains (.invalid) and mock CNPJs
    const initialOrgs: SaaSOrganization[] = [
      {
        id: 'org_sp_matriz',
        name: 'VeloMedia São Paulo (Matriz Operadora)',
        slug: 'sp-matriz',
        subdomain: 'sp.velomedia.demo.invalid',
        cnpj: '00.000.000/0001-91',
        city: 'São Paulo',
        state: 'SP',
        planTier: 'enterprise_network',
        activeScreensCount: 142,
        maxScreensLimit: 300,
        activeCampaignsCount: 18,
        maxCampaignsLimit: 50,
        activeDriversCount: 135,
        maxDriversLimit: 300,
        adminUser: {
          name: 'Carlos Albuquerque',
          email: 'admin@demo.velomedia.invalid',
          phone: '(11) 90000-0001',
        },
        billingEmail: 'financeiro@demo.velomedia.invalid',
        billingCycle: 'monthly',
        nextBillingDate: '2026-10-05',
        monthlySoftwareCost: 5490,
        estimatedGrossAdRevenue: 85000,
        driverPayoutTotal: 25500,
        netProfit: 54010,
        status: 'active',
      },
      {
        id: 'org_rio_frota',
        name: 'Carioca DOOH Mobilidade RJ',
        slug: 'rio-frota',
        subdomain: 'rio.velomedia.demo.invalid',
        cnpj: '00.000.000/0002-72',
        city: 'Rio de Janeiro',
        state: 'RJ',
        planTier: 'pro_fleet',
        activeScreensCount: 48,
        maxScreensLimit: 100,
        activeCampaignsCount: 8,
        maxCampaignsLimit: 25,
        activeDriversCount: 45,
        maxDriversLimit: 100,
        adminUser: {
          name: 'Renata Lemos',
          email: 'operacoes@rio.demo.invalid',
          phone: '(21) 90000-0002',
        },
        billingEmail: 'financeiro@rio.demo.invalid',
        billingCycle: 'monthly',
        nextBillingDate: '2026-10-10',
        monthlySoftwareCost: 1990,
        estimatedGrossAdRevenue: 28000,
        driverPayoutTotal: 8400,
        netProfit: 17610,
        status: 'active',
      },
    ];

    const initialUsers: (SaaSUser & { passwordHash?: string })[] = [
      {
        id: 'user_master',
        name: 'Administrador Velo Master',
        email: 'admin@velomedia.com.br',
        phone: '(11) 90000-0001',
        role: 'platform_admin',
        organizationId: 'org_sp_matriz',
        organizationName: 'VeloMedia São Paulo',
        status: 'active',
        permissions: ['*'],
        lastLogin: new Date().toISOString(),
        createdAt: '2025-01-15T10:00:00Z',
        passwordHash: adminHash,
      },
      {
        id: 'user_sp_operator',
        name: 'Operador São Paulo',
        email: 'operador@velomedia.com.br',
        phone: '(11) 90000-0003',
        role: 'operator',
        organizationId: 'org_sp_matriz',
        organizationName: 'VeloMedia São Paulo',
        status: 'active',
        permissions: ['view_devices', 'control_playback'],
        lastLogin: new Date().toISOString(),
        createdAt: '2025-03-10T10:00:00Z',
        passwordHash: adminHash,
      },
    ];

    const initialDrivers: Driver[] = [
      {
        id: 'drv_01',
        name: 'Motorista Demonstração SP',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        carPlate: 'BRA-0A01',
        carModel: 'Sedan Híbrido Teste 2024',
        carColor: 'Preto',
        serviceType: 'Uber Black',
        phone: '(11) 90000-1111',
        pixKey: 'driver01@demo.velomedia.invalid',
        pixKeyType: 'EMAIL',
        totalRidesMonth: 285,
        totalEarningsMonth: 1450.8,
        pendingBalance: 320.5,
        monthlyEarnings: 1450.8,
        rating: 4.96,
        screenUptimeRating: 98.4,
        referralCode: 'DRIVER01-DEMO',
        workingCity: 'São Paulo',
        workingRegion: 'Centro Expandido e Av. Paulista',
        workingCenter: { lat: -23.561684, lng: -46.655981 },
        workingRadiusKm: 15,
        workingPoles: ['pole_sp_paulista', 'pole_sp_itaim'],
        organizationId: 'org_sp_matriz',
      },
      {
        id: 'drv_02',
        name: 'Motorista Demonstração RJ',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        carPlate: 'RIO-0B02',
        carModel: 'Veículo Elétrico Teste 2024',
        carColor: 'Branco',
        serviceType: 'Uber Comfort',
        phone: '(21) 90000-2222',
        pixKey: '21900002222',
        pixKeyType: 'TELEFONE',
        totalRidesMonth: 210,
        totalEarningsMonth: 980.2,
        pendingBalance: 190.0,
        monthlyEarnings: 980.2,
        rating: 4.92,
        screenUptimeRating: 96.8,
        referralCode: 'DRIVER02-DEMO',
        workingCity: 'São Paulo',
        workingRegion: 'Zona Sul / Berrini / Aeroporto CGH',
        workingCenter: { lat: -23.60005, lng: -46.6908 },
        workingRadiusKm: 20,
        workingPoles: ['pole_sp_berrini', 'pole_sp_cgh'],
        organizationId: 'org_sp_matriz',
      },
    ];

    const initialDevices: Device[] = [
      {
        id: 'dev_01',
        code: 'TV-SP-8491',
        serialNumber: 'SAM-A9P-2025-0012',
        driverId: 'drv_01',
        driverName: 'Motorista Demonstração SP',
        carPlate: 'BRA-0A01',
        carModel: 'Sedan Híbrido Teste 2024',
        status: 'online',
        model: 'Samsung Galaxy Tab A9+ 11" 5G Homologado',
        screenPosition: 'headrest_right',
        hardwareOwnership: 'driver_byod',
        offlineQueueCount: 0,
        currentLocation: {
          lat: -23.561684,
          lng: -46.655981,
          speedKmH: 34.5,
          heading: 180,
          address: 'Avenida Paulista, 1578 - Bela Vista',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
        },
        telemetry: {
          powerConnected: true,
          batteryLevel: 94,
          batteryVoltage: 13.8,
          cpuTemp: 38.2,
          signalStrength: '5G',
          signalDbm: -68,
          storageFreeGb: 48.5,
          totalStorageGb: 64.0,
          currentFps: 60,
          brightness: 85,
          volume: 40,
          appVersion: '2.4.0-prod',
          lastHeartbeat: new Date().toISOString(),
          kioskLocked: true,
          screenUptimeTodayHours: 8.5,
          uptimeHours: 8.5,
          screenBrightnessPct: 85,
        },
        hardwareSpecs: {
          brand: 'Samsung',
          tabletModel: 'Galaxy Tab A9+ 11" 4G/5G',
          screenSizeInches: 11.0,
          resolution: '1920x1200 FHD+ WUXGA',
          panelType: 'TFT LCD IPS Capacitivo Anti-Reflexo',
          brightnessNits: 570,
          aspectRatio: '16:10',
          orientation: 'landscape',
          osVersion: 'Android 14 OneUI 6.0 Kiosk Locked',
          macAddress: '02:00:00:00:00:01',
          imei: '000000000000001',
          simCarrier: 'M2M Telecom IoT',
          connectivity: '5G_M2M',
          mountType: 'Suporte de Encosto em Alumínio c/ Trava Antifurto Allen',
          powerSupply: '12V Pós-Chave c/ Conversor Step-Down 5V/3A & Fusível',
          storageGb: 64,
          ramGb: 4,
          refreshRateHz: 90,
        },
        totalImpressionsToday: 248,
        totalInteractionsToday: 32,
        organizationId: 'org_sp_matriz',
      },
    ];

    // Seed device credential for dev_01 with dedicated cryptographic secret
    const initialDeviceCredentials: DeviceCredentialRecord[] = [
      {
        deviceId: 'dev_01',
        organizationId: 'org_sp_matriz',
        deviceSecret: 'dev_secret_01_sample_seed',
        revoked: false,
        createdAt: '2025-01-15T10:00:00Z',
        lastSeenAt: new Date().toISOString(),
      },
    ];

    const initialCampaigns: Campaign[] = [
      {
        id: 'camp_01',
        title: 'Campanha FinTech Ultravioleta - Demo',
        name: 'Campanha FinTech Ultravioleta - Demo',
        advertiser: 'FinTech Demonstração Brasil',
        logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=120&q=80',
        category: 'tech_finance',
        status: 'active',
        priority: 10,
        cpm: 65.0,
        budgetTotal: 25000,
        budgetSpent: 8450.5,
        totalImpressions: 130000,
        totalInteractions: 14200,
        totalScans: 3890,
        targetImpressions: 350000,
        targetGeoFences: ['all'],
        creative: {
          id: 'crt_01',
          title: 'Cartão Black Corporativo',
          tagline: 'O cartão de crédito para quem valoriza seu tempo',
          type: 'video',
          mediaUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1280&q=80',
          ctaText: 'Solicitar Cartão',
          qrCodeUrl: 'https://demo.velomedia.invalid/solicitar',
          audioEnabledByDefault: false,
          durationSeconds: 15,
        },
        schedule: {
          startDate: '2026-09-01',
          endDate: '2026-10-31',
          daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
          timeSlots: [{ startHour: 6, endHour: 23 }],
        },
        organizationId: 'org_sp_matriz',
      },
      {
        id: 'camp_02',
        title: 'Gastronomia Jardins - Demo',
        name: 'Gastronomia Jardins - Demo',
        advertiser: 'Grupo Gastronômico Demo',
        logo: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=120&q=80',
        category: 'food_beverage',
        status: 'active',
        priority: 9,
        cpm: 80.0,
        budgetTotal: 15000,
        budgetSpent: 5120.0,
        totalImpressions: 64000,
        totalInteractions: 8100,
        totalScans: 2350,
        targetImpressions: 180000,
        targetGeoFences: ['gf_sp_jardins'],
        creative: {
          id: 'crt_02',
          title: 'Alta Gastronomia',
          tagline: 'Experiência inesquecível nos Jardins',
          type: 'interactive_banner',
          mediaUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1280&q=80',
          ctaText: 'Reservar Mesa',
          qrCodeUrl: 'https://demo.velomedia.invalid/reservas',
          audioEnabledByDefault: false,
          durationSeconds: 10,
        },
        schedule: {
          startDate: '2026-09-01',
          endDate: '2026-10-15',
          daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
          timeSlots: [{ startHour: 11, endHour: 23 }],
        },
        organizationId: 'org_sp_matriz',
      },
    ];

    const initialGeoFences: GeoFence[] = [
      {
        id: 'gf_sp_paulista',
        name: 'Av. Paulista & Jardins',
        city: 'São Paulo',
        description: 'Polos comerciais de alta renda e tráfego financeiro',
        center: { lat: -23.561684, lng: -46.655981 },
        radiusKm: 2.5,
        color: '#06b6d4',
        organizationId: 'org_sp_matriz',
      },
      {
        id: 'gf_sp_itaim_faria_lima',
        name: 'Faria Lima & Itaim Bibi Corporate',
        city: 'São Paulo',
        description: 'Coração financeiro e de venture capital de São Paulo',
        center: { lat: -23.5855, lng: -46.6806 },
        radiusKm: 3.0,
        color: '#3b82f6',
        organizationId: 'org_sp_matriz',
      },
    ];

    const initialInvoices: SaaSInvoice[] = [
      {
        id: 'inv_2026_09_01',
        invoiceNumber: 'INV-SP-202609-001',
        organizationId: 'org_sp_matriz',
        organizationName: 'VeloMedia São Paulo',
        month: 'Setembro / 2026',
        screensBilled: 142,
        devicesBilled: 142,
        amount: 5490.0,
        issueDate: '2026-09-01',
        dueDate: '2026-09-10',
        status: 'paid',
        paymentMethod: 'pix',
        pixQrCode: '00020126580014br.gov.bcb.pix0136velomedia-demo-key52040000530398654075490.005802BR5918VELOMEDIA DEMO SA6009SAO PAULO62070503***6304ABCD',
        pixQrCodeUrl: '00020126580014br.gov.bcb.pix0136velomedia-demo-key52040000530398654075490.005802BR5918VELOMEDIA DEMO SA6009SAO PAULO62070503***6304ABCD',
      },
    ];

    const initialAdvertisers: AdvertiserAccount[] = [
      {
        id: 'adv_fintech',
        name: 'FinTech Demonstração S.A.',
        companyName: 'FinTech Demonstração S.A.',
        tradeName: 'FinTech Demo',
        cnpj: '00.000.000/0003-53',
        category: 'tech_finance',
        contactName: 'Contato Comercial',
        email: 'marketing@fintech.demo.invalid',
        phone: '(11) 90000-3333',
        billingAddress: 'Av. Exemplo, 100 - Centro',
        city: 'São Paulo',
        state: 'SP',
        paymentTerms: 'monthly_retainer',
        creditLimit: 50000,
        currentBalance: 16549.5,
        balance: 16549.5,
        status: 'active',
        activeCampaignsCount: 1,
        totalSpent: 8450.5,
        portalAccessCode: 'DEMO2026',
        createdAt: '2025-01-20T10:00:00Z',
        organizationId: 'org_sp_matriz',
      },
      {
        id: 'adv_gastronomia',
        name: 'Gastronomia Demo Ltda',
        companyName: 'Gastronomia Demo Ltda',
        tradeName: 'Restaurante Demo',
        cnpj: '00.000.000/0004-34',
        category: 'food_beverage',
        contactName: 'Gerente Demo',
        email: 'contato@gastronomia.demo.invalid',
        phone: '(11) 90000-4444',
        billingAddress: 'Rua Gastronômica, 88 - Jardins',
        city: 'São Paulo',
        state: 'SP',
        paymentTerms: 'prepaid',
        creditLimit: 20000,
        currentBalance: 9880.0,
        balance: 9880.0,
        status: 'active',
        activeCampaignsCount: 1,
        totalSpent: 5120.0,
        portalAccessCode: 'REST2026',
        createdAt: '2025-02-15T14:00:00Z',
        organizationId: 'org_sp_matriz',
      },
    ];

    const schema: DatabaseSchema = {
      version: 2,
      organizations: initialOrgs,
      users: initialUsers,
      drivers: initialDrivers,
      devices: initialDevices,
      campaigns: initialCampaigns,
      geofences: initialGeoFences,
      proofOfPlayLogs: [],
      advertisers: initialAdvertisers,
      invoices: initialInvoices,
      auditLogs: [],
      pairingTokens: [],
      remoteCommands: [],
      sessions: [],
      deviceCredentials: initialDeviceCredentials,
      replayLogs: [],
      webhooks: [],
    };

    this.saveImmediate(schema);
    return schema;
  }

  /**
   * Atomic sequential disk write avoiding dropped updates under concurrency.
   */
  private save(): void {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }

    this.isSaving = true;
    this.pendingSave = false;

    setTimeout(() => {
      try {
        const dir = path.dirname(this.dataFilePath);
        if (!fsSync.existsSync(dir)) {
          fsSync.mkdirSync(dir, { recursive: true });
        }
        const tempPath = `${this.dataFilePath}.${Date.now()}.tmp`;
        fsSync.writeFileSync(tempPath, JSON.stringify(this.memoryDb, null, 2), 'utf-8');
        fsSync.renameSync(tempPath, this.dataFilePath);
      } catch (err) {
        console.error('[VeloStorage] Atomic save error:', err);
      } finally {
        this.isSaving = false;
        if (this.pendingSave) {
          this.save();
        }
      }
    }, 10);
  }

  private saveImmediate(schema: DatabaseSchema): void {
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fsSync.existsSync(dir)) {
        fsSync.mkdirSync(dir, { recursive: true });
      }
      fsSync.writeFileSync(this.dataFilePath, JSON.stringify(schema, null, 2), 'utf-8');
    } catch (err) {
      console.error('[VeloStorage] saveImmediate error:', err);
    }
  }

  // --- ORGANIZATIONS ---
  public getOrganizations(): SaaSOrganization[] {
    return [...this.memoryDb.organizations];
  }

  public getOrganizationById(id: string): SaaSOrganization | undefined {
    return this.memoryDb.organizations.find(o => o.id === id);
  }

  public saveOrganization(org: SaaSOrganization): void {
    const idx = this.memoryDb.organizations.findIndex(o => o.id === org.id);
    if (idx >= 0) {
      this.memoryDb.organizations[idx] = org;
    } else {
      this.memoryDb.organizations.unshift(org);
    }
    this.save();
  }

  public deleteOrganization(id: string): boolean {
    const before = this.memoryDb.organizations.length;
    this.memoryDb.organizations = this.memoryDb.organizations.filter(o => o.id !== id);
    if (this.memoryDb.organizations.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // --- USERS ---
  public getUsers(orgId?: string): SaaSUser[] {
    return this.memoryDb.users
      .filter(u => !orgId || u.organizationId === orgId)
      .map(({ passwordHash, ...safeUser }) => safeUser);
  }

  public getUserById(id: string, orgId?: string): SaaSUser | undefined {
    const user = this.memoryDb.users.find(u => u.id === id && (!orgId || u.organizationId === orgId));
    if (!user) return undefined;
    const { passwordHash, ...safe } = user;
    return safe;
  }

  public getUserByEmail(email: string): (SaaSUser & { passwordHash?: string }) | undefined {
    return this.memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public saveUser(user: SaaSUser, password?: string): void {
    const existing = this.memoryDb.users.find(u => u.id === user.id);
    const passwordHash = password ? hashPassword(password) : existing?.passwordHash;
    const userWithHash = { ...user, passwordHash };

    const idx = this.memoryDb.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      this.memoryDb.users[idx] = userWithHash;
    } else {
      this.memoryDb.users.unshift(userWithHash);
    }
    this.save();
  }

  public deleteUser(id: string, orgId?: string): boolean {
    const before = this.memoryDb.users.length;
    this.memoryDb.users = this.memoryDb.users.filter(u => !(u.id === id && (!orgId || u.organizationId === orgId)));
    if (this.memoryDb.users.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // --- SESSIONS ---
  public createSession(session: SessionRecord): void {
    const now = Date.now();
    this.memoryDb.sessions = this.memoryDb.sessions.filter(s => s.expiresAt > now);
    this.memoryDb.sessions.push(session);
    this.save();
  }

  public getSession(token: string): SessionRecord | undefined {
    const now = Date.now();
    const session = this.memoryDb.sessions.find(s => s.token === token);
    if (!session || session.expiresAt <= now) {
      return undefined;
    }
    return session;
  }

  public deleteSession(token: string): boolean {
    const before = this.memoryDb.sessions.length;
    this.memoryDb.sessions = this.memoryDb.sessions.filter(s => s.token !== token);
    if (this.memoryDb.sessions.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // --- DRIVERS (STRICT MULTI-TENANT ISOLATION) ---
  public getDrivers(orgId: string): Driver[] {
    return this.memoryDb.drivers.filter(d => d.organizationId === orgId);
  }

  public getDriverById(id: string, orgId: string): Driver | undefined {
    return this.memoryDb.drivers.find(d => d.id === id && d.organizationId === orgId);
  }

  public saveDriver(driver: Driver, orgId: string): Driver | null {
    // Cross-tenant check: ID must not belong to another organization
    const existingOtherTenant = this.memoryDb.drivers.find(d => d.id === driver.id && d.organizationId !== orgId);
    if (existingOtherTenant) {
      return null;
    }

    const driverWithOrg = { ...driver, organizationId: orgId };
    const idx = this.memoryDb.drivers.findIndex(d => d.id === driver.id && d.organizationId === orgId);
    if (idx >= 0) {
      this.memoryDb.drivers[idx] = driverWithOrg;
    } else {
      this.memoryDb.drivers.unshift(driverWithOrg);
    }
    this.save();
    return driverWithOrg;
  }

  public deleteDriver(id: string, orgId: string): boolean {
    const before = this.memoryDb.drivers.length;
    this.memoryDb.drivers = this.memoryDb.drivers.filter(d => !(d.id === id && d.organizationId === orgId));
    if (this.memoryDb.drivers.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // --- DEVICES (STRICT MULTI-TENANT ISOLATION) ---
  public getDevices(orgId: string): Device[] {
    return this.memoryDb.devices.filter(d => d.organizationId === orgId);
  }

  public getDeviceById(id: string, orgId: string): Device | undefined {
    return this.memoryDb.devices.find(d => (d.id === id || d.code === id) && d.organizationId === orgId);
  }

  /**
   * Internal lookup by deviceId without org filter (used by device auth middleware to locate tenant)
   */
  public getDeviceByIdInternal(id: string): Device | undefined {
    return this.memoryDb.devices.find(d => d.id === id || d.code === id);
  }

  public saveDevice(dev: Device, orgId: string): Device | null {
    const existingOther = this.memoryDb.devices.find(d => d.id === dev.id && d.organizationId !== orgId);
    if (existingOther) {
      return null;
    }

    const deviceWithOrg = { ...dev, organizationId: orgId };
    const idx = this.memoryDb.devices.findIndex(d => d.id === dev.id && d.organizationId === orgId);
    if (idx >= 0) {
      this.memoryDb.devices[idx] = deviceWithOrg;
    } else {
      this.memoryDb.devices.unshift(deviceWithOrg);
    }
    this.save();
    return deviceWithOrg;
  }

  public deleteDevice(id: string, orgId: string): boolean {
    const before = this.memoryDb.devices.length;
    this.memoryDb.devices = this.memoryDb.devices.filter(d => !(d.id === id && d.organizationId === orgId));
    if (this.memoryDb.devices.length !== before) {
      // Also revoke credentials
      this.revokeDeviceCredential(id, orgId);
      this.save();
      return true;
    }
    return false;
  }

  // --- DEVICE CREDENTIALS ---
  public getDeviceCredential(deviceId: string): DeviceCredentialRecord | undefined {
    return this.memoryDb.deviceCredentials.find(c => c.deviceId === deviceId && !c.revoked);
  }

  public saveDeviceCredential(cred: DeviceCredentialRecord): void {
    const idx = this.memoryDb.deviceCredentials.findIndex(c => c.deviceId === cred.deviceId);
    if (idx >= 0) {
      this.memoryDb.deviceCredentials[idx] = cred;
    } else {
      this.memoryDb.deviceCredentials.unshift(cred);
    }
    this.save();
  }

  public revokeDeviceCredential(deviceId: string, orgId: string): boolean {
    const cred = this.memoryDb.deviceCredentials.find(c => c.deviceId === deviceId && c.organizationId === orgId);
    if (cred) {
      cred.revoked = true;
      this.save();
      return true;
    }
    return false;
  }

  // --- ANTI-REPLAY ENGINE ---
  public checkAndRecordReplay(eventId: string, nonce: string, timestampMs: number): { valid: boolean; reason?: string } {
    const now = Date.now();
    const maxSkewMs = 5 * 60 * 1000; // 5 minute max skew

    if (Math.abs(now - timestampMs) > maxSkewMs) {
      return { valid: false, reason: 'Timestamp outside acceptable window (clock skew > 5m)' };
    }

    // Check if eventId or nonce has been seen
    const seenEvent = this.memoryDb.replayLogs.some(r => r.eventId === eventId);
    if (seenEvent) {
      return { valid: false, reason: 'Event ID already processed (replay detected)' };
    }

    const seenNonce = this.memoryDb.replayLogs.some(r => r.nonce === nonce);
    if (seenNonce) {
      return { valid: false, reason: 'Nonce already used (replay detected)' };
    }

    // Prune entries older than 30 minutes
    const cutoff = now - 30 * 60 * 1000;
    this.memoryDb.replayLogs = this.memoryDb.replayLogs.filter(r => r.timestamp > cutoff);

    this.memoryDb.replayLogs.push({ eventId, nonce, timestamp: timestampMs });
    this.save();
    return { valid: true };
  }

  // --- WEBHOOK DEDUPLICATION ---
  public recordWebhook(record: WebhookRecord): boolean {
    const exists = this.memoryDb.webhooks.some(w => w.eventId === record.eventId);
    if (exists) return false;
    this.memoryDb.webhooks.unshift(record);
    if (this.memoryDb.webhooks.length > 2000) {
      this.memoryDb.webhooks.length = 2000;
    }
    this.save();
    return true;
  }

  // --- CAMPAIGNS (STRICT MULTI-TENANT ISOLATION) ---
  public getCampaigns(orgId: string): Campaign[] {
    return this.memoryDb.campaigns.filter(c => c.organizationId === orgId);
  }

  public getCampaignById(id: string, orgId: string): Campaign | undefined {
    return this.memoryDb.campaigns.find(c => c.id === id && c.organizationId === orgId);
  }

  public saveCampaign(campaign: Campaign, orgId: string): Campaign | null {
    const existingOther = this.memoryDb.campaigns.find(c => c.id === campaign.id && c.organizationId !== orgId);
    if (existingOther) {
      return null;
    }

    const campaignWithOrg = { ...campaign, organizationId: orgId };
    const idx = this.memoryDb.campaigns.findIndex(c => c.id === campaign.id && c.organizationId === orgId);
    if (idx >= 0) {
      this.memoryDb.campaigns[idx] = campaignWithOrg;
    } else {
      this.memoryDb.campaigns.unshift(campaignWithOrg);
    }
    this.save();
    return campaignWithOrg;
  }

  public deleteCampaign(id: string, orgId: string): boolean {
    const before = this.memoryDb.campaigns.length;
    this.memoryDb.campaigns = this.memoryDb.campaigns.filter(c => !(c.id === id && c.organizationId === orgId));
    if (this.memoryDb.campaigns.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // --- GEOFENCES (STRICT MULTI-TENANT ISOLATION) ---
  public getGeoFences(orgId: string): GeoFence[] {
    return this.memoryDb.geofences.filter(g => g.organizationId === orgId);
  }

  public getGeoFenceById(id: string, orgId: string): GeoFence | undefined {
    return this.memoryDb.geofences.find(g => g.id === id && g.organizationId === orgId);
  }

  public saveGeoFence(geofence: GeoFence, orgId: string): GeoFence | null {
    const existingOther = this.memoryDb.geofences.find(g => g.id === geofence.id && g.organizationId !== orgId);
    if (existingOther) {
      return null;
    }

    const gfWithOrg = { ...geofence, organizationId: orgId };
    const idx = this.memoryDb.geofences.findIndex(g => g.id === geofence.id && g.organizationId === orgId);
    if (idx >= 0) {
      this.memoryDb.geofences[idx] = gfWithOrg;
    } else {
      this.memoryDb.geofences.unshift(gfWithOrg);
    }
    this.save();
    return gfWithOrg;
  }

  public deleteGeoFence(id: string, orgId: string): boolean {
    const before = this.memoryDb.geofences.length;
    this.memoryDb.geofences = this.memoryDb.geofences.filter(g => !(g.id === id && g.organizationId === orgId));
    if (this.memoryDb.geofences.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // --- ADVERTISERS (STRICT MULTI-TENANT ISOLATION) ---
  public getAdvertisers(orgId: string): AdvertiserAccount[] {
    return this.memoryDb.advertisers.filter(a => a.organizationId === orgId);
  }

  public getAdvertiserById(id: string, orgId: string): AdvertiserAccount | undefined {
    return this.memoryDb.advertisers.find(a => a.id === id && a.organizationId === orgId);
  }

  public saveAdvertiser(adv: AdvertiserAccount, orgId: string): AdvertiserAccount | null {
    const existingOther = this.memoryDb.advertisers.find(a => a.id === adv.id && a.organizationId !== orgId);
    if (existingOther) {
      return null;
    }

    const advWithOrg = { ...adv, organizationId: orgId };
    const idx = this.memoryDb.advertisers.findIndex(a => a.id === adv.id && a.organizationId === orgId);
    if (idx >= 0) {
      this.memoryDb.advertisers[idx] = advWithOrg;
    } else {
      this.memoryDb.advertisers.unshift(advWithOrg);
    }
    this.save();
    return advWithOrg;
  }

  public deleteAdvertiser(id: string, orgId: string): boolean {
    const before = this.memoryDb.advertisers.length;
    this.memoryDb.advertisers = this.memoryDb.advertisers.filter(a => !(a.id === id && a.organizationId === orgId));
    if (this.memoryDb.advertisers.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // --- INVOICES (STRICT MULTI-TENANT ISOLATION) ---
  public getInvoices(orgId: string): SaaSInvoice[] {
    return this.memoryDb.invoices.filter(i => i.organizationId === orgId);
  }

  public getInvoiceById(id: string, orgId: string): SaaSInvoice | undefined {
    return this.memoryDb.invoices.find(i => i.id === id && i.organizationId === orgId);
  }

  public saveInvoice(invoice: SaaSInvoice, orgId: string): SaaSInvoice | null {
    const existingOther = this.memoryDb.invoices.find(i => i.id === invoice.id && i.organizationId !== orgId);
    if (existingOther) {
      return null;
    }

    const invWithOrg = { ...invoice, organizationId: orgId };
    const idx = this.memoryDb.invoices.findIndex(i => i.id === invoice.id && i.organizationId === orgId);
    if (idx >= 0) {
      this.memoryDb.invoices[idx] = invWithOrg;
    } else {
      this.memoryDb.invoices.unshift(invWithOrg);
    }
    this.save();
    return invWithOrg;
  }

  // --- PROOF OF PLAY LOGS (STRICT MULTI-TENANT ISOLATION) ---
  public getProofOfPlayLogs(orgId: string, limit: number = 100): ProofOfPlayLog[] {
    return this.memoryDb.proofOfPlayLogs
      .filter(l => l.organizationId === orgId)
      .slice(0, limit);
  }

  public recordProofOfPlay(log: ProofOfPlayLog, orgId: string): boolean {
    if (log.organizationId && log.organizationId !== orgId) {
      return false;
    }

    // Check duplicate by eventId
    if (this.memoryDb.proofOfPlayLogs.some(l => l.id === log.id)) {
      return false; // Idempotent discard
    }

    const logWithOrg = { ...log, organizationId: orgId };
    this.memoryDb.proofOfPlayLogs.unshift(logWithOrg);

    // Cap memory list at 10,000 logs
    if (this.memoryDb.proofOfPlayLogs.length > 10000) {
      this.memoryDb.proofOfPlayLogs.length = 10000;
    }

    // Update campaign counters in storage
    const campaign = this.memoryDb.campaigns.find(c => c.id === log.campaignId && c.organizationId === orgId);
    if (campaign) {
      campaign.totalImpressions += 1;
      if (log.interacted) campaign.totalInteractions += 1;
      if (log.interactionType === 'qr_scan') campaign.totalScans += 1;
      campaign.budgetSpent += (campaign.cpm / 1000);
    }

    // Update device counters
    const device = this.memoryDb.devices.find(d => d.id === log.deviceId && d.organizationId === orgId);
    if (device) {
      device.totalImpressionsToday += 1;
      if (log.interacted) device.totalInteractionsToday += 1;
    }

    // Driver revenue split (45% BYOD, 20% comodato)
    if (campaign && device && device.driverId) {
      const driver = this.memoryDb.drivers.find(d => d.id === device.driverId && d.organizationId === orgId);
      if (driver) {
        const grossValue = (campaign.cpm / 1000);
        const splitPct = device.hardwareOwnership === 'driver_byod' ? 0.45 : 0.20;
        const driverCut = grossValue * splitPct;
        driver.totalEarningsMonth = Number((driver.totalEarningsMonth + driverCut).toFixed(2));
        driver.pendingBalance = Number((driver.pendingBalance + driverCut).toFixed(2));
      }
    }

    this.save();
    return true;
  }

  // --- PAIRING TOKENS ---
  public createPairingToken(token: PairingTokenRecord): void {
    this.memoryDb.pairingTokens = this.memoryDb.pairingTokens.filter(t => t.expiresAt > Date.now());
    this.memoryDb.pairingTokens.push(token);
    this.save();
  }

  public getPairingToken(token: string): PairingTokenRecord | undefined {
    return this.memoryDb.pairingTokens.find(t => t.token === token && !t.used && t.expiresAt > Date.now());
  }

  public markPairingTokenUsed(token: string): void {
    const record = this.memoryDb.pairingTokens.find(t => t.token === token);
    if (record) {
      record.used = true;
      this.save();
    }
  }

  // --- REMOTE COMMANDS ---
  public createRemoteCommand(cmd: RemoteCommandRecord): void {
    this.memoryDb.remoteCommands.unshift(cmd);
    this.save();
  }

  public getPendingCommands(deviceId: string, orgId?: string): RemoteCommandRecord[] {
    return this.memoryDb.remoteCommands.filter(
      c => c.deviceId === deviceId && (!orgId || c.organizationId === orgId) && c.status === 'PENDING'
    );
  }

  public acknowledgeCommand(commandId: string, orgId?: string): boolean {
    const cmd = this.memoryDb.remoteCommands.find(c => c.id === commandId && (!orgId || c.organizationId === orgId));
    if (cmd) {
      cmd.status = 'ACKNOWLEDGED';
      cmd.acknowledgedAt = new Date().toISOString();
      this.save();
      return true;
    }
    return false;
  }

  // --- AUDIT LOGS ---
  public logAudit(log: Omit<AuditLog, 'id' | 'createdAt'>): void {
    const record: AuditLog = {
      id: `audit_${Date.now()}_${fs.randomBytes(4).toString('hex')}`,
      createdAt: new Date().toISOString(),
      ...log,
    };
    this.memoryDb.auditLogs.unshift(record);
    if (this.memoryDb.auditLogs.length > 5000) {
      this.memoryDb.auditLogs.length = 5000;
    }
    this.save();
  }

  public getAuditLogs(orgId: string, limit: number = 100): AuditLog[] {
    return this.memoryDb.auditLogs
      .filter(a => a.organizationId === orgId)
      .slice(0, limit);
  }
}

export const storage = new VeloStorage();
