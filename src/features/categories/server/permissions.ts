"use server";

import { db } from "@/lib/db";
import { profiles, functions, profileFunctions } from "../../../../drizzle/schema";
import { eq, and, ilike, inArray, sql } from "drizzle-orm";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/utils";

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

// =====================================================
// Definição das funções do Portal-Outbank (Admin Consolle)
// =====================================================

/**
 * Lista de funções/permissões do portal-outbank organizadas por grupo
 * Estas funções são usadas para controlar acesso às páginas e funcionalidades
 * (não pode ser exportado de arquivo "use server")
 */
const PORTAL_FUNCTIONS = {
  // Grupo: ISOs
  ISOs: [
    { name: "Listar ISOs", group: "ISOs" },
    { name: "Criar ISO", group: "ISOs" },
    { name: "Editar ISO", group: "ISOs" },
    { name: "Deletar ISO", group: "ISOs" },
    { name: "Configurar ISO", group: "ISOs" },
  ],
  // Grupo: Usuários
  Usuarios: [
    { name: "Listar Usuários", group: "Usuários" },
    { name: "Criar Usuário", group: "Usuários" },
    { name: "Editar Usuário", group: "Usuários" },
    { name: "Deletar Usuário", group: "Usuários" },
    { name: "Desativar Usuário", group: "Usuários" },
  ],
  // Grupo: Categorias
  Categorias: [
    { name: "Listar Categorias", group: "Categorias" },
    { name: "Criar Categoria", group: "Categorias" },
    { name: "Editar Categoria", group: "Categorias" },
    { name: "Deletar Categoria", group: "Categorias" },
    { name: "Configurar Permissões", group: "Categorias" },
  ],
  // Grupo: Dashboard
  Dashboard: [
    { name: "Visualizar Dashboard", group: "Dashboard" },
    { name: "Exportar Dados", group: "Dashboard" },
  ],
  // Grupo: Configurações
  Configuracoes: [
    { name: "Acessar Configurações", group: "Configurações" },
    { name: "Gerenciar Sistema", group: "Configurações" },
  ],
  // Grupo: Estabelecimentos
  Estabelecimentos: [
    { name: "Listar Estabelecimentos", group: "Estabelecimentos" },
    { name: "Criar Estabelecimento", group: "Estabelecimentos" },
    { name: "Editar Estabelecimento", group: "Estabelecimentos" },
    { name: "Deletar Estabelecimento", group: "Estabelecimentos" },
  ],
  // Grupo: Vendas
  Vendas: [
    { name: "Listar Vendas", group: "Vendas" },
    { name: "Exportar Vendas", group: "Vendas" },
  ],
  // Grupo: Fechamento
  Fechamento: [
    { name: "Acessar Fechamento", group: "Fechamento" },
    { name: "Exportar Fechamento", group: "Fechamento" },
  ],
  // Grupo: Fornecedores
  Fornecedores: [
    { name: "Listar Fornecedores", group: "Fornecedores" },
    { name: "Criar Fornecedor", group: "Fornecedores" },
    { name: "Editar Fornecedor", group: "Fornecedores" },
    { name: "Deletar Fornecedor", group: "Fornecedores" },
  ],
  // Grupo: Consentimento LGPD
  Consentimento: [
    { name: "Acessar Consentimento", group: "Consentimento LGPD" },
    { name: "Gerenciar Módulos", group: "Consentimento LGPD" },
  ],
  // Grupo: CNAE/MCC
  CnaeMcc: [
    { name: "Listar CNAE/MCC", group: "CNAE/MCC" },
    { name: "Editar CNAE/MCC", group: "CNAE/MCC" },
  ],
  // Grupo: Analytics
  Analytics: [
    { name: "Visualizar Analytics", group: "Analytics" },
  ],
  // Grupo: Margens
  Margens: [
    { name: "Acessar Margens", group: "Margens" },
    { name: "Editar Margens", group: "Margens" },
  ],
  // Grupo: Repasses
  Repasses: [
    { name: "Acessar Repasses", group: "Repasses" },
    { name: "Gerenciar Repasses", group: "Repasses" },
  ],
};

/**
 * Cria todas as funções do portal-outbank se não existirem
 * Esta função é idempotente - pode ser executada múltiplas vezes sem criar duplicatas
 * 
 * @returns Objeto com lista de funções criadas e já existentes
 */
export async function createPortalFunctionsIfNotExists() {
  console.log("[createPortalFunctionsIfNotExists] Iniciando criação de funções do portal-outbank...");
  
  const allFunctions: { name: string; group: string }[] = [];
  
  // Flatten todas as funções em um único array
  Object.values(PORTAL_FUNCTIONS).forEach((groupFunctions) => {
    allFunctions.push(...groupFunctions);
  });
  
  console.log(`[createPortalFunctionsIfNotExists] Total de funções a verificar: ${allFunctions.length}`);
  
  const created: string[] = [];
  const existing: string[] = [];
  const errors: string[] = [];
  
  for (const func of allFunctions) {
    try {
      // Verificar se função já existe (por nome e grupo)
      const existingFunc = await db
        .select()
        .from(functions)
        .where(
          and(
            eq(functions.name, func.name),
            eq(functions.group, func.group)
          )
        )
        .limit(1);
      
      if (existingFunc.length > 0) {
        existing.push(`${func.group}: ${func.name}`);
        console.log(`[createPortalFunctionsIfNotExists] ✓ Função já existe: ${func.group} - ${func.name}`);
      } else {
        // Criar função
        const now = new Date().toISOString();
        await db.insert(functions).values({
          slug: generateSlug(),
          name: func.name,
          group: func.group,
          active: true,
          dtinsert: now,
          dtupdate: now,
        });
        created.push(`${func.group}: ${func.name}`);
        console.log(`[createPortalFunctionsIfNotExists] ➕ Função criada: ${func.group} - ${func.name}`);
      }
    } catch (error) {
      const errorMsg = `Erro ao criar função ${func.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      errors.push(errorMsg);
      console.error(`[createPortalFunctionsIfNotExists] ❌ ${errorMsg}`);
    }
  }
  
  console.log(`[createPortalFunctionsIfNotExists] Resumo: ${created.length} criadas, ${existing.length} já existiam, ${errors.length} erros`);
  
  return {
    success: errors.length === 0,
    created,
    existing,
    errors,
    summary: {
      total: allFunctions.length,
      created: created.length,
      existing: existing.length,
      errors: errors.length,
    },
  };
}

/**
 * Obtém todas as funções do portal-outbank agrupadas
 * Útil para exibir na interface de configuração de categorias
 */
export async function getPortalFunctionsGrouped() {
  const result = await db
    .select({
      id: functions.id,
      name: functions.name,
      group: functions.group,
      active: functions.active,
    })
    .from(functions)
    .where(eq(functions.active, true))
    .orderBy(functions.group, functions.name);

  // Agrupar por grupo
  const grouped = result.reduce((acc, func) => {
    const group = func.group || "Outros";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(func);
    return acc;
  }, {} as Record<string, typeof result>);

  return {
    all: result,
    grouped,
    groups: Object.keys(grouped).sort(),
  };
}

/**
 * Lista todas as funções (permissões) disponíveis, agrupadas por grupo
 */
export async function getAllFunctions() {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode listar funções");
  }

  const result = await db
    .select({
      id: functions.id,
      name: functions.name,
      group: functions.group,
      active: functions.active,
      dtinsert: functions.dtinsert,
      dtupdate: functions.dtupdate,
    })
    .from(functions)
    .where(eq(functions.active, true))
    .orderBy(functions.group, functions.name);

  // Agrupar por grupo
  const grouped = result.reduce((acc, func) => {
    const group = func.group || "Outros";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(func);
    return acc;
  }, {} as Record<string, typeof result>);

  return {
    all: result,
    grouped,
    groups: Object.keys(grouped),
  };
}

/**
 * Obtém as permissões atribuídas a uma categoria
 */
export async function getCategoryPermissions(categoryId: number) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode visualizar permissões de categorias");
  }

  const result = await db
    .select({
      id: profileFunctions.id,
      idFunction: profileFunctions.idFunctions,
      functionName: functions.name,
      functionGroup: functions.group,
      active: profileFunctions.active,
    })
    .from(profileFunctions)
    .leftJoin(functions, eq(profileFunctions.idFunctions, functions.id))
    .where(and(eq(profileFunctions.idProfile, categoryId), eq(profileFunctions.active, true)));

  return result;
}

/**
 * Atribui permissões a uma categoria
 * Remove todas as permissões atuais e adiciona as novas
 * Também sincroniza automaticamente os menus correspondentes
 */
export async function updateCategoryPermissions(
  categoryId: number,
  functionIds: number[]
) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode atualizar permissões de categorias");
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

  // Verificar se é Super Admin (opcional: permitir edição de permissões)
  const profileName = category[0].name?.toUpperCase() || "";
  const isSuperAdmin = profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER");

  // Desativar todas as permissões atuais (soft delete)
  await db
    .update(profileFunctions)
    .set({ active: false, dtupdate: new Date().toISOString() })
    .where(eq(profileFunctions.idProfile, categoryId));

  // Se não é Super Admin e não há permissões, isso é normal
  // Se é Super Admin, pode ou não ter permissões explícitas (sempre tem acesso total)

  // Adicionar novas permissões
  if (functionIds.length > 0) {
    const slug = generateSlug();
    const now = new Date().toISOString();

    // Verificar quais já existem (para reativar)
    const existing = await db
      .select()
      .from(profileFunctions)
      .where(
        and(
          eq(profileFunctions.idProfile, categoryId),
          inArray(profileFunctions.idFunctions, functionIds)
        )
      );

    const existingFunctionIds = existing.map((e) => Number(e.idFunctions));
    const newFunctionIds = functionIds.filter((id) => !existingFunctionIds.includes(id));

    // Reativar existentes
    if (existing.length > 0) {
      await db
        .update(profileFunctions)
        .set({ active: true, dtupdate: now })
        .where(
          and(
            eq(profileFunctions.idProfile, categoryId),
            inArray(profileFunctions.idFunctions, existingFunctionIds)
          )
        );
    }

    // Inserir novas
    if (newFunctionIds.length > 0) {
      const values = newFunctionIds.map((idFunction) => ({
        slug: generateSlug(),
        idProfile: categoryId,
        idFunctions: idFunction,
        active: true,
        dtinsert: now,
        dtupdate: now,
      }));

      await db.insert(profileFunctions).values(values);
    }
  }

  // SINCRONIZAÇÃO: Adicionar menus correspondentes às permissões selecionadas
  if (functionIds.length > 0) {
    // Buscar os grupos das funções selecionadas
    const selectedFunctions = await db
      .select({ group: functions.group })
      .from(functions)
      .where(inArray(functions.id, functionIds));

    // Coletar menus correspondentes aos grupos
    const menusToAdd = new Set<string>();
    for (const func of selectedFunctions) {
      if (func.group) {
        const menuId = PERMISSION_TO_MENU_MAP[func.group];
        if (menuId) {
          menusToAdd.add(menuId);
        }
      }
    }

    if (menusToAdd.size > 0) {
      // Buscar menus atuais da categoria
      const currentMenusResult = await db.execute(sql`
        SELECT authorized_menus FROM profiles WHERE id = ${categoryId}
      `);
      
      let currentMenus: string[] = [];
      const rawMenus = currentMenusResult.rows?.[0]?.authorized_menus;
      if (rawMenus) {
        try {
          currentMenus = typeof rawMenus === 'string' ? JSON.parse(rawMenus) : rawMenus;
        } catch {
          currentMenus = [];
        }
      }

      // Adicionar novos menus sem remover os existentes
      const updatedMenus = [...new Set([...currentMenus, ...menusToAdd])];

      // Atualizar menus autorizados
      const menusJson = JSON.stringify(updatedMenus);
      await db.execute(sql`
        UPDATE profiles 
        SET authorized_menus = ${menusJson}, dtupdate = NOW()
        WHERE id = ${categoryId}
      `);

      const addedMenus = [...menusToAdd].filter((m) => !currentMenus.includes(m));
      if (addedMenus.length > 0) {
        console.log(`[updateCategoryPermissions] Sincronizados ${addedMenus.length} menus para categoria ${categoryId}: ${addedMenus.join(', ')}`);
      }
    }
  }

  revalidatePath(`/config/categories/${categoryId}`);
  revalidatePath("/config/categories");
  return { success: true };
}





