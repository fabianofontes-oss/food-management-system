-- =========================================
-- ETAPA 7 - AFILIADOS (P0) - BASE
-- Data: 2025-12-19
-- Descrição: Sistema de afiliados/indicação com split de comissão
-- =========================================

-- 1) TABELA: referral_partners
create table if not exists public.referral_partners (
  id uuid primary key default gen_random_uuid(),

  -- Quem é o afiliado (usuário do sistema)
  user_id uuid references auth.users(id) on delete set null,

  -- Contexto (quando afiliado é interno de uma loja)
  tenant_id uuid references public.tenants(id) on delete set null,
  store_id  uuid references public.stores(id) on delete set null,

  display_name text not null,

  -- OWNER | STAFF | DRIVER | PARTNER_GENERAL | PARTNER_PRO
  partner_type text not null check (partner_type in (
    'OWNER','STAFF','DRIVER','PARTNER_GENERAL','PARTNER_PRO'
  )),

  base_commission_percent numeric(5,2) not null default 20,
  eligible_for_bonus boolean not null default false,
  is_active boolean not null default true,

  -- Split quando STAFF/DRIVER (opcional)
  staff_share_percent numeric(5,2),
  owner_share_percent numeric(5,2),

  created_at timestamptz not null default now()
);

create unique index if not exists uq_referral_partner_user_store_type
  on public.referral_partners(user_id, store_id, partner_type)
  where user_id is not null and store_id is not null;

create index if not exists idx_referral_partners_user on public.referral_partners(user_id);
create index if not exists idx_referral_partners_store on public.referral_partners(store_id);
create index if not exists idx_referral_partners_tenant on public.referral_partners(tenant_id);

-- 2) TABELA: referral_codes
create table if not exists public.referral_codes (
  code text primary key,
  partner_id uuid not null references public.referral_partners(id) on delete cascade,
  region text not null default 'BR' check (region in ('BR','CL','US')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_referral_codes_partner on public.referral_codes(partner_id);

-- 3) TABELA: tenant_referrals (atribuição: "quem indicou este tenant")
create table if not exists public.tenant_referrals (
  referred_tenant_id uuid primary key references public.tenants(id) on delete cascade,
  referral_code text references public.referral_codes(code),
  partner_id uuid references public.referral_partners(id),

  captured_at timestamptz not null default now(),
  captured_by_user_id uuid references auth.users(id) on delete set null,

  utm jsonb
);

create index if not exists idx_tenant_referrals_partner on public.tenant_referrals(partner_id);

-- 4) TABELA: referral_sales (a comissão "financeira" de fato)
create table if not exists public.referral_sales (
  id uuid primary key default gen_random_uuid(),

  referral_code text not null references public.referral_codes(code),
  partner_id uuid not null references public.referral_partners(id),

  -- quando houver split (STAFF/DRIVER), o dono recebe numa segunda "conta"
  owner_partner_id uuid references public.referral_partners(id),

  referred_tenant_id uuid not null references public.tenants(id) on delete cascade,

  plan_id text not null,
  billing_period text not null check (billing_period in ('MONTHLY','ANNUAL')),

  sale_currency text not null default 'BRL',
  sale_value numeric(12,2) not null,

  commission_base numeric(12,2) not null,
  commission_percent numeric(5,2) not null,
  commission_amount numeric(12,2) not null,

  status text not null default 'PENDING'
    check (status in ('PENDING','AVAILABLE','CANCELLED','ADJUSTED')),

  paid_at timestamptz,
  available_at timestamptz,
  cancelled_at timestamptz,
  chargeback_at timestamptz,

  staff_share_percent numeric(5,2),
  owner_share_percent numeric(5,2),
  staff_commission_amount numeric(12,2),
  owner_commission_amount numeric(12,2),

  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_referral_sales_partner on public.referral_sales(partner_id);
create index if not exists idx_referral_sales_owner_partner on public.referral_sales(owner_partner_id);
create index if not exists idx_referral_sales_referred_tenant on public.referral_sales(referred_tenant_id);
create index if not exists idx_referral_sales_status on public.referral_sales(status);
create index if not exists idx_referral_sales_available_at on public.referral_sales(available_at);

-- =========================================
-- RLS (P0) - acesso só para super admin ou dono do partner
-- Requer: função is_super_admin(auth.uid()) (já existe pela ETAPA 4B)
-- =========================================
alter table public.referral_partners enable row level security;
alter table public.referral_codes enable row level security;
alter table public.tenant_referrals enable row level security;
alter table public.referral_sales enable row level security;

-- referral_partners: admin vê tudo, afiliado vê o próprio
drop policy if exists referral_partners_select on public.referral_partners;
create policy referral_partners_select
on public.referral_partners
for select
to authenticated
using (
  is_super_admin(auth.uid()) OR user_id = auth.uid()
);

-- criar/editar partners: somente super admin (P0)
drop policy if exists referral_partners_write_admin on public.referral_partners;
create policy referral_partners_write_admin
on public.referral_partners
for all
to authenticated
using (is_super_admin(auth.uid()))
with check (is_super_admin(auth.uid()));

-- referral_codes: admin vê tudo, afiliado vê os seus códigos
drop policy if exists referral_codes_select on public.referral_codes;
create policy referral_codes_select
on public.referral_codes
for select
to authenticated
using (
  is_super_admin(auth.uid()) OR
  exists (
    select 1
    from public.referral_partners rp
    where rp.id = referral_codes.partner_id
      and rp.user_id = auth.uid()
  )
);

-- criar/editar codes: somente super admin (P0)
drop policy if exists referral_codes_write_admin on public.referral_codes;
create policy referral_codes_write_admin
on public.referral_codes
for all
to authenticated
using (is_super_admin(auth.uid()))
with check (is_super_admin(auth.uid()));

-- tenant_referrals: admin vê tudo, afiliado vê se for dele
drop policy if exists tenant_referrals_select on public.tenant_referrals;
create policy tenant_referrals_select
on public.tenant_referrals
for select
to authenticated
using (
  is_super_admin(auth.uid()) OR
  exists (
    select 1
    from public.referral_partners rp
    where rp.id = tenant_referrals.partner_id
      and rp.user_id = auth.uid()
  )
);

drop policy if exists tenant_referrals_write_admin on public.tenant_referrals;
create policy tenant_referrals_write_admin
on public.tenant_referrals
for all
to authenticated
using (is_super_admin(auth.uid()))
with check (is_super_admin(auth.uid()));

-- referral_sales: admin vê tudo; afiliado vê se for partner_id OU owner_partner_id dele
drop policy if exists referral_sales_select on public.referral_sales;
create policy referral_sales_select
on public.referral_sales
for select
to authenticated
using (
  is_super_admin(auth.uid()) OR
  exists (
    select 1
    from public.referral_partners rp
    where rp.user_id = auth.uid()
      and (rp.id = referral_sales.partner_id OR rp.id = referral_sales.owner_partner_id)
  )
);

drop policy if exists referral_sales_write_admin on public.referral_sales;
create policy referral_sales_write_admin
on public.referral_sales
for all
to authenticated
using (is_super_admin(auth.uid()))
with check (is_super_admin(auth.uid()));

-- =========================================
-- COMENTÁRIOS
-- =========================================
comment on table public.referral_partners is 'Parceiros/afiliados que podem indicar novos tenants';
comment on table public.referral_codes is 'Códigos de indicação (ex: MOTOJOAO, ABC123)';
comment on table public.tenant_referrals is 'Atribuição: qual tenant foi indicado por qual partner/code';
comment on table public.referral_sales is 'Comissões geradas por cada venda/assinatura';

comment on column public.referral_partners.partner_type is 'OWNER=dono de loja, STAFF=funcionário, DRIVER=motoboy, PARTNER_GENERAL=afiliado comum, PARTNER_PRO=afiliado profissional';
comment on column public.referral_partners.staff_share_percent is 'Percentual que o STAFF/DRIVER recebe da comissão (ex: 70%)';
comment on column public.referral_partners.owner_share_percent is 'Percentual que o dono da loja recebe quando STAFF/DRIVER indica (ex: 30%)';
comment on column public.referral_sales.status is 'PENDING=aguardando, AVAILABLE=disponível para saque, CANCELLED=cancelado, ADJUSTED=ajustado manualmente';
