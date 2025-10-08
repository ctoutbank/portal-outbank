-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations

CREATE TABLE "terminals" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255),
	"active" boolean,
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP,
	"logical_number" varchar(50),
	"type" char(1),
	"status" varchar(50),
	"serial_number" varchar(50),
	"model" varchar(255),
	"manufacturer" varchar(50),
	"pinpad_serial_number" varchar(50),
	"pinpad_firmware" varchar(50),
	"slug_merchant" varchar(50),
	"slug_customer" varchar(50),
	"pverfm" varchar(50),
	"go_update" boolean,
	"inactivation_date" timestamp,
	"unique_number_for_merchant" integer,
	CONSTRAINT "terminals_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payment_institution" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payment_institution_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"name" varchar(255),
	"id_customer" varchar(20),
	"settlement_management_type" varchar(50),
	"id_customer_db" bigint
);
--> statement-breakpoint
CREATE TABLE "state" (
	"code" varchar(5) PRIMARY KEY NOT NULL,
	"name" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bank_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"name" varchar(255),
	"number" varchar(10)
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"slug" varchar(50) NOT NULL,
	"name" varchar(255),
	"customer_id" varchar(100),
	"settlement_management_type" varchar(50),
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "customers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"id_parent" bigint
);
--> statement-breakpoint
CREATE TABLE "configurations" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "configurations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"lock_cp_anticipation_order" boolean,
	"lock_cnp_anticipation_order" boolean,
	"url" varchar(255),
	"anticipation_risk_factor_cp" numeric,
	"anticipation_risk_factor_cnp" numeric,
	"waiting_period_cp" numeric,
	"waiting_period_cnp" numeric
);
--> statement-breakpoint
CREATE TABLE "sales_agents" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sales_agents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"document_id" varchar(50),
	"email" varchar(255),
	"slug_customer" varchar(50),
	"birth_date" date,
	"phone" varchar(20),
	"cpf" varchar(20),
	"id_users" bigint
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "settlements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"batch_amount" numeric,
	"discount_fee_amount" numeric,
	"net_settlement_amount" numeric,
	"total_anticipation_amount" numeric,
	"total_restitution_amount" numeric,
	"pix_amount" numeric,
	"pix_net_amount" numeric,
	"pix_fee_amount" numeric,
	"pix_cost_amount" numeric,
	"pending_restitution_amount" numeric,
	"total_credit_adjustment_amount" numeric,
	"total_debit_adjustment_amount" numeric,
	"total_settlement_amount" numeric,
	"rest_rounding_amount" numeric,
	"outstanding_amount" numeric,
	"slug_customer" varchar(50),
	"status" varchar(50),
	"credit_status" varchar(50),
	"debit_status" varchar(50),
	"anticipation_status" varchar(50),
	"pix_status" varchar(50),
	"payment_date" date,
	"pending_financial_adjustment_amount" numeric,
	"credit_financial_adjustment_amount" numeric,
	"debit_financial_adjustment_amount" numeric,
	"id_customer" bigint
);
--> statement-breakpoint
CREATE TABLE "report_types" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_filters" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "report_filters_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"id_report" bigint NOT NULL,
	"id_report_filter_param" bigint NOT NULL,
	"value" text NOT NULL,
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "country" (
	"code" varchar(5) PRIMARY KEY NOT NULL,
	"name" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "city" (
	"code" varchar(5) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchant_pix_settlement_orders" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "merchant_pix_settlement_orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"slug_customer" varchar(50),
	"id_customer" bigint,
	"slug_merchant" varchar(50),
	"id_merchant" bigint,
	"payment_date" date,
	"authorizer_merchant_id" varchar(50),
	"expected_payment_date" timestamp,
	"transaction_count" integer,
	"total_amount" numeric(18, 2),
	"total_refund_amount" numeric(18, 2),
	"total_net_amount" numeric(18, 2),
	"total_fee_amount" numeric(18, 2),
	"total_cost_amount" numeric(18, 2),
	"total_settlement_amount" numeric(18, 2),
	"status" varchar(20),
	"compe_code" varchar(10),
	"account_number" varchar(20),
	"account_number_check_digit" varchar(5),
	"bank_branch_number" varchar(10),
	"account_type" varchar(20),
	"legal_person" varchar(20),
	"document_id" varchar(20),
	"corporate_name" varchar(255),
	"effective_payment_date" timestamp,
	"settlement_unique_number" varchar(100),
	"protocol_guid_id" varchar(50),
	"fee_settlement_unique_number" varchar(100),
	"fee_effective_payment_date" timestamp,
	"fee_protocol_guid_id" varchar(100),
	"id_merchant_settlement" bigint
);
--> statement-breakpoint
CREATE TABLE "sync_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sync_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"sync_type" varchar(50),
	"date_time" timestamp,
	"total_records_created" integer,
	"total_records_updated" integer,
	"total_records_retrieved" integer
);
--> statement-breakpoint
CREATE TABLE "functions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "functions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp,
	"active" boolean DEFAULT true,
	"name" varchar(255),
	"group" varchar(150)
);
--> statement-breakpoint
CREATE TABLE "profile_functions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "profile_functions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp,
	"active" boolean DEFAULT true,
	"id_profile" bigint,
	"id_functions" bigint
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp,
	"active" boolean DEFAULT true,
	"name" varchar(100),
	"description" varchar(500),
	"is_sales_agent" boolean
);
--> statement-breakpoint
CREATE TABLE "shopping_items" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shopping_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP,
	"active" boolean DEFAULT true,
	"id_payment_link" bigint,
	"name" varchar(100),
	"quantity" integer,
	"amount" numeric,
	"slug" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "establishment_format" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT "establishment_format_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "account_type" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT "account_type_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "brand" (
	"code" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchant_transaction_price" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "merchant_transaction_price_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"installment_transaction_fee_start" integer,
	"installment_transaction_fee_end" integer,
	"card_transaction_fee" integer,
	"card_transaction_mdr" numeric,
	"non_card_transaction_fee" integer,
	"non_card_transaction_mdr" numeric,
	"producttype" varchar(20),
	"id_merchant_price_group" bigint
);
--> statement-breakpoint
CREATE TABLE "product_type" (
	"code" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anticipation_type" (
	"code" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "table_type" (
	"code" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"slug" uuid PRIMARY KEY NOT NULL,
	"active" boolean,
	"dt_insert" timestamp,
	"dt_update" timestamp,
	"slug_authorizer" varchar(250),
	"slug_terminal" varchar(250),
	"slug_merchant" varchar(250),
	"merchant_type" varchar(250),
	"merchant_name" varchar(500),
	"merchant_corporate_name" varchar(500),
	"slug_customer" varchar(250),
	"customer_name" varchar(250),
	"sales_channel" varchar(50),
	"authorizer_merchant_id" varchar(50),
	"muid" varchar(50),
	"currency" varchar(10),
	"total_amount" numeric(15, 2),
	"transaction_status" varchar(50),
	"product_type" varchar(50),
	"rrn" varchar(50),
	"first_digits" varchar(10),
	"lastdigits" varchar(10),
	"productorissuer" varchar(50),
	"settlementmanagementtype" varchar(50),
	"method_type" varchar(50),
	"brand" varchar(50),
	"cancelling" boolean,
	"split_type" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "sync_control" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" varchar(50) NOT NULL,
	"count_total" integer NOT NULL,
	"current_offset" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "transaction_cycles" (
	"slug" varchar(255) PRIMARY KEY NOT NULL,
	"active" boolean,
	"dt_insert" timestamp,
	"dt_update" timestamp,
	"slug_transaction" varchar(255),
	"processing_date" timestamp,
	"cycle_type" varchar(50),
	"cycle_status" varchar(50),
	"device_stan" varchar(50),
	"gateway_stan" varchar(50),
	"response_code" varchar(10),
	"gateway_version" varchar(50),
	"tracking_number" varchar(50),
	"amount" numeric(18, 2),
	"interest" numeric(18, 2),
	"authorization_code" varchar(50),
	"rrn" varchar(50),
	"connection_mode" varchar(50),
	"connection_detail" varchar(500),
	"application" varchar(50),
	"application_version" varchar(50),
	"transmission_date" timestamp,
	"entry_mode" varchar(50),
	"request_token" varchar(255),
	"confirmed" boolean,
	"authorizer_response_code" varchar(10),
	"authorizer_response_message" varchar(255),
	"original_stan" varchar(50),
	"installments" varchar(50),
	"installmenttype" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "modules_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp,
	"active" boolean DEFAULT true,
	"name" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "module_functions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "module_functions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp,
	"active" boolean DEFAULT true,
	"id_module" bigint,
	"id_function" bigint
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "addresses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"street_address" varchar(255),
	"street_number" varchar(10),
	"complement" varchar(100),
	"neighborhood" varchar(50),
	"city" varchar(50),
	"state" varchar(20),
	"country" varchar(20),
	"zip_code" varchar(15)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"name" varchar(255),
	"mcc" varchar(10),
	"cnae" varchar(25),
	"anticipation_risk_factor_cp" integer,
	"anticipation_risk_factor_cnp" integer,
	"waiting_period_cp" integer,
	"waiting_period_cnp" integer
);
--> statement-breakpoint
CREATE TABLE "merchant_price" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "merchant_price_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"slug_merchant" varchar(50),
	"name" varchar(255),
	"table_type" varchar(20),
	"compulsory_anticipation_config" integer,
	"eventual_anticipation_fee" numeric,
	"anticipation_type" varchar(25),
	"card_pix_mdr" numeric,
	"card_pix_ceiling_fee" numeric,
	"card_pix_minimum_cost_fee" numeric,
	"non_card_pix_mdr" numeric,
	"non_card_pix_ceiling_fee" numeric,
	"non_card_pix_minimum_cost_fee" numeric
);
--> statement-breakpoint
CREATE TABLE "merchant_price_group" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "merchant_price_group_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"brand" varchar(25),
	"id_group" integer,
	"id_merchant_price" bigint
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "merchants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"id_merchant" varchar(20),
	"name" varchar(255),
	"id_document" varchar(20),
	"corporate_name" varchar(255),
	"email" varchar(255),
	"area_code" varchar(5),
	"number" varchar(15),
	"phone_type" char(2),
	"language" varchar(10),
	"timezone" varchar(10),
	"slug_customer" varchar(50),
	"risk_analysis_status" varchar(20),
	"risk_analysis_status_justification" text,
	"legal_person" varchar(50),
	"opening_date" date,
	"inclusion" varchar(255),
	"opening_days" varchar(10),
	"opening_hour" time,
	"closing_hour" time,
	"municipal_registration" varchar(20),
	"state_subcription" varchar(20),
	"has_tef" boolean,
	"has_pix" boolean,
	"has_top" boolean,
	"establishment_format" varchar(10),
	"revenue" numeric(15, 2),
	"id_category" integer,
	"slug_category" varchar(50),
	"id_legal_nature" integer,
	"slug_legal_nature" varchar(50),
	"id_sales_agent" integer,
	"slug_sales_agent" varchar(50),
	"id_configuration" integer,
	"slug_configuration" varchar(50),
	"id_address" integer,
	"id_merchant_price" bigint,
	"id_customer" bigint,
	"dtdelete" timestamp
);
--> statement-breakpoint
CREATE TABLE "legal_natures" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "legal_natures_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"name" varchar(255),
	"code" varchar(10)
);
--> statement-breakpoint
CREATE TABLE "recurrence_types" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "period_types" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "file_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"file_name" varchar(200),
	"file_url" text,
	"active" boolean,
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP,
	"extension" varchar(5),
	"file_type" varchar(20),
	"slug" uuid DEFAULT gen_random_uuid()
);
--> statement-breakpoint
CREATE TABLE "file_formats" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchantpixaccount" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "merchantpixaccount_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"id_registration" varchar(50),
	"id_account" varchar(20),
	"bank_number" varchar(10),
	"bank_branch_number" varchar(10),
	"bank_branch_digit" varchar(1),
	"bank_account_number" varchar(20),
	"bank_account_digit" char(1),
	"bank_account_type" varchar(10),
	"bank_account_status" varchar(20),
	"onboarding_pix_status" varchar(20),
	"message" text,
	"bank_name" varchar(255),
	"id_merchant" integer,
	"slug_merchant" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "customer_functions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "customer_functions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp,
	"active" boolean DEFAULT true,
	"id_customer" bigint,
	"id_functions" bigint
);
--> statement-breakpoint
CREATE TABLE "report_execution_status" (
	"code" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_filters_param" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "report_filters_param_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"type" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP,
	"attributename" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reports_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"title" varchar(200) NOT NULL,
	"recurrence_code" varchar(10),
	"shipping_time" time,
	"period_code" varchar(10),
	"emails" text,
	"format_code" varchar(10),
	"report_type" varchar(10),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP,
	"day_week" varchar(10),
	"start_time" time,
	"day_month" varchar(20),
	"end_time" time,
	"reference_date_type" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp,
	"active" boolean DEFAULT true,
	"id_clerk" varchar(100),
	"id_customer" bigint,
	"id_profile" bigint,
	"full_access" boolean,
	"id_address" bigint
);
--> statement-breakpoint
CREATE TABLE "cron_job_monitoring" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_name" varchar(100) NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"status" varchar(20) NOT NULL,
	"log_message" text,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "contacts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" varchar(255),
	"id_document" varchar(20),
	"email" varchar(255),
	"area_code" varchar(5),
	"number" varchar(20),
	"phone_type" char(1),
	"birth_date" date,
	"mothers_name" varchar(255),
	"is_partner_contact" boolean,
	"is_pep" boolean,
	"id_merchant" integer,
	"slug_merchant" varchar(50),
	"id_address" integer,
	"ic_number" varchar(50),
	"ic_date_issuance" date,
	"ic_dispatcher" varchar(10),
	"ic_federative_unit" varchar(5)
);
--> statement-breakpoint
CREATE TABLE "payment_link" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payment_link_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"link_name" varchar(255),
	"dt_expiration" timestamp,
	"total_amount" numeric,
	"id_merchant" bigint,
	"payment_link_status" varchar(50),
	"product_type" varchar(50),
	"installments" integer,
	"link_url" varchar(255),
	"pix_enabled" boolean,
	"transaction_slug" varchar(50),
	"is_from_server" boolean,
	"modified" boolean,
	"is_deleted" boolean
);
--> statement-breakpoint
CREATE TABLE "merchantfile" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fl_merchantfile_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"id_merchant" bigint,
	"id_file" bigint,
	"active" boolean DEFAULT true,
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP,
	"extension" varchar(10)
);
--> statement-breakpoint
CREATE TABLE "user_merchants" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_merchants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"dtinsert" timestamp DEFAULT CURRENT_TIMESTAMP,
	"dtupdate" timestamp DEFAULT CURRENT_TIMESTAMP,
	"active" boolean DEFAULT true,
	"id_merchant" bigint,
	"id_user" bigint
);
--> statement-breakpoint
CREATE TABLE "report_execution" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_report" integer,
	"id_user" integer,
	"total_rows" integer,
	"total_processed_rows" integer,
	"id_file" integer,
	"status" varchar(20) NOT NULL,
	"created_on" timestamp,
	"schedule_date" timestamp NOT NULL,
	"execution_start" timestamp,
	"execution_end" timestamp,
	"emails_sent" text,
	"filters" jsonb,
	"error_message" text,
	"report_filter_start_date" varchar(255),
	"report_filter_end_date_time" varchar(255),
	"file_id" bigint
);
--> statement-breakpoint
CREATE TABLE "payout_antecipations" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payout_antecipations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"payout_id" varchar(50),
	"slug_merchant" varchar(50),
	"id_merchants" bigint,
	"rrn" varchar(30),
	"transaction_date" timestamp,
	"type" varchar(30),
	"brand" varchar(30),
	"installment_number" integer,
	"installments" integer,
	"installment_amount" numeric,
	"transaction_mdr" numeric,
	"transaction_mdr_fee" numeric,
	"transaction_fee" numeric,
	"settlement_amount" numeric,
	"expected_settlement_date" date,
	"anticipated_amount" numeric,
	"anticipation_settlement_amount" numeric,
	"status" varchar(30),
	"anticipation_day_number" integer,
	"anticipation_fee" numeric,
	"anticipation_month_fee" numeric,
	"net_amount" numeric,
	"anticipation_code" varchar(30),
	"total_anticipated_amount" numeric,
	"settlement_date" date,
	"effective_payment_date" date,
	"settlement_unique_number" varchar(50),
	"slug_customer" varchar(50),
	"id_customer" bigint
);
--> statement-breakpoint
CREATE TABLE "payout" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payout_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"payout_id" varchar(50),
	"slug_merchant" varchar(50),
	"id_merchant" bigint,
	"rrn" varchar(50),
	"transaction_date" timestamp,
	"product_type" varchar(50),
	"type" varchar(50),
	"brand" varchar(50),
	"installment_number" integer,
	"installments" integer,
	"installment_amount" numeric,
	"transaction_mdr" numeric,
	"transaction_mdr_fee" numeric,
	"transaction_fee" numeric,
	"settlement_amount" numeric,
	"expected_settlement_date" timestamp,
	"status" varchar(50),
	"receivable_amount" numeric,
	"settlement_date" timestamp,
	"slug_customer" varchar(50),
	"id_customer" bigint,
	"effective_payment_date" timestamp,
	"settlement_unique_number" varchar(50),
	"anticipation_amount" numeric,
	"anticipation_block_status" varchar(50),
	"slug_merchant_split" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "merchant_settlements" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "merchantsettlements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"transaction_count" integer,
	"adjustment_count" integer,
	"batch_amount" numeric(18, 2),
	"net_settlement_amount" numeric(18, 2),
	"pix_amount" numeric(18, 2),
	"pix_net_amount" numeric(18, 2),
	"pix_fee_amount" numeric(18, 2),
	"pix_cost_amount" numeric(18, 2),
	"credit_adjustment_amount" numeric(18, 2),
	"debit_adjustment_amount" numeric(18, 2),
	"total_anticipation_amount" numeric(18, 2),
	"total_restitution_amount" numeric(18, 2),
	"pending_restitution_amount" numeric(18, 2),
	"total_settlement_amount" numeric(18, 2),
	"pending_financial_adjustment_amount" numeric(18, 2),
	"credit_financial_adjustment_amount" numeric(18, 2),
	"debit_financial_adjustment_amount" numeric(18, 2),
	"status" varchar(50),
	"slug_merchant" varchar(50),
	"id_merchant" bigint,
	"slug_customer" varchar(50),
	"id_customer" bigint,
	"outstanding_amount" numeric(18, 2),
	"rest_rounding_amount" numeric(18, 2),
	"id_settlement" bigint
);
--> statement-breakpoint
CREATE TABLE "merchant_settlement_orders" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "merchant_settlement_orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(50),
	"active" boolean,
	"dtinsert" timestamp,
	"dtupdate" timestamp,
	"compe_code" varchar(10),
	"account_number" varchar(20),
	"account_number_check_digit" varchar(5),
	"slug_payment_institution" varchar(50),
	"id_payment_institution" bigint,
	"bank_branch_number" varchar(10),
	"account_type" varchar(20),
	"integration_type" varchar(20),
	"brand" varchar(50),
	"product_type" varchar(50),
	"amount" numeric,
	"anticipation_amount" numeric,
	"id_merchant_settlements" bigint,
	"outstanding_amount" numeric,
	"rest_rounding_amount" numeric,
	"merchant_settlement_order_status" varchar(50),
	"order_transaction_id" varchar(50),
	"settlement_unique_number" varchar(50),
	"protocol_guid_id" varchar(50),
	"legal_person" varchar(20),
	"document_id" varchar(20),
	"corporate_name" varchar(150),
	"effective_payment_date" timestamp,
	"lock" boolean
);
--> statement-breakpoint
ALTER TABLE "payment_institution" ADD CONSTRAINT "payment_institution_id_customer_db_fkey" FOREIGN KEY ("id_customer_db") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_id_parent_fkey" FOREIGN KEY ("id_parent") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_agents" ADD CONSTRAINT "fk_sales_agents_id_users" FOREIGN KEY ("id_users") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_filters" ADD CONSTRAINT "fk_report_filters_reports" FOREIGN KEY ("id_report") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_filters" ADD CONSTRAINT "fk_report_filters_param" FOREIGN KEY ("id_report_filter_param") REFERENCES "public"."report_filters_param"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_pix_settlement_orders" ADD CONSTRAINT "merchant_pix_settlement_orders_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_pix_settlement_orders" ADD CONSTRAINT "merchant_pix_settlement_orders_id_merchant_fkey" FOREIGN KEY ("id_merchant") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_pix_settlement_orders" ADD CONSTRAINT "merchant_pix_settlement_orders_id_merchant_settlement_fkey" FOREIGN KEY ("id_merchant_settlement") REFERENCES "public"."merchant_settlements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_functions" ADD CONSTRAINT "profile_functions_id_profile_fkey" FOREIGN KEY ("id_profile") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_functions" ADD CONSTRAINT "profile_functions_id_functions_fkey" FOREIGN KEY ("id_functions") REFERENCES "public"."functions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_id_payment_link_fkey" FOREIGN KEY ("id_payment_link") REFERENCES "public"."payment_link"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_transaction_price" ADD CONSTRAINT "merchant_transaction_price_id_merchant_price_group_fkey" FOREIGN KEY ("id_merchant_price_group") REFERENCES "public"."merchant_price_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_functions" ADD CONSTRAINT "module_functions_id_module_fkey" FOREIGN KEY ("id_module") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_functions" ADD CONSTRAINT "module_functions_id_function_fkey" FOREIGN KEY ("id_function") REFERENCES "public"."functions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_price_group" ADD CONSTRAINT "merchant_price_group_id_merchant_price_fkey" FOREIGN KEY ("id_merchant_price") REFERENCES "public"."merchant_price"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_id_category_fkey" FOREIGN KEY ("id_category") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_id_legal_nature_fkey" FOREIGN KEY ("id_legal_nature") REFERENCES "public"."legal_natures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_id_sales_agent_fkey" FOREIGN KEY ("id_sales_agent") REFERENCES "public"."sales_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_id_configuration_fkey" FOREIGN KEY ("id_configuration") REFERENCES "public"."configurations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_id_address_fkey" FOREIGN KEY ("id_address") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_id_merchant_price_fkey" FOREIGN KEY ("id_merchant_price") REFERENCES "public"."merchant_price"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchantpixaccount" ADD CONSTRAINT "merchantpixaccount_id_merchant_fkey" FOREIGN KEY ("id_merchant") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_functions" ADD CONSTRAINT "customer_functions_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_functions" ADD CONSTRAINT "customer_functions_id_functions_fkey" FOREIGN KEY ("id_functions") REFERENCES "public"."functions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_profile_fkey" FOREIGN KEY ("id_profile") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "fk_users_id_address" FOREIGN KEY ("id_address") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_id_address_fkey" FOREIGN KEY ("id_address") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_id_merchant_fkey" FOREIGN KEY ("id_merchant") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_link" ADD CONSTRAINT "payment_link_id_merchant_fkey" FOREIGN KEY ("id_merchant") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchantfile" ADD CONSTRAINT "fl_merchantfile_id_merchant_fkey" FOREIGN KEY ("id_merchant") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchantfile" ADD CONSTRAINT "fl_merchantfile_id_file_fkey" FOREIGN KEY ("id_file") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_merchants" ADD CONSTRAINT "user_merchants_id_merchant_fkey" FOREIGN KEY ("id_merchant") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_merchants" ADD CONSTRAINT "user_merchants_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_execution" ADD CONSTRAINT "report_execution_id_report_fkey" FOREIGN KEY ("id_report") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_execution" ADD CONSTRAINT "report_execution_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_execution" ADD CONSTRAINT "report_execution_id_file_fkey" FOREIGN KEY ("id_file") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_execution" ADD CONSTRAINT "report_execution_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."report_execution_status"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_execution" ADD CONSTRAINT "fk_report_execution_file" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_antecipations" ADD CONSTRAINT "payout_antecipations_id_merchants_fkey" FOREIGN KEY ("id_merchants") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_antecipations" ADD CONSTRAINT "payout_antecipations_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "payout_id_merchant_fkey" FOREIGN KEY ("id_merchant") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "payout_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_settlements" ADD CONSTRAINT "merchantsettlements_id_merchant_fkey" FOREIGN KEY ("id_merchant") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_settlements" ADD CONSTRAINT "merchantsettlements_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_settlements" ADD CONSTRAINT "merchantsettlements_id_settlement_fkey" FOREIGN KEY ("id_settlement") REFERENCES "public"."settlements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_settlement_orders" ADD CONSTRAINT "merchant_settlement_orders_id_payment_institution_fkey" FOREIGN KEY ("id_payment_institution") REFERENCES "public"."payment_institution"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_settlement_orders" ADD CONSTRAINT "merchant_settlement_orders_id_merchant_settlements_fkey" FOREIGN KEY ("id_merchant_settlements") REFERENCES "public"."merchant_settlements"("id") ON DELETE no action ON UPDATE no action;
