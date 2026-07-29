-- Align document types and requirements with frontend/src/infrastructure/demo/seed.ts.

insert into public.document_types (slug, name, description, active)
values
  ('rg-cpf', 'RG/CPF', 'Documento de identificação com CPF do titular.', true),
  ('comprovante-residencia', 'Comprovante de residência', 'Conta recente ou outro comprovante de residência aceito.', true),
  ('contrato-compra-venda', 'Contrato de compra e venda', 'Contrato particular relacionado à aquisição ou negociação do imóvel.', true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  active = excluded.active;

-- These previous generic types are superseded by the frontend-compatible types.
update public.document_types
set active = false
where slug in ('identificacao', 'cpf', 'contrato');

insert into public.service_document_requirements (
  service_id,
  document_type_id,
  required,
  display_order,
  instructions
)
select
  s.id,
  dt.id,
  requirement.required,
  requirement.display_order,
  requirement.instructions
from public.services s
cross join (
  values
    ('rg-cpf', true, 10, 'Envie RG e CPF do titular em arquivo legível.'),
    ('comprovante-residencia', true, 20, 'Envie um comprovante de residência recente.'),
    ('matricula-imovel', true, 30, 'Envie a certidão ou cópia disponível da matrícula do imóvel.'),
    ('iptu', true, 40, 'Envie o carnê, guia ou espelho cadastral do IPTU.'),
    ('contrato-compra-venda', true, 50, 'Envie o contrato de compra e venda relacionado ao imóvel.'),
    ('fotos-imovel', false, 60, 'Opcional: envie fotos externas e internas que ajudem na análise.')
) as requirement(document_slug, required, display_order, instructions)
join public.document_types dt on dt.slug = requirement.document_slug
where s.slug in (
  'regularizacao-imoveis',
  'escritura',
  'averbacao',
  'retificacao-area',
  'regularizacao-prefeitura-cartorio',
  'usucapiao',
  'inventario-imobiliario',
  'desmembramento-terreno',
  'analise-valor-mercado'
)
on conflict (service_id, document_type_id) do update
set
  required = excluded.required,
  display_order = excluded.display_order,
  instructions = excluded.instructions;
;
