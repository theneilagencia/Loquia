# ✅ Checklist de Deploy Final - Loquia v1.0.0

**Data:** $(date '+%d/%m/%Y %H:%M')  
**Domínio:** www.loquia.com.br  
**Ambiente:** Produção

---

## 📋 PRÉ-DEPLOY

### DNS (KingHost)
- [x] Registro A `@` → `76.76.21.21`
- [x] Registro A `www` → `76.76.21.21`
- [ ] Aguardar propagação (5-15 minutos)
- [ ] Verificar propagação em https://dnschecker.org

### Código
- [x] Build local validado (36 rotas)
- [x] TypeScript sem erros
- [x] Todas as 4 fases concluídas
- [x] Documentação completa gerada
- [x] URLs atualizadas para www.loquia.com.br
- [x] Commits criados (9 commits pendentes)
- [ ] Push para GitHub

---

## 🚀 DEPLOY

### 1. Push para GitHub
```bash
cd /home/ubuntu/Loquia
git push origin main
```

**Resultado esperado:**
```
Enumerating objects: X, done.
Writing objects: 100% (X/X), done.
Total X (delta Y), (reused Z)
To https://github.com/theneilagencia/Loquia.git
   xxxxx..yyyyy  main -> main
```

### 2. Aguardar Deploy Vercel
- [ ] Acessar: https://vercel.com/dashboard
- [ ] Verificar deploy automático iniciado
- [ ] Aguardar conclusão (2-3 minutos)
- [ ] Verificar status: "Ready"

### 3. Adicionar Domínio no Vercel
1. [ ] Acessar projeto Loquia no Vercel
2. [ ] Settings → Domains
3. [ ] Click "Add"
4. [ ] Digite: `www.loquia.com.br`
5. [ ] Click "Add"
6. [ ] Aguardar validação DNS
7. [ ] Verificar SSL gerado automaticamente

### 4. Adicionar Domínio Raiz (Redirect)
1. [ ] Click "Add" novamente
2. [ ] Digite: `loquia.com.br`
3. [ ] Click "Add"
4. [ ] Vercel configurará redirect automático

### 5. Definir Domínio Primário
1. [ ] Localizar `www.loquia.com.br` na lista
2. [ ] Click nos 3 pontos (...)
3. [ ] Selecionar "Set as Primary Domain"

---

## ⚙️ CONFIGURAÇÃO

### Variáveis de Ambiente no Vercel

**Supabase (3 vars):**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (opcional)

**Manus (2 vars):**
- [ ] `MANUS_WEBHOOK_URL=https://www.loquia.com.br/api/manus/webhook`
- [ ] `MANUS_API_KEY` (se necessário)

**App (1 var):**
- [ ] `NEXT_PUBLIC_APP_URL=https://www.loquia.com.br`

**Google Ads (3 vars):**
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_REDIRECT_URI=https://www.loquia.com.br/api/integrations/google/callback`

**Meta Ads (3 vars):**
- [ ] `META_CLIENT_ID`
- [ ] `META_CLIENT_SECRET`
- [ ] `META_REDIRECT_URI=https://www.loquia.com.br/api/integrations/meta/callback`

**TikTok Ads (3 vars):**
- [ ] `TIKTOK_APP_ID`
- [ ] `TIKTOK_SECRET`
- [ ] `TIKTOK_REDIRECT_URI=https://www.loquia.com.br/api/integrations/tiktok/callback`

**LinkedIn Ads (3 vars):**
- [ ] `LINKEDIN_CLIENT_ID`
- [ ] `LINKEDIN_CLIENT_SECRET`
- [ ] `LINKEDIN_REDIRECT_URI=https://www.loquia.com.br/api/integrations/linkedin/callback`

**X (Twitter) Ads (3 vars):**
- [ ] `X_CLIENT_ID`
- [ ] `X_CLIENT_SECRET`
- [ ] `X_REDIRECT_URI=https://www.loquia.com.br/api/integrations/x/callback`

**YouTube Ads (3 vars):**
- [ ] `YOUTUBE_CLIENT_ID`
- [ ] `YOUTUBE_CLIENT_SECRET`
- [ ] `YOUTUBE_REDIRECT_URI=https://www.loquia.com.br/api/integrations/youtube/callback`

**Total:** 24 variáveis

### Após Configurar Variáveis
- [ ] Trigger redeploy manual (Settings → Deployments → Redeploy)

---

## 🗄️ BANCO DE DADOS

### Executar Migrations no Supabase

Acessar: SQL Editor no Supabase Dashboard

**Ordem de execução:**
1. [ ] `001_create_integrations_table.sql`
2. [ ] `002_create_tenants_table.sql`
3. [ ] `003_create_profiles_table.sql`
4. [ ] `004_create_campaigns_table.sql`
5. [ ] `005_create_campaign_insights_table.sql`
6. [ ] `006_create_campaign_optimizations_table.sql`
7. [ ] `007_create_comments_table.sql`
8. [ ] `008_create_campaign_events_table.sql`
9. [ ] `009_update_integrations_table.sql`

**Verificar:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Resultado esperado:** 8 tabelas

---

## 🔐 OAUTH APPS

### Criar/Atualizar Apps OAuth

#### 1. Google Cloud Console
- [ ] Acessar: https://console.cloud.google.com/
- [ ] Criar projeto "Loquia Production"
- [ ] Habilitar Google Ads API
- [ ] Criar OAuth Client ID
- [ ] Adicionar redirect URI: `https://www.loquia.com.br/api/integrations/google/callback`
- [ ] Copiar CLIENT_ID e CLIENT_SECRET

#### 2. Meta Developers
- [ ] Acessar: https://developers.facebook.com/apps/
- [ ] Criar app "Loquia Production"
- [ ] Adicionar Facebook Login + Marketing API
- [ ] Adicionar redirect URI: `https://www.loquia.com.br/api/integrations/meta/callback`
- [ ] Copiar APP_ID e APP_SECRET

#### 3. TikTok Business API
- [ ] Acessar: https://business-api.tiktok.com/portal/
- [ ] Criar app "Loquia Production"
- [ ] Adicionar redirect URI: `https://www.loquia.com.br/api/integrations/tiktok/callback`
- [ ] Copiar APP_ID e SECRET

#### 4. LinkedIn Developers
- [ ] Acessar: https://www.linkedin.com/developers/apps
- [ ] Criar app "Loquia Production"
- [ ] Adicionar redirect URI: `https://www.loquia.com.br/api/integrations/linkedin/callback`
- [ ] Copiar CLIENT_ID e CLIENT_SECRET

#### 5. X Developer Portal
- [ ] Acessar: https://developer.twitter.com/en/portal/dashboard
- [ ] Criar app "Loquia Production"
- [ ] Adicionar redirect URI: `https://www.loquia.com.br/api/integrations/x/callback`
- [ ] Copiar CLIENT_ID e CLIENT_SECRET

#### 6. YouTube (Google Cloud)
- [ ] Usar mesmo projeto do Google Ads
- [ ] Habilitar YouTube Data API v3
- [ ] Adicionar redirect URI: `https://www.loquia.com.br/api/integrations/youtube/callback`
- [ ] Usar mesmo CLIENT_ID e CLIENT_SECRET

---

## ✅ VALIDAÇÃO PÓS-DEPLOY

### 1. Verificar Domínio
```bash
# Verificar DNS
dig www.loquia.com.br +short
# Resultado esperado: 76.76.21.21

# Verificar HTTPS
curl -I https://www.loquia.com.br
# Resultado esperado: HTTP/2 200
```

### 2. Verificar Páginas
- [ ] https://www.loquia.com.br (home)
- [ ] https://www.loquia.com.br/sign-in
- [ ] https://www.loquia.com.br/sign-up
- [ ] https://www.loquia.com.br/campaigns
- [ ] https://www.loquia.com.br/setup

**Resultado esperado:** Todas carregam sem erro

### 3. Verificar APIs
```bash
# Webhook Manus
curl https://www.loquia.com.br/api/manus/webhook
# Resultado esperado: {"message":"Webhook Manus ativo"}

# Flow X (Deploy Validator)
curl -X POST https://www.loquia.com.br/api/manus/flow-x
# Resultado esperado: JSON com validações
```

### 4. Verificar Health-checks
```bash
curl https://www.loquia.com.br/api/integrations/google/health
curl https://www.loquia.com.br/api/integrations/meta/health
curl https://www.loquia.com.br/api/integrations/tiktok/health
curl https://www.loquia.com.br/api/integrations/linkedin/health
curl https://www.loquia.com.br/api/integrations/x/health
curl https://www.loquia.com.br/api/integrations/youtube/health
```

**Resultado esperado:** Status 200 ou 401 (precisa auth)

### 5. Testar OAuth (Manual)
- [ ] Acessar Setup Center
- [ ] Clicar em "Connect" no Google
- [ ] Autorizar acesso
- [ ] Verificar se aparece "Connected"
- [ ] Repetir para outras plataformas

### 6. Executar Flow X Completo
```bash
curl -X POST https://www.loquia.com.br/api/manus/flow-x \
  -H "Content-Type: application/json" \
  | jq .
```

**Verificar:**
- [ ] `deploy_ready: true`
- [ ] Todas validações com status "pass"
- [ ] Nenhuma validação com status "fail"

---

## 📊 MÉTRICAS DE SUCESSO

### Build
- [ ] Build time < 3 minutos
- [ ] 0 erros de TypeScript
- [ ] 0 warnings críticos
- [ ] 36 rotas geradas

### Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Lighthouse Score > 90

### Segurança
- [ ] SSL/TLS ativo
- [ ] HTTPS redirect funcionando
- [ ] Headers de segurança configurados
- [ ] RLS ativo no Supabase

---

## 🎉 CONCLUSÃO

Quando TODOS os itens acima estiverem marcados:

✅ **O Loquia v1.0.0 está OFICIALMENTE EM PRODUÇÃO!**

---

## 📝 PRÓXIMOS PASSOS

Após deploy concluído:
1. [ ] Anunciar lançamento (redes sociais)
2. [ ] Enviar email para lista de espera
3. [ ] Ativar campanhas de marketing
4. [ ] Monitorar métricas (Vercel Analytics)
5. [ ] Coletar feedback inicial
6. [ ] Planejar v1.1.0

---

**Última atualização:** $(date '+%d/%m/%Y %H:%M')
