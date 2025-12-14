-- Tabela de cozinheiros
CREATE TABLE IF NOT EXISTS kitchen_chefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_kitchen_chefs_store ON kitchen_chefs(store_id);

-- RLS
ALTER TABLE kitchen_chefs ENABLE ROW LEVEL SECURITY;

-- Policy de acesso
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'kitchen_chefs_all') THEN
    CREATE POLICY "kitchen_chefs_all" ON kitchen_chefs FOR ALL USING (true);
  END IF;
END $$;
