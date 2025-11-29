-- =====================================================
-- Script SQL para criação da tabela merchant_authorizers
-- =====================================================
-- Descrição: Tabela para armazenar os autorizadores configurados para cada estabelecimento (merchant)
-- Data: 2025-01-XX
-- =====================================================

-- Criar a tabela merchant_authorizers
CREATE TABLE IF NOT EXISTS "merchant_authorizers" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (
		SEQUENCE NAME "merchant_authorizers_id_seq" 
		INCREMENT BY 1 
		MINVALUE 1 
		MAXVALUE 9223372036854775807 
		START WITH 1 
		CACHE 1
	),
	"slug" varchar(50),
	"active" boolean DEFAULT true,
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP,
	"type" varchar(100) NOT NULL,
	"conciliar_transacoes" varchar(10) NOT NULL DEFAULT 'nao',
	"merchant_id" varchar(100),
	"token_cnp" varchar(255),
	"terminal_id" varchar(100),
	"id_conta" varchar(100),
	"chave_pix" varchar(255),
	"id_merchant" bigint NOT NULL
);

-- Criar índice para melhorar performance nas buscas por merchant
CREATE INDEX IF NOT EXISTS "idx_merchant_authorizers_id_merchant" 
ON "merchant_authorizers" ("id_merchant");

-- Criar índice para melhorar performance nas buscas por tipo de autorizador
CREATE INDEX IF NOT EXISTS "idx_merchant_authorizers_type" 
ON "merchant_authorizers" ("type");

-- Criar índice para melhorar performance nas buscas por status ativo
CREATE INDEX IF NOT EXISTS "idx_merchant_authorizers_active" 
ON "merchant_authorizers" ("active");

-- Adicionar foreign key constraint para merchants
ALTER TABLE "merchant_authorizers" 
ADD CONSTRAINT "merchant_authorizers_id_merchant_fkey" 
FOREIGN KEY ("id_merchant") 
REFERENCES "merchants"("id") 
ON DELETE CASCADE 
ON UPDATE NO ACTION;

-- Comentários nas colunas para documentação
COMMENT ON TABLE "merchant_authorizers" IS 'Tabela que armazena os autorizadores de pagamento configurados para cada estabelecimento';
COMMENT ON COLUMN "merchant_authorizers"."id" IS 'ID único do autorizador (auto-incremento)';
COMMENT ON COLUMN "merchant_authorizers"."slug" IS 'Slug único para identificação do autorizador';
COMMENT ON COLUMN "merchant_authorizers"."active" IS 'Indica se o autorizador está ativo (true) ou inativo (false)';
COMMENT ON COLUMN "merchant_authorizers"."dtinsert" IS 'Data e hora de inserção do registro';
COMMENT ON COLUMN "merchant_authorizers"."dtupdate" IS 'Data e hora da última atualização do registro';
COMMENT ON COLUMN "merchant_authorizers"."type" IS 'Tipo do autorizador (GLOBAL PAYMENTS, AUTORIZADOR DOCK PIX, DOCK | POSTILION, GLOBAL PAYMENTS ECOMMERCE)';
COMMENT ON COLUMN "merchant_authorizers"."conciliar_transacoes" IS 'Indica se deve conciliar transações (sim/nao)';
COMMENT ON COLUMN "merchant_authorizers"."merchant_id" IS 'ID do merchant no autorizador (para tipos que não sejam DOCK PIX)';
COMMENT ON COLUMN "merchant_authorizers"."token_cnp" IS 'Token CNP no autorizador (para tipos que não sejam DOCK PIX)';
COMMENT ON COLUMN "merchant_authorizers"."terminal_id" IS 'ID do terminal no autorizador';
COMMENT ON COLUMN "merchant_authorizers"."id_conta" IS 'ID da conta no autorizador (apenas para AUTORIZADOR DOCK PIX)';
COMMENT ON COLUMN "merchant_authorizers"."chave_pix" IS 'Chave PIX associada (apenas para AUTORIZADOR DOCK PIX)';
COMMENT ON COLUMN "merchant_authorizers"."id_merchant" IS 'ID do estabelecimento (merchant) ao qual este autorizador pertence';


