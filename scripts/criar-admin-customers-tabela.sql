-- Script SQL para criar a tabela admin_customers no banco de dados de produção
-- Execute este script diretamente no Neon Console ou via psql
-- IMPORTANTE: Este script corresponde ao schema do Drizzle (generatedAlwaysAsIdentity)

-- Verificar se a tabela já existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_customers') THEN
        
        -- Criar tabela com GENERATED ALWAYS AS IDENTITY (conforme Drizzle schema)
        -- Sintaxe compatível com PostgreSQL e Drizzle
        CREATE TABLE admin_customers (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (
                sequence name "admin_customers_id_seq" 
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
            CONSTRAINT admin_customers_id_user_fkey FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT admin_customers_id_customer_fkey FOREIGN KEY (id_customer) REFERENCES customers(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT admin_customers_id_user_id_customer_key UNIQUE (id_user, id_customer)
        );

        -- Comentário na tabela
        COMMENT ON TABLE admin_customers IS 'Tabela para rastrear quais ISOs cada Admin pode gerenciar';

        RAISE NOTICE 'Tabela admin_customers criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela admin_customers já existe.';
    END IF;
END $$;

-- Verificar se a tabela foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_customers'
ORDER BY ordinal_position;

