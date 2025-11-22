-- Script para verificar e corrigir o perfil do usuário cto@outbank.com.br
-- Execute este script no Neon Console

-- 1. Verificar qual é o perfil ID 11
SELECT 
    id,
    name as nome_perfil,
    description as descricao,
    active as ativo
FROM profiles
WHERE id = 11;

-- 2. Verificar o usuário atual e seu perfil
SELECT 
    u.id as user_id,
    u.email,
    u.active as user_ativo,
    p.id as profile_id,
    p.name as profile_name,
    p.description as profile_description,
    CASE 
        WHEN UPPER(p.name) LIKE '%SUPER%' THEN 'SIM - É Super Admin ✅'
        WHEN UPPER(p.name) LIKE '%ADMIN%' THEN 'SIM - É Admin ✅'
        ELSE '❌ NÃO - Não é Admin (nome precisa conter "ADMIN" ou "SUPER")'
    END as status_admin
FROM users u
LEFT JOIN profiles p ON p.id = u.id_profile
WHERE LOWER(u.email) = LOWER('cto@outbank.com.br');

-- 3. Verificar se existe algum perfil com "SUPER" ou "ADMIN" no nome
SELECT 
    id,
    name as nome_perfil,
    description as descricao,
    active as ativo,
    CASE 
        WHEN UPPER(name) LIKE '%SUPER%' THEN 'SUPER ADMIN ✅'
        WHEN UPPER(name) LIKE '%ADMIN%' THEN 'ADMIN ✅'
        ELSE 'Não é Admin'
    END as tipo_perfil
FROM profiles
WHERE active = true
ORDER BY 
    CASE 
        WHEN UPPER(name) LIKE '%SUPER%' THEN 1
        WHEN UPPER(name) LIKE '%ADMIN%' THEN 2
        ELSE 3
    END,
    name;

-- 4. OPÇÃO: Se o perfil ID 11 não tiver "SUPER" ou "ADMIN" no nome,
--    você pode atualizar o nome do perfil para incluir "SUPER_ADMIN":
--    (Execute apenas se necessário - descomente a linha abaixo)
-- UPDATE profiles SET name = 'SUPER_ADMIN' WHERE id = 11;





