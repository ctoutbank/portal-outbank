# Como Atribuir Super Admin ao cto@outbank.com.br

## Opção 2: SQL Direto (RECOMENDADO - Mais Simples)

### Passo 1: Abrir o Console do Neon

1. Acesse o [Neon Console](https://console.neon.tech/)
2. Selecione seu projeto
3. Vá para "SQL Editor" ou "Query Editor"

### Passo 2: Executar o SQL

Copie e cole o seguinte SQL no editor e execute:

```sql
-- Script para atribuir Super Admin ao cto@outbank.com.br

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
    RAISE NOTICE '✅ Sucesso! Usuário % (ID: %) atualizado com perfil ID: %', user_email, user_id_to_update, super_admin_profile_id;
    
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
```

### Passo 3: Verificar o Resultado

Após executar, você verá uma mensagem de sucesso e os dados do usuário atualizado.

---

## Alternativa: SQL Simples (Sem PL/pgSQL)

Se preferir uma versão mais simples sem blocos DO:

```sql
-- 1. Verificar qual perfil usar
SELECT id, name FROM profiles 
WHERE UPPER(name) LIKE '%SUPER%' OR UPPER(name) LIKE '%ADMIN%'
AND active = true 
ORDER BY name 
LIMIT 1;

-- 2. Pegar o ID do perfil acima e o ID do usuário e executar:
-- (Substitua PROFILE_ID e USER_ID pelos valores encontrados)

UPDATE users
SET id_profile = PROFILE_ID,
    dtupdate = CURRENT_TIMESTAMP
WHERE LOWER(email) = LOWER('cto@outbank.com.br');

-- 3. Verificar resultado
SELECT 
    u.id,
    u.email,
    p.name as profile_name
FROM users u
LEFT JOIN profiles p ON p.id = u.id_profile
WHERE LOWER(u.email) = LOWER('cto@outbank.com.br');
```

---

## Nota Importante

Certifique-se de que:
- Existe um perfil com "ADMIN" ou "SUPER" no nome no banco
- O usuário cto@outbank.com.br existe na tabela users
- Você tem permissão para atualizar a tabela users




