export type DeviceStatus = 'online' | 'standby' | 'offline' | 'maintenance';
export type ScreenPosition = 'headrest_left' | 'headrest_right' | 'center_console' | 'dashboard';
export type CreativeType = 'video' | 'interactive_banner' | 'qr_coupon' | 'mini_survey';
export type CampaignCategory = 'food_beverage' | 'tech_finance' | 'retail' | 'automotive' | 'entertainment' | 'health';
export type SaaSPlanTier = 'starter' | 'pro_fleet' | 'enterprise_network';

export interface SaaSPlan {
  id: SaaSPlanTier;
  name: string;
  pricePerScreenMonth: number;
  baseMonthlyFee: number;
  maxScreens: number;
  maxCampaigns: number;
  features: string[];
  recommended?: boolean;
}

export interface SaaSOrganization {
  id: string;
  name: string;
  slug: string;
  cnpj: string;
  city: string;
  state: string;
  planTier: SaaSPlanTier;
  // Resource quotas & limits
  activeScreensCount: number;
  maxScreensLimit: number;
  activeCampaignsCount: number;
  maxCampaignsLimit: number;
  activeDriversCount: number;
  maxDriversLimit: number;
  // Contact & Admin
  adminUser: {
    name: string;
    email: string;
    phone: string;
  };
  billingEmail: string;
  billingCycle: 'monthly' | 'annual';
  nextBillingDate: string;
  monthlySoftwareCost: number;
  estimatedGrossAdRevenue: number;
  driverPayoutTotal: number;
  netProfit: number;
  status: 'active' | 'trial' | 'past_due' | 'suspended';
  customDomain?: string;
  mapboxConfig?: {
    customToken?: string;
    styleUrl?: string;
    centerLat: number;
    centerLng: number;
    defaultZoom: number;
  };
}

export interface SaaSInvoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  screensBilled: number;
  paymentMethod: 'pix' | 'credit_card' | 'bank_slip';
  pixQrCodeUrl?: string;
  pdfDownloadUrl?: string;
}

export interface AdvertiserClientPortal {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  activeCampaignsCount: number;
  totalBudgetManaged: number;
  totalImpressionsDelivered: number;
  portalAccessCode: string;
  status: 'active' | 'pending_approval';
}

export interface GeographicPole {
  id: string;
  name: string;
  category: 'airport' | 'financial' | 'shopping' | 'hospital' | 'convention' | 'nightlife' | 'hotel' | 'transit' | 'university' | 'urban_hub';
  city: string;
  state: string;
  lat: number;
  lng: number;
  address: string;
  dailyEstimatedFootfall: number; // e.g. 85000
  recommendedAudience?: string;
  description?: string;
}

export interface DriverWorkAreaConfig {
  driverId: string;
  workingCity: string;
  workingRegion: string;
  workingCenter: { lat: number; lng: number };
  workingRadiusKm: number;
  workingPoles: string[];
}

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  neighborhood: string;
  city: string;
}

export interface GeoFence {
  id: string;
  name: string;
  city: string;
  center: { lat: number; lng: number };
  radiusKm: number; // radius in km
  color: string;
  description: string;
}

export interface DeviceTelemetry {
  powerConnected: boolean;
  batteryLevel: number; // 0-100%
  batteryVoltage: number; // e.g. 12.4V
  cpuTemp: number; // °C
  signalStrength: '5G' | '4G_EXCELLENT' | '4G_GOOD' | '3G' | 'OFFLINE';
  signalDbm: number;
  storageFreeGb: number;
  totalStorageGb: number;
  currentFps: number;
  brightness: number; // 0-100
  volume: number; // 0-100
  appVersion: string;
  lastHeartbeat: string;
  kioskLocked: boolean;
  screenUptimeTodayHours: number;
}

export type DeviceHardwareOwnership = 'company_owned' | 'driver_byod';

export interface DriverReferral {
  id: string;
  referrerDriverId: string; // Quem indicou
  referredDriverId: string; // Quem foi indicado
  referredDriverName: string;
  referredCarPlate: string;
  referredServiceType: string;
  referredAvatar: string;
  joinDate: string;
  status: 'active' | 'in_review' | 'inactive';
  currentMonthUptime: number; // e.g. 98.5%
  monthlyRecurringBonus: number; // e.g. R$ 50.00 fixo ou %
  totalBonusEarned: number; // total acumulado gerado para o padrinho
  lastPayoutDate: string;
}

export interface Driver {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  rating: number;
  carModel: string;
  carPlate: string;
  carColor: string;
  serviceType: 'Uber Black' | 'Uber Comfort' | 'UberX' | 'Taxi Especial' | '99 Pop';
  pixKey: string;
  totalRidesMonth: number;
  screenUptimeRating: number; // 0-100%
  monthlyEarnings: number;
  referralCode: string; // e.g. "CARLOS-VELO"
  referredByDriverId?: string; // ID de quem indicou este motorista
  referralsCount?: number; // total de motoristas ativos indicados
  referralRecurringBonusMonthly?: number; // valor mensal recorrente ganho por indicações (R$)
  referralTotalEarnedLifetime?: number; // total acumulado recebido de indicações
  contractType?: 'company_equipment' | 'byod_driver_equipment'; // Modalidade de contratação
  revenueSharePercent?: number; // e.g. 20% para frota própria vs 45% para BYOD
  deviceModelOwned?: string; // ex: "Samsung Galaxy Tab A9+ (Do Motorista)"
  // Geolocation & Work Area Configuration
  workingCity?: string;
  workingRegion?: string;
  workingCenter?: { lat: number; lng: number };
  workingRadiusKm?: number;
  workingPoles?: string[];
}

export interface DeviceHardwareSpecs {
  screenSizeInches: number; // e.g. 10.1, 11.0, 12.4, 13.3, 14.0
  resolution: string; // e.g. "1920x1200 FHD+ IPS" | "1920x1080 Full HD" | "1280x800 WXGA" | "2000x1200 2K"
  panelType: string; // e.g. "IPS Capacitivo 10 Pontos Anti-Reflexo" | "OLED Touch" | "TFT LCD High-Bright"
  brightnessNits: number; // e.g. 450, 500, 600, 700, 800 cd/m²
  aspectRatio: string; // e.g. "16:10", "16:9", "4:3"
  orientation: 'landscape' | 'portrait';
  osVersion: string; // e.g. "Android 14 (One UI 6.0)" | "Android 13 Go Enterprise" | "Velo Kiosk OS (Linux DOOH)"
  brand: string; // e.g. "Samsung", "Lenovo", "Xiaomi", "Multilaser", "VeloDOOH Pro", "Positivo"
  tabletModel: string; // e.g. "Galaxy Tab A9+ 11\" 4G", "Tab M10 Plus 3rd Gen", "Pad 6 Pro"
  macAddress: string; // e.g. "74:D0:2B:9F:8A:12"
  imeiOrIccid?: string; // e.g. "864920058291048" (IMEI ou chip ICCID)
  imei?: string;
  connectivity: '5G_M2M' | '4G_LTE_M2M' | 'WIFI_HOTSPOT' | 'MULTI_OPERATOR_SIM' | 'ETHERNET';
  simCarrier?: string; // e.g. "Claro M2M IoT", "Vivo Empresas IoT", "TIM Multi-Carrier", "Wi-Fi do Carro"
  mountType: string; // e.g. "Suporte de Encosto em Alumínio c/ Chave Antifurto", "Trava de Cabeceira de Aço", "Suporte Painel Veicular"
  powerSupply: string; // e.g. "12V Pós-Chave c/ Conversor Step-Down 5V/3A & Fusível", "USB-C 30W Power Delivery", "Isqueiro 12V Automotivo"
  internalStorageGb?: number; // e.g. 32, 64, 128
  storageGb?: number;
  ramGb: number; // e.g. 3, 4, 6, 8
  refreshRateHz?: number;
  audioOutput?: string; // e.g. "Alto-falantes Estéreo + Transmissor FM", "Bluetooth 5.2", "Auxiliar P2"
}

export interface Device {
  id: string;
  code: string; // e.g. "TV-SP-0192"
  serialNumber: string;
  model: string; // e.g. "VeloTab 10.1 IPS Kiosk Pro"
  hardwareOwnership?: DeviceHardwareOwnership; // 'company_owned' | 'driver_byod'
  hardwareSpecs?: DeviceHardwareSpecs; // Especificações técnicas reais do monitor/tablet
  screenPosition: ScreenPosition;
  status: DeviceStatus;
  driverId: string;
  driverName: string;
  carPlate: string;
  carModel: string;
  currentLocation: GeoLocation;
  telemetry: DeviceTelemetry;
  activeCampaignId?: string;
  offlineQueueCount: number;
  totalImpressionsToday: number;
  totalInteractionsToday: number;
}

export interface CampaignCreative {
  id: string;
  title: string;
  tagline: string;
  type: CreativeType;
  mediaUrl: string; // Image or mock video poster
  badgeText?: string;
  ctaText: string;
  qrCodeUrl?: string;
  couponCode?: string;
  discountPercentage?: string;
  fullInfoHtml?: string;
  audioEnabledByDefault: boolean;
  durationSeconds: number;
  interactiveOptions?: string[];
}

export interface CampaignSchedule {
  startDate: string;
  endDate: string;
  daysOfWeek: number[]; // 0 = Sun, 1 = Mon ... 6 = Sat
  timeSlots: { startHour: number; endHour: number }[]; // e.g. [{ startHour: 18, endHour: 23 }]
  weatherTriggers?: ('rain' | 'sun' | 'cold' | 'hot' | 'any')[];
  minPassengerCount?: number;
  serviceTypeFilter?: string[];
}

export interface Campaign {
  id: string;
  name: string;
  advertiser: string;
  logo: string;
  category: CampaignCategory;
  budgetTotal: number;
  budgetSpent: number;
  cpm: number;
  status: 'active' | 'scheduled' | 'paused' | 'completed';
  creative: CampaignCreative;
  targetGeoFences: string[]; // GeoFence IDs or 'all'
  schedule: CampaignSchedule;
  totalImpressions: number;
  totalInteractions: number;
  totalScans: number;
  targetImpressions: number;
  priority: number; // 1-10
}

export interface ProofOfPlayLog {
  id: string;
  timestamp: string;
  deviceId: string;
  campaignId: string;
  campaignName: string;
  advertiser: string;
  durationWatchedSec: number;
  location: GeoLocation;
  interacted: boolean;
  interactionType?: 'qr_scan' | 'card_tap' | 'info_modal' | 'like';
  verifiedHash: string;
  syncedOnline: boolean;
}

export interface PassengerTrivia {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CityNewsItem {
  id: string;
  title: string;
  source: string;
  category: string;
  timeAgo: string;
}

export type SystemUserRole = 'admin_franchise' | 'driver' | 'advertiser' | 'passenger';

export interface DriverPayoutRecord {
  id: string;
  driverId: string;
  date: string;
  amount: number;
  type: 'ad_revenue_share' | 'referral_bonus' | 'instant_pix';
  status: 'paid' | 'processing' | 'scheduled';
  pixKey: string;
  transactionCode: string;
  description: string;
}

export interface AdvertiserBillingRecord {
  id: string;
  advertiserId: string;
  date: string;
  amount: number;
  campaignName: string;
  method: 'pix' | 'credit_card' | 'invoice';
  status: 'paid' | 'pending';
  invoiceUrl?: string;
  receiptNumber: string;
}

export type SaaSUserRole = 'super_admin' | 'fleet_manager' | 'financial_auditor' | 'ad_reviewer' | 'support_tech';

export interface SaaSUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: SaaSUserRole;
  organizationId: string;
  organizationName: string;
  status: 'active' | 'pending' | 'suspended';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  permissions: string[];
}

export interface AdvertiserAccount {
  id: string;
  companyName: string;
  tradeName: string; // Nome Fantasia
  cnpj: string;
  category: CampaignCategory;
  contactName: string;
  email: string;
  phone: string;
  billingAddress: string;
  city: string;
  state: string;
  paymentTerms: 'prepaid' | 'postpaid_30d' | 'monthly_retainer';
  creditLimit: number;
  currentBalance: number;
  status: 'active' | 'pending_verification' | 'blocked';
  activeCampaignsCount: number;
  totalSpent: number;
  portalAccessCode: string;
  createdAt: string;
}

export type RegistrationEntityTab = 'drivers' | 'devices' | 'advertisers' | 'users' | 'franchises';
