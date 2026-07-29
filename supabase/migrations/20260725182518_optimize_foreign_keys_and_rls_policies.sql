-- Cover every foreign key used by joins, deletes and policy checks.

create index case_documents_document_type_idx
  on public.case_documents (document_type_id);

create index case_events_actor_idx
  on public.case_events (actor_id);

create index case_messages_sender_idx
  on public.case_messages (sender_id);

create index case_status_history_changed_by_idx
  on public.case_status_history (changed_by);

create index document_reviews_reviewer_idx
  on public.document_reviews (reviewer_id);

create index document_versions_submitted_by_idx
  on public.document_versions (submitted_by);

create index notification_deliveries_notification_idx
  on public.notification_deliveries (notification_id);

create index notifications_case_document_idx
  on public.notifications (case_document_id);

create index notifications_case_idx
  on public.notifications (case_id);

create index property_parties_user_idx
  on public.property_parties (user_id);

create index service_document_requirements_document_type_idx
  on public.service_document_requirements (document_type_id);

create index user_roles_role_idx
  on public.user_roles (role_id);

-- Avoid overlapping permissive SELECT policies while preserving admin access.

-- Categories: public sees active; authenticated admin also sees inactive.
drop policy "service_categories_read_active" on public.service_categories;
drop policy "service_categories_manage_admin" on public.service_categories;

create policy "service_categories_read_active_anon"
on public.service_categories for select
to anon
using (active);

create policy "service_categories_read_active_or_admin"
on public.service_categories for select
to authenticated
using (active or (select private.has_role('admin')));

create policy "service_categories_insert_admin"
on public.service_categories for insert
to authenticated
with check ((select private.has_role('admin')));

create policy "service_categories_update_admin"
on public.service_categories for update
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));

create policy "service_categories_delete_admin"
on public.service_categories for delete
to authenticated
using ((select private.has_role('admin')));

-- Services: public sees active services in active categories; admin sees all.
drop policy "services_read_active" on public.services;
drop policy "services_manage_admin" on public.services;

create policy "services_read_active_anon"
on public.services for select
to anon
using (
  active and exists (
    select 1 from public.service_categories sc
    where sc.id = services.category_id and sc.active
  )
);

create policy "services_read_active_or_admin"
on public.services for select
to authenticated
using (
  (
    active and exists (
      select 1 from public.service_categories sc
      where sc.id = services.category_id and sc.active
    )
  )
  or (select private.has_role('admin'))
);

create policy "services_insert_admin"
on public.services for insert
to authenticated
with check ((select private.has_role('admin')));

create policy "services_update_admin"
on public.services for update
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));

create policy "services_delete_admin"
on public.services for delete
to authenticated
using ((select private.has_role('admin')));

-- Document types.
drop policy "document_types_select_active_or_admin" on public.document_types;
drop policy "document_types_manage_admin" on public.document_types;

create policy "document_types_select_active_or_admin"
on public.document_types for select
to authenticated
using (active or (select private.has_role('admin')));

create policy "document_types_insert_admin"
on public.document_types for insert
to authenticated
with check ((select private.has_role('admin')));

create policy "document_types_update_admin"
on public.document_types for update
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));

create policy "document_types_delete_admin"
on public.document_types for delete
to authenticated
using ((select private.has_role('admin')));

-- Service requirements.
drop policy "service_requirements_manage_admin" on public.service_document_requirements;

create policy "service_requirements_insert_admin"
on public.service_document_requirements for insert
to authenticated
with check ((select private.has_role('admin')));

create policy "service_requirements_update_admin"
on public.service_document_requirements for update
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));

create policy "service_requirements_delete_admin"
on public.service_document_requirements for delete
to authenticated
using ((select private.has_role('admin')));

-- Case documents: SELECT already includes admin through can_access_case().
drop policy "case_documents_manage_admin" on public.case_documents;

create policy "case_documents_insert_admin"
on public.case_documents for insert
to authenticated
with check ((select private.has_role('admin')));

create policy "case_documents_update_admin"
on public.case_documents for update
to authenticated
using ((select private.has_role('admin')))
with check ((select private.has_role('admin')));
;
