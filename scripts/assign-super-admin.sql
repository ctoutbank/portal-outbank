-- Script SQL para atribuir Super Admin ao cto@outbank.com.br
-- Execute este script diretamente no seu banco de dados PostgreSQL/Neon

-- 1. Buscar ou verificar o ID do perfil SUPER_ADMIN
-- Nota: Este script assume que existe um perfil com "SUPER" no nome
-- Se não existir, você precisará criá-lo primeiro ou usar o perfil ADMIN existente

DO $$
DECLARE
    super_admin_profile_id BIGINT;
    user_id_to_update BIGINT;
    user_email TEXT := 'cto@outbank.com.br';
BEGIN
    -- Buscar perfil SUPER_ADMIN (ou qualquer perfil com SUPER no nome)
    SELECT id INTO super_admin_profile_id
    FROM profiles
    WHERE UPPER(name) LIKE '%SUPER%'
      AND active = true
    ORDER BY name
    LIMIT 1;

    -- Se não encontrar perfil SUPER, buscar perfil ADMIN
    IF super_admin_profile_id IS NULL THEN
        SELECT id INTO super_admin_profile_id
        FROM profiles
        WHERE UPPER(name) LIKE '%ADMIN%'
          AND active = true
        ORDER BY name
        LIMIT 1;
    END IF;

    -- Verificar se encontrou algum perfil
    IF super_admin_profile_id IS NULL THEN
        RAISE EXCEPTION 'Nenhum perfil ADMIN ou SUPER_ADMIN encontrado. Crie um perfil primeiro.';
    END IF;

    -- Buscar usuário por email (case-insensitive)
    SELECT id INTO user_id_to_update
    FROM users
    WHERE LOWER(email) = LOWER(user_email)
    LIMIT 1;

    -- Verificar se usuário existe
    IF user_id_to_update IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado', user_email;
    END IF;

    -- Atualizar perfil do usuário
    UPDATE users
    SET 
        id_profile = super_admin_profile_id,
        dtupdate = CURRENT_TIMESTAMP
    WHERE id = user_id_to_update;

    -- Mostrar resultado
    RAISE NOTICE 'Usuário % (ID: %) atualizado com perfil ID: %', user_email, user_id_to_update, super_admin_profile_id;
    
END $$;

-- Verificar o resultado
SELECT 
    u.id,
    u.email,
    u.active,
    p.name as profile_name,
    p.description as profile_description
FROM users u
LEFT JOIN profiles p ON p.id = u.id_profile
WHERE LOWER(u.email) = LOWER('cto@outbank.com.br');

