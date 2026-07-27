-- Process history and timeline.

create table public.case_status_history (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.consulting_cases(id) on delete restrict,
  from_phase varchar(40),
  to_phase varchar(40) not null,
  from_waiting_on varchar(20),
  to_waiting_on varchar(20),
  reason text,
  changed_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.consulting_cases(id) on delete restrict,
  type varchar(60) not null,
  title varchar(200) not null,
  description text,
  actor_id uuid references public.profiles(id) on delete restrict,
  actor_role_snapshot varchar(40),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint case_events_type_not_blank check (btrim(type) <> ''),
  constraint case_events_title_not_blank check (btrim(title) <> '')
);

create index case_status_history_case_created_idx
  on public.case_status_history (case_id, created_at desc);

create index case_events_case_created_idx
  on public.case_events (case_id, created_at desc);

-- Administrative audit trail.

create table public.audit_logs (
  id bigint generated always as identity primary key,
  schema_name text not null,
  table_name text not null,
  record_id text,
  action varchar(10) not null,
  actor_id uuid references public.profiles(id) on delete restrict,
  ip_address inet,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_check check (action in ('INSERT', 'UPDATE', 'DELETE'))
);

create index audit_logs_entity_record_idx
  on public.audit_logs (schema_name, table_name, record_id, created_at desc);

create index audit_logs_actor_created_idx
  on public.audit_logs (actor_id, created_at desc);

-- In-app notifications and optional provider deliveries.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  case_id uuid references public.consulting_cases(id) on delete restrict,
  case_document_id uuid references public.case_documents(id) on delete restrict,
  type varchar(60) not null,
  title varchar(200) not null,
  message text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint notifications_type_not_blank check (btrim(type) <> ''),
  constraint notifications_title_not_blank check (btrim(title) <> ''),
  constraint notifications_message_not_blank check (btrim(message) <> '')
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete restrict,
  channel varchar(20) not null,
  status varchar(20) not null default 'queued',
  provider_message_id text,
  attempted_at timestamptz,
  delivered_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_deliveries_channel_check check (channel in ('in_app', 'email', 'whatsapp')),
  constraint notification_deliveries_status_check check (status in ('queued', 'sent', 'delivered', 'failed'))
);

create index notifications_user_unread_created_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

create index notifications_user_read_created_idx
  on public.notifications (user_id, read_at, created_at desc);

create index notification_deliveries_status_created_idx
  on public.notification_deliveries (status, created_at)
  where status in ('queued', 'failed');

create trigger notification_deliveries_set_updated_at
before update on public.notification_deliveries
for each row execute function public.set_updated_at();

-- Complete case transitions automatically.

create or replace function private.increment_case_lock_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.protocol := old.protocol;
  new.lock_version := old.lock_version + 1;

  if new.phase = 'completed' and new.completed_at is null then
    new.completed_at := pg_catalog.now();
  end if;

  return new;
end;
$$;

-- Internal notification helper. It is deliberately unavailable through the API.

create or replace function private.create_notification(
  target_user_id uuid,
  target_case_id uuid,
  target_case_document_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  notification_data jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_user_id is null then
    return;
  end if;

  insert into public.notifications (
    user_id, case_id, case_document_id, type, title, message, data
  ) values (
    target_user_id,
    target_case_id,
    target_case_document_id,
    notification_type,
    notification_title,
    notification_message,
    coalesce(notification_data, '{}'::jsonb)
  );
end;
$$;

revoke all on function private.create_notification(uuid, uuid, uuid, text, text, text, jsonb)
  from public, anon, authenticated;

-- Case lifecycle triggers.

create or replace function private.record_case_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.case_events (
    case_id, type, title, description, actor_id, actor_role_snapshot, metadata
  ) values (
    new.id,
    'case_opened',
    'Processo aberto',
    'O processo de consultoria foi iniciado.',
    auth.uid(),
    case when private.has_role('admin') then 'admin' when auth.uid() is not null then 'client' else 'system' end,
    jsonb_build_object('phase', new.phase, 'protocol', new.protocol)
  );
  return new;
end;
$$;

revoke all on function private.record_case_created() from public, anon, authenticated;

create trigger consulting_cases_record_created
after insert on public.consulting_cases
for each row execute function private.record_case_created();

create or replace function private.record_case_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.phase is not distinct from new.phase
     and old.waiting_on is not distinct from new.waiting_on
     and old.waiting_reason is not distinct from new.waiting_reason then
    return new;
  end if;

  insert into public.case_status_history (
    case_id, from_phase, to_phase, from_waiting_on, to_waiting_on,
    reason, changed_by
  ) values (
    new.id, old.phase, new.phase, old.waiting_on, new.waiting_on,
    new.waiting_reason, auth.uid()
  );

  insert into public.case_events (
    case_id, type, title, description, actor_id, actor_role_snapshot, metadata
  ) values (
    new.id,
    'status_changed',
    'Andamento do processo atualizado',
    new.waiting_reason,
    auth.uid(),
    case when private.has_role('admin') then 'admin' when auth.uid() is not null then 'client' else 'system' end,
    jsonb_build_object(
      'from_phase', old.phase,
      'to_phase', new.phase,
      'from_waiting_on', old.waiting_on,
      'to_waiting_on', new.waiting_on
    )
  );

  if auth.uid() is distinct from new.client_id then
    perform private.create_notification(
      new.client_id,
      new.id,
      null,
      'case_status_changed',
      'Seu processo foi atualizado',
      'A fase ou a condição de espera do processo ' || new.protocol || ' foi alterada.',
      jsonb_build_object('phase', new.phase, 'waiting_on', new.waiting_on)
    );
  end if;

  return new;
end;
$$;

revoke all on function private.record_case_status_change() from public, anon, authenticated;

create trigger consulting_cases_record_status_change
after update of phase, waiting_on, waiting_reason on public.consulting_cases
for each row execute function private.record_case_status_change();

-- Document events and notifications.

create or replace function private.record_document_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_case public.consulting_cases%rowtype;
  target_document public.case_documents%rowtype;
  admin_user record;
begin
  select cd.* into target_document
  from public.case_documents cd
  where cd.id = new.case_document_id;

  select cc.* into target_case
  from public.consulting_cases cc
  where cc.id = target_document.case_id;

  insert into public.case_events (
    case_id, type, title, description, actor_id, actor_role_snapshot, metadata
  ) values (
    target_case.id,
    'document_submitted',
    'Documento enviado',
    target_document.label,
    new.submitted_by,
    case when private.has_role('admin') then 'admin' else 'client' end,
    jsonb_build_object(
      'case_document_id', target_document.id,
      'document_version_id', new.id,
      'version_number', new.version_number
    )
  );

  if new.submitted_by = target_case.client_id then
    for admin_user in
      select distinct ur.user_id
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      join public.profiles p on p.id = ur.user_id
      where r.code = 'admin' and p.disabled_at is null
    loop
      perform private.create_notification(
        admin_user.user_id,
        target_case.id,
        target_document.id,
        'document_submitted',
        'Novo documento enviado',
        'O cliente enviou ' || target_document.label || ' no processo ' || target_case.protocol || '.',
        jsonb_build_object('document_version_id', new.id)
      );
    end loop;
  elsif new.submitted_by is distinct from target_case.client_id then
    perform private.create_notification(
      target_case.client_id,
      target_case.id,
      target_document.id,
      'document_submitted',
      'Documento adicionado ao processo',
      target_document.label || ' foi adicionado ao processo ' || target_case.protocol || '.',
      jsonb_build_object('document_version_id', new.id)
    );
  end if;

  return new;
end;
$$;

revoke all on function private.record_document_submission() from public, anon, authenticated;

create trigger document_versions_record_submission
after insert on public.document_versions
for each row execute function private.record_document_submission();

create or replace function private.record_document_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_case_id uuid;
  target_client_id uuid;
  target_protocol text;
  target_case_document_id uuid;
  target_label text;
begin
  select cc.id, cc.client_id, cc.protocol, cd.id, cd.label
    into target_case_id, target_client_id, target_protocol,
         target_case_document_id, target_label
  from public.document_versions dv
  join public.case_documents cd on cd.id = dv.case_document_id
  join public.consulting_cases cc on cc.id = cd.case_id
  where dv.id = new.document_version_id;

  insert into public.case_events (
    case_id, type, title, description, actor_id, actor_role_snapshot, metadata
  ) values (
    target_case_id,
    'document_reviewed',
    case when new.decision = 'approved' then 'Documento aprovado' else 'Documento rejeitado' end,
    coalesce(new.reason, target_label),
    new.reviewer_id,
    'admin',
    jsonb_build_object(
      'case_document_id', target_case_document_id,
      'document_version_id', new.document_version_id,
      'decision', new.decision
    )
  );

  perform private.create_notification(
    target_client_id,
    target_case_id,
    target_case_document_id,
    'document_reviewed',
    case when new.decision = 'approved' then 'Documento aprovado' else 'Documento precisa ser reenviado' end,
    case when new.decision = 'approved'
      then target_label || ' foi aprovado no processo ' || target_protocol || '.'
      else target_label || ' foi rejeitado. Consulte o motivo e envie uma nova versão.'
    end,
    jsonb_build_object('document_version_id', new.document_version_id, 'decision', new.decision)
  );

  return new;
end;
$$;

revoke all on function private.record_document_review() from public, anon, authenticated;

create trigger document_reviews_record_review
after insert on public.document_reviews
for each row execute function private.record_document_review();

-- Message notifications.

create or replace function private.record_case_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_case public.consulting_cases%rowtype;
  admin_user record;
begin
  select * into target_case
  from public.consulting_cases
  where id = new.case_id;

  insert into public.case_events (
    case_id, type, title, actor_id, actor_role_snapshot, metadata
  ) values (
    new.case_id,
    'message_sent',
    case when new.message_type = 'system' then 'Atualização do sistema' else 'Nova mensagem' end,
    new.sender_id,
    case when private.has_role('admin') then 'admin' when new.sender_id is not null then 'client' else 'system' end,
    jsonb_build_object('message_id', new.id, 'message_type', new.message_type)
  );

  if new.sender_id = target_case.client_id then
    for admin_user in
      select distinct ur.user_id
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      join public.profiles p on p.id = ur.user_id
      where r.code = 'admin' and p.disabled_at is null
    loop
      perform private.create_notification(
        admin_user.user_id,
        target_case.id,
        null,
        'case_message',
        'Nova mensagem do cliente',
        'Há uma nova mensagem no processo ' || target_case.protocol || '.',
        jsonb_build_object('message_id', new.id)
      );
    end loop;
  elsif new.sender_id is distinct from target_case.client_id then
    perform private.create_notification(
      target_case.client_id,
      target_case.id,
      null,
      'case_message',
      'Nova mensagem no seu processo',
      'Há uma nova mensagem no processo ' || target_case.protocol || '.',
      jsonb_build_object('message_id', new.id)
    );
  end if;

  return new;
end;
$$;

revoke all on function private.record_case_message() from public, anon, authenticated;

create trigger case_messages_record_message
after insert on public.case_messages
for each row execute function private.record_case_message();

-- Generic append-only audit function.

create or replace function private.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_data jsonb;
  new_data jsonb;
  entity_id text;
begin
  if tg_op = 'INSERT' then
    new_data := to_jsonb(new);
    entity_id := new_data ->> 'id';
  elsif tg_op = 'UPDATE' then
    old_data := to_jsonb(old);
    new_data := to_jsonb(new);
    entity_id := coalesce(new_data ->> 'id', old_data ->> 'id');
  else
    old_data := to_jsonb(old);
    entity_id := old_data ->> 'id';
  end if;

  insert into public.audit_logs (
    schema_name, table_name, record_id, action,
    actor_id, old_values, new_values
  ) values (
    tg_table_schema, tg_table_name, entity_id, tg_op,
    auth.uid(), old_data, new_data
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.write_audit_log() from public, anon, authenticated;

create trigger audit_consulting_cases
after insert or update or delete on public.consulting_cases
for each row execute function private.write_audit_log();

create trigger audit_case_documents
after insert or update or delete on public.case_documents
for each row execute function private.write_audit_log();

create trigger audit_document_versions
after insert or update or delete on public.document_versions
for each row execute function private.write_audit_log();

create trigger audit_document_reviews
after insert or update or delete on public.document_reviews
for each row execute function private.write_audit_log();

create trigger audit_services
after insert or update or delete on public.services
for each row execute function private.write_audit_log();

-- Explicit privileges and RLS.

revoke all on public.case_status_history, public.case_events, public.audit_logs,
  public.notifications, public.notification_deliveries from anon, authenticated;

grant select on public.case_status_history, public.case_events to authenticated;
grant insert on public.case_events to authenticated;
grant select on public.audit_logs to authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant select on public.notification_deliveries to authenticated;

alter table public.case_status_history enable row level security;
alter table public.case_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_deliveries enable row level security;

create policy "case_status_history_select_case_access"
on public.case_status_history for select
to authenticated
using ((select private.can_access_case(case_id)));

create policy "case_events_select_case_access"
on public.case_events for select
to authenticated
using ((select private.can_access_case(case_id)));

create policy "case_events_insert_admin"
on public.case_events for insert
to authenticated
with check (
  (select private.has_role('admin'))
  and (actor_id = (select auth.uid()) or actor_id is null)
);

create policy "audit_logs_select_admin"
on public.audit_logs for select
to authenticated
using ((select private.has_role('admin')));

create policy "notifications_select_owner_or_admin"
on public.notifications for select
to authenticated
using (user_id = (select auth.uid()) or (select private.has_role('admin')));

create policy "notifications_mark_read_owner_or_admin"
on public.notifications for update
to authenticated
using (user_id = (select auth.uid()) or (select private.has_role('admin')))
with check (user_id = (select auth.uid()) or (select private.has_role('admin')));

create policy "notification_deliveries_select_admin"
on public.notification_deliveries for select
to authenticated
using ((select private.has_role('admin')));
;
