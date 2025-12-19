-- =========================================
-- AFILIADOS - SPLIT 80/20 DRIVER + RECRUTADOR
-- Data: 2025-12-19
-- =========================================
-- Driver: 80% da comissão
-- Lojista recrutador: 20% (vira crédito na fatura)
-- Lojista NÃO pode desativar driver (somente driver ou superadmin)
-- =========================================

-- 1) Campos de recrutador e split no partner (driver)
ALTER TABLE public.referral_partners
  ADD COLUMN IF NOT EXISTS recruited_by_store_id uuid NULL REFERENCES public.stores(id),
  ADD COLUMN IF NOT EXISTS driver_share_percent numeric(5,2) NULL,
  ADD COLUMN IF NOT EXISTS recruiter_share_percent numeric(5,2) NULL;

-- Índice para buscar drivers por loja recrutadora
CREATE INDEX IF NOT EXISTS idx_referral_partners_recruited_by 
  ON public.referral_partners(recruited_by_store_id) 
  WHERE recruited_by_store_id IS NOT NULL;

-- 2) RLS: UPDATE só pelo próprio dono do partner (driver) ou superadmin
-- Isso impede que lojista desative o driver
DROP POLICY IF EXISTS referral_partners_update_self ON public.referral_partners;
CREATE POLICY referral_partners_update_self
ON public.referral_partners
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  user_id = auth.uid()
  OR is_super_admin(auth.uid())
);

-- 3) Trigger para blindar campos de split (só superadmin pode alterar depois de criado)
CREATE OR REPLACE FUNCTION protect_driver_split_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não for superadmin e está tentando alterar campos protegidos
  IF NOT is_super_admin(auth.uid()) THEN
    -- Bloquear alteração de recruited_by_store_id
    IF OLD.recruited_by_store_id IS DISTINCT FROM NEW.recruited_by_store_id THEN
      RAISE EXCEPTION 'Somente Super Admin pode alterar o recrutador';
    END IF;
    
    -- Bloquear alteração de driver_share_percent
    IF OLD.driver_share_percent IS DISTINCT FROM NEW.driver_share_percent THEN
      RAISE EXCEPTION 'Somente Super Admin pode alterar o percentual do driver';
    END IF;
    
    -- Bloquear alteração de recruiter_share_percent
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

-- 4) Comentários
COMMENT ON COLUMN public.referral_partners.recruited_by_store_id IS 'Loja que recrutou este driver (recebe 20% como crédito)';
COMMENT ON COLUMN public.referral_partners.driver_share_percent IS 'Percentual do driver (padrão 80%)';
COMMENT ON COLUMN public.referral_partners.recruiter_share_percent IS 'Percentual do lojista recrutador (padrão 20%, vira crédito na fatura)';
