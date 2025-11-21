-- Migration: Adicionar tabela stakeholder_customers
-- Descrição: Relaciona stakeholders com ISOs e gerencia comissões específicas
-- Benefício: Permite definir comissões específicas por ISO para cada stakeholder

CREATE TABLE IF NOT EXISTS "stakeholder_customers" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (
		sequence name "stakeholder_customers_id_seq" 
		INCREMENT BY 1 
		MINVALUE 1 
		MAXVALUE 9223372036854775807 
		START WITH 1 
		CACHE 1
	),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP,
	
	"id_stakeholder" bigint NOT NULL,
	"id_customer" bigint NOT NULL,
	"commission_rate" numeric(5, 2),
	
	CONSTRAINT "stakeholder_customers_id_stakeholder_fkey" 
		FOREIGN KEY ("id_stakeholder") 
		REFERENCES "public"."stakeholders"("id") 
		ON DELETE cascade 
		ON UPDATE no action,
	CONSTRAINT "stakeholder_customers_id_customer_fkey" 
		FOREIGN KEY ("id_customer") 
		REFERENCES "public"."customers"("id") 
		ON DELETE cascade 
		ON UPDATE no action,
	CONSTRAINT "stakeholder_customers_unique" 
		UNIQUE ("id_stakeholder", "id_customer")
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "stakeholder_customers_id_stakeholder_idx" ON "stakeholder_customers"("id_stakeholder");
CREATE INDEX IF NOT EXISTS "stakeholder_customers_id_customer_idx" ON "stakeholder_customers"("id_customer");

-- Comentários para documentação
COMMENT ON TABLE "stakeholder_customers" IS 'Relaciona stakeholders com ISOs e gerencia comissões específicas. Permite definir comissões específicas por ISO para cada stakeholder.';
COMMENT ON COLUMN "stakeholder_customers"."id_stakeholder" IS 'ID do stakeholder';
COMMENT ON COLUMN "stakeholder_customers"."id_customer" IS 'ID do ISO (customer)';
COMMENT ON COLUMN "stakeholder_customers"."commission_rate" IS 'Taxa de comissão específica para este ISO (sobrescreve taxa padrão do stakeholder)';

