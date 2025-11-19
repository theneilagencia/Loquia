# Instruções para Deploy em Produção

## Status Atual

✅ **9 commits prontos** para serem enviados ao GitHub
✅ **Build testado** e funcionando localmente
✅ **Alterações implementadas**:
   - Seção Intent Proof Dashboard™ adicionada na homepage
   - 4 logos de IA (ChatGPT, Gemini, Claude, Perplexity)
   - Botões de compra ativados (Começar com Basic, Pro, Enterprise)
   - Redirecionamento funcional para login/checkout

## Commits Pendentes de Push

```
18d4cb8 feat: Add Intent Proof Dashboard section and activate purchase buttons on homepage
d78761a fix: Create stripe-client.ts to fix runtime error - separate client and server Stripe config
b63dffb fix: Remove Supabase dependency from pricing page to fix runtime error
55b522b feat: Update AI logos with correct brand assets
e15b9e0 fix: Remove duplicate footer and standardize Footer component
9e30966 fix: Move Supabase client initialization to runtime to prevent build errors
e9ddaba fix: Prevent dashboard header from appearing on public pages
f34077c feat: Add Intent Proof Dashboard section to pricing page
e33071c fix: Remove deprecated config from webhook route and use Next.js App Router syntax
```

## Como Fazer o Push

### Opção 1: Via GitHub CLI (Recomendado)

```bash
cd /home/ubuntu/loquia-frontend
gh auth login
git push origin main
```

### Opção 2: Via HTTPS com Token

```bash
cd /home/ubuntu/loquia-frontend
git push https://github.com/theneilagencia/loquia-frontend.git main
```

### Opção 3: Via SSH (se configurado)

```bash
cd /home/ubuntu/loquia-frontend
git remote set-url origin git@github.com:theneilagencia/loquia-frontend.git
git push origin main
```

## Após o Push

1. **Aguarde 2-5 minutos** para o Vercel fazer o deploy automático
2. **Verifique em produção**: https://loquia.com.br/
3. **Confirme que está funcionando**:
   - Seção Intent Proof Dashboard visível
   - 4 logos de IA exibidos
   - Botões de compra funcionais

## O Que Foi Implementado

### 1. Novo Componente: IntentProofDashboard.tsx
- Seção dedicada ao Intent Proof Dashboard™
- 4 logos de IA com SVGs customizados
- Design responsivo e animado
- Posicionado **acima** da seção de preços

### 2. Atualização: CustomPlans.tsx
- Botões de compra agora são **funcionais**
- Redirecionam para `/login?redirect=/pricing&plan=X&billing=monthly`
- Suporte para os 3 planos: basic, pro, enterprise

### 3. Atualização: page.tsx (Homepage)
- Adicionado componente IntentProofDashboard
- Ordem das seções:
  1. Hero
  2. Era
  3. How It Works
  4. Paid Ads
  5. **Intent Proof Dashboard** ← NOVO
  6. Plans & Pricing
  7. Final

## Estrutura da Homepage Atualizada

```
Homepage (/)
├── CustomNavbar
├── CustomHero
├── CustomEra
├── CustomHowItWorks
├── CustomPaidAds
├── IntentProofDashboard ← NOVO
├── CustomPlans (com botões ativos) ← ATUALIZADO
└── CustomFinal
```

## Verificação de Funcionalidade

Após o deploy, teste:

1. ✅ Acesse https://loquia.com.br/
2. ✅ Role até a seção "INTENT PROOF DASHBOARD™"
3. ✅ Verifique se os 4 logos de IA estão visíveis
4. ✅ Role até "Planos & Preços"
5. ✅ Clique em "Começar com Pro"
6. ✅ Verifique se redireciona para login com parâmetros corretos

## Próximos Passos (Após Push)

1. Configurar webhook do Stripe (se ainda não feito)
2. Testar fluxo completo de compra
3. Verificar criação de subscription no Supabase
4. Monitorar logs de erro no Vercel

---

**Desenvolvido para**: Loquia SaaS Platform  
**Data**: 18 de novembro de 2025  
**Commits prontos**: 9  
**Status**: Aguardando push para GitHub
