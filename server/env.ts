/**
 * VeloMedia DOOH - Production Environment & Security Configuration Guard
 * Enforces fail-fast validation before the HTTP server binds to any port.
 */

import path from 'node:path';

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
      'DATA_FILE_PATH',
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

    const dataFilePath = env.DATA_FILE_PATH?.trim();
    if (dataFilePath && !path.isAbsolute(dataFilePath)) {
      errors.push('DATA_FILE_PATH deve ser um caminho absoluto em armazenamento persistente.');
    } else if (dataFilePath) {
      const relativePath = path.relative('/var/lib/velomedia', path.resolve(dataFilePath));
      if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
        errors.push('DATA_FILE_PATH deve apontar para um arquivo dentro de /var/lib/velomedia.');
      }
    }

    const host = env.HOST?.trim();
    if (host && !['127.0.0.1', '::1', 'localhost'].includes(host)) {
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
