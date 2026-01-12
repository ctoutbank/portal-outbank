/**
 * Mapeamento de itens de menu para permissões
 * Usado para filtrar dinamicamente o menu com base nas permissões do usuário
 */

export interface MenuPermissionConfig {
  /** URL do item de menu */
  url: string;
  /** Função/permissão necessária para ver este item */
  requiredFunction: string;
  /** Se true, item é visível apenas para Super Admin */
  superAdminOnly?: boolean;
  /** Se true, item é visível apenas para Admin ou Super Admin */
  adminOnly?: boolean;
  /** Grupo da função (para verificação via checkPagePermission) */
  functionGroup?: string;
}

/**
 * Configuração de permissões para itens do menu
 * Se um item não estiver neste mapa, será mostrado para todos os usuários autenticados
 */
export const MENU_PERMISSIONS: MenuPermissionConfig[] = [
  // Dashboard - visível para todos
  { url: "/", requiredFunction: "Visualizar Dashboard", functionGroup: "Dashboard" },
  
  // ISOs - apenas para admin
  { url: "/customers", requiredFunction: "Listar ISOs", functionGroup: "ISOs", adminOnly: true },
  
  // CNAE/MCC
  { url: "/categories", requiredFunction: "Listar CNAE/MCC", functionGroup: "CNAE/MCC" },
  
  // Estabelecimentos
  { url: "/merchants", requiredFunction: "Listar Estabelecimentos", functionGroup: "Estabelecimentos" },
  
  // Vendas
  { url: "/transactions", requiredFunction: "Listar Vendas", functionGroup: "Vendas" },
  
  // Analytics
  { url: "/analytics", requiredFunction: "Visualizar Analytics", functionGroup: "Analytics" },
  
  // Fechamento
  { url: "/portal/closing", requiredFunction: "Acessar Fechamento", functionGroup: "Fechamento" },
  
  // Fornecedores
  { url: "/supplier", requiredFunction: "Listar Fornecedores", functionGroup: "Fornecedores" },
  
  // Consentimento LGPD
  { url: "/consent/modules", requiredFunction: "Acessar Consentimento", functionGroup: "Consentimento LGPD" },
  
  // Configurações - apenas para admin
  { url: "/config", requiredFunction: "Acessar Configurações", functionGroup: "Configurações", adminOnly: true },
  
  // Usuários - apenas para admin
  { url: "/config/users", requiredFunction: "Listar Usuários", functionGroup: "Usuários", adminOnly: true },
  
  // Categorias - apenas para super admin
  { url: "/config/categories", requiredFunction: "Listar Categorias", functionGroup: "Categorias", superAdminOnly: true },
  
  // Design Settings - apenas para super admin
  { url: "/design-settings", requiredFunction: "Gerenciar Design", functionGroup: "Design Settings", superAdminOnly: true },
];

/**
 * Obtém a configuração de permissão para uma URL específica
 */
export function getMenuPermissionConfig(url: string): MenuPermissionConfig | undefined {
  return MENU_PERMISSIONS.find((config) => config.url === url);
}

/**
 * Verifica se uma URL requer permissão de admin
 */
export function isAdminOnlyUrl(url: string): boolean {
  const config = getMenuPermissionConfig(url);
  return config?.adminOnly === true || config?.superAdminOnly === true;
}

/**
 * Verifica se uma URL requer permissão de super admin
 */
export function isSuperAdminOnlyUrl(url: string): boolean {
  const config = getMenuPermissionConfig(url);
  return config?.superAdminOnly === true;
}

/**
 * Mapeamento de rotas para permissões necessárias
 * Formato: { rota: { grupo: string, funcao: string } }
 * Usado por canAccessPage() e getAccessiblePages()
 */
export const PAGE_PERMISSION_MAP: Record<string, { group: string; function: string }> = {
  "/": { group: "Dashboard", function: "Visualizar Dashboard" },
  "/dashboard": { group: "Dashboard", function: "Visualizar Dashboard" },
  "/customers": { group: "ISOs", function: "Listar ISOs" },
  "/establishments": { group: "Estabelecimentos", function: "Listar Estabelecimentos" },
  "/transactions": { group: "Vendas", function: "Listar Vendas" },
  "/closing": { group: "Fechamento", function: "Acessar Fechamento" },
  "/config": { group: "Configurações", function: "Acessar Configurações" },
  "/config/users": { group: "Usuários", function: "Listar Usuários" },
  "/config/categories": { group: "Categorias", function: "Listar Categorias" },
  "/design-settings": { group: "Design Settings", function: "Gerenciar Design" },
  "/consent": { group: "Consentimento LGPD", function: "Acessar Consentimento" },
  "/suppliers": { group: "Fornecedores", function: "Listar Fornecedores" },
  "/cnae-mcc": { group: "CNAE/MCC", function: "Listar CNAE/MCC" },
};

