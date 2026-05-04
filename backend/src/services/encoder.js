/**
 * Encoder inspirado na lógica de modelTrainingWorker.js (e-commerce),
 * reescrito para perfis de gatos + produtos para gatos.
 * Vetores de produto e de "preferência do gato" têm a mesma dimensão para ANN no ChromaDB.
 */
import * as tf from '@tensorflow/tfjs-node';

export const WEIGHTS = {
  category: 0.4,
  color: 0.3,
  price: 0.2,
  age: 0.1,
};

export const AMBIENTES = ['apartamento', 'casa'];
export const ATIVIDADES = ['baixo', 'medio', 'alto'];

export const normalize = (value, min, max) => (value - min) / ((max - min) || 1);

export function oneHotWeighted(index, length, weight) {
  return tf.oneHot(index, length).cast('float32').mul(weight);
}

/**
 * @param {Array<{name:string,category:string,price:number,color:string}>} products
 * @param {Array<{idade:number,peso:number,purchases?:Array}>} cats - gatos com opcional purchases para média de idade por produto
 */
export function makeContext(products, cats) {
  const idades = cats.map((c) => c.idade);
  const pesos = cats.map((c) => c.peso);
  const prices = products.map((p) => p.price);

  const minIdade = Math.min(...idades);
  const maxIdade = Math.max(...idades);
  const minPeso = Math.min(...pesos);
  const maxPeso = Math.max(...pesos);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const colors = [...new Set(products.map((p) => p.color))];
  const categories = [...new Set(products.map((p) => p.category))];

  const colorsIndex = Object.fromEntries(colors.map((c, i) => [c, i]));
  const categoriesIndex = Object.fromEntries(categories.map((c, i) => [c, i]));

  const midAge = (minIdade + maxIdade) / 2;
  const ageSums = {};
  const ageCounts = {};

  cats.forEach((cat) => {
    if (!cat.purchases?.length) return;
    cat.purchases.forEach((p) => {
      ageSums[p.name] = (ageSums[p.name] || 0) + cat.idade;
      ageCounts[p.name] = (ageCounts[p.name] || 0) + 1;
    });
  });

  const productAvgAgeNorm = Object.fromEntries(
    products.map((product) => {
      const avg = ageCounts[product.name] ? ageSums[product.name] / ageCounts[product.name] : midAge;
      return [product.name, normalize(avg, minIdade, maxIdade)];
    })
  );

  const dimentions = 2 + categories.length + colors.length;

  return {
    products,
    cats,
    colorsIndex,
    categoriesIndex,
    productAvgAgeNorm,
    minIdade,
    maxIdade,
    minPeso,
    maxPeso,
    minPrice,
    maxPrice,
    numCategories: categories.length,
    numColors: colors.length,
    dimentions,
  };
}

export function encodeProduct(product, context) {
  const price = tf.tensor1d([
    normalize(product.price, context.minPrice, context.maxPrice) * WEIGHTS.price,
  ]);
  const age = tf.tensor1d([(context.productAvgAgeNorm[product.name] ?? 0.5) * WEIGHTS.age]);

  const category = oneHotWeighted(
    context.categoriesIndex[product.category],
    context.numCategories,
    WEIGHTS.category
  );
  const color = oneHotWeighted(context.colorsIndex[product.color], context.numColors, WEIGHTS.color);

  return tf.concat1d([price, age, category, color]);
}

/**
 * Mapeia perfil do gato para índices de categoria/cor compatíveis com o catálogo (mesmo R^d do produto).
 */
export function inferCategoryIndex(cat, context) {
  const pick = (name) => context.categoriesIndex[name] ?? 0;

  if (cat.idade < 1) return pick('alimentacao');
  if (cat.idade >= 10) return pick('saude');
  if (cat.atividade === 'baixo') return pick('brinquedos');
  if (cat.atividade === 'alto') return pick('brinquedos');
  if (cat.peso > 6 && cat.idade > 2) return pick('alimentacao');
  if (cat.ambiente === 'apartamento') return pick('acessorios');
  return pick('higiene');
}

export function inferColorIndex(cat, context) {
  const pick = (name) => context.colorsIndex[name] ?? 0;
  if (cat.ambiente === 'apartamento') return pick('cinza');
  if (cat.ambiente === 'casa') return pick('natural');
  return pick('preto');
}

/**
 * Vetor no mesmo espaço dimensional de encodeProduct (para query no ChromaDB).
 */
export function encodeCat(cat, context) {
  const price = tf.tensor1d([
    normalize(cat.peso, context.minPeso, context.maxPeso) * WEIGHTS.price,
  ]);
  const age = tf.tensor1d([normalize(cat.idade, context.minIdade, context.maxIdade) * WEIGHTS.age]);

  const catIdx = inferCategoryIndex(cat, context);
  const colorIdx = inferColorIndex(cat, context);

  const category = oneHotWeighted(catIdx, context.numCategories, WEIGHTS.category);
  const color = oneHotWeighted(colorIdx, context.numColors, WEIGHTS.color);

  return tf.concat1d([price, age, category, color]);
}

export function encodeCatTensor2d(cat, context) {
  return encodeCat(cat, context).reshape([1, context.dimentions]);
}

export function getVectorDimention(context) {
  return context.dimentions * 2;
}

/** Salva em disco (sem tensores) — usado com model.save + context.json */
export function serializeContext(context) {
  return {
    minIdade: context.minIdade,
    maxIdade: context.maxIdade,
    minPeso: context.minPeso,
    maxPeso: context.maxPeso,
    minPrice: context.minPrice,
    maxPrice: context.maxPrice,
    numCategories: context.numCategories,
    numColors: context.numColors,
    dimentions: context.dimentions,
    categoriesIndex: context.categoriesIndex,
    colorsIndex: context.colorsIndex,
    productAvgAgeNorm: context.productAvgAgeNorm,
    products: context.products,
  };
}
