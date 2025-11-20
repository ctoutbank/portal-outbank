-- Script simples para verificar o status atual da tabela admin_customers
-- Execute este script no Neon Console para ver o status completo

-- 1. Verificar se a TABELA existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'admin_customers'
        ) 
        THEN '✅ TABELA admin_customers EXISTE'
        ELSE '❌ TABELA admin_customers NÃO EXISTE'
    END AS status_tabela;

-- 2. Se a tabela existe, mostrar estrutura
SELECT 
    'Coluna: ' || column_name || 
    ' | Tipo: ' || data_type || 
    ' | Nullable: ' || is_nullable ||
    ' | Default: ' || COALESCE(column_default, 'NULL') AS estrutura
FROM information_schema.columns
WHERE table_name = 'admin_customers'
ORDER BY ordinal_position;

-- 3. Verificar se a SEQUÊNCIA existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.sequences 
            WHERE sequence_name = 'admin_customers_id_seq'
        ) 
        THEN '✅ SEQUÊNCIA admin_customers_id_seq EXISTE'
        ELSE '❌ SEQUÊNCIA admin_customers_id_seq NÃO EXISTE'
    END AS status_sequencia;

-- 4. Verificar constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'admin_customers'::regclass
ORDER BY conname;

-- 5. Contar registros (se tabela existir)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'admin_customers'
        ) 
        THEN 'Total de registros: ' || COUNT(*)::text
        ELSE 'Tabela não existe'
    END AS total_registros
FROM admin_customers
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'admin_customers'
);

