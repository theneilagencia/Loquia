-- Intent Proof Dashboard™ Schema
-- Tabelas para monitoramento e analytics de intenções

-- 1. Status de IAs (OpenAI, Perplexity, Claude, SGIE)
CREATE TABLE IF NOT EXISTS public.ia_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ia_name TEXT NOT NULL, -- 'openai', 'perplexity', 'claude', 'sgie'
  status TEXT NOT NULL, -- 'healthy', 'degraded', 'down'
  response_time_ms INTEGER,
  last_check TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Logs de consultas das IAs ao feed
CREATE TABLE IF NOT EXISTS public.ia_feed_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ia_name TEXT NOT NULL,
  query TEXT NOT NULL,
  feed_id UUID REFERENCES public.feeds(id) ON DELETE SET NULL,
  response_snippet TEXT,
  matched BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Logs de intenções ativadas
CREATE TABLE IF NOT EXISTS public.intent_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent_id UUID REFERENCES public.intents(id) ON DELETE SET NULL,
  user_query TEXT NOT NULL,
  ia_name TEXT NOT NULL,
  confidence_score DECIMAL(3,2), -- 0.00 a 1.00
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Leads capturados
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent_id UUID REFERENCES public.intents(id) ON DELETE SET NULL,
  source_ia TEXT NOT NULL,
  user_query TEXT,
  contact_info JSONB, -- {email, phone, name, etc}
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'converted', 'lost'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Cards gerativos simulados
CREATE TABLE IF NOT EXISTS public.generative_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ia_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  cta_text TEXT,
  cta_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Eventos em tempo real
CREATE TABLE IF NOT EXISTS public.realtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'query', 'activation', 'lead', 'recommendation'
  ia_name TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ia_status_name ON public.ia_status(ia_name);
CREATE INDEX IF NOT EXISTS idx_ia_status_created ON public.ia_status(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feed_queries_tenant ON public.ia_feed_queries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feed_queries_created ON public.ia_feed_queries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_intent_activations_tenant ON public.intent_activations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_intent_activations_created ON public.intent_activations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_tenant ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generative_cards_tenant ON public.generative_cards(tenant_id);

CREATE INDEX IF NOT EXISTS idx_realtime_events_tenant ON public.realtime_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_realtime_events_created ON public.realtime_events(created_at DESC);

-- RLS Policies
ALTER TABLE public.ia_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_feed_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intent_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generative_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_events ENABLE ROW LEVEL SECURITY;

-- Políticas: todos podem ver status das IAs
CREATE POLICY "Anyone can view IA status"
ON public.ia_status FOR SELECT
TO authenticated
USING (true);

-- Políticas: usuários veem apenas seus próprios dados
CREATE POLICY "Users can view own feed queries"
ON public.ia_feed_queries FOR SELECT
TO authenticated
USING (tenant_id = auth.uid());

CREATE POLICY "Users can view own intent activations"
ON public.intent_activations FOR SELECT
TO authenticated
USING (tenant_id = auth.uid());

CREATE POLICY "Users can view own leads"
ON public.leads FOR SELECT
TO authenticated
USING (tenant_id = auth.uid());

CREATE POLICY "Users can manage own leads"
ON public.leads FOR UPDATE
TO authenticated
USING (tenant_id = auth.uid())
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can view own generative cards"
ON public.generative_cards FOR SELECT
TO authenticated
USING (tenant_id = auth.uid());

CREATE POLICY "Users can view own realtime events"
ON public.realtime_events FOR SELECT
TO authenticated
USING (tenant_id = auth.uid());

-- Inserir dados iniciais de status das IAs
INSERT INTO public.ia_status (ia_name, status, response_time_ms, last_check) VALUES
('openai', 'healthy', 120, NOW()),
('perplexity', 'healthy', 95, NOW()),
('claude', 'healthy', 110, NOW()),
('sgie', 'healthy', 85, NOW())
ON CONFLICT DO NOTHING;

-- Função para limpar eventos antigos (manter últimos 30 dias)
CREATE OR REPLACE FUNCTION clean_old_events()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.realtime_events
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Comentários nas tabelas
COMMENT ON TABLE public.ia_status IS 'Status de saúde das IAs (OpenAI, Perplexity, Claude, SGIE)';
COMMENT ON TABLE public.ia_feed_queries IS 'Logs de consultas das IAs aos feeds da empresa';
COMMENT ON TABLE public.intent_activations IS 'Logs de intenções ativadas por perguntas de usuários';
COMMENT ON TABLE public.leads IS 'Leads capturados através das IAs';
COMMENT ON TABLE public.generative_cards IS 'Cards gerativos que mostram como a IA apresenta a marca';
COMMENT ON TABLE public.realtime_events IS 'Eventos em tempo real para monitoramento';
