import { relations } from "drizzle-orm/relations";
import { customers, settlements, paymentInstitution, paymentLink, shoppingItems, reports, reportFilters, reportFiltersParam, solicitationFee, solicitationFeeBrand, merchants, merchantfile, file, userMerchants, users, solicitationFeeDocument, fee, feeBrand, profiles, profileFunctions, functions, merchantPriceGroup, merchantTransactionPrice, payoutAntecipations, userNotifications, salesAgents, modules, moduleFunctions, categories, legalNatures, configurations, addresses, merchantPrice, merchantBankAccounts, solicitationBrandProductType, financialAdjustments, financialAdjustmentMerchants, feeBrandProductType, merchantpixaccount, feeCredit, merchantSettlementOrders, merchantSettlements, customerFunctions, payout, merchantPixSettlementOrders, customerCustomization, contacts, reportExecution, reportExecutionStatus } from "./schema";

export const settlementsRelations = relations(settlements, ({one, many}) => ({
	customer: one(customers, {
		fields: [settlements.idCustomer],
		references: [customers.id]
	}),
	merchantSettlements: many(merchantSettlements),
}));

export const customersRelations = relations(customers, ({one, many}) => ({
	settlements: many(settlements),
	customer: one(customers, {
		fields: [customers.idParent],
		references: [customers.id],
		relationName: "customers_idParent_customers_id"
	}),
	customers: many(customers, {
		relationName: "customers_idParent_customers_id"
	}),
	paymentInstitutions: many(paymentInstitution),
	payoutAntecipations: many(payoutAntecipations),
	merchants: many(merchants),
	users: many(users),
	customerFunctions: many(customerFunctions),
	solicitationFees: many(solicitationFee),
	payouts: many(payout),
	merchantSettlements: many(merchantSettlements),
	merchantPixSettlementOrders: many(merchantPixSettlementOrders),
	customerCustomizations: many(customerCustomization),
}));

export const paymentInstitutionRelations = relations(paymentInstitution, ({one, many}) => ({
	customer: one(customers, {
		fields: [paymentInstitution.idCustomerDb],
		references: [customers.id]
	}),
	merchantSettlementOrders: many(merchantSettlementOrders),
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

export const solicitationFeeBrandRelations = relations(solicitationFeeBrand, ({one, many}) => ({
	solicitationFee: one(solicitationFee, {
		fields: [solicitationFeeBrand.solicitationFeeId],
		references: [solicitationFee.id]
	}),
	solicitationBrandProductTypes: many(solicitationBrandProductType),
}));

export const solicitationFeeRelations = relations(solicitationFee, ({one, many}) => ({
	solicitationFeeBrands: many(solicitationFeeBrand),
	solicitationFeeDocuments: many(solicitationFeeDocument),
	customer: one(customers, {
		fields: [solicitationFee.idCustomers],
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

export const merchantsRelations = relations(merchants, ({one, many}) => ({
	merchantfiles: many(merchantfile),
	userMerchants: many(userMerchants),
	payoutAntecipations: many(payoutAntecipations),
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
	financialAdjustmentMerchants: many(financialAdjustmentMerchants),
	merchantpixaccounts: many(merchantpixaccount),
	payouts: many(payout),
	merchantSettlements: many(merchantSettlements),
	merchantPixSettlementOrders: many(merchantPixSettlementOrders),
	contacts: many(contacts),
	paymentLinks: many(paymentLink),
}));

export const fileRelations = relations(file, ({many}) => ({
	merchantfiles: many(merchantfile),
	solicitationFeeDocuments: many(solicitationFeeDocument),
	customerCustomizations: many(customerCustomization),
	reportExecutions_idFile: many(reportExecution, {
		relationName: "reportExecution_idFile_file_id"
	}),
	reportExecutions_fileId: many(reportExecution, {
		relationName: "reportExecution_fileId_file_id"
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

export const usersRelations = relations(users, ({one, many}) => ({
	userMerchants: many(userMerchants),
	userNotifications: many(userNotifications),
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

export const feeBrandRelations = relations(feeBrand, ({one, many}) => ({
	fee: one(fee, {
		fields: [feeBrand.idFee],
		references: [fee.id]
	}),
	feeBrandProductTypes: many(feeBrandProductType),
}));

export const feeRelations = relations(fee, ({many}) => ({
	feeBrands: many(feeBrand),
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

export const userNotificationsRelations = relations(userNotifications, ({one}) => ({
	user: one(users, {
		fields: [userNotifications.idUser],
		references: [users.id]
	}),
}));

export const salesAgentsRelations = relations(salesAgents, ({one, many}) => ({
	user: one(users, {
		fields: [salesAgents.idUsers],
		references: [users.id]
	}),
	merchants: many(merchants),
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

export const categoriesRelations = relations(categories, ({many}) => ({
	merchants: many(merchants),
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

export const merchantPriceRelations = relations(merchantPrice, ({many}) => ({
	merchants: many(merchants),
	merchantPriceGroups: many(merchantPriceGroup),
}));

export const merchantBankAccountsRelations = relations(merchantBankAccounts, ({many}) => ({
	merchants: many(merchants),
}));

export const solicitationBrandProductTypeRelations = relations(solicitationBrandProductType, ({one}) => ({
	solicitationFeeBrand: one(solicitationFeeBrand, {
		fields: [solicitationBrandProductType.solicitationFeeBrandId],
		references: [solicitationFeeBrand.id]
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

export const feeBrandProductTypeRelations = relations(feeBrandProductType, ({one, many}) => ({
	feeBrand: one(feeBrand, {
		fields: [feeBrandProductType.idFeeBrand],
		references: [feeBrand.id]
	}),
	feeCredits: many(feeCredit),
}));

export const merchantpixaccountRelations = relations(merchantpixaccount, ({one}) => ({
	merchant: one(merchants, {
		fields: [merchantpixaccount.idMerchant],
		references: [merchants.id]
	}),
}));

export const feeCreditRelations = relations(feeCredit, ({one}) => ({
	feeBrandProductType: one(feeBrandProductType, {
		fields: [feeCredit.idFeeBrandProductType],
		references: [feeBrandProductType.id]
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

export const merchantSettlementsRelations = relations(merchantSettlements, ({one, many}) => ({
	merchantSettlementOrders: many(merchantSettlementOrders),
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
	merchantPixSettlementOrders: many(merchantPixSettlementOrders),
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

export const customerCustomizationRelations = relations(customerCustomization, ({one}) => ({
	customer: one(customers, {
		fields: [customerCustomization.customerId],
		references: [customers.id]
	}),
	file: one(file, {
		fields: [customerCustomization.fileId],
		references: [file.id]
	}),
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

export const reportExecutionStatusRelations = relations(reportExecutionStatus, ({many}) => ({
	reportExecutions: many(reportExecution),
}));