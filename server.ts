import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api';
import { authMiddleware } from './server/auth';

const PORT = 3000;
const HOST = '0.0.0.0';

async function startServer() {
  const app = express();

  // Basic security and parsing middlewares
  app.use(cors({
    origin: true,
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
    app.get('*', (req, res) => {
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
