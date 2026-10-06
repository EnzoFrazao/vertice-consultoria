-- Create an RPC to safely claim a batch of deliveries for processing
create or replace function public.claim_notification_deliveries(batch_size int)
returns setof public.notification_deliveries
language sql
security definer
as $$
  update public.notification_deliveries
  set 
    status = 'processing',
    attempted_at = now()
  where id in (
    select id 
    from public.notification_deliveries
    where status = 'queued' and channel = 'email'
    order by created_at asc
    limit batch_size
    for update skip locked
  )
  returning *;
$$;
