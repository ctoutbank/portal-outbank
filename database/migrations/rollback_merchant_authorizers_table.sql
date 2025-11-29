-- =====================================================
-- Script SQL para ROLLBACK da tabela merchant_authorizers
-- =====================================================
-- ATENÇÃO: Este script remove completamente a tabela e todos os seus dados!
-- Use apenas se realmente precisar reverter a migração.
-- =====================================================

-- Remover foreign key constraint
ALTER TABLE "merchant_authorizers" 
DROP CONSTRAINT IF EXISTS "merchant_authorizers_id_merchant_fkey";

-- Remover índices
DROP INDEX IF EXISTS "idx_merchant_authorizers_id_merchant";
DROP INDEX IF EXISTS "idx_merchant_authorizers_type";
DROP INDEX IF EXISTS "idx_merchant_authorizers_active";

-- Remover tabela (isso também remove todos os dados!)
DROP TABLE IF EXISTS "merchant_authorizers";

-- Remover sequence
DROP SEQUENCE IF EXISTS "merchant_authorizers_id_seq";

-- Verificar se foi removido
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'merchant_authorizers'
        ) 
        THEN 'Tabela ainda existe!' 
        ELSE 'Tabela removida com sucesso!' 
    END AS status;


