import type { Service, ServiceCategory } from "@/domain/types";

const categories: ReadonlyArray<Omit<ServiceCategory, 'services'>> = [
  {
    id: 'orientacao-geral',
    name: 'Orientação geral',
    description: 'Entenda a situação do imóvel e qual caminho seguir.',
  },
  {
    id: 'regularizacao-registro',
    name: 'Regularização e registro',
    description: 'Organize registros, áreas e informações oficiais do imóvel.',
  },
  {
    id: 'posse-sucessao',
    name: 'Posse e sucessão',
    description: 'Cuide de situações de posse ou transferência por sucessão.',
  },
  {
    id: 'terrenos',
    name: 'Terrenos',
    description: 'Prepare a divisão e a documentação de terrenos.',
  },
  {
    id: 'avaliacao',
    name: 'Avaliação',
    description: 'Compreenda o valor de mercado com critérios objetivos.',
  },
];

const serviceDefinitions: readonly Service[] = [
  {
    id: 'regularizacao-imoveis',
    categoryId: 'orientacao-geral',
    name: 'Regularização de imóveis',
    description: 'Diagnóstico inicial para organizar a situação documental do imóvel.',
  },
  {
    id: 'escritura',
    categoryId: 'regularizacao-registro',
    name: 'Escritura',
    description: 'Orientação para reunir as informações necessárias à escritura.',
  },
  {
    id: 'averbacao',
    categoryId: 'regularizacao-registro',
    name: 'Averbação',
    description: 'Preparação de alterações que precisam constar na matrícula.',
  },
  {
    id: 'retificacao-area',
    categoryId: 'regularizacao-registro',
    name: 'Retificação de área',
    description: 'Organização dos dados para corrigir medidas e confrontações.',
  },
  {
    id: 'regularizacao-prefeitura-cartorio',
    categoryId: 'regularizacao-registro',
    name: 'Regularização em prefeitura/cartório',
    description: 'Acompanhamento orientado de exigências administrativas e registrais.',
  },
  {
    id: 'usucapiao',
    categoryId: 'posse-sucessao',
    name: 'Usucapião',
    description: 'Levantamento inicial de documentos e evidências de posse.',
  },
  {
    id: 'inventario-imobiliario',
    categoryId: 'posse-sucessao',
    name: 'Inventário imobiliário',
    description: 'Organização dos imóveis e documentos envolvidos na sucessão.',
  },
  {
    id: 'desmembramento-terreno',
    categoryId: 'terrenos',
    name: 'Desmembramento de terreno',
    description: 'Preparação das informações para dividir uma área em novos lotes.',
  },
  {
    id: 'analise-valor-mercado',
    categoryId: 'avaliacao',
    name: 'Análise de Valor de Mercado',
    description: 'Leitura inicial do imóvel a partir de características e referências.',
  },
];

export const SERVICES: readonly Service[] = Object.freeze(
  serviceDefinitions.map((service) => Object.freeze(service)),
);

export const SERVICE_CATEGORIES: readonly ServiceCategory[] = Object.freeze(
  categories.map((category) =>
    Object.freeze({
      ...category,
      services: Object.freeze(
        SERVICES.filter((service) => service.categoryId === category.id),
      ),
    }),
  ),
);

export function getServiceById(serviceId: string) {
  return SERVICES.find((service) => service.id === serviceId);
}
