-- Script SQL FINAL para criar a tabela admin_customers
-- Execute este script no Neon Console se a tabela não existir
-- Este script verifica se a tabela existe antes de criar

DO $$
BEGIN
    -- Verificar se a tabela já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'admin_customers'
    ) THEN
        -- Criar a tabela
        CREATE TABLE admin_customers (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (
                SEQUENCE NAME admin_customers_id_seq 
                INCREMENT BY 1 
                MINVALUE 1 
                MAXVALUE 9223372036854775807 
                START WITH 1 
                CACHE 1
            ),
            slug VARCHAR(50),
            dtinsert TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            dtupdate TIMESTAMP,
            active BOOLEAN DEFAULT true,
            id_user BIGINT NOT NULL,
            id_customer BIGINT NOT NULL,
            CONSTRAINT admin_customers_id_user_fkey 
                FOREIGN KEY (id_user) 
                REFERENCES users(id) 
                ON DELETE NO ACTION 
                ON UPDATE NO ACTION,
            CONSTRAINT admin_customers_id_customer_fkey 
                FOREIGN KEY (id_customer) 
                REFERENCES customers(id) 
                ON DELETE NO ACTION 
                ON UPDATE NO ACTION,
            CONSTRAINT admin_customers_id_user_id_customer_key 
                UNIQUE (id_user, id_customer)
        );

        -- Comentário na tabela
        COMMENT ON TABLE admin_customers IS 'Tabela para rastrear quais ISOs cada Admin pode gerenciar';

        RAISE NOTICE '✅ Tabela admin_customers criada com sucesso!';
    ELSE
        RAISE NOTICE '⚠️ Tabela admin_customers já existe.';
    END IF;

    -- Verificar se a sequência existe (pode existir mesmo sem tabela)
    IF EXISTS (
        SELECT 1 FROM information_schema.sequences 
        WHERE sequence_name = 'admin_customers_id_seq'
    ) THEN
        RAISE NOTICE '✅ Sequência admin_customers_id_seq já existe.';
    ELSE
        RAISE NOTICE '⚠️ Sequência admin_customers_id_seq não existe (será criada automaticamente).';
    END IF;

END $$;

-- Verificar estrutura final
SELECT 
    'Tabela criada: ' || table_name AS status
FROM information_schema.tables 
WHERE table_name = 'admin_customers'
UNION ALL
SELECT 
    'Coluna: ' || column_name || ' (' || data_type || ')' AS status
FROM information_schema.columns
WHERE table_name = 'admin_customers'
ORDER BY status;





