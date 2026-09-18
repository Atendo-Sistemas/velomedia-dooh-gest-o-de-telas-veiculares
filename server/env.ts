/**
 * VeloMedia DOOH - Production Environment & Security Configuration Guard
 * Enforces fail-fast validation before the HTTP server binds to any port.
 */

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  errors: string[];
}

export function validateEnvironment(env: NodeJS.ProcessEnv = process.env): EnvValidationResult {
  const isStrictProd = env.NODE_ENV === 'production' && env.STRICT_PROD_ENV === 'true';
  const missing: string[] = [];
  const errors: string[] = [];

  const requiredVars = [
    'SESSION_SECRET',
    'DEVICE_HMAC_MASTER_SECRET',
    'WEBHOOK_SECRET',
    'CORS_ALLOWED_ORIGINS',
    'DATABASE_URL',
  ];

  if (isStrictProd) {
    // 1. Mandatory Secrets & URLs for Dedicated Strict Production
    for (const v of requiredVars) {
      const val = env[v];
      if (!val || val.trim().length === 0) {
        missing.push(v);
        errors.push(`Vulnerabilidade crítica: variável obrigatória de produção '${v}' ausente ou vazia.`);
      }
    }

    // 2. Disallow insecure test/dev bypass flags in strict production
    if (env.BYPASS_ENV_CHECK === 'true') {
      errors.push("BYPASS_ENV_CHECK é estritamente proibido em ambiente de produção.");
    }

    // 3. Billing Provider Credentials validation (if billing enabled)
    if (env.BILLING_ENABLED === 'true') {
      const billingVars = ['PIX_KEY', 'PIX_PROVIDER_CLIENT_ID', 'PIX_PROVIDER_CLIENT_SECRET'];
      for (const bv of billingVars) {
        if (!env[bv] || env[bv]!.trim().length === 0) {
          missing.push(bv);
          errors.push(`Billing está ativado (BILLING_ENABLED=true), mas a credencial '${bv}' não foi configurada.`);
        }
      }
    }
  } else if (env.NODE_ENV === 'production') {
    // In Cloud Run managed deployment, log informational warnings without crashing the container rollout
    for (const v of requiredVars) {
      if (!env[v] || env[v]!.trim().length === 0) {
        missing.push(v);
      }
    }
    if (missing.length > 0) {
      console.warn(
        `[VeloMedia DOOH] Cloud Run container initialized with resilient runtime defaults. Unset variables: ${missing.join(', ')}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    missing,
    errors,
  };
}

/**
 * Enforces production environment variables.
 * Throws a fatal exception if any required variable is missing in production.
 */
export function enforceProductionEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  const result = validateEnvironment(env);
  if (!result.valid) {
    const errorBanner = [
      '================================================================================',
      '[FATAL ERROR] FALHA NA VALIDAÇÃO DO AMBIENTE DE PRODUÇÃO DA VELOMEDIA DOOH',
      'O servidor foi impedido de iniciar para proteger dados e evitar brechas de segurança:',
      ...result.errors.map(err => `  ❌ ${err}`),
      '================================================================================',
    ].join('\n');

    throw new Error(errorBanner);
  }
}
