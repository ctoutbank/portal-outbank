-- Migration: Adicionar tabela stakeholders
-- Descrição: Parceiros intermediários que trazem novos ISOs e são comissionados
-- Benefício: Permite gerenciar parceiros e suas comissões

CREATE TABLE IF NOT EXISTS "stakeholders" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (
		sequence name "stakeholders_id_seq" 
		INCREMENT BY 1 
		MINVALUE 1 
		MAXVALUE 9223372036854775807 
		START WITH 1 
		CACHE 1
	),
	"slug" varchar(50),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP,
	"active" boolean DEFAULT true,
	
	"name" varchar(255) NOT NULL,
	"cnpj" varchar(18) UNIQUE,
	"email" varchar(255),
	"phone" varchar(20),
	
	-- Comissões e configurações
	"commission_rate" numeric(5, 2),
	
	CONSTRAINT "stakeholders_cnpj_unique" 
		UNIQUE ("cnpj")
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "stakeholders_active_idx" ON "stakeholders"("active");
CREATE INDEX IF NOT EXISTS "stakeholders_cnpj_idx" ON "stakeholders"("cnpj");
CREATE INDEX IF NOT EXISTS "stakeholders_name_idx" ON "stakeholders"("name");

-- Comentários para documentação
COMMENT ON TABLE "stakeholders" IS 'Parceiros intermediários que trazem novos ISOs e são comissionados. Permite gerenciar parceiros e suas comissões.';
COMMENT ON COLUMN "stakeholders"."name" IS 'Nome do stakeholder';
COMMENT ON COLUMN "stakeholders"."cnpj" IS 'CNPJ do stakeholder (único)';
COMMENT ON COLUMN "stakeholders"."email" IS 'Email de contato';
COMMENT ON COLUMN "stakeholders"."phone" IS 'Telefone de contato';
COMMENT ON COLUMN "stakeholders"."commission_rate" IS 'Taxa de comissão padrão do stakeholder (%)';
COMMENT ON COLUMN "stakeholders"."active" IS 'Indica se o stakeholder está ativo (soft delete)';


