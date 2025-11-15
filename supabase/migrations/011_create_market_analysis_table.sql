-- Migration: Create campaign_market_analysis table
-- Description: Armazena análises de mercado geradas via Apify

CREATE TABLE IF NOT EXISTS campaign_market_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  keywords TEXT[] NOT NULL,
  competitors TEXT[],
  regions TEXT[],
  apify_run_id TEXT,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  results JSONB,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_market_analysis_campaign_id ON campaign_market_analysis(campaign_id);
CREATE INDEX idx_market_analysis_status ON campaign_market_analysis(status);
CREATE INDEX idx_market_analysis_created_at ON campaign_market_analysis(created_at DESC);

-- RLS Policies
ALTER TABLE campaign_market_analysis ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver análises de campanhas do seu tenant
CREATE POLICY "Users can view market analysis of their tenant campaigns"
  ON campaign_market_analysis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      INNER JOIN profiles p ON p.tenant_id = c.tenant_id
      WHERE c.id = campaign_market_analysis.campaign_id
      AND p.id = auth.uid()
    )
  );

-- Policy: Agências podem criar análises
CREATE POLICY "Agencies can create market analysis"
  ON campaign_market_analysis
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'agency')
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_market_analysis_updated_at
  BEFORE UPDATE ON campaign_market_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE campaign_market_analysis IS 'Armazena análises de mercado geradas via Apify';
COMMENT ON COLUMN campaign_market_analysis.keywords IS 'Palavras-chave pesquisadas';
COMMENT ON COLUMN campaign_market_analysis.competitors IS 'Competidores analisados';
COMMENT ON COLUMN campaign_market_analysis.regions IS 'Regiões analisadas';
COMMENT ON COLUMN campaign_market_analysis.apify_run_id IS 'ID do run no Apify';
COMMENT ON COLUMN campaign_market_analysis.status IS 'Status da análise: running, completed, failed';
COMMENT ON COLUMN campaign_market_analysis.results IS 'Resultados da análise em JSON';
