/**
 * Encoder para perfis de gatos + produtos.
 * O vetor do gato (encodeCat) usa as mesmas 18 dimensões do produto (encodeProduct)
 * mas preenche TODOS os slots com features reais do gato, em vez de inferências
 * indiretas de categoria/cor. Isso dá ao modelo discriminação real sobre peso,
 * idade, castrado, ambiente e atividade.
 *
 * Estrutura dos 18 dims (dimentions = 2 + numCategories + numColors):
 *   [0]       peso norm  × WEIGHTS.price
 *   [1]       idade norm × WEIGHTS.age
 *   [2..6]    5 dims de categoria → para gatos: castrado, ambiente, atividade×3
 *   [7..17]   11 dims de cor     → para gatos: faixas de idade (5) + faixas de peso (3) + interações (3)
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
 * @param {Array<{name,category,price,color}>} products
 * @param {Array<{idade,peso,castrado,ambiente,atividade,purchases?}>} cats
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
      const avg = ageCounts[product.name]
        ? ageSums[product.name] / ageCounts[product.name]
        : midAge;
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
  const color = oneHotWeighted(
    context.colorsIndex[product.color],
    context.numColors,
    WEIGHTS.color
  );

  return tf.concat1d([price, age, category, color]);
}

/**
 * Codifica o perfil do gato em 18 dims usando features reais:
 *
 * Dims 0-1   (escalares)
 *   0: peso normalizado  × WEIGHTS.price
 *   1: idade normalizada × WEIGHTS.age
 *
 * Dims 2-6   (slots de categoria — 5 dims = numCategories)
 *   2: castrado          (0 ou 1) × WEIGHTS.category
 *   3: apartamento       (0 ou 1) × WEIGHTS.category
 *   4: atividade baixo   (0 ou 1) × WEIGHTS.category
 *   5: atividade medio   (0 ou 1) × WEIGHTS.category
 *   6: atividade alto    (0 ou 1) × WEIGHTS.category
 *
 * Dims 7-17  (slots de cor — 11 dims = numColors)
 *   7:  filhote   (idade < 1)
 *   8:  jovem     (1 ≤ idade < 3)
 *   9:  adulto    (3 ≤ idade < 7)
 *  10:  maduro    (7 ≤ idade < 10)
 *  11:  sênior    (idade ≥ 10)
 *  12:  peso leve (peso < 3.5)
 *  13:  peso normal (3.5 ≤ peso ≤ 5.5)
 *  14:  sobrepeso (peso > 5.5)
 *  15:  castrado + sobrepeso (necessita ração light)
 *  16:  indoor + sedentário (apartamento + atividade baixo)
 *  17:  precisa cuidado especial (sênior OU muito pesado)
 */
export function encodeCat(cat, context) {
  const { minPeso, maxPeso, minIdade, maxIdade, numCategories, numColors } = context;

  const pesoNorm = normalize(cat.peso, minPeso, maxPeso);
  const idadeNorm = normalize(cat.idade, minIdade, maxIdade);

  const scalars = tf.tensor1d([pesoNorm * WEIGHTS.price, idadeNorm * WEIGHTS.age]);

  // Slots de categoria (5 dims): features primárias do gato
  const catFeats = new Array(numCategories).fill(0);
  catFeats[0] = (cat.castrado ? 1.0 : 0.0) * WEIGHTS.category;
  catFeats[1] = (cat.ambiente === 'apartamento' ? 1.0 : 0.0) * WEIGHTS.category;
  catFeats[2] = (cat.atividade === 'baixo' ? 1.0 : 0.0) * WEIGHTS.category;
  catFeats[3] = (cat.atividade === 'medio' ? 1.0 : 0.0) * WEIGHTS.category;
  catFeats[4] = (cat.atividade === 'alto' ? 1.0 : 0.0) * WEIGHTS.category;
  const categoryTensor = tf.tensor1d(catFeats.slice(0, numCategories));

  // Slots de cor (11 dims): faixa etária + faixa de peso + interações
  const colorFeats = new Array(numColors).fill(0);
  colorFeats[0] = (cat.idade < 1 ? 1.0 : 0.0) * WEIGHTS.color;
  colorFeats[1] = (cat.idade >= 1 && cat.idade < 3 ? 1.0 : 0.0) * WEIGHTS.color;
  colorFeats[2] = (cat.idade >= 3 && cat.idade < 7 ? 1.0 : 0.0) * WEIGHTS.color;
  colorFeats[3] = (cat.idade >= 7 && cat.idade < 10 ? 1.0 : 0.0) * WEIGHTS.color;
  colorFeats[4] = (cat.idade >= 10 ? 1.0 : 0.0) * WEIGHTS.color;
  colorFeats[5] = (cat.peso < 3.5 ? 1.0 : 0.0) * WEIGHTS.color;
  colorFeats[6] = (cat.peso >= 3.5 && cat.peso <= 5.5 ? 1.0 : 0.0) * WEIGHTS.color;
  colorFeats[7] = (cat.peso > 5.5 ? 1.0 : 0.0) * WEIGHTS.color;
  colorFeats[8] = (cat.castrado && cat.peso > 5.5 ? 1.0 : 0.0) * WEIGHTS.color;
  colorFeats[9] =
    (cat.ambiente === 'apartamento' && cat.atividade === 'baixo' ? 1.0 : 0.0) * WEIGHTS.color;
  colorFeats[10] = (cat.idade >= 9 || cat.peso > 6.5 ? 1.0 : 0.0) * WEIGHTS.color;
  const colorTensor = tf.tensor1d(colorFeats.slice(0, numColors));

  return tf.concat1d([scalars, categoryTensor, colorTensor]);
}

export function encodeCatTensor2d(cat, context) {
  return encodeCat(cat, context).reshape([1, context.dimentions]);
}

export function getVectorDimention(context) {
  return context.dimentions * 2;
}

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
