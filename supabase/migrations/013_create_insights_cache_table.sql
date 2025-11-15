-- Tabela para cache de insights gerados
CREATE TABLE IF NOT EXISTS insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  insights_data JSONB NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  model VARCHAR(50) NOT NULL DEFAULT 'gpt-4o-mini',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  CONSTRAINT fk_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_insights_cache_campaign ON insights_cache(campaign_id);
CREATE INDEX idx_insights_cache_expires ON insights_cache(expires_at);
CREATE INDEX idx_insights_cache_created ON insights_cache(created_at DESC);

-- RLS Policies
ALTER TABLE insights_cache ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver insights de campanhas do seu tenant
CREATE POLICY "Users can view insights from their tenant"
  ON insights_cache
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Usuários podem criar insights para campanhas do seu tenant
CREATE POLICY "Users can create insights for their tenant campaigns"
  ON insights_cache
  FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns
      WHERE tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Função para limpar cache expirado automaticamente
CREATE OR REPLACE FUNCTION clean_expired_insights_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM insights_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE insights_cache IS 'Cache de insights gerados por IA com TTL de 24h';
COMMENT ON COLUMN insights_cache.insights_data IS 'Dados do insight em formato JSON';
COMMENT ON COLUMN insights_cache.tokens_used IS 'Número de tokens consumidos na geração';
COMMENT ON COLUMN insights_cache.cost_usd IS 'Custo em USD da geração do insight';
COMMENT ON COLUMN insights_cache.expires_at IS 'Data de expiração do cache (24h após criação)';
