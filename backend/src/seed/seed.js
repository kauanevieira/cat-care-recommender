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
 * Gera "compras" sintéticas para treinar o classificador binário.
 *
 * Regras organizadas por dimensão do perfil do gato:
 *  - Alimentação  → depende de idade, peso e se é castrado
 *  - Brinquedos   → depende de atividade e idade
 *  - Higiene      → depende de ambiente e castrado
 *  - Acessórios   → depende de ambiente, atividade e peso
 *  - Saúde        → depende de idade, castrado e peso
 */
export function simulatePurchases(cat, products) {
  const add = (set, name) => {
    const p = byName(products, name);
    if (p) set.add(p);
  };
  const set = new Set();

  // ── ALIMENTAÇÃO ──────────────────────────────────────────────────────────
  if (cat.idade < 1) {
    // Filhote: precisa de ração específica + úmida para hidratação
    add(set, 'Ração úmida filhote');
  } else if (cat.castrado && cat.peso > 5.5 && cat.idade >= 1) {
    // Castrado com sobrepeso: ração light é prioridade
    add(set, 'Ração light castrado');
    add(set, 'Petisco dental'); // dentes ressentes em castrados sedentários
  } else if (cat.castrado && cat.peso > 4.5 && cat.idade >= 2) {
    // Castrado com tendência a engordar: light + seca
    add(set, 'Ração light castrado');
    add(set, 'Ração seca adulto');
  } else if (cat.idade >= 1 && cat.atividade === 'alto') {
    // Adulto/jovem muito ativo: precisa de mais caloria — ração seca + úmida
    add(set, 'Ração seca adulto');
    add(set, 'Ração úmida adulto');
  } else if (cat.idade >= 1 && cat.idade < 9) {
    // Adulto padrão
    add(set, 'Ração seca adulto');
    if (cat.atividade === 'baixo') {
      add(set, 'Petisco dental'); // sedentário acumula tártaro
    } else {
      add(set, 'Ração úmida adulto');
    }
  } else if (cat.idade >= 9) {
    // Sênior: precisa de ração úmida (hidratação) + suplemento
    add(set, 'Ração úmida adulto');
    add(set, 'Suplemento ômega 3');
  }

  // ── BRINQUEDOS ───────────────────────────────────────────────────────────
  if (cat.atividade === 'alto') {
    // Muito ativo: brinquedos que estimulam caça e movimento
    add(set, 'Brinquedo varinha pena');
    add(set, 'Snuggle catnip');
    if (cat.idade < 3) add(set, 'Bolinha com guizo'); // filhote/jovem ativo também usa bolinha
  } else if (cat.atividade === 'medio') {
    // Atividade média: brinquedos moderados
    add(set, 'Snuggle catnip');
    if (cat.idade < 5) add(set, 'Brinquedo varinha pena');
  } else {
    // Sedentário: precisa de estímulo leve para não engordar
    add(set, 'Bolinha com guizo');
    add(set, 'Snuggle catnip');
  }

  // ── HIGIENE ──────────────────────────────────────────────────────────────
  if (cat.ambiente === 'apartamento') {
    // Apartamento: areia aglomerante (compacta, sem odor) é preferida
    add(set, 'Areia aglomerante');
    if (cat.peso > 5.0 || cat.atividade === 'baixo') {
      // Gatos pesados/sedentários em apartamento ficam com tapete sujo
      add(set, 'Tapete higiênico');
    }
    // Shampoo a seco: gatos de apartamento não tomam banho de chuva
    add(set, 'Shampoo a seco');
  } else {
    // Casa: caixa fechada evita que gatos saiam espalhando areia
    add(set, 'Caixa de areia fechada');
    // Casa: gato sai para área externa, pelo acumula mais
    add(set, 'Escova removedora pelo');
  }

  // ── ACESSÓRIOS ───────────────────────────────────────────────────────────
  if (cat.ambiente === 'apartamento') {
    // Arranhador indispensável em apartamento (sem árvores, móveis em risco)
    if (cat.atividade === 'alto' || cat.idade < 4) {
      add(set, 'Arranhador torre 1m'); // gatos ativos preferem torre
    } else {
      add(set, 'Arranhador parede'); // sedentários aceitam o de parede
    }
    // Bebedouro elétrico: estimula hidratação em ambiente fechado
    add(set, 'Fonte bebedouro elétrica');
  } else {
    // Casa: arranhador torre (têm mais espaço)
    if (cat.atividade !== 'baixo') {
      add(set, 'Arranhador torre 1m');
    }
  }

  if (cat.castrado && cat.peso > 5.0 && cat.idade >= 2) {
    // Comedouro elevado: evita engolir rápido, controla peso
    add(set, 'Comedouro elevado');
  }

  if (cat.idade >= 9) {
    // Sênior: caminha ortopédica alivia articulações
    add(set, 'Caminha ortopédica');
    // Sênior bebe menos, bebedouro elétrico incentiva
    add(set, 'Fonte bebedouro elétrica');
  }

  // ── SAÚDE ─────────────────────────────────────────────────────────────────
  if (!cat.castrado && cat.idade > 1) {
    // Não castrado vai à rua / tem mais contato externo: precisa de antipulgas
    add(set, 'Coleira antipulgas');
  }

  if (cat.ambiente === 'casa' && cat.idade > 1) {
    // Gatos de casa ficam expostos a parasitas e sujeira externa
    add(set, 'Coleira antipulgas');
  }

  if (cat.idade >= 7 || (cat.castrado && cat.peso > 6.0)) {
    // Maduro/sênior ou castrado pesado: suplemento ômega para articulações/pelagem
    add(set, 'Suplemento ômega 3');
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
