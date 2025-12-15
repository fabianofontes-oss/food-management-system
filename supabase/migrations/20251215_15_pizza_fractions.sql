-- =============================================
-- PIZZARIA: Sistema de Frações (Meio a Meio)
-- Permite dividir um item do pedido em múltiplos sabores
-- =============================================

-- Tabela de sabores fracionados por item do pedido
CREATE TABLE IF NOT EXISTS "public"."order_item_flavors" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "order_item_id" UUID NOT NULL REFERENCES "public"."order_items"("id") ON DELETE CASCADE,
  "product_id" UUID NOT NULL REFERENCES "public"."products"("id"),
  "fraction" DECIMAL(3,2) NOT NULL, -- Ex: 0.50 para meio, 0.33 para terço
  "name_snapshot" VARCHAR(255),
  "price_snapshot" DECIMAL(10,2),
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_order_item_flavors_order_item ON "public"."order_item_flavors"("order_item_id");
CREATE INDEX IF NOT EXISTS idx_order_item_flavors_product ON "public"."order_item_flavors"("product_id");

-- RLS
ALTER TABLE "public"."order_item_flavors" ENABLE ROW LEVEL SECURITY;

-- Policy: Leitura pública (para exibir no pedido)
DROP POLICY IF EXISTS "order_item_flavors_select" ON "public"."order_item_flavors";
CREATE POLICY "order_item_flavors_select" ON "public"."order_item_flavors" 
  FOR SELECT USING (true);

-- Policy: Insert/Update/Delete apenas para membros da loja
DROP POLICY IF EXISTS "order_item_flavors_write" ON "public"."order_item_flavors";
CREATE POLICY "order_item_flavors_write" ON "public"."order_item_flavors" 
  FOR ALL USING (
    order_item_id IN (
      SELECT oi.id FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.store_id IN (
        SELECT store_id FROM store_users WHERE user_id = auth.uid()
      )
    )
  );

-- Comentário explicativo
COMMENT ON TABLE "public"."order_item_flavors" IS 'Sabores fracionados para pizzas meio-a-meio. Cada linha representa uma fração do item.';
COMMENT ON COLUMN "public"."order_item_flavors"."fraction" IS 'Fração do item: 0.50 = metade, 0.33 = terço, 0.25 = quarto';
