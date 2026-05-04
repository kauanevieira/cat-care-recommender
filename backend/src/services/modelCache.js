/** Cache do modelo carregado — separado para evitar import circular entre seed e recommender */

let cachedModel = null;
let cachedContext = null;

export function getCache() {
  return { cachedModel, cachedContext };
}

export function setCache(model, context) {
  cachedModel = model;
  cachedContext = context;
}

export function clearModelCache() {
  cachedModel = null;
  cachedContext = null;
}
