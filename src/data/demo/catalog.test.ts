import { describe, expect, it } from 'vitest';

import { SERVICE_CATEGORIES, SERVICES, getServiceById } from './catalog';

describe('catálogo de serviços', () => {
  it('organiza os nove serviços aprovados nas cinco categorias da experiência', () => {
    expect(SERVICE_CATEGORIES.map((category) => category.name)).toEqual([
      'Orientação geral',
      'Regularização e registro',
      'Posse e sucessão',
      'Terrenos',
      'Avaliação',
    ]);

    expect(SERVICES.map((service) => service.name)).toEqual([
      'Regularização de imóveis',
      'Escritura',
      'Averbação',
      'Retificação de área',
      'Regularização em prefeitura/cartório',
      'Usucapião',
      'Inventário imobiliário',
      'Desmembramento de terreno',
      'Análise de Valor de Mercado',
    ]);
  });

  it('mantém identificadores únicos e resolve um serviço pelo identificador', () => {
    expect(new Set(SERVICES.map((service) => service.id)).size).toBe(SERVICES.length);
    expect(getServiceById('analise-valor-mercado')?.name).toBe(
      'Análise de Valor de Mercado',
    );
  });
});
