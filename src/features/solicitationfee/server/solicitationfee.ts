"use server";
import { db } from "@/db/drizzle";
import { solicitationFee, customers, solicitationFeeBrand, solicitationBrandProductType } from "../../../../drizzle/schema";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { SolicitationFeeSchema } from "../schema/schema";
import { generateSlug } from "@/lib/utils";

export type SolicitationFeeInsert = typeof solicitationFee.$inferInsert;
export type SolicitationFeeDetail = typeof solicitationFee.$inferSelect;

export async function getSolicitationFees(
  search?: string,
  page: number = 1,
  pageSize: number = 10,
  cnae?: string,
  status?: string,
  sortField: keyof typeof solicitationFee.$inferSelect = 'id',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ 
  solicitationFees: SolicitationFeeFull[],
  totalCount: number
}> {
  const offset = (page - 1) * pageSize;
  
  const whereConditions = [];
  
  if (search) {
    whereConditions.push(
      or(
        ilike(solicitationFee.cnae, `%${search}%`),
        ilike(solicitationFee.slug, `%${search}%`),
        ilike(solicitationFee.status, `%${search}%`)
      )
    );
  }
  
  if (cnae) {
    whereConditions.push(ilike(solicitationFee.cnae, `%${cnae}%`));
  }
  
  if (status) {
    whereConditions.push(ilike(solicitationFee.status, `%${status}%`));
  }
  
  const result = await db
    .select({
      id: solicitationFee.id,
      slug: solicitationFee.slug,
      cnae: solicitationFee.cnae,
      idCustomers: solicitationFee.idCustomers,
      mcc: solicitationFee.mcc,
      cnpjQuantity: solicitationFee.cnpjQuantity,
      monthlyPosFee: solicitationFee.monthlyPosFee,
      averageTicket: solicitationFee.averageTicket,
      description: solicitationFee.description,
      cnaeInUse: solicitationFee.cnaeInUse,
      status: solicitationFee.status,
      dtinsert: solicitationFee.dtinsert,
      dtupdate: solicitationFee.dtupdate,
      customerName: customers.name
    })
    .from(solicitationFee)
    .leftJoin(customers, eq(solicitationFee.idCustomers, customers.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(sortOrder === 'desc' ? desc(solicitationFee[sortField]) : solicitationFee[sortField])
    .limit(pageSize)
    .offset(offset);
    
  const totalCountResult = await db
    .select({ count: count() })
    .from(solicitationFee)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    
  const totalCount = totalCountResult[0]?.count || 0;
  
  return {
    solicitationFees: result.map(fee => ({
      id: Number(fee.id),
      slug: fee.slug || "",
      cnae: fee.cnae || "",
      idCustomers: Number(fee.idCustomers) || 0,
      customerName: fee.customerName || "",
      mcc: fee.mcc || "",
      cnpjQuantity: Number(fee.cnpjQuantity) || 0,
      monthlyPosFee: fee.monthlyPosFee ? Number(fee.monthlyPosFee) : 0,
      averageTicket: fee.averageTicket ? Number(fee.averageTicket) : 0,
      description: fee.description || "",
      cnaeInUse: Boolean(fee.cnaeInUse),
      status: fee.status || "",
      dtinsert: fee.dtinsert || "",
      dtupdate: fee.dtupdate || ""
    })),
    totalCount
  };
}

export async function getSolicitationFeeById(id: number): Promise<SolicitationFeeDetail | null> {
    const fee = await db.select().from(solicitationFee).where(eq(solicitationFee.id, id));
    return fee[0] || null;
}

export async function insertSolicitationFee(fee: SolicitationFeeInsert): Promise<number> {
    const feeInsert = await db.insert(solicitationFee).values(fee).returning({ id: solicitationFee.id });
    return feeInsert[0].id;
}

export async function updateSolicitationFee(fee: SolicitationFeeSchema): Promise<number> {
    if (!fee.id) {
        throw new Error("ID da solicitação é necessário para atualização");
    }
    
    try {
        const feeUpdate = await db.update(solicitationFee)
            .set({
                slug: fee.slug || "",
                cnae: fee.cnae || null,
                idCustomers: fee.idCustomers || null,
                mcc: fee.mcc || null,
                cnpjQuantity: fee.cnpjQuantity || null,
                monthlyPosFee: fee.monthlyPosFee !== undefined ? String(fee.monthlyPosFee) : null,
                averageTicket: fee.averageTicket !== undefined ? String(fee.averageTicket) : null,
                description: fee.description || null,
                cnaeInUse: fee.cnaeInUse || null,
                status: fee.status || null
            })
            .where(eq(solicitationFee.id, Number(fee.id)))
            .returning({ id: solicitationFee.id });
        
        return feeUpdate[0].id;
    } catch (error) {
        console.error("Erro ao atualizar solicitação de tarifa:", error);
        throw error;
    }
}

export async function deleteSolicitationFee(id: number): Promise<number> {
    const feeDelete = await db.delete(solicitationFee).where(eq(solicitationFee.id, id)).returning({ id: solicitationFee.id });
    return feeDelete[0].id;
}

export type SolicitationFeeFull = {
    id: number,
    slug: string,
    cnae: string,
    idCustomers: number,
    customerName: string,
    mcc: string,
    cnpjQuantity: number,
    monthlyPosFee: number,
    averageTicket: number,
    description: string,
    cnaeInUse: boolean,
    status: string,
    dtinsert: string,
    dtupdate: string
}

export interface SolicitationFeelist {
    solicitationFees: SolicitationFeeFull[],
    totalCount: number
} 

export type TaxEditForm = {
    solicitationFee: {
      id: number;
      slug: string;
      cnae: string;
      idCustomers: number;
      mcc: string;
      cnpjQuantity: number;
      monthlyPosFee: number;
      averageTicket: number;
      description: string;
      cnaeInUse: boolean;
      status: string;
      dtinsert: string;
      dtupdate: string;
      solicitationFeeBrands: Array<{
        id: number;
        slug: string;
        brand: string;
        solicitationFeeId: number;
        dtinsert: string;
        dtupdate: string;
        solicitationBrandProductTypes: Array<{
          id: number;
          slug: string;
          productType: string;
          fee: number;
          feeAdmin: number;
          feeDock: number;
          transactionFeeStart: number;
          transactionFeeEnd: number;
          pixMinimumCostFee: number;
          pixCeilingFee: number;
          transactionAnticipationMdr: number;
        }>;
      }>;
    };
  };
  




type SolicitationFeeWithTaxesResult = {
  solicitationFee: {
    id: number;
    slug: string | null;
    cnae: string | null;
    idCustomers: number | null;
    mcc: string | null;
    cnpjQuantity: number | null;
    monthlyPosFee: string | null;
    averageTicket: string | null;
    description: string | null;
    cnaeInUse: boolean | null;
    status: string | null;
    dtinsert: string | null;
    dtupdate: string | null;
  };
  brand: {
    id: number;
    slug: string | null;
    brand: string | null;
    solicitationFeeId: number;
    dtinsert: string | null;
    dtupdate: string | null;
  } | null;
  productType: {
    id: number;
    slug: string | null;
    productType: string | null;
    fee: string | null;
    feeAdmin: string | null;
    feeDock: string | null;
    transactionFeeStart: number | null;
    transactionFeeEnd: number | null;
    pixMinimumCostFee: string | null;
    pixCeilingFee: string | null;
    transactionAnticipationMdr: string | null;
  } | null;
};

export async function getSolicitationFeeWithTaxes(id: number): Promise<TaxEditForm | null> {
  const result = await db
    .select({
      solicitationFee: {
        id: solicitationFee.id,
        slug: solicitationFee.slug,
        cnae: solicitationFee.cnae,
        idCustomers: solicitationFee.idCustomers,
        mcc: solicitationFee.mcc,
        cnpjQuantity: solicitationFee.cnpjQuantity,
        monthlyPosFee: solicitationFee.monthlyPosFee,
        averageTicket: solicitationFee.averageTicket,
        description: solicitationFee.description,
        cnaeInUse: solicitationFee.cnaeInUse,
        status: solicitationFee.status,
        dtinsert: solicitationFee.dtinsert,
        dtupdate: solicitationFee.dtupdate,
      },
      brand: {
        id: solicitationFeeBrand.id,
        slug: solicitationFeeBrand.slug,
        brand: solicitationFeeBrand.brand,
        solicitationFeeId: solicitationFeeBrand.solicitationFeeId,
        dtinsert: solicitationFeeBrand.dtinsert,
        dtupdate: solicitationFeeBrand.dtupdate,
      },
      productType: {
        id: solicitationBrandProductType.id,
        slug: solicitationBrandProductType.slug,
        productType: solicitationBrandProductType.productType,
        fee: solicitationBrandProductType.fee,
        feeAdmin: solicitationBrandProductType.feeAdmin,
        feeDock: solicitationBrandProductType.feeDock,
        transactionFeeStart: solicitationBrandProductType.transactionFeeStart,
        transactionFeeEnd: solicitationBrandProductType.transactionFeeEnd,
        pixMinimumCostFee: solicitationBrandProductType.pixMinimumCostFee,
        pixCeilingFee: solicitationBrandProductType.pixCeilingFee,
        transactionAnticipationMdr: solicitationBrandProductType.transactionAnticipationMdr,
      }
    })
    .from(solicitationFee)
    .leftJoin(solicitationFeeBrand, eq(solicitationFee.id, solicitationFeeBrand.solicitationFeeId))
    .leftJoin(solicitationBrandProductType, eq(solicitationFeeBrand.id, solicitationBrandProductType.solicitationFeeBrandId))
    .where(eq(solicitationFee.id, id)) as SolicitationFeeWithTaxesResult[];

  if (result.length === 0) {
    return null;
  }

  // Agrupar os resultados
  const solicitationFeeData = result[0].solicitationFee;
  const brandsMap = new Map<number, {
    id: number;
    slug: string;
    brand: string;
    solicitationFeeId: number;
    dtinsert: string;
    dtupdate: string;
    solicitationBrandProductTypes: Array<{
      id: number;
      slug: string;
      productType: string;
      fee: number;
      feeAdmin: number;
      feeDock: number;
      transactionFeeStart: number;
      transactionFeeEnd: number;
      pixMinimumCostFee: number;
      pixCeilingFee: number;
      transactionAnticipationMdr: number;
    }>;
  }>();

  result.forEach((row: SolicitationFeeWithTaxesResult) => {
    if (row.brand && row.productType) {
      if (!brandsMap.has(row.brand.id)) {
        brandsMap.set(row.brand.id, {
          id: row.brand.id,
          slug: row.brand.slug || "",
          brand: row.brand.brand || "",
          solicitationFeeId: row.brand.solicitationFeeId,
          dtinsert: row.brand.dtinsert || "",
          dtupdate: row.brand.dtupdate || "",
          solicitationBrandProductTypes: []
        });
      }
      const productType = {
        id: row.productType.id,
        slug: row.productType.slug || "",
        productType: row.productType.productType || "",
        fee: Number(row.productType.fee) || 0,
        feeAdmin: Number(row.productType.feeAdmin) || 0,
        feeDock: Number(row.productType.feeDock) || 0,
        transactionFeeStart: row.productType.transactionFeeStart || 0,
        transactionFeeEnd: row.productType.transactionFeeEnd || 0,
        pixMinimumCostFee: Number(row.productType.pixMinimumCostFee) || 0,
        pixCeilingFee: Number(row.productType.pixCeilingFee) || 0,
        transactionAnticipationMdr: Number(row.productType.transactionAnticipationMdr) || 0
      };
      brandsMap.get(row.brand.id)?.solicitationBrandProductTypes.push(productType);
    }
  });

  return {
    solicitationFee: {
      id: solicitationFeeData.id,
      slug: solicitationFeeData.slug || "",
      cnae: solicitationFeeData.cnae || "",
      idCustomers: solicitationFeeData.idCustomers || 0,
      mcc: solicitationFeeData.mcc || "",
      cnpjQuantity: solicitationFeeData.cnpjQuantity || 0,
      monthlyPosFee: Number(solicitationFeeData.monthlyPosFee) || 0,
      averageTicket: Number(solicitationFeeData.averageTicket) || 0,
      description: solicitationFeeData.description || "",
      cnaeInUse: Boolean(solicitationFeeData.cnaeInUse),
      status: solicitationFeeData.status || "",
      dtinsert: solicitationFeeData.dtinsert || "",
      dtupdate: solicitationFeeData.dtupdate || "",
      solicitationFeeBrands: Array.from(brandsMap.values())
    }
  };
}


export async function updateSolicitationFeeBrandsWithTaxes(
  solicitationFeeId: number,
  status: string,
  brands: Array<{
    brand: string;
    productTypes: Array<{
      productType: string;
      fee: number;
      feeAdmin: number;
      feeDock: number;
      transactionFeeStart: number;
      transactionFeeEnd: number;
      pixMinimumCostFee: number;
      pixCeilingFee: number;
      transactionAnticipationMdr: number;
    }>;
  }>
): Promise<void> {
  // Atualizar o status na tabela solicitationFee
  await db
    .update(solicitationFee)
    .set({
      status: status,
      dtupdate: new Date().toISOString()
    })
    .where(eq(solicitationFee.id, solicitationFeeId));

  for (const brand of brands) {
    // Buscar a brand existente pelo nome e solicitationFeeId
    const existingBrands = await db
      .select()
      .from(solicitationFeeBrand)
      .where(
        and(
          eq(solicitationFeeBrand.brand, brand.brand),
          eq(solicitationFeeBrand.solicitationFeeId, solicitationFeeId)
        )
      );

    if (existingBrands.length > 0) {
      const existingBrand = existingBrands[0];

      // Atualizar os product types para esta brand
      for (const productType of brand.productTypes) {
        const existingProductTypes = await db
          .select()
          .from(solicitationBrandProductType)
          .where(
            and(
              eq(solicitationBrandProductType.solicitationFeeBrandId, existingBrand.id),
              eq(solicitationBrandProductType.productType, productType.productType)
            )
          );

        if (existingProductTypes.length > 0) {
          // Atualizar campos feeAdmin e feeDock
          await db
            .update(solicitationBrandProductType)
            .set({
             
              feeAdmin: String(productType.feeAdmin),
              feeDock: String(productType.feeDock),
              transactionFeeStart: productType.transactionFeeStart,
              transactionFeeEnd: productType.transactionFeeEnd,
              pixMinimumCostFee: String(productType.pixMinimumCostFee),
              pixCeilingFee: String(productType.pixCeilingFee),
              transactionAnticipationMdr: String(productType.transactionAnticipationMdr),
              dtupdate: new Date().toISOString()
            })
            .where(eq(solicitationBrandProductType.id, existingProductTypes[0].id));
        }
      }
    }
  }
}


