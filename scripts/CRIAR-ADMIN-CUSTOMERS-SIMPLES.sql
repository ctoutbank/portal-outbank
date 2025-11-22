-- Script SIMPLES para criar a tabela admin_customers
-- Execute este script no Neon Console apenas se a tabela NÃO existir
-- Use o script VERIFICAR-STATUS-ADMIN-CUSTOMERS.sql primeiro para verificar

-- Passo 1: Criar a tabela (apenas se não existir)
CREATE TABLE IF NOT EXISTS admin_customers (
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

-- Passo 2: Adicionar comentário
COMMENT ON TABLE admin_customers IS 'Tabela para rastrear quais ISOs cada Admin pode gerenciar';

-- Passo 3: Verificar resultado
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'admin_customers'
        ) 
        THEN '✅ SUCESSO: Tabela admin_customers criada/verificada com sucesso!'
        ELSE '❌ ERRO: Tabela não foi criada'
    END AS resultado;





