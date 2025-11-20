# Guia: Como Criar Usuário Admin no Supabase

## 📋 Pré-requisitos

- Acesso ao Supabase Dashboard
- Projeto: `xfvlvfoigbnipezxwmzt`
- URL: https://supabase.com/dashboard/project/xfvlvfoigbnipezxwmzt

---

## 🚀 Método 1: Criar Novo Usuário Admin (Recomendado)

### Passo 1: Criar Usuário no Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **Authentication** → **Users**
3. Clique em **Add User** (botão verde)
4. Preencha:
   - **Email**: `admin@loquia.com.br` (ou o email que preferir)
   - **Password**: [escolha uma senha segura]
   - **Auto Confirm User**: ✅ **Marque esta opção** (importante!)
5. Clique em **Create User**

### Passo 2: Promover para Admin via SQL

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole este SQL:

```sql
-- Promover usuário para admin
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'admin@loquia.com.br';

-- Verificar se funcionou
SELECT id, email, role, created_at 
FROM public.user_profiles 
WHERE email = 'admin@loquia.com.br';
```

4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Verifique se o resultado mostra `role = 'admin'`

### Passo 3: Testar Login

1. Acesse: https://loquia.com.br/login
2. Digite:
   - Email: `admin@loquia.com.br`
   - Senha: [a senha que você definiu]
3. Clique em **Entrar**
4. ✅ Você deve ser redirecionado para o dashboard

---

## 🔄 Método 2: Promover Usuário Existente

Se você já tem uma conta cadastrada e quer torná-la admin:

### Passo 1: Identificar seu Email

Anote o email da conta que você quer promover.

### Passo 2: Executar SQL

1. No Supabase Dashboard, vá em **SQL Editor**
2. Cole este SQL (substitua o email):

```sql
-- Promover usuário existente para admin
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';

-- Verificar
SELECT id, email, role 
FROM public.user_profiles 
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';
```

3. Clique em **Run**
4. Faça logout e login novamente

---

## 🔍 Verificação e Troubleshooting

### Verificar se Usuário Existe

```sql
-- Ver todos os usuários cadastrados
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
```

### Verificar Roles

```sql
-- Ver todos os admins
SELECT id, email, role, created_at 
FROM public.user_profiles 
WHERE role IN ('admin', 'superadmin')
ORDER BY created_at DESC;
```

### Verificar se Tabela user_profiles Existe

```sql
-- Verificar estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles';
```

### Problema: Usuário não aparece em user_profiles

Se o usuário existe em `auth.users` mas não em `user_profiles`:

```sql
-- Inserir manualmente (substitua o UUID e email)
INSERT INTO public.user_profiles (id, email, role, is_active)
VALUES (
  'UUID_DO_USUARIO_AQUI',  -- Copie o UUID de auth.users
  'admin@loquia.com.br',
  'admin',
  true
);
```

---

## 🎯 Criar Superadmin (Acesso Total)

Para criar um superadmin com acesso total:

```sql
UPDATE public.user_profiles 
SET role = 'superadmin'
WHERE email = 'superadmin@loquia.com.br';
```

---

## ⚠️ Importante

1. **Auto Confirm User**: Sempre marque esta opção ao criar usuário manualmente, caso contrário ele precisará confirmar o email
2. **Senha Segura**: Use uma senha forte para contas admin
3. **Logout/Login**: Após alterar o role, faça logout e login novamente
4. **Cache**: Se não funcionar, limpe o cache do navegador (Ctrl+Shift+Delete)

---

## 📞 Suporte

Se ainda não conseguir fazer login:

1. Verifique se o email está correto
2. Verifique se a senha está correta
3. Verifique se o role é 'admin' ou 'superadmin'
4. Tente em modo anônimo do navegador
5. Verifique os logs do navegador (F12 → Console)

---

## 🔗 Links Úteis

- Supabase Dashboard: https://supabase.com/dashboard
- Projeto atual: https://supabase.com/dashboard/project/xfvlvfoigbnipezxwmzt
- SQL Editor: https://supabase.com/dashboard/project/xfvlvfoigbnipezxwmzt/sql
- Authentication: https://supabase.com/dashboard/project/xfvlvfoigbnipezxwmzt/auth/users
