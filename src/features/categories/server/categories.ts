"use server";

import { db } from "@/lib/db";
import { profiles, profileFunctions, profileCustomers, users, functions } from "../../../../drizzle/schema";
import { eq, and, ilike, sql, desc, asc, inArray } from "drizzle-orm";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/utils";

// Mapeamento menu -> grupos de permissões correspondentes
const MENU_TO_PERMISSION_GROUPS: Record<string, string[]> = {
  "dashboard": ["Dashboard"],
  "isos": ["ISOs"],
  "cnae_mcc": ["CNAE/MCC"],
  "estabelecimentos": ["Estabelecimentos"],
  "vendas": ["Vendas"],
  "analytics": ["Analytics"],
  "fechamento": ["Fechamento"],
  "repasses": ["Repasses"],
  "fornecedores": ["Fornecedores"],
  "margens": ["Margens"],
  "lgpd": ["Consentimento LGPD"],
  "config": ["Configurar Perfis e Usuários", "Categorias", "Configurações", "Usuários"],
};

// Mapeamento grupo de permissão -> menu correspondente
const PERMISSION_TO_MENU_MAP: Record<string, string> = {
  "Dashboard": "dashboard",
  "Estabelecimentos": "estabelecimentos",
  "Vendas": "vendas",
  "Fechamento": "fechamento",
  "Categorias": "config",
  "Configurar Perfis e Usuários": "config",
  "ISOs": "isos",
  "CNAE/MCC": "cnae_mcc",
  "Analytics": "analytics",
  "Repasses": "repasses",
  "Fornecedores": "fornecedores",
  "Margens": "margens",
  "Consentimento LGPD": "lgpd",
  "Configurações": "config",
  "Usuários": "config",
};

// Palavras-chave de permissões baseline (acesso básico/leitura)
const BASELINE_KEYWORDS = ["Listar", "Visualizar", "Acessar", "Ver"];

/**
 * Lista todas as categorias (profiles) do sistema
 * Super Admin vê todas, Admin vê apenas as permitidas
 */
export async function getAllCategories(filters?: {
  name?: string;
  active?: boolean | string;
}) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode listar categorias");
  }

  // Usar SQL raw para obter locked que não está no schema drizzle
  // Construir query segura com parâmetros
  const hasNameFilter = filters?.name && filters.name.trim();
  const hasActiveFilter = filters?.active !== undefined;
  const activeValue = hasActiveFilter 
    ? (typeof filters!.active === 'string' ? filters!.active === 'true' : filters!.active)
    : null;
  // Valor do nome sem wildcards - wildcards serão adicionados no SQL
  const nameValue = hasNameFilter ? filters!.name!.trim() : null;

  let result;
  
  if (hasNameFilter && hasActiveFilter) {
    result = await db.execute(sql`
      SELECT id, name, description, active, restrict_customer_data as "restrictCustomerData", 
             is_sales_agent as "isSalesAgent", category_type as "categoryType", 
             dtinsert, dtupdate, locked
      FROM profiles
      WHERE name ILIKE CONCAT('%', ${nameValue}, '%') AND active = ${activeValue}
      ORDER BY id DESC
    `);
  } else if (hasNameFilter) {
    result = await db.execute(sql`
      SELECT id, name, description, active, restrict_customer_data as "restrictCustomerData", 
             is_sales_agent as "isSalesAgent", category_type as "categoryType", 
             dtinsert, dtupdate, locked
      FROM profiles
      WHERE name ILIKE CONCAT('%', ${nameValue}, '%')
      ORDER BY id DESC
    `);
  } else if (hasActiveFilter) {
    result = await db.execute(sql`
      SELECT id, name, description, active, restrict_customer_data as "restrictCustomerData", 
             is_sales_agent as "isSalesAgent", category_type as "categoryType", 
             dtinsert, dtupdate, locked
      FROM profiles
      WHERE active = ${activeValue}
      ORDER BY id DESC
    `);
  } else {
    result = await db.execute(sql`
      SELECT id, name, description, active, restrict_customer_data as "restrictCustomerData", 
             is_sales_agent as "isSalesAgent", category_type as "categoryType", 
             dtinsert, dtupdate, locked
      FROM profiles
      ORDER BY id DESC
    `);
  }

  // Contar usuários por categoria
  const categoriesWithCount = await Promise.all(
    (result.rows || []).map(async (category: any) => {
      const userCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.idProfile, category.id));

      return {
        id: category.id,
        name: category.name,
        description: category.description,
        active: category.active,
        restrictCustomerData: category.restrictCustomerData,
        isSalesAgent: category.isSalesAgent,
        categoryType: category.categoryType,
        locked: category.locked || false,
        dtinsert: category.dtinsert,
        dtupdate: category.dtupdate,
        userCount: userCount[0]?.count || 0,
      };
    })
  );

  return categoriesWithCount;
}

/**
 * Busca uma categoria por ID
 */
export async function getCategoryById(id: number) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode visualizar categorias");
  }

  // Usar SQL raw para obter authorized_menus e locked que não estão no schema drizzle
  const result = await db.execute(sql`
    SELECT id, name, description, active, restrict_customer_data as "restrictCustomerData", 
           is_sales_agent as "isSalesAgent", category_type as "categoryType", 
           dtinsert, dtupdate, authorized_menus as "authorizedMenus", locked
    FROM profiles
    WHERE id = ${id}
    LIMIT 1
  `);

  if (!result.rows || result.rows.length === 0) {
    throw new Error("Categoria não encontrada");
  }

  const category = result.rows[0] as any;

  // Contar usuários
  const userCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.idProfile, id));

  return {
    id: category.id,
    name: category.name,
    description: category.description,
    active: category.active,
    restrictCustomerData: category.restrictCustomerData,
    isSalesAgent: category.isSalesAgent,
    categoryType: category.categoryType,
    locked: category.locked || false,
    dtinsert: category.dtinsert,
    dtupdate: category.dtupdate,
    authorizedMenus: category.authorizedMenus ? JSON.parse(category.authorizedMenus) : [],
    userCount: userCount[0]?.count || 0,
  };
}

/**
 * Cria uma nova categoria
 */
export async function createCategory(data: {
  name: string;
  description?: string;
  restrictCustomerData?: boolean;
  isSalesAgent?: boolean;
  categoryType?: string;
}) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode criar categorias");
  }

  if (!data.name || data.name.trim().length === 0) {
    throw new Error("Nome da categoria é obrigatório");
  }

  // Normalizar e validar categoryType - sempre será OUTRO para novas categorias
  // Não permitir criar categorias CORE, EXECUTIVO, ISO_ADMIN ou ADMIN (são fixas do sistema)
  const normalizedType = (data.categoryType || 'OUTRO').trim().toUpperCase();
  const PROTECTED_TYPES = ['CORE', 'EXECUTIVO', 'ISO_ADMIN', 'ADMIN'];
  if (PROTECTED_TYPES.includes(normalizedType)) {
    throw new Error("Não é possível criar novas categorias CORE, Executivo, Admin ou ISO Admin. Estas são categorias fixas do sistema.");
  }
  // Forçar OUTRO para novas categorias, ignorando input do cliente
  const categoryType = 'OUTRO';

  // Verificar se já existe categoria com mesmo nome
  const existing = await db
    .select()
    .from(profiles)
    .where(ilike(profiles.name, data.name.trim()))
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error("Já existe uma categoria com este nome");
  }

  const slug = generateSlug();
  const now = new Date().toISOString();

  const result = await db
    .insert(profiles)
    .values({
      slug,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      restrictCustomerData: data.restrictCustomerData || false,
      isSalesAgent: data.isSalesAgent || false,
      categoryType: categoryType,
      active: true,
      dtinsert: now,
      dtupdate: now,
    })
    .returning({ id: profiles.id });

  revalidatePath("/config/categories");
  return result[0];
}

/**
 * Atualiza uma categoria existente
 */
export async function updateCategory(
  id: number,
  data: {
    name?: string;
    description?: string;
    restrictCustomerData?: boolean;
    isSalesAgent?: boolean;
    categoryType?: string;
    active?: boolean;
  }
) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode atualizar categorias");
  }

  // Verificar se categoria existe
  const category = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);

  if (!category || category.length === 0) {
    throw new Error("Categoria não encontrada");
  }

  // Verificar se é Super Admin (não permitir editar)
  const profileName = category[0].name?.toUpperCase() || "";
  if (profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER")) {
    // Permitir apenas atualizar descrição e active, não name
    const updateData: any = {
      dtupdate: new Date().toISOString(),
    };

    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null;
    }
    if (data.active !== undefined) {
      updateData.active = data.active;
    }
    if (data.restrictCustomerData !== undefined) {
      updateData.restrictCustomerData = data.restrictCustomerData;
    }

    await db.update(profiles).set(updateData).where(eq(profiles.id, id));
    revalidatePath("/config/categories");
    return { id };
  }

  // Para outras categorias, permitir editar tudo
  const updateData: any = {
    dtupdate: new Date().toISOString(),
  };

  if (data.name !== undefined && data.name.trim().length > 0) {
    // Verificar se nome já existe em outra categoria
    const existing = await db
      .select()
      .from(profiles)
      .where(and(ilike(profiles.name, data.name.trim()), sql`${profiles.id} != ${id}`))
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error("Já existe uma categoria com este nome");
    }

    updateData.name = data.name.trim();
  }

  if (data.description !== undefined) {
    updateData.description = data.description.trim() || null;
  }

  if (data.restrictCustomerData !== undefined) {
    updateData.restrictCustomerData = data.restrictCustomerData;
  }

  if (data.isSalesAgent !== undefined) {
    updateData.isSalesAgent = data.isSalesAgent;
  }

  if (data.active !== undefined) {
    updateData.active = data.active;
  }

  if (data.categoryType !== undefined) {
    // Normalizar tipos para comparação segura
    const existingType = (category[0].categoryType || '').trim().toUpperCase();
    const newType = (data.categoryType || '').trim().toUpperCase();
    
    // Não permitir alterar tipo de categorias CORE/EXECUTIVO/ISO_ADMIN/ADMIN existentes
    const PROTECTED_TYPES = ['CORE', 'EXECUTIVO', 'ISO_ADMIN', 'ADMIN'];
    if (PROTECTED_TYPES.includes(existingType)) {
      // Ignora tentativa de alterar tipo de categorias fixas
    } else {
      // Não permitir alterar para CORE, EXECUTIVO, ISO_ADMIN ou ADMIN
      if (PROTECTED_TYPES.includes(newType)) {
        throw new Error("Não é possível alterar o tipo para CORE, Executivo, Admin ou ISO Admin. Estas são categorias fixas do sistema.");
      }
      // Normalizar o valor persistido
      updateData.categoryType = newType || 'OUTRO';
    }
  }

  await db.update(profiles).set(updateData).where(eq(profiles.id, id));
  revalidatePath("/config/categories");
  revalidatePath(`/config/categories/${id}`);
  return { id };
}

/**
 * Atualiza os menus autorizados de uma categoria
 * Também sincroniza automaticamente as permissões baseline correspondentes
 */
export async function updateCategoryMenus(categoryId: number, menuIds: string[]) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode atualizar menus autorizados");
  }

  // Verificar se categoria existe
  const category = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, categoryId))
    .limit(1);

  if (!category || category.length === 0) {
    throw new Error("Categoria não encontrada");
  }

  // Atualizar menus autorizados como JSON
  const menusJson = JSON.stringify(menuIds);
  await db.execute(sql`
    UPDATE profiles 
    SET authorized_menus = ${menusJson}, dtupdate = NOW()
    WHERE id = ${categoryId}
  `);

  // SINCRONIZAÇÃO: Adicionar permissões baseline para os menus selecionados
  // Coletar todos os grupos de permissões correspondentes aos menus
  const permissionGroups: string[] = [];
  for (const menuId of menuIds) {
    const groups = MENU_TO_PERMISSION_GROUPS[menuId];
    if (groups) {
      permissionGroups.push(...groups);
    }
  }

  if (permissionGroups.length > 0) {
    console.log(`[updateCategoryMenus] Buscando permissões para grupos: ${permissionGroups.join(', ')}`);
    
    // Buscar todas as funções dos grupos correspondentes
    const allGroupFunctions = await db
      .select({
        id: functions.id,
        name: functions.name,
        group: functions.group,
      })
      .from(functions)
      .where(and(
        eq(functions.active, true),
        inArray(functions.group, permissionGroups)
      ));
    
    console.log(`[updateCategoryMenus] Encontradas ${allGroupFunctions.length} funções nos grupos`);

    // Para cada grupo, encontrar a função baseline e adicionar à categoria
    const baselineFunctionIds: number[] = [];
    const processedGroups = new Set<string>();

    for (const group of permissionGroups) {
      if (processedGroups.has(group)) continue;
      processedGroups.add(group);

      const groupFunctions = allGroupFunctions.filter((f) => f.group === group);
      if (groupFunctions.length === 0) continue;

      // Buscar função baseline usando palavras-chave
      let baselineFunc = null;
      for (const keyword of BASELINE_KEYWORDS) {
        baselineFunc = groupFunctions.find((f) =>
          f.name && f.name.toLowerCase().includes(keyword.toLowerCase())
        );
        if (baselineFunc) break;
      }

      if (baselineFunc) {
        baselineFunctionIds.push(baselineFunc.id);
      }
    }

    // Adicionar permissões baseline que ainda não existem
    if (baselineFunctionIds.length > 0) {
      // Buscar permissões já existentes
      const existingPermissions = await db
        .select({ idFunctions: profileFunctions.idFunctions })
        .from(profileFunctions)
        .where(and(
          eq(profileFunctions.idProfile, categoryId),
          eq(profileFunctions.active, true)
        ));

      const existingIds = new Set(existingPermissions.map((p) => p.idFunctions));
      const newFunctionIds = baselineFunctionIds.filter((id) => !existingIds.has(id));

      // Inserir novas permissões
      for (const funcId of newFunctionIds) {
        const slug = generateSlug();
        const now = new Date().toISOString();
        
        // Verificar se já existe (mesmo inativo)
        const existing = await db
          .select()
          .from(profileFunctions)
          .where(and(
            eq(profileFunctions.idProfile, categoryId),
            eq(profileFunctions.idFunctions, funcId)
          ))
          .limit(1);

        if (existing.length > 0) {
          // Reativar
          await db
            .update(profileFunctions)
            .set({ active: true, dtupdate: now })
            .where(and(
              eq(profileFunctions.idProfile, categoryId),
              eq(profileFunctions.idFunctions, funcId)
            ));
        } else {
          // Criar nova
          await db.insert(profileFunctions).values({
            slug,
            idProfile: categoryId,
            idFunctions: funcId,
            active: true,
            dtinsert: now,
            dtupdate: now,
          });
        }
      }

      console.log(`[updateCategoryMenus] Sincronizadas ${newFunctionIds.length} permissões baseline para categoria ${categoryId}`);
    }
  }

  revalidatePath("/config/categories");
  revalidatePath(`/config/categories/${categoryId}`);
  return { id: categoryId, menuIds };
}

/**
 * Deleta uma categoria
 */
export async function deleteCategory(id: number) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode deletar categorias");
  }

  // Verificar se categoria existe
  const category = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);

  if (!category || category.length === 0) {
    throw new Error("Categoria não encontrada");
  }

  // Não permitir deletar Super Admin
  const profileName = category[0].name?.toUpperCase() || "";
  if (profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER")) {
    throw new Error("Não é possível deletar a categoria Super Admin");
  }

  // Não permitir deletar categorias críticas (CORE, Executivo, Admin e ISO_ADMIN)
  const categoryType = category[0].categoryType?.toUpperCase() || "";
  const PROTECTED_TYPES = ['CORE', 'EXECUTIVO', 'ISO_ADMIN', 'ADMIN'];
  if (PROTECTED_TYPES.includes(categoryType)) {
    throw new Error("Não é possível deletar categorias CORE, Executivo, Admin ou ISO Admin. Estas são categorias protegidas do sistema.");
  }

  // Verificar se a categoria está bloqueada manualmente
  const lockedResult = await db.execute(sql`SELECT locked FROM profiles WHERE id = ${id}`);
  if (lockedResult.rows?.[0]?.locked) {
    throw new Error("Esta categoria está bloqueada e não pode ser deletada.");
  }

  // Verificar se há usuários atribuídos
  const userCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.idProfile, id));

  if (userCount[0]?.count && userCount[0].count > 0) {
    throw new Error(
      `Não é possível deletar a categoria. Existem ${userCount[0].count} usuário(s) atribuído(s) a ela.`
    );
  }

  // Deletar associações de permissões e customers primeiro
  await db.delete(profileFunctions).where(eq(profileFunctions.idProfile, id));
  await db.delete(profileCustomers).where(eq(profileCustomers.idProfile, id));

  // Deletar categoria
  await db.delete(profiles).where(eq(profiles.id, id));

  revalidatePath("/config/categories");
  return { id };
}

/**
 * Atualiza o status de bloqueio de uma categoria
 */
export async function updateCategoryLocked(categoryId: number, locked: boolean) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode bloquear/desbloquear categorias");
  }

  // Verificar se categoria existe
  const category = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, categoryId))
    .limit(1);

  if (!category || category.length === 0) {
    throw new Error("Categoria não encontrada");
  }

  // Não permitir bloquear/desbloquear Super Admin (sempre protegido)
  const profileName = category[0].name?.toUpperCase() || "";
  if (profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER")) {
    throw new Error("A categoria Super Admin é sempre protegida");
  }

  // Atualizar status de bloqueio
  await db.execute(sql`
    UPDATE profiles 
    SET locked = ${locked}, dtupdate = NOW()
    WHERE id = ${categoryId}
  `);

  revalidatePath("/config/categories");
  revalidatePath(`/config/categories/${categoryId}`);
  return { id: categoryId, locked };
}

