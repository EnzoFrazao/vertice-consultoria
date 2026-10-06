-- The status check constraint only allows queued/sent/delivered/failed, so a
-- 'processing' status is not possible. Claim rows with a short lease instead:
-- status stays 'queued' and attempted_at marks a claim made in the last 5 minutes.
create or replace function public.claim_notification_deliveries(batch_size int)
returns setof public.notification_deliveries
language sql
security definer
set search_path = ''
as $$
  update public.notification_deliveries
  set attempted_at = now()
  where id in (
    select id
    from public.notification_deliveries
    where status = 'queued'
      and channel = 'email'
      and (attempted_at is null or attempted_at < now() - interval '5 minutes')
    order by created_at asc
    limit batch_size
    for update skip locked
  )
  returning *;
$$;

revoke all on function public.claim_notification_deliveries(int) from public, anon, authenticated;
grant execute on function public.claim_notification_deliveries(int) to service_role;
