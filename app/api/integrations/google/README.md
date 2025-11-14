# Integração Google Ads - OAuth Completo

Esta integração permite que usuários conectem suas contas do Google Ads ao Loquia através de OAuth 2.0.

## Estrutura

```
app/api/integrations/google/
├── route.ts              # Inicia o fluxo OAuth
├── callback/
│   └── route.ts         # Processa o retorno do Google
└── README.md           # Esta documentação
```

## Fluxo OAuth

### 1. Usuário inicia conexão

O usuário clica em "Conectar Google Ads" no painel do Loquia.

**Endpoint:** `GET /api/integrations/google`

**Ação:**
- Redireciona para a página de autorização do Google
- Solicita permissões necessárias (Google Ads API)
- Solicita `access_type: offline` para obter refresh token
- Força `prompt: consent` para garantir refresh token

### 2. Usuário autoriza no Google

O usuário faz login no Google e autoriza as permissões solicitadas.

**Permissões solicitadas:**
- `https://www.googleapis.com/auth/adwords` - Acesso completo ao Google Ads

### 3. Google redireciona de volta

Após autorização, o Google redireciona para o callback com um código.

**Endpoint:** `GET /api/integrations/google/callback?code=...`

**Ação:**
- Recebe o código de autorização
- Troca o código por access token e refresh token
- Salva os tokens no Supabase
- Notifica o webhook Manus
- Redireciona o usuário de volta para o app

## Configuração

### 1. Criar Projeto no Google Cloud

Acesse: https://console.cloud.google.com/

**Passos:**
1. Clique em "Create Project"
2. Nome: **Loquia Google Ads Integration**
3. Clique em "Create"

### 2. Configurar OAuth Consent Screen

No projeto criado, vá em **APIs & Services → OAuth consent screen**:

**Configuração:**
- Tipo de usuário: **External**
- App name: **Loquia**
- User support email: seu email
- Developer contact: seu email
- Clique em "Save & Continue"

⚠️ **Nota:** Para testes, não é necessário verificação do Google.

### 3. Criar OAuth Client ID

Vá em **APIs & Services → Credentials**:

**Passos:**
1. Clique em "+ CREATE CREDENTIALS"
2. Selecione "OAuth client ID"
3. Application type: **Web application**
4. Name: **Loquia OAuth Google Ads**
5. Authorized redirect URIs:

**Produção:**
```
https://loquia.vercel.app/api/integrations/google/callback
```

**Desenvolvimento:**
```
http://localhost:3000/api/integrations/google/callback
```

6. Clique em "Create"
7. Copie:
   - **Client ID** (GOOGLE_CLIENT_ID)
   - **Client secret** (GOOGLE_CLIENT_SECRET)

### 4. Habilitar APIs Necessárias

Vá em **APIs & Services → Library**:

**APIs para habilitar:**
- **Google Ads API** (obrigatório)

### 5. Configurar Variáveis de Ambiente

#### No Vercel (Produção)

```bash
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=https://loquia.vercel.app/api/integrations/google/callback
GOOGLE_SCOPES=https://www.googleapis.com/auth/adwords
MANUS_WEBHOOK_URL=https://loquia.vercel.app/api/manus/webhook
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### No .env.local (Desenvolvimento)

```bash
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback
GOOGLE_SCOPES=https://www.googleapis.com/auth/adwords
MANUS_WEBHOOK_URL=http://localhost:3000/api/manus/webhook
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Banco de Dados

### Tabela: integrations

A integração usa a mesma tabela `integrations` criada para a Meta:

```sql
-- A tabela já existe, criada na migration 001_create_integrations_table.sql
-- Suporta múltiplas plataformas através do campo 'platform'
```

**Campos importantes:**
- `platform` = `'google'`
- `access_token` - Token de acesso do Google
- `refresh_token` - Token de refresh (importante!)
- `expires_at` - Data de expiração do access token
- `metadata` - Informações adicionais (scope, token_type)

## Webhook Manus

Após salvar a integração, um evento é enviado para o webhook Manus:

**Endpoint:** `POST https://loquia.vercel.app/api/manus/webhook`

**Payload:**
```json
{
  "event_type": "integration_completed",
  "flow_id": "flow_1_google_1731601200000",
  "data": {
    "platform": "google",
    "tenant_id": "user-uuid",
    "integration_id": "integration-uuid",
    "status": "connected",
    "has_refresh_token": true
  },
  "timestamp": "2025-11-14T17:00:00.000Z",
  "status": "success"
}
```

## Testes

### Testar localmente

1. Iniciar o servidor:
```bash
npm run dev
```

2. Acessar a rota de OAuth:
```
http://localhost:3000/api/integrations/google
```

3. Você será redirecionado para o Google, faça login e autorize

4. Após autorizar, será redirecionado de volta para:
```
http://localhost:3000/integrations?connected=google
```

### Testar em produção

1. Deploy no Vercel (automático via push)

2. Acessar:
```
https://loquia.vercel.app/api/integrations/google
```

3. Seguir o fluxo de autorização

## Fluxo Agência → Cliente

A integração suporta o fluxo onde uma agência convida um cliente:

1. Agência envia link de convite: `/invite/google`
2. Cliente acessa o link (mesmo sem estar logado)
3. Cliente é redirecionado para `/api/integrations/google`
4. Cliente autoriza no Google
5. Callback salva a integração no tenant correto
6. Cliente é redirecionado de volta

**Benefícios:**
- Cliente não precisa criar conta antes
- Integração é vinculada ao tenant correto
- Fluxo simplificado para usuários leigos

## Refresh Token

O Google OAuth é configurado para obter refresh token:

**Configurações importantes:**
- `access_type: offline` - Solicita refresh token
- `prompt: consent` - Força tela de consentimento

**Por que é importante:**
- Access tokens expiram rapidamente (1 hora)
- Refresh token permite renovar access token automaticamente
- Refresh token não expira (a menos que revogado)

**Implementação futura:**
- Criar função para renovar access token usando refresh token
- Implementar renovação automática antes da expiração

## Segurança

### HTTPS Only

Em produção, todas as URLs usam HTTPS:
- Callback: `https://loquia.vercel.app/...`
- Webhook: `https://loquia.vercel.app/...`

### Token Storage

Os tokens são armazenados de forma segura no Supabase:
- Nunca expostos no frontend
- Acessíveis apenas via API server-side
- Podem ser criptografados (futuro)

### OAuth 2.0 Best Practices

- Redirect URI deve corresponder exatamente
- Client secret nunca exposto no frontend
- Tokens armazenados server-side
- HTTPS obrigatório em produção

## Logs

Todos os eventos são registrados no console:

```
[Google OAuth] Redirecionando para: https://accounts.google.com/...
[Google Callback] Código recebido, trocando por token...
[Google Callback] Tokens obtidos com sucesso
[Google Callback] Refresh token presente: true
[Google Callback] Salvando tokens no banco de dados...
[Google Callback] Integração salva com sucesso: uuid
[Google Callback] Notificando webhook Manus...
[Google Callback] Webhook notificado com sucesso
[Google Callback] Redirecionando para: /integrations?connected=google
```

## Erros Comuns

### "missing_code"

**Causa:** Código de autorização não foi fornecido pelo Google

**Solução:** Verificar se o callback URL está configurado corretamente

### "token_exchange_failed"

**Causa:** Falha ao trocar código por token

**Possíveis causas:**
- Client ID ou Secret incorretos
- Redirect URI não corresponde ao configurado no Google
- Código expirado ou já usado

**Solução:** Verificar variáveis de ambiente e configuração no Google Cloud

### "database_error"

**Causa:** Erro ao salvar no Supabase

**Solução:** Verificar:
- Conexão com Supabase
- Estrutura da tabela `integrations`
- Permissões do usuário

### "config_error"

**Causa:** Variáveis de ambiente não configuradas

**Solução:** Verificar se todas as variáveis estão definidas:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI
- GOOGLE_SCOPES

### "Refresh token não retornado"

**Causa:** Google não retornou refresh token

**Possíveis causas:**
- Usuário já autorizou anteriormente
- `access_type: offline` não configurado
- `prompt: consent` não configurado

**Solução:**
- Revogar acesso anterior no Google
- Verificar configuração do OAuth
- Forçar `prompt: consent`

## Próximos Passos

### Curto Prazo
- ✅ Implementar OAuth básico
- ⏳ Testar em produção
- ⏳ Validar webhook Manus
- ⏳ Validar refresh token

### Médio Prazo
- [ ] Implementar renovação automática de token
- [ ] Adicionar validação de expiração
- [ ] Implementar retry em caso de token expirado
- [ ] Dashboard de integrações ativas

### Longo Prazo
- [ ] Criptografar tokens no banco
- [ ] Implementar revogação de acesso
- [ ] Logs de auditoria
- [ ] Monitoramento de uso da API

## Diferenças entre Google e Meta

| Aspecto | Google | Meta |
|---------|--------|------|
| **Refresh Token** | Sim, obrigatório | Opcional |
| **Expiração** | 1 hora | Longa duração |
| **Renovação** | Via refresh token | Pode usar mesmo token |
| **Scopes** | URL completa | Lista separada por vírgula |
| **Prompt** | `consent` para refresh | `state` para segurança |

## Suporte

Para dúvidas ou problemas:
- Consulte a [documentação do Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- Consulte a [documentação do Google Ads API](https://developers.google.com/google-ads/api/docs/start)
- Verifique os logs no Vercel
- Teste localmente primeiro

## Referências

- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google Ads API](https://developers.google.com/google-ads/api)
- [OAuth 2.0 Best Practices](https://tools.ietf.org/html/rfc6749)
