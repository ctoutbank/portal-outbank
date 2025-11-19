-- Script para corrigir o perfil do usuário cto@outbank.com.br
-- Execute este script no Neon Console

-- 1. Verificar qual é o nome atual do perfil ID 11
SELECT 
    id,
    name as nome_perfil,
    description,
    CASE 
        WHEN UPPER(name) LIKE '%SUPER%' THEN '✅ Tem SUPER - OK!'
        WHEN UPPER(name) LIKE '%ADMIN%' THEN '✅ Tem ADMIN - OK!'
        ELSE '❌ NÃO tem SUPER nem ADMIN - PRECISA CORRIGIR'
    END as status
FROM profiles
WHERE id = 11;

-- 2. Se o perfil ID 11 não tiver "SUPER" ou "ADMIN" no nome,
--    atualize o nome para "SUPER_ADMIN":
--    (Descomente as linhas abaixo se necessário)

/*
UPDATE profiles 
SET 
    name = 'SUPER_ADMIN',
    dtupdate = CURRENT_TIMESTAMP
WHERE id = 11;
*/

-- 3. Verificar todos os perfis disponíveis (caso queira usar outro)
SELECT 
    id,
    name as nome_perfil,
    description,
    active,
    CASE 
        WHEN UPPER(name) LIKE '%SUPER%' THEN 'SUPER ADMIN ✅'
        WHEN UPPER(name) LIKE '%ADMIN%' THEN 'ADMIN ✅'
        ELSE 'Não é Admin'
    END as tipo
FROM profiles
WHERE active = true
ORDER BY 
    CASE 
        WHEN UPPER(name) LIKE '%SUPER%' THEN 1
        WHEN UPPER(name) LIKE '%ADMIN%' THEN 2
        ELSE 3
    END,
    name;

-- 4. Verificar o usuário após correção
SELECT 
    u.id,
    u.email,
    p.id as profile_id,
    p.name as profile_name,
    CASE 
        WHEN UPPER(p.name) LIKE '%SUPER%' THEN '✅ Super Admin'
        WHEN UPPER(p.name) LIKE '%ADMIN%' THEN '✅ Admin'
        ELSE '❌ Não é Admin'
    END as status
FROM users u
LEFT JOIN profiles p ON p.id = u.id_profile
WHERE LOWER(u.email) = LOWER('cto@outbank.com.br');

