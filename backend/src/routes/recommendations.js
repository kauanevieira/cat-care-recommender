import { Router } from 'express';
import { getCat } from '../store/catsRepo.js';
import { recommendForCat, isModelReady } from '../services/recommender.js';

export const recommendationsRouter = Router();

recommendationsRouter.get('/:id', async (req, res) => {
  const cat = getCat(req.params.id);
  if (!cat) {
    return res.status(404).json({ error: 'Gato não encontrado' });
  }
  if (!isModelReady()) {
    return res.status(503).json({
      error: 'Modelo não treinado. Inicie o ChromaDB, rode: npm run seed no diretório backend.',
    });
  }
  try {
    const { id, ...profile } = cat;
    const out = await recommendForCat(profile, { topK: 10, chromaK: 50 });
    return res.json({ gato_id: id, ...out });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
});
