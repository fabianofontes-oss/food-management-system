-- ============================================
-- MIGRATION: Forçar Layout Moderno + Seed Açaí
-- Data: 2025-12-15
-- Objetivo: Corrigir lojas com layout antigo e popular cardápios vazios
-- ============================================

-- 1. FORÇAR LAYOUT MODERNO (IFOOD STYLE) NO menu_theme
UPDATE stores 
SET menu_theme = jsonb_set(
  COALESCE(menu_theme, '{}'::jsonb), 
  '{layout}', 
  '"modern"'
)
WHERE menu_theme IS NULL 
   OR menu_theme->>'layout' IS NULL 
   OR menu_theme->>'layout' = 'classic';

-- 2. GARANTIR CORES PADRÃO NO menu_theme
UPDATE stores
SET menu_theme = jsonb_set(
  COALESCE(menu_theme, '{}'::jsonb),
  '{colors}',
  '{"primary": "#8B5CF6", "background": "#f4f4f5", "header": "#ffffff"}'::jsonb
)
WHERE menu_theme->'colors' IS NULL;

-- 3. GARANTIR DISPLAY OPTIONS
UPDATE stores
SET menu_theme = jsonb_set(
  COALESCE(menu_theme, '{}'::jsonb),
  '{display}',
  '{"showBanner": true, "showLogo": true, "showSearch": true, "showAddress": true, "showSocial": true}'::jsonb
)
WHERE menu_theme->'display' IS NULL;

-- 4. POPULAR AÇAÍ (SE ESTIVER VAZIO)
DO $$
DECLARE
  v_store_id UUID;
  v_cat_destaques UUID;
  v_cat_acai UUID;
  v_cat_adicionais UUID;
  v_product_count INT;
BEGIN
  -- Pega a primeira loja do tipo acaiteria (ou qualquer loja com 'acai' no slug)
  SELECT id INTO v_store_id 
  FROM stores 
  WHERE niche_slug = 'acaiteria' 
     OR slug ILIKE '%acai%'
  LIMIT 1;
  
  IF v_store_id IS NOT NULL THEN
    -- Verifica se já tem produtos
    SELECT COUNT(*) INTO v_product_count FROM products WHERE store_id = v_store_id;
    
    -- Só insere se estiver vazio
    IF v_product_count = 0 THEN
      RAISE NOTICE 'Loja de açaí encontrada (%) sem produtos. Populando...', v_store_id;
      
      -- ========== CRIAR CATEGORIAS ==========
      INSERT INTO categories (id, store_id, name, sort_order, color, is_active)
      VALUES (gen_random_uuid(), v_store_id, '⭐ Destaques', 0, 'purple', true)
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_cat_destaques;
      
      IF v_cat_destaques IS NULL THEN
        SELECT id INTO v_cat_destaques FROM categories WHERE store_id = v_store_id AND name ILIKE '%destaque%' LIMIT 1;
      END IF;
      
      INSERT INTO categories (id, store_id, name, sort_order, color, is_active)
      VALUES (gen_random_uuid(), v_store_id, '🍇 Açaís', 1, 'violet', true)
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_cat_acai;
      
      IF v_cat_acai IS NULL THEN
        SELECT id INTO v_cat_acai FROM categories WHERE store_id = v_store_id AND name ILIKE '%açaí%' LIMIT 1;
      END IF;
      
      INSERT INTO categories (id, store_id, name, sort_order, color, is_active)
      VALUES (gen_random_uuid(), v_store_id, '🍫 Adicionais', 2, 'amber', true)
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_cat_adicionais;
      
      IF v_cat_adicionais IS NULL THEN
        SELECT id INTO v_cat_adicionais FROM categories WHERE store_id = v_store_id AND name ILIKE '%adicion%' LIMIT 1;
      END IF;
      
      -- ========== CRIAR PRODUTOS - DESTAQUES ==========
      IF v_cat_destaques IS NOT NULL THEN
        INSERT INTO products (store_id, category_id, name, description, base_price, image_url, is_active, sort_order)
        VALUES 
          (v_store_id, v_cat_destaques, 'Açaí Turbinado 500ml', 
           'Açaí puro com banana, granola, leite em pó e leite condensado. O mais pedido!', 
           24.90, 
           'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80',
           true, 1),
          (v_store_id, v_cat_destaques, 'Barca de Açaí Real 1kg', 
           'Ideal para dividir! 1kg de açaí cremoso + 5 complementos à sua escolha.', 
           59.90, 
           'https://images.unsplash.com/photo-1588710929895-6aa5a7322923?auto=format&fit=crop&w=800&q=80',
           true, 2)
        ON CONFLICT DO NOTHING;
      END IF;
      
      -- ========== CRIAR PRODUTOS - AÇAÍS ==========
      IF v_cat_acai IS NOT NULL THEN
        INSERT INTO products (store_id, category_id, name, description, base_price, image_url, is_active, sort_order)
        VALUES 
          (v_store_id, v_cat_acai, 'Açaí Puro 300ml', 
           'Açaí 100% puro, sem adição de açúcar. Sabor autêntico da Amazônia.', 
           16.90, 
           'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
           true, 1),
          (v_store_id, v_cat_acai, 'Açaí Puro 500ml', 
           'Açaí 100% puro, sem adição de açúcar. Sabor autêntico da Amazônia.', 
           22.90, 
           'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
           true, 2),
          (v_store_id, v_cat_acai, 'Açaí Puro 700ml', 
           'Açaí 100% puro, sem adição de açúcar. Sabor autêntico da Amazônia.', 
           28.90, 
           'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
           true, 3),
          (v_store_id, v_cat_acai, 'Açaí com Morango 500ml', 
           'Açaí cremoso batido com morangos frescos. Refrescante e saudável.', 
           26.90, 
           'https://images.unsplash.com/photo-1553530666-ba11a90a0868?auto=format&fit=crop&w=800&q=80',
           true, 4)
        ON CONFLICT DO NOTHING;
      END IF;
      
      -- ========== CRIAR PRODUTOS - ADICIONAIS ==========
      IF v_cat_adicionais IS NOT NULL THEN
        INSERT INTO products (store_id, category_id, name, description, base_price, image_url, is_active, sort_order)
        VALUES 
          (v_store_id, v_cat_adicionais, 'Granola Crocante', 
           'Porção extra de granola artesanal.', 
           3.00, 
           'https://images.unsplash.com/photo-1517093728432-a0440f8d45af?auto=format&fit=crop&w=800&q=80',
           true, 1),
          (v_store_id, v_cat_adicionais, 'Leite Condensado', 
           'Porção extra de leite condensado.', 
           2.50, 
           'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80',
           true, 2),
          (v_store_id, v_cat_adicionais, 'Banana', 
           'Fatias de banana fresca.', 
           2.00, 
           'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
           true, 3),
          (v_store_id, v_cat_adicionais, 'Paçoca Triturada', 
           'Paçoca artesanal triturada.', 
           3.50, 
           'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80',
           true, 4)
        ON CONFLICT DO NOTHING;
      END IF;
      
      RAISE NOTICE 'Produtos de açaí criados com sucesso para loja %', v_store_id;
    ELSE
      RAISE NOTICE 'Loja % já possui % produtos. Pulando seed.', v_store_id, v_product_count;
    END IF;
  ELSE
    RAISE NOTICE 'Nenhuma loja de açaí encontrada.';
  END IF;
END $$;

-- 5. LOG FINAL
DO $$
DECLARE
  v_store_count INT;
  v_product_count INT;
BEGIN
  SELECT COUNT(*) INTO v_store_count FROM stores;
  SELECT COUNT(*) INTO v_product_count FROM products;
  RAISE NOTICE '=== MIGRATION COMPLETA ===';
  RAISE NOTICE 'Total de lojas: %', v_store_count;
  RAISE NOTICE 'Total de produtos: %', v_product_count;
  RAISE NOTICE '==========================';
END $$;
