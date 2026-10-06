-- Update private.create_notification to also enqueue an outbox message

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
declare
  inserted_notification_id uuid;
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
  )
  returning id into inserted_notification_id;

  insert into public.notification_deliveries (
    notification_id, channel, status
  ) values (
    inserted_notification_id,
    'email',
    'queued'
  );
end;
$$;

-- Ativar o Realtime para a tabela de notificações (necessário para o Sino in-app da Fase 4)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
