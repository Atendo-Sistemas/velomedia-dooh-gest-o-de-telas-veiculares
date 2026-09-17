import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const LoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const DriverSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  avatar: z.string().optional(),
  carPlate: z.string().min(7).max(10),
  carModel: z.string().min(2),
  carColor: z.string().min(2),
  serviceType: z.string().default('Uber/99'),
  phone: z.string().min(8),
  pixKey: z.string().min(4),
  pixKeyType: z.enum(['CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA']),
  totalRidesMonth: z.number().nonnegative().default(0),
  totalEarningsMonth: z.number().nonnegative().default(0),
  pendingBalance: z.number().nonnegative().default(0),
  monthlyEarnings: z.number().nonnegative().default(0),
  rating: z.number().min(1).max(5).default(5.0),
  screenUptimeRating: z.number().min(0).max(100).default(100),
  referralCode: z.string().optional(),
  workingCity: z.string().min(2),
  workingRegion: z.string().min(2),
  workingCenter: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  workingRadiusKm: z.number().positive().default(15),
  workingPoles: z.array(z.string()).default([]),
  organizationId: z.string().optional(),
});

export const TelemetrySchema = z.object({
  powerConnected: z.boolean().default(true),
  batteryLevel: z.number().min(0).max(100),
  batteryVoltage: z.number().positive().default(12.0),
  cpuTemp: z.number().default(40.0),
  signalStrength: z.string().default('4G'),
  signalDbm: z.number().default(-70),
  storageFreeGb: z.number().nonnegative().default(10),
  totalStorageGb: z.number().positive().default(32),
  currentFps: z.number().min(0).max(120).default(60),
  brightness: z.number().min(0).max(100).default(80),
  volume: z.number().min(0).max(100).default(50),
  appVersion: z.string().default('2.4.0'),
  lastHeartbeat: z.string(),
  kioskLocked: z.boolean().default(true),
  screenUptimeTodayHours: z.number().nonnegative().default(0),
  uptimeHours: z.number().nonnegative().default(0),
  screenBrightnessPct: z.number().min(0).max(100).default(80),
});

export const HardwareSpecsSchema = z.object({
  brand: z.string().default('Samsung'),
  tabletModel: z.string().default('Galaxy Tab A9+'),
  screenSizeInches: z.number().positive().default(11.0),
  resolution: z.string().default('1920x1200'),
  panelType: z.string().default('IPS LCD'),
  brightnessNits: z.number().positive().default(500),
  aspectRatio: z.string().default('16:10'),
  orientation: z.string().default('landscape'),
  osVersion: z.string().default('Android 14'),
  macAddress: z.string().default('02:00:00:00:00:01'),
  imei: z.string().default('000000000000001'),
  simCarrier: z.string().default('IoT M2M'),
  connectivity: z.string().default('4G_LTE'),
  mountType: z.string().default('Suporte de Encosto'),
  powerSupply: z.string().default('12V Pós-Chave'),
  storageGb: z.number().positive().default(64),
  ramGb: z.number().positive().default(4),
  refreshRateHz: z.number().positive().default(60),
});

export const DeviceSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  serialNumber: z.string().min(1),
  model: z.string().min(1),
  screenPosition: z.enum(['headrest_right', 'headrest_left', 'center_console', 'front_dash']),
  hardwareOwnership: z.enum(['company_owned', 'driver_byod']),
  status: z.enum(['online', 'offline', 'maintenance', 'retired']).default('offline'),
  driverId: z.string().optional(),
  driverName: z.string().default('Não Atribuído'),
  carPlate: z.string().default(''),
  carModel: z.string().default(''),
  offlineQueueCount: z.number().nonnegative().default(0),
  currentLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    speedKmH: z.number().min(0).max(300).default(0),
    heading: z.number().min(0).max(360).default(0),
    address: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),
  telemetry: TelemetrySchema,
  hardwareSpecs: HardwareSpecsSchema,
  totalImpressionsToday: z.number().nonnegative().default(0),
  totalInteractionsToday: z.number().nonnegative().default(0),
  organizationId: z.string().optional(),
});

export const DevicePairingRequestSchema = z.object({
  pairingCode: z.string().min(4).max(12),
  model: z.string().min(1),
  serialNumber: z.string().min(1),
  screenPosition: z.enum(['headrest_right', 'headrest_left', 'center_console', 'front_dash']).default('headrest_right'),
  hardwareOwnership: z.enum(['company_owned', 'driver_byod']).default('driver_byod'),
});

export const CampaignSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  name: z.string().min(1),
  advertiser: z.string().min(1),
  logo: z.string().default(''),
  category: z.string().default('general'),
  status: z.enum(['active', 'paused', 'scheduled', 'completed']).default('active'),
  priority: z.number().min(1).max(10).default(5),
  cpm: z.number().positive(),
  budgetTotal: z.number().positive(),
  budgetSpent: z.number().nonnegative().default(0),
  totalImpressions: z.number().nonnegative().default(0),
  totalInteractions: z.number().nonnegative().default(0),
  totalScans: z.number().nonnegative().default(0),
  targetImpressions: z.number().positive(),
  targetGeoFences: z.array(z.string()).default(['all']),
  creative: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    tagline: z.string().default(''),
    type: z.enum(['video', 'static_image', 'interactive_banner']),
    mediaUrl: z.string().min(1),
    ctaText: z.string().default(''),
    qrCodeUrl: z.string().default(''),
    audioEnabledByDefault: z.boolean().default(false),
    durationSeconds: z.number().positive().default(15),
  }),
  schedule: z.object({
    startDate: z.string(),
    endDate: z.string(),
    daysOfWeek: z.array(z.number()).default([0, 1, 2, 3, 4, 5, 6]),
    timeSlots: z.array(z.object({
      startHour: z.number().min(0).max(23),
      endHour: z.number().min(0).max(23),
    })).default([{ startHour: 6, endHour: 23 }]),
  }),
  organizationId: z.string().optional(),
});

export const GeoFenceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  city: z.string().min(1),
  description: z.string().default(''),
  center: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  radiusKm: z.number().positive(),
  color: z.string().default('#3b82f6'),
  organizationId: z.string().optional(),
});

/**
 * Proof of Play submission schema matching Section 6.1 requirements
 */
export const ProofOfPlaySubmissionSchema = z.object({
  eventId: z.string().min(1, 'eventId é obrigatório'),
  deviceId: z.string().min(1, 'deviceId é obrigatório'),
  campaignId: z.string().min(1, 'campaignId é obrigatório'),
  creativeId: z.string().optional(),
  campaignName: z.string().default(''),
  advertiser: z.string().default(''),
  startedAt: z.string().min(1, 'startedAt é obrigatório'),
  endedAt: z.string().min(1, 'endedAt é obrigatório'),
  durationMs: z.number().positive('durationMs deve ser positivo'),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    speedKmH: z.number().min(0).max(300).default(0),
    heading: z.number().min(0).max(360).default(0),
    accuracyMeters: z.number().nonnegative().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),
  interacted: z.boolean().default(false),
  interactionType: z.enum(['none', 'qr_scan', 'touch_interaction', 'lead_form', 'trivia_answer']).default('none'),
  nonce: z.string().min(8, 'nonce deve ter pelo menos 8 caracteres'),
  signature: z.string().min(16, 'signature criptográfica do dispositivo é obrigatória'),
});

export const TelemetryHeartbeatSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speedKmH: z.number().min(0).max(300).default(0),
  heading: z.number().min(0).max(360).default(0),
  batteryLevel: z.number().min(0).max(100),
  powerConnected: z.boolean(),
  signalStrength: z.string().default('4G'),
  cpuTemp: z.number().optional(),
  appVersion: z.string().default('2.4.0'),
  fps: z.number().optional(),
});

export const RemoteCommandSchema = z.object({
  deviceId: z.string().min(1),
  command: z.enum(['REBOOT_APP', 'FORCE_SYNC', 'SCREEN_ON', 'SCREEN_OFF', 'CLEAR_CACHE']),
});

export const WebhookEventSchema = z.object({
  eventId: z.string().min(1),
  provider: z.string().min(1),
  status: z.enum(['pending', 'paid', 'expired', 'cancelled', 'refunded']),
  payload: z.record(z.any()),
});

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'validation_error',
        message: 'Dados de entrada inválidos.',
        details: result.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
