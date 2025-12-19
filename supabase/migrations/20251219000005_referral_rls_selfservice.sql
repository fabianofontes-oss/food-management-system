-- =========================================
-- AFILIADOS P0 - Ajustes de RLS/Policies
-- DRIVER = 100% dele
-- Permitir self-service (criar partner + code)
-- Permitir validar code em rota pública (/r/[code]) com ANON
-- Data: 2025-12-19
-- =========================================

-- 1) referral_partners: manter select (admin ou dono), e permitir INSERT pelo próprio user
drop policy if exists referral_partners_write_admin on public.referral_partners;

-- Admin continua podendo gerenciar tudo
drop policy if exists referral_partners_admin_all on public.referral_partners;
create policy referral_partners_admin_all
on public.referral_partners
for all
to authenticated
using (is_super_admin(auth.uid()))
with check (is_super_admin(auth.uid()));

-- Self-service: o usuário pode criar o próprio partner
drop policy if exists referral_partners_insert_self on public.referral_partners;
create policy referral_partners_insert_self
on public.referral_partners
for insert
to authenticated
with check (
  user_id = auth.uid()
  and is_active = true
  and partner_type in ('OWNER','STAFF','DRIVER','PARTNER_GENERAL','PARTNER_PRO')
  and (
    -- Tipos internos exigem vínculo com store_users
    (partner_type in ('OWNER','STAFF','DRIVER')
      and store_id is not null
      and exists (
        select 1 from public.store_users su
        where su.store_id = referral_partners.store_id
          and su.user_id = auth.uid()
      )
    )
    -- Tipos externos não exigem store
    or (partner_type in ('PARTNER_GENERAL','PARTNER_PRO'))
  )
);

-- 2) referral_codes: permitir SELECT público para validar existência do código
drop policy if exists referral_codes_select on public.referral_codes;

-- Select para authenticated (admin ou dono do partner)
create policy referral_codes_select_auth
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

-- Select para anon (apenas códigos ativos)
drop policy if exists referral_codes_select_public on public.referral_codes;
create policy referral_codes_select_public
on public.referral_codes
for select
to anon
using (is_active = true);

-- INSERT codes self-service: usuário cria code somente para o partner dele
drop policy if exists referral_codes_write_admin on public.referral_codes;

-- Admin all
drop policy if exists referral_codes_admin_all on public.referral_codes;
create policy referral_codes_admin_all
on public.referral_codes
for all
to authenticated
using (is_super_admin(auth.uid()))
with check (is_super_admin(auth.uid()));

-- Self-service insert
drop policy if exists referral_codes_insert_self on public.referral_codes;
create policy referral_codes_insert_self
on public.referral_codes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.referral_partners rp
    where rp.id = referral_codes.partner_id
      and rp.user_id = auth.uid()
      and rp.is_active = true
  )
);

-- 3) tenant_referrals: permitir INSERT pelo usuário que está criando a própria loja/tenant
drop policy if exists tenant_referrals_write_admin on public.tenant_referrals;

-- Admin all
drop policy if exists tenant_referrals_admin_all on public.tenant_referrals;
create policy tenant_referrals_admin_all
on public.tenant_referrals
for all
to authenticated
using (is_super_admin(auth.uid()))
with check (is_super_admin(auth.uid()));

-- Insert self: usuário pode gravar referral do tenant dele, desde que ele seja membro de uma store desse tenant
drop policy if exists tenant_referrals_insert_self on public.tenant_referrals;
create policy tenant_referrals_insert_self
on public.tenant_referrals
for insert
to authenticated
with check (
  captured_by_user_id = auth.uid()
  and exists (
    select 1
    from public.stores s
    join public.store_users su on su.store_id = s.id
    where s.tenant_id = tenant_referrals.referred_tenant_id
      and su.user_id = auth.uid()
  )
);

-- 4) referral_sales continua admin-only no P0 (vendas serão criadas automaticamente no futuro)
-- Não mexer por agora
