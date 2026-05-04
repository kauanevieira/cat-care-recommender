/** Repositório em memória (substituível por persistência em produção). */

const cats = new Map();
let nextId = 1;

/**
 * @param {{ idade:number, peso:number, castrado:boolean, ambiente:string, atividade:string }} data
 */
export function createCat(data) {
  const id = String(nextId++);
  const row = { id, ...data };
  cats.set(id, row);
  return row;
}

export function getCat(id) {
  return cats.get(String(id));
}

export function listCats() {
  return [...cats.values()];
}
