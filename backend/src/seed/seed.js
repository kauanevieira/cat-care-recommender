/**
 * Pipeline: CSV + produtos → compras simuladas → ChromaDB → treino TF.js → model + context.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

import {
  CATS_CSV_PATH,
  CONTEXT_PATH,
  MODEL_DIR,
  PRODUCTS_PATH,
} from '../config.js';
import { makeContext, encodeProduct, serializeContext } from '../services/encoder.js';
import { getProductsCollection, upsertEmbeddings } from '../services/chroma.js';
import {
  configureNeuralNetAndTrain,
  createTrainingData,
  disposeTrainingTensors,
} from '../services/trainer.js';
import { clearModelCache } from '../services/modelCache.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readProducts() {
  const raw = fs.readFileSync(PRODUCTS_PATH, 'utf8');
  return JSON.parse(raw);
}

function readCatsFromCsv() {
  const raw = fs.readFileSync(CATS_CSV_PATH, 'utf8');
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records.map((r) => ({
    idade: Number(r.idade),
    peso: Number(r.peso),
    castrado: String(r.castrado).toLowerCase() === 'true',
    ambiente: String(r.ambiente),
    atividade: String(r.atividade),
  }));
}

function byName(products, name) {
  return products.find((p) => p.name === name);
}

/**
 * Gera "compras" sintéticas para treinar o classificador binário (comprou / não comprou).
 */
export function simulatePurchases(cat, products) {
  const add = (set, name) => {
    const p = byName(products, name);
    if (p) set.add(p);
  };
  const set = new Set();

  if (cat.idade < 1) {
    add(set, 'Ração úmida filhote');
    add(set, 'Brinquedo varinha pena');
  } else {
    add(set, 'Ração seca adulto');
    add(set, 'Ração úmida adulto');
  }

  if (cat.peso > 6.2 && cat.idade > 2) {
    add(set, 'Ração light castrado');
  }

  if (cat.atividade === 'baixo') {
    add(set, 'Bolinha com guizo');
    add(set, 'Arranhador torre 1m');
    add(set, 'Petisco dental');
  }

  if (cat.atividade === 'alto') {
    add(set, 'Brinquedo varinha pena');
    add(set, 'Snuggle catnip');
  }

  if (cat.ambiente === 'apartamento') {
    add(set, 'Areia aglomerante');
    add(set, 'Arranhador parede');
    add(set, 'Fonte bebedouro elétrica');
  } else {
    add(set, 'Caixa de areia fechada');
    add(set, 'Caminha ortopédica');
  }

  if (cat.idade >= 9) {
    add(set, 'Suplemento ômega 3');
    add(set, 'Caminha ortopédica');
  }

  if (!cat.castrado && cat.idade > 1) {
    add(set, 'Coleira antipulgas');
  }

  if (cat.castrado && cat.idade >= 1 && cat.idade < 8) {
    add(set, 'Comedouro elevado');
  }

  const arr = [...set];
  if (arr.length === 0) {
    return [products[0]];
  }
  return arr;
}

export async function runSeed({ quiet = false } = {}) {
  const log = quiet ? () => {} : console.log.bind(console);
  log('[seed] Lendo produtos e CSV de gatos…');

  const products = readProducts();
  const rows = readCatsFromCsv();

  const cats = rows.map((c) => ({
    ...c,
    purchases: simulatePurchases(c, products),
  }));

  const context = makeContext(products, cats);
  const serialized = serializeContext(context);
  fs.mkdirSync(path.dirname(CONTEXT_PATH), { recursive: true });
  fs.mkdirSync(MODEL_DIR, { recursive: true });

  log('[seed] Populando ChromaDB (coleção cat_products)…');
  const collection = await getProductsCollection();
  const ids = [];
  const embeddings = [];
  const metadatas = [];

  for (const p of products) {
    const vec = encodeProduct(p, context);
    ids.push(`product_${p.id}`);
    embeddings.push(Array.from(vec.dataSync()));
    vec.dispose();
    metadatas.push({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      color: p.color,
    });
  }

  await upsertEmbeddings(collection, ids, embeddings, metadatas);

  log('[seed] Treinando modelo (pode levar ~1–2 min)…');
  const trainData = createTrainingData(context);
  const model = await configureNeuralNetAndTrain(trainData, (epoch, logs) => {
    if (epoch % 20 === 0) log(`  epoch ${epoch} loss=${logs?.loss?.toFixed?.(4)}`);
  });

  const outUrl = `file://${MODEL_DIR}`;
  await model.save(outUrl);
  fs.writeFileSync(CONTEXT_PATH, JSON.stringify(serialized, null, 2), 'utf8');

  await disposeTrainingTensors(trainData);
  clearModelCache();

  log(`[seed] Modelo salvo em ${MODEL_DIR}`);
  log(`[seed] Contexto em ${CONTEXT_PATH}`);
  log('[seed] Concluído.');
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  runSeed().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
