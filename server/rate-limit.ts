import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import type { Request } from 'express';

function getIpKey(request: Request): string {
  return request.ip ? ipKeyGenerator(request.ip) : 'unknown-ip';
}

function createRateLimiter(windowMs: number, limit: number, message: string, keyGenerator?: (request: Request) => string) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'rate_limit_exceeded', message },
    ...(keyGenerator ? { keyGenerator } : {}),
  });
}

export const apiRateLimiter = createRateLimiter(
  60_000,
  1_800,
  'Muitas requisições. Aguarde um instante e tente novamente.',
);

export const loginRequestRateLimiter = createRateLimiter(
  15 * 60_000,
  20,
  'Muitas tentativas de login. Aguarde antes de tentar novamente.',
);

export const publicPlayerRateLimiter = createRateLimiter(
  60_000,
  120,
  'Muitas solicitações ao player. Aguarde um instante e tente novamente.',
);

export const deviceRequestRateLimiter = createRateLimiter(
  60_000,
  120,
  'Muitas solicitações deste dispositivo. Aguarde um instante e tente novamente.',
  request => request.device?.id ? `device:${request.device.id}` : getIpKey(request),
);

export const adminRequestRateLimiter = createRateLimiter(
  60_000,
  120,
  'Muitas operações administrativas. Aguarde um instante e tente novamente.',
  request => request.user?.id ? `user:${request.user.id}` : getIpKey(request),
);

export const commandAckRateLimiter = createRateLimiter(
  60_000,
  120,
  'Muitas confirmações de comando. Aguarde um instante e tente novamente.',
  request => request.device?.id
    ? `device:${request.device.id}`
    : request.user?.id
      ? `user:${request.user.id}`
      : getIpKey(request),
);
