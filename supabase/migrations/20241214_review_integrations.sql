-- Migração: Integrações de Reviews Externos
-- Unificar avaliações de Google, iFood, Rappi, etc.

-- =============================================
-- TABELA: Integrações de Reviews
-- =============================================
CREATE TABLE IF NOT EXISTS review_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Plataforma
  platform TEXT NOT NULL CHECK (platform IN ('google', 'ifood', 'rappi', 'ubereats', 'facebook', 'tripadvisor', 'reclameaqui', 'manual')),
  platform_name TEXT,
  
  -- Credenciais/Configuração
  api_key TEXT,
  api_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- IDs externos
  external_id TEXT,
  external_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT FALSE,
  is_connected BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_error TEXT,
  
  -- Configurações de sync
  auto_sync BOOLEAN DEFAULT TRUE,
  sync_interval_hours INTEGER DEFAULT 6,
  import_replies BOOLEAN DEFAULT TRUE,
  
  -- Estatísticas da plataforma
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, platform)
);

-- =============================================
-- TABELA: Reviews Importados (externos)
-- =============================================
CREATE TABLE IF NOT EXISTS external_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES review_integrations(id) ON DELETE CASCADE,
  
  -- ID externo para evitar duplicatas
  external_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  
  -- Dados do review
  customer_name TEXT,
  customer_avatar TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Resposta
  reply TEXT,
  reply_external_id TEXT,
  replied_at TIMESTAMPTZ,
  
  -- Metadados
  review_date TIMESTAMPTZ,
  review_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Importação
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB,
  
  -- Visibilidade local
  is_visible BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, platform, external_id)
);

-- =============================================
-- TABELA: Logs de Sincronização
-- =============================================
CREATE TABLE IF NOT EXISTS review_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES review_integrations(id) ON DELETE CASCADE,
  
  -- Resultado
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'partial', 'failed')),
  reviews_found INTEGER DEFAULT 0,
  reviews_imported INTEGER DEFAULT 0,
  reviews_updated INTEGER DEFAULT 0,
  reviews_skipped INTEGER DEFAULT 0,
  
  -- Erro
  error_message TEXT,
  error_details JSONB,
  
  -- Tempo
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER
);

-- =============================================
-- VIEW: Reviews Unificados
-- =============================================
CREATE OR REPLACE VIEW unified_reviews AS
SELECT 
  r.id,
  r.store_id,
  'internal' as source_type,
  r.source as platform,
  r.customer_name,
  NULL as customer_avatar,
  r.rating,
  r.comment,
  r.reply,
  r.replied_at,
  r.is_featured,
  r.is_verified,
  r.created_at as review_date,
  NULL as review_url
FROM reviews r
WHERE r.status = 'published'

UNION ALL

SELECT 
  er.id,
  er.store_id,
  'external' as source_type,
  er.platform,
  er.customer_name,
  er.customer_avatar,
  er.rating,
  er.comment,
  er.reply,
  er.replied_at,
  er.is_featured,
  er.is_verified,
  er.review_date,
  er.review_url
FROM external_reviews er
WHERE er.is_visible = TRUE;

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_review_integrations_store ON review_integrations(store_id);
CREATE INDEX IF NOT EXISTS idx_external_reviews_store ON external_reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_external_reviews_platform ON external_reviews(platform);
CREATE INDEX IF NOT EXISTS idx_external_reviews_external_id ON external_reviews(external_id);
CREATE INDEX IF NOT EXISTS idx_review_sync_logs_integration ON review_sync_logs(integration_id);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE review_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_integrations_all" ON review_integrations FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "external_reviews_all" ON external_reviews FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

CREATE POLICY "review_sync_logs_all" ON review_sync_logs FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid())
);

-- =============================================
-- FUNÇÕES
-- =============================================

-- Função para calcular estatísticas unificadas
CREATE OR REPLACE FUNCTION get_unified_review_stats(p_store_id UUID)
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating DECIMAL,
  internal_count BIGINT,
  external_count BIGINT,
  google_count BIGINT,
  ifood_count BIGINT,
  rappi_count BIGINT,
  facebook_count BIGINT,
  rating_5 BIGINT,
  rating_4 BIGINT,
  rating_3 BIGINT,
  rating_2 BIGINT,
  rating_1 BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_reviews,
    ROUND(AVG(rating)::DECIMAL, 2) as average_rating,
    COUNT(*) FILTER (WHERE source_type = 'internal') as internal_count,
    COUNT(*) FILTER (WHERE source_type = 'external') as external_count,
    COUNT(*) FILTER (WHERE platform = 'google') as google_count,
    COUNT(*) FILTER (WHERE platform = 'ifood') as ifood_count,
    COUNT(*) FILTER (WHERE platform = 'rappi') as rappi_count,
    COUNT(*) FILTER (WHERE platform = 'facebook') as facebook_count,
    COUNT(*) FILTER (WHERE rating = 5) as rating_5,
    COUNT(*) FILTER (WHERE rating = 4) as rating_4,
    COUNT(*) FILTER (WHERE rating = 3) as rating_3,
    COUNT(*) FILTER (WHERE rating = 2) as rating_2,
    COUNT(*) FILTER (WHERE rating = 1) as rating_1
  FROM unified_reviews
  WHERE store_id = p_store_id;
END;
$$ LANGUAGE plpgsql;

-- Função para importar review externo
CREATE OR REPLACE FUNCTION import_external_review(
  p_store_id UUID,
  p_integration_id UUID,
  p_platform TEXT,
  p_external_id TEXT,
  p_customer_name TEXT,
  p_rating INTEGER,
  p_comment TEXT,
  p_review_date TIMESTAMPTZ,
  p_raw_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_review_id UUID;
BEGIN
  INSERT INTO external_reviews (
    store_id, integration_id, platform, external_id,
    customer_name, rating, comment, review_date, raw_data
  ) VALUES (
    p_store_id, p_integration_id, p_platform, p_external_id,
    p_customer_name, p_rating, p_comment, p_review_date, p_raw_data
  )
  ON CONFLICT (store_id, platform, external_id) DO UPDATE SET
    customer_name = EXCLUDED.customer_name,
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    raw_data = EXCLUDED.raw_data
  RETURNING id INTO v_review_id;
  
  RETURN v_review_id;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar estatísticas da integração
CREATE OR REPLACE FUNCTION update_integration_stats(p_integration_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE review_integrations SET
    total_reviews = (
      SELECT COUNT(*) FROM external_reviews 
      WHERE integration_id = p_integration_id
    ),
    average_rating = (
      SELECT ROUND(AVG(rating)::DECIMAL, 2) FROM external_reviews 
      WHERE integration_id = p_integration_id
    ),
    updated_at = NOW()
  WHERE id = p_integration_id;
END;
$$ LANGUAGE plpgsql;
