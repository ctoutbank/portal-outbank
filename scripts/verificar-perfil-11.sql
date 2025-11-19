-- Script para verificar qual é o perfil ID 11
-- Execute este script no Neon Console para ver os detalhes do perfil

SELECT 
    id,
    name as nome_perfil,
    description as descricao,
    active as ativo,
    slug
FROM profiles
WHERE id = 11;

-- Verificar também o usuário e seu perfil atual
SELECT 
    u.id as user_id,
    u.email,
    u.active as user_ativo,
    p.id as profile_id,
    p.name as profile_name,
    p.description as profile_description,
    CASE 
        WHEN UPPER(p.name) LIKE '%SUPER%' THEN 'SIM - É Super Admin'
        WHEN UPPER(p.name) LIKE '%ADMIN%' THEN 'SIM - É Admin (pode ser Super Admin)'
        ELSE 'NÃO - Não é Admin'
    END as is_super_admin
FROM users u
LEFT JOIN profiles p ON p.id = u.id_profile
WHERE LOWER(u.email) = LOWER('cto@outbank.com.br');

