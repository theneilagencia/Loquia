# Setup Completo - Integração Google Ads

Este guia detalha todos os passos necessários para configurar a integração OAuth do Google Ads no Loquia.

## 📋 Pré-requisitos

- [ ] Conta no Google Cloud Console
- [ ] Conta no Vercel (para deploy)
- [ ] Conta no Supabase (para banco de dados)
- [ ] Acesso ao repositório GitHub do Loquia
- [ ] Tabela `integrations` já criada (da integração Meta)

## 🟦 Bloco 1 — Criar Projeto no Google Cloud

### 1.1 Acessar Google Cloud Console

Acesse: **https://console.cloud.google.com/**

### 1.2 Criar Novo Projeto

1. Clique em **"Create Project"** (ou selecione o dropdown no topo)
2. Preencha:
   - **Project name:** `Loquia Google Ads Integration`
   - **Organization:** (opcional)
3. Clique em **"Create"**
4. Aguarde a criação do projeto (alguns segundos)

### 1.3 Selecionar o Projeto

Certifique-se de que o projeto **Loquia Google Ads Integration** está selecionado no dropdown do topo.

## 🟦 Bloco 2 — Configurar OAuth Consent Screen

### 2.1 Acessar OAuth Consent Screen

No menu lateral:
1. Vá em **"APIs & Services"**
2. Clique em **"OAuth consent screen"**

### 2.2 Configurar Consent Screen

**Tipo de usuário:**
- Selecione **"External"**
- Clique em **"Create"**

**App information:**
- **App name:** `Loquia`
- **User support email:** seu email
- **App logo:** (opcional)

**App domain:** (opcional para testes)
- Application home page: `https://loquia.vercel.app`
- Privacy policy: `https://loquia.vercel.app/privacy`
- Terms of service: `https://loquia.vercel.app/terms`

**Authorized domains:** (opcional)
- `loquia.vercel.app`

**Developer contact information:**
- Email addresses: seu email

Clique em **"Save and Continue"**

### 2.3 Scopes

Nesta tela, você pode adicionar scopes:
- Por enquanto, clique em **"Save and Continue"** (vamos configurar no código)

### 2.4 Test Users (opcional)

Para testes, você pode adicionar emails específicos:
- Adicione seu email de teste
- Clique em **"Save and Continue"**

### 2.5 Summary

Revise as configurações e clique em **"Back to Dashboard"**

⚠️ **Nota:** O app ficará em modo "Testing" até ser verificado pelo Google. Para uso interno, isso é suficiente.

## 🟦 Bloco 3 — Criar OAuth Client ID

### 3.1 Acessar Credentials

No menu lateral:
1. Vá em **"APIs & Services"**
2. Clique em **"Credentials"**

### 3.2 Criar Credenciais

1. Clique em **"+ CREATE CREDENTIALS"**
2. Selecione **"OAuth client ID"**

### 3.3 Configurar OAuth Client

**Application type:**
- Selecione **"Web application"**

**Name:**
- `Loquia OAuth Google Ads`

**Authorized JavaScript origins:** (opcional)
- `https://loquia.vercel.app`
- `http://localhost:3000`

**Authorized redirect URIs:** (IMPORTANTE!)

Adicione ambas as URLs:

**Produção:**
```
https://loquia.vercel.app/api/integrations/google/callback
```

**Desenvolvimento:**
```
http://localhost:3000/api/integrations/google/callback
```

Clique em **"Create"**

### 3.4 Copiar Credenciais

Uma janela aparecerá com:
- **Your Client ID** → copie (será `GOOGLE_CLIENT_ID`)
- **Your Client Secret** → copie (será `GOOGLE_CLIENT_SECRET`)

**Guarde esses valores em local seguro!**

Você pode acessá-los novamente em **Credentials** → OAuth 2.0 Client IDs

## 🟦 Bloco 4 — Habilitar Google Ads API

### 4.1 Acessar API Library

No menu lateral:
1. Vá em **"APIs & Services"**
2. Clique em **"Library"**

### 4.2 Buscar Google Ads API

1. Na barra de busca, digite: `Google Ads API`
2. Clique no resultado **"Google Ads API"**

### 4.3 Habilitar a API

1. Clique em **"Enable"**
2. Aguarde a habilitação (alguns segundos)

⚠️ **Nota:** Esta API é essencial para acessar dados do Google Ads.

## 🟦 Bloco 5 — Configurar Variáveis de Ambiente

### 5.1 No Vercel (Produção)

1. Acesse: **https://vercel.com/dashboard**
2. Selecione o projeto **Loquia**
3. Vá em **"Settings" → "Environment Variables"**
4. Adicione as variáveis:

```bash
# Google Ads
GOOGLE_CLIENT_ID=seu-client-id-aqui
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
GOOGLE_REDIRECT_URI=https://loquia.vercel.app/api/integrations/google/callback
GOOGLE_SCOPES=https://www.googleapis.com/auth/adwords

# Supabase (se ainda não configurado)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui

# Webhook Manus (se ainda não configurado)
MANUS_WEBHOOK_URL=https://loquia.vercel.app/api/manus/webhook
```

5. Clique em **"Save"** para cada variável

### 5.2 No .env.local (Desenvolvimento)

Atualize o arquivo `.env.local` na raiz do projeto:

```bash
# Google Ads
GOOGLE_CLIENT_ID=seu-client-id-aqui
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback
GOOGLE_SCOPES=https://www.googleapis.com/auth/adwords

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui

# Webhook Manus
MANUS_WEBHOOK_URL=http://localhost:3000/api/manus/webhook
```

⚠️ **NUNCA** commite o arquivo `.env.local` no Git!

## 🟦 Bloco 6 — Testar Localmente

### 6.1 Iniciar Servidor

```bash
cd /home/ubuntu/Loquia
npm run dev
```

O servidor estará em: **http://localhost:3000**

### 6.2 Testar OAuth

1. Abra o navegador em:
```
http://localhost:3000/api/integrations/google
```

2. Você será redirecionado para o Google

3. Faça login com sua conta Google

4. Autorize as permissões solicitadas

5. Após autorizar, será redirecionado de volta para:
```
http://localhost:3000/integrations?connected=google
```

6. Verifique os logs no terminal:
```
[Google OAuth] Redirecionando para: https://accounts.google.com/...
[Google Callback] Código recebido, trocando por token...
[Google Callback] Tokens obtidos com sucesso
[Google Callback] Refresh token presente: true
[Google Callback] Salvando tokens no banco de dados...
[Google Callback] Integração salva com sucesso: uuid
[Google Callback] Notificando webhook Manus...
[Google Callback] Webhook notificado com sucesso
```

7. Verifique no Supabase se o registro foi criado:
   - Tabela: `integrations`
   - Campo `platform`: `'google'`
   - Campos `access_token` e `refresh_token` preenchidos

## 🟦 Bloco 7 — Deploy em Produção

### 7.1 Commit e Push

```bash
cd /home/ubuntu/Loquia

# Adicionar arquivos
git add .

# Commit
git commit -m "feat: Implementar OAuth completo do Google Ads

- Adicionar rota de OAuth (/api/integrations/google)
- Implementar callback com troca de token
- Suporte a refresh token
- Integrar com Supabase para salvar tokens
- Notificar webhook Manus após conexão
- Adicionar documentação completa
- Atualizar .env.example com variáveis do Google"

# Push para GitHub
git push origin main
```

### 7.2 Aguardar Deploy no Vercel

1. O Vercel detectará o push automaticamente
2. Build será executado (1-2 minutos)
3. Deploy será feito automaticamente

Acompanhe em: **https://vercel.com/dashboard**

### 7.3 Testar em Produção

1. Acesse:
```
https://loquia.vercel.app/api/integrations/google
```

2. Siga o fluxo de autorização

3. Verifique os logs no Vercel:
   - Vá em **"Deployments"**
   - Clique no deployment ativo
   - Vá em **"Functions"** → Logs

## 🟦 Bloco 8 — Validar Integração Completa

### Checklist de Validação

- [ ] Projeto criado no Google Cloud
- [ ] OAuth consent screen configurado
- [ ] OAuth Client ID criado
- [ ] Redirect URIs configurados
- [ ] Credenciais obtidas (Client ID + Secret)
- [ ] Google Ads API habilitada
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Teste local funcionando
- [ ] Refresh token obtido
- [ ] Deploy em produção concluído
- [ ] Teste em produção funcionando
- [ ] Webhook Manus recebendo eventos
- [ ] Registro no Supabase criado

### Testes Finais

**1. Testar fluxo completo em produção:**
```
https://loquia.vercel.app/api/integrations/google
```

**2. Verificar registro no Supabase:**
- Acessar dashboard do Supabase
- Ir em "Table Editor" → "integrations"
- Verificar se há um registro com `platform = 'google'`
- Verificar se `refresh_token` está preenchido

**3. Verificar webhook Manus:**
- Acessar logs do webhook
- Verificar se recebeu evento `integration_completed` com `platform: 'google'`

**4. Verificar expiração do token:**
- Verificar campo `expires_at` no Supabase
- Deve ser aproximadamente 1 hora após `connected_at`

## 📊 Monitoramento

### Logs do Vercel

1. Acesse: **https://vercel.com/dashboard**
2. Selecione o projeto **Loquia**
3. Vá em **"Deployments"** → deployment ativo
4. Clique em **"Functions"**
5. Visualize os logs em tempo real

### Logs do Supabase

1. Acesse: **https://supabase.com/dashboard**
2. Selecione o projeto
3. Vá em **"Logs"** → "API Logs"
4. Filtre por tabela `integrations`

### Webhook Manus

Verifique os logs do webhook em:
```
https://loquia.vercel.app/api/manus/webhook
```

## 🚨 Troubleshooting

### Erro: "missing_code"

**Causa:** Callback não recebeu o código do Google

**Solução:**
- Verificar se a URL de callback está correta no Google Cloud
- Verificar se `GOOGLE_REDIRECT_URI` está correta

### Erro: "token_exchange_failed"

**Causa:** Falha ao trocar código por token

**Solução:**
- Verificar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
- Verificar se o código não expirou
- Verificar se a URL de redirect corresponde

### Erro: "database_error"

**Causa:** Erro ao salvar no Supabase

**Solução:**
- Verificar se a tabela `integrations` existe
- Verificar permissões RLS
- Verificar credenciais do Supabase

### Erro: "config_error"

**Causa:** Variáveis de ambiente não configuradas

**Solução:**
- Verificar todas as variáveis no Vercel
- Fazer redeploy após adicionar variáveis

### Refresh token não retornado

**Causa:** Google não retornou refresh token

**Solução:**
- Revogar acesso anterior em: https://myaccount.google.com/permissions
- Tentar novamente (deve forçar `prompt: consent`)
- Verificar se `access_type: offline` está configurado

### API não habilitada

**Erro:** "Google Ads API has not been used in project..."

**Solução:**
- Habilitar Google Ads API no Google Cloud Console
- Aguardar alguns minutos para propagação

## 📚 Recursos Adicionais

- [Documentação Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google Ads API Documentation](https://developers.google.com/google-ads/api)
- [OAuth 2.0 Best Practices](https://tools.ietf.org/html/rfc6749)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

## ✅ Conclusão

Após seguir todos os blocos, você terá:

✅ OAuth completo do Google Ads funcionando  
✅ Refresh token obtido para renovação automática  
✅ Tokens salvos de forma segura no Supabase  
✅ Webhook Manus recebendo eventos  
✅ Integração pronta para produção  
✅ Documentação completa  

**Próximo passo:** Implementar renovação automática de tokens e outras integrações (TikTok, LinkedIn, etc.)!
