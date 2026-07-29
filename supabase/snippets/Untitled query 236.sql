select
    p.id,
    p.name,
    p.email,
    p.email_verified_at,
    r.code as role
from public.profiles p
join public.user_roles ur
    on ur.user_id = p.id
join public.roles r
    on r.id = ur.role_id;