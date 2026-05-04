/**
 * Heurísticas de cuidado + explicabilidade (motivo).
 * Complementa ranking ML com recomendações interpretáveis.
 */

/** Faixa de peso ideal aproximada por idade (anos) — apenas guia educativo */
export function idealWeightRange(idade) {
  if (idade < 1) return { min: 2.5, max: 4.5 };
  if (idade < 7) return { min: 4.0, max: 6.0 };
  return { min: 3.8, max: 5.8 };
}

export function isOverweight(cat) {
  const { max } = idealWeightRange(cat.idade);
  return cat.peso > max + 0.5;
}

export function isUnderweight(cat) {
  const { min } = idealWeightRange(cat.idade);
  return cat.peso < min - 0.4;
}

/**
 * @param {{ idade:number, peso:number, castrado:boolean, ambiente:string, atividade:string }} cat
 */
export function buildCareRecommendations(cat) {
  const alimentacao = pickAlimentacao(cat);
  const atividade = pickAtividade(cat);
  const ambiente = pickAmbiente(cat);
  const saude = pickSaude(cat);

  return { alimentacao, atividade, ambiente, saude };
}

function pickAlimentacao(cat) {
  if (cat.idade < 1) {
    return {
      recomendacao: 'Ração específica para filhote (únida ou seca starter), porções fracionadas.',
      motivo: 'Filhotes precisam de mais calorias e nutrientes para crescimento.',
    };
  }
  if (isOverweight(cat)) {
    return {
      recomendacao: 'Ração light ou de controle calórico; medir porções com balança.',
      motivo: `Peso (${cat.peso} kg) está acima da faixa sugerida para a idade.`,
    };
  }
  if (isUnderweight(cat)) {
    return {
      recomendacao: 'Avaliar aumento calórico guiado por veterinário; verificar parasitas.',
      motivo: `Peso (${cat.peso} kg) abaixo da faixa esperada para a idade.`,
    };
  }
  if (cat.castrado) {
    return {
      recomendacao: 'Manter ração adequada a castrados e horários fixos de refeição.',
      motivo: 'Gatos castrados tendem a menor gasto energético — risco de ganho de peso.',
    };
  }
  return {
    recomendacao: 'Dieta balanceada para adulto; água fresca sempre disponível.',
    motivo: 'Perfil nutricional compatível com manutenção do peso atual.',
  };
}

function pickAtividade(cat) {
  if (cat.atividade === 'baixo') {
    return {
      recomendacao: 'Brincadeiras ativas 2x ao dia, ~15 minutos (varinha, caça ao brinquedo).',
      motivo: 'Nível de atividade informado como baixo — enriquecimento reduz tédio e obesidade.',
    };
  }
  if (cat.atividade === 'alto') {
    return {
      recomendacao: 'Manter rotina de brincadeiras; oferecer pausas e hidratação.',
      motivo: 'Alto nível de atividade: estimular sem sobrecarregar.',
    };
  }
  return {
    recomendacao: 'Combinar brincadeiras interativas com brinquedos solo (bolinhas, arranhador).',
    motivo: 'Atividade moderada: equilibrar estímulos físicos e mentais.',
  };
}

function pickAmbiente(cat) {
  if (cat.ambiente === 'apartamento') {
    return {
      recomendacao: 'Arranhadores verticais, prateleiras e janelas com visão externa (telada).',
      motivo: 'Em apartamento o espaço vertical compensa a área limitada.',
    };
  }
  return {
    recomendacao: 'Garantir área segura no quintal ou varanda telada; esconderijos e tocas.',
    motivo: 'Ambiente tipo casa pode oferecer mais exploração — reforçar segurança.',
  };
}

function pickSaude(cat) {
  if (cat.idade >= 10) {
    return {
      recomendacao: 'Check-ups semestrais; observar apetite, hidratação e mobilidade.',
      motivo: 'Gatos idosos têm maior risco de doenças crônicas.',
    };
  }
  if (!cat.castrado && cat.idade >= 0.5) {
    return {
      recomendacao: 'Discutir castração e calendário vacinal com o veterinário.',
      motivo: 'Animais não castrados adultos têm riscos reprodutivos e comportamentais.',
    };
  }
  if (isOverweight(cat)) {
    return {
      recomendacao: 'Monitorar peso mensalmente na mesma balança; anotar tendência.',
      motivo: 'Sobrepeso aumenta risco de diabetes e problemas articulares.',
    };
  }
  return {
    recomendacao: 'Vacinação e vermifugação em dia; escovar pelos regularmente.',
    motivo: 'Rotina preventiva para manter saúde de base.',
  };
}
