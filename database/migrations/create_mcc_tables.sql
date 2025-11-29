-- =====================================================
-- Script SQL para criar tabelas de MCC e MCC Groups
-- para sincronização com a API da Dock
-- =====================================================
-- Descrição: Cria tabelas mcc_groups e mcc para armazenar
--            códigos MCC sincronizados da Dock
-- Data: 2025-01-XX
-- =====================================================

-- Criar tabela mcc_groups
CREATE TABLE IF NOT EXISTS "mcc_groups" (
    "id" integer PRIMARY KEY NOT NULL,
    "description" varchar(255) NOT NULL,
    "availability_date" timestamp,
    "database_operation" char(1),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Criar tabela mcc
CREATE TABLE IF NOT EXISTS "mcc" (
    "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (
        sequence name "mcc_id_seq" 
        INCREMENT BY 1 
        MINVALUE 1 
        MAXVALUE 9223372036854775807 
        START WITH 1 
        CACHE 1
    ),
    "code" integer NOT NULL UNIQUE,
    "description" varchar(255) NOT NULL,
    "mcc_group_id" integer NOT NULL,
    "availability_date" timestamp,
    "database_operation" char(1),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "mcc_mcc_group_id_fkey" FOREIGN KEY ("mcc_group_id") REFERENCES "mcc_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS "mcc_code_idx" ON "mcc"("code");
CREATE INDEX IF NOT EXISTS "mcc_mcc_group_id_idx" ON "mcc"("mcc_group_id");
CREATE INDEX IF NOT EXISTS "mcc_is_active_idx" ON "mcc"("is_active");
CREATE INDEX IF NOT EXISTS "mcc_groups_is_active_idx" ON "mcc_groups"("is_active");

-- Comentários nas tabelas
COMMENT ON TABLE "mcc_groups" IS 'Grupos de MCC sincronizados da Dock';
COMMENT ON TABLE "mcc" IS 'Códigos MCC sincronizados da Dock (ISO 18245)';
COMMENT ON COLUMN "mcc"."code" IS 'Código MCC numérico (ISO 18245)';
COMMENT ON COLUMN "mcc"."mcc_group_id" IS 'Referência ao grupo MCC';
COMMENT ON COLUMN "mcc"."database_operation" IS 'Operação: i=insert, u=update, d=delete';
COMMENT ON COLUMN "mcc_groups"."database_operation" IS 'Operação: i=insert, u=update, d=delete';

