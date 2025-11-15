# Guia de Configuração DNS - KingHost → Vercel

## 🎯 Objetivo
Apontar o domínio `www.loquia.com.br` para o Vercel.

---

## 📋 Passo a Passo

### 1. Acessar Painel KingHost
1. Acesse: https://painel.kinghost.com.br
2. Faça login com suas credenciais
3. Vá em **"Domínios"** → **"Gerenciar Domínios"**
4. Selecione `loquia.com.br`

### 2. Configurar Registros DNS

Clique em **"Gerenciar DNS"** ou **"Zona DNS"**.

#### Registro A (para domínio raiz)
```
Tipo: A
Host: @ (ou deixe em branco)
Valor: 76.76.21.21
TTL: 3600 (1 hora)
```

#### Registro CNAME (para www)
```
Tipo: CNAME
Host: www
Valor: cname.vercel-dns.com
TTL: 3600 (1 hora)
```

**⚠️ IMPORTANTE KingHost:** 
- Remova qualquer registro A ou CNAME existente para `@` e `www`
- Na KingHost, use `cname.vercel-dns.com` **SEM o ponto final**
- Se der erro "formato inválido", tente criar um registro A para `www` apontando para `76.76.21.21`

### 3. Salvar Alterações
Clique em **"Salvar"** ou **"Aplicar Alterações"**.

---

## ⏱️ Tempo de Propagação

- **Mínimo:** 5-15 minutos
- **Máximo:** 24-48 horas
- **Típico:** 1-2 horas

---

## ✅ Verificar Propagação

### Opção 1: Online
Acesse: https://dnschecker.org
- Digite: `loquia.com.br`
- Verifique se aponta para `76.76.21.21`

### Opção 2: Terminal
```bash
# Verificar registro A
dig loquia.com.br +short

# Verificar registro CNAME
dig www.loquia.com.br +short

# Verificar NS
dig loquia.com.br NS +short
```

---

## 🔧 Configurar no Vercel

### 1. Adicionar Domínio
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **Loquia**
3. Vá em **Settings** → **Domains**
4. Clique em **"Add"**
5. Digite: `www.loquia.com.br`
6. Clique em **"Add"**

### 2. Configurar Domínio Primário
1. Na lista de domínios, localize `www.loquia.com.br`
2. Clique nos 3 pontos (...)
3. Selecione **"Set as Primary Domain"**

### 3. Verificar SSL
- O Vercel gerará automaticamente um certificado SSL
- Aguarde 1-2 minutos
- Verifique se aparece o ícone de cadeado verde

---

## 🎉 Resultado Final

Após a configuração, você terá:

- ✅ `loquia.com.br` → redireciona para `www.loquia.com.br`
- ✅ `www.loquia.com.br` → domínio principal
- ✅ HTTPS automático (SSL)
- ✅ Certificado válido

---

## 🐛 Troubleshooting

### Erro: "Domain not configured"
- Aguarde propagação DNS (1-2 horas)
- Verifique se os registros estão corretos

### Erro: "Invalid Configuration" ou "Formato Inválido"
- Na KingHost, use `cname.vercel-dns.com` sem o ponto final
- Se o CNAME não for aceito, use registro A: `www` → `76.76.21.21`
- Remova qualquer registro conflitante

### Erro: "SSL Certificate Error"
- Aguarde 2-5 minutos
- O Vercel gera o certificado automaticamente
- Se persistir, remova e adicione o domínio novamente

---

## 📞 Suporte

**KingHost:**
- Chat: https://www.kinghost.com.br/suporte
- Telefone: 0800 000 7777

**Vercel:**
- Docs: https://vercel.com/docs/concepts/projects/domains
- Support: https://vercel.com/support
