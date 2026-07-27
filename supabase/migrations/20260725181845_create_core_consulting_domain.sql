-- Complete the identity access model left by the initial migration.

grant select on public.profiles to authenticated;
grant update (name, phone) on public.profiles to authenticated;
grant select on public.roles to authenticated;
grant select, insert, delete on public.user_roles to authenticated;
grant select, insert, update, delete on public.user_addresses to authenticated;

create policy "profiles_select_self_or_admin"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id or (select private.has_role('admin')));

create policy "profiles_update_self_or_admin"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id or (select private.has_role('admin')))
with check ((select auth.uid()) = id or (select private.has_role('admin')));

create policy "roles_select_authenticated"
on public.roles for select
to authenticated
using (true);

create policy "user_roles_select_self_or_admin"
on public.user_roles for select
to authenticated
using ((select auth.uid()) = user_id or (select private.has_role('admin')));

create policy "user_roles_insert_admin"
on public.user_roles for insert
to authenticated
with check ((select private.has_role('admin')));

create policy "user_roles_delete_admin"
on public.user_roles for delete
to authenticated
using ((select private.has_role('admin')));

create policy "addresses_select_owner_or_admin"
on public.user_addresses for select
to authenticated
using ((select auth.uid()) = user_id or (select private.has_role('admin')));

create policy "addresses_insert_owner_or_admin"
on public.user_addresses for insert
to authenticated
with check ((select auth.uid()) = user_id or (select private.has_role('admin')));

create policy "addresses_update_owner_or_admin"
on public.user_addresses for update
to authenticated
using ((select auth.uid()) = user_id or (select private.has_role('admin')))
with check ((select auth.uid()) = user_id or (select private.has_role('admin')));

create policy "addresses_delete_owner_or_admin"
on public.user_addresses for delete
to authenticated
using ((select auth.uid()) = user_id or (select private.has_role('admin')));

-- Service catalog.

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug varchar(100) not null unique,
  name varchar(160) not null,
  description text,
  display_order integer not null default 0 check (display_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories(id) on delete restrict,
  slug varchar(120) not null unique,
  name varchar(180) not null,
  description text,
  active boolean not null default true,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index services_category_order_idx
  on public.services (category_id, display_order, name);

create index service_categories_active_order_idx
  on public.service_categories (active, display_order, name);

-- Properties and their parties.

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  type varchar(40) not null,
  street varchar(180) not null,
  number varchar(30) not null,
  complement varchar(120),
  neighborhood varchar(120) not null,
  city varchar(120) not null,
  state char(2) not null,
  postal_code char(8) not null,
  registration_number varchar(80),
  registry_office varchar(160),
  iptu_number varchar(80),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_type_not_blank check (btrim(type) <> ''),
  constraint properties_state_format check (state ~ '^[A-Z]{2}$'),
  constraint properties_postal_code_format check (postal_code ~ '^[0-9]{8}$')
);

create table public.property_parties (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete restrict,
  user_id uuid references public.profiles(id) on delete restrict,
  name varchar(160) not null,
  cpf_encrypted text,
  cpf_hash char(64),
  relation_type varchar(30) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint property_parties_relation_type_check check (
    relation_type in ('owner', 'possessor', 'heir', 'buyer', 'seller', 'spouse', 'representative', 'other')
  )
);

create unique index property_parties_user_relation_unique_idx
  on public.property_parties (property_id, user_id, relation_type)
  where user_id is not null;

create unique index property_parties_cpf_unique_idx
  on public.property_parties (property_id, cpf_hash)
  where cpf_hash is not null;

create index properties_created_by_updated_idx
  on public.properties (created_by, updated_at desc);

create index properties_location_idx
  on public.properties (city, state);

-- Consulting cases. Phase and waiting condition are intentionally independent.

create sequence private.case_protocol_seq;

create table public.consulting_cases (
  id uuid primary key default gen_random_uuid(),
  protocol varchar(30) not null unique,
  client_id uuid not null references public.profiles(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  property_id uuid not null references public.properties(id) on delete restrict,
  objective text not null,
  phase varchar(40) not null default 'intake',
  waiting_on varchar(20),
  waiting_reason text,
  opened_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lock_version integer not null default 1 check (lock_version > 0),
  constraint consulting_cases_objective_not_blank check (btrim(objective) <> ''),
  constraint consulting_cases_phase_check check (
    phase in ('intake', 'document_collection', 'document_review', 'technical_analysis', 'external_processing', 'completed', 'cancelled')
  ),
  constraint consulting_cases_waiting_on_check check (
    waiting_on is null or waiting_on in ('client', 'team', 'registry_office', 'city_hall', 'third_party')
  ),
  constraint consulting_cases_waiting_reason_check check (
    waiting_on is not null or waiting_reason is null
  ),
  constraint consulting_cases_completed_at_check check (
    phase <> 'completed' or completed_at is not null
  )
);

create or replace function private.assign_case_protocol()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.protocol is null or btrim(new.protocol) = '' then
    new.protocol := 'VRT-' || pg_catalog.to_char(pg_catalog.now(), 'YYYY') || '-' ||
      pg_catalog.lpad(pg_catalog.nextval('private.case_protocol_seq'::regclass)::text, 6, '0');
  end if;
  return new;
end;
$$;

revoke all on function private.assign_case_protocol() from public, anon, authenticated;

create trigger consulting_cases_assign_protocol
before insert on public.consulting_cases
for each row execute function private.assign_case_protocol();

create or replace function private.increment_case_lock_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.lock_version := old.lock_version + 1;
  return new;
end;
$$;

revoke all on function private.increment_case_lock_version() from public, anon, authenticated;

create trigger consulting_cases_increment_lock_version
before update on public.consulting_cases
for each row execute function private.increment_case_lock_version();

create index consulting_cases_client_updated_idx
  on public.consulting_cases (client_id, updated_at desc);

create index consulting_cases_phase_updated_idx
  on public.consulting_cases (phase, updated_at desc);

create index consulting_cases_service_idx
  on public.consulting_cases (service_id);

create index consulting_cases_property_idx
  on public.consulting_cases (property_id);

create or replace function private.can_access_case(target_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.consulting_cases cc
    where cc.id = target_case_id
      and (cc.client_id = auth.uid() or private.has_role('admin'))
  );
$$;

revoke all on function private.can_access_case(uuid) from public, anon;
grant execute on function private.can_access_case(uuid) to authenticated;

-- updated_at triggers.

create trigger service_categories_set_updated_at
before update on public.service_categories
for each row execute function public.set_updated_at();

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create trigger property_parties_set_updated_at
before update on public.property_parties
for each row execute function public.set_updated_at();

create trigger consulting_cases_set_updated_at
before update on public.consulting_cases
for each row execute function public.set_updated_at();

-- Explicit API privileges.

revoke all on public.service_categories, public.services, public.properties,
  public.property_parties, public.consulting_cases from anon, authenticated;

revoke all on sequence private.case_protocol_seq from public, anon, authenticated;

grant select on public.service_categories, public.services to anon;
grant select, insert, update, delete on public.service_categories, public.services to authenticated;
grant select, insert, update on public.properties, public.property_parties, public.consulting_cases to authenticated;

-- RLS.

alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.properties enable row level security;
alter table public.property_parties enable row level security;
alter table public.consulting_cases enable row level security;

create policy "service_categories_read_active_or_admin"
on public.service_categories for select
to anon, authenticated
using (active or (select private.has_role('admin')));

create policy "service_categories_manage_admin"
on public.service_categories for all
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));

create policy "services_read_active_or_admin"
on public.services for select
to anon, authenticated
using (
  (active and exists (
    select 1 from public.service_categories sc
    where sc.id = services.category_id and sc.active
  ))
  or (select private.has_role('admin'))
);

create policy "services_manage_admin"
on public.services for all
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));

create policy "properties_select_accessible"
on public.properties for select
to authenticated
using (
  created_by = (select auth.uid())
  or (select private.has_role('admin'))
  or exists (
    select 1 from public.consulting_cases cc
    where cc.property_id = properties.id and cc.client_id = (select auth.uid())
  )
);

create policy "properties_insert_owner_or_admin"
on public.properties for insert
to authenticated
with check (created_by = (select auth.uid()) or (select private.has_role('admin')));

create policy "properties_update_owner_or_admin"
on public.properties for update
to authenticated
using (created_by = (select auth.uid()) or (select private.has_role('admin')))
with check (created_by = (select auth.uid()) or (select private.has_role('admin')));

create policy "property_parties_select_accessible"
on public.property_parties for select
to authenticated
using (
  (select private.has_role('admin'))
  or exists (
    select 1 from public.properties p
    where p.id = property_parties.property_id and p.created_by = (select auth.uid())
  )
  or exists (
    select 1
    from public.consulting_cases cc
    where cc.property_id = property_parties.property_id and cc.client_id = (select auth.uid())
  )
);

create policy "property_parties_insert_accessible"
on public.property_parties for insert
to authenticated
with check (
  (select private.has_role('admin'))
  or exists (
    select 1 from public.properties p
    where p.id = property_parties.property_id and p.created_by = (select auth.uid())
  )
);

create policy "property_parties_update_accessible"
on public.property_parties for update
to authenticated
using (
  (select private.has_role('admin'))
  or exists (
    select 1 from public.properties p
    where p.id = property_parties.property_id and p.created_by = (select auth.uid())
  )
)
with check (
  (select private.has_role('admin'))
  or exists (
    select 1 from public.properties p
    where p.id = property_parties.property_id and p.created_by = (select auth.uid())
  )
);

create policy "consulting_cases_select_client_or_admin"
on public.consulting_cases for select
to authenticated
using (client_id = (select auth.uid()) or (select private.has_role('admin')));

create policy "consulting_cases_insert_client_or_admin"
on public.consulting_cases for insert
to authenticated
with check (
  (select private.has_role('admin'))
  or (
    client_id = (select auth.uid())
    and phase = 'intake'
    and waiting_on is null
    and completed_at is null
  )
);

create policy "consulting_cases_update_admin"
on public.consulting_cases for update
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));
;
