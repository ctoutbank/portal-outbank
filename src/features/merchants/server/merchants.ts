"use server";

import { db } from "@/lib/db";
import { merchants, customers, addresses, salesAgents, configurations, merchantPrice, legalNatures, categories, contacts, merchantBankAccounts, merchantpixaccount } from "../../../../drizzle/schema";
import { eq, and, ilike, or, inArray, count, desc, gte, lte, asc } from "drizzle-orm";
import { getCurrentUserInfo, isSuperAdmin, hasMerchantsAccess } from "@/lib/permissions/check-permissions";

export interface MerchantListItem {
  merchantid: number;
  slug: string;
  active: boolean;
  name: string;
  email: string;
  phone_type: string;
  revenue: number | null;
  id_category: number | null;
  kic_status: string;
  addressname: string | null;
  time_zone: string | null;
  dtinsert: string;
  dtupdate: string | null;
  lockCpAnticipationOrder: boolean | null;
  lockCnpAnticipationOrder: boolean | null;
  idConfiguration: number | null;
  idmerchantbankaccount: number | null;
  idcontact: number | null;
  idmerchantpixaccount: number | null;
  idmerchantprice: number | null;
  sales_agent: string | null;
  state: string | null;
  cnpj: string | null;
  corporate_name: string | null;
  slug_category: string | null;
  areaCode: string | null;
  number: string | null;
  priceTable: string | null;
  hasPix: boolean | null;
  salesAgentDocument: string | null;
  city: string | null;
  legalNature: string | null;
  MCC: string | null;
  CNAE: string | null;
  Inclusion: string | null;
  dtdelete: string | null;
  customerName: string | null;
  customerSlug: string | null;
}

export interface MerchantsListResult {
  merchants: MerchantListItem[];
  totalCount: number;
  active_count: number;
  inactive_count: number;
  pending_kyc_count: number;
  approved_kyc_count: number;
  rejected_kyc_count: number;
  cp_anticipation_count: number;
  cnp_anticipation_count: number;
}

/**
 * Obtém lista de ISOs disponíveis para filtro
 * Super Admin vê todos os ISOs ativos
 * Outros usuários veem apenas os ISOs aos quais têm acesso
 */
export async function getAvailableCustomersForFilter(): Promise<Array<{ id: number; name: string | null }>> {
  const userInfo = await getCurrentUserInfo();
  
  if (!userInfo) {
    return [];
  }

  // Super Admin vê todos os ISOs ativos
  if (userInfo.isSuperAdmin) {
    const result = await db
      .select({
        id: customers.id,
        name: customers.name,
      })
      .from(customers)
      .where(eq(customers.isActive, true))
      .orderBy(asc(customers.name));

    return result;
  }

  // Outros usuários veem apenas ISOs permitidos
  if (userInfo.allowedCustomers && userInfo.allowedCustomers.length > 0) {
    const result = await db
      .select({
        id: customers.id,
        name: customers.name,
      })
      .from(customers)
      .where(
        and(
          inArray(customers.id, userInfo.allowedCustomers),
          eq(customers.isActive, true)
        )
      )
      .orderBy(asc(customers.name));

    return result;
  }

  return [];
}

export interface MerchantSuggestion {
  id: number;
  name: string | null;
  corporateName: string | null;
  slug: string | null;
  idDocument: string | null;
}

/**
 * Obtém lista de estabelecimentos para sugestões de autocomplete
 * Retorna até 1000 estabelecimentos para performance
 * Respeita as mesmas permissões de getAllMerchants
 */
export async function getMerchantSuggestions(): Promise<MerchantSuggestion[]> {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo) {
    return []; // Retorna vazio se não autenticado
  }

  const isSuper = userInfo.isSuperAdmin;
  const userHasMerchantsAccess = await hasMerchantsAccess();

  if (!isSuper && !userHasMerchantsAccess) {
    return []; // Retorna vazio se não tiver acesso
  }

  const whereConditions = [];

  // Se não for Super Admin, filtrar pelos ISOs que o usuário tem acesso
  if (!isSuper && userHasMerchantsAccess && userInfo.allowedCustomers && userInfo.allowedCustomers.length > 0) {
    whereConditions.push(inArray(merchants.idCustomer, userInfo.allowedCustomers));
  } else if (!isSuper && userHasMerchantsAccess && (!userInfo.allowedCustomers || userInfo.allowedCustomers.length === 0)) {
    return []; // Se tem a permissão mas não tem ISOs associados, retorna vazio
  }

  // Buscar apenas os campos necessários para sugestões (limitado a 1000 para performance)
  const result = await db
    .select({
      id: merchants.id,
      name: merchants.name,
      corporateName: merchants.corporateName,
      slug: merchants.slug,
      idDocument: merchants.idDocument,
    })
    .from(merchants)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(asc(merchants.name))
    .limit(1000); // Limite razoável para performance

  return result;
}

/**
 * Obtém lista de estabelecimentos com filtros
 * Super Admin vê estabelecimentos de todos os ISOs
 * Outros usuários veem apenas estabelecimentos dos ISOs aos quais têm acesso
 */
export async function getAllMerchants(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    search?: string;
    customerId?: number;
    establishment?: string;
    status?: string;
    state?: string;
    dateFrom?: string;
    email?: string;
    cnpj?: string;
    active?: string;
    salesAgent?: string;
  }
): Promise<MerchantsListResult> {
  const userInfo = await getCurrentUserInfo();
  
  if (!userInfo) {
    throw new Error("Usuário não autenticado");
  }

  // Verificar acesso
  const isSuper = await isSuperAdmin();
  const hasAccess = await hasMerchantsAccess();
  
  if (!hasAccess) {
    throw new Error("Acesso negado: você não tem permissão para visualizar estabelecimentos");
  }

  const offset = (page - 1) * pageSize;
  const whereConditions = [];

  // Restrição por ISOs do usuário (exceto Super Admin)
  if (!isSuper && userInfo.allowedCustomers && userInfo.allowedCustomers.length > 0) {
    whereConditions.push(inArray(merchants.idCustomer, userInfo.allowedCustomers));
  } else if (!isSuper) {
    // Usuário sem ISOs permitidos retorna lista vazia
    return {
      merchants: [],
      totalCount: 0,
      active_count: 0,
      inactive_count: 0,
      pending_kyc_count: 0,
      approved_kyc_count: 0,
      rejected_kyc_count: 0,
      cp_anticipation_count: 0,
      cnp_anticipation_count: 0,
    };
  }

  // Filtro por ISO (opcional, mas validar acesso)
  if (filters?.customerId) {
    // Validar que o usuário tem acesso a este ISO (exceto Super Admin)
    if (!isSuper && userInfo.allowedCustomers && !userInfo.allowedCustomers.includes(filters.customerId)) {
      throw new Error("Acesso negado: você não tem permissão para visualizar estabelecimentos deste ISO");
    }
    whereConditions.push(eq(merchants.idCustomer, filters.customerId));
  }

  // Filtro de busca
  if (filters?.search) {
    whereConditions.push(
      or(
        ilike(merchants.name, `%${filters.search}%`),
        ilike(merchants.corporateName, `%${filters.search}%`)
      )
    );
  }

  // Filtro por estabelecimento
  if (filters?.establishment) {
    whereConditions.push(ilike(merchants.name, `%${filters.establishment}%`));
  }

  // Filtro por status KYC
  if (filters?.status) {
    if (filters.status === "all") {
      // Não aplica filtro
    } else if (filters.status === "PENDING") {
      whereConditions.push(
        inArray(merchants.riskAnalysisStatus, [
          "PENDING",
          "WAITINGDOCUMENTS",
          "NOTANALYSED",
        ])
      );
    } else if (filters.status === "APPROVED") {
      whereConditions.push(eq(merchants.riskAnalysisStatus, "APPROVED"));
    } else if (filters.status === "DECLINED") {
      whereConditions.push(
        inArray(merchants.riskAnalysisStatus, ["DECLINED", "KYCOFFLINE"])
      );
    } else {
      whereConditions.push(eq(merchants.riskAnalysisStatus, filters.status));
    }
  }

  // Filtro por estado
  if (filters?.state) {
    whereConditions.push(eq(addresses.state, filters.state));
  }

  // Filtro por data
  if (filters?.dateFrom) {
    const date = new Date(filters.dateFrom);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const startOfDay = new Date(year, month, day, 0, 0, 0).toISOString();
    whereConditions.push(gte(merchants.dtinsert, startOfDay));
  }

  // Filtro por email
  if (filters?.email) {
    whereConditions.push(ilike(merchants.email, `%${filters.email}%`));
  }

  // Filtro por CNPJ
  if (filters?.cnpj) {
    whereConditions.push(ilike(merchants.idDocument, `%${filters.cnpj}%`));
  }

  // Filtro por ativo/inativo
  if (filters?.active === "true") {
    whereConditions.push(eq(merchants.active, true));
  } else if (filters?.active === "false") {
    whereConditions.push(eq(merchants.active, false));
  }

  // Filtro por consultor de vendas
  if (filters?.salesAgent) {
    whereConditions.push(
      or(
        ilike(salesAgents.firstName, `%${filters.salesAgent}%`),
        ilike(salesAgents.lastName, `%${filters.salesAgent}%`),
        ilike(salesAgents.documentId, `%${filters.salesAgent}%`)
      )
    );
  }

  // Contar total
  const totalCountResult = await db
    .select({ count: count() })
    .from(merchants)
    .leftJoin(customers, eq(merchants.idCustomer, customers.id))
    .leftJoin(addresses, eq(merchants.idAddress, addresses.id))
    .leftJoin(salesAgents, eq(merchants.idSalesAgent, salesAgents.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const totalCount = totalCountResult[0]?.count || 0;

  // Buscar merchants
  const result = await db
    .select({
      merchantid: merchants.id,
      slug: merchants.slug,
      active: merchants.active,
      name: merchants.name,
      email: merchants.email,
      phone_type: merchants.phoneType,
      revenue: merchants.revenue,
      id_category: merchants.idCategory,
      kic_status: merchants.riskAnalysisStatus,
      addressname: addresses.streetAddress,
      time_zone: merchants.timezone,
      dtinsert: merchants.dtinsert,
      dtupdate: merchants.dtupdate,
      lockCpAnticipationOrder: configurations.lockCpAnticipationOrder,
      lockCnpAnticipationOrder: configurations.lockCnpAnticipationOrder,
      idConfiguration: merchants.idConfiguration,
      idmerchantbankaccount: merchants.idMerchantBankAccount,
      idcontact: contacts.id,
      idmerchantpixaccount: merchantpixaccount.id,
      idmerchantprice: merchants.idMerchantPrice,
      sales_agent: salesAgents.firstName,
      state: addresses.state,
      cnpj: merchants.idDocument,
      corporate_name: merchants.corporateName,
      slug_category: merchants.slugCategory,
      areaCode: merchants.areaCode,
      number: merchants.number,
      priceTable: merchantPrice.name,
      hasPix: merchants.hasPix,
      salesAgentDocument: salesAgents.documentId,
      city: addresses.city,
      legalNature: legalNatures.name,
      MCC: categories.mcc,
      CNAE: categories.cnae,
      Inclusion: merchants.inclusion,
      dtdelete: merchants.dtdelete,
      customerName: customers.name,
      customerSlug: customers.slug,
    })
    .from(merchants)
    .leftJoin(customers, eq(merchants.idCustomer, customers.id))
    .leftJoin(addresses, eq(merchants.idAddress, addresses.id))
    .leftJoin(salesAgents, eq(merchants.idSalesAgent, salesAgents.id))
    .leftJoin(configurations, eq(merchants.idConfiguration, configurations.id))
    .leftJoin(merchantPrice, eq(merchants.idMerchantPrice, merchantPrice.id))
    .leftJoin(legalNatures, eq(merchants.idLegalNature, legalNatures.id))
    .leftJoin(categories, eq(merchants.idCategory, categories.id))
    .leftJoin(merchantBankAccounts, eq(merchants.idMerchantBankAccount, merchantBankAccounts.id))
    .leftJoin(contacts, eq(merchants.id, contacts.idMerchant))
    .leftJoin(merchantpixaccount, eq(merchants.id, merchantpixaccount.idMerchant))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(merchants.dtinsert))
    .limit(pageSize)
    .offset(offset);

  // Contagens adicionais
  const activeCountResult = await db
    .select({ count: count() })
    .from(merchants)
    .leftJoin(customers, eq(merchants.idCustomer, customers.id))
    .leftJoin(addresses, eq(merchants.idAddress, addresses.id))
    .leftJoin(salesAgents, eq(merchants.idSalesAgent, salesAgents.id))
    .where(
      and(
        ...whereConditions,
        eq(merchants.active, true)
      )
    );

  const inactiveCountResult = await db
    .select({ count: count() })
    .from(merchants)
    .leftJoin(customers, eq(merchants.idCustomer, customers.id))
    .leftJoin(addresses, eq(merchants.idAddress, addresses.id))
    .leftJoin(salesAgents, eq(merchants.idSalesAgent, salesAgents.id))
    .where(
      and(
        ...whereConditions,
        eq(merchants.active, false)
      )
    );

  const pendingKycResult = await db
    .select({ count: count() })
    .from(merchants)
    .leftJoin(customers, eq(merchants.idCustomer, customers.id))
    .leftJoin(addresses, eq(merchants.idAddress, addresses.id))
    .leftJoin(salesAgents, eq(merchants.idSalesAgent, salesAgents.id))
    .where(
      and(
        ...whereConditions,
        inArray(merchants.riskAnalysisStatus, [
          "PENDING",
          "WAITINGDOCUMENTS",
          "NOTANALYSED",
        ])
      )
    );

  const approvedKycResult = await db
    .select({ count: count() })
    .from(merchants)
    .leftJoin(customers, eq(merchants.idCustomer, customers.id))
    .leftJoin(addresses, eq(merchants.idAddress, addresses.id))
    .leftJoin(salesAgents, eq(merchants.idSalesAgent, salesAgents.id))
    .where(
      and(
        ...whereConditions,
        eq(merchants.riskAnalysisStatus, "APPROVED")
      )
    );

  const rejectedKycResult = await db
    .select({ count: count() })
    .from(merchants)
    .leftJoin(customers, eq(merchants.idCustomer, customers.id))
    .leftJoin(addresses, eq(merchants.idAddress, addresses.id))
    .leftJoin(salesAgents, eq(merchants.idSalesAgent, salesAgents.id))
    .where(
      and(
        ...whereConditions,
        inArray(merchants.riskAnalysisStatus, ["DECLINED", "KYCOFFLINE"])
      )
    );

  const cpAnticipationResult = await db
    .select({ count: count() })
    .from(merchants)
    .leftJoin(customers, eq(merchants.idCustomer, customers.id))
    .leftJoin(addresses, eq(merchants.idAddress, addresses.id))
    .leftJoin(salesAgents, eq(merchants.idSalesAgent, salesAgents.id))
    .leftJoin(configurations, eq(merchants.idConfiguration, configurations.id))
    .where(
      and(
        ...whereConditions,
        eq(configurations.lockCpAnticipationOrder, false)
      )
    );

  const cnpAnticipationResult = await db
    .select({ count: count() })
    .from(merchants)
    .leftJoin(customers, eq(merchants.idCustomer, customers.id))
    .leftJoin(addresses, eq(merchants.idAddress, addresses.id))
    .leftJoin(salesAgents, eq(merchants.idSalesAgent, salesAgents.id))
    .leftJoin(configurations, eq(merchants.idConfiguration, configurations.id))
    .where(
      and(
        ...whereConditions,
        eq(configurations.lockCnpAnticipationOrder, false)
      )
    );

  return {
    merchants: result,
    totalCount,
    active_count: activeCountResult[0]?.count || 0,
    inactive_count: inactiveCountResult[0]?.count || 0,
    pending_kyc_count: pendingKycResult[0]?.count || 0,
    approved_kyc_count: approvedKycResult[0]?.count || 0,
    rejected_kyc_count: rejectedKycResult[0]?.count || 0,
    cp_anticipation_count: cpAnticipationResult[0]?.count || 0,
    cnp_anticipation_count: cnpAnticipationResult[0]?.count || 0,
  };
}

