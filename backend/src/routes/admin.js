import { Router } from 'express';
import { runSeed } from '../seed/seed.js';
import { clearModelCache } from '../services/modelCache.js';

export const adminRouter = Router();

adminRouter.post('/retrain', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    await runSeed({ quiet: true });
    clearModelCache();
    return res.json({ ok: true, message: 'Seed e retreinamento concluídos.' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});
