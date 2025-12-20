-- Tabela para reserva de slugs durante onboarding
create table if not exists public.slug_reservations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  token text not null unique default gen_random_uuid()::text,
  reserved_by uuid null, -- user_id sem FK para evitar problemas com auth.users
  store_id uuid null,
  tenant_id uuid null,
  status text not null default 'reserved', -- reserved | published | released
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.slug_reservations enable row level security;

drop policy if exists "slug_reservations_select_public" on public.slug_reservations;
create policy "slug_reservations_select_public"
on public.slug_reservations
for select
to anon, authenticated
using (true);

drop policy if exists "slug_reservations_insert_auth" on public.slug_reservations;
create policy "slug_reservations_insert_auth"
on public.slug_reservations
for insert
to authenticated
with check (reserved_by = auth.uid());

drop policy if exists "slug_reservations_update_auth" on public.slug_reservations;
create policy "slug_reservations_update_auth"
on public.slug_reservations
for update
to authenticated
using (reserved_by = auth.uid())
with check (reserved_by = auth.uid());

drop policy if exists "slug_reservations_delete_auth" on public.slug_reservations;
create policy "slug_reservations_delete_auth"
on public.slug_reservations
for delete
to authenticated
using (reserved_by = auth.uid());

create index if not exists idx_slug_reservations_store_id on public.slug_reservations(store_id);
create index if not exists idx_slug_reservations_tenant_id on public.slug_reservations(tenant_id);
create index if not exists idx_slug_reservations_status on public.slug_reservations(status);
