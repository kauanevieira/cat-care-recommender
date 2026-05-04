import { Router } from 'express';
import { z } from 'zod';
import { createCat, getCat } from '../store/catsRepo.js';
import { getProfilesCollection, upsertEmbeddings } from '../services/chroma.js';
import { encodeCat } from '../services/encoder.js';
import fs from 'node:fs';
import { CONTEXT_PATH } from '../config.js';

const catBodySchema = z.object({
  idade: z.coerce.number().min(0).max(30),
  peso: z.coerce.number().min(0.3).max(25),
  castrado: z.boolean(),
  ambiente: z.enum(['apartamento', 'casa']),
  atividade: z.enum(['baixo', 'medio', 'alto']),
});

export const catsRouter = Router();

catsRouter.post('/', (req, res) => {
  const parsed = catBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const cat = createCat(parsed.data);
  // Opcional: indexar perfil no Chroma para futuras features (similaridade)
  try {
    if (fs.existsSync(CONTEXT_PATH)) {
      const ctx = JSON.parse(fs.readFileSync(CONTEXT_PATH, 'utf8'));
      const full = { ...ctx, cats: [] };
      const tensor = encodeCat(cat, full);
      const vec = Array.from(tensor.dataSync());
      tensor.dispose();
      getProfilesCollection()
        .then((col) =>
          upsertEmbeddings(
            col,
            [`cat_${cat.id}`],
            [vec],
            [{ id: cat.id, idade: cat.idade, peso: cat.peso }]
          )
        )
        .catch(() => {});
    }
  } catch {
    // ignora se seed não rodou
  }
  return res.status(201).json(cat);
});

catsRouter.get('/:id', (req, res) => {
  const cat = getCat(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Gato não encontrado' });
  return res.json(cat);
});
