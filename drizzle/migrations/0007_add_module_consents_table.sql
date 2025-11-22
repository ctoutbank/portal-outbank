-- Migration: Adicionar tabela module_consents
-- Descrição: Histórico completo de consentimentos LGPD para auditoria
-- Benefício: Rastreabilidade completa de todos os consentimentos dados/revogados

CREATE TABLE IF NOT EXISTS "module_consents" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (
		sequence name "module_consents_id_seq" 
		INCREMENT BY 1 
		MINVALUE 1 
		MAXVALUE 9223372036854775807 
		START WITH 1 
		CACHE 1
	),
	"id_merchant_module" bigint NOT NULL,
	"id_merchant" bigint NOT NULL,
	"id_module" bigint NOT NULL,
	"id_customer" bigint NOT NULL,
	
	-- Dados do consentimento
	"action" varchar(50) NOT NULL,
	"consent_text" text,
	"ip_address" varchar(50),
	"user_agent" text,
	"device_info" text,
	
	-- Usuário que deu consentimento
	"user_email" varchar(255),
	"user_id" bigint,
	
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	
	CONSTRAINT "module_consents_id_merchant_module_fkey" 
		FOREIGN KEY ("id_merchant_module") 
		REFERENCES "public"."merchant_modules"("id") 
		ON DELETE cascade 
		ON UPDATE no action,
	CONSTRAINT "module_consents_id_merchant_fkey" 
		FOREIGN KEY ("id_merchant") 
		REFERENCES "public"."merchants"("id") 
		ON DELETE cascade 
		ON UPDATE no action,
	CONSTRAINT "module_consents_id_module_fkey" 
		FOREIGN KEY ("id_module") 
		REFERENCES "public"."modules"("id") 
		ON DELETE cascade 
		ON UPDATE no action,
	CONSTRAINT "module_consents_id_customer_fkey" 
		FOREIGN KEY ("id_customer") 
		REFERENCES "public"."customers"("id") 
		ON DELETE cascade 
		ON UPDATE no action
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "module_consents_id_merchant_module_idx" ON "module_consents"("id_merchant_module");
CREATE INDEX IF NOT EXISTS "module_consents_id_merchant_idx" ON "module_consents"("id_merchant");
CREATE INDEX IF NOT EXISTS "module_consents_id_module_idx" ON "module_consents"("id_module");
CREATE INDEX IF NOT EXISTS "module_consents_id_customer_idx" ON "module_consents"("id_customer");
CREATE INDEX IF NOT EXISTS "module_consents_action_idx" ON "module_consents"("action");
CREATE INDEX IF NOT EXISTS "module_consents_dtinsert_idx" ON "module_consents"("dtinsert");

-- Comentários para documentação
COMMENT ON TABLE "module_consents" IS 'Histórico completo de consentimentos LGPD para auditoria. Rastreabilidade de todos os consentimentos dados/revogados.';
COMMENT ON COLUMN "module_consents"."id_merchant_module" IS 'ID do registro em merchant_modules';
COMMENT ON COLUMN "module_consents"."action" IS 'Ação realizada: GRANTED, REVOKED, NOTIFIED';
COMMENT ON COLUMN "module_consents"."consent_text" IS 'Texto do termo de consentimento aceito';
COMMENT ON COLUMN "module_consents"."ip_address" IS 'IP do consentimento (auditoria)';
COMMENT ON COLUMN "module_consents"."user_agent" IS 'User Agent do consentimento (auditoria)';
COMMENT ON COLUMN "module_consents"."device_info" IS 'Informações do dispositivo (auditoria)';
COMMENT ON COLUMN "module_consents"."user_email" IS 'Email do usuário que deu consentimento';
COMMENT ON COLUMN "module_consents"."user_id" IS 'ID do usuário que deu consentimento (opcional)';


