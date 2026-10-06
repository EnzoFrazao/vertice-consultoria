-- Transactional operations used by the client and administrative portals.

create or replace function private.assert_case_phase_transition(
  current_phase text,
  requested_phase text
)
returns void
language plpgsql
immutable
security invoker
set search_path = ''
as $$
begin
  if current_phase = requested_phase then
    return;
  end if;

  if current_phase in ('completed', 'cancelled') then
    raise exception 'final cases cannot be reopened' using errcode = 'P0001';
  end if;

  if requested_phase = 'cancelled' then
    return;
  end if;

  if not (
    (current_phase = 'intake' and requested_phase = 'document_collection')
    or (current_phase = 'document_collection' and requested_phase = 'document_review')
    or (current_phase = 'document_review' and requested_phase = 'technical_analysis')
    or (
      current_phase = 'technical_analysis'
      and requested_phase in ('external_processing', 'completed')
    )
    or (current_phase = 'external_processing' and requested_phase = 'completed')
  ) then
    raise exception 'invalid case phase transition: % -> %', current_phase, requested_phase
      using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function private.assert_case_phase_transition(text, text)
  from public, anon, authenticated;
grant execute on function private.assert_case_phase_transition(text, text)
  to authenticated;

create or replace function private.enforce_case_phase_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_case_phase_transition(old.phase, new.phase);
  return new;
end;
$$;

revoke all on function private.enforce_case_phase_transition()
  from public, anon, authenticated;

drop trigger if exists consulting_cases_enforce_phase_transition
  on public.consulting_cases;

create trigger consulting_cases_enforce_phase_transition
before update of phase on public.consulting_cases
for each row execute function private.enforce_case_phase_transition();

create or replace function public.create_consulting_case(
  service_slug text,
  case_objective text,
  property_data jsonb
)
returns table (case_id uuid, protocol text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  target_service_id uuid;
  created_property_id uuid;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if nullif(btrim(service_slug), '') is null
    or nullif(btrim(case_objective), '') is null then
    raise exception 'service and objective are required' using errcode = '22023';
  end if;

  if property_data is null
    or jsonb_typeof(property_data) <> 'object'
    or nullif(btrim(property_data ->> 'type'), '') is null
    or nullif(btrim(property_data ->> 'street'), '') is null
    or nullif(btrim(property_data ->> 'number'), '') is null
    or nullif(btrim(property_data ->> 'neighborhood'), '') is null
    or nullif(btrim(property_data ->> 'city'), '') is null
    or coalesce(property_data ->> 'state', '') !~ '^[A-Za-z]{2}$'
    or coalesce(property_data ->> 'postal_code', '') !~ '^[0-9]{8}$' then
    raise exception 'invalid property data' using errcode = '22023';
  end if;

  select s.id
    into target_service_id
  from public.services s
  join public.service_categories sc on sc.id = s.category_id
  where s.slug = service_slug
    and s.active
    and sc.active;

  if target_service_id is null then
    raise exception 'active service not found' using errcode = '22023';
  end if;

  insert into public.properties (
    created_by,
    type,
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    postal_code,
    registration_number,
    registry_office,
    iptu_number,
    notes
  )
  values (
    caller_id,
    btrim(property_data ->> 'type'),
    btrim(property_data ->> 'street'),
    btrim(property_data ->> 'number'),
    nullif(btrim(property_data ->> 'complement'), ''),
    btrim(property_data ->> 'neighborhood'),
    btrim(property_data ->> 'city'),
    upper(property_data ->> 'state'),
    property_data ->> 'postal_code',
    nullif(btrim(property_data ->> 'registration_number'), ''),
    nullif(btrim(property_data ->> 'registry_office'), ''),
    nullif(btrim(property_data ->> 'iptu_number'), ''),
    nullif(btrim(property_data ->> 'notes'), '')
  )
  returning id into created_property_id;

  return query
  insert into public.consulting_cases (
    protocol,
    client_id,
    service_id,
    property_id,
    objective,
    phase,
    waiting_on,
    waiting_reason
  )
  values (
    null,
    caller_id,
    target_service_id,
    created_property_id,
    btrim(case_objective),
    'intake',
    null,
    null
  )
  returning consulting_cases.id, consulting_cases.protocol::text;
end;
$$;

create or replace function public.review_document_version(
  target_version_id uuid,
  review_decision text,
  review_reason text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  target_case_id uuid;
  target_document_id uuid;
  latest_version_id uuid;
  created_review_id uuid;
begin
  if caller_id is null or not private.has_role('admin') then
    raise exception 'administrator role required' using errcode = '42501';
  end if;

  if review_decision not in ('approved', 'rejected') then
    raise exception 'invalid review decision' using errcode = '22023';
  end if;

  if review_decision = 'rejected' and nullif(btrim(review_reason), '') is null then
    raise exception 'rejection reason is required' using errcode = '22023';
  end if;

  select cd.case_id, cd.id
    into target_case_id, target_document_id
  from public.document_versions dv
  join public.case_documents cd on cd.id = dv.case_document_id
  where dv.id = target_version_id
    and dv.deleted_at is null;

  if target_case_id is null then
    raise exception 'document version not found' using errcode = 'P0002';
  end if;

  select dv.id
    into latest_version_id
  from public.document_versions dv
  where dv.case_document_id = target_document_id
    and dv.deleted_at is null
  order by dv.version_number desc
  limit 1;

  if latest_version_id <> target_version_id then
    raise exception 'only the latest document version can be reviewed' using errcode = 'P0001';
  end if;

  insert into public.document_reviews (
    document_version_id,
    reviewer_id,
    decision,
    reason
  )
  values (
    target_version_id,
    caller_id,
    review_decision,
    case
      when review_decision = 'rejected' then btrim(review_reason)
      else null
    end
  )
  returning id into created_review_id;

  update public.consulting_cases
  set
    waiting_on = case when review_decision = 'rejected' then 'client' else 'team' end,
    waiting_reason = case
      when review_decision = 'rejected' then btrim(review_reason)
      else 'Documento revisado pela equipe.'
    end
  where id = target_case_id;

  return created_review_id;
end;
$$;

create or replace function private.mark_document_submitted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_status text;
  target_case_id uuid;
begin
  select cd.status, cd.case_id
    into previous_status, target_case_id
  from public.case_documents cd
  where cd.id = new.case_document_id
  for update;

  update public.case_documents
  set status = 'submitted'
  where id = new.case_document_id;

  if previous_status = 'rejected' then
    update public.consulting_cases
    set
      waiting_on = 'team',
      waiting_reason = 'Documento reenviado pelo cliente.'
    where id = target_case_id;
  end if;

  return new;
end;
$$;

revoke all on function private.mark_document_submitted()
  from public, anon, authenticated;

create or replace function public.transition_consulting_case(
  target_case_id uuid,
  requested_phase text,
  requested_waiting_on text,
  requested_waiting_reason text,
  expected_lock_version integer
)
returns table (
  case_id uuid,
  phase text,
  waiting_on text,
  waiting_reason text,
  lock_version integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_case public.consulting_cases%rowtype;
begin
  if auth.uid() is null or not private.has_role('admin') then
    raise exception 'administrator role required' using errcode = '42501';
  end if;

  if requested_waiting_on is not null
    and requested_waiting_on not in ('client', 'team', 'registry_office', 'city_hall', 'third_party') then
    raise exception 'invalid waiting party' using errcode = '22023';
  end if;

  if requested_waiting_on is null and requested_waiting_reason is not null then
    raise exception 'waiting reason requires a waiting party' using errcode = '22023';
  end if;

  select *
    into current_case
  from public.consulting_cases
  where id = target_case_id
  for update;

  if not found then
    raise exception 'case not found' using errcode = 'P0002';
  end if;

  if current_case.lock_version <> expected_lock_version then
    raise exception 'case version conflict' using errcode = '40001';
  end if;

  perform private.assert_case_phase_transition(current_case.phase, requested_phase);

  return query
  update public.consulting_cases cc
  set
    phase = requested_phase,
    waiting_on = requested_waiting_on,
    waiting_reason = case
      when requested_waiting_on is null then null
      else nullif(btrim(requested_waiting_reason), '')
    end,
    completed_at = case
      when requested_phase = 'completed' then now()
      else null
    end
  where cc.id = target_case_id
    and cc.lock_version = expected_lock_version
  returning
    cc.id,
    cc.phase::text,
    cc.waiting_on::text,
    cc.waiting_reason,
    cc.lock_version;

  if not found then
    raise exception 'case version conflict' using errcode = '40001';
  end if;
end;
$$;

revoke all on function public.create_consulting_case(text, text, jsonb)
  from public, anon;
revoke all on function public.review_document_version(uuid, text, text)
  from public, anon;
revoke all on function public.transition_consulting_case(uuid, text, text, text, integer)
  from public, anon;

grant execute on function public.create_consulting_case(text, text, jsonb)
  to authenticated;
grant execute on function public.review_document_version(uuid, text, text)
  to authenticated;
grant execute on function public.transition_consulting_case(uuid, text, text, text, integer)
  to authenticated;
;
