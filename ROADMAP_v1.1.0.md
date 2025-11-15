# Roadmap Loquia v1.1.0

**Versão Atual:** 1.0.0  
**Próxima Versão:** 1.1.0  
**Previsão de Lançamento:** Q2 2025 (Abril-Junho)  
**Status:** 📋 Planejamento

---

## 🎯 Objetivo da v1.1.0

Expandir as capacidades de **relatórios**, **notificações** e **integrações** do Loquia, tornando a plataforma ainda mais completa e automatizada.

---

## ✨ Features Planejadas

### 1. Relatórios Automáticos em PDF 📊
**Prioridade:** 🔴 Alta  
**Impacto:** 🚀 Alto  
**Esforço:** 🟡 Médio (2-3 semanas)

**Descrição:**
Gerar automaticamente relatórios em PDF com:
- Performance de campanhas
- Insights da IA
- Otimizações implementadas
- Gráficos e métricas
- Comparação de períodos

**Funcionalidades:**
- Relatórios semanais/mensais automáticos
- Personalização de template
- Envio automático por email
- Download manual
- White-label (logo da agência)

**Tecnologias:**
- `react-pdf` ou `puppeteer`
- Cron jobs (Vercel Cron)
- Resend (email)

**Branch sugerida:** `feature/pdf-reports`

---

### 2. Integração com Slack/Discord 💬
**Prioridade:** 🟡 Média  
**Impacto:** 🚀 Alto  
**Esforço:** 🟢 Baixo (1 semana)

**Descrição:**
Notificações em tempo real via Slack ou Discord:
- Novos insights gerados
- Otimizações sugeridas
- Alertas de performance
- Mudanças em campanhas

**Funcionalidades:**
- Webhook configurável
- Escolha de canais
- Filtros de notificações
- Formatação rica (embeds)

**Tecnologias:**
- Slack API
- Discord Webhooks
- Next.js API Routes

**Branch sugerida:** `feature/slack-discord-integration`

---

### 3. Alertas Personalizados ⚠️
**Prioridade:** 🟡 Média  
**Impacto:** 🔥 Médio  
**Esforço:** 🟡 Médio (2 semanas)

**Descrição:**
Sistema de alertas configurável:
- CPA acima de X
- CTR abaixo de Y
- Budget atingindo limite
- Conversões em queda

**Funcionalidades:**
- Regras customizáveis
- Notificações multi-canal (email, Slack, Discord, in-app)
- Histórico de alertas
- Ações sugeridas

**Tecnologias:**
- Supabase Functions (cron)
- Resend (email)
- Webhooks

**Branch sugerida:** `feature/custom-alerts`

---

### 4. Comparação de Períodos 📈
**Prioridade:** 🟡 Média  
**Impacto:** 🔥 Médio  
**Esforço:** 🟢 Baixo (1 semana)

**Descrição:**
Comparar métricas entre períodos:
- Semana atual vs semana anterior
- Mês atual vs mês anterior
- Período customizado

**Funcionalidades:**
- Seletor de períodos
- Gráficos comparativos
- Variação percentual
- Insights automáticos sobre mudanças

**Tecnologias:**
- Recharts (gráficos)
- Date-fns (manipulação de datas)

**Branch sugerida:** `feature/period-comparison`

---

### 5. API Pública (Beta) 🔌
**Prioridade:** 🟢 Baixa  
**Impacto:** 🚀 Alto (longo prazo)  
**Esforço:** 🔴 Alto (3-4 semanas)

**Descrição:**
API REST pública para integração externa:
- Listar campanhas
- Obter insights
- Criar/atualizar campanhas
- Webhooks

**Funcionalidades:**
- Autenticação via API Key
- Rate limiting
- Documentação OpenAPI
- SDKs (JavaScript, Python)

**Tecnologias:**
- Next.js API Routes
- API Key management
- Swagger/OpenAPI

**Branch sugerida:** `feature/public-api`

---

## 📊 Priorização

| Feature | Prioridade | Impacto | Esforço | Score |
|---------|-----------|---------|---------|-------|
| Relatórios PDF | 🔴 Alta | 🚀 Alto | 🟡 Médio | 9/10 |
| Slack/Discord | 🟡 Média | 🚀 Alto | 🟢 Baixo | 8/10 |
| Alertas | 🟡 Média | 🔥 Médio | 🟡 Médio | 7/10 |
| Comparação | 🟡 Média | 🔥 Médio | 🟢 Baixo | 7/10 |
| API Pública | 🟢 Baixa | 🚀 Alto | 🔴 Alto | 6/10 |

---

## 📅 Cronograma Estimado

### Semana 1-2: Relatórios PDF
- Implementar geração de PDF
- Criar templates
- Integrar com campanhas
- Testes

### Semana 3: Slack/Discord
- Implementar webhooks
- Criar formatação de mensagens
- Testes

### Semana 4-5: Alertas Personalizados
- Criar sistema de regras
- Implementar notificações
- UI de configuração
- Testes

### Semana 6: Comparação de Períodos
- Implementar lógica de comparação
- Criar gráficos
- UI
- Testes

### Semana 7-10: API Pública (Beta)
- Design da API
- Implementação
- Documentação
- Testes

**Total:** ~10 semanas (2.5 meses)

---

## 🏗️ Estrutura de Branches

```
main
├── feature/pdf-reports
│   ├── lib/pdf-generator.ts
│   ├── app/api/reports/[id]/pdf/route.ts
│   └── components/reports/pdf-template.tsx
│
├── feature/slack-discord-integration
│   ├── app/api/integrations/slack/route.ts
│   ├── app/api/integrations/discord/route.ts
│   └── lib/notification-service.ts
│
├── feature/custom-alerts
│   ├── app/api/alerts/route.ts
│   ├── app/alerts/page.tsx
│   ├── components/alerts/alert-rule-form.tsx
│   └── supabase/migrations/010_create_alerts_table.sql
│
├── feature/period-comparison
│   ├── app/campaigns/[id]/compare/page.tsx
│   ├── components/charts/comparison-chart.tsx
│   └── lib/period-comparison.ts
│
└── feature/public-api
    ├── app/api/v1/campaigns/route.ts
    ├── app/api/v1/insights/route.ts
    ├── lib/api-auth.ts
    └── docs/openapi.yaml
```

---

## 🗄️ Banco de Dados (Novas Tabelas)

### Migration 010: Alerts
```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'cpa', 'ctr', 'budget', 'conversions'
  condition JSONB NOT NULL, -- {operator: 'gt', value: 100}
  channels TEXT[] NOT NULL, -- ['email', 'slack', 'discord']
  enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 011: Reports
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'weekly', 'monthly', 'custom'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 012: API Keys
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🧪 Testes Necessários

### Relatórios PDF
- [ ] Geração de PDF com dados reais
- [ ] Template responsivo
- [ ] Envio por email
- [ ] Download manual
- [ ] White-label

### Slack/Discord
- [ ] Envio de notificação
- [ ] Formatação correta
- [ ] Múltiplos canais
- [ ] Retry em caso de falha

### Alertas
- [ ] Criação de regra
- [ ] Trigger de alerta
- [ ] Notificação multi-canal
- [ ] Histórico

### Comparação
- [ ] Cálculo de variação
- [ ] Gráficos corretos
- [ ] Períodos customizados

### API Pública
- [ ] Autenticação
- [ ] Rate limiting
- [ ] Endpoints funcionais
- [ ] Documentação

---

## 📝 Documentação a Ser Atualizada

- [ ] Manual do Usuário (Agência)
- [ ] Manual do Cliente
- [ ] Documentação Técnica
- [ ] CHANGELOG
- [ ] RELEASE_NOTES_v1.1.0.md
- [ ] API Documentation (OpenAPI)

---

## 🚀 Critérios de Lançamento

Para lançar a v1.1.0, TODAS as seguintes condições devem ser atendidas:

- [ ] Todas as 5 features implementadas
- [ ] 100% dos testes passando
- [ ] Documentação atualizada
- [ ] Build de produção validado
- [ ] Flow X validado
- [ ] Migrations executadas
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy em produção concluído
- [ ] Validação completa em produção
- [ ] Release Notes publicadas

---

## 💡 Features Futuras (v1.2.0+)

- Integrações adicionais (Pinterest, Snapchat)
- IA generativa para criativos
- A/B testing automático
- Previsão de budget
- White-label completo
- Modo agência white-label
- Webhooks customizados
- SSO (Single Sign-On)
- 2FA (Two-Factor Authentication)

---

**Última atualização:** $(date '+%d/%m/%Y')  
**Responsável:** Equipe Loquia
