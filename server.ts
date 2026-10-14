import 'dotenv/config';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { enforceProductionEnvironment } from './server/env';

async function startServer() {
  enforceProductionEnvironment();

  const [{ apiRouter }, { authMiddleware }] = await Promise.all([
    import('./server/api'),
    import('./server/auth'),
  ]);
  const app = express();
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);

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

      if (
        (process.env.NODE_ENV !== 'production' && devOrigins.includes(origin)) ||
        allowedOrigins.includes(origin)
      ) {
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

  app.listen(port, host, () => {
    console.log(`[VeloMedia DOOH] Server running on http://${host}:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[VeloMedia DOOH] Fatal startup error:', err);
  process.exit(1);
});
