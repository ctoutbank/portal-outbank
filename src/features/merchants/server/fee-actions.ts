"use server";

import { db } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { fee, feeBrand, feeBrandProductType, customers } from "../../../../drizzle/schema";
import { getCurrentUserCustomerId } from "./merchant-crud";

// Definição dos tipos de dados conforme Outbank-One
export interface FeeData {
  id: string;
  active: boolean;
  dtinsert: string;
  dtupdate: string;
  mcc: string;
  cnae: string;
  code: string;
  name: string;
  tableType: string;
  compulsoryAnticipationConfig: string;
  eventualAnticipationFee: string;
  anticipationType: string;
  cardPixMdr: string;
  cardPixCeilingFee: string;
  cardPixMinimumCostFee: string;
  nonCardPixMdr: string;
  nonCardPixCeilingFee: string;
  nonCardPixMinimumCostFee: string;
  feeBrand: FeeBrand[];
  slug: string;
  feeCredit?: FeeCredit[];
}

export interface FeeBrand {
  id: number;
  slug: string;
  active: boolean;
  dtinsert: string;
  dtupdate: string;
  brand: string;
  idGroup: number;
  idFee: number;
  feeBrandProductType: feeBrandProductType[];
}

export interface feeBrandProductType {
  id: number;
  slug: string;
  active: boolean;
  dtinsert: string;
  dtupdate: string;
  installmentTransactionFeeStart: number;
  installmentTransactionFeeEnd: number;
  cardTransactionFee: number;
  cardTransactionMdr: number;
  nonCardTransactionFee: number;
  nonCardTransactionMdr: number;
  producttype: string;
  idFeeBrand: number;
}

export interface FeeCredit {
  id: number;
  installmentNumber: number;
  compulsoryAnticipation: string | null;
  noCardCompulsoryAnticipation: string | null;
  idFeeBrandProductType: number;
}

// Função para mapear dados do DB para o formato da FeeData conforme Outbank-One
function mapDbDataToFeeData(
  feeData: any,
  feeBrands: any[],
  feeBrandProductTypes: any[]
): FeeData {
  // Agrupando os dados por marca (bandeira)
  const brandDetails: FeeBrand[] = [];

  for (const brandItem of feeBrands) {
    const productTypes = feeBrandProductTypes.filter(
      (pt) => pt.idFeeBrand === brandItem.id
    );

    const modos: feeBrandProductType[] = productTypes.map((pt) => ({
      id: pt.id || 0,
      slug: pt.slug || "",
      active: pt.active ?? true,
      dtinsert: pt.dtinsert || new Date().toISOString(),
      dtupdate: pt.dtupdate || new Date().toISOString(),
      producttype: pt.producttype || "",
      cardTransactionMdr: pt.cardTransactionMdr || 0,
      nonCardTransactionMdr: pt.nonCardTransactionMdr || 0,
      cardTransactionFee: pt.cardTransactionFee || 0,
      nonCardTransactionFee: pt.nonCardTransactionFee || 0,
      installmentTransactionFeeStart: pt.installmentTransactionFeeStart || 0,
      installmentTransactionFeeEnd: pt.installmentTransactionFeeEnd || 0,
      idFeeBrand: pt.idFeeBrand || 0,
    }));

    // Adicionando a bandeira aos detalhes
    brandDetails.push({
      id: brandItem.id || 0,
      slug: brandItem.slug || "",
      active: brandItem.active ?? true,
      dtinsert: brandItem.dtinsert || new Date().toISOString(),
      dtupdate: brandItem.dtupdate || new Date().toISOString(),
      brand: brandItem.brand || "",
      idGroup: brandItem.idGroup || 0,
      idFee: brandItem.idFee || 0,
      feeBrandProductType: modos,
    });
  }

  return {
    id: feeData.id?.toString() || "0",
    active: feeData.active ?? true,
    dtinsert: feeData.dtinsert || new Date().toISOString(),
    dtupdate: feeData.dtupdate || new Date().toISOString(),
    mcc: feeData.mcc || "",
    cnae: feeData.cnae || "",
    code: feeData.code || "",
    name: feeData.name || "",
    tableType: feeData.tableType || "SIMPLE",
    compulsoryAnticipationConfig: feeData.compulsoryAnticipationConfig?.toString() || "0",
    eventualAnticipationFee: feeData.eventualAnticipationFee?.toString() || "0",
    anticipationType: feeData.anticipationType || "NOANTECIPATION",
    cardPixMdr: feeData.cardPixMdr?.toString() || "0",
    cardPixCeilingFee: feeData.cardPixCeilingFee?.toString() || "0",
    cardPixMinimumCostFee: feeData.cardPixMinimumCostFee?.toString() || "0",
    nonCardPixMdr: feeData.nonCardPixMdr?.toString() || "0",
    nonCardPixCeilingFee: feeData.nonCardPixCeilingFee?.toString() || "0",
    nonCardPixMinimumCostFee: feeData.nonCardPixMinimumCostFee?.toString() || "0",
    feeBrand: brandDetails,
    slug: feeData.slug || "",
  };
}

export async function getFeesAction(page = 1, pageSize = 100) {
  try {
    const customerId = await getCurrentUserCustomerId();

    if (!customerId) {
      return {
        fees: [],
        totalRecords: 0,
        currentPage: page,
        pageSize,
      };
    }

    const offset = (page - 1) * pageSize;

    // Verificar se a tabela fee tem idCustomer
    // Se não tiver, buscar todas as fees ativas
    const paginatedFees = await db
      .select({
        id: fee.id,
        name: fee.name,
        tableType: fee.tableType,
        code: fee.code,
        mcc: fee.mcc,
        cnae: fee.cnae,
        compulsoryAnticipationConfig: fee.compulsoryAnticipationConfig,
        eventualAnticipationFee: fee.eventualAnticipationFee,
        anticipationType: fee.anticipationType,
        slug: fee.slug,
        active: fee.active,
        dtinsert: fee.dtinsert,
        dtupdate: fee.dtupdate,
        cardPixMdr: fee.cardPixMdr,
        cardPixCeilingFee: fee.cardPixCeilingFee,
        cardPixMinimumCostFee: fee.cardPixMinimumCostFee,
        nonCardPixMdr: fee.nonCardPixMdr,
        nonCardPixCeilingFee: fee.nonCardPixCeilingFee,
        nonCardPixMinimumCostFee: fee.nonCardPixMinimumCostFee,
      })
      .from(fee)
      .where(eq(fee.active, true))
      .limit(pageSize)
      .offset(offset);

    // Contar total de registros
    const totalFees = await db
      .select({ id: fee.id })
      .from(fee)
      .where(eq(fee.active, true));

    const totalRecords = totalFees.length;

    const feeDataList: FeeData[] = [];

    for (const f of paginatedFees) {
      const brands = await db
        .select()
        .from(feeBrand)
        .where(eq(feeBrand.idFee, f.id));

      const brandIds = brands.map((b) => b.id);

      const productTypes = brandIds.length
        ? await db
            .select()
            .from(feeBrandProductType)
            .where(inArray(feeBrandProductType.idFeeBrand, brandIds))
        : [];

      feeDataList.push(mapDbDataToFeeData(f, brands, productTypes));
    }

    return {
      fees: feeDataList,
      totalRecords,
      currentPage: page,
      pageSize,
    };
  } catch (error) {
    console.error("Erro ao buscar taxas:", error);
    return {
      fees: [],
      totalRecords: 0,
      currentPage: page,
      pageSize,
    };
  }
}

