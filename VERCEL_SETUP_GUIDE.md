# Guia de Configuração do Vercel - Loquia

## 🚨 Problema Identificado

A página `/pricing` está retornando erro 404 ou erro de runtime porque **as variáveis de ambiente não estão configuradas no Vercel**.

O erro específico é:
```
STRIPE_SECRET_KEY não configurada
```

## ✅ Solução: Configurar Variáveis de Ambiente

### Passo 1: Acessar Configurações do Vercel

1. Acesse: https://vercel.com/theneilagencia/loquia-frontend/settings/environment-variables
2. Faça login se necessário

### Passo 2: Adicionar Variáveis de Ambiente

Adicione **TODAS** as seguintes variáveis de ambiente:

#### Supabase (Obrigatório)
```
NEXT_PUBLIC_SUPABASE_URL=https://xfvlvfoigbnipezxwmzt.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=<obter_no_supabase_dashboard>
```

```
SUPABASE_SERVICE_ROLE_KEY=<obter_no_supabase_dashboard>
```

#### Stripe (Obrigatório)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<obter_no_stripe_dashboard>
```

```
STRIPE_SECRET_KEY=<obter_no_stripe_dashboard>
```

```
STRIPE_WEBHOOK_SECRET=whsec_placeholder_will_be_generated_after_webhook_creation
```

#### Stripe Price IDs (Adicionar depois de criar os produtos)
```
STRIPE_BASIC_MONTHLY_PRICE_ID=
```

```
STRIPE_BASIC_YEARLY_PRICE_ID=
```

```
STRIPE_PRO_MONTHLY_PRICE_ID=
```

```
STRIPE_PRO_YEARLY_PRICE_ID=
```

```
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=
```

```
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=
```

#### Base URL (Obrigatório)
```
NEXT_PUBLIC_BASE_URL=https://loquia.com.br
```

#### Gemini API (Opcional - para workflows)
```
GEMINI_API_KEY=<obter_no_google_ai_studio>
```

### Passo 3: Selecionar Ambientes

Para cada variável, selecione os ambientes:
- ✅ Production
- ✅ Preview
- ✅ Development

### Passo 4: Fazer Redeploy

Após adicionar todas as variáveis:

1. Acesse: https://vercel.com/theneilagencia/loquia-frontend
2. Clique em "Deployments"
3. Clique no último deployment
4. Clique em "Redeploy"
5. Aguarde 2-5 minutos

### Passo 5: Testar

Após o redeploy, acesse:
- https://loquia.com.br/pricing

A página deve carregar corretamente e os botões devem funcionar.

---

## 📋 Checklist de Verificação

- [ ] Todas as variáveis de ambiente foram adicionadas no Vercel
- [ ] Ambientes Production, Preview e Development foram selecionados
- [ ] Redeploy foi realizado
- [ ] Página `/pricing` carrega sem erro 404
- [ ] Botões de contratação estão visíveis
- [ ] Clicar nos botões redireciona para login (se não logado)

---

## 🔍 Como Verificar se Funcionou

### Teste 1: Página Carrega
1. Acesse https://loquia.com.br/pricing
2. Deve mostrar os 3 planos (Basic, Pro, Enterprise)
3. Não deve mostrar erro 404

### Teste 2: Botões Funcionam (Sem Login)
1. Clique em qualquer botão "Escolher [Plano]"
2. Deve redirecionar para `/login?redirect=/pricing&plan=basic`

### Teste 3: Botões Funcionam (Com Login)
1. Faça login em https://loquia.com.br/login
2. Acesse https://loquia.com.br/pricing
3. Clique em qualquer botão "Escolher [Plano]"
4. Deve mostrar erro: "Plano não configurado. Entre em contato com o suporte."
   - Isso é esperado porque os Price IDs ainda não foram configurados

---

## ⚠️ Próximos Passos (Após Configurar Variáveis)

1. **Criar Produtos no Stripe**
   - Acesse: https://dashboard.stripe.com/products
   - Crie os 3 produtos (Basic, Pro, Enterprise)
   - Copie os Price IDs

2. **Adicionar Price IDs ao Vercel**
   - Volte às variáveis de ambiente
   - Preencha os 6 Price IDs
   - Faça novo redeploy

3. **Configurar Webhook do Stripe**
   - Acesse: https://dashboard.stripe.com/webhooks
   - Adicione endpoint: `https://loquia.com.br/api/stripe/webhook`
   - Copie o Webhook Secret
   - Atualize `STRIPE_WEBHOOK_SECRET` no Vercel

4. **Testar Fluxo Completo**
   - Criar conta
   - Escolher plano
   - Completar pagamento
   - Verificar acesso

---

## 🐛 Troubleshooting

### Erro: "This page could not be found"
- **Causa**: Variáveis de ambiente não configuradas ou deploy não concluído
- **Solução**: Verificar se todas as variáveis foram adicionadas e fazer redeploy

### Erro: "STRIPE_SECRET_KEY não configurada"
- **Causa**: Variável `STRIPE_SECRET_KEY` não foi adicionada ou deploy não foi feito
- **Solução**: Adicionar a variável e fazer redeploy

### Erro: "Plano não configurado"
- **Causa**: Price IDs do Stripe ainda não foram configurados
- **Solução**: Criar produtos no Stripe e adicionar os Price IDs às variáveis de ambiente

### Página carrega mas botões não fazem nada
- **Causa**: Erro de JavaScript no console
- **Solução**: Abrir DevTools (F12), verificar console, reportar o erro

---

## 📞 Suporte

Se após seguir todos os passos o problema persistir:

1. Verifique os logs no Vercel:
   - https://vercel.com/theneilagencia/loquia-frontend/logs

2. Verifique o console do navegador (F12)

3. Verifique se o deploy foi bem-sucedido:
   - https://vercel.com/theneilagencia/loquia-frontend/deployments

---

## ✅ Resumo

**O problema é simples**: As variáveis de ambiente não estão configuradas no Vercel.

**A solução é simples**: Adicionar as variáveis de ambiente e fazer redeploy.

**Tempo estimado**: 5-10 minutos para configurar + 2-5 minutos para deploy.
