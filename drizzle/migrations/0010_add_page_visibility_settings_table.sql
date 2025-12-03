-- Migration: Adicionar tabela page_visibility_settings
-- Descrição: Armazena configurações de visibilidade de seções por página, usuário e perfil
-- Benefício: Permite personalização de layout por usuário/perfil

CREATE TABLE IF NOT EXISTS "page_visibility_settings" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (
		sequence name "page_visibility_settings_id_seq" 
		INCREMENT BY 1 
		MINVALUE 1 
		MAXVALUE 9223372036854775807 
		START WITH 1 
		CACHE 1
	),
	"page_slug" varchar(100) NOT NULL,
	"user_id" bigint,
	"profile_id" bigint,
	"hidden_sections" jsonb NOT NULL DEFAULT '[]'::jsonb,
	"active" boolean DEFAULT true,
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP,
	
	CONSTRAINT "page_visibility_settings_user_id_fkey" 
		FOREIGN KEY ("user_id") 
		REFERENCES "public"."users"("id") 
		ON DELETE cascade 
		ON UPDATE no action,
	CONSTRAINT "page_visibility_settings_profile_id_fkey" 
		FOREIGN KEY ("profile_id") 
		REFERENCES "public"."profiles"("id") 
		ON DELETE cascade 
		ON UPDATE no action
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "page_visibility_settings_page_slug_idx" 
	ON "page_visibility_settings"("page_slug");
CREATE INDEX IF NOT EXISTS "page_visibility_settings_user_id_idx" 
	ON "page_visibility_settings"("user_id");
CREATE INDEX IF NOT EXISTS "page_visibility_settings_profile_id_idx" 
	ON "page_visibility_settings"("profile_id");
CREATE INDEX IF NOT EXISTS "page_visibility_settings_active_idx" 
	ON "page_visibility_settings"("active");

