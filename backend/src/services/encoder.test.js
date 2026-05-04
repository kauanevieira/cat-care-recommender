import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as tf from '@tensorflow/tfjs-node';
import { makeContext, encodeCat, encodeProduct, getVectorDimention } from './encoder.js';

describe('encoder', () => {
  let tfReady = true;
  beforeAll(() => {
    try {
      tf.setBackend('cpu');
    } catch {
      tfReady = false;
    }
  });
  afterAll(() => {
    // evita vazamento de handles em testes
  });

  it('dimensão do vetor gato = dimensão do produto; input do modelo = 2x', () => {
    if (!tfReady) return;
    const products = [
      { id: 1, name: 'A', category: 'x', price: 10, color: 'a' },
      { id: 2, name: 'B', category: 'y', price: 20, color: 'b' },
    ];
    const cats = [
      { idade: 2, peso: 4, castrado: true, ambiente: 'apartamento', atividade: 'medio', purchases: [] },
    ];
    const ctx = makeContext(products, cats);
    const c = encodeCat(
      { idade: 2, peso: 4, castrado: true, ambiente: 'apartamento', atividade: 'medio' },
      ctx
    );
    const p = encodeProduct(products[0], ctx);
    expect(c.shape[0]).toBe(p.shape[0]);
    expect(c.shape[0]).toBe(ctx.dimentions);
    expect(getVectorDimention(ctx)).toBe(ctx.dimentions * 2);
    c.dispose();
    p.dispose();
  });
});
