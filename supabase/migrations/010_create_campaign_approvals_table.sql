-- Tabela de aprovações de campanhas
-- Sistema de aprovação cliente-agência

CREATE TABLE IF NOT EXISTS campaign_approvals (
  -- Identificador único da aprovação
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Referência à campanha
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Quem aprovou/rejeitou
  approver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Status da aprovação
  status TEXT NOT NULL DEFAULT 'pending',
  -- Valores possíveis: pending, approved, rejected
  
  -- Comentários do aprovador
  comments TEXT,
  
  -- Data de aprovação/rejeição
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  
  -- Metadados adicionais
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_approvals_campaign_id ON campaign_approvals(campaign_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver_id ON campaign_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON campaign_approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON campaign_approvals(created_at DESC);

-- Índice composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_approvals_campaign_status 
  ON campaign_approvals(campaign_id, status);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_approvals_updated_at
  BEFORE UPDATE ON campaign_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar approved_at/rejected_at
CREATE OR REPLACE FUNCTION update_approval_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.approved_at = NOW();
  ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    NEW.rejected_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_approval_timestamps
  BEFORE UPDATE ON campaign_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_timestamps();

-- Comentários para documentação
COMMENT ON TABLE campaign_approvals IS 'Aprovações de campanhas (cliente-agência)';
COMMENT ON COLUMN campaign_approvals.campaign_id IS 'ID da campanha a ser aprovada';
COMMENT ON COLUMN campaign_approvals.approver_id IS 'ID do usuário que aprovou/rejeitou';
COMMENT ON COLUMN campaign_approvals.status IS 'Status: pending, approved, rejected';

-- Row Level Security (RLS)
ALTER TABLE campaign_approvals ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver aprovações das campanhas do seu tenant
CREATE POLICY "Users can view approvals of their tenant campaigns"
  ON campaign_approvals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN profiles p ON p.tenant_id = c.tenant_id
      WHERE c.id = campaign_approvals.campaign_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Clientes podem criar aprovações (aprovar/rejeitar)
CREATE POLICY "Clients can create approvals"
  ON campaign_approvals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN profiles p ON p.tenant_id = c.tenant_id
      WHERE c.id = campaign_approvals.campaign_id
      AND p.user_id = auth.uid()
      AND p.role = 'client'
    )
    AND approver_id = auth.uid()
  );

-- Policy: Clientes podem atualizar suas próprias aprovações (mudar de pending para approved/rejected)
CREATE POLICY "Clients can update their own approvals"
  ON campaign_approvals
  FOR UPDATE
  USING (
    approver_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'client'
    )
  );

-- Policy: Agências podem ver todas as aprovações do seu tenant
CREATE POLICY "Agencies can view all approvals"
  ON campaign_approvals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN profiles p ON p.tenant_id = c.tenant_id
      WHERE c.id = campaign_approvals.campaign_id
      AND p.user_id = auth.uid()
      AND p.role = 'agency'
    )
  );

-- Policy: Admins podem fazer tudo
CREATE POLICY "Admins can do everything with approvals"
  ON campaign_approvals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON campaign_approvals TO authenticated;
GRANT ALL ON campaign_approvals TO service_role;
