# Progresso da Integração Stripe - Loquia

**Data**: 18 de Janeiro de 2025  
**Status**: Migration aplicada, código implementado, aguardando configuração do Stripe

---

## ✅ Concluído

### 1. Estrutura de Banco de Dados
- ✅ **Migration 003 aplicada com sucesso** no Supabase
- ✅ Tabelas criadas:
  - `subscriptions` - Gerenciamento de assinaturas
  - `stripe_events` - Log de webhooks do Stripe
  - `payment_history` - Histórico de pagamentos
- ✅ Índices criados para performance
- ✅ RLS (Row Level Security) configurado
- ✅ Policies criadas para controle de acesso
- ✅ Função `has_active_subscription()` criada
- ✅ View `active_subscriptions` criada

### 2. Código da Aplicação
- ✅ **Webhook handler** implementado (`/api/stripe/webhook/route.ts`)
  - Eventos tratados: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- ✅ **Endpoint de checkout** criado (`/api/stripe/create-checkout/route.ts`)
- ✅ **Endpoint de portal** criado (`/api/stripe/create-portal/route.ts`)
- ✅ **Página de pricing** implementada (`/app/pricing/page.tsx`)
  - 3 planos: Basic ($59), Pro ($79), Enterprise ($280)
  - Toggle mensal/anual com 30% de desconto
- ✅ **Hook useSubscription** criado para verificar status de assinatura
- ✅ **Componente RequireSubscription** criado para proteção de rotas
- ✅ **Biblioteca Stripe** configurada (`/lib/stripe.ts`)
- ✅ **Build bem-sucedido** - Código compila sem erros
- ✅ **Deploy automático** configurado no Vercel via GitHub

### 3. Configurações
- ✅ Variáveis de ambiente locais configuradas
- ✅ Credenciais do Supabase atualizadas (projeto `xfvlvfoigbnipezxwmzt`)
- ✅ Chaves do Stripe adicionadas ao `.env.local`

---

## 🔄 Próximos Passos

### Passo 1: Configurar Variáveis de Ambiente no Vercel

Acesse: https://vercel.com/theneilagencia/loquia-frontend/settings/environment-variables

Adicione as seguintes variáveis:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xfvlvfoigbnipezxwmzt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<obter_no_supabase_dashboard>
SUPABASE_SERVICE_ROLE_KEY=<obter_no_supabase_dashboard>

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<obter_no_stripe_dashboard>
STRIPE_SECRET_KEY=<obter_no_stripe_dashboard>

# Base URL
NEXT_PUBLIC_BASE_URL=https://loquia.com.br
```

### Passo 2: Criar Produtos e Preços no Stripe

Acesse: https://dashboard.stripe.com/products

#### Produto 1: Basic
- Nome: **Loquia Basic**
- Descrição: Presença em OpenAI e Perplexity com até 10 intenções
- Preços:
  - Mensal: $59.00 USD (recorrente)
  - Anual: $495.60 USD (recorrente) - 30% desconto

#### Produto 2: Pro
- Nome: **Loquia Pro**
- Descrição: Presença em todas as IAs com até 50 intenções e Intent Proof Dashboard
- Preços:
  - Mensal: $79.00 USD (recorrente)
  - Anual: $663.60 USD (recorrente) - 30% desconto

#### Produto 3: Enterprise
- Nome: **Loquia Enterprise**
- Descrição: Presença ilimitada com API, consultoria estratégica e suporte 24/7
- Preços:
  - Mensal: $280.00 USD (recorrente)
  - Anual: $2,352.00 USD (recorrente) - 30% desconto

**Após criar os produtos**, copie os **Price IDs** e adicione às variáveis de ambiente:

```bash
STRIPE_BASIC_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_BASIC_YEARLY_PRICE_ID=price_xxxxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_xxxxx
```

### Passo 3: Configurar Webhook do Stripe

Acesse: https://dashboard.stripe.com/webhooks

1. Clique em **"Add endpoint"**
2. URL do endpoint: `https://loquia.com.br/api/stripe/webhook`
3. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copie o **Webhook Signing Secret** (`whsec_...`)
5. Adicione às variáveis de ambiente:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Passo 4: Testar o Fluxo Completo

#### Teste 1: Novo Usuário
1. Criar conta em https://loquia.com.br/signup
2. Fazer login
3. Ser redirecionado para `/pricing`
4. Escolher um plano
5. Completar pagamento no Stripe Checkout
6. Ser redirecionado de volta para `/billing/success`
7. Verificar acesso ao dashboard

#### Teste 2: Webhook
1. Usar Stripe CLI para testar webhooks localmente:
```bash
stripe listen --forward-to https://loquia.com.br/api/stripe/webhook
stripe trigger checkout.session.completed
```

#### Teste 3: Gerenciamento de Assinatura
1. Login como usuário com assinatura ativa
2. Acessar perfil/configurações
3. Clicar em "Gerenciar Assinatura"
4. Verificar redirecionamento para Stripe Customer Portal
5. Testar upgrade/downgrade/cancelamento

### Passo 5: Implementar Bloqueio de Acesso

Adicionar verificação de assinatura nos componentes protegidos:

```typescript
// Exemplo: src/app/(private)/dashboard/page.tsx
import { RequireSubscription } from '@/components/auth/RequireSubscription';

export default function DashboardPage() {
  return (
    <RequireSubscription>
      {/* Conteúdo do dashboard */}
    </RequireSubscription>
  );
}
```

---

## 📋 Checklist Final

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Produtos e preços criados no Stripe
- [ ] Price IDs adicionados às variáveis de ambiente
- [ ] Webhook configurado no Stripe
- [ ] Webhook secret adicionado às variáveis de ambiente
- [ ] Deploy realizado no Vercel
- [ ] Teste de novo usuário realizado
- [ ] Teste de pagamento realizado
- [ ] Teste de webhook realizado
- [ ] Teste de gerenciamento de assinatura realizado
- [ ] Bloqueio de acesso implementado
- [ ] Teste de bloqueio realizado (usuário sem assinatura)

---

## 🔐 Segurança

**IMPORTANTE**: As credenciais compartilhadas durante o desenvolvimento devem ser regeneradas após a conclusão do projeto:

1. **Supabase**:
   - Regenerar Service Role Key em: https://supabase.com/dashboard/project/xfvlvfoigbnipezxwmzt/settings/api
   
2. **Stripe**:
   - Criar novas chaves em: https://dashboard.stripe.com/apikeys
   - Revogar as chaves antigas

3. **Gemini API**:
   - Regenerar chave em: https://makersuite.google.com/app/apikey

---

## 📚 Documentação de Referência

- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

## 🐛 Troubleshooting

### Erro: "STRIPE_SECRET_KEY não configurada"
- Verificar se as variáveis de ambiente estão configuradas no Vercel
- Fazer redeploy após adicionar variáveis

### Erro: "Webhook signature verification failed"
- Verificar se o `STRIPE_WEBHOOK_SECRET` está correto
- Verificar se o endpoint está acessível publicamente

### Erro: "User does not have active subscription"
- Verificar se o webhook `checkout.session.completed` foi processado
- Verificar logs na tabela `stripe_events`
- Verificar se a subscription foi criada na tabela `subscriptions`

### Erro: "Price ID not found"
- Verificar se os Price IDs foram adicionados às variáveis de ambiente
- Verificar se os IDs correspondem aos produtos criados no Stripe

---

## 📞 Contato

Para dúvidas ou suporte:
- Email: vinicius.debian@theneil.com.br
- Stripe Account: vinicius.debian@theneil.com.br
