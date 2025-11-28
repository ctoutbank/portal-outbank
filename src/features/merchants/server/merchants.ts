"use server";

import { db } from "@/lib/db";
import { merchants, customers, addresses, salesAgents, configurations, merchantPrice, legalNatures, categories, contacts, merchantBankAccounts, merchantpixaccount } from "../../../../drizzle/schema";
import { eq, and, ilike, or, inArray, count, desc, gte, lte, asc, isNotNull, getTableColumns } from "drizzle-orm";
import { getCurrentUserInfo, isSuperAdmin, hasMerchantsAccess } from "@/lib/permissions/check-permissions";

export interface MerchantListItem {
  merchantid: number;
  slug: string | null;
  active: boolean | null;
  name: string | null;
  email: string | null;
  phone_type: string | null;
  revenue: string | null;
  id_category: number | null;
  kic_status: string | null;
  addressname: string | null;
  time_zone: string | null;
  dtinsert: string | null;
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
 * Obtém sugestões de emails únicos dos merchants
 */
export async function getMerchantEmailSuggestions(): Promise<string[]> {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo) {
    return [];
  }

  const isSuper = await isSuperAdmin();
  const userHasMerchantsAccess = await hasMerchantsAccess();

  if (!isSuper && !userHasMerchantsAccess) {
    return [];
  }

  const whereConditions = [isNotNull(merchants.email)];

  // Se não for Super Admin, filtrar pelos ISOs que o usuário tem acesso
  if (!isSuper && userHasMerchantsAccess && userInfo.allowedCustomers && userInfo.allowedCustomers.length > 0) {
    whereConditions.push(inArray(merchants.idCustomer, userInfo.allowedCustomers));
  } else if (!isSuper && userHasMerchantsAccess && (!userInfo.allowedCustomers || userInfo.allowedCustomers.length === 0)) {
    return [];
  }

  const result = await db
    .selectDistinct({ email: merchants.email })
    .from(merchants)
    .where(and(...whereConditions))
    .orderBy(asc(merchants.email))
    .limit(100);

  return result.map((r) => r.email || "").filter((email) => email.trim().length > 0);
}

/**
 * Obtém sugestões de documentos únicos dos merchants
 */
export async function getMerchantDocumentSuggestions(): Promise<string[]> {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo) {
    return [];
  }

  const isSuper = await isSuperAdmin();
  const userHasMerchantsAccess = await hasMerchantsAccess();

  if (!isSuper && !userHasMerchantsAccess) {
    return [];
  }

  const whereConditions = [isNotNull(merchants.idDocument)];

  // Se não for Super Admin, filtrar pelos ISOs que o usuário tem acesso
  if (!isSuper && userHasMerchantsAccess && userInfo.allowedCustomers && userInfo.allowedCustomers.length > 0) {
    whereConditions.push(inArray(merchants.idCustomer, userInfo.allowedCustomers));
  } else if (!isSuper && userHasMerchantsAccess && (!userInfo.allowedCustomers || userInfo.allowedCustomers.length === 0)) {
    return [];
  }

  const result = await db
    .selectDistinct({ document: merchants.idDocument })
    .from(merchants)
    .where(and(...whereConditions))
    .orderBy(asc(merchants.idDocument))
    .limit(100);

  return result.map((r) => r.document || "").filter((doc) => doc.trim().length > 0);
}

/**
 * Obtém sugestões de nomes de consultores comerciais únicos
 */
export async function getSalesAgentSuggestions(): Promise<string[]> {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo) {
    return [];
  }

  const isSuper = await isSuperAdmin();
  const userHasMerchantsAccess = await hasMerchantsAccess();

  if (!isSuper && !userHasMerchantsAccess) {
    return [];
  }

  const whereConditions = [isNotNull(salesAgents.firstName), isNotNull(salesAgents.lastName)];

  // Se não for Super Admin, filtrar pelos ISOs que o usuário tem acesso
  if (!isSuper && userHasMerchantsAccess && userInfo.allowedCustomers && userInfo.allowedCustomers.length > 0) {
    whereConditions.push(inArray(merchants.idCustomer, userInfo.allowedCustomers));
  } else if (!isSuper && userHasMerchantsAccess && (!userInfo.allowedCustomers || userInfo.allowedCustomers.length === 0)) {
    return [];
  }

  const result = await db
    .selectDistinct({
      firstName: salesAgents.firstName,
      lastName: salesAgents.lastName,
    })
    .from(merchants)
    .innerJoin(salesAgents, eq(merchants.idSalesAgent, salesAgents.id))
    .where(and(...whereConditions))
    .orderBy(asc(salesAgents.firstName))
    .limit(100);

  return result
    .map((r) => `${r.firstName || ""} ${r.lastName || ""}`.trim())
    .filter((name) => name.length > 0);
}

/**
 * Obtém sugestões de estados únicos dos endereços
 */
export async function getStateSuggestions(): Promise<string[]> {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo) {
    return [];
  }

  const isSuper = await isSuperAdmin();
  const userHasMerchantsAccess = await hasMerchantsAccess();

  if (!isSuper && !userHasMerchantsAccess) {
    return [];
  }

  const whereConditions = [isNotNull(addresses.state)];

  // Se não for Super Admin, filtrar pelos ISOs que o usuário tem acesso
  if (!isSuper && userHasMerchantsAccess && userInfo.allowedCustomers && userInfo.allowedCustomers.length > 0) {
    whereConditions.push(inArray(merchants.idCustomer, userInfo.allowedCustomers));
  } else if (!isSuper && userHasMerchantsAccess && (!userInfo.allowedCustomers || userInfo.allowedCustomers.length === 0)) {
    return [];
  }

  const result = await db
    .selectDistinct({ state: addresses.state })
    .from(addresses)
    .innerJoin(merchants, eq(merchants.idAddress, addresses.id))
    .where(and(...whereConditions))
    .orderBy(asc(addresses.state))
    .limit(50);

  return result.map((r) => r.state || "").filter((state) => state.trim().length > 0);
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

/**
 * Interface para acesso do usuário aos merchants (adaptada do Outbank-One para Portal-Outbank)
 */
export interface UserMerchantsAccess {
  fullAccess: boolean;
  idMerchants: number[];
  idCustomer: number | null;
  allowedCustomers: number[];
}

/**
 * Obtém informações de acesso do usuário aos merchants
 * Adaptado do Outbank-One para Portal-Outbank
 */
export async function getUserMerchantsAccess(): Promise<UserMerchantsAccess> {
  try {
    const userInfo = await getCurrentUserInfo();
    
    if (!userInfo) {
      throw new Error("User not authenticated");
    }

    const isSuper = userInfo.isSuperAdmin;
    const hasAccess = await hasMerchantsAccess();

    // Super Admin ou usuário com acesso tem fullAccess
    const fullAccess = isSuper || hasAccess;

    // Se tem fullAccess, retornar com allowedCustomers
    if (fullAccess) {
      return {
        fullAccess: true,
        idMerchants: [],
        idCustomer: userInfo.idCustomer,
        allowedCustomers: userInfo.allowedCustomers || [],
      };
    }

    // Para usuários sem fullAccess, retornar vazio (não devem acessar merchants)
    return {
      fullAccess: false,
      idMerchants: [],
      idCustomer: userInfo.idCustomer,
      allowedCustomers: userInfo.allowedCustomers || [],
    };
  } catch (error) {
    console.error("Erro ao obter acesso aos comerciantes do usuário:", error);
    throw error;
  }
}

/**
 * Busca um estabelecimento por ID com todos os relacionamentos
 * Replicado do Outbank-One, adaptado para Portal-Outbank
 */
export async function getMerchantById(
  id: number,
  userAccess?: UserMerchantsAccess
): Promise<{
  merchants: typeof merchants.$inferSelect;
  categories: typeof categories.$inferSelect | null;
  addresses: typeof addresses.$inferSelect | null;
  configurations: typeof configurations.$inferSelect | null;
  salesAgents: typeof salesAgents.$inferSelect | null;
  legalNatures: typeof legalNatures.$inferSelect | null;
  contacts: typeof contacts.$inferSelect | null;
  pixaccounts: typeof merchantpixaccount.$inferSelect | null;
} | null> {
  try {
    // Se userAccess não foi fornecido, buscar
    if (!userAccess) {
      userAccess = await getUserMerchantsAccess();
    }

    // Permitir acesso para criação de novo merchant (id = 0)
    // Verificar acesso apenas para merchants existentes
    if (id !== 0) {
      // Verificar se o usuário tem acesso
      if (!userAccess.fullAccess) {
        // Se não tem fullAccess, verificar se tem acesso ao merchant específico
        // No Portal-Outbank, verificamos pelo idCustomer (ISO)
        const merchant = await db
          .select({ idCustomer: merchants.idCustomer })
          .from(merchants)
          .where(eq(merchants.id, id))
          .limit(1);

        if (!merchant || merchant.length === 0) {
          throw new Error("Merchant not found");
        }

        const merchantCustomerId = merchant[0].idCustomer;
        
        // Verificar se o merchant pertence a um ISO que o usuário tem acesso
        if (
          merchantCustomerId &&
          userAccess.allowedCustomers.length > 0 &&
          !userAccess.allowedCustomers.includes(Number(merchantCustomerId))
        ) {
          throw new Error("You don't have access to this merchant");
        }
      }
    }

    // Se o ID é 0, retornar um objeto vazio para permitir criação
    if (id === 0) {
      return {
        merchants: {
          id: 0,
          slug: "",
          name: "",
          active: false,
          dtinsert: "",
          dtupdate: "",
          idMerchant: "",
          idDocument: "",
          corporateName: "",
          email: "",
          areaCode: "",
          number: "",
          phoneType: "",
          language: "",
          timezone: "",
          slugCustomer: "",
          riskAnalysisStatus: "",
          riskAnalysisStatusJustification: "",
          legalPerson: "",
          openingDate: null,
          inclusion: "",
          openingDays: "",
          openingHour: "",
          closingHour: "",
          municipalRegistration: "",
          stateSubcription: "",
          hasTef: false,
          hasPix: false,
          hasTop: false,
          establishmentFormat: "",
          revenue: null,
          idCategory: null,
          slugCategory: "",
          idConfiguration: null,
          slugConfiguration: "",
          idAddress: null,
          idMerchantPrice: null,
          idCustomer: userAccess.idCustomer,
          dtdelete: null,
          idMerchantBankAccount: null,
          idLegalNature: null,
          slugLegalNature: "",
          idSalesAgent: null,
          slugSalesAgent: "",
        } as typeof merchants.$inferSelect,
        categories: null,
        addresses: null,
        configurations: null,
        salesAgents: null,
        legalNatures: null,
        contacts: null,
        pixaccounts: null,
      };
    }

    // Construir condições de filtro
    const conditions = [eq(merchants.id, Number(id))];

    // Se não tem fullAccess, filtrar por allowedCustomers
    if (!userAccess.fullAccess && userAccess.allowedCustomers.length > 0) {
      conditions.push(inArray(merchants.idCustomer, userAccess.allowedCustomers));
    } else if (!userAccess.fullAccess && userAccess.idCustomer) {
      // Se não tem fullAccess e tem idCustomer, filtrar por ele
      conditions.push(eq(merchants.idCustomer, userAccess.idCustomer));
    }

    const result = await db
      .select({
        merchants: { ...getTableColumns(merchants) },
        categories: { ...getTableColumns(categories) },
        addresses: { ...getTableColumns(addresses) },
        configurations: { ...getTableColumns(configurations) },
        salesAgents: { ...getTableColumns(salesAgents) },
        legalNatures: { ...getTableColumns(legalNatures) },
        contacts: { ...getTableColumns(contacts) },
        pixaccounts: { ...getTableColumns(merchantpixaccount) },
      })
      .from(merchants)
      .where(and(...conditions))
      .leftJoin(addresses, eq(merchants.idAddress, addresses.id))
      .leftJoin(categories, eq(merchants.idCategory, categories.id))
      .leftJoin(configurations, eq(merchants.idConfiguration, configurations.id))
      .leftJoin(salesAgents, eq(merchants.idSalesAgent, salesAgents.id))
      .leftJoin(legalNatures, eq(merchants.idLegalNature, legalNatures.id))
      .leftJoin(contacts, eq(merchants.id, contacts.idMerchant))
      .leftJoin(
        merchantpixaccount,
        eq(merchants.id, merchantpixaccount.idMerchant)
      )
      .limit(1);

    const merchant = result[0];
    
    if (!merchant) {
      return null;
    }

    return merchant;
  } catch (error) {
    console.error("Erro ao buscar merchant por ID:", error);
    throw error;
  }
}

