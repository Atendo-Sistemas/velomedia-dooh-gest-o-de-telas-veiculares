import fs from 'node:fs';
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
}

export class VeloStorage {
  private dataFilePath: string;
  private memoryDb: DatabaseSchema;
  private isSaving: boolean = false;

  constructor(filePath?: string) {
    this.dataFilePath = filePath || path.join(process.cwd(), 'data', 'velomedia_store.json');
    this.memoryDb = this.loadInitial();
  }

  private loadInitial(): DatabaseSchema {
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[VeloStorage] Could not read existing store, creating fresh store with seed:', err);
    }

    return this.createSeedDatabase();
  }

  private createSeedDatabase(): DatabaseSchema {
    const defaultPassword = 'VeloAdmin2026!';
    const adminHash = hashPassword(defaultPassword);

    const initialOrgs: SaaSOrganization[] = [
      {
        id: 'org_sp_matriz',
        name: 'VeloMedia São Paulo (Matriz Operadora)',
        slug: 'sp-matriz',
        subdomain: 'sp.velomedia.com.br',
        cnpj: '48.912.304/0001-92',
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
          email: 'admin@velomedia.com.br',
          phone: '(11) 98123-4567',
        },
        billingEmail: 'financeiro@velomedia.com.br',
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
        subdomain: 'rio.velomedia.com.br',
        cnpj: '39.812.901/0001-44',
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
          email: 'operacoes@cariocadooh.com.br',
          phone: '(21) 99876-5432',
        },
        billingEmail: 'financeiro@cariocadooh.com.br',
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
        phone: '(11) 98123-4567',
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
        name: 'Lucas Ferreira',
        email: 'operador@velomedia.com.br',
        phone: '(11) 98765-1122',
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
        name: 'Marcos Vinicius Ribeiro',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        carPlate: 'BRA-2E19',
        carModel: 'Toyota Corolla Hybrid 2024',
        carColor: 'Preto',
        serviceType: 'Uber Black',
        phone: '(11) 98765-4321',
        pixKey: 'marcos.ribeiro.pix@banco.com.br',
        pixKeyType: 'EMAIL',
        totalRidesMonth: 285,
        totalEarningsMonth: 1450.8,
        pendingBalance: 320.5,
        monthlyEarnings: 1450.8,
        rating: 4.96,
        screenUptimeRating: 98.4,
        referralCode: 'MARCOS-VELO',
        workingCity: 'São Paulo',
        workingRegion: 'Centro Expandido e Av. Paulista',
        workingCenter: { lat: -23.561684, lng: -46.655981 },
        workingRadiusKm: 15,
        workingPoles: ['pole_sp_paulista', 'pole_sp_itaim'],
        organizationId: 'org_sp_matriz',
      },
      {
        id: 'drv_02',
        name: 'Rodrigo Mendonça Santos',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        carPlate: 'RIO-9F31',
        carModel: 'BYD Dolphin EV 2024',
        carColor: 'Branco',
        serviceType: 'Uber Comfort',
        phone: '(11) 97654-3210',
        pixKey: '11976543210',
        pixKeyType: 'TELEFONE',
        totalRidesMonth: 210,
        totalEarningsMonth: 980.2,
        pendingBalance: 190.0,
        monthlyEarnings: 980.2,
        rating: 4.92,
        screenUptimeRating: 96.8,
        referralCode: 'RODRIGO-VELO',
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
        driverName: 'Marcos Vinicius Ribeiro',
        carPlate: 'BRA-2E19',
        carModel: 'Toyota Corolla Hybrid 2024',
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
          macAddress: '74:D0:2B:9F:8A:12',
          imei: '864920058291048',
          simCarrier: 'Claro Empresas M2M IoT',
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

    const initialCampaigns: Campaign[] = [
      {
        id: 'camp_01',
        title: 'Nubank Ultravioleta - Alta Renda',
        name: 'Nubank Ultravioleta - Alta Renda',
        advertiser: 'Nubank Brasil',
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
          title: 'Nubank Ultravioleta',
          tagline: 'O cartão de crédito para quem valoriza seu tempo',
          type: 'video',
          mediaUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1280&q=80',
          ctaText: 'Solicitar Cartão',
          qrCodeUrl: 'https://nubank.com.br/ultravioleta',
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
        title: 'Fasano Hotel & Gastronomia - Jardins',
        name: 'Fasano Hotel & Gastronomia - Jardins',
        advertiser: 'Grupo Fasano',
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
          title: 'Fasano Gastronomia',
          tagline: 'Experiência gastronômica inesquecível nos Jardins',
          type: 'interactive_banner',
          mediaUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1280&q=80',
          ctaText: 'Reservar Mesa',
          qrCodeUrl: 'https://fasano.com.br/reservas',
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
        pixQrCode: '00020126580014br.gov.bcb.pix0136velomedia-pix-key-sample52040000530398654075490.005802BR5918VELOMEDIA DOOH SA6009SAO PAULO62070503***6304ABCD',
        pixQrCodeUrl: '00020126580014br.gov.bcb.pix0136velomedia-pix-key-sample52040000530398654075490.005802BR5918VELOMEDIA DOOH SA6009SAO PAULO62070503***6304ABCD',
      },
    ];

    const initialAdvertisers: AdvertiserAccount[] = [
      {
        id: 'adv_nubank',
        name: 'Nubank Brasil',
        companyName: 'Nu Pagamentos S.A.',
        tradeName: 'Nubank',
        cnpj: '18.236.120/0001-58',
        category: 'tech_finance',
        contactName: 'Fernanda Lima',
        email: 'marketing@nubank.com.br',
        phone: '(11) 3003-8888',
        billingAddress: 'Rua Capote Valente, 39 - Pinheiros',
        city: 'São Paulo',
        state: 'SP',
        paymentTerms: 'monthly_retainer',
        creditLimit: 50000,
        currentBalance: 16549.5,
        balance: 16549.5,
        status: 'active',
        activeCampaignsCount: 1,
        totalSpent: 8450.5,
        portalAccessCode: 'NU2026',
        createdAt: '2025-01-20T10:00:00Z',
        organizationId: 'org_sp_matriz',
      },
      {
        id: 'adv_fasano',
        name: 'Grupo Fasano',
        companyName: 'Hotelaria e Gastronomia Fasano Ltda',
        tradeName: 'Fasano Jardins',
        cnpj: '03.882.102/0001-30',
        category: 'food_beverage',
        contactName: 'Rogerio Fasano',
        email: 'contato@fasano.com.br',
        phone: '(11) 3896-4000',
        billingAddress: 'Rua Vittorio Fasano, 88 - Cerqueira César',
        city: 'São Paulo',
        state: 'SP',
        paymentTerms: 'prepaid',
        creditLimit: 20000,
        currentBalance: 9880.0,
        balance: 9880.0,
        status: 'active',
        activeCampaignsCount: 1,
        totalSpent: 5120.0,
        portalAccessCode: 'FASANO2026',
        createdAt: '2025-02-15T14:00:00Z',
        organizationId: 'org_sp_matriz',
      },
    ];

    const schema: DatabaseSchema = {
      version: 1,
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
    };

    this.saveImmediate(schema);
    return schema;
  }

  private save(): void {
    if (this.isSaving) return;
    this.isSaving = true;
    setTimeout(() => {
      try {
        const dir = path.dirname(this.dataFilePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const tempPath = `${this.dataFilePath}.tmp`;
        fs.writeFileSync(tempPath, JSON.stringify(this.memoryDb, null, 2), 'utf-8');
        fs.renameSync(tempPath, this.dataFilePath);
      } catch (err) {
        console.error('[VeloStorage] Save error:', err);
      } finally {
        this.isSaving = false;
      }
    }, 50);
  }

  private saveImmediate(schema: DatabaseSchema): void {
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dataFilePath, JSON.stringify(schema, null, 2), 'utf-8');
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

  public getUserById(id: string): SaaSUser | undefined {
    const user = this.memoryDb.users.find(u => u.id === id);
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

  public deleteUser(id: string): boolean {
    const before = this.memoryDb.users.length;
    this.memoryDb.users = this.memoryDb.users.filter(u => u.id !== id);
    if (this.memoryDb.users.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // --- SESSIONS ---
  public createSession(session: SessionRecord): void {
    // Purge expired sessions
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

  public deleteSession(token: string): void {
    this.memoryDb.sessions = this.memoryDb.sessions.filter(s => s.token !== token);
    this.save();
  }

  // --- DRIVERS ---
  public getDrivers(orgId?: string): Driver[] {
    return this.memoryDb.drivers.filter(d => !orgId || d.organizationId === orgId);
  }

  public getDriverById(id: string): Driver | undefined {
    return this.memoryDb.drivers.find(d => d.id === id);
  }

  public saveDriver(driver: Driver): void {
    const idx = this.memoryDb.drivers.findIndex(d => d.id === driver.id);
    if (idx >= 0) {
      this.memoryDb.drivers[idx] = driver;
    } else {
      this.memoryDb.drivers.unshift(driver);
    }
    this.save();
  }

  public deleteDriver(id: string): boolean {
    const before = this.memoryDb.drivers.length;
    this.memoryDb.drivers = this.memoryDb.drivers.filter(d => d.id !== id);
    if (this.memoryDb.drivers.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // --- DEVICES ---
  public getDevices(orgId?: string): Device[] {
    return this.memoryDb.devices.filter(d => !orgId || d.organizationId === orgId);
  }

  public getDeviceById(id: string): Device | undefined {
    return this.memoryDb.devices.find(d => d.id === id || d.code === id);
  }

  public saveDevice(dev: Device): void {
    const idx = this.memoryDb.devices.findIndex(d => d.id === dev.id);
    if (idx >= 0) {
      this.memoryDb.devices[idx] = dev;
    } else {
      this.memoryDb.devices.unshift(dev);
    }
    this.save();
  }

  public deleteDevice(id: string): boolean {
    const before = this.memoryDb.devices.length;
    this.memoryDb.devices = this.memoryDb.devices.filter(d => d.id !== id);
    if (this.memoryDb.devices.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // --- CAMPAIGNS ---
  public getCampaigns(orgId?: string): Campaign[] {
    return this.memoryDb.campaigns.filter(c => !orgId || c.organizationId === orgId);
  }

  public getCampaignById(id: string): Campaign | undefined {
    return this.memoryDb.campaigns.find(c => c.id === id);
  }

  public saveCampaign(campaign: Campaign): void {
    const idx = this.memoryDb.campaigns.findIndex(c => c.id === campaign.id);
    if (idx >= 0) {
      this.memoryDb.campaigns[idx] = campaign;
    } else {
      this.memoryDb.campaigns.unshift(campaign);
    }
    this.save();
  }

  public deleteCampaign(id: string): boolean {
    const before = this.memoryDb.campaigns.length;
    this.memoryDb.campaigns = this.memoryDb.campaigns.filter(c => c.id !== id);
    if (this.memoryDb.campaigns.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // --- GEOFENCES ---
  public getGeoFences(orgId?: string): GeoFence[] {
    return this.memoryDb.geofences.filter(g => !orgId || g.organizationId === orgId);
  }

  public saveGeoFence(geofence: GeoFence): void {
    const idx = this.memoryDb.geofences.findIndex(g => g.id === geofence.id);
    if (idx >= 0) {
      this.memoryDb.geofences[idx] = geofence;
    } else {
      this.memoryDb.geofences.unshift(geofence);
    }
    this.save();
  }

  public deleteGeoFence(id: string): boolean {
    const before = this.memoryDb.geofences.length;
    this.memoryDb.geofences = this.memoryDb.geofences.filter(g => g.id !== id);
    if (this.memoryDb.geofences.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // --- ADVERTISERS ---
  public getAdvertisers(orgId?: string): AdvertiserAccount[] {
    return this.memoryDb.advertisers.filter(a => !orgId || a.organizationId === orgId);
  }

  public saveAdvertiser(adv: AdvertiserAccount): void {
    const idx = this.memoryDb.advertisers.findIndex(a => a.id === adv.id);
    if (idx >= 0) {
      this.memoryDb.advertisers[idx] = adv;
    } else {
      this.memoryDb.advertisers.unshift(adv);
    }
    this.save();
  }

  public deleteAdvertiser(id: string): boolean {
    const before = this.memoryDb.advertisers.length;
    this.memoryDb.advertisers = this.memoryDb.advertisers.filter(a => a.id !== id);
    if (this.memoryDb.advertisers.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  // --- INVOICES ---
  public getInvoices(orgId?: string): SaaSInvoice[] {
    return this.memoryDb.invoices.filter(i => !orgId || i.organizationId === orgId);
  }

  public saveInvoice(invoice: SaaSInvoice): void {
    const idx = this.memoryDb.invoices.findIndex(i => i.id === invoice.id);
    if (idx >= 0) {
      this.memoryDb.invoices[idx] = invoice;
    } else {
      this.memoryDb.invoices.unshift(invoice);
    }
    this.save();
  }

  // --- PROOF OF PLAY LOGS ---
  public getProofOfPlayLogs(orgId?: string, limit: number = 100): ProofOfPlayLog[] {
    return this.memoryDb.proofOfPlayLogs
      .filter(l => !orgId || l.organizationId === orgId)
      .slice(0, limit);
  }

  public recordProofOfPlay(log: ProofOfPlayLog): boolean {
    // Check duplicate by eventId
    if (this.memoryDb.proofOfPlayLogs.some(l => l.id === log.id)) {
      return false; // Idempotent discard
    }

    this.memoryDb.proofOfPlayLogs.unshift(log);
    // Cap memory list at 10,000 logs
    if (this.memoryDb.proofOfPlayLogs.length > 10000) {
      this.memoryDb.proofOfPlayLogs.length = 10000;
    }

    // Update campaign counters in storage
    const campaign = this.memoryDb.campaigns.find(c => c.id === log.campaignId);
    if (campaign) {
      campaign.totalImpressions += 1;
      if (log.interacted) campaign.totalInteractions += 1;
      if (log.interactionType === 'qr_scan') campaign.totalScans += 1;
      campaign.budgetSpent += (campaign.cpm / 1000);
    }

    // Update device counters
    const device = this.memoryDb.devices.find(d => d.id === log.deviceId);
    if (device) {
      device.totalImpressionsToday += 1;
      if (log.interacted) device.totalInteractionsToday += 1;
    }

    // Driver revenue split (45% BYOD, 20% comodato)
    if (campaign && device && device.driverId) {
      const driver = this.memoryDb.drivers.find(d => d.id === device.driverId);
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

  public getPendingCommands(deviceId: string): RemoteCommandRecord[] {
    return this.memoryDb.remoteCommands.filter(c => c.deviceId === deviceId && c.status === 'PENDING');
  }

  public acknowledgeCommand(commandId: string): void {
    const cmd = this.memoryDb.remoteCommands.find(c => c.id === commandId);
    if (cmd) {
      cmd.status = 'ACKNOWLEDGED';
      cmd.acknowledgedAt = new Date().toISOString();
      this.save();
    }
  }

  // --- AUDIT LOGS ---
  public logAudit(log: Omit<AuditLog, 'id' | 'createdAt'>): void {
    const record: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...log,
    };
    this.memoryDb.auditLogs.unshift(record);
    if (this.memoryDb.auditLogs.length > 5000) {
      this.memoryDb.auditLogs.length = 5000;
    }
    this.save();
  }

  public getAuditLogs(orgId?: string, limit: number = 100): AuditLog[] {
    return this.memoryDb.auditLogs
      .filter(a => !orgId || a.organizationId === orgId)
      .slice(0, limit);
  }
}

export const storage = new VeloStorage();
