-- =========================================
-- AFILIADOS - APPLY ALL MIGRATIONS
-- Gerado em: 2024-12-19 23:32
-- Execute este arquivo no Supabase SQL Editor
-- =========================================

-- =========================================
-- MIGRATION 1: 20251219000004_referral_affiliates.sql
-- =========================================

-- 1) TABELA: referral_partners
create table if not exists public.referral_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  store_id  uuid references public.stores(id) on delete set null,
  display_name text not null,
  partner_type text not null check (partner_type in (
    'OWNER','STAFF','DRIVER','PARTNER_GENERAL','PARTNER_PRO'
  )),
  base_commission_percent numeric(5,2) not null default 20,
  eligible_for_bonus boolean not null default false,
  is_active boolean not null default true,
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

-- 3) TABELA: tenant_referrals
create table if not exists public.tenant_referrals (
  referred_tenant_id uuid primary key references public.tenants(id) on delete cascade,
  referral_code text references public.referral_codes(code),
  partner_id uuid references public.referral_partners(id),
  captured_at timestamptz not null default now(),
  captured_by_user_id uuid references auth.users(id) on delete set null,
  utm jsonb
);

create index if not exists idx_tenant_referrals_partner on public.tenant_referrals(partner_id);

-- 4) TABELA: referral_sales
create table if not exists public.referral_sales (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null references public.referral_codes(code),
  partner_id uuid not null references public.referral_partners(id),
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

-- RLS
alter table public.referral_partners enable row level security;
alter table public.referral_codes enable row level security;
alter table public.tenant_referrals enable row level security;
alter table public.referral_sales enable row level security;

-- referral_partners: admin vê tudo, afiliado vê o próprio
drop policy if exists referral_partners_select on public.referral_partners;
create policy referral_partners_select
on public.referral_partners for select to authenticated
using (is_super_admin(auth.uid()) OR user_id = auth.uid());

drop policy if exists referral_partners_write_admin on public.referral_partners;
create policy referral_partners_write_admin
on public.referral_partners for all to authenticated
using (is_super_admin(auth.uid()))
with check (is_super_admin(auth.uid()));

-- referral_codes
drop policy if exists referral_codes_select on public.referral_codes;
create policy referral_codes_select
on public.referral_codes for select to authenticated
using (
  is_super_admin(auth.uid()) OR
  exists (select 1 from public.referral_partners rp where rp.id = referral_codes.partner_id and rp.user_id = auth.uid())
);

drop policy if exists referral_codes_write_admin on public.referral_codes;
create policy referral_codes_write_admin
on public.referral_codes for all to authenticated
using (is_super_admin(auth.uid()))
with check (is_super_admin(auth.uid()));

-- tenant_referrals
drop policy if exists tenant_referrals_select on public.tenant_referrals;
create policy tenant_referrals_select
on public.tenant_referrals for select to authenticated
using (
  is_super_admin(auth.uid()) OR
  exists (select 1 from public.referral_partners rp where rp.id = tenant_referrals.partner_id and rp.user_id = auth.uid())
);

drop policy if exists tenant_referrals_write_admin on public.tenant_referrals;
create policy tenant_referrals_write_admin
on public.tenant_referrals for all to authenticated
using (is_super_admin(auth.uid()))
with check (is_super_admin(auth.uid()));

-- referral_sales
drop policy if exists referral_sales_select on public.referral_sales;
create policy referral_sales_select
on public.referral_sales for select to authenticated
using (
  is_super_admin(auth.uid()) OR
  exists (
    select 1 from public.referral_partners rp
    where rp.user_id = auth.uid() and (rp.id = referral_sales.partner_id OR rp.id = referral_sales.owner_partner_id)
  )
);

drop policy if exists referral_sales_write_admin on public.referral_sales;
create policy referral_sales_write_admin
on public.referral_sales for all to authenticated
using (is_super_admin(auth.uid()))
with check (is_super_admin(auth.uid()));

comment on table public.referral_partners is 'Parceiros/afiliados que podem indicar novos tenants';
comment on table public.referral_codes is 'Códigos de indicação (ex: MOTOJOAO, ABC123)';
comment on table public.tenant_referrals is 'Atribuição: qual tenant foi indicado por qual partner/code';
comment on table public.referral_sales is 'Comissões geradas por cada venda/assinatura';

-- =========================================
-- MIGRATION 2: 20251219000005_referral_rls_selfservice.sql
-- =========================================

drop policy if exists referral_partners_write_admin on public.referral_partners;

drop policy if exists referral_partners_admin_all on public.referral_partners;
create policy referral_partners_admin_all
on public.referral_partners for all to authenticated
using (is_super_admin(auth.uid()))
with check (is_super_admin(auth.uid()));

drop policy if exists referral_partners_insert_self on public.referral_partners;
create policy referral_partners_insert_self
on public.referral_partners for insert to authenticated
with check (
  user_id = auth.uid()
  and is_active = true
  and partner_type in ('OWNER','STAFF','DRIVER','PARTNER_GENERAL','PARTNER_PRO')
  and (
    (partner_type in ('OWNER','STAFF','DRIVER')
      and store_id is not null
      and exists (select 1 from public.store_users su where su.store_id = referral_partners.store_id and su.user_id = auth.uid())
    )
    or (partner_type in ('PARTNER_GENERAL','PARTNER_PRO'))
  )
);

drop policy if exists referral_codes_select on public.referral_codes;
drop policy if exists referral_codes_select_auth on public.referral_codes;

create policy referral_codes_select_auth
on public.referral_codes for select to authenticated
using (
  is_super_admin(auth.uid()) OR
  exists (select 1 from public.referral_partners rp where rp.id = referral_codes.partner_id and rp.user_id = auth.uid())
);

drop policy if exists referral_codes_select_public on public.referral_codes;
create policy referral_codes_select_public
on public.referral_codes for select to anon
using (is_active = true);

drop policy if exists referral_codes_write_admin on public.referral_codes;

drop policy if exists referral_codes_admin_all on public.referral_codes;
create policy referral_codes_admin_all
on public.referral_codes for all to authenticated
using (is_super_admin(auth.uid()))
with check (is_super_admin(auth.uid()));

drop policy if exists referral_codes_insert_self on public.referral_codes;
create policy referral_codes_insert_self
on public.referral_codes for insert to authenticated
with check (
  exists (select 1 from public.referral_partners rp where rp.id = referral_codes.partner_id and rp.user_id = auth.uid() and rp.is_active = true)
);

drop policy if exists tenant_referrals_write_admin on public.tenant_referrals;

drop policy if exists tenant_referrals_admin_all on public.tenant_referrals;
create policy tenant_referrals_admin_all
on public.tenant_referrals for all to authenticated
using (is_super_admin(auth.uid()))
with check (is_super_admin(auth.uid()));

drop policy if exists tenant_referrals_insert_self on public.tenant_referrals;
create policy tenant_referrals_insert_self
on public.tenant_referrals for insert to authenticated
with check (
  captured_by_user_id = auth.uid()
  and exists (
    select 1 from public.stores s
    join public.store_users su on su.store_id = s.id
    where s.tenant_id = tenant_referrals.referred_tenant_id and su.user_id = auth.uid()
  )
);

-- =========================================
-- MIGRATION 3: 20251219000006_referral_driver_split.sql
-- =========================================

ALTER TABLE public.referral_partners
  ADD COLUMN IF NOT EXISTS recruited_by_store_id uuid NULL REFERENCES public.stores(id),
  ADD COLUMN IF NOT EXISTS driver_share_percent numeric(5,2) NULL,
  ADD COLUMN IF NOT EXISTS recruiter_share_percent numeric(5,2) NULL;

CREATE INDEX IF NOT EXISTS idx_referral_partners_recruited_by 
  ON public.referral_partners(recruited_by_store_id) 
  WHERE recruited_by_store_id IS NOT NULL;

DROP POLICY IF EXISTS referral_partners_update_self ON public.referral_partners;
CREATE POLICY referral_partners_update_self
ON public.referral_partners FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR is_super_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION protect_driver_split_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    IF OLD.recruited_by_store_id IS DISTINCT FROM NEW.recruited_by_store_id THEN
      RAISE EXCEPTION 'Somente Super Admin pode alterar o recrutador';
    END IF;
    IF OLD.driver_share_percent IS DISTINCT FROM NEW.driver_share_percent THEN
      RAISE EXCEPTION 'Somente Super Admin pode alterar o percentual do driver';
    END IF;
    IF OLD.recruiter_share_percent IS DISTINCT FROM NEW.recruiter_share_percent THEN
      RAISE EXCEPTION 'Somente Super Admin pode alterar o percentual do recrutador';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_driver_split ON public.referral_partners;
CREATE TRIGGER trg_protect_driver_split
  BEFORE UPDATE ON public.referral_partners
  FOR EACH ROW
  EXECUTE FUNCTION protect_driver_split_fields();

COMMENT ON COLUMN public.referral_partners.recruited_by_store_id IS 'Loja que recrutou este driver (recebe 20% como crédito)';
COMMENT ON COLUMN public.referral_partners.driver_share_percent IS 'Percentual do driver (padrão 80%)';
COMMENT ON COLUMN public.referral_partners.recruiter_share_percent IS 'Percentual do lojista recrutador (padrão 20%, vira crédito na fatura)';

-- =========================================
-- FIM - Migrations aplicadas com sucesso!
-- =========================================
SELECT 'Migrations de afiliados aplicadas com sucesso!' as status;
