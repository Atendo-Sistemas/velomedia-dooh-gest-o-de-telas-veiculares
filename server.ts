import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api';
import { authMiddleware } from './server/auth';

const PORT = 3000;
const HOST = '0.0.0.0';

/**
 * Validate production environment variables before startup
 */
function validateProductionEnvironment(): void {
  if (process.env.NODE_ENV === 'production') {
    const requiredVars = [
      'SESSION_SECRET',
      'DEVICE_HMAC_MASTER_SECRET',
      'WEBHOOK_SECRET',
      'CORS_ALLOWED_ORIGINS',
    ];

    const missing = requiredVars.filter(v => !process.env[v] || process.env[v]!.trim().length === 0);
    if (missing.length > 0 && !process.env.BYPASS_ENV_CHECK) {
      console.warn(`[SECURITY WARNING] Missing environment variables in production: ${missing.join(', ')}`);
    }
  }
}

async function startServer() {
  validateProductionEnvironment();

  const app = express();

  // Strict CORS configuration
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  const devOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, kiosk PWA same-origin)
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV !== 'production') {
        if (devOrigins.includes(origin) || origin.includes('run.app') || origin.includes('localhost')) {
          return callback(null, true);
        }
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`[CORS] Origin '${origin}' not permitted by CORS policy.`));
    },
    credentials: true,
  }));

  app.use(cookieParser());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Attach session & device authentication
  app.use(authMiddleware);

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

  app.listen(PORT, HOST, () => {
    console.log(`[VeloMedia DOOH] Full-Stack Production Server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[VeloMedia DOOH] Fatal startup error:', err);
  process.exit(1);
});
