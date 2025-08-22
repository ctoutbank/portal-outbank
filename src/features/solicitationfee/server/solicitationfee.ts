"use server";
import { db } from "@/db/drizzle";
import { solicitationFee, customers, solicitationFeeBrand, solicitationBrandProductType, solicitationFeeDocument, file } from "../../../../drizzle/schema";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { SolicitationFeeSchema } from "../schema/schema";

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
  
  // Verificamos se sortField existe em solicitationFee e se não é undefined
  let orderByClause;
  try {
    // Primeiro garantimos que é uma propriedade válida do objeto solicitationFee
    if (sortField && sortField in solicitationFee) {
      // Agora criamos a cláusula de ordenação baseada na direção
      orderByClause = sortOrder === 'desc' ? desc(solicitationFee[sortField]) : solicitationFee[sortField];
    } else {
      // Se não for válido, usamos o id como fallback
      orderByClause = sortOrder === 'desc' ? desc(solicitationFee.id) : solicitationFee.id;
    }
  } catch (error) {
    console.error("Erro ao criar cláusula de ordenação:", error);
    // Fallback seguro
    orderByClause = sortOrder === 'desc' ? desc(solicitationFee.id) : solicitationFee.id;
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
    .orderBy(orderByClause)
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
      monthlyPosFee: number | null;
      averageTicket: number | null;
      description: string | null;
      cnaeInUse: boolean | null;
      status: string | null;
      dtinsert: string | null;
      dtupdate: string | null;
      cardPixMdr?: string | null;
      cardPixCeilingFee?: string | null;
      cardPixMinimumCostFee?: string | null;
      cardPixMdrAdmin?: string | null;
      cardPixCeilingFeeAdmin?: string | null;
      cardPixMinimumCostFeeAdmin?: string | null;
      cardPixMdrDock?: string | null;
      cardPixCeilingFeeDock?: string | null;
      cardPixMinimumCostFeeDock?: string | null;
      nonCardPixMdr?: string | null;
      nonCardPixCeilingFee?: string | null;
      nonCardPixMinimumCostFee?: string | null;
      nonCardPixMdrAdmin?: string | null;
      nonCardPixCeilingFeeAdmin?: string | null;
      nonCardPixMinimumCostFeeAdmin?: string | null;
      nonCardPixMdrDock?: string | null;
      nonCardPixCeilingFeeDock?: string | null;
      nonCardPixMinimumCostFeeDock?: string | null;
      compulsoryAnticipationConfig?: number | null;
      compulsoryAnticipationConfigAdmin?: string | null;
      compulsoryAnticipationConfigDock?: string | null;
      eventualAnticipationFee?: string | null;
      eventualAnticipationFeeAdmin?: string | null;
      eventualAnticipationFeeDock?: string | null;
      nonCardEventualAnticipationFee?: string | null;
      nonCardEventualAnticipationFeeAdmin?: string | null;
      nonCardEventualAnticipationFeeDock?: string | null;
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
          fee: number | string;
          feeAdmin: number | string;
          feeDock: number | string;
          transactionFeeStart: number | string;
          transactionFeeEnd: number | string;
          transactionAnticipationMdr: number | string;
          // Campos PIX
          pixMinimumCostFee?: string | number | null;
          pixCeilingFee?: string | number | null;
          // Campos para Não Cartão
          noCardFee?: string | number | null;
          noCardFeeAdmin?: string | number | null;
          noCardFeeDock?: string | number | null;
          noCardTransactionAnticipationMdr?: string | number | null;
          // Datas
          dtinsert?: string | Date | null;
          dtupdate?: string | Date | null;
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
    nonCardPixMdr: string | null;
    nonCardPixCeilingFee: string | null;
    nonCardPixMinimumCostFee: string | null;
    cardPixMdr: string | null;
    cardPixMdrAdmin: string | null;
    cardPixCeilingFee: string | null;
    cardPixMinimumCostFee: string | null;
    cardPixMdrDock: string | null;
    cardPixCeilingFeeDock: string | null;
    cardPixMinimumCostFeeAdmin: string | null;
    cardPixMinimumCostFeeDock: string | null;
    cardPixCeilingFeeAdmin: string | null;
    nonCardPixMdrAdmin: string | null;
    nonCardPixCeilingFeeAdmin: string | null;
    nonCardPixMinimumCostFeeAdmin: string | null;
    nonCardPixMdrDock: string | null;
    nonCardPixCeilingFeeDock: string | null;
    nonCardPixMinimumCostFeeDock: string | null;
    compulsoryAnticipationConfig: number | null;
    eventualAnticipationFee: string | null;
    eventualAnticipationFeeAdmin: string | null;
    eventualAnticipationFeeDock: string | null;
    nonCardEventualAnticipationFee: string | null;
    nonCardEventualAnticipationFeeAdmin: string | null;
    nonCardEventualAnticipationFeeDock: string | null;
    compulsoryAnticipationConfigAdmin: string | null;
    compulsoryAnticipationConfigDock: string | null;
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
    transactionAnticipationMdr: string | null;
    noCardFee: string | null;
    noCardFeeAdmin: string | null;
    noCardFeeDock: string | null;
    noCardTransactionAnticipationMdr: string | null;
  } ;
};

export async function getSolicitationFeeWithTaxes(id: number): Promise<TaxEditForm | null> {
  console.log("Iniciando consulta de taxas para solicitação ID:", id);
  
  try {
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
        nonCardPixMdr: solicitationFee.nonCardPixMdr,
        nonCardPixMdrAdmin: solicitationFee.nonCardPixMdrAdmin,
        nonCardPixMdrDock: solicitationFee.nonCardPixMdrDock,
        nonCardPixCeilingFee: solicitationFee.nonCardPixCeilingFee,
        nonCardPixCeilingFeeAdmin: solicitationFee.nonCardPixCeilingFeeAdmin,
        nonCardPixCeilingFeeDock: solicitationFee.nonCardPixCeilingFeeDock,
        nonCardPixMinimumCostFee: solicitationFee.nonCardPixMinimumCostFee,
        nonCardPixMinimumCostFeeAdmin: solicitationFee.nonCardPixMinimumCostFeeAdmin,
        nonCardPixMinimumCostFeeDock: solicitationFee.nonCardPixMinimumCostFeeDock,
        cardPixMdr: solicitationFee.cardPixMdr,
        cardPixMdrAdmin: solicitationFee.cardPixMdrAdmin,
        cardPixMdrDock: solicitationFee.cardPixMdrDock,
        cardPixCeilingFee: solicitationFee.cardPixCeilingFee,
        cardPixCeilingFeeAdmin: solicitationFee.cardPixCeilingFeeAdmin,
        cardPixCeilingFeeDock: solicitationFee.cardPixCeilingFeeDock,
        cardPixMinimumCostFee: solicitationFee.cardPixMinimumCostFee,
        cardPixMinimumCostFeeAdmin: solicitationFee.cardPixMinimumCostFeeAdmin,
        cardPixMinimumCostFeeDock: solicitationFee.cardPixMinimumCostFeeDock,
        compulsoryAnticipationConfig: solicitationFee.compulsoryAnticipationConfig,
        compulsoryAnticipationConfigAdmin: solicitationFee.compulsoryAnticipationConfigAdmin,
        compulsoryAnticipationConfigDock: solicitationFee.compulsoryAnticipationConfigDock,
        eventualAnticipationFee: solicitationFee.eventualAnticipationFee,
        eventualAnticipationFeeAdmin: solicitationFee.eventualAnticipationFeeAdmin,
        eventualAnticipationFeeDock: solicitationFee.eventualAnticipationFeeDock,
        nonCardEventualAnticipationFee: solicitationFee.nonCardEventualAnticipationFee,
        nonCardEventualAnticipationFeeAdmin: solicitationFee.nonCardEventualAnticipationFeeAdmin,
        nonCardEventualAnticipationFeeDock: solicitationFee.nonCardEventualAnticipationFeeDock,
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
        transactionAnticipationMdr: solicitationBrandProductType.transactionAnticipationMdr,
        noCardFee: solicitationBrandProductType.noCardFee,
        noCardFeeAdmin: solicitationBrandProductType.noCardFeeAdmin,
        noCardFeeDock: solicitationBrandProductType.noCardFeeDock,
        noCardTransactionAnticipationMdr: solicitationBrandProductType.noCardTransactionAnticipationMdr,
      }
    })
    .from(solicitationFee)
    .leftJoin(solicitationFeeBrand, eq(solicitationFee.id, solicitationFeeBrand.solicitationFeeId))
    .leftJoin(solicitationBrandProductType, eq(solicitationFeeBrand.id, solicitationBrandProductType.solicitationFeeBrandId))
    .where(eq(solicitationFee.id, id)) as SolicitationFeeWithTaxesResult[];

  if (result.length === 0) {

    console.log("result",result)
    
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
      fee: number | string;
      feeAdmin: number | string;
      feeDock: number | string;
      transactionFeeStart: number | string;
      transactionFeeEnd: number | string;
      transactionAnticipationMdr: number | string;
      // Campos PIX
      pixMinimumCostFee?: string | number | null;
      pixCeilingFee?: string | number | null;
      // Campos para Não Cartão
      noCardFee: string | number | null;
      noCardFeeAdmin: string | number | null;
      noCardFeeDock: string | number | null;
      noCardTransactionAnticipationMdr: string | number | null;
      // Datas
      dtinsert?: string | Date | null;
      dtupdate?: string | Date | null;
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
      
      // Manter os valores originais sem conversão
      const productType = {
        id: row.productType.id,
        slug: row.productType.slug || "",
        productType: row.productType.productType || "",
        fee: Number(row.productType.fee) || 0,
        feeAdmin: Number(row.productType.feeAdmin) || 0,
        feeDock: Number(row.productType.feeDock) || 0,
        transactionFeeStart: row.productType.transactionFeeStart || 0,
        transactionFeeEnd: row.productType.transactionFeeEnd || 0,
        transactionAnticipationMdr: Number(row.productType.transactionAnticipationMdr) || 0,
        // Manter os valores originais sem conversão
        noCardFee: row.productType.noCardFee,
        noCardFeeAdmin: row.productType.noCardFeeAdmin,
        noCardFeeDock: row.productType.noCardFeeDock,
        noCardTransactionAnticipationMdr: row.productType.noCardTransactionAnticipationMdr
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
      nonCardPixMdr: solicitationFeeData.nonCardPixMdr || "",
      nonCardPixCeilingFee: solicitationFeeData.nonCardPixCeilingFee || "",
      nonCardPixMinimumCostFee: solicitationFeeData.nonCardPixMinimumCostFee || "",
      nonCardPixMdrAdmin: solicitationFeeData.nonCardPixMdrAdmin || "",
      nonCardPixCeilingFeeAdmin: solicitationFeeData.nonCardPixCeilingFeeAdmin || "",
      nonCardPixMinimumCostFeeAdmin: solicitationFeeData.nonCardPixMinimumCostFeeAdmin || "",
      nonCardPixMdrDock: solicitationFeeData.nonCardPixMdrDock || "",
      nonCardPixCeilingFeeDock: solicitationFeeData.nonCardPixCeilingFeeDock || "",
      nonCardPixMinimumCostFeeDock: solicitationFeeData.nonCardPixMinimumCostFeeDock || "",
      cardPixCeilingFeeAdmin: solicitationFeeData.cardPixCeilingFeeAdmin || "",
      cardPixMdrAdmin: solicitationFeeData.cardPixMdrAdmin || "",
      cardPixMdr: solicitationFeeData.cardPixMdr || "",
      cardPixCeilingFee: solicitationFeeData.cardPixCeilingFee || "",
      cardPixMinimumCostFee: solicitationFeeData.cardPixMinimumCostFee || "",
      cardPixCeilingFeeDock: solicitationFeeData.cardPixCeilingFeeDock || "",
      cardPixMinimumCostFeeAdmin: solicitationFeeData.cardPixMinimumCostFeeAdmin || "",
      cardPixMinimumCostFeeDock: solicitationFeeData.cardPixMinimumCostFeeDock || "",
      cardPixMdrDock: solicitationFeeData.cardPixMdrDock || "",
     
      compulsoryAnticipationConfig: Number(solicitationFeeData.compulsoryAnticipationConfig) || 0,
      eventualAnticipationFee: solicitationFeeData.eventualAnticipationFee || "",
      eventualAnticipationFeeAdmin: solicitationFeeData.eventualAnticipationFeeAdmin || "",
      eventualAnticipationFeeDock: solicitationFeeData.eventualAnticipationFeeDock || "",
      nonCardEventualAnticipationFee: solicitationFeeData.nonCardEventualAnticipationFee || "",
      nonCardEventualAnticipationFeeAdmin: solicitationFeeData.nonCardEventualAnticipationFeeAdmin || "",
      nonCardEventualAnticipationFeeDock: solicitationFeeData.nonCardEventualAnticipationFeeDock || "",
      solicitationFeeBrands: Array.from(brandsMap.values())
    }
  };
  } catch (error) {
    console.error("Erro na consulta getSolicitationFeeWithTaxes:", error);
    throw error;
  }
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
      transactionAnticipationMdr: number;
      // Novos campos
      noCardFee?: string | number | null;
      noCardFeeAdmin?: string | number | null;
      noCardFeeDock?: string | number | null;
      noCardTransactionAnticipationMdr?: string | number | null;
    }>;
  }>,
  nonCardPixData?: {
    nonCardPixMdr: number;
    nonCardPixCeilingFee: number;
    nonCardPixMinimumCostFee: number;
    // Campos Admin e Dock para nonCardPix
    nonCardPixMdrAdmin?: number;
    nonCardPixCeilingFeeAdmin?: number;
    nonCardPixMinimumCostFeeAdmin?: number;
    nonCardPixMdrDock?: number;
    nonCardPixCeilingFeeDock?: number;
    nonCardPixMinimumCostFeeDock?: number;
    // Campos do PIX cartão
    cardPixMdr?: number;
    cardPixCeilingFee?: number;
    cardPixMinimumCostFee?: number;
    // Campos Admin e Dock para cardPix
    cardPixMdrAdmin?: number;
    cardPixCeilingFeeAdmin?: number;
    cardPixMinimumCostFeeAdmin?: number;
    cardPixMdrDock?: number;
    cardPixCeilingFeeDock?: number;
    cardPixMinimumCostFeeDock?: number;
    // Campos de antecipação
    eventualAnticipationFee?: number;
    eventualAnticipationFeeAdmin?: number;
    eventualAnticipationFeeDock?: number;
    nonCardEventualAnticipationFee?: number;
    nonCardEventualAnticipationFeeAdmin?: number;
    nonCardEventualAnticipationFeeDock?: number;
  }
): Promise<{ success: boolean; message: string; updateData?: Record<string, string | number | boolean | Date> }> {
  try {
   
    // Atualizar o status e dados de PIX na tabela solicitationFee
    const updateData: Record<string, string | number | boolean | Date> = {
      status: status,
      dtupdate: new Date().toISOString()
    };
    
    // Adicionar os campos nonCardPix e cardPix se estiverem presentes
    if (nonCardPixData) {
    
      // PIX não-cartão
      updateData.nonCardPixMdr = String(nonCardPixData.nonCardPixMdr || 0);
      
      updateData.nonCardPixCeilingFee = String(nonCardPixData.nonCardPixCeilingFee || 0);
      
      updateData.nonCardPixMinimumCostFee = String(nonCardPixData.nonCardPixMinimumCostFee || 0);
      
      // PIX não-cartão Admin
      if (nonCardPixData.nonCardPixMdrAdmin !== undefined) {
        updateData.nonCardPixMdrAdmin = String(nonCardPixData.nonCardPixMdrAdmin || 0);
      }
      
      if (nonCardPixData.nonCardPixCeilingFeeAdmin !== undefined) {
        updateData.nonCardPixCeilingFeeAdmin = String(nonCardPixData.nonCardPixCeilingFeeAdmin || 0);
      }
      
      if (nonCardPixData.nonCardPixMinimumCostFeeAdmin !== undefined) {
        updateData.nonCardPixMinimumCostFeeAdmin = String(nonCardPixData.nonCardPixMinimumCostFeeAdmin || 0);
      }
      
      // PIX não-cartão Dock
      if (nonCardPixData.nonCardPixMdrDock !== undefined) {
        updateData.nonCardPixMdrDock = String(nonCardPixData.nonCardPixMdrDock || 0);
      }
      
      if (nonCardPixData.nonCardPixCeilingFeeDock !== undefined) {
        updateData.nonCardPixCeilingFeeDock = String(nonCardPixData.nonCardPixCeilingFeeDock || 0);
      }
      
      if (nonCardPixData.nonCardPixMinimumCostFeeDock !== undefined) {
        updateData.nonCardPixMinimumCostFeeDock = String(nonCardPixData.nonCardPixMinimumCostFeeDock || 0);
      }
      
      // PIX cartão
      if (nonCardPixData.cardPixMdr !== undefined) {
        updateData.cardPixMdr = String(nonCardPixData.cardPixMdr || 0);
      }
      
      if (nonCardPixData.cardPixCeilingFee !== undefined) {
        updateData.cardPixCeilingFee = String(nonCardPixData.cardPixCeilingFee || 0);
      }
      
      if (nonCardPixData.cardPixMinimumCostFee !== undefined) {
        updateData.cardPixMinimumCostFee = String(nonCardPixData.cardPixMinimumCostFee || 0);
      }
      
      // PIX cartão Admin
      if (nonCardPixData.cardPixMdrAdmin !== undefined) {
        updateData.cardPixMdrAdmin = String(nonCardPixData.cardPixMdrAdmin || 0);
      }
      
      if (nonCardPixData.cardPixCeilingFeeAdmin !== undefined) {
        updateData.cardPixCeilingFeeAdmin = String(nonCardPixData.cardPixCeilingFeeAdmin || 0);
      }
      
      if (nonCardPixData.cardPixMinimumCostFeeAdmin !== undefined) {
        updateData.cardPixMinimumCostFeeAdmin = String(nonCardPixData.cardPixMinimumCostFeeAdmin || 0);
      }
      
      // PIX cartão Dock
      if (nonCardPixData.cardPixMdrDock !== undefined) {
        updateData.cardPixMdrDock = String(nonCardPixData.cardPixMdrDock || 0);
      }
      
      if (nonCardPixData.cardPixCeilingFeeDock !== undefined) {
        updateData.cardPixCeilingFeeDock = String(nonCardPixData.cardPixCeilingFeeDock || 0);
      }
      
      if (nonCardPixData.cardPixMinimumCostFeeDock !== undefined) {
        updateData.cardPixMinimumCostFeeDock = String(nonCardPixData.cardPixMinimumCostFeeDock || 0);
      }
      
      // Antecipação
      if (nonCardPixData.eventualAnticipationFee !== undefined) {
        updateData.eventualAnticipationFee = String(nonCardPixData.eventualAnticipationFee || 0);
      }
      
      if (nonCardPixData.eventualAnticipationFeeAdmin !== undefined) {
        updateData.eventualAnticipationFeeAdmin = String(nonCardPixData.eventualAnticipationFeeAdmin || 0);
      }
      
      if (nonCardPixData.eventualAnticipationFeeDock !== undefined) {
        updateData.eventualAnticipationFeeDock = String(nonCardPixData.eventualAnticipationFeeDock || 0);
      }
      
      if (nonCardPixData.nonCardEventualAnticipationFee !== undefined) {
        updateData.nonCardEventualAnticipationFee = String(nonCardPixData.nonCardEventualAnticipationFee || 0);
      }
      
      if (nonCardPixData.nonCardEventualAnticipationFeeAdmin !== undefined) {
        updateData.nonCardEventualAnticipationFeeAdmin = String(nonCardPixData.nonCardEventualAnticipationFeeAdmin || 0);
      }
      
      if (nonCardPixData.nonCardEventualAnticipationFeeDock !== undefined) {
        updateData.nonCardEventualAnticipationFeeDock = String(nonCardPixData.nonCardEventualAnticipationFeeDock || 0);
      }
    }
    
    // Executar a consulta SQL para atualizar
  
    
    await db
      .update(solicitationFee)
      .set(updateData)
      .where(eq(solicitationFee.id, solicitationFeeId));
    
   
    if (nonCardPixData) {
    
    }

    // Buscar todas as brands de uma vez
    const brandsResults = await db
      .select({
        id: solicitationFeeBrand.id,
        brand: solicitationFeeBrand.brand
      })
      .from(solicitationFeeBrand)
      .where(eq(solicitationFeeBrand.solicitationFeeId, solicitationFeeId));
    
    console.log("Marcas encontradas no banco:", brandsResults);

    // Criar um mapa de brands para acesso rápido
    const brandsMap = new Map<string, number>();
    brandsResults.forEach(br => {
      if (br.brand) { // Garantir que brand não é null
        brandsMap.set(br.brand, br.id);
      }
    });
    
    console.log("Mapa de marcas criado:", Object.fromEntries(brandsMap));

    // Para cada marca, buscar todos os tipos de produtos de uma vez
    for (const brand of brands) {
      console.log("Processando marca:", brand.brand);
      const brandId = brandsMap.get(brand.brand);
      
      if (brandId) {
        console.log("ID da marca encontrado:", brandId);
        // Buscar todos os tipos de produtos para esta marca de uma vez
        const productTypes = await db
          .select({
            id: solicitationBrandProductType.id,
            productType: solicitationBrandProductType.productType,
            transactionFeeStart: solicitationBrandProductType.transactionFeeStart,
            transactionFeeEnd: solicitationBrandProductType.transactionFeeEnd,
            fee: solicitationBrandProductType.fee,
            feeAdmin: solicitationBrandProductType.feeAdmin,
            feeDock: solicitationBrandProductType.feeDock,
            noCardFee: solicitationBrandProductType.noCardFee,
            noCardFeeAdmin: solicitationBrandProductType.noCardFeeAdmin,
            noCardFeeDock: solicitationBrandProductType.noCardFeeDock
          })
          .from(solicitationBrandProductType)
          .where(eq(solicitationBrandProductType.solicitationFeeBrandId, brandId));
        
        console.log("Tipos de produtos encontrados para marca", brand.brand, ":", productTypes);
        
        // Criar um mapa para encontrar produtos rapidamente
        const productTypesMap = new Map<string, number>();
        productTypes.forEach(pt => {
          if (pt.productType) {
            // Criar uma chave única que combina tipo de produto e intervalos
            const key = `${pt.productType.trim()}_${pt.transactionFeeStart}_${pt.transactionFeeEnd}`;
            productTypesMap.set(key, pt.id);
            console.log("Mapeado produto:", key, "->", pt.id);
          }
        });
        
        // Processar atualizações e inserções para esta marca
        for (const pt of brand.productTypes) {
          // Limpar espaços extras do tipo de produto
          const cleanProductType = pt.productType.trim();
          // Criar a mesma chave única para buscar no mapa
          const key = `${cleanProductType}_${pt.transactionFeeStart}_${pt.transactionFeeEnd}`;
          const existingProductTypeId = productTypesMap.get(key);
          
          
          
          if (existingProductTypeId) {
           
            // Atualizar o tipo de produto existente
            const updateData: Record<string, string | number | Date> = {
              feeAdmin: String(pt.feeAdmin),
              feeDock: String(pt.feeDock),
              transactionAnticipationMdr: String(pt.transactionAnticipationMdr),
              dtupdate: new Date().toISOString()
            };
            
            // Adicionar campos nonCard se existirem
            if (pt.noCardFeeAdmin !== undefined) {
              updateData.noCardFeeAdmin = String(pt.noCardFeeAdmin);
            }
            if (pt.noCardFeeDock !== undefined) {
              updateData.noCardFeeDock = String(pt.noCardFeeDock);
            }
            if (pt.noCardTransactionAnticipationMdr !== undefined) {
              updateData.noCardTransactionAnticipationMdr = String(pt.noCardTransactionAnticipationMdr);
            }
            
            const updateResult = await db
              .update(solicitationBrandProductType)
              .set(updateData)
              .where(eq(solicitationBrandProductType.id, existingProductTypeId))
              .returning({ 
                id: solicitationBrandProductType.id,
                feeAdmin: solicitationBrandProductType.feeAdmin,
                feeDock: solicitationBrandProductType.feeDock,
                noCardFeeAdmin: solicitationBrandProductType.noCardFeeAdmin,
                noCardFeeDock: solicitationBrandProductType.noCardFeeDock
              });
            
            console.log("Resultado da atualização:", updateResult);
          } else {
            console.log("Produto não encontrado - Inserindo novo");
            // Inserir novo tipo de produto
            const insertData: Record<string, string | number> = {
              slug: `${brandId}-${cleanProductType}`,
              solicitationFeeBrandId: brandId,
              productType: cleanProductType,
              fee: String(pt.fee),
              feeAdmin: String(pt.feeAdmin),
              feeDock: String(pt.feeDock),
              transactionFeeStart: pt.transactionFeeStart,
              transactionFeeEnd: pt.transactionFeeEnd,
              transactionAnticipationMdr: String(pt.transactionAnticipationMdr)
            };
            
            // Adicionar campos nonCard se existirem
            if (pt.noCardFee !== undefined) {
              insertData.noCardFee = String(pt.noCardFee);
            }
            if (pt.noCardFeeAdmin !== undefined) {
              insertData.noCardFeeAdmin = String(pt.noCardFeeAdmin);
            }
            if (pt.noCardFeeDock !== undefined) {
              insertData.noCardFeeDock = String(pt.noCardFeeDock);
            }
            if (pt.noCardTransactionAnticipationMdr !== undefined) {
              insertData.noCardTransactionAnticipationMdr = String(pt.noCardTransactionAnticipationMdr);
            }
            
            const insertResult = await db.insert(solicitationBrandProductType).values(insertData).returning({ 
              id: solicitationBrandProductType.id,
              feeAdmin: solicitationBrandProductType.feeAdmin,
              feeDock: solicitationBrandProductType.feeDock,
              noCardFeeAdmin: solicitationBrandProductType.noCardFeeAdmin,
              noCardFeeDock: solicitationBrandProductType.noCardFeeDock
            });
            
            console.log("Resultado da inserção:", insertResult);
          }
        }
      } else {
        console.log("Marca não encontrada:", brand.brand, "- Inserindo nova marca");
        // Inserir nova marca
        const newBrandResult = await db
          .insert(solicitationFeeBrand)
          .values({
            slug: `${solicitationFeeId}-${brand.brand}`,
            brand: brand.brand,
            solicitationFeeId: solicitationFeeId
          })
          .returning({ id: solicitationFeeBrand.id });
        
        if (newBrandResult.length > 0) {
          const newBrandId = newBrandResult[0].id;
          console.log("Nova marca inserida com ID:", newBrandId);
          
          // Inserir tipos de produtos para a nova marca
          for (const pt of brand.productTypes) {
            const cleanProductType = pt.productType.trim();
            console.log("Inserindo produto para nova marca:", cleanProductType);
            
            const insertData: Record<string, string | number> = {
              slug: `${newBrandId}-${cleanProductType}`,
              solicitationFeeBrandId: newBrandId,
              productType: cleanProductType,
              fee: String(pt.fee),
              feeAdmin: String(pt.feeAdmin),
              feeDock: String(pt.feeDock),
              transactionFeeStart: pt.transactionFeeStart,
              transactionFeeEnd: pt.transactionFeeEnd,
              transactionAnticipationMdr: String(pt.transactionAnticipationMdr)
            };
            
            // Adicionar campos nonCard se existirem
            if (pt.noCardFee !== undefined) {
              insertData.noCardFee = String(pt.noCardFee);
            }
            if (pt.noCardFeeAdmin !== undefined) {
              insertData.noCardFeeAdmin = String(pt.noCardFeeAdmin);
            }
            if (pt.noCardFeeDock !== undefined) {
              insertData.noCardFeeDock = String(pt.noCardFeeDock);
            }
            if (pt.noCardTransactionAnticipationMdr !== undefined) {
              insertData.noCardTransactionAnticipationMdr = String(pt.noCardTransactionAnticipationMdr);
            }
            
             await db.insert(solicitationBrandProductType).values(insertData).returning({ 
              id: solicitationBrandProductType.id,
              feeAdmin: solicitationBrandProductType.feeAdmin,
              feeDock: solicitationBrandProductType.feeDock,
              noCardFeeAdmin: solicitationBrandProductType.noCardFeeAdmin,
              noCardFeeDock: solicitationBrandProductType.noCardFeeDock
            });
            
            
          }
        }
      }
    }
    

    
    // Retornar o resultado da operação
    return {
      success: true,
      message: "Taxas atualizadas com sucesso",
      updateData: updateData
    };
    
  } catch (error) {
    console.error("Erro ao atualizar solicitação de tarifa:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function getSolicitationFeeDocuments(solicitationFeeId: number): Promise<Array<{ id: string; name: string; url: string }>> {
  try {
    const documents = await db
      .select({
        id: file.id,
        name: file.fileName,
        url: file.fileUrl
      })
      .from(solicitationFeeDocument)
      .innerJoin(file, eq(solicitationFeeDocument.idFile, file.id))
      .where(eq(solicitationFeeDocument.solicitationFeeId, solicitationFeeId));

    return documents.map(doc => ({
      id: String(doc.id),
      name: doc.name || `documento-${doc.id}`,
      url: doc.url || ''
    }));
  } catch (error) {
    console.error("Erro ao buscar documentos da solicitação:", error);
    throw error;
  }
}



