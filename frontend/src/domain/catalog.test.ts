import { describe, expect, it } from 'vitest';

import { SERVICE_CATEGORIES, SERVICES, getServiceById } from "@/domain/catalog";

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

  it('impede mutações do catálogo e preserva a identidade usada na consulta', () => {
    const service = SERVICE_CATEGORIES[0].services[0];
    const originalName = service.name;
    const originalServiceCount = SERVICES.length;
    const originalCategoryCount = SERVICE_CATEGORIES.length;
    const forgedService = {
      id: 'servico-injetado',
      categoryId: SERVICE_CATEGORIES[0].id,
      name: 'Serviço injetado',
      description: 'Não deve entrar no catálogo.',
    };

    const attemptMutation = (mutation: () => void) => {
      try {
        mutation();
      } catch {
        // Frozen exports reject writes in strict mode.
      }
    };

    attemptMutation(() => {
      (SERVICES as unknown as typeof forgedService[]).push(forgedService);
    });
    attemptMutation(() => {
      (
        SERVICE_CATEGORIES as unknown as Array<{
          id: string;
          name: string;
          description: string;
          services: typeof forgedService[];
        }>
      ).push({
        id: 'categoria-injetada',
        name: 'Categoria injetada',
        description: 'Não deve entrar no catálogo.',
        services: [forgedService],
      });
    });
    attemptMutation(() => {
      (service as unknown as { name: string }).name = 'Nome adulterado';
    });

    expect(SERVICES).toHaveLength(originalServiceCount);
    expect(SERVICE_CATEGORIES).toHaveLength(originalCategoryCount);
    expect(getServiceById(forgedService.id)).toBeUndefined();
    expect(getServiceById(service.id)).toBe(service);
    expect(getServiceById(service.id)?.name).toBe(originalName);
  });
});
