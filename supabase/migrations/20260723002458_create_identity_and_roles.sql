-- =========================================================
-- IDENTIDADE E AUTORIZAÇÃO
-- =========================================================

-- auth.users continua sendo responsável por:
-- e-mail de login, senha, confirmação e sessões.
--
-- public.profiles armazena somente dados do domínio.

create table public.profiles (
    id uuid primary key references auth.users(id) on delete restrict,

    name varchar(160) not null,
    email varchar(255) not null,

    email_verified_at timestamptz null,

    -- Esses campos não serão preenchidos diretamente pelo frontend.
    -- Posteriormente criaremos uma Edge Function para isso.
    cpf_encrypted text null,
    cpf_hash char(64) unique null,

    phone varchar(30) null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    disabled_at timestamptz null
);
-- Impede e-mails duplicados ignorando maiúsculas/minúsculas.
create unique index profiles_email_unique_ci
    on public.profiles (lower(email));
create table public.roles (
    id uuid primary key default gen_random_uuid(),

    code varchar(40) not null unique,
    name varchar(100) not null,

    created_at timestamptz not null default now()
);
create table public.user_roles (
    user_id uuid not null
        references public.profiles(id) on delete restrict,

    role_id uuid not null
        references public.roles(id) on delete restrict,

    created_at timestamptz not null default now(),

    primary key (user_id, role_id)
);
create table public.user_addresses (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id) on delete restrict,

    kind varchar(30) not null
        check (kind in ('residential', 'correspondence')),

    street varchar(180) not null,
    number varchar(30) not null,
    complement varchar(120) null,
    neighborhood varchar(120) not null,
    city varchar(120) not null,

    state char(2) not null
        check (state ~ '^[A-Z]{2}$'),

    -- Armazenaremos somente os oito números.
    -- A máscara 00000-000 pertence à apresentação.
    postal_code char(8) not null
        check (postal_code ~ '^[0-9]{8}$'),

    is_primary boolean not null default false,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
-- Cada usuário pode ter apenas um endereço principal de cada tipo.
create unique index user_addresses_primary_per_kind
    on public.user_addresses (user_id, kind)
    where is_primary = true;
-- Papéis iniciais do sistema.
insert into public.roles (code, name)
values
    ('client', 'Cliente'),
    ('admin', 'Administrador');
-- Ativamos RLS imediatamente.
-- Sem policies, o acesso pelas APIs públicas fica bloqueado por padrão.
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_addresses enable row level security;
-- =========================================================
-- TRIGGERS DE DATA
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();
create trigger user_addresses_set_updated_at
before update on public.user_addresses
for each row
execute function public.set_updated_at();
-- =========================================================
-- SINCRONIZAÇÃO ENTRE AUTH E PROFILES
-- =========================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    client_role_id uuid;
begin
    if new.email is null then
        raise exception 'O sistema exige cadastro com e-mail';
    end if;

    insert into public.profiles (
        id,
        name,
        email,
        email_verified_at
    )
    values (
        new.id,

        -- Usa o nome enviado no cadastro.
        -- Se não houver, usa a parte anterior ao @ do e-mail.
        coalesce(
            nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
            split_part(new.email, '@', 1)
        ),

        new.email,
        new.email_confirmed_at
    );

    select id
    into client_role_id
    from public.roles
    where code = 'client';

    if client_role_id is null then
        raise exception 'Papel client não foi encontrado';
    end if;

    insert into public.user_roles (
        user_id,
        role_id
    )
    values (
        new.id,
        client_role_id
    );

    return new;
end;
$$;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();
-- Se o usuário alterar ou confirmar o e-mail,
-- mantemos a projeção public.profiles sincronizada.

create or replace function public.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.profiles
    set
        email = new.email,
        email_verified_at = new.email_confirmed_at
    where id = new.id;

    return new;
end;
$$;
create trigger on_auth_user_email_updated
after update of email, email_confirmed_at on auth.users
for each row
execute function public.sync_auth_user_email();
-- Funções de trigger não devem ser chamadas pela API.

revoke execute on function public.set_updated_at()
from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user()
from public, anon, authenticated;
revoke execute on function public.sync_auth_user_email()
from public, anon, authenticated;
-- =========================================================
-- FUNÇÕES PRIVADAS DE AUTORIZAÇÃO
-- =========================================================

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create or replace function private.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.user_roles ur
        join public.roles r
            on r.id = ur.role_id
        where ur.user_id = (select auth.uid())
          and r.code = required_role
    );
$$;
revoke all on function private.has_role(text) from public;
grant execute on function private.has_role(text) to authenticated;
-- Remove privilégios automáticos antes de liberar somente o necessário.

revoke all on public.profiles from anon, authenticated;
revoke all on public.roles from anon, authenticated;
revoke all on public.user_roles from anon, authenticated;
revoke all on public.user_addresses from anon, authenticated;
-- Perfis podem ser consultados.
grant select on public.profiles to authenticated;
-- O usuário só poderá alterar nome e telefone diretamente.
grant update (name, phone)
on public.profiles
to authenticated;
-- Papéis podem ser consultados, mas não alterados.
grant select on public.roles to authenticated;
grant select on public.user_roles to authenticated;
-- Usuários poderão administrar os próprios endereços.
grant select, insert, update, delete
on public.user_addresses
to authenticated;
