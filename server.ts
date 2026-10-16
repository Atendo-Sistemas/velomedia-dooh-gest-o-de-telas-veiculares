import 'dotenv/config';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { enforceProductionEnvironment } from './server/env';
import { apiRateLimiter } from './server/rate-limit';

async function startServer() {
  enforceProductionEnvironment();

  const repositoryModule = await import('./server/repository');
  await repositoryModule.initializeVeloRepository();
  const [{ apiRouter }, { authMiddleware }] = await Promise.all([
    import('./server/api'),
    import('./server/auth'),
  ]);
  const app = express();
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0');
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
  app.disable('x-powered-by');

  const devOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'];
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
  const isAllowedOrigin = (origin: string): boolean =>
    (process.env.NODE_ENV !== 'production' && devOrigins.includes(origin)) ||
    allowedOrigins.includes(origin);

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // Strict CORS configuration
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, kiosk PWA same-origin)
      if (!origin) return callback(null, true);

      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      callback(null, false);
    },
    credentials: true,
  }));

  app.use((req, res, next) => {
    const origin = req.get('Origin');
    if (
      origin &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
      !isAllowedOrigin(origin)
    ) {
      res.status(403).json({ error: 'origin_not_allowed', message: 'Origem não permitida.' });
      return;
    }
    next();
  });

  app.use('/api', apiRateLimiter);

  app.use(cookieParser());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Attach session & device authentication
  app.use((req, res, next) => {
    Promise.resolve(authMiddleware(req, res, next)).catch(next);
  });

  // Mount versioned API routes FIRST
  app.use('/api/v1', apiRouter);
  // Alias for generic /api/* routes
  app.use('/api', apiRouter);

  // Vite development middleware or production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(port, host, () => {
    console.log(`[VeloMedia DOOH] Server running on http://${host}:${port}`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[VeloMedia DOOH] ${signal} received; closing HTTP and database pools.`);
    server.close(async error => {
      try {
        await repositoryModule.closeVeloRepository();
        if (error) throw error;
        process.exit(0);
      } catch (shutdownError) {
        console.error('[VeloMedia DOOH] Graceful shutdown failed:', shutdownError);
        process.exit(1);
      }
    });
    setTimeout(() => process.exit(1), 15_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('[VeloMedia DOOH] Fatal startup error:', err);
  process.exit(1);
});
