-- Migration: Stripe Subscriptions
-- Criado em: 2025-01-18
-- Descrição: Tabelas para gerenciar assinaturas do Stripe

-- 1. Tabela de assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Dados do Stripe
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  
  -- Dados do cliente
  customer_email TEXT NOT NULL,
  
  -- Plano e status
  plan_name TEXT NOT NULL CHECK (plan_name IN ('basic', 'pro', 'enterprise')),
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('month', 'year')) DEFAULT 'month',
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'trialing')) DEFAULT 'incomplete',
  
  -- Datas
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de eventos do Stripe (webhook log)
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  customer_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de histórico de pagamentos
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_paid INTEGER NOT NULL, -- em centavos
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('paid', 'open', 'void', 'uncollectible')),
  invoice_pdf TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_type ON public.stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON public.stripe_events(processed);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON public.payment_history(subscription_id);

-- 5. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para atualizar updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Policies para subscriptions
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmin can view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policies para stripe_events (apenas service_role e superadmin)
CREATE POLICY "Superadmin can view stripe events"
  ON public.stripe_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Service role can manage stripe events"
  ON public.stripe_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policies para payment_history
CREATE POLICY "Users can view own payment history"
  ON public.payment_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE subscriptions.id = payment_history.subscription_id
      AND subscriptions.user_id = auth.uid()
    )
  );

CREATE POLICY "Superadmin can view all payment history"
  ON public.payment_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Service role can manage payment history"
  ON public.payment_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 8. Função helper para verificar se usuário tem assinatura ativa
CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    AND (current_period_end IS NULL OR current_period_end > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. View para facilitar consultas de assinaturas ativas
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  s.*,
  up.email as user_email,
  up.role as user_role
FROM public.subscriptions s
JOIN public.user_profiles up ON s.user_id = up.id
WHERE s.status = 'active'
AND (s.current_period_end IS NULL OR s.current_period_end > NOW());

-- 10. Comentários
COMMENT ON TABLE public.subscriptions IS 'Assinaturas do Stripe vinculadas a usuários';
COMMENT ON TABLE public.stripe_events IS 'Log de eventos recebidos via webhook do Stripe';
COMMENT ON TABLE public.payment_history IS 'Histórico de pagamentos e invoices';
COMMENT ON FUNCTION has_active_subscription IS 'Verifica se usuário tem assinatura ativa';
