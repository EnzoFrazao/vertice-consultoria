-- Fires the dispatch-notifications Edge Function whenever a delivery is queued.
-- Project-specific values live in Vault (never in the repo):
--   dispatch_url    -> https://<project-ref>.supabase.co/functions/v1/dispatch-notifications
--   dispatch_secret -> same value as the DISPATCH_SECRET Edge Function secret
-- If they are missing, or the HTTP call fails, the insert still succeeds and the
-- delivery simply stays 'queued' for a later retry.

create extension if not exists pg_net with schema extensions;

create or replace function private.trigger_dispatch_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  function_url text;
  function_secret text;
begin
  select decrypted_secret into function_url
  from vault.decrypted_secrets where name = 'dispatch_url' limit 1;

  select decrypted_secret into function_secret
  from vault.decrypted_secrets where name = 'dispatch_secret' limit 1;

  if function_url is null or function_secret is null then
    return new;
  end if;

  perform net.http_post(
    url := function_url,
    body := jsonb_build_object('delivery_id', new.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-dispatch-secret', function_secret
    ),
    timeout_milliseconds := 5000
  );

  return new;
exception when others then
  raise warning 'dispatch-notifications trigger failed: %', sqlerrm;
  return new;
end;
$$;

revoke all on function private.trigger_dispatch_notifications() from public, anon, authenticated;

create trigger notification_deliveries_dispatch
after insert on public.notification_deliveries
for each row
when (new.channel = 'email' and new.status = 'queued')
execute function private.trigger_dispatch_notifications();
