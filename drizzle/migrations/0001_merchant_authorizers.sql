CREATE TABLE "admin_customers" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admin_customers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP,
	"active" boolean DEFAULT true,
	"id_user" bigint,
	"id_customer" bigint,
	CONSTRAINT "admin_customers_id_user_id_customer_key" UNIQUE("id_user","id_customer")
);
--> statement-breakpoint
CREATE TABLE "customer_modules" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "customer_modules_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp,
	"active" boolean DEFAULT true,
	"id_customer" bigint,
	"id_module" bigint,
	CONSTRAINT "customer_modules_unique" UNIQUE("id_customer","id_module")
);
--> statement-breakpoint
CREATE TABLE "merchant_authorizers" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "merchant_authorizers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"type" varchar(100),
	"conciliar_transacoes" varchar(10),
	"merchant_id" varchar(100),
	"token_cnp" varchar(255),
	"terminal_id" varchar(100),
	"id_conta" varchar(100),
	"chave_pix" varchar(255),
	"id_merchant" bigint
);
--> statement-breakpoint
CREATE TABLE "merchant_modules" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "merchant_modules_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp,
	"id_merchant" bigint,
	"id_module" bigint,
	"id_customer" bigint,
	"consent_given" boolean DEFAULT false,
	"consent_date" timestamp,
	"consent_ip" varchar(50),
	"consent_user_agent" text,
	"active" boolean DEFAULT false,
	"notified" boolean DEFAULT false,
	CONSTRAINT "merchant_modules_unique" UNIQUE("id_merchant","id_module")
);
--> statement-breakpoint
CREATE TABLE "module_consents" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "module_consents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1),
	"id_merchant_module" bigint,
	"id_merchant" bigint,
	"id_module" bigint,
	"id_customer" bigint,
	"action" varchar(50),
	"consent_text" text,
	"ip_address" varchar(50),
	"user_agent" text,
	"device_info" text,
	"user_email" varchar(255),
	"user_id" bigint,
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "profile_customers" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "profile_customers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP,
	"active" boolean DEFAULT true,
	"id_profile" bigint,
	"id_customer" bigint
);
--> statement-breakpoint
CREATE TABLE "stakeholder_customers" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stakeholder_customers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp,
	"id_stakeholder" bigint,
	"id_customer" bigint,
	"commission_rate" numeric(5, 2),
	CONSTRAINT "stakeholder_customers_unique" UNIQUE("id_stakeholder","id_customer")
);
--> statement-breakpoint
CREATE TABLE "stakeholders" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stakeholders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854776000 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp,
	"active" boolean DEFAULT true,
	"name" varchar(255),
	"cnpj" varchar(18),
	"email" varchar(255),
	"phone" varchar(20),
	"commission_rate" numeric(5, 2),
	CONSTRAINT "stakeholders_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
ALTER TABLE "customer_customization" ADD COLUMN "email_image_url" varchar(100);--> statement-breakpoint
ALTER TABLE "customer_customization" ADD COLUMN "email_image_file_id" bigint;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "restrict_customer_data" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "initial_password" text;--> statement-breakpoint
ALTER TABLE "admin_customers" ADD CONSTRAINT "admin_customers_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_customers" ADD CONSTRAINT "admin_customers_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_modules" ADD CONSTRAINT "customer_modules_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_modules" ADD CONSTRAINT "customer_modules_id_module_fkey" FOREIGN KEY ("id_module") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_authorizers" ADD CONSTRAINT "merchant_authorizers_id_merchant_fkey" FOREIGN KEY ("id_merchant") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_modules" ADD CONSTRAINT "merchant_modules_id_merchant_fkey" FOREIGN KEY ("id_merchant") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_modules" ADD CONSTRAINT "merchant_modules_id_module_fkey" FOREIGN KEY ("id_module") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_modules" ADD CONSTRAINT "merchant_modules_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_consents" ADD CONSTRAINT "module_consents_id_merchant_module_fkey" FOREIGN KEY ("id_merchant_module") REFERENCES "public"."merchant_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_consents" ADD CONSTRAINT "module_consents_id_merchant_fkey" FOREIGN KEY ("id_merchant") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_consents" ADD CONSTRAINT "module_consents_id_module_fkey" FOREIGN KEY ("id_module") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_consents" ADD CONSTRAINT "module_consents_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_customers" ADD CONSTRAINT "profile_customers_id_profile_fkey" FOREIGN KEY ("id_profile") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_customers" ADD CONSTRAINT "profile_customers_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholder_customers" ADD CONSTRAINT "stakeholder_customers_id_stakeholder_fkey" FOREIGN KEY ("id_stakeholder") REFERENCES "public"."stakeholders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholder_customers" ADD CONSTRAINT "stakeholder_customers_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;