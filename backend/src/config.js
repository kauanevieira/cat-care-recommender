import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PORT = Number(process.env.PORT) || 4000;
export const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';
export const MODEL_DIR = process.env.MODEL_DIR || path.join(__dirname, '..', 'models', 'recommender');
export const CONTEXT_PATH = process.env.CONTEXT_PATH || path.join(__dirname, '..', 'models', 'context.json');
export const DATA_DIR = path.join(__dirname, '..', 'data');
export const PRODUCTS_PATH = path.join(DATA_DIR, 'products.json');
export const CATS_CSV_PATH = path.join(DATA_DIR, 'cats.csv');

export const COLLECTION_PRODUCTS = 'cat_products';
export const COLLECTION_PROFILES = 'cat_profiles';
