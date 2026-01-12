"use server";
import {
  getUserEmail,
  sendPricingSolicitationEmail,
} from "@/utils/send-email-adtivo";
import { generateSlug } from "@/lib/utils";
import { db } from "@/db/drizzle";
import { getCurrentUser } from "@/lib/auth";
import { and, count, desc, eq, ne, sql } from "drizzle-orm";
import {
  customers,
  file,
  solicitationBrandProductType,
  solicitationFee,
  solicitationFeeBrand,
  solicitationFeeDocument,
  users,
} from "../../../../drizzle/schema";
import { PricingSolicitationSchema } from "../schema/schema";

export interface DDMerchant {
  id: number;
  name: string;
}

export interface PricingSolicitationList {
  pricingSolicitations: {
    id: number | null;
    cnae: string | null;
    status: string | null;
    dtinsert?: string | null;
  }[];
  totalCount: number | null;
}

export type PricingSolicitationInsert = typeof solicitationFee.$inferInsert;
export type PricingSolicitationDetail = typeof solicitationFee.$inferSelect & {
  eventualAnticipationFee?: string | null;
  nonCardEventualAnticipationFee?: string | null;
};

export interface ProductType {
  name: string;
  fee: string;
  feeAdmin: string;
  feeDock: string;
  transactionFeeStart: string;
  transactionFeeEnd: string;
  transactionAnticipationMdr: string;
  noCardFee: string;
  noCardTransactionAnticipationMdr: string;
  noCardFeeAdmin: string;
  noCardFeeDock: string;
}

export interface Brand {
  name: string;
  productTypes?: ProductType[];
}

export interface PricingSolicitationForm extends PricingSolicitationDetail {
  brands?: Brand[];
}

export async function getPricingSolicitations(
  cnae: string,
  status: string,
  page: number,
  pageSize: number
): Promise<PricingSolicitationList | null> {
  // Get user's merchant access


  const offset = (page - 1) * pageSize;
  const limit = pageSize;
  const conditions = [];
  const sessionUser = await getCurrentUser();

  if (cnae) {
    conditions.push(eq(solicitationFee.cnae, cnae));
  }
  if (status) {
    conditions.push(eq(solicitationFee.status, status));
  }

  const userDB = await db
    .select({ customersId: users.idCustomer })
    .from(users)
    .where(eq(users.id, sessionUser?.id || 0));

  conditions.push(eq(solicitationFee.idCustomers, userDB[0].customersId || 0));
  conditions.push(ne(solicitationFee.status, "SEND_DOCUMENTS"));
  conditions.push(ne(solicitationFee.status, "SEND_SOLICITATION"));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const pricingSolicitations = await db
    .select({
      id: solicitationFee.id,
      cnae: solicitationFee.cnae,
      status: solicitationFee.status,
      dtinsert: solicitationFee.dtinsert,
    })
    .from(solicitationFee)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(solicitationFee.id));

  const totalCount = await db
    .select({ count: count() })
    .from(solicitationFee)
    .where(where);
  return {
    pricingSolicitations,
    totalCount: totalCount[0].count,
  };
}

export async function getPricingSolicitationById(
  id: number
): Promise<PricingSolicitationForm | null> {

  console.log("getPricingSolicitationById", id);
  
  try {
    const pricingSolicitation = await db.execute(sql`
      SELECT 
        sf.id,
        sf.cnae,
        sf.mcc,
        sf.cnpj_quantity as "cnpjQuantity",
        sf.status,
        sf.dtinsert,
        sf.dtupdate,
        sf.slug,
        sf.id_customers as "idCustomers",
        sf.monthly_pos_fee as "monthlyPosFee",
        sf.average_ticket as "averageTicket",
        sf.description,
        sf.cnae_in_use as "cnaeInUse",
        sf.card_pix_mdr as "cardPixMdr",
        sf.card_pix_ceiling_fee as "cardPixCeilingFee",
        sf.card_pix_minimum_cost_fee as "cardPixMinimumCostFee",
        sf.eventual_anticipation_fee as "eventualAnticipationFee",
        sf.non_card_pix_mdr as "nonCardPixMdr",
        sf.non_card_pix_ceiling_fee as "nonCardPixCeilingFee",
        sf.non_card_pix_minimum_cost_fee as "nonCardPixMinimumCostFee",
        sf.non_card_eventual_anticipation_fee as "nonCardEventualAnticipationFee",
        sf.card_pix_mdr_admin as "cardPixMdrAdmin",
        sf.card_pix_ceiling_fee_admin as "cardPixCeilingFeeAdmin",
        sf.card_pix_minimum_cost_fee_admin as "cardPixMinimumCostFeeAdmin",
        sf.eventual_anticipation_fee_admin as "eventualAnticipationFeeAdmin",
        sf.non_card_pix_mdr_admin as "nonCardPixMdrAdmin",
        sf.non_card_pix_ceiling_fee_admin as "nonCardPixCeilingFeeAdmin",
        sf.non_card_pix_minimum_cost_fee_admin as "nonCardPixMinimumCostFeeAdmin",
        sf.non_card_eventual_anticipation_fee_admin as "nonCardEventualAnticipationFeeAdmin",
        COALESCE(
          json_agg(
            CASE 
              WHEN sfb.id IS NOT NULL THEN
                json_build_object(
                  'name', sfb.brand,
                  'productTypes', (
                    SELECT COALESCE(
                      json_agg(
                        json_build_object(
                          'name', sbpt.product_type,
                          'fee', sbpt.fee,
                          'feeAdmin', sbpt.fee_admin,
                          'feeDock', sbpt.fee_dock,
                          'transactionFeeStart', sbpt.transaction_fee_start,
                          'transactionFeeEnd', sbpt.transaction_fee_end,
                          'noCardFee', sbpt.no_card_fee,
                          'noCardFeeAdmin', sbpt.no_card_fee_admin,
                          'noCardFeeDock', sbpt.no_card_fee_dock,
                          'noCardTransactionAnticipationMdr', sbpt.no_card_transaction_anticipation_mdr,
                          'transactionAnticipationMdr', sbpt.transaction_anticipation_mdr
                        )
                      ), '[]'::json
                    )
                    FROM ${solicitationBrandProductType} sbpt
                    WHERE sbpt.solicitation_fee_brand_id = sfb.id
                  )
                )
              ELSE NULL
            END
          ) FILTER (WHERE sfb.id IS NOT NULL), '[]'::json
        ) as brands
      FROM ${solicitationFee} sf
      LEFT JOIN ${solicitationFeeBrand} sfb ON sf.id = sfb.solicitation_fee_id
      WHERE sf.id = ${id}
      GROUP BY sf.id
    `);

    console.log("pricingSolicitation", pricingSolicitation);

    if (!pricingSolicitation.rows || pricingSolicitation.rows.length === 0) {
      console.log("Nenhum resultado encontrado para ID:", id);
      return null;
    }

    return pricingSolicitation.rows[0] as unknown as PricingSolicitationForm;
  } catch (error) {
    console.error("Erro na consulta getPricingSolicitationById:", error);
    throw error;
  }
}

export async function insertPricingSolicitation(
  pricingSolicitation: PricingSolicitationForm
) {
  const user = await currentUser();

  const userDB = await db
    .select({ customersId: users.idCustomer })
    .from(users)
    .where(eq(users.idClerk, user?.id || ""));

  const customerId = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.id, userDB[0].customersId || 0));

  pricingSolicitation.slug = generateSlug();
  pricingSolicitation.idCustomers = customerId[0].id || null;

  try {
    // 1. Create the main solicitation fee record
    const { brands, ...solicitationData } = pricingSolicitation;

    // Remove the id field to let the database auto-generate it
    const { id, ...dataToInsert } = solicitationData;
    console.log("dataToInsert", id);

    const [newSolicitation] = await db
      .insert(solicitationFee)
      .values(dataToInsert)
      .returning({ id: solicitationFee.id });

    if (!newSolicitation) {
      throw new Error("Failed to create pricing solicitation");
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
          // Verificar se está null/undefined primeiro, então converter adequadamente

          // Campos decimais - verificar se é number ou string
          const feeValue =
            productType.fee == null
              ? 0
              : typeof productType.fee === "number"
                ? productType.fee
                : typeof productType.fee === "string"
                  ? parseFloat(productType.fee) || 0
                  : 0;

          const feeAdminValue =
            productType.feeAdmin == null
              ? 0
              : typeof productType.feeAdmin === "number"
                ? productType.feeAdmin
                : typeof productType.feeAdmin === "string"
                  ? parseFloat(productType.feeAdmin) || 0
                  : 0;

          const feeDockValue =
            productType.feeDock == null
              ? 0
              : typeof productType.feeDock === "number"
                ? productType.feeDock
                : typeof productType.feeDock === "string"
                  ? parseFloat(productType.feeDock) || 0
                  : 0;

          const noCardFeeValue =
            productType.noCardFee == null
              ? 0
              : typeof productType.noCardFee === "number"
                ? productType.noCardFee
                : typeof productType.noCardFee === "string"
                  ? parseFloat(productType.noCardFee) || 0
                  : 0;

          const noCardFeeAdminValue =
            productType.noCardFeeAdmin == null
              ? 0
              : typeof productType.noCardFeeAdmin === "number"
                ? productType.noCardFeeAdmin
                : typeof productType.noCardFeeAdmin === "string"
                  ? parseFloat(productType.noCardFeeAdmin) || 0
                  : 0;

          const noCardFeeDockValue =
            productType.noCardFeeDock == null
              ? 0
              : typeof productType.noCardFeeDock === "number"
                ? productType.noCardFeeDock
                : typeof productType.noCardFeeDock === "string"
                  ? parseFloat(productType.noCardFeeDock) || 0
                  : 0;

          const noCardTransactionAnticipationMdrValue =
            productType.noCardTransactionAnticipationMdr == null
              ? 0
              : typeof productType.noCardTransactionAnticipationMdr === "number"
                ? productType.noCardTransactionAnticipationMdr
                : typeof productType.noCardTransactionAnticipationMdr ===
                    "string"
                  ? parseFloat(productType.noCardTransactionAnticipationMdr) ||
                    0
                  : 0;

          const transactionAnticipationMdrValue =
            productType.transactionAnticipationMdr == null
              ? 0
              : typeof productType.transactionAnticipationMdr === "number"
                ? productType.transactionAnticipationMdr
                : typeof productType.transactionAnticipationMdr === "string"
                  ? parseFloat(productType.transactionAnticipationMdr) || 0
                  : 0;

          // Campos inteiros - converter para number
          const transactionFeeStartValue =
            productType.transactionFeeStart == null
              ? 0
              : Number(productType.transactionFeeStart) || 0;

          const transactionFeeEndValue =
            productType.transactionFeeEnd == null
              ? 0
              : Number(productType.transactionFeeEnd) || 0;

          // Use SQL raw para fazer a inserção diretamente
          await db.execute(sql`
            INSERT INTO solicitation_brand_product_type (
              slug, 
              solicitation_fee_brand_id, 
              product_type, 
              fee, 
              fee_admin, 
              fee_dock, 
              transaction_fee_start, 
              transaction_fee_end, 
              no_card_fee, 
              no_card_fee_admin, 
              no_card_fee_dock, 
              no_card_transaction_anticipation_mdr, 
              transaction_anticipation_mdr, 
              dtinsert, 
              dtupdate
            ) VALUES (
              ${generateSlug()}, 
              ${newBrand.id}, 
              ${productType.name}, 
              ${feeValue}, 
              ${feeAdminValue}, 
              ${feeDockValue}, 
              ${transactionFeeStartValue}, 
              ${transactionFeeEndValue}, 
              ${noCardFeeValue}, 
              ${noCardFeeAdminValue}, 
              ${noCardFeeDockValue}, 
              ${noCardTransactionAnticipationMdrValue}, 
              ${transactionAnticipationMdrValue}, 
              ${new Date().toISOString()}, 
              ${new Date().toISOString()}
            )
          `);
        } catch (error) {
          console.error("Erro ao inserir tipo de produto:", error);
          // Continue com o próximo tipo de produto mesmo se houver erro
          continue;
        }
      }
    }

    return newSolicitation;
  } catch (error) {
    console.error("Error creating pricing solicitation:", error);
    throw error;
  }
}

export async function updatePricingSolicitation(
  pricingSolicitation: PricingSolicitationForm
) {
  if (!pricingSolicitation.id) {
    throw new Error("Solicitation ID is required for updates");
  }

  // Update the last modified date
  if (pricingSolicitation.status === "SEND_DOCUMENTS") {
    pricingSolicitation.dtupdate = new Date().toISOString();
    pricingSolicitation.status = "PENDING";
  }

  try {
    const { brands, id, slug, idCustomers, ...solicitationData } =
      pricingSolicitation;
    console.log("solicitationData", slug, id, idCustomers);
    // 1. Update the main solicitation fee record
    await db
      .update(solicitationFee)
      .set(solicitationData)
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
        .where(
          eq(solicitationBrandProductType.solicitationFeeBrandId, brand.id)
        );
    }

    // Delete the brands
    await db
      .delete(solicitationFeeBrand)
      .where(eq(solicitationFeeBrand.solicitationFeeId, id));

    // 3. Create new brand records for each brand
    for (const brand of brands || []) {
      // Create a brand record with only the necessary fields
      const brandData = {
        slug: generateSlug(),
        solicitationFeeId: id,
        brand: brand.name,
        dtinsert: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
      };

      const [newBrand] = await db
        .insert(solicitationFeeBrand)
        .values(brandData)
        .returning({ id: solicitationFeeBrand.id });

      if (!newBrand) continue;

      // 4. Create product type records for each product type in the brand
      for (const productType of brand.productTypes || []) {
        try {
          // Verificar se está null/undefined primeiro, então converter adequadamente

          // Campos decimais - verificar se é number ou string
          const feeValue =
            productType.fee == null
              ? 0
              : typeof productType.fee === "number"
                ? productType.fee
                : typeof productType.fee === "string"
                  ? parseFloat(productType.fee) || 0
                  : 0;

          const feeAdminValue =
            productType.feeAdmin == null
              ? 0
              : typeof productType.feeAdmin === "number"
                ? productType.feeAdmin
                : typeof productType.feeAdmin === "string"
                  ? parseFloat(productType.feeAdmin) || 0
                  : 0;

          const feeDockValue =
            productType.feeDock == null
              ? 0
              : typeof productType.feeDock === "number"
                ? productType.feeDock
                : typeof productType.feeDock === "string"
                  ? parseFloat(productType.feeDock) || 0
                  : 0;

          const noCardFeeValue =
            productType.noCardFee == null
              ? 0
              : typeof productType.noCardFee === "number"
                ? productType.noCardFee
                : typeof productType.noCardFee === "string"
                  ? parseFloat(productType.noCardFee) || 0
                  : 0;

          const noCardFeeAdminValue =
            productType.noCardFeeAdmin == null
              ? 0
              : typeof productType.noCardFeeAdmin === "number"
                ? productType.noCardFeeAdmin
                : typeof productType.noCardFeeAdmin === "string"
                  ? parseFloat(productType.noCardFeeAdmin) || 0
                  : 0;

          const noCardFeeDockValue =
            productType.noCardFeeDock == null
              ? 0
              : typeof productType.noCardFeeDock === "number"
                ? productType.noCardFeeDock
                : typeof productType.noCardFeeDock === "string"
                  ? parseFloat(productType.noCardFeeDock) || 0
                  : 0;

          const noCardTransactionAnticipationMdrValue =
            productType.noCardTransactionAnticipationMdr == null
              ? 0
              : typeof productType.noCardTransactionAnticipationMdr === "number"
                ? productType.noCardTransactionAnticipationMdr
                : typeof productType.noCardTransactionAnticipationMdr ===
                    "string"
                  ? parseFloat(productType.noCardTransactionAnticipationMdr) ||
                    0
                  : 0;

          const transactionAnticipationMdrValue =
            productType.transactionAnticipationMdr == null
              ? 0
              : typeof productType.transactionAnticipationMdr === "number"
                ? productType.transactionAnticipationMdr
                : typeof productType.transactionAnticipationMdr === "string"
                  ? parseFloat(productType.transactionAnticipationMdr) || 0
                  : 0;

          // Campos inteiros - converter para number
          const transactionFeeStartValue =
            productType.transactionFeeStart == null
              ? 0
              : Number(productType.transactionFeeStart) || 0;

          const transactionFeeEndValue =
            productType.transactionFeeEnd == null
              ? 0
              : Number(productType.transactionFeeEnd) || 0;

          // Use SQL raw para fazer a inserção diretamente
          await db.execute(sql`
            INSERT INTO solicitation_brand_product_type (
              slug, 
              solicitation_fee_brand_id, 
              product_type, 
              fee, 
              fee_admin, 
              fee_dock, 
              transaction_fee_start, 
              transaction_fee_end, 
              no_card_fee, 
              no_card_fee_admin, 
              no_card_fee_dock, 
              no_card_transaction_anticipation_mdr, 
              transaction_anticipation_mdr, 
              dtinsert, 
              dtupdate
            ) VALUES (
              ${generateSlug()}, 
              ${newBrand.id}, 
              ${productType.name || "Produto Padrão"}, 
              ${feeValue}, 
              ${feeAdminValue}, 
              ${feeDockValue}, 
              ${transactionFeeStartValue}, 
              ${transactionFeeEndValue}, 
              ${noCardFeeValue}, 
              ${noCardFeeAdminValue}, 
              ${noCardFeeDockValue}, 
              ${noCardTransactionAnticipationMdrValue}, 
              ${transactionAnticipationMdrValue}, 
              ${new Date().toISOString()}, 
              ${new Date().toISOString()}
            )
          `);
        } catch (error) {
          console.error("Erro ao atualizar tipo de produto:", error);
          // Continue com o próximo tipo de produto mesmo se houver erro
          continue;
        }
      }
    }

    return { id };
  } catch (error) {
    console.error("Error updating pricing solicitation:", error);
    throw error;
  }
}

// Função para aprovar uma solicitação de taxas
export async function approvePricingSolicitation(id: number) {
  if (!id) {
    throw new Error("Solicitation ID is required for approval");
  }

  try {
    await db
      .update(solicitationFee)
      .set({
        status: "APPROVED",
        dtupdate: new Date().toISOString(),
      })
      .where(eq(solicitationFee.id, id));

    return { id, success: true };
  } catch (error) {
    console.error("Error approving pricing solicitation:", error);
    throw error;
  }
}
export async function completePricingSolicitation(id: number) {
  if (!id) {
    throw new Error("Solicitation ID is required for completion");
  }

  try {
    await db
      .update(solicitationFee)
      .set({
        status: "COMPLETED",
        dtupdate: new Date().toISOString(),
      })
      .where(eq(solicitationFee.id, id));

    return { id, success: true };
  } catch (error) {
    console.error("Error completing pricing solicitation:", error);
    throw error;
  }
}

// Função para rejeitar uma solicitação de taxas
export async function rejectPricingSolicitation(id: number, reason?: string) {
  if (!id) {
    throw new Error("Solicitation ID is required for rejection");
  }

  try {
    await db
      .update(solicitationFee)
      .set({
        status: "CANCELED",
        description: reason ? `CANCELED: ${reason}` : "CANCELED",
        dtupdate: new Date().toISOString(),
      })
      .where(eq(solicitationFee.id, id));

    return { id, success: true };
  } catch (error) {
    console.error("Error rejecting pricing solicitation:", error);
    throw error;
  }
}

// Map form data to solicitation structure
export async function mapFormDataToSolicitation(
  data: PricingSolicitationSchema
) {
  return {
    cnae: data.cnae || null,
    mcc: data.mcc || null,
    cnpjQuantity: data.cnpjsQuantity ? Number(data.cnpjsQuantity) : null,
    slug: null,
    dtinsert: new Date().toISOString(),
    dtupdate: new Date().toISOString(),
    idCustomers: null,
    monthlyPosFee: data.tpvMonthly || null,
    averageTicket: data.ticketAverage || null,
    description: data.description || null,
    cnaeInUse: data.cnaeInUse ?? null,
    cardPixMdr: data.cardPixMdr || null,
    cardPixCeilingFee: data.cardPixCeilingFee || null,
    cardPixMinimumCostFee: data.cardPixMinimumCostFee || null,
    eventualAnticipationFee: data.eventualAnticipationFee || null,
    nonCardPixMdr: data.nonCardPixMdr || null,
    nonCardPixCeilingFee: data.nonCardPixCeilingFee || null,
    nonCardPixMinimumCostFee: data.nonCardPixMinimumCostFee || null,
    nonCardEventualAnticipationFee: data.nonCardEventualAnticipationFee || null,
    cardPixMdrAdmin: data.cardPixMdrAdmin || null,
    cardPixCeilingFeeAdmin: data.cardPixCeilingFeeAdmin || null,
    cardPixMinimumCostFeeAdmin: data.cardPixMinimumCostFeeAdmin || null,
    eventualAnticipationFeeAdmin: data.eventualAnticipationFeeAdmin || null,
    nonCardPixMdrAdmin: data.nonCardPixMdrAdmin || null,
    nonCardPixCeilingFeeAdmin: data.nonCardPixCeilingFeeAdmin || null,
    nonCardPixMinimumCostFeeAdmin: data.nonCardPixMinimumCostFeeAdmin || null,
    nonCardEventualAnticipationFeeAdmin:
      data.nonCardEventualAnticipationFeeAdmin || null,

    brands: (data.brands || []).map((brand) => ({
      name: brand.name,
      productTypes: (brand.productTypes || []).map((productType) => ({
        name: productType.name,
        fee: productType.fee || "",
        feeAdmin: productType.feeAdmin || "",
        feeDock: productType.feeDock || "",
        transactionFeeStart: productType.transactionFeeStart || "",
        transactionFeeEnd: productType.transactionFeeEnd || "",
      })),
    })),
  };
}

// Função para buscar os documentos relacionados a uma solicitação de taxas (solicitationFeeId)
// Faz join entre solicitationFeeDocument e file, retornando url e name dos arquivos

export async function getDocumentsBySolicitationFeeId(
  solicitationFeeId: number
) {
  // Faz join entre solicitationFeeDocument e file usando fileId
  const documents = await db
    .select({
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      fileType: file.fileType,
      fileId: file.id,
      solicitationFeeDocumentId: solicitationFeeDocument.id,
    })
    .from(solicitationFeeDocument)
    .innerJoin(file, eq(solicitationFeeDocument.idFile, file.id))
    .where(eq(solicitationFeeDocument.solicitationFeeId, solicitationFeeId));

  return documents;
}

export async function PostPricingSolicitationEmail() {
  try {
    const email = await getUserEmail();
    console.log("email", email);
    await sendPricingSolicitationEmail(email);
  } catch (error) {
    console.error("Error sending pricing solicitation email:", error);
    throw error;
  }
}
