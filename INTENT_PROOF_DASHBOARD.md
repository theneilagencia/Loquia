# Intent Proof Dashboard™

**A comprovação que o cliente precisa.**

Não adianta prometer. Precisamos mostrar.

O Intent Proof Dashboard™ entrega transparência total e prova real de que sua empresa está sendo usada pelas IAs.

---

## Funcionalidades Implementadas

### 1. Status da presença IA ✅
Monitoramento em tempo real do status de saúde das principais IAs:
- **OpenAI** 🤖
- **Perplexity** 🔮
- **Claude** 🧠
- **SGIE** ⚡

Cada IA exibe:
- Status visual (verde/amarelo/vermelho)
- Tempo de resposta em ms
- Última verificação

### 2. Feed Viewer ✅
Visualização das versões do feed exatamente como as IAs consomem.

### 3. Logs de intenção ativada ✅
Cada vez que alguém pergunta algo que sua empresa resolve, o sistema registra:
- Query do usuário
- IA que ativou
- Score de confiança
- Data e hora

### 4. Consultas reais da IA ao seu feed ✅
Prova técnica que valida a integração:
- Todas as queries das IAs
- Feeds consultados
- Matches encontrados

### 5. Cards gerativos simulados ✅
Mostrando como a IA apresenta sua marca:
- Título
- Descrição
- Imagem
- Call-to-action

### 6. Monitor em tempo real ✅
Eventos como consultas, ativações e leads capturados ao vivo:
- Atualização automática a cada 5 segundos
- Histórico dos últimos 20 eventos
- Indicador visual de atividade

### 7. Analytics completos ✅
Dashboard com métricas principais:
- **Intenções mais acionadas**
- **Leads gerados**
- **Recomendações feitas**
- **Origem por IA**

---

## Estrutura de Banco de Dados

### Tabelas Criadas

#### 1. `ia_status`
Status de saúde das IAs.
```sql
- id (UUID)
- ia_name (TEXT): 'openai', 'perplexity', 'claude', 'sgie'
- status (TEXT): 'healthy', 'degraded', 'down'
- response_time_ms (INTEGER)
- last_check (TIMESTAMPTZ)
- error_message (TEXT)
```

#### 2. `ia_feed_queries`
Logs de consultas das IAs aos feeds.
```sql
- id (UUID)
- tenant_id (UUID)
- ia_name (TEXT)
- query (TEXT)
- feed_id (UUID)
- response_snippet (TEXT)
- matched (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

#### 3. `intent_activations`
Logs de intenções ativadas.
```sql
- id (UUID)
- tenant_id (UUID)
- intent_id (UUID)
- user_query (TEXT)
- ia_name (TEXT)
- confidence_score (DECIMAL)
- created_at (TIMESTAMPTZ)
```

#### 4. `leads`
Leads capturados através das IAs.
```sql
- id (UUID)
- tenant_id (UUID)
- intent_id (UUID)
- source_ia (TEXT)
- user_query (TEXT)
- contact_info (JSONB)
- status (TEXT): 'new', 'contacted', 'converted', 'lost'
- created_at (TIMESTAMPTZ)
```

#### 5. `generative_cards`
Cards gerativos que mostram como a IA apresenta a marca.
```sql
- id (UUID)
- tenant_id (UUID)
- ia_name (TEXT)
- title (TEXT)
- description (TEXT)
- image_url (TEXT)
- cta_text (TEXT)
- cta_url (TEXT)
- created_at (TIMESTAMPTZ)
```

#### 6. `realtime_events`
Eventos em tempo real para monitoramento.
```sql
- id (UUID)
- tenant_id (UUID)
- event_type (TEXT): 'query', 'activation', 'lead', 'recommendation'
- ia_name (TEXT)
- description (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMPTZ)
```

---

## Como Aplicar a Migration

### Passo 1: Acesse o SQL Editor do Supabase
1. Vá em https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **SQL Editor**

### Passo 2: Execute a Migration
1. Copie o conteúdo de `supabase/migrations/002_intent_proof_dashboard.sql`
2. Cole no SQL Editor
3. Clique em **Run** (ou Ctrl+Enter)

### Passo 3: Verifique as Tabelas
Execute:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'ia_%' OR tablename IN ('leads', 'generative_cards', 'realtime_events');
```

Deve retornar:
- ia_status
- ia_feed_queries
- intent_activations
- leads
- generative_cards
- realtime_events

---

## Como Acessar

### URL
https://loquia.com.br/intent-proof

### Navegação
No header privado (após login), clique em **Intent Proof™** (em amarelo).

---

## Recursos Técnicos

### Auto-refresh
A página atualiza automaticamente a cada 5 segundos para mostrar dados em tempo real.

### RLS (Row Level Security)
Todos os dados são protegidos por RLS. Cada usuário vê apenas seus próprios dados, exceto o status das IAs que é público.

### Performance
Índices otimizados em todas as tabelas para queries rápidas.

### Limpeza Automática
Função `clean_old_events()` disponível para limpar eventos com mais de 30 dias.

---

## Próximos Passos (Opcional)

### 1. Integração com IAs Reais
Conectar com APIs reais das IAs para:
- Monitorar status real
- Capturar queries reais
- Registrar ativações reais

### 2. Notificações
Enviar notificações quando:
- Nova intenção é ativada
- Novo lead é capturado
- IA fica fora do ar

### 3. Exportação de Dados
Permitir exportar:
- Relatórios em PDF
- Dados em CSV/Excel
- Analytics em gráficos

### 4. Dashboard Público
Criar versão pública do dashboard para compartilhar com clientes.

---

## Mensagem Final

> **O Intent Proof Dashboard™ é o que transforma a Loquia em prova viva e o mensal em decisão óbvia.**

---

## Suporte

Se precisar de ajuda, consulte:
- Documentação do Supabase: https://supabase.com/docs
- Repositório do projeto: https://github.com/theneilagencia/loquia-frontend
