"use server";

import { db } from "@/db/drizzle";
import { solicitationFee, solicitationFeeBrand, solicitationBrandProductType } from "../../../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { generateSlug } from "@/lib/utils";
import { PricingSolicitationSchemaAdmin } from "../schema/schema";

export interface SolicitationFeeAdminForm {
  id?: number;
  cnae: string;
  mcc: string;
  cnpjQuantity: number;
  monthlyPosFee: string | null;
  averageTicket: string | null;
  description: string | null;
  cnaeInUse: boolean;
  cardPixMdrAdmin: string | null;
  cardPixCeilingFeeAdmin: string | null;
  cardPixMinimumCostFeeAdmin: string | null;
  nonCardPixMdrAdmin: string | null;
  nonCardPixCeilingFeeAdmin: string | null;
  nonCardPixMinimumCostFeeAdmin: string | null;
  compulsoryAnticipationConfigAdmin: number;
  eventualAnticipationFeeAdmin: string | null;
  nonCardEventualAnticipationFeeAdmin: string | null;
  brands: Array<{
    name: string;
    productTypes: Array<{
      name: string;
      feeAdmin: string;
      noCardFeeAdmin: string;
      transactionFeeStart: string;
      transactionFeeEnd: string;
      transactionAnticipationMdr: string;
    }>;
  }>;
}

export async function insertSolicitationFeeAdmin(
  solicitationData: SolicitationFeeAdminForm
): Promise<number> {
  try {
    // 1. Create the main solicitation fee record
    const { brands, ...dataToInsert } = solicitationData;

    const [newSolicitation] = await db
      .insert(solicitationFee)
      .values({
        ...dataToInsert,
        slug: generateSlug(),
        status: "COMPLETED",
        dtinsert: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
        // Campos não admin ficam null
        cardPixMdr: null,
        cardPixCeilingFee: null,
        cardPixMinimumCostFee: null,
        nonCardPixMdr: null,
        nonCardPixCeilingFee: null,
        nonCardPixMinimumCostFee: null,
        compulsoryAnticipationConfig: 0,
        eventualAnticipationFee: null,
        nonCardEventualAnticipationFee: null,
        // Campos dock ficam null
        cardPixMdrDock: null,
        cardPixCeilingFeeDock: null,
        cardPixMinimumCostFeeDock: null,
        nonCardPixMdrDock: null,
        nonCardPixCeilingFeeDock: null,
        nonCardPixMinimumCostFeeDock: null,
        compulsoryAnticipationConfigDock: 0,
        eventualAnticipationFeeDock: null,
        nonCardEventualAnticipationFeeDock: null,
      })
      .returning({ id: solicitationFee.id });

    if (!newSolicitation) {
      throw new Error("Failed to create solicitation fee");
    }

    // 2. Create brand records for each brand
    for (const brand of brands || []) {
      const [newBrand] = await db
        .insert(solicitationFeeBrand)
        .values({
          slug: generateSlug(),
          solicitationFeeId: newSolicitation.id,
          brand: brand.name,
          dtinsert: new Date().toISOString(),
          dtupdate: new Date().toISOString(),
        })
        .returning({ id: solicitationFeeBrand.id });

      if (!newBrand) continue;

      // 3. Create product type records for each product type in the brand
      for (const productType of brand.productTypes || []) {
        try {
          const feeAdminValue = productType.feeAdmin == null
            ? 0
            : typeof productType.feeAdmin === "number"
              ? productType.feeAdmin
              : typeof productType.feeAdmin === "string"
                ? parseFloat(productType.feeAdmin) || 0
                : 0;

          const noCardFeeAdminValue = productType.noCardFeeAdmin == null
            ? 0
            : typeof productType.noCardFeeAdmin === "number"
              ? productType.noCardFeeAdmin
              : typeof productType.noCardFeeAdmin === "string"
                ? parseFloat(productType.noCardFeeAdmin) || 0
                : 0;

          const transactionAnticipationMdrValue = productType.transactionAnticipationMdr == null
            ? 0
            : typeof productType.transactionAnticipationMdr === "number"
              ? productType.transactionAnticipationMdr
              : typeof productType.transactionAnticipationMdr === "string"
                ? parseFloat(productType.transactionAnticipationMdr) || 0
                : 0;

          const transactionFeeStartValue = productType.transactionFeeStart == null
            ? 0
            : Number(productType.transactionFeeStart) || 0;

          const transactionFeeEndValue = productType.transactionFeeEnd == null
            ? 0
            : Number(productType.transactionFeeEnd) || 0;

          await db.execute(sql`
            INSERT INTO solicitation_brand_product_type (
              slug, 
              solicitation_fee_brand_id, 
              product_type, 
              fee, 
              fee_admin,
              no_card_fee_admin,    
              fee_dock, 
              transaction_fee_start, 
              transaction_fee_end, 
              transaction_anticipation_mdr, 
              dtinsert, 
              dtupdate
            ) VALUES (
              ${generateSlug()}, 
              ${newBrand.id}, 
              ${productType.name}, 
              0, 
              ${feeAdminValue}, 
              ${noCardFeeAdminValue}, 
              0, 
              ${transactionFeeStartValue}, 
              ${transactionFeeEndValue}, 
              ${transactionAnticipationMdrValue}, 
              ${new Date().toISOString()}, 
              ${new Date().toISOString()}
            )
          `);
        } catch (error) {
          console.error("Erro ao inserir tipo de produto:", error);
          continue;
        }
      }
    }

    return newSolicitation.id;
  } catch (error) {
    console.error("Error creating solicitation fee:", error);
    throw error;
  }
}

export async function updateSolicitationFeeAdmin(
  solicitationData: SolicitationFeeAdminForm
): Promise<number> {
  if (!solicitationData.id) {
    throw new Error("Solicitation ID is required for updates");
  }

  try {
    const { brands, id, ...dataToUpdate } = solicitationData;

    // 1. Update the main solicitation fee record
    await db
      .update(solicitationFee)
      .set({
        ...dataToUpdate,
        dtupdate: new Date().toISOString(),
        status: "COMPLETED",
      })
      .where(eq(solicitationFee.id, id));

    // 2. Delete existing brand records and product types (we'll recreate them)
    const existingBrands = await db
      .select({ id: solicitationFeeBrand.id })
      .from(solicitationFeeBrand)
      .where(eq(solicitationFeeBrand.solicitationFeeId, id));

    for (const brand of existingBrands) {
      // Delete product types first (due to foreign key constraints)
      await db
        .delete(solicitationBrandProductType)
        .where(eq(solicitationBrandProductType.solicitationFeeBrandId, brand.id));
    }

    // Delete the brands
    await db
      .delete(solicitationFeeBrand)
      .where(eq(solicitationFeeBrand.solicitationFeeId, id));

    // 3. Create new brand records for each brand
    for (const brand of brands || []) {
      const [newBrand] = await db
        .insert(solicitationFeeBrand)
        .values({
          slug: generateSlug(),
          solicitationFeeId: id,
          brand: brand.name,
          dtinsert: new Date().toISOString(),
          dtupdate: new Date().toISOString(),
        })
        .returning({ id: solicitationFeeBrand.id });

      if (!newBrand) continue;

      // 4. Create product type records for each product type in the brand
      for (const productType of brand.productTypes || []) {
        try {
          const feeAdminValue = productType.feeAdmin == null
            ? 0
            : typeof productType.feeAdmin === "number"
              ? productType.feeAdmin
              : typeof productType.feeAdmin === "string"
                ? parseFloat(productType.feeAdmin) || 0
                : 0;

          const noCardFeeAdminValue = productType.noCardFeeAdmin == null
            ? 0
            : typeof productType.noCardFeeAdmin === "number"
              ? productType.noCardFeeAdmin
              : typeof productType.noCardFeeAdmin === "string"
                ? parseFloat(productType.noCardFeeAdmin) || 0
                : 0;

          const transactionAnticipationMdrValue = productType.transactionAnticipationMdr == null
            ? 0
            : typeof productType.transactionAnticipationMdr === "number"
              ? productType.transactionAnticipationMdr
              : typeof productType.transactionAnticipationMdr === "string"
                ? parseFloat(productType.transactionAnticipationMdr) || 0
                : 0;

          const transactionFeeStartValue = productType.transactionFeeStart == null
            ? 0
            : Number(productType.transactionFeeStart) || 0;

          const transactionFeeEndValue = productType.transactionFeeEnd == null
            ? 0
            : Number(productType.transactionFeeEnd) || 0;

          await db.execute(sql`
            INSERT INTO solicitation_brand_product_type (
              slug, 
              solicitation_fee_brand_id, 
              product_type, 
              fee, 
              fee_admin,
              no_card_fee_admin,
              fee_dock, 
              transaction_fee_start, 
              transaction_fee_end, 
              transaction_anticipation_mdr, 
              dtinsert, 
              dtupdate
            ) VALUES (
              ${generateSlug()}, 
              ${newBrand.id}, 
              ${productType.name || "Produto Padrão"}, 
              0, 
              ${feeAdminValue}, 
              ${noCardFeeAdminValue}, 
              0, 
              ${transactionFeeStartValue}, 
              ${transactionFeeEndValue}, 
              ${transactionAnticipationMdrValue}, 
              ${new Date().toISOString()}, 
              ${new Date().toISOString()}
            )
          `);
        } catch (error) {
          console.error("Erro ao atualizar tipo de produto:", error);
          continue;
        }
      }
    }

    return id;
  } catch (error) {
    console.error("Error updating solicitation fee:", error);
    throw error;
  }
}

// Map form data to solicitation structure for admin
export async function mapFormDataToSolicitationAdmin(data: PricingSolicitationSchemaAdmin): Promise<SolicitationFeeAdminForm> {
  // Se não houver dados, retorna objeto com valores padrão
  if (!data) {
    return {
      cnae: "",
      mcc: "",
      cnpjQuantity: 0,
      monthlyPosFee: null,
      averageTicket: null,
      description: null,
      cnaeInUse: false,
      cardPixMdrAdmin: null,
      cardPixCeilingFeeAdmin: null,
      cardPixMinimumCostFeeAdmin: null,
      nonCardPixMdrAdmin: null,
      nonCardPixCeilingFeeAdmin: null,
      nonCardPixMinimumCostFeeAdmin: null,
      compulsoryAnticipationConfigAdmin: 0,
      eventualAnticipationFeeAdmin: null,
      nonCardEventualAnticipationFeeAdmin: null,
      brands: [],
    };
  }

  const mappedData: SolicitationFeeAdminForm = {
    cnae: data.cnae || "",
    mcc: data.mcc || "",
    cnpjQuantity: data.cnpjQuantity ? Number(data.cnpjQuantity) : 0,
    monthlyPosFee: data.monthlyPosFee || null,
    averageTicket: data.averageTicket || null,
    description: data.description || null,
    cnaeInUse: data.cnaeInUse ?? false,
    cardPixMdrAdmin: data.cardPixMdrAdmin || null,
    cardPixCeilingFeeAdmin: data.cardPixCeilingFeeAdmin || null,
    cardPixMinimumCostFeeAdmin: data.cardPixMinimumCostFeeAdmin || null,
    nonCardPixMdrAdmin: data.nonCardPixMdrAdmin || null,
    nonCardPixCeilingFeeAdmin: data.nonCardPixCeilingFeeAdmin || null,
    nonCardPixMinimumCostFeeAdmin: data.nonCardPixMinimumCostFeeAdmin || null,
    compulsoryAnticipationConfigAdmin: Number(data.eventualAnticipationFeeAdmin) || 0,
    eventualAnticipationFeeAdmin: data.eventualAnticipationFeeAdmin || null,
    nonCardEventualAnticipationFeeAdmin: data.nonCardEventualAnticipationFeeAdmin || null,
    brands: (data.brands || []).map((brand) => ({
      name: brand.name || "",
      productTypes: (brand.productTypes || []).map((productType) => ({
        name: productType.name || "",
        feeAdmin: productType.feeAdmin || "",
        noCardFeeAdmin: productType.noCardFeeAdmin || "",
        transactionFeeStart: productType.transactionFeeStart || "",
        transactionFeeEnd: productType.transactionFeeEnd || "",
        transactionAnticipationMdr: productType.transactionAnticipationMdr || "",
      })),
    })),
  };

  console.log("Dados do formulário admin mapeados para upload:", mappedData);
  return mappedData;
}
