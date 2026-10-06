-- Outbox smoke test (dev project only; leaves test rows in the database).
-- Creates a client + an admin, a property and a case, then changes the case
-- phase as the admin. The status-change trigger must enqueue an email delivery.

do $$
declare
  v_client uuid := gen_random_uuid();
  v_admin uuid := gen_random_uuid();
  v_service uuid;
  v_property uuid;
  v_case uuid;
begin
  -- handle_new_auth_user creates the profile and the 'client' role automatically.
  insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
  values
    (v_client, 'authenticated', 'authenticated', 'outbox-client-' || substr(v_client::text, 1, 8) || '@example.com', now(), '{"name":"Cliente Teste"}', now(), now()),
    (v_admin, 'authenticated', 'authenticated', 'outbox-admin-' || substr(v_admin::text, 1, 8) || '@example.com', now(), '{"name":"Admin Teste"}', now(), now());

  insert into public.user_roles (user_id, role_id)
  select v_admin, id from public.roles where code = 'admin';

  select id into v_service from public.services order by created_at limit 1;
  if v_service is null then
    raise exception 'No service in the catalog (seed migration missing?)';
  end if;

  insert into public.properties (created_by, type, street, number, neighborhood, city, state, postal_code)
  values (v_client, 'apartment', 'Rua Teste', '1', 'Centro', 'Sao Paulo', 'SP', '01001000')
  returning id into v_property;

  insert into public.consulting_cases (client_id, service_id, property_id, objective)
  values (v_client, v_service, v_property, 'Teste do outbox de notificacoes')
  returning id into v_case;

  -- Act as the admin so the client (not the actor) is notified.
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_admin, 'role', 'authenticated')::text, true);

  update public.consulting_cases
  set phase = 'document_collection',
      waiting_on = 'client',
      waiting_reason = 'Aguardando documentos do cliente'
  where id = v_case;
end;
$$;

-- Expected: one row with type 'case_status_changed', channel 'email', status 'queued'
-- (or 'sent' within seconds once the webhook is configured).
select n.type, n.title, d.channel, d.status, d.error_message, d.provider_message_id, d.created_at
from public.notification_deliveries d
join public.notifications n on n.id = d.notification_id
order by d.created_at desc
limit 5;
