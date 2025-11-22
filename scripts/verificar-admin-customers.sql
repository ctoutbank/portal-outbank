-- Script para verificar se a tabela admin_customers foi criada corretamente
-- Execute este script no Neon Console para verificar o status

-- 1. Verificar se a tabela existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'admin_customers';

-- 2. Se a tabela existir, verificar estrutura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'admin_customers'
ORDER BY ordinal_position;

-- 3. Verificar constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'admin_customers'::regclass;

-- 4. Verificar se a sequência existe e está vinculada
SELECT 
    sequence_name,
    data_type,
    start_value,
    increment
FROM information_schema.sequences
WHERE sequence_name = 'admin_customers_id_seq';

-- 5. Tentar inserir um registro de teste (se tudo estiver OK)
-- DESCOMENTE APENAS PARA TESTE - DELETE APÓS VERIFICAR
-- INSERT INTO admin_customers (id_user, id_customer, slug, active) 
-- VALUES (1, 1, 'test-slug', true)
-- ON CONFLICT DO NOTHING;

-- 6. Se houver erro, mostrar a mensagem de erro
-- Isso ajudará a identificar qual parte da criação falhou





