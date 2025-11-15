-- Migration: Create campaign_voice_interactions table
-- Description: Armazena interações por voz via RetellAI

CREATE TABLE IF NOT EXISTS campaign_voice_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  retell_call_id TEXT,
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'in_progress', 'completed', 'failed', 'no_answer')),
  duration_seconds INTEGER,
  transcript TEXT,
  recording_url TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_voice_interactions_campaign_id ON campaign_voice_interactions(campaign_id);
CREATE INDEX idx_voice_interactions_status ON campaign_voice_interactions(status);
CREATE INDEX idx_voice_interactions_created_at ON campaign_voice_interactions(created_at DESC);

-- RLS Policies
ALTER TABLE campaign_voice_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver interações de campanhas do seu tenant
CREATE POLICY "Users can view voice interactions of their tenant campaigns"
  ON campaign_voice_interactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      INNER JOIN profiles p ON p.tenant_id = c.tenant_id
      WHERE c.id = campaign_voice_interactions.campaign_id
      AND p.id = auth.uid()
    )
  );

-- Policy: Agências podem criar interações
CREATE POLICY "Agencies can create voice interactions"
  ON campaign_voice_interactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'agency')
    )
  );

-- Policy: Sistema pode atualizar status
CREATE POLICY "System can update voice interactions"
  ON campaign_voice_interactions
  FOR UPDATE
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_voice_interactions_updated_at
  BEFORE UPDATE ON campaign_voice_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE campaign_voice_interactions IS 'Armazena interações por voz via RetellAI';
COMMENT ON COLUMN campaign_voice_interactions.phone_number IS 'Número de telefone contatado';
COMMENT ON COLUMN campaign_voice_interactions.retell_call_id IS 'ID da chamada no RetellAI';
COMMENT ON COLUMN campaign_voice_interactions.status IS 'Status da chamada';
COMMENT ON COLUMN campaign_voice_interactions.duration_seconds IS 'Duração da chamada em segundos';
COMMENT ON COLUMN campaign_voice_interactions.transcript IS 'Transcrição da conversa';
COMMENT ON COLUMN campaign_voice_interactions.recording_url IS 'URL da gravação';
COMMENT ON COLUMN campaign_voice_interactions.sentiment IS 'Sentimento detectado na conversa';
