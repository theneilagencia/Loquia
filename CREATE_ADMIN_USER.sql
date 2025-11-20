-- =====================================================
-- SCRIPT PARA CRIAR USUÁRIO ADMIN NO SUPABASE
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- PASSO 1: Criar usuário no auth.users (via Supabase Dashboard)
-- Vá em Authentication > Users > Add User
-- Email: admin@loquia.com.br
-- Password: [sua senha segura]
-- Auto Confirm User: YES

-- PASSO 2: Após criar o usuário no Dashboard, execute este SQL:

-- Verificar se o usuário foi criado
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@loquia.com.br';

-- Se o usuário existe, promover para admin
-- Substitua 'admin@loquia.com.br' pelo email que você criou
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'admin@loquia.com.br';

-- Verificar se a atualização funcionou
SELECT id, email, role, created_at 
FROM public.user_profiles 
WHERE email = 'admin@loquia.com.br';

-- =====================================================
-- ALTERNATIVA: Promover usuário existente para admin
-- =====================================================

-- Se você já tem um usuário cadastrado e quer torná-lo admin:
UPDATE public.user_profiles 
SET role = 'admin'
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Listar todos os admins
SELECT id, email, role, created_at 
FROM public.user_profiles 
WHERE role IN ('admin', 'superadmin')
ORDER BY created_at DESC;

-- =====================================================
-- CRIAR SUPERADMIN (OPCIONAL)
-- =====================================================

-- Para criar um superadmin (acesso total):
UPDATE public.user_profiles 
SET role = 'superadmin'
WHERE email = 'superadmin@loquia.com.br';
