-- Baseline document type catalog. Service-specific requirements remain configurable.

insert into public.document_types (slug, name, description, active)
values
  ('identificacao', 'Documento de identificação', 'RG, CNH ou documento equivalente.', true),
  ('cpf', 'CPF', 'Comprovante ou documento contendo o CPF.', true),
  ('matricula-imovel', 'Matrícula do imóvel', 'Certidão ou cópia atualizada da matrícula.', true),
  ('iptu', 'IPTU', 'Carnê, guia ou espelho cadastral do IPTU.', true),
  ('contrato', 'Contrato', 'Contrato relacionado ao imóvel ou à negociação.', true),
  ('fotos-imovel', 'Fotos do imóvel', 'Imagens necessárias para análise do imóvel.', true)
on conflict (slug) do nothing;

-- Private Storage bucket. Objects must follow:
-- {case_id}/{case_document_id}/{unique_filename}

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'case-documents',
  'case-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.can_access_case_storage(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_case_id uuid;
  target_case_document_id uuid;
begin
  if object_name is null or object_name !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[^/]+$' then
    return false;
  end if;

  target_case_id := split_part(object_name, '/', 1)::uuid;
  target_case_document_id := split_part(object_name, '/', 2)::uuid;

  return exists (
    select 1
    from public.case_documents cd
    where cd.id = target_case_document_id
      and cd.case_id = target_case_id
      and private.can_access_case(cd.case_id)
  );
exception
  when invalid_text_representation then
    return false;
end;
$$;

revoke all on function private.can_access_case_storage(text) from public, anon;
grant execute on function private.can_access_case_storage(text) to authenticated;

create policy "case_documents_storage_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'case-documents'
  and (select private.can_access_case_storage(name))
);

create policy "case_documents_storage_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'case-documents'
  and owner_id = (select auth.uid()::text)
  and (select private.can_access_case_storage(name))
);
;
