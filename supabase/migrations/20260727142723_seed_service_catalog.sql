-- Seed the service catalog from frontend/src/domain/catalog.ts.
-- Frontend string IDs are preserved as stable slugs; database UUIDs remain the relational keys.

insert into public.service_categories (
  slug, name, description, display_order, active
)
values
  ('orientacao-geral', 'Orientação geral', 'Entenda a situação do imóvel e qual caminho seguir.', 10, true),
  ('regularizacao-registro', 'Regularização e registro', 'Organize registros, áreas e informações oficiais do imóvel.', 20, true),
  ('posse-sucessao', 'Posse e sucessão', 'Cuide de situações de posse ou transferência por sucessão.', 30, true),
  ('terrenos', 'Terrenos', 'Prepare a divisão e a documentação de terrenos.', 40, true),
  ('avaliacao', 'Avaliação', 'Compreenda o valor de mercado com critérios objetivos.', 50, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  active = excluded.active;

insert into public.services (
  category_id, slug, name, description, active, display_order
)
select sc.id, seed.slug, seed.name, seed.description, true, seed.display_order
from (
  values
    ('orientacao-geral', 'regularizacao-imoveis', 'Regularização de imóveis', 'Diagnóstico inicial para organizar a situação documental do imóvel.', 10),
    ('regularizacao-registro', 'escritura', 'Escritura', 'Orientação para reunir as informações necessárias à escritura.', 10),
    ('regularizacao-registro', 'averbacao', 'Averbação', 'Preparação de alterações que precisam constar na matrícula.', 20),
    ('regularizacao-registro', 'retificacao-area', 'Retificação de área', 'Organização dos dados para corrigir medidas e confrontações.', 30),
    ('regularizacao-registro', 'regularizacao-prefeitura-cartorio', 'Regularização em prefeitura/cartório', 'Acompanhamento orientado de exigências administrativas e registrais.', 40),
    ('posse-sucessao', 'usucapiao', 'Usucapião', 'Levantamento inicial de documentos e evidências de posse.', 10),
    ('posse-sucessao', 'inventario-imobiliario', 'Inventário imobiliário', 'Organização dos imóveis e documentos envolvidos na sucessão.', 20),
    ('terrenos', 'desmembramento-terreno', 'Desmembramento de terreno', 'Preparação das informações para dividir uma área em novos lotes.', 10),
    ('avaliacao', 'analise-valor-mercado', 'Análise de Valor de Mercado', 'Leitura inicial do imóvel a partir de características e referências.', 10)
) as seed(category_slug, slug, name, description, display_order)
join public.service_categories sc on sc.slug = seed.category_slug
on conflict (slug) do update
set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  active = excluded.active,
  display_order = excluded.display_order;
;
