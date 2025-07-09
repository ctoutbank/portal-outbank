"use server";

import { db } from "@/server/db";

import { eq } from "drizzle-orm";
import { merchants } from "../../../../../drizzle/schema";
import { getAddressId, insertAddress } from "./address";
import { getOrCreateCategory } from "./category";
import { getOrCreateConfiguration } from "./configuration";
import { insertContact } from "./contact";
import { getIdBySlug } from "./getslug";
import { getOrCreateLegalNature } from "./legalNature";
import {
  getOrCreateMerchantPixAccount,
  insertmerchantPixAccount,
} from "./merchantPixAccount";
import { getOrCreateSaleAgent } from "./salesAgent";
import { Merchant } from "./types";

export async function insertMerchantAndRelations(merchant: Merchant) {
  console.log("Processing merchant:", merchant.slug);
  try {
    // Verifica se o merchant já existe
    const existing = await db
      .select()
      .from(merchants)
      .where(eq(merchants.slug, merchant.slug));

    if (existing.length > 0) {
      console.log(
        `Merchant with slug ${merchant.slug} already exists. Updating...`
      );
      await updateMerchantAndRelations(merchant);
      return;
    }

    const categoryslug = merchant.category
      ? await getOrCreateCategory(merchant.category)
      : null;
    const legalnatureslug = merchant.legalNature
      ? await getOrCreateLegalNature(merchant.legalNature)
      : null;

    const saleagentslug = merchant.saleAgent
      ? await getOrCreateSaleAgent(merchant.saleAgent)
      : null;

    const configurationslug = merchant.configuration
      ? await getOrCreateConfiguration(merchant.configuration)
      : null;

    const addressId = merchant.address
      ? await insertAddress(merchant.address)
      : null;

    const categoryId = merchant.category
      ? await getIdBySlug("categories", merchant.category.slug)
      : null;

    const legalNatureId = merchant.legalNature
      ? await getIdBySlug("legal_natures", merchant.legalNature.slug)
      : null;
    console.log("legalNatureId", legalNatureId);

    const saleAgentId = merchant.saleAgent
      ? await getIdBySlug("sales_agents", merchant.saleAgent.slug)
      : null;

    const configurationId = merchant.configuration
      ? await getIdBySlug("configurations", merchant.configuration.slug)
      : null;

    // Inserir o merchant com os IDs e slugs obtidos
    await insertMerchant(
      merchant,
      addressId || null,
      categoryslug?.toString() || null,
      legalnatureslug?.toString() || null,
      saleagentslug?.toString() || null,
      configurationslug?.toString() || null,
      categoryId || null,
      legalNatureId || null,
      saleAgentId || null,
      configurationId || null
    );

    if (merchant.contacts) {
      for (const contact of merchant.contacts) {
        await insertContact(contact, merchant, contact.address);
      }
    }

    if (merchant.merchantPixAccount) {
      await insertmerchantPixAccount(merchant.merchantPixAccount, merchant);
    }
  } catch (error) {
    console.error(`Erro ao processar merchant ${merchant.slug}:`, error);
  }
}

async function updateMerchantAndRelations(merchant: Merchant) {
  try {
    // Atualiza ou cria as entidades relacionadas
    const categoryslug = merchant.category
      ? await getOrCreateCategory(merchant.category)
      : null;
    const legalnatureslug = merchant.legalNature
      ? await getOrCreateLegalNature(merchant.legalNature)
      : null;
    const saleagentslug = merchant.saleAgent
      ? await getOrCreateSaleAgent(merchant.saleAgent)
      : null;
    const configurationslug = merchant.configuration
      ? await getOrCreateConfiguration(merchant.configuration)
      : null;

    // Atualiza o endereço se existir
    const addressId = merchant.address
      ? await getAddressId(merchant.address)
      : null;

    // Obtém os IDs correspondentes
    const categoryId = merchant.category
      ? await getIdBySlug("categories", merchant.category.slug)
      : null;
    const legalNatureId = merchant.legalNature
      ? await getIdBySlug("legal_natures", merchant.legalNature.slug)
      : null;
    const saleAgentId = merchant.saleAgent
      ? await getIdBySlug("sales_agents", merchant.saleAgent.slug)
      : null;
    const configurationId = merchant.configuration
      ? await getIdBySlug("configurations", merchant.configuration.slug)
      : null;

    // Atualiza o merchant
    await updateMerchant(
      merchant,
      addressId || null,
      categoryslug?.toString() || null,
      legalnatureslug?.toString() || null,
      saleagentslug?.toString() || null,
      configurationslug?.toString() || null,
      categoryId || null,
      legalNatureId || null,
      saleAgentId || null,
      configurationId || null
    );

    // Atualiza ou cria os contatos
    if (merchant.contacts) {
      for (const contact of merchant.contacts) {
        await insertContact(contact, merchant, contact.address);
      }
    }

    // Atualiza ou cria a conta Pix
    if (merchant.merchantPixAccount) {
      await getOrCreateMerchantPixAccount(
        merchant.merchantPixAccount,
        merchant
      );
    }

    console.log(`Merchant ${merchant.slug} updated successfully.`);
  } catch (error) {
    console.error(`Error updating merchant ${merchant.slug}:`, error);
  }
}

async function updateMerchant(
  merchant: Merchant,
  addressId: number | null,
  categoryslug: string | null,
  legalnatureslug: string | null,
  saleagentslug: string | null,
  configurationslug: string | null,
  categoryId: number | null,
  legalNatureId: number | null,
  saleAgentId: number | null,
  configurationId: number | null
) {
  try {
    const DtUpdate = merchant.dtUpdate
      ? new Date(merchant.dtUpdate).toISOString()
      : new Date().toISOString();

    const DtDelete = merchant.dtdelete
      ? new Date(merchant.dtdelete).toISOString()
      : null;

    const idCustomer = await getIdBySlug(
      "customers",
      merchant.slugCustomer || ""
    );
    await db
      .update(merchants)
      .set({
        active: merchant.active,
        dtupdate: DtUpdate,
        idMerchant: merchant.merchantId,
        name: merchant.name,
        idDocument: merchant.documentId,
        corporateName: merchant.corporateName || null,
        email: merchant.email || null,
        areaCode: merchant.areaCode || null,
        number: merchant.number || null,
        phoneType: merchant.phoneType || null,
        language: merchant.language || null,
        timezone: merchant.timezone || null,
        slugCustomer: merchant.slugCustomer || null,
        riskAnalysisStatus: merchant.riskAnalysisStatus || null,
        riskAnalysisStatusJustification:
          merchant.riskAnalysisStatusJustification || null,
        legalPerson: merchant.legalPerson || null,
        openingDate: merchant.openingDate
          ? new Date(merchant.openingDate).toISOString()
          : null,
        inclusion: merchant.inclusion || null,
        openingDays: merchant.openingDays || null,
        openingHour: merchant.openingHour || null,
        closingHour: merchant.closingHour || null,
        municipalRegistration: merchant.municipalRegistration || null,
        stateSubcription: merchant.stateSubcription || null,
        hasTef: merchant.hasTef,
        hasPix: merchant.hasPix,
        hasTop: merchant.hasTop,
        establishmentFormat: merchant.establishmentFormat || null,
        revenue: merchant.revenue?.toString() || null,
        idCategory: categoryId,
        slugCategory: categoryslug,
        idLegalNature: legalNatureId,
        slugLegalNature: legalnatureslug,
        idSalesAgent: saleAgentId,
        slugSalesAgent: saleagentslug,
        idConfiguration: configurationId,
        slugConfiguration: configurationslug,
        idAddress: addressId,
        dtdelete: DtDelete,
        idCustomer: idCustomer,
      })
      .where(eq(merchants.slug, merchant.slug));

    console.log(`Merchant ${merchant.slug} updated successfully.`);
  } catch (error) {
    console.error(`Error updating merchant ${merchant.slug}:`, error);
  }
}

async function insertMerchant(
  merchant: Merchant,
  addressId: number | null,
  categoryslug: string | null,
  legalnatureslug: string | null,
  saleagentslug: string | null,
  configurationslug: string | null,
  categoryId: number | null,
  legalNatureId: number | null,
  saleAgentId: number | null,
  configurationId: number | null
) {
  try {
    const existing = await db
      .select()
      .from(merchants)
      .where(eq(merchants.slug, merchant.slug));

    if (existing.length > 0) {
      return;
    }

    const idCustomer = await getIdBySlug(
      "customers",
      merchant.slugCustomer || ""
    );

    console.log("Inserting merchant:", merchant);

    const DtInsert = merchant.dtInsert
      ? new Date(merchant.dtInsert).toISOString()
      : null;
    const DtUpdate = merchant.dtUpdate
      ? new Date(merchant.dtUpdate).toISOString()
      : null;

    await db.insert(merchants).values({
      slug: merchant.slug || null,
      active: merchant.active,
      dtinsert: DtInsert,
      dtupdate: DtUpdate,
      idMerchant: merchant.merchantId,
      name: merchant.name,
      idDocument: merchant.documentId,
      corporateName: merchant.corporateName || null,
      email: merchant.email || null,
      areaCode: merchant.areaCode || null,
      number: merchant.number || null,
      phoneType: merchant.phoneType || null,
      language: merchant.language || null,
      timezone: merchant.timezone || null,
      slugCustomer: merchant.slugCustomer || null,
      riskAnalysisStatus: merchant.riskAnalysisStatus || null,
      riskAnalysisStatusJustification:
        merchant.riskAnalysisStatusJustification || null,
      legalPerson: merchant.legalPerson || null,
      openingDate: merchant.openingDate
        ? new Date(merchant.openingDate).toISOString()
        : null, // Corrigido
      inclusion: merchant.inclusion || null,
      openingDays: merchant.openingDays || null,
      openingHour: merchant.openingHour || null,
      closingHour: merchant.closingHour || null,
      municipalRegistration: merchant.municipalRegistration || null,
      stateSubcription: merchant.stateSubcription || null,
      hasTef: merchant.hasTef,
      hasPix: merchant.hasPix,
      hasTop: merchant.hasTop,
      establishmentFormat: merchant.establishmentFormat || null,
      revenue: merchant.revenue?.toString() || null,
      idCategory: categoryId,
      slugCategory: categoryslug,
      idLegalNature: legalNatureId,
      slugLegalNature: legalnatureslug,
      idSalesAgent: saleAgentId,
      slugSalesAgent: saleagentslug,
      idConfiguration: configurationId,
      slugConfiguration: configurationslug,
      idAddress: addressId,
      dtdelete: merchant.dtdelete
        ? new Date(merchant.dtdelete).toISOString()
        : null,
      idCustomer: idCustomer,
    });

    console.log("Merchant inserted successfully.");
  } catch (error) {
    console.error("Error inserting merchant:", error);
  }
}
