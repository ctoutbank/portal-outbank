import { relations } from "drizzle-orm/relations";
import { customers, paymentInstitution, users, salesAgents, settlements, reports, reportFilters, reportFiltersParam, merchantPixSettlementOrders, merchants, merchantSettlements, profiles, profileFunctions, functions, paymentLink, shoppingItems, merchantPriceGroup, merchantTransactionPrice, modules, moduleFunctions, merchantPrice, categories, legalNatures, configurations, addresses, merchantBankAccounts, solicitationFee, customerFunctions, merchantpixaccount, reportExecution, file, reportExecutionStatus, contacts, payout, merchantfile, userMerchants, payoutAntecipations, merchantSettlementOrders, solicitationFeeBrand, solicitationFeeDocument, solicitationBrandProductType, feeBrand, feeBrandProductType, fee, feeCredit, financialAdjustments, financialAdjustmentMerchants, userNotifications } from "./schema";

export const paymentInstitutionRelations = relations(paymentInstitution, ({one, many}) => ({
	customer: one(customers, {
		fields: [paymentInstitution.idCustomerDb],
		references: [customers.id]
	}),
	merchantSettlementOrders: many(merchantSettlementOrders),
}));

export const customersRelations = relations(customers, ({one, many}) => ({
	paymentInstitutions: many(paymentInstitution),
	settlements: many(settlements),
	customer: one(customers, {
		fields: [customers.idParent],
		references: [customers.id],
		relationName: "customers_idParent_customers_id"
	}),
	customers: many(customers, {
		relationName: "customers_idParent_customers_id"
	}),
	merchantPixSettlementOrders: many(merchantPixSettlementOrders),
	merchants: many(merchants),
	customerFunctions: many(customerFunctions),
	users: many(users),
	merchantSettlements: many(merchantSettlements),
	payouts: many(payout),
	payoutAntecipations: many(payoutAntecipations),
	solicitationFees: many(solicitationFee),
}));

export const salesAgentsRelations = relations(salesAgents, ({one, many}) => ({
	user: one(users, {
		fields: [salesAgents.idUsers],
		references: [users.id]
	}),
	merchants: many(merchants),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	salesAgents: many(salesAgents),
	customer: one(customers, {
		fields: [users.idCustomer],
		references: [customers.id]
	}),
	profile: one(profiles, {
		fields: [users.idProfile],
		references: [profiles.id]
	}),
	address: one(addresses, {
		fields: [users.idAddress],
		references: [addresses.id]
	}),
	reportExecutions: many(reportExecution),
	userMerchants: many(userMerchants),
	userNotifications: many(userNotifications),
}));

export const settlementsRelations = relations(settlements, ({one, many}) => ({
	customer: one(customers, {
		fields: [settlements.idCustomer],
		references: [customers.id]
	}),
	merchantSettlements: many(merchantSettlements),
}));

export const reportFiltersRelations = relations(reportFilters, ({one}) => ({
	report: one(reports, {
		fields: [reportFilters.idReport],
		references: [reports.id]
	}),
	reportFiltersParam: one(reportFiltersParam, {
		fields: [reportFilters.idReportFilterParam],
		references: [reportFiltersParam.id]
	}),
}));

export const reportsRelations = relations(reports, ({many}) => ({
	reportFilters: many(reportFilters),
	reportExecutions: many(reportExecution),
}));

export const reportFiltersParamRelations = relations(reportFiltersParam, ({many}) => ({
	reportFilters: many(reportFilters),
}));

export const merchantPixSettlementOrdersRelations = relations(merchantPixSettlementOrders, ({one}) => ({
	customer: one(customers, {
		fields: [merchantPixSettlementOrders.idCustomer],
		references: [customers.id]
	}),
	merchant: one(merchants, {
		fields: [merchantPixSettlementOrders.idMerchant],
		references: [merchants.id]
	}),
	merchantSettlement: one(merchantSettlements, {
		fields: [merchantPixSettlementOrders.idMerchantSettlement],
		references: [merchantSettlements.id]
	}),
}));

export const merchantsRelations = relations(merchants, ({one, many}) => ({
	merchantPixSettlementOrders: many(merchantPixSettlementOrders),
	category: one(categories, {
		fields: [merchants.idCategory],
		references: [categories.id]
	}),
	legalNature: one(legalNatures, {
		fields: [merchants.idLegalNature],
		references: [legalNatures.id]
	}),
	salesAgent: one(salesAgents, {
		fields: [merchants.idSalesAgent],
		references: [salesAgents.id]
	}),
	configuration: one(configurations, {
		fields: [merchants.idConfiguration],
		references: [configurations.id]
	}),
	address: one(addresses, {
		fields: [merchants.idAddress],
		references: [addresses.id]
	}),
	merchantPrice: one(merchantPrice, {
		fields: [merchants.idMerchantPrice],
		references: [merchantPrice.id]
	}),
	customer: one(customers, {
		fields: [merchants.idCustomer],
		references: [customers.id]
	}),
	merchantBankAccount: one(merchantBankAccounts, {
		fields: [merchants.idMerchantBankAccount],
		references: [merchantBankAccounts.id]
	}),
	merchantpixaccounts: many(merchantpixaccount),
	contacts: many(contacts),
	paymentLinks: many(paymentLink),
	merchantSettlements: many(merchantSettlements),
	payouts: many(payout),
	merchantfiles: many(merchantfile),
	userMerchants: many(userMerchants),
	payoutAntecipations: many(payoutAntecipations),
	financialAdjustmentMerchants: many(financialAdjustmentMerchants),
}));

export const merchantSettlementsRelations = relations(merchantSettlements, ({one, many}) => ({
	merchantPixSettlementOrders: many(merchantPixSettlementOrders),
	merchant: one(merchants, {
		fields: [merchantSettlements.idMerchant],
		references: [merchants.id]
	}),
	customer: one(customers, {
		fields: [merchantSettlements.idCustomer],
		references: [customers.id]
	}),
	settlement: one(settlements, {
		fields: [merchantSettlements.idSettlement],
		references: [settlements.id]
	}),
	merchantSettlementOrders: many(merchantSettlementOrders),
}));

export const profileFunctionsRelations = relations(profileFunctions, ({one}) => ({
	profile: one(profiles, {
		fields: [profileFunctions.idProfile],
		references: [profiles.id]
	}),
	function: one(functions, {
		fields: [profileFunctions.idFunctions],
		references: [functions.id]
	}),
}));

export const profilesRelations = relations(profiles, ({many}) => ({
	profileFunctions: many(profileFunctions),
	users: many(users),
}));

export const functionsRelations = relations(functions, ({many}) => ({
	profileFunctions: many(profileFunctions),
	moduleFunctions: many(moduleFunctions),
	customerFunctions: many(customerFunctions),
}));

export const shoppingItemsRelations = relations(shoppingItems, ({one}) => ({
	paymentLink: one(paymentLink, {
		fields: [shoppingItems.idPaymentLink],
		references: [paymentLink.id]
	}),
}));

export const paymentLinkRelations = relations(paymentLink, ({one, many}) => ({
	shoppingItems: many(shoppingItems),
	merchant: one(merchants, {
		fields: [paymentLink.idMerchant],
		references: [merchants.id]
	}),
}));

export const merchantTransactionPriceRelations = relations(merchantTransactionPrice, ({one}) => ({
	merchantPriceGroup: one(merchantPriceGroup, {
		fields: [merchantTransactionPrice.idMerchantPriceGroup],
		references: [merchantPriceGroup.id]
	}),
}));

export const merchantPriceGroupRelations = relations(merchantPriceGroup, ({one, many}) => ({
	merchantTransactionPrices: many(merchantTransactionPrice),
	merchantPrice: one(merchantPrice, {
		fields: [merchantPriceGroup.idMerchantPrice],
		references: [merchantPrice.id]
	}),
}));

export const moduleFunctionsRelations = relations(moduleFunctions, ({one}) => ({
	module: one(modules, {
		fields: [moduleFunctions.idModule],
		references: [modules.id]
	}),
	function: one(functions, {
		fields: [moduleFunctions.idFunction],
		references: [functions.id]
	}),
}));

export const modulesRelations = relations(modules, ({many}) => ({
	moduleFunctions: many(moduleFunctions),
}));

export const merchantPriceRelations = relations(merchantPrice, ({many}) => ({
	merchantPriceGroups: many(merchantPriceGroup),
	merchants: many(merchants),
}));

export const categoriesRelations = relations(categories, ({one, many}) => ({
	merchants: many(merchants),
	solicitationFee: one(solicitationFee, {
		fields: [categories.idSolicitationFee],
		references: [solicitationFee.id]
	}),
}));

export const legalNaturesRelations = relations(legalNatures, ({many}) => ({
	merchants: many(merchants),
}));

export const configurationsRelations = relations(configurations, ({many}) => ({
	merchants: many(merchants),
}));

export const addressesRelations = relations(addresses, ({many}) => ({
	merchants: many(merchants),
	users: many(users),
	contacts: many(contacts),
}));

export const merchantBankAccountsRelations = relations(merchantBankAccounts, ({many}) => ({
	merchants: many(merchants),
}));

export const solicitationFeeRelations = relations(solicitationFee, ({one, many}) => ({
	categories: many(categories),
	solicitationFeeBrands: many(solicitationFeeBrand),
	solicitationFeeDocuments: many(solicitationFeeDocument),
	customer: one(customers, {
		fields: [solicitationFee.idCustomers],
		references: [customers.id]
	}),
}));

export const customerFunctionsRelations = relations(customerFunctions, ({one}) => ({
	customer: one(customers, {
		fields: [customerFunctions.idCustomer],
		references: [customers.id]
	}),
	function: one(functions, {
		fields: [customerFunctions.idFunctions],
		references: [functions.id]
	}),
}));

export const merchantpixaccountRelations = relations(merchantpixaccount, ({one}) => ({
	merchant: one(merchants, {
		fields: [merchantpixaccount.idMerchant],
		references: [merchants.id]
	}),
}));

export const reportExecutionRelations = relations(reportExecution, ({one}) => ({
	report: one(reports, {
		fields: [reportExecution.idReport],
		references: [reports.id]
	}),
	user: one(users, {
		fields: [reportExecution.idUser],
		references: [users.id]
	}),
	file_idFile: one(file, {
		fields: [reportExecution.idFile],
		references: [file.id],
		relationName: "reportExecution_idFile_file_id"
	}),
	reportExecutionStatus: one(reportExecutionStatus, {
		fields: [reportExecution.status],
		references: [reportExecutionStatus.code]
	}),
	file_fileId: one(file, {
		fields: [reportExecution.fileId],
		references: [file.id],
		relationName: "reportExecution_fileId_file_id"
	}),
}));

export const fileRelations = relations(file, ({many}) => ({
	reportExecutions_idFile: many(reportExecution, {
		relationName: "reportExecution_idFile_file_id"
	}),
	reportExecutions_fileId: many(reportExecution, {
		relationName: "reportExecution_fileId_file_id"
	}),
	merchantfiles: many(merchantfile),
	solicitationFeeDocuments: many(solicitationFeeDocument),
}));

export const reportExecutionStatusRelations = relations(reportExecutionStatus, ({many}) => ({
	reportExecutions: many(reportExecution),
}));

export const contactsRelations = relations(contacts, ({one}) => ({
	address: one(addresses, {
		fields: [contacts.idAddress],
		references: [addresses.id]
	}),
	merchant: one(merchants, {
		fields: [contacts.idMerchant],
		references: [merchants.id]
	}),
}));

export const payoutRelations = relations(payout, ({one}) => ({
	merchant: one(merchants, {
		fields: [payout.idMerchant],
		references: [merchants.id]
	}),
	customer: one(customers, {
		fields: [payout.idCustomer],
		references: [customers.id]
	}),
}));

export const merchantfileRelations = relations(merchantfile, ({one}) => ({
	merchant: one(merchants, {
		fields: [merchantfile.idMerchant],
		references: [merchants.id]
	}),
	file: one(file, {
		fields: [merchantfile.idFile],
		references: [file.id]
	}),
}));

export const userMerchantsRelations = relations(userMerchants, ({one}) => ({
	merchant: one(merchants, {
		fields: [userMerchants.idMerchant],
		references: [merchants.id]
	}),
	user: one(users, {
		fields: [userMerchants.idUser],
		references: [users.id]
	}),
}));

export const payoutAntecipationsRelations = relations(payoutAntecipations, ({one}) => ({
	merchant: one(merchants, {
		fields: [payoutAntecipations.idMerchants],
		references: [merchants.id]
	}),
	customer: one(customers, {
		fields: [payoutAntecipations.idCustomer],
		references: [customers.id]
	}),
}));

export const merchantSettlementOrdersRelations = relations(merchantSettlementOrders, ({one}) => ({
	paymentInstitution: one(paymentInstitution, {
		fields: [merchantSettlementOrders.idPaymentInstitution],
		references: [paymentInstitution.id]
	}),
	merchantSettlement: one(merchantSettlements, {
		fields: [merchantSettlementOrders.idMerchantSettlements],
		references: [merchantSettlements.id]
	}),
}));

export const solicitationFeeBrandRelations = relations(solicitationFeeBrand, ({one, many}) => ({
	solicitationFee: one(solicitationFee, {
		fields: [solicitationFeeBrand.solicitationFeeId],
		references: [solicitationFee.id]
	}),
	solicitationBrandProductTypes: many(solicitationBrandProductType),
}));

export const solicitationFeeDocumentRelations = relations(solicitationFeeDocument, ({one}) => ({
	file: one(file, {
		fields: [solicitationFeeDocument.idFile],
		references: [file.id]
	}),
	solicitationFee: one(solicitationFee, {
		fields: [solicitationFeeDocument.solicitationFeeId],
		references: [solicitationFee.id]
	}),
}));

export const solicitationBrandProductTypeRelations = relations(solicitationBrandProductType, ({one}) => ({
	solicitationFeeBrand: one(solicitationFeeBrand, {
		fields: [solicitationBrandProductType.solicitationFeeBrandId],
		references: [solicitationFeeBrand.id]
	}),
}));

export const feeBrandProductTypeRelations = relations(feeBrandProductType, ({one, many}) => ({
	feeBrand: one(feeBrand, {
		fields: [feeBrandProductType.idFeeBrand],
		references: [feeBrand.id]
	}),
	feeCredits: many(feeCredit),
}));

export const feeBrandRelations = relations(feeBrand, ({one, many}) => ({
	feeBrandProductTypes: many(feeBrandProductType),
	fee: one(fee, {
		fields: [feeBrand.idFee],
		references: [fee.id]
	}),
}));

export const feeRelations = relations(fee, ({many}) => ({
	feeBrands: many(feeBrand),
}));

export const feeCreditRelations = relations(feeCredit, ({one}) => ({
	feeBrandProductType: one(feeBrandProductType, {
		fields: [feeCredit.idFeeBrandProductType],
		references: [feeBrandProductType.id]
	}),
}));

export const financialAdjustmentMerchantsRelations = relations(financialAdjustmentMerchants, ({one}) => ({
	financialAdjustment: one(financialAdjustments, {
		fields: [financialAdjustmentMerchants.idFinancialAdjustment],
		references: [financialAdjustments.id]
	}),
	merchant: one(merchants, {
		fields: [financialAdjustmentMerchants.idMerchant],
		references: [merchants.id]
	}),
}));

export const financialAdjustmentsRelations = relations(financialAdjustments, ({many}) => ({
	financialAdjustmentMerchants: many(financialAdjustmentMerchants),
}));

export const userNotificationsRelations = relations(userNotifications, ({one}) => ({
	user: one(users, {
		fields: [userNotifications.idUser],
		references: [users.id]
	}),
}));