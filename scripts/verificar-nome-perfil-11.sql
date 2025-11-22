-- Script para verificar o nome do perfil ID 11
-- Execute este SQL no Neon Console para ver qual é o nome do perfil

-- Verificar o perfil ID 11
SELECT 
    id,
    name as nome_perfil,
    description as descricao,
    active as ativo,
    CASE 
        WHEN UPPER(name) LIKE '%SUPER%' THEN '✅ Tem SUPER - Será reconhecido como Super Admin'
        WHEN UPPER(name) LIKE '%ADMIN%' THEN '✅ Tem ADMIN - Será reconhecido como Admin'
        ELSE '❌ NÃO tem SUPER nem ADMIN - NÃO será reconhecido como Admin'
    END as status_reconhecimento
FROM profiles
WHERE id = 11;

-- Verificar todos os perfis com ADMIN ou SUPER para escolher o correto
SELECT 
    id,
    name as nome_perfil,
    description as descricao,
    active as ativo,
    CASE 
        WHEN UPPER(name) LIKE '%SUPER%' THEN 'SUPER ADMIN'
        WHEN UPPER(name) LIKE '%ADMIN%' THEN 'ADMIN'
        ELSE 'Outro'
    END as tipo
FROM profiles
WHERE active = true
  AND (UPPER(name) LIKE '%ADMIN%' OR UPPER(name) LIKE '%SUPER%')
ORDER BY 
    CASE 
        WHEN UPPER(name) LIKE '%SUPER%' THEN 1
        ELSE 2
    END,
    name;

-- Se o perfil ID 11 não tiver "SUPER" ou "ADMIN" no nome, 
-- você tem duas opções:
-- 
-- OPÇÃO 1: Atualizar o nome do perfil ID 11 para incluir "SUPER_ADMIN"
-- UPDATE profiles SET name = 'SUPER_ADMIN' WHERE id = 11;
--
-- OPÇÃO 2: Usar outro perfil que já tenha "SUPER" ou "ADMIN" no nome
-- (Use o ID do perfil correto da query acima)
-- UPDATE users SET id_profile = [ID_DO_PERFIL_CORRETO] WHERE email = 'cto@outbank.com.br';





