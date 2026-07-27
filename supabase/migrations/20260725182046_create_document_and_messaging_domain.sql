-- Harden public catalog policies for anonymous callers.

drop policy "service_categories_read_active_or_admin" on public.service_categories;
create policy "service_categories_read_active"
on public.service_categories for select
to anon, authenticated
using (active);

drop policy "services_read_active_or_admin" on public.services;
create policy "services_read_active"
on public.services for select
to anon, authenticated
using (
  active and exists (
    select 1 from public.service_categories sc
    where sc.id = services.category_id and sc.active
  )
);

-- Protocols are database-owned and immutable.

create or replace function private.assign_case_protocol()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.protocol := 'VRT-' || pg_catalog.to_char(pg_catalog.now(), 'YYYY') || '-' ||
    pg_catalog.lpad(pg_catalog.nextval('private.case_protocol_seq'::regclass)::text, 6, '0');
  return new;
end;
$$;

create or replace function private.increment_case_lock_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.protocol := old.protocol;
  new.lock_version := old.lock_version + 1;
  return new;
end;
$$;

-- CPF fields are intentionally unavailable through direct authenticated API writes.

revoke insert, update on public.property_parties from authenticated;
grant insert (property_id, user_id, name, relation_type)
  on public.property_parties to authenticated;
grant update (user_id, name, relation_type)
  on public.property_parties to authenticated;

-- Document catalogs and requirements.

create table public.document_types (
  id uuid primary key default gen_random_uuid(),
  slug varchar(100) not null unique,
  name varchar(160) not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_types_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.service_document_requirements (
  service_id uuid not null references public.services(id) on delete restrict,
  document_type_id uuid not null references public.document_types(id) on delete restrict,
  required boolean not null default true,
  display_order integer not null default 0 check (display_order >= 0),
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (service_id, document_type_id)
);

create index service_document_requirements_order_idx
  on public.service_document_requirements (service_id, display_order);

-- Requested document items and immutable versions.

create table public.case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.consulting_cases(id) on delete restrict,
  document_type_id uuid not null references public.document_types(id) on delete restrict,
  label varchar(180) not null,
  required boolean not null default true,
  status varchar(30) not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint case_documents_status_check check (
    status in ('pending', 'submitted', 'under_review', 'approved', 'rejected', 'waived')
  ),
  unique (case_id, document_type_id)
);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  case_document_id uuid not null references public.case_documents(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  storage_disk varchar(40) not null default 'supabase',
  storage_key text not null,
  original_filename varchar(255) not null,
  mime_type varchar(150) not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  sha256 char(64) not null,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  malware_scan_status varchar(20) not null default 'pending',
  malware_scanned_at timestamptz,
  deleted_at timestamptz,
  constraint document_versions_filename_not_blank check (btrim(original_filename) <> ''),
  constraint document_versions_storage_key_not_blank check (btrim(storage_key) <> ''),
  constraint document_versions_sha256_format check (sha256 ~ '^[0-9a-f]{64}$'),
  constraint document_versions_scan_status_check check (
    malware_scan_status in ('pending', 'clean', 'infected', 'failed')
  ),
  unique (case_document_id, version_number),
  unique (storage_disk, storage_key)
);

create table public.document_reviews (
  id uuid primary key default gen_random_uuid(),
  document_version_id uuid not null references public.document_versions(id) on delete restrict,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  decision varchar(20) not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint document_reviews_decision_check check (decision in ('approved', 'rejected')),
  constraint document_reviews_rejection_reason_check check (
    decision <> 'rejected' or nullif(btrim(reason), '') is not null
  )
);

create index case_documents_case_status_idx
  on public.case_documents (case_id, status, updated_at desc);

create index case_documents_status_updated_idx
  on public.case_documents (status, updated_at desc);

create index document_versions_document_submitted_idx
  on public.document_versions (case_document_id, submitted_at desc);

create index document_versions_scan_status_idx
  on public.document_versions (malware_scan_status)
  where deleted_at is null;

create index document_reviews_version_created_idx
  on public.document_reviews (document_version_id, created_at desc);

-- Case messaging is operational domain data, not an AI feature.

create table public.case_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.consulting_cases(id) on delete restrict,
  sender_id uuid references public.profiles(id) on delete restrict,
  message_type varchar(20) not null default 'user',
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint case_messages_type_check check (message_type in ('user', 'system')),
  constraint case_messages_body_not_blank check (btrim(body) <> ''),
  constraint case_messages_sender_check check (
    (message_type = 'user' and sender_id is not null)
    or (message_type = 'system')
  )
);

create index case_messages_case_created_idx
  on public.case_messages (case_id, created_at desc);

-- Database-owned document version numbering.

create or replace function private.assign_document_version_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1
  from public.case_documents
  where id = new.case_document_id
  for update;

  if not found then
    raise exception 'case document not found';
  end if;

  select coalesce(max(dv.version_number), 0) + 1
    into new.version_number
  from public.document_versions dv
  where dv.case_document_id = new.case_document_id;

  return new;
end;
$$;

revoke all on function private.assign_document_version_number() from public, anon, authenticated;

create trigger document_versions_assign_number
before insert on public.document_versions
for each row execute function private.assign_document_version_number();

create or replace function private.mark_document_submitted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.case_documents
  set status = 'submitted'
  where id = new.case_document_id;
  return new;
end;
$$;

revoke all on function private.mark_document_submitted() from public, anon, authenticated;

create trigger document_versions_mark_submitted
after insert on public.document_versions
for each row execute function private.mark_document_submitted();

create or replace function private.apply_document_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.case_documents cd
  set status = case when new.decision = 'approved' then 'approved' else 'rejected' end
  from public.document_versions dv
  where dv.id = new.document_version_id
    and cd.id = dv.case_document_id;
  return new;
end;
$$;

revoke all on function private.apply_document_review() from public, anon, authenticated;

create trigger document_reviews_apply_decision
after insert on public.document_reviews
for each row execute function private.apply_document_review();

create or replace function private.populate_case_document_requirements()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.case_documents (case_id, document_type_id, label, required, status)
  select new.id, sdr.document_type_id, dt.name, sdr.required, 'pending'
  from public.service_document_requirements sdr
  join public.document_types dt on dt.id = sdr.document_type_id
  where sdr.service_id = new.service_id
  on conflict (case_id, document_type_id) do nothing;
  return new;
end;
$$;

revoke all on function private.populate_case_document_requirements() from public, anon, authenticated;

create trigger consulting_cases_populate_documents
after insert on public.consulting_cases
for each row execute function private.populate_case_document_requirements();

-- Backfill any cases created between migrations.

insert into public.case_documents (case_id, document_type_id, label, required, status)
select cc.id, sdr.document_type_id, dt.name, sdr.required, 'pending'
from public.consulting_cases cc
join public.service_document_requirements sdr on sdr.service_id = cc.service_id
join public.document_types dt on dt.id = sdr.document_type_id
on conflict (case_id, document_type_id) do nothing;

-- updated_at triggers.

create trigger document_types_set_updated_at
before update on public.document_types
for each row execute function public.set_updated_at();

create trigger service_document_requirements_set_updated_at
before update on public.service_document_requirements
for each row execute function public.set_updated_at();

create trigger case_documents_set_updated_at
before update on public.case_documents
for each row execute function public.set_updated_at();

-- Explicit privileges.

revoke all on public.document_types, public.service_document_requirements,
  public.case_documents, public.document_versions, public.document_reviews,
  public.case_messages from anon, authenticated;

grant select, insert, update, delete on public.document_types,
  public.service_document_requirements to authenticated;
grant select, insert, update on public.case_documents to authenticated;
grant select, insert, update on public.document_versions to authenticated;
grant select, insert on public.document_reviews, public.case_messages to authenticated;

-- RLS.

alter table public.document_types enable row level security;
alter table public.service_document_requirements enable row level security;
alter table public.case_documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_reviews enable row level security;
alter table public.case_messages enable row level security;

create policy "document_types_select_active_or_admin"
on public.document_types for select
to authenticated
using (active or (select private.has_role('admin')));

create policy "document_types_manage_admin"
on public.document_types for all
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));

create policy "service_requirements_select_authenticated"
on public.service_document_requirements for select
to authenticated
using (true);

create policy "service_requirements_manage_admin"
on public.service_document_requirements for all
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));

create policy "case_documents_select_case_access"
on public.case_documents for select
to authenticated
using ((select private.can_access_case(case_id)));

create policy "case_documents_manage_admin"
on public.case_documents for all
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));

create policy "document_versions_select_case_access"
on public.document_versions for select
to authenticated
using (
  exists (
    select 1 from public.case_documents cd
    where cd.id = document_versions.case_document_id
      and (select private.can_access_case(cd.case_id))
  )
);

create policy "document_versions_insert_case_access"
on public.document_versions for insert
to authenticated
with check (
  submitted_by = (select auth.uid())
  and deleted_at is null
  and exists (
    select 1 from public.case_documents cd
    where cd.id = document_versions.case_document_id
      and (select private.can_access_case(cd.case_id))
  )
);

create policy "document_versions_update_admin"
on public.document_versions for update
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));

create policy "document_reviews_select_case_access"
on public.document_reviews for select
to authenticated
using (
  exists (
    select 1
    from public.document_versions dv
    join public.case_documents cd on cd.id = dv.case_document_id
    where dv.id = document_reviews.document_version_id
      and (select private.can_access_case(cd.case_id))
  )
);

create policy "document_reviews_insert_admin"
on public.document_reviews for insert
to authenticated
with check (
  reviewer_id = (select auth.uid())
  and (select private.has_role('admin'))
);

create policy "case_messages_select_case_access"
on public.case_messages for select
to authenticated
using ((select private.can_access_case(case_id)));

create policy "case_messages_insert_case_access"
on public.case_messages for insert
to authenticated
with check (
  (select private.can_access_case(case_id))
  and (
    (message_type = 'user' and sender_id = (select auth.uid()))
    or (message_type = 'system' and (select private.has_role('admin')))
  )
);
;
