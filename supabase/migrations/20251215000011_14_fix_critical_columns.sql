-- =============================================
-- FIX CRÍTICO: Colunas faltantes detectadas na auditoria
-- =============================================

-- Adiciona cor às categorias (Critical Fix)
ALTER TABLE "public"."categories" ADD COLUMN IF NOT EXISTS "color" VARCHAR(20) DEFAULT '#3b82f6';

-- Garante que colunas de loyalty existam na loja (Safety Check)
ALTER TABLE "public"."stores" ADD COLUMN IF NOT EXISTS "loyalty_active" BOOLEAN DEFAULT false;
ALTER TABLE "public"."stores" ADD COLUMN IF NOT EXISTS "loyalty_calculation_type" VARCHAR(10) DEFAULT 'order_value';
ALTER TABLE "public"."stores" ADD COLUMN IF NOT EXISTS "loyalty_order_value_per_stamp" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "public"."stores" ADD COLUMN IF NOT EXISTS "loyalty_stamps_to_reward" INTEGER DEFAULT 10;
ALTER TABLE "public"."stores" ADD COLUMN IF NOT EXISTS "loyalty_reward_value" DECIMAL(10,2) DEFAULT 0;
