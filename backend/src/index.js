import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import { catsRouter } from './routes/cats.js';
import { recommendationsRouter } from './routes/recommendations.js';
import { adminRouter } from './routes/admin.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'cat-care-recommender-api' });
});

app.use('/cats', catsRouter);
app.use('/recommendations', recommendationsRouter);
app.use('/admin', adminRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno' });
});

app.listen(PORT, () => {
  console.log(`API em http://localhost:${PORT}`);
  console.log('  POST /cats  GET /cats/:id  GET /recommendations/:id  POST /admin/retrain');
});
