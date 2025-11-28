"use server";

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  addresses,
  categories,
  configurations,
  legalNatures,
} from "../../../../drizzle/schema";
import { AddressSchema, MerchantSchema } from "../schema/merchant-schema";
import {
  AddressDetail,
  AddressInsert,
  MerchantDetail,
  MerchantInsert,
  getCurrentUserCustomerId,
  getCurrentUserCustomerSlug,
  getSlugById,
  insertAddress,
  insertMerchant,
  updateAddress,
  updateMerchant,
} from "../server/merchant-crud";

export async function insertMerchantFormAction(data: MerchantSchema) {
  // Buscar os slugs usando a função genérica
  const [legalNatureSlug, categorySlug, configurationSlug] = await Promise.all([
    data.idLegalNature ? getSlugById(legalNatures, data.idLegalNature) : null,
    data.idCategory ? getSlugById(categories, data.idCategory) : null,
    data.idConfiguration
      ? getSlugById(configurations, data.idConfiguration)
      : null,
  ]);

  const customerSlug = await getCurrentUserCustomerSlug();
  const customerId = await getCurrentUserCustomerId();

  const merchantInsert: MerchantInsert = {
    slug: data.slug || "",
    active: data.active ?? true,
    dtinsert: (data.dtinsert || new Date()).toISOString(),
    dtupdate: (data.dtupdate || new Date()).toISOString(),
    idMerchant: data.idMerchant?.toString() || "",
    name: data.name || "",
    idDocument: data.idDocument || "",
    corporateName: data.corporateName || "",
    email: data.email || "",
    areaCode: data.areaCode || "",
    number: data.number || "",
    phoneType: data.phoneType || "",
    language: data.language || "",
    timezone: data.timezone || "",
    slugCustomer: customerSlug || "",
    riskAnalysisStatus: data.riskAnalysisStatus || "",
    riskAnalysisStatusJustification: data.riskAnalysisStatusJustification || "",
    legalPerson: data.legalPerson || "",
    openingDate: data.openingDate?.toISOString() || null,
    inclusion: data.inclusion || "",
    openingDays: data.openingDays || "",
    openingHour: data.openingHour || null,
    closingHour: data.closingHour || null,
    municipalRegistration: data.municipalRegistration || "",
    stateSubcription: data.stateSubcription || "",
    hasTef: data.hasTef ?? false,
    hasPix: data.hasPix ?? false,
    hasTop: data.hasTop ?? false,
    establishmentFormat: data.establishmentFormat || "",
    revenue: data.revenue?.toString() || "0",
    idCategory: data.idCategory || 0,
    slugCategory: categorySlug || "",
    idLegalNature: data.idLegalNature ? Number(data.idLegalNature) : 0,
    slugLegalNature: legalNatureSlug || "",
    idSalesAgent: Number(data.idSalesAgent) || null,
    slugSalesAgent: data.slugSalesAgent || "",
    idConfiguration: Number(data.idConfiguration) || null,
    slugConfiguration: configurationSlug || "",
    idAddress: Number(data.idAddress) || 0,
    idCustomer: customerId || null,
  };

  console.log("Dados do merchant antes de inserir:", merchantInsert);
  const newId = await insertMerchant(merchantInsert);
  return newId;
}

export async function updateMerchantFormAction(data: MerchantSchema) {
  console.log("updateMerchantFormAction", data);
  if (!data.id) {
    throw new Error("Cannot update merchant without an ID");
  }

  // Buscar os slugs usando a função genérica
  const [legalNatureSlug, categorySlug, configurationSlug] = await Promise.all([
    data.idLegalNature ? getSlugById(legalNatures, data.idLegalNature) : null,
    data.idCategory ? getSlugById(categories, data.idCategory) : null,
    data.idConfiguration
      ? getSlugById(configurations, data.idConfiguration)
      : null,
  ]);

  const merchantUpdate: MerchantDetail = {
    slug: data.slug || "",
    active: data.active ?? true,
    dtinsert: (data.dtinsert || new Date()).toISOString(),
    dtupdate: (data.dtupdate || new Date()).toISOString(),
    idMerchant: data.idMerchant?.toString() || "",
    name: data.name || "",
    idDocument: data.idDocument || "",
    corporateName: data.corporateName || "",
    email: data.email || "",
    areaCode: data.areaCode || "",
    number: data.number || "",
    phoneType: data.phoneType || "",
    language: data.language || "",
    timezone: data.timezone || "",
    slugCustomer: data.slugCustomer || "",
    riskAnalysisStatus: data.riskAnalysisStatus || "",
    riskAnalysisStatusJustification: data.riskAnalysisStatusJustification || "",
    legalPerson: data.legalPerson || "",
    openingDate: data.openingDate?.toISOString() || null,
    inclusion: data.inclusion || "",
    openingDays: data.openingDays || "",
    openingHour: data.openingHour || null,
    closingHour: data.closingHour || null,
    municipalRegistration: data.municipalRegistration || "",
    stateSubcription: data.stateSubcription || "",
    hasTef: data.hasTef ?? false,
    hasPix: data.hasPix ?? false,
    hasTop: data.hasTop ?? false,
    establishmentFormat: data.establishmentFormat || "",
    revenue: data.revenue?.toString() || "0",
    idAddress: data.idAddress || 0,
    id: data.id || 0,
    idLegalNature: data.idLegalNature || 0,
    slugLegalNature: legalNatureSlug || "",
    idCategory: data.idCategory || 0,
    slugCategory: categorySlug || "",
    idConfiguration: data.idConfiguration || undefined,
    slugConfiguration: configurationSlug || "",
    idSalesAgent: data.idSalesAgent || null,
    slugSalesAgent: data.slugSalesAgent || "",
    idMerchantBankAccount: data.idMerchantBankAccount || null,
    idCustomer: data.idCustomer || null,
    idMerchantPrice: data.idMerchantPrice || null,
    dtdelete: null,
  };
  await updateMerchant(merchantUpdate);
}

export async function insertAddressFormAction(data: AddressSchema) {
  const addressInsert: AddressInsert = {
    streetAddress: data.street || "",
    streetNumber: data.number || "",
    complement: data.complement || "",
    neighborhood: data.neighborhood || "",
    city: data.city || "",
    state: data.state || "",
    country: data.country || "",
    zipCode: data.zipCode || "",
  };
  const newId = await insertAddress(addressInsert);

  return newId;
}

export async function updateAddressFormAction(data: AddressSchema) {
  const addressId = data.id || 0;

  // Remove o ID do objeto de atualização para evitar o erro
  const addressUpdate: Omit<AddressDetail, "id"> = {
    streetAddress: data.street || "",
    streetNumber: data.number || "",
    complement: data.complement || "",
    neighborhood: data.neighborhood || "",
    city: data.city || "",
    state: data.state || "",
    country: data.country || "",
    zipCode: data.zipCode || "",
  };

  // Atualiza utilizando o ID apenas na cláusula where
  await db
    .update(addresses)
    .set(addressUpdate)
    .where(eq(addresses.id, addressId));
}

