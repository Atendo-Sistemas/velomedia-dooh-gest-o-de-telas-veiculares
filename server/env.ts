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
  const missing: string[] = [];
  const errors: string[] = [];

  if (env.NODE_ENV === 'production') {
    const requiredVars = [
      'WEBHOOK_SECRET',
      'CORS_ALLOWED_ORIGINS',
      'DATABASE_URL',
      'INITIAL_ADMIN_EMAIL',
      'INITIAL_ADMIN_PASSWORD',
    ];

    for (const v of requiredVars) {
      const val = env[v];
      if (!val || val.trim().length === 0) {
        missing.push(v);
        errors.push(`Variável obrigatória de produção '${v}' ausente ou vazia.`);
      }
    }

    if (env.BYPASS_ENV_CHECK === 'true') {
      errors.push('BYPASS_ENV_CHECK é proibido em ambiente de produção.');
    }

    if (env.PIX_GATEWAY_PROVIDER === 'asaas') {
      for (const name of ['ASAAS_API_KEY', 'ASAAS_WEBHOOK_TOKEN']) {
        if (!env[name]?.trim()) {
          missing.push(name);
          errors.push(`Variável obrigatória para Asaas '${name}' ausente ou vazia.`);
        }
      }
      if (env.ASAAS_ENVIRONMENT && !['sandbox', 'production'].includes(env.ASAAS_ENVIRONMENT)) {
        errors.push('ASAAS_ENVIRONMENT deve ser sandbox ou production.');
      }
      if (env.ASAAS_WEBHOOK_TOKEN && (env.ASAAS_WEBHOOK_TOKEN.length < 32 || env.ASAAS_WEBHOOK_TOKEN.length > 255 || /\s/.test(env.ASAAS_WEBHOOK_TOKEN))) {
        errors.push('ASAAS_WEBHOOK_TOKEN deve ter entre 32 e 255 caracteres e não conter espaços.');
      }
    }

    const webhookSecret = env.WEBHOOK_SECRET?.trim();
    if (webhookSecret && webhookSecret.length < 32) {
      errors.push('WEBHOOK_SECRET deve conter no mínimo 32 caracteres.');
    }

    const adminPassword = env.INITIAL_ADMIN_PASSWORD;
    if (adminPassword && adminPassword.length < 16) {
      errors.push('INITIAL_ADMIN_PASSWORD deve conter no mínimo 16 caracteres.');
    }

    const adminEmail = env.INITIAL_ADMIN_EMAIL?.trim();
    if (adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      errors.push('INITIAL_ADMIN_EMAIL deve ser um endereço de e-mail válido.');
    }

    const databaseUrl = env.DATABASE_URL?.trim();
    if (databaseUrl) {
      try {
        const parsed = new URL(databaseUrl);
        if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !parsed.hostname || !parsed.pathname || parsed.pathname === '/') {
          errors.push('DATABASE_URL deve ser uma URL PostgreSQL com host e database configurados.');
        }
      } catch {
        errors.push('DATABASE_URL deve ser uma URL PostgreSQL válida.');
      }
    }
    if (env.PG_POOL_MAX && (!/^\d+$/.test(env.PG_POOL_MAX) || Number(env.PG_POOL_MAX) < 1 || Number(env.PG_POOL_MAX) > 100)) {
      errors.push('PG_POOL_MAX deve ser um inteiro entre 1 e 100.');
    }
    if (env.PGSSL && !['true', 'false'].includes(env.PGSSL.toLowerCase())) {
      errors.push('PGSSL deve ser true ou false.');
    }

    const host = env.HOST?.trim();
    const dockerInternalBind = host === '0.0.0.0' && env.DOCKERIZED === 'true';
    if (host && !['127.0.0.1', '::1', 'localhost'].includes(host) && !dockerInternalBind) {
      errors.push('HOST deve ser localhost ou um endereço de loopback em produção.');
    }

    const origins = (env.CORS_ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean);
    if (origins.includes('*')) {
      errors.push('CORS_ALLOWED_ORIGINS não pode conter o curinga "*".');
    }
    for (const origin of origins) {
      try {
        const parsed = new URL(origin);
        if (parsed.protocol !== 'https:' || parsed.origin !== origin) {
          errors.push(`Origem CORS inválida para produção: '${origin}'. Use uma origem HTTPS sem caminho.`);
        }
      } catch {
        errors.push(`Origem CORS inválida para produção: '${origin}'.`);
      }
    }

    if (env.PORT && (!/^\d+$/.test(env.PORT) || Number(env.PORT) < 1 || Number(env.PORT) > 65535)) {
      errors.push('PORT deve ser um número entre 1 e 65535.');
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
