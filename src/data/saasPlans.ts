import { SaaSPlan } from '../types';

export const SAAS_PLANS: SaaSPlan[] = [
  {
    id: 'starter',
    name: 'Starter DOOH',
    pricePerScreenMonth: 49.00,
    baseMonthlyFee: 149.00,
    maxScreens: 5,
    maxCampaigns: 10,
    features: [
      'Até 5 Telas Veiculares',
      'Geofencing em Tempo Real (Raio GPS)',
      'Player Kiosk Android / PWA',
      'Auditoria PoP com Hash SHA-256',
      'Suporte via Chat / WhatsApp',
    ],
  },
  {
    id: 'pro_fleet',
    name: 'Pro Fleet Network',
    pricePerScreenMonth: 39.00,
    baseMonthlyFee: 299.00,
    maxScreens: 30,
    maxCampaigns: 50,
    features: [
      'Até 30 Telas Veiculares',
      'Geofencing Ilimitado por Bairros & Polígonos',
      'Portal White-Label para Anunciantes',
      'Repasse Automático PIX para Motoristas',
      'SLA de 99.9% com Cache Offline Garantido',
      'Painel de Controle Multi-Usuário',
    ],
    recommended: true,
  },
  {
    id: 'enterprise_network',
    name: 'Enterprise Franchise',
    pricePerScreenMonth: 29.00,
    baseMonthlyFee: 799.00,
    maxScreens: 500,
    maxCampaigns: 500,
    features: [
      'Telas Ilimitadas (Escalabilidade Nacional)',
      'Domínio Próprio & Custom Branding',
      'API REST / Webhooks para Integração com DSP/SSPs',
      'Gestão Multi-Franquia / Multi-Tenant',
      'Gerente de Contas Dedicado 24/7',
      'Treinamento & Homologação de Hardware',
    ],
  },
];
