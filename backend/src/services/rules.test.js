import { describe, it, expect } from 'vitest';
import { buildCareRecommendations, isOverweight } from './rules.js';

describe('rules', () => {
  it('filhote sugere alimentação específica', () => {
    const c = buildCareRecommendations({
      idade: 0.5,
      peso: 3,
      castrado: true,
      ambiente: 'apartamento',
      atividade: 'medio',
    });
    expect(c.alimentacao.motivo.toLowerCase()).toMatch(/filhote|ração|calorias|nutrientes/i);
  });

  it('idoso reforça check-up', () => {
    const c = buildCareRecommendations({
      idade: 11,
      peso: 4.2,
      castrado: true,
      ambiente: 'casa',
      atividade: 'baixo',
    });
    expect(c.saude.recomendacao.toLowerCase()).toMatch(/check|veter|semestral/);
  });

  it('sobrepeso aciona cuidado alimentar e saúde', () => {
    const cat = {
      idade: 4,
      peso: 8.5,
      castrado: true,
      ambiente: 'casa',
      atividade: 'baixo',
    };
    expect(isOverweight(cat)).toBe(true);
    const c = buildCareRecommendations(cat);
    expect(c.alimentacao.motivo).toMatch(/Peso/);
  });

  it('sedentário destaca brincadeiras', () => {
    const c = buildCareRecommendations({
      idade: 3,
      peso: 4.5,
      castrado: true,
      ambiente: 'apartamento',
      atividade: 'baixo',
    });
    expect(c.atividade.motivo.toLowerCase()).toMatch(/atividade/);
  });
});
