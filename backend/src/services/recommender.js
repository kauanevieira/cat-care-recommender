import * as tf from '@tensorflow/tfjs-node';
import fs from 'node:fs';
import path from 'node:path';
import { MODEL_DIR, CONTEXT_PATH } from '../config.js';
import { encodeCat, encodeProduct } from './encoder.js';
import { getProductsCollection, querySimilar } from './chroma.js';
import { buildCareRecommendations } from './rules.js';
import { getCache, setCache, clearModelCache } from './modelCache.js';

export { clearModelCache };

function modelExists() {
  return fs.existsSync(path.join(MODEL_DIR, 'model.json')) && fs.existsSync(CONTEXT_PATH);
}

export function isModelReady() {
  return modelExists();
}

/**
 * @returns {Promise<{ model: import('@tensorflow/tfjs').LayersModel, context: object }>}
 */
export async function loadModelAndContext() {
  let { cachedModel, cachedContext } = getCache();
  if (cachedModel && cachedContext) {
    return { model: cachedModel, context: cachedContext };
  }
  if (!modelExists()) {
    throw new Error('Modelo ou context.json ausente. Execute: npm run seed (com ChromaDB no ar).');
  }
  const raw = fs.readFileSync(CONTEXT_PATH, 'utf8');
  cachedContext = JSON.parse(raw);
  const modelPath = path.join(MODEL_DIR, 'model.json');
  const modelUrl = `file://${modelPath}`;
  cachedModel = await tf.loadLayersModel(modelUrl);
  setCache(cachedModel, cachedContext);
  return { model: cachedModel, context: cachedContext };
}

/**
 * @param {object} cat - { idade, peso, castrado, ambiente, atividade }
 * @param {{ topK?: number, chromaK?: number }} opts
 */
export async function recommendForCat(cat, opts = {}) {
  const topK = opts.topK ?? 10;
  const chromaK = opts.chromaK ?? 50;

  const { model, context } = await loadModelAndContext();
  const collection = await getProductsCollection();

  const catTensor = encodeCat(cat, context);
  const catVec = Array.from(catTensor.dataSync());
  catTensor.dispose();

  const q = await querySimilar(collection, catVec, chromaK);
  const ids = q.ids?.[0] ?? [];
  const metas = q.metadatas?.[0] ?? [];

  if (!ids.length) {
    return {
      produtos: [],
      cuidados: buildCareRecommendations(cat),
      aviso: 'Nenhum produto no ChromaDB. Rode npm run seed.',
    };
  }

  const productById = new Map(context.products.map((p) => [String(p.id), p]));
  const catFlat = catVec;

  const candidates = [];
  for (let i = 0; i < ids.length; i++) {
    const rawId = metas[i]?.id ?? ids[i];
    const id = String(rawId);
    const p = productById.get(id);
    if (!p) continue;
    candidates.push(p);
  }

  if (!candidates.length) {
    return {
      produtos: [],
      cuidados: buildCareRecommendations(cat),
      aviso: 'Produtos no Chroma não batem com products.json. Rode npm run seed.',
    };
  }

  const inputRows = [];
  for (const p of candidates) {
    const pT = encodeProduct(p, context);
    inputRows.push([...catFlat, ...Array.from(pT.dataSync())]);
    pT.dispose();
  }

  const inputTensor = tf.tensor2d(inputRows);
  const predTensor = model.predict(inputTensor);
  const scores = Array.from(predTensor.dataSync());
  inputTensor.dispose();
  predTensor.dispose();

  const rows = candidates.map((p, i) => ({ ...p, score: scores[i] ?? 0 }));

  rows.sort((a, b) => b.score - a.score);
  const produtos = rows.slice(0, topK);
  const cuidados = buildCareRecommendations(cat);

  return { produtos, cuidados };
}
