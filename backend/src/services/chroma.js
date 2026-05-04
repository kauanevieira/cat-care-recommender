import { ChromaClient } from 'chromadb';
import { CHROMA_URL, COLLECTION_PRODUCTS, COLLECTION_PROFILES } from '../config.js';

let client;

export function getChromaClient() {
  if (!client) {
    client = new ChromaClient({ path: CHROMA_URL });
  }
  return client;
}

/**
 * Garante coleção de produtos (embeddings = vetor encodeProduct).
 */
export async function getProductsCollection() {
  const chroma = getChromaClient();
  return chroma.getOrCreateCollection({
    name: COLLECTION_PRODUCTS,
    metadata: { description: 'Produtos para gatos (TensorFlow encoding)' },
  });
}

/**
 * Opcional: perfis de gatos para similaridade.
 */
export async function getProfilesCollection() {
  const chroma = getChromaClient();
  return chroma.getOrCreateCollection({
    name: COLLECTION_PROFILES,
    metadata: { description: 'Perfis de gatos (encodeCat)' },
  });
}

/**
 * @param {import('chromadb').Collection} collection
 * @param {string[]} ids
 * @param {number[][]} embeddings
 * @param {Record<string, unknown>[]} metadatas
 */
export async function upsertEmbeddings(collection, ids, embeddings, metadatas) {
  if (!ids.length) return;
  await collection.upsert({ ids, embeddings, metadatas });
}

/**
 * @param {import('chromadb').Collection} collection
 * @param {number[]} queryEmbedding
 * @param {number} nResults
 */
export async function querySimilar(collection, queryEmbedding, nResults = 50) {
  const res = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: Math.min(nResults, 200),
  });
  return res;
}
