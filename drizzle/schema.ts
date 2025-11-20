import { pgTable, unique, serial, varchar, boolean, timestamp, char, integer, foreignKey, bigint, numeric, date, text, uuid, time, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const terminals = pgTable("terminals", {
	id: serial().primaryKey().notNull(),
	slug: varchar({ length: 255 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	logicalNumber: varchar("logical_number", { length: 50 }),
	type: char({ length: 1 }),
	status: varchar({ length: 50 }),
	serialNumber: varchar("serial_number", { length: 50 }),
	model: varchar({ length: 255 }),
	manufacturer: varchar({ length: 50 }),
	pinpadSerialNumber: varchar("pinpad_serial_number", { length: 50 }),
	pinpadFirmware: varchar("pinpad_firmware", { length: 50 }),
	slugMerchant: varchar("slug_merchant", { length: 50 }),
	slugCustomer: varchar("slug_customer", { length: 50 }),
	pverfm: varchar({ length: 50 }),
	goUpdate: boolean("go_update"),
	inactivationDate: timestamp("inactivation_date", { mode: 'string' }),
	uniqueNumberForMerchant: integer("unique_number_for_merchant"),
}, (table) => [
	unique("terminals_slug_key").on(table.slug),
]);

export const paymentInstitution = pgTable("payment_institution", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "payment_institution_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	name: varchar({ length: 255 }),
	idCustomer: varchar("id_customer", { length: 20 }),
	settlementManagementType: varchar("settlement_management_type", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idCustomerDb: bigint("id_customer_db", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idCustomerDb],
			foreignColumns: [customers.id],
			name: "payment_institution_id_customer_db_fkey"
		}),
]);

export const state = pgTable("state", {
	code: varchar({ length: 5 }).primaryKey().notNull(),
	name: varchar({ length: 20 }).notNull(),
});

export const bank = pgTable("bank", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "bank_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }),
	dtupdate: timestamp({ mode: 'string' }),
	name: varchar({ length: 255 }),
	number: varchar({ length: 10 }),
});

export const configurations = pgTable("configurations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "configurations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }),
	dtupdate: timestamp({ mode: 'string' }),
	lockCpAnticipationOrder: boolean("lock_cp_anticipation_order"),
	lockCnpAnticipationOrder: boolean("lock_cnp_anticipation_order"),
	url: varchar({ length: 255 }),
	anticipationRiskFactorCp: numeric("anticipation_risk_factor_cp"),
	anticipationRiskFactorCnp: numeric("anticipation_risk_factor_cnp"),
	waitingPeriodCp: numeric("waiting_period_cp"),
	waitingPeriodCnp: numeric("waiting_period_cnp"),
});

export const salesAgents = pgTable("sales_agents", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "sales_agents_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }),
	dtupdate: timestamp({ mode: 'string' }),
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	documentId: varchar("document_id", { length: 50 }),
	email: varchar({ length: 255 }),
	slugCustomer: varchar("slug_customer", { length: 50 }),
	birthDate: date("birth_date"),
	phone: varchar({ length: 20 }),
	cpf: varchar({ length: 20 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idUsers: bigint("id_users", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idUsers],
			foreignColumns: [users.id],
			name: "fk_sales_agents_id_users"
		}),
]);

export const settlements = pgTable("settlements", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "settlements_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }),
	dtupdate: timestamp({ mode: 'string' }),
	batchAmount: numeric("batch_amount"),
	discountFeeAmount: numeric("discount_fee_amount"),
	netSettlementAmount: numeric("net_settlement_amount"),
	totalAnticipationAmount: numeric("total_anticipation_amount"),
	totalRestitutionAmount: numeric("total_restitution_amount"),
	pixAmount: numeric("pix_amount"),
	pixNetAmount: numeric("pix_net_amount"),
	pixFeeAmount: numeric("pix_fee_amount"),
	pixCostAmount: numeric("pix_cost_amount"),
	pendingRestitutionAmount: numeric("pending_restitution_amount"),
	totalCreditAdjustmentAmount: numeric("total_credit_adjustment_amount"),
	totalDebitAdjustmentAmount: numeric("total_debit_adjustment_amount"),
	totalSettlementAmount: numeric("total_settlement_amount"),
	restRoundingAmount: numeric("rest_rounding_amount"),
	outstandingAmount: numeric("outstanding_amount"),
	slugCustomer: varchar("slug_customer", { length: 50 }),
	status: varchar({ length: 50 }),
	creditStatus: varchar("credit_status", { length: 50 }),
	debitStatus: varchar("debit_status", { length: 50 }),
	anticipationStatus: varchar("anticipation_status", { length: 50 }),
	pixStatus: varchar("pix_status", { length: 50 }),
	paymentDate: date("payment_date"),
	pendingFinancialAdjustmentAmount: numeric("pending_financial_adjustment_amount"),
	creditFinancialAdjustmentAmount: numeric("credit_financial_adjustment_amount"),
	debitFinancialAdjustmentAmount: numeric("debit_financial_adjustment_amount"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idCustomer: bigint("id_customer", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idCustomer],
			foreignColumns: [customers.id],
			name: "settlements_id_customer_fkey"
		}),
]);

export const customers = pgTable("customers", {
	slug: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }),
	customerId: varchar("customer_id", { length: 100 }),
	settlementManagementType: varchar("settlement_management_type", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "customers_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idParent: bigint("id_parent", { mode: "number" }),
	isActive: boolean("is_active").default(true),
}, (table) => [
	foreignKey({
			columns: [table.idParent],
			foreignColumns: [table.id],
			name: "customers_id_parent_fkey"
		}),
]);

export const reportTypes = pgTable("report_types", {
	code: varchar({ length: 10 }).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
});

export const reportFilters = pgTable("report_filters", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "report_filters_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idReport: bigint("id_report", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idReportFilterParam: bigint("id_report_filter_param", { mode: "number" }).notNull(),
	value: text().notNull(),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.idReport],
			foreignColumns: [reports.id],
			name: "fk_report_filters_reports"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.idReportFilterParam],
			foreignColumns: [reportFiltersParam.id],
			name: "fk_report_filters_param"
		}).onDelete("cascade"),
]);

export const country = pgTable("country", {
	code: varchar({ length: 5 }).primaryKey().notNull(),
	name: varchar({ length: 20 }).notNull(),
});

export const city = pgTable("city", {
	code: varchar({ length: 5 }).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
});

export const merchantPixSettlementOrders = pgTable("merchant_pix_settlement_orders", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "merchant_pix_settlement_orders_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }),
	dtupdate: timestamp({ mode: 'string' }),
	slugCustomer: varchar("slug_customer", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idCustomer: bigint("id_customer", { mode: "number" }),
	slugMerchant: varchar("slug_merchant", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idMerchant: bigint("id_merchant", { mode: "number" }),
	paymentDate: date("payment_date"),
	authorizerMerchantId: varchar("authorizer_merchant_id", { length: 50 }),
	expectedPaymentDate: timestamp("expected_payment_date", { mode: 'string' }),
	transactionCount: integer("transaction_count"),
	totalAmount: numeric("total_amount", { precision: 18, scale:  2 }),
	totalRefundAmount: numeric("total_refund_amount", { precision: 18, scale:  2 }),
	totalNetAmount: numeric("total_net_amount", { precision: 18, scale:  2 }),
	totalFeeAmount: numeric("total_fee_amount", { precision: 18, scale:  2 }),
	totalCostAmount: numeric("total_cost_amount", { precision: 18, scale:  2 }),
	totalSettlementAmount: numeric("total_settlement_amount", { precision: 18, scale:  2 }),
	status: varchar({ length: 20 }),
	compeCode: varchar("compe_code", { length: 10 }),
	accountNumber: varchar("account_number", { length: 20 }),
	accountNumberCheckDigit: varchar("account_number_check_digit", { length: 5 }),
	bankBranchNumber: varchar("bank_branch_number", { length: 10 }),
	accountType: varchar("account_type", { length: 20 }),
	legalPerson: varchar("legal_person", { length: 20 }),
	documentId: varchar("document_id", { length: 20 }),
	corporateName: varchar("corporate_name", { length: 255 }),
	effectivePaymentDate: timestamp("effective_payment_date", { mode: 'string' }),
	settlementUniqueNumber: varchar("settlement_unique_number", { length: 100 }),
	protocolGuidId: varchar("protocol_guid_id", { length: 50 }),
	feeSettlementUniqueNumber: varchar("fee_settlement_unique_number", { length: 100 }),
	feeEffectivePaymentDate: timestamp("fee_effective_payment_date", { mode: 'string' }),
	feeProtocolGuidId: varchar("fee_protocol_guid_id", { length: 100 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idMerchantSettlement: bigint("id_merchant_settlement", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idCustomer],
			foreignColumns: [customers.id],
			name: "merchant_pix_settlement_orders_id_customer_fkey"
		}),
	foreignKey({
			columns: [table.idMerchant],
			foreignColumns: [merchants.id],
			name: "merchant_pix_settlement_orders_id_merchant_fkey"
		}),
	foreignKey({
			columns: [table.idMerchantSettlement],
			foreignColumns: [merchantSettlements.id],
			name: "merchant_pix_settlement_orders_id_merchant_settlement_fkey"
		}),
]);

export const syncLog = pgTable("sync_log", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "sync_log_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	syncType: varchar("sync_type", { length: 50 }),
	dateTime: timestamp("date_time", { mode: 'string' }),
	totalRecordsCreated: integer("total_records_created"),
	totalRecordsUpdated: integer("total_records_updated"),
	totalRecordsRetrieved: integer("total_records_retrieved"),
});

export const functions = pgTable("functions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "functions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }),
	active: boolean().default(true),
	name: varchar({ length: 255 }),
	group: varchar({ length: 150 }),
});

export const profileFunctions = pgTable("profile_functions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "profile_functions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }),
	active: boolean().default(true),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idProfile: bigint("id_profile", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idFunctions: bigint("id_functions", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idProfile],
			foreignColumns: [profiles.id],
			name: "profile_functions_id_profile_fkey"
		}),
	foreignKey({
			columns: [table.idFunctions],
			foreignColumns: [functions.id],
			name: "profile_functions_id_functions_fkey"
		}),
]);

export const profileCustomers = pgTable("profile_customers", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "profile_customers_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	active: boolean().default(true),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idProfile: bigint("id_profile", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idCustomer: bigint("id_customer", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idProfile],
			foreignColumns: [profiles.id],
			name: "profile_customers_id_profile_fkey"
		}),
	foreignKey({
			columns: [table.idCustomer],
			foreignColumns: [customers.id],
			name: "profile_customers_id_customer_fkey"
		}),
]);

export const profiles = pgTable("profiles", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "profiles_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }),
	active: boolean().default(true),
	name: varchar({ length: 100 }),
	description: varchar({ length: 500 }),
	isSalesAgent: boolean("is_sales_agent"),
	restrictCustomerData: boolean("restrict_customer_data").default(false),
});

export const shoppingItems = pgTable("shopping_items", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "shopping_items_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	active: boolean().default(true),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idPaymentLink: bigint("id_payment_link", { mode: "number" }),
	name: varchar({ length: 100 }),
	quantity: integer(),
	amount: numeric(),
	slug: varchar({ length: 50 }),
}, (table) => [
	foreignKey({
			columns: [table.idPaymentLink],
			foreignColumns: [paymentLink.id],
			name: "shopping_items_id_payment_link_fkey"
		}),
]);

export const establishmentFormat = pgTable("establishment_format", {
	code: varchar({ length: 10 }).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
}, (table) => [
	unique("establishment_format_name_key").on(table.name),
]);

export const accountType = pgTable("account_type", {
	code: varchar({ length: 10 }).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
}, (table) => [
	unique("account_type_name_key").on(table.name),
]);

export const brand = pgTable("brand", {
	code: varchar({ length: 50 }).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
});

export const merchantTransactionPrice = pgTable("merchant_transaction_price", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "merchant_transaction_price_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }),
	dtupdate: timestamp({ mode: 'string' }),
	installmentTransactionFeeStart: integer("installment_transaction_fee_start"),
	installmentTransactionFeeEnd: integer("installment_transaction_fee_end"),
	cardTransactionFee: integer("card_transaction_fee"),
	cardTransactionMdr: numeric("card_transaction_mdr"),
	nonCardTransactionFee: integer("non_card_transaction_fee"),
	nonCardTransactionMdr: numeric("non_card_transaction_mdr"),
	producttype: varchar({ length: 20 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idMerchantPriceGroup: bigint("id_merchant_price_group", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idMerchantPriceGroup],
			foreignColumns: [merchantPriceGroup.id],
			name: "merchant_transaction_price_id_merchant_price_group_fkey"
		}),
]);

export const productType = pgTable("product_type", {
	code: varchar({ length: 50 }).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
});

export const anticipationType = pgTable("anticipation_type", {
	code: varchar({ length: 50 }).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
});

export const tableType = pgTable("table_type", {
	code: varchar({ length: 50 }).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
});

export const transactions = pgTable("transactions", {
	slug: uuid().primaryKey().notNull(),
	active: boolean(),
	dtInsert: timestamp("dt_insert", { mode: 'string' }),
	dtUpdate: timestamp("dt_update", { mode: 'string' }),
	slugAuthorizer: varchar("slug_authorizer", { length: 250 }),
	slugTerminal: varchar("slug_terminal", { length: 250 }),
	slugMerchant: varchar("slug_merchant", { length: 250 }),
	merchantType: varchar("merchant_type", { length: 250 }),
	merchantName: varchar("merchant_name", { length: 500 }),
	merchantCorporateName: varchar("merchant_corporate_name", { length: 500 }),
	slugCustomer: varchar("slug_customer", { length: 250 }),
	customerName: varchar("customer_name", { length: 250 }),
	salesChannel: varchar("sales_channel", { length: 50 }),
	authorizerMerchantId: varchar("authorizer_merchant_id", { length: 50 }),
	muid: varchar({ length: 50 }),
	currency: varchar({ length: 10 }),
	totalAmount: numeric("total_amount", { precision: 15, scale:  2 }),
	transactionStatus: varchar("transaction_status", { length: 50 }),
	productType: varchar("product_type", { length: 50 }),
	rrn: varchar({ length: 50 }),
	firstDigits: varchar("first_digits", { length: 10 }),
	lastdigits: varchar({ length: 10 }),
	productorissuer: varchar({ length: 50 }),
	settlementmanagementtype: varchar({ length: 50 }),
	methodType: varchar("method_type", { length: 50 }),
	brand: varchar({ length: 50 }),
	cancelling: boolean(),
	splitType: varchar("split_type", { length: 50 }),
});

export const syncControl = pgTable("sync_control", {
	id: serial().primaryKey().notNull(),
	status: varchar({ length: 50 }).notNull(),
	countTotal: integer("count_total").notNull(),
	currentOffset: integer("current_offset").default(0).notNull(),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
});

export const transactionCycles = pgTable("transaction_cycles", {
	slug: varchar({ length: 255 }).primaryKey().notNull(),
	active: boolean(),
	dtInsert: timestamp("dt_insert", { mode: 'string' }),
	dtUpdate: timestamp("dt_update", { mode: 'string' }),
	slugTransaction: varchar("slug_transaction", { length: 255 }),
	processingDate: timestamp("processing_date", { mode: 'string' }),
	cycleType: varchar("cycle_type", { length: 50 }),
	cycleStatus: varchar("cycle_status", { length: 50 }),
	deviceStan: varchar("device_stan", { length: 50 }),
	gatewayStan: varchar("gateway_stan", { length: 50 }),
	responseCode: varchar("response_code", { length: 10 }),
	gatewayVersion: varchar("gateway_version", { length: 50 }),
	trackingNumber: varchar("tracking_number", { length: 50 }),
	amount: numeric({ precision: 18, scale:  2 }),
	interest: numeric({ precision: 18, scale:  2 }),
	authorizationCode: varchar("authorization_code", { length: 50 }),
	rrn: varchar({ length: 50 }),
	connectionMode: varchar("connection_mode", { length: 50 }),
	connectionDetail: varchar("connection_detail", { length: 500 }),
	application: varchar({ length: 50 }),
	applicationVersion: varchar("application_version", { length: 50 }),
	transmissionDate: timestamp("transmission_date", { mode: 'string' }),
	entryMode: varchar("entry_mode", { length: 50 }),
	requestToken: varchar("request_token", { length: 255 }),
	confirmed: boolean(),
	authorizerResponseCode: varchar("authorizer_response_code", { length: 10 }),
	authorizerResponseMessage: varchar("authorizer_response_message", { length: 255 }),
	originalStan: varchar("original_stan", { length: 50 }),
	installments: varchar({ length: 50 }),
	installmenttype: varchar({ length: 50 }),
});

export const modules = pgTable("modules", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "modules_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }),
	active: boolean().default(true),
	name: varchar({ length: 255 }),
});

export const moduleFunctions = pgTable("module_functions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "module_functions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }),
	active: boolean().default(true),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idModule: bigint("id_module", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idFunction: bigint("id_function", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idModule],
			foreignColumns: [modules.id],
			name: "module_functions_id_module_fkey"
		}),
	foreignKey({
			columns: [table.idFunction],
			foreignColumns: [functions.id],
			name: "module_functions_id_function_fkey"
		}),
]);

export const addresses = pgTable("addresses", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "addresses_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	streetAddress: varchar("street_address", { length: 255 }),
	streetNumber: varchar("street_number", { length: 10 }),
	complement: varchar({ length: 100 }),
	neighborhood: varchar({ length: 50 }),
	city: varchar({ length: 50 }),
	state: varchar({ length: 20 }),
	country: varchar({ length: 20 }),
	zipCode: varchar("zip_code", { length: 15 }),
});

export const merchantPrice = pgTable("merchant_price", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "merchant_price_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }),
	dtupdate: timestamp({ mode: 'string' }),
	slugMerchant: varchar("slug_merchant", { length: 50 }),
	name: varchar({ length: 255 }),
	tableType: varchar("table_type", { length: 20 }),
	compulsoryAnticipationConfig: integer("compulsory_anticipation_config"),
	eventualAnticipationFee: numeric("eventual_anticipation_fee"),
	anticipationType: varchar("anticipation_type", { length: 25 }),
	cardPixMdr: numeric("card_pix_mdr"),
	cardPixCeilingFee: numeric("card_pix_ceiling_fee"),
	cardPixMinimumCostFee: numeric("card_pix_minimum_cost_fee"),
	nonCardPixMdr: numeric("non_card_pix_mdr"),
	nonCardPixCeilingFee: numeric("non_card_pix_ceiling_fee"),
	nonCardPixMinimumCostFee: numeric("non_card_pix_minimum_cost_fee"),
});

export const merchantPriceGroup = pgTable("merchant_price_group", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "merchant_price_group_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }),
	dtupdate: timestamp({ mode: 'string' }),
	brand: varchar({ length: 25 }),
	idGroup: integer("id_group"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idMerchantPrice: bigint("id_merchant_price", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idMerchantPrice],
			foreignColumns: [merchantPrice.id],
			name: "merchant_price_group_id_merchant_price_fkey"
		}),
]);

export const merchants = pgTable("merchants", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "merchants_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }),
	dtupdate: timestamp({ mode: 'string' }),
	idMerchant: varchar("id_merchant", { length: 20 }),
	name: varchar({ length: 255 }),
	idDocument: varchar("id_document", { length: 20 }),
	corporateName: varchar("corporate_name", { length: 255 }),
	email: varchar({ length: 255 }),
	areaCode: varchar("area_code", { length: 5 }),
	number: varchar({ length: 15 }),
	phoneType: char("phone_type", { length: 2 }),
	language: varchar({ length: 10 }),
	timezone: varchar({ length: 10 }),
	slugCustomer: varchar("slug_customer", { length: 50 }),
	riskAnalysisStatus: varchar("risk_analysis_status", { length: 20 }),
	riskAnalysisStatusJustification: text("risk_analysis_status_justification"),
	legalPerson: varchar("legal_person", { length: 50 }),
	openingDate: date("opening_date"),
	inclusion: varchar({ length: 255 }),
	openingDays: varchar("opening_days", { length: 10 }),
	openingHour: time("opening_hour"),
	closingHour: time("closing_hour"),
	municipalRegistration: varchar("municipal_registration", { length: 20 }),
	stateSubcription: varchar("state_subcription", { length: 20 }),
	hasTef: boolean("has_tef"),
	hasPix: boolean("has_pix"),
	hasTop: boolean("has_top"),
	establishmentFormat: varchar("establishment_format", { length: 10 }),
	revenue: numeric({ precision: 15, scale:  2 }),
	idCategory: integer("id_category"),
	slugCategory: varchar("slug_category", { length: 50 }),
	idLegalNature: integer("id_legal_nature"),
	slugLegalNature: varchar("slug_legal_nature", { length: 50 }),
	idSalesAgent: integer("id_sales_agent"),
	slugSalesAgent: varchar("slug_sales_agent", { length: 50 }),
	idConfiguration: integer("id_configuration"),
	slugConfiguration: varchar("slug_configuration", { length: 50 }),
	idAddress: integer("id_address"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idMerchantPrice: bigint("id_merchant_price", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idCustomer: bigint("id_customer", { mode: "number" }),
	dtdelete: timestamp({ mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idMerchantBankAccount: bigint("id_merchant_bank_account", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idCategory],
			foreignColumns: [categories.id],
			name: "merchants_id_category_fkey"
		}),
	foreignKey({
			columns: [table.idLegalNature],
			foreignColumns: [legalNatures.id],
			name: "merchants_id_legal_nature_fkey"
		}),
	foreignKey({
			columns: [table.idSalesAgent],
			foreignColumns: [salesAgents.id],
			name: "merchants_id_sales_agent_fkey"
		}),
	foreignKey({
			columns: [table.idConfiguration],
			foreignColumns: [configurations.id],
			name: "merchants_id_configuration_fkey"
		}),
	foreignKey({
			columns: [table.idAddress],
			foreignColumns: [addresses.id],
			name: "merchants_id_address_fkey"
		}),
	foreignKey({
			columns: [table.idMerchantPrice],
			foreignColumns: [merchantPrice.id],
			name: "merchants_id_merchant_price_fkey"
		}),
	foreignKey({
			columns: [table.idCustomer],
			foreignColumns: [customers.id],
			name: "merchants_id_customer_fkey"
		}),
	foreignKey({
			columns: [table.idMerchantBankAccount],
			foreignColumns: [merchantBankAccounts.id],
			name: "merchants_id_merchant_bank_account_fkey"
		}),
]);

export const categories = pgTable("categories", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "categories_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }),
	dtupdate: timestamp({ mode: 'string' }),
	name: varchar({ length: 255 }),
	mcc: varchar({ length: 10 }),
	cnae: varchar({ length: 25 }),
	anticipationRiskFactorCp: integer("anticipation_risk_factor_cp"),
	anticipationRiskFactorCnp: integer("anticipation_risk_factor_cnp"),
	waitingPeriodCp: integer("waiting_period_cp"),
	waitingPeriodCnp: integer("waiting_period_cnp"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idSolicitationFee: bigint("id_solicitation_fee", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idSolicitationFee],
			foreignColumns: [solicitationFee.id],
			name: "cnae_solicitation_fee_id"
		}),
]);

export const legalNatures = pgTable("legal_natures", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "legal_natures_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }),
	dtupdate: timestamp({ mode: 'string' }),
	name: varchar({ length: 255 }),
	code: varchar({ length: 10 }),
});

export const recurrenceTypes = pgTable("recurrence_types", {
	code: varchar({ length: 10 }).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
});

export const periodTypes = pgTable("period_types", {
	code: varchar({ length: 10 }).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
});

export const fileFormats = pgTable("file_formats", {
	code: varchar({ length: 10 }).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
});

export const customerFunctions = pgTable("customer_functions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "customer_functions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }),
	active: boolean().default(true),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idCustomer: bigint("id_customer", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idFunctions: bigint("id_functions", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idCustomer],
			foreignColumns: [customers.id],
			name: "customer_functions_id_customer_fkey"
		}),
	foreignKey({
			columns: [table.idFunctions],
			foreignColumns: [functions.id],
			name: "customer_functions_id_functions_fkey"
		}),
]);

export const reportExecutionStatus = pgTable("report_execution_status", {
	code: varchar({ length: 20 }).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
});

export const reportFiltersParam = pgTable("report_filters_param", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "report_filters_param_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	type: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	attributename: varchar({ length: 100 }),
});

export const reports = pgTable("reports", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "reports_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	title: varchar({ length: 200 }).notNull(),
	recurrenceCode: varchar("recurrence_code", { length: 10 }),
	shippingTime: time("shipping_time"),
	periodCode: varchar("period_code", { length: 10 }),
	emails: text(),
	formatCode: varchar("format_code", { length: 10 }),
	reportType: varchar("report_type", { length: 10 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dayWeek: varchar("day_week", { length: 10 }),
	startTime: time("start_time"),
	dayMonth: varchar("day_month", { length: 20 }),
	endTime: time("end_time"),
	referenceDateType: varchar("reference_date_type", { length: 50 }),
});

export const file = pgTable("file", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "file_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	fileName: varchar("file_name", { length: 200 }),
	fileUrl: text("file_url"),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	extension: varchar({ length: 5 }),
	fileType: varchar("file_type", { length: 20 }),
	slug: uuid().defaultRandom(),
});

export const merchantpixaccount = pgTable("merchantpixaccount", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "merchantpixaccount_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }),
	dtupdate: timestamp({ mode: 'string' }),
	idRegistration: varchar("id_registration", { length: 50 }),
	idAccount: varchar("id_account", { length: 20 }),
	bankNumber: varchar("bank_number", { length: 10 }),
	bankBranchNumber: varchar("bank_branch_number", { length: 10 }),
	bankBranchDigit: varchar("bank_branch_digit", { length: 1 }),
	bankAccountNumber: varchar("bank_account_number", { length: 20 }),
	bankAccountDigit: char("bank_account_digit", { length: 1 }),
	bankAccountType: varchar("bank_account_type", { length: 10 }),
	bankAccountStatus: varchar("bank_account_status", { length: 20 }),
	onboardingPixStatus: varchar("onboarding_pix_status", { length: 20 }),
	message: text(),
	bankName: varchar("bank_name", { length: 255 }),
	idMerchant: integer("id_merchant"),
	slugMerchant: varchar("slug_merchant", { length: 50 }),
}, (table) => [
	foreignKey({
			columns: [table.idMerchant],
			foreignColumns: [merchants.id],
			name: "merchantpixaccount_id_merchant_fkey"
		}),
]);

export const users = pgTable("users", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "users_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }),
	active: boolean().default(true),
	idClerk: varchar("id_clerk", { length: 100 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idCustomer: bigint("id_customer", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idProfile: bigint("id_profile", { mode: "number" }),
	fullAccess: boolean("full_access"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idAddress: bigint("id_address", { mode: "number" }),
	hashedPassword: varchar("hashed_password", { length: 100 }),
	email: varchar({ length: 50 }),
	initialPassword: text("initial_password"),
}, (table) => [
	foreignKey({
			columns: [table.idCustomer],
			foreignColumns: [customers.id],
			name: "users_id_customer_fkey"
		}),
	foreignKey({
			columns: [table.idProfile],
			foreignColumns: [profiles.id],
			name: "users_id_profile_fkey"
		}),
	foreignKey({
			columns: [table.idAddress],
			foreignColumns: [addresses.id],
			name: "fk_users_id_address"
		}),
]);

export const adminCustomers = pgTable("admin_customers", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "admin_customers_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	active: boolean().default(true),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idUser: bigint("id_user", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idCustomer: bigint("id_customer", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idUser],
			foreignColumns: [users.id],
			name: "admin_customers_id_user_fkey"
		}),
	foreignKey({
			columns: [table.idCustomer],
			foreignColumns: [customers.id],
			name: "admin_customers_id_customer_fkey"
		}),
	unique("admin_customers_id_user_id_customer_key").on(table.idUser, table.idCustomer),
]);

export const reportExecution = pgTable("report_execution", {
	id: serial().primaryKey().notNull(),
	idReport: integer("id_report"),
	idUser: integer("id_user"),
	totalRows: integer("total_rows"),
	totalProcessedRows: integer("total_processed_rows"),
	idFile: integer("id_file"),
	status: varchar({ length: 20 }).notNull(),
	createdOn: timestamp("created_on", { mode: 'string' }),
	scheduleDate: timestamp("schedule_date", { mode: 'string' }).notNull(),
	executionStart: timestamp("execution_start", { mode: 'string' }),
	executionEnd: timestamp("execution_end", { mode: 'string' }),
	emailsSent: text("emails_sent"),
	filters: jsonb(),
	errorMessage: text("error_message"),
	reportFilterStartDate: varchar("report_filter_start_date", { length: 255 }),
	reportFilterEndDateTime: varchar("report_filter_end_date_time", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileId: bigint("file_id", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idReport],
			foreignColumns: [reports.id],
			name: "report_execution_id_report_fkey"
		}),
	foreignKey({
			columns: [table.idUser],
			foreignColumns: [users.id],
			name: "report_execution_id_user_fkey"
		}),
	foreignKey({
			columns: [table.idFile],
			foreignColumns: [file.id],
			name: "report_execution_id_file_fkey"
		}),
	foreignKey({
			columns: [table.status],
			foreignColumns: [reportExecutionStatus.code],
			name: "report_execution_status_fkey"
		}),
	foreignKey({
			columns: [table.fileId],
			foreignColumns: [file.id],
			name: "fk_report_execution_file"
		}),
]);

export const contacts = pgTable("contacts", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "contacts_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	name: varchar({ length: 255 }),
	idDocument: varchar("id_document", { length: 20 }),
	email: varchar({ length: 255 }),
	areaCode: varchar("area_code", { length: 5 }),
	number: varchar({ length: 20 }),
	phoneType: char("phone_type", { length: 1 }),
	birthDate: date("birth_date"),
	mothersName: varchar("mothers_name", { length: 255 }),
	isPartnerContact: boolean("is_partner_contact"),
	isPep: boolean("is_pep"),
	idMerchant: integer("id_merchant"),
	slugMerchant: varchar("slug_merchant", { length: 50 }),
	idAddress: integer("id_address"),
	icNumber: varchar("ic_number", { length: 50 }),
	icDateIssuance: date("ic_date_issuance"),
	icDispatcher: varchar("ic_dispatcher", { length: 10 }),
	icFederativeUnit: varchar("ic_federative_unit", { length: 5 }),
}, (table) => [
	foreignKey({
			columns: [table.idAddress],
			foreignColumns: [addresses.id],
			name: "contacts_id_address_fkey"
		}),
	foreignKey({
			columns: [table.idMerchant],
			foreignColumns: [merchants.id],
			name: "contacts_id_merchant_fkey"
		}),
]);

export const paymentLink = pgTable("payment_link", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "payment_link_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }),
	dtupdate: timestamp({ mode: 'string' }),
	linkName: varchar("link_name", { length: 255 }),
	dtExpiration: timestamp("dt_expiration", { mode: 'string' }),
	totalAmount: numeric("total_amount"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idMerchant: bigint("id_merchant", { mode: "number" }),
	paymentLinkStatus: varchar("payment_link_status", { length: 50 }),
	productType: varchar("product_type", { length: 50 }),
	installments: integer(),
	linkUrl: varchar("link_url", { length: 255 }),
	pixEnabled: boolean("pix_enabled"),
	transactionSlug: varchar("transaction_slug", { length: 50 }),
	isFromServer: boolean("is_from_server"),
	modified: boolean(),
	isDeleted: boolean("is_deleted"),
}, (table) => [
	foreignKey({
			columns: [table.idMerchant],
			foreignColumns: [merchants.id],
			name: "payment_link_id_merchant_fkey"
		}),
]);

export const merchantSettlements = pgTable("merchant_settlements", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "merchantsettlements_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }),
	dtupdate: timestamp({ mode: 'string' }),
	transactionCount: integer("transaction_count"),
	adjustmentCount: integer("adjustment_count"),
	batchAmount: numeric("batch_amount", { precision: 18, scale:  2 }),
	netSettlementAmount: numeric("net_settlement_amount", { precision: 18, scale:  2 }),
	pixAmount: numeric("pix_amount", { precision: 18, scale:  2 }),
	pixNetAmount: numeric("pix_net_amount", { precision: 18, scale:  2 }),
	pixFeeAmount: numeric("pix_fee_amount", { precision: 18, scale:  2 }),
	pixCostAmount: numeric("pix_cost_amount", { precision: 18, scale:  2 }),
	creditAdjustmentAmount: numeric("credit_adjustment_amount", { precision: 18, scale:  2 }),
	debitAdjustmentAmount: numeric("debit_adjustment_amount", { precision: 18, scale:  2 }),
	totalAnticipationAmount: numeric("total_anticipation_amount", { precision: 18, scale:  2 }),
	totalRestitutionAmount: numeric("total_restitution_amount", { precision: 18, scale:  2 }),
	pendingRestitutionAmount: numeric("pending_restitution_amount", { precision: 18, scale:  2 }),
	totalSettlementAmount: numeric("total_settlement_amount", { precision: 18, scale:  2 }),
	pendingFinancialAdjustmentAmount: numeric("pending_financial_adjustment_amount", { precision: 18, scale:  2 }),
	creditFinancialAdjustmentAmount: numeric("credit_financial_adjustment_amount", { precision: 18, scale:  2 }),
	debitFinancialAdjustmentAmount: numeric("debit_financial_adjustment_amount", { precision: 18, scale:  2 }),
	status: varchar({ length: 50 }),
	slugMerchant: varchar("slug_merchant", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idMerchant: bigint("id_merchant", { mode: "number" }),
	slugCustomer: varchar("slug_customer", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idCustomer: bigint("id_customer", { mode: "number" }),
	outstandingAmount: numeric("outstanding_amount", { precision: 18, scale:  2 }),
	restRoundingAmount: numeric("rest_rounding_amount", { precision: 18, scale:  2 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idSettlement: bigint("id_settlement", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idMerchant],
			foreignColumns: [merchants.id],
			name: "merchantsettlements_id_merchant_fkey"
		}),
	foreignKey({
			columns: [table.idCustomer],
			foreignColumns: [customers.id],
			name: "merchantsettlements_id_customer_fkey"
		}),
	foreignKey({
			columns: [table.idSettlement],
			foreignColumns: [settlements.id],
			name: "merchantsettlements_id_settlement_fkey"
		}),
]);

export const payout = pgTable("payout", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "payout_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	payoutId: varchar("payout_id", { length: 50 }),
	slugMerchant: varchar("slug_merchant", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idMerchant: bigint("id_merchant", { mode: "number" }),
	rrn: varchar({ length: 50 }),
	transactionDate: timestamp("transaction_date", { mode: 'string' }),
	productType: varchar("product_type", { length: 50 }),
	type: varchar({ length: 50 }),
	brand: varchar({ length: 50 }),
	installmentNumber: integer("installment_number"),
	installments: integer(),
	installmentAmount: numeric("installment_amount"),
	transactionMdr: numeric("transaction_mdr"),
	transactionMdrFee: numeric("transaction_mdr_fee"),
	transactionFee: numeric("transaction_fee"),
	settlementAmount: numeric("settlement_amount"),
	expectedSettlementDate: timestamp("expected_settlement_date", { mode: 'string' }),
	status: varchar({ length: 50 }),
	receivableAmount: numeric("receivable_amount"),
	settlementDate: timestamp("settlement_date", { mode: 'string' }),
	slugCustomer: varchar("slug_customer", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idCustomer: bigint("id_customer", { mode: "number" }),
	effectivePaymentDate: timestamp("effective_payment_date", { mode: 'string' }),
	settlementUniqueNumber: varchar("settlement_unique_number", { length: 50 }),
	anticipationAmount: numeric("anticipation_amount"),
	anticipationBlockStatus: varchar("anticipation_block_status", { length: 50 }),
	slugMerchantSplit: varchar("slug_merchant_split", { length: 50 }),
}, (table) => [
	foreignKey({
			columns: [table.idMerchant],
			foreignColumns: [merchants.id],
			name: "payout_id_merchant_fkey"
		}),
	foreignKey({
			columns: [table.idCustomer],
			foreignColumns: [customers.id],
			name: "payout_id_customer_fkey"
		}),
]);

export const cronJobMonitoring = pgTable("cron_job_monitoring", {
	id: serial().primaryKey().notNull(),
	jobName: varchar("job_name", { length: 100 }).notNull(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }),
	status: varchar({ length: 20 }).notNull(),
	logMessage: text("log_message"),
	errorMessage: text("error_message"),
	lastSync: date("last_sync"),
});

export const merchantfile = pgTable("merchantfile", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "fl_merchantfile_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idMerchant: bigint("id_merchant", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idFile: bigint("id_file", { mode: "number" }),
	active: boolean().default(true),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	extension: varchar({ length: 10 }),
}, (table) => [
	foreignKey({
			columns: [table.idMerchant],
			foreignColumns: [merchants.id],
			name: "fl_merchantfile_id_merchant_fkey"
		}),
	foreignKey({
			columns: [table.idFile],
			foreignColumns: [file.id],
			name: "fl_merchantfile_id_file_fkey"
		}),
]);

export const userMerchants = pgTable("user_merchants", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "user_merchants_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	active: boolean().default(true),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idMerchant: bigint("id_merchant", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idUser: bigint("id_user", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idMerchant],
			foreignColumns: [merchants.id],
			name: "user_merchants_id_merchant_fkey"
		}),
	foreignKey({
			columns: [table.idUser],
			foreignColumns: [users.id],
			name: "user_merchants_id_user_fkey"
		}),
]);

export const payoutAntecipations = pgTable("payout_antecipations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "payout_antecipations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	payoutId: varchar("payout_id", { length: 50 }),
	slugMerchant: varchar("slug_merchant", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idMerchants: bigint("id_merchants", { mode: "number" }),
	rrn: varchar({ length: 30 }),
	transactionDate: timestamp("transaction_date", { mode: 'string' }),
	type: varchar({ length: 30 }),
	brand: varchar({ length: 30 }),
	installmentNumber: integer("installment_number"),
	installments: integer(),
	installmentAmount: numeric("installment_amount"),
	transactionMdr: numeric("transaction_mdr"),
	transactionMdrFee: numeric("transaction_mdr_fee"),
	transactionFee: numeric("transaction_fee"),
	settlementAmount: numeric("settlement_amount"),
	expectedSettlementDate: date("expected_settlement_date"),
	anticipatedAmount: numeric("anticipated_amount"),
	anticipationSettlementAmount: numeric("anticipation_settlement_amount"),
	status: varchar({ length: 30 }),
	anticipationDayNumber: integer("anticipation_day_number"),
	anticipationFee: numeric("anticipation_fee"),
	anticipationMonthFee: numeric("anticipation_month_fee"),
	netAmount: numeric("net_amount"),
	anticipationCode: varchar("anticipation_code", { length: 30 }),
	totalAnticipatedAmount: numeric("total_anticipated_amount"),
	settlementDate: date("settlement_date"),
	effectivePaymentDate: date("effective_payment_date"),
	settlementUniqueNumber: varchar("settlement_unique_number", { length: 50 }),
	slugCustomer: varchar("slug_customer", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idCustomer: bigint("id_customer", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idMerchants],
			foreignColumns: [merchants.id],
			name: "payout_antecipations_id_merchants_fkey"
		}),
	foreignKey({
			columns: [table.idCustomer],
			foreignColumns: [customers.id],
			name: "payout_antecipations_id_customer_fkey"
		}),
]);

export const merchantSettlementOrders = pgTable("merchant_settlement_orders", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "merchant_settlement_orders_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }),
	dtupdate: timestamp({ mode: 'string' }),
	compeCode: varchar("compe_code", { length: 10 }),
	accountNumber: varchar("account_number", { length: 20 }),
	accountNumberCheckDigit: varchar("account_number_check_digit", { length: 5 }),
	slugPaymentInstitution: varchar("slug_payment_institution", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idPaymentInstitution: bigint("id_payment_institution", { mode: "number" }),
	bankBranchNumber: varchar("bank_branch_number", { length: 10 }),
	accountType: varchar("account_type", { length: 20 }),
	integrationType: varchar("integration_type", { length: 20 }),
	brand: varchar({ length: 50 }),
	productType: varchar("product_type", { length: 50 }),
	amount: numeric(),
	anticipationAmount: numeric("anticipation_amount"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idMerchantSettlements: bigint("id_merchant_settlements", { mode: "number" }),
	outstandingAmount: numeric("outstanding_amount"),
	restRoundingAmount: numeric("rest_rounding_amount"),
	merchantSettlementOrderStatus: varchar("merchant_settlement_order_status", { length: 50 }),
	orderTransactionId: varchar("order_transaction_id", { length: 50 }),
	settlementUniqueNumber: varchar("settlement_unique_number", { length: 50 }),
	protocolGuidId: varchar("protocol_guid_id", { length: 50 }),
	legalPerson: varchar("legal_person", { length: 20 }),
	documentId: varchar("document_id", { length: 20 }),
	corporateName: varchar("corporate_name", { length: 150 }),
	effectivePaymentDate: timestamp("effective_payment_date", { mode: 'string' }),
	lock: boolean(),
}, (table) => [
	foreignKey({
			columns: [table.idPaymentInstitution],
			foreignColumns: [paymentInstitution.id],
			name: "merchant_settlement_orders_id_payment_institution_fkey"
		}),
	foreignKey({
			columns: [table.idMerchantSettlements],
			foreignColumns: [merchantSettlements.id],
			name: "merchant_settlement_orders_id_merchant_settlements_fkey"
		}),
]);

export const merchantBankAccounts = pgTable("merchant_bank_accounts", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "merchant_bank_accounts_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	documentId: varchar("document_id", { length: 14 }).notNull(),
	corporateName: varchar("corporate_name", { length: 200 }).notNull(),
	legalPerson: varchar("legal_person", { length: 20 }).notNull(),
	bankBranchNumber: varchar("bank_branch_number", { length: 4 }).notNull(),
	bankBranchCheckDigit: varchar("bank_branch_check_digit", { length: 2 }),
	accountNumber: varchar("account_number", { length: 15 }).notNull(),
	accountNumberCheckDigit: varchar("account_number_check_digit", { length: 2 }),
	accountType: varchar("account_type", { length: 20 }).notNull(),
	compeCode: varchar("compe_code", { length: 3 }).notNull(),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	slug: varchar({ length: 50 }),
	active: boolean().default(true),
});

export const solicitationFeeBrand = pgTable("solicitation_fee_brand", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "solicitation_fee_brand_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	brand: varchar({ length: 100 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	solicitationFeeId: bigint("solicitation_fee_id", { mode: "number" }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	idGroup: integer("id_group"),
}, (table) => [
	foreignKey({
			columns: [table.solicitationFeeId],
			foreignColumns: [solicitationFee.id],
			name: "solicitation_fee_brand_solicitation_fee_id_fkey"
		}).onDelete("cascade"),
]);

export const solicitationFeeDocument = pgTable("solicitation_fee_document", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "solicitation_fee_document_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idFile: bigint("id_file", { mode: "number" }),
	type: varchar({ length: 20 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	solicitationFeeId: bigint("solicitation_fee_id", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idFile],
			foreignColumns: [file.id],
			name: "solicitation_fee_document_id_file_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.solicitationFeeId],
			foreignColumns: [solicitationFee.id],
			name: "solicitation_fee_document_solicitation_fee_id_fkey"
		}).onDelete("cascade"),
]);

export const solicitationBrandProductType = pgTable("solicitation_brand_product_type", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "solicitation_brand_product_type_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	solicitationFeeBrandId: bigint("solicitation_fee_brand_id", { mode: "number" }),
	productType: varchar("product_type", { length: 100 }),
	fee: numeric(),
	feeAdmin: numeric("fee_admin"),
	feeDock: numeric("fee_dock"),
	transactionFeeStart: integer("transaction_fee_start"),
	transactionFeeEnd: integer("transaction_fee_end"),
	transactionAnticipationMdr: numeric("transaction_anticipation_mdr"),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	noCardFee: numeric("no_card_fee"),
	noCardFeeAdmin: numeric("no_card_fee_admin"),
	noCardFeeDock: numeric("no_card_fee_dock"),
	noCardTransactionAnticipationMdr: numeric("no_card_transaction_anticipation_mdr"),
}, (table) => [
	foreignKey({
			columns: [table.solicitationFeeBrandId],
			foreignColumns: [solicitationFeeBrand.id],
			name: "solicitation_brand_product_type_solicitation_fee_brand_id_fkey"
		}).onDelete("cascade"),
]);

export const feeBrandProductType = pgTable("fee_brand_product_type", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "fee_brand_product_type_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	installmentTransactionFeeStart: integer("installment_transaction_fee_start"),
	installmentTransactionFeeEnd: integer("installment_transaction_fee_end"),
	cardTransactionFee: integer("card_transaction_fee"),
	cardTransactionMdr: numeric("card_transaction_mdr"),
	nonCardTransactionFee: integer("non_card_transaction_fee"),
	nonCardTransactionMdr: numeric("non_card_transaction_mdr"),
	producttype: varchar({ length: 20 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idFeeBrand: bigint("id_fee_brand", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idFeeBrand],
			foreignColumns: [feeBrand.id],
			name: "fee_brand_product_type_id_fee_brand_fkey"
		}).onDelete("cascade"),
]);

export const solicitationFee = pgTable("solicitation_fee", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "solicitation_fee_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	cnae: varchar({ length: 20 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idCustomers: bigint("id_customers", { mode: "number" }),
	mcc: varchar({ length: 20 }),
	cnpjQuantity: integer("cnpj_quantity"),
	monthlyPosFee: numeric("monthly_pos_fee"),
	averageTicket: numeric("average_ticket"),
	description: varchar({ length: 1000 }),
	cnaeInUse: boolean("cnae_in_use"),
	status: varchar({ length: 50 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	cardPixMdr: numeric("card_pix_mdr"),
	cardPixCeilingFee: numeric("card_pix_ceiling_fee"),
	cardPixMinimumCostFee: numeric("card_pix_minimum_cost_fee"),
	nonCardPixMdr: numeric("non_card_pix_mdr"),
	nonCardPixCeilingFee: numeric("non_card_pix_ceiling_fee"),
	nonCardPixMinimumCostFee: numeric("non_card_pix_minimum_cost_fee"),
	compulsoryAnticipationConfig: integer("compulsory_anticipation_config"),
	eventualAnticipationFee: numeric("eventual_anticipation_fee"),
	nonCardEventualAnticipationFee: numeric("non_card_eventual_anticipation_fee"),
	cardPixMdrAdmin: numeric("card_pix_mdr_admin"),
	cardPixCeilingFeeAdmin: numeric("card_pix_ceiling_fee_admin"),
	cardPixMinimumCostFeeAdmin: numeric("card_pix_minimum_cost_fee_admin"),
	nonCardPixMdrAdmin: numeric("non_card_pix_mdr_admin"),
	nonCardPixCeilingFeeAdmin: numeric("non_card_pix_ceiling_fee_admin"),
	nonCardPixMinimumCostFeeAdmin: numeric("non_card_pix_minimum_cost_fee_admin"),
	compulsoryAnticipationConfigAdmin: integer("compulsory_anticipation_config_admin"),
	eventualAnticipationFeeAdmin: numeric("eventual_anticipation_fee_admin"),
	nonCardEventualAnticipationFeeAdmin: numeric("non_card_eventual_anticipation_fee_admin"),
	cardPixMdrDock: numeric("card_pix_mdr_dock"),
	cardPixCeilingFeeDock: numeric("card_pix_ceiling_fee_dock"),
	cardPixMinimumCostFeeDock: numeric("card_pix_minimum_cost_fee_dock"),
	nonCardPixMdrDock: numeric("non_card_pix_mdr_dock"),
	nonCardPixCeilingFeeDock: numeric("non_card_pix_ceiling_fee_dock"),
	nonCardPixMinimumCostFeeDock: numeric("non_card_pix_minimum_cost_fee_dock"),
	compulsoryAnticipationConfigDock: integer("compulsory_anticipation_config_dock"),
	eventualAnticipationFeeDock: numeric("eventual_anticipation_fee_dock"),
	nonCardEventualAnticipationFeeDock: numeric("non_card_eventual_anticipation_fee_dock"),
}, (table) => [
	foreignKey({
			columns: [table.idCustomers],
			foreignColumns: [customers.id],
			name: "solicitation_fee_id_customers_fkey"
		}).onDelete("cascade"),
]);

export const feeBrand = pgTable("fee_brand", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "fee_brand_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	brand: varchar({ length: 25 }),
	idGroup: integer("id_group"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idFee: bigint("id_fee", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idFee],
			foreignColumns: [fee.id],
			name: "fee_brand_id_fee_fkey"
		}).onDelete("cascade"),
]);

export const feeCredit = pgTable("fee_credit", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "fee_credit_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	installmentNumber: integer("installment_number").notNull(),
	compulsoryAnticipation: numeric("compulsory_anticipation", { precision: 10, scale:  2 }),
	noCardCompulsoryAnticipation: numeric("no_card_compulsory_anticipation", { precision: 10, scale:  2 }),
	fee: numeric({ precision: 10, scale:  2 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idFeeBrandProductType: bigint("id_fee_brand_product_type", { mode: "number" }),
	noFee: numeric("no_fee", { precision: 10, scale:  2 }),
}, (table) => [
	foreignKey({
			columns: [table.idFeeBrandProductType],
			foreignColumns: [feeBrandProductType.id],
			name: "fee_credit_id_fee_brand_product_type_fkey"
		}).onDelete("cascade"),
]);

export const financialAdjustments = pgTable("financial_adjustments", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "financial_adjustments_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	externalId: integer("external_id"),
	slug: varchar({ length: 50 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	active: boolean(),
	expectedSettlementDate: date("expected_settlement_date"),
	reason: varchar({ length: 30 }),
	title: varchar({ length: 30 }),
	description: varchar({ length: 1000 }),
	rrn: varchar({ length: 50 }),
	grossValue: numeric("gross_value"),
	recurrence: varchar({ length: 20 }),
	type: varchar({ length: 20 }),
	startDate: date("start_date"),
	endDate: date("end_date"),
});

export const fee = pgTable("fee", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "fee_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	active: boolean(),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	name: varchar({ length: 255 }),
	tableType: varchar("table_type", { length: 20 }),
	compulsoryAnticipationConfig: integer("compulsory_anticipation_config"),
	eventualAnticipationFee: numeric("eventual_anticipation_fee"),
	anticipationType: varchar("anticipation_type", { length: 25 }),
	cardPixMdr: numeric("card_pix_mdr"),
	cardPixCeilingFee: numeric("card_pix_ceiling_fee"),
	cardPixMinimumCostFee: numeric("card_pix_minimum_cost_fee"),
	nonCardPixMdr: numeric("non_card_pix_mdr"),
	nonCardPixCeilingFee: numeric("non_card_pix_ceiling_fee"),
	nonCardPixMinimumCostFee: numeric("non_card_pix_minimum_cost_fee"),
	code: varchar({ length: 50 }),
	cnae: varchar({ length: 20 }),
	mcc: varchar({ length: 20 }),
});

export const financialAdjustmentMerchants = pgTable("financial_adjustment_merchants", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "financial_adjustment_merchants_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	active: boolean(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idFinancialAdjustment: bigint("id_financial_adjustment", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idMerchant: bigint("id_merchant", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.idFinancialAdjustment],
			foreignColumns: [financialAdjustments.id],
			name: "financial_adjustment_merchants_id_financial_adjustment_fkey"
		}),
	foreignKey({
			columns: [table.idMerchant],
			foreignColumns: [merchants.id],
			name: "financial_adjustment_merchants_id_merchant_fkey"
		}),
]);

export const userNotifications = pgTable("user_notifications", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "user_notifications_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	slug: varchar({ length: 50 }),
	dtinsert: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	dtupdate: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	active: boolean(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idUser: bigint("id_user", { mode: "number" }),
	title: varchar({ length: 200 }),
	message: text(),
	type: varchar({ length: 50 }),
	link: varchar({ length: 500 }),
	isRead: boolean("is_read").default(false),
}, (table) => [
	foreignKey({
			columns: [table.idUser],
			foreignColumns: [users.id],
			name: "user_notifications_id_user_fkey"
		}),
]);

export const customerCustomization = pgTable("customer_customization", {
	slug: text().notNull(),
	name: varchar({ length: 100 }).notNull(),
	primaryColor: varchar("primary_color", { length: 100 }),
	secondaryColor: varchar("secondary_color", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	imageUrl: varchar("image_url", { length: 100 }),
	loginImageUrl: varchar("login_image_url", { length: 100 }),
	faviconUrl: varchar("favicon_url", { length: 100 }),
	emailImageUrl: varchar("email_image_url", { length: 100 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customerId: bigint("customer_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).generatedAlwaysAsIdentity({ name: "tenants_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileId: bigint("file_id", { mode: "number" }),
	loginImageFileId: bigint("login_image_file_id", { mode: "number" }),
	faviconFileId: bigint("favicon_file_id", { mode: "number" }),
	emailImageFileId: bigint("email_image_file_id", { mode: "number" }),
}, (table) => [
	unique("tenants_slug_key").on(table.slug),
]);


export const cnaes = pgTable("cnaes", {
  id: uuid().primaryKey().defaultRandom(),
  codigo: varchar({ length: 10 }).notNull().unique(),
  descricao: text().notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  unique("cnaes_codigo_key").on(table.codigo),
]);

export const fornecedores = pgTable("fornecedores", {
  id: uuid().primaryKey().defaultRandom(),
  nome: varchar({ length: 255 }).notNull(),
  cnpj: varchar({ length: 18 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull(),
  telefone: varchar({ length: 20 }),
  endereco: text(),
  cidade: varchar({ length: 100 }),
  estado: varchar({ length: 2 }),
  cep: varchar({ length: 10 }),
  cnaecodigo: varchar("cnae_codigo", { length: 10 }),
  ativo: boolean().default(true),
  createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  unique("fornecedores_cnpj_key").on(table.cnpj),
  foreignKey({
    columns: [table.cnaecodigo],
    foreignColumns: [cnaes.codigo],
    name: "fk_fornecedor_cnae"
  }),
]);

export const fornecedorDocuments = pgTable("fornecedor_documents", {
  id: uuid().primaryKey().defaultRandom(),
  fornecedorId: uuid("fornecedor_id").notNull(),
  nome: varchar({ length: 255 }).notNull(),
  tipo: varchar({ length: 100 }).notNull(),
  url: text().notNull(),
  size: integer().default(0),
  uploadedAt: timestamp("uploaded_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  foreignKey({
    columns: [table.fornecedorId],
    foreignColumns: [fornecedores.id],
    name: "fk_document_fornecedor"
  }).onDelete("cascade"),
]);

export type InsertCnae = typeof cnaes.$inferInsert;
export type SelectCnae = typeof cnaes.$inferSelect;

// Tipo para inserção de Fornecedor
export type InsertFornecedor = typeof fornecedores.$inferInsert;
export type SelectFornecedor = typeof fornecedores.$inferSelect;

// Tipo para inserção de Documento
export type InsertFornecedorDocument = typeof fornecedorDocuments.$inferInsert;
export type SelectFornecedorDocument = typeof fornecedorDocuments.$inferSelect;
