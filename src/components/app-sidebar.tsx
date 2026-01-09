"use client";

import { Briefcase, ChartPie, Settings, Truck, Users, Shield, Store, DollarSign, Calendar, Percent, Receipt, BarChart3, type LucideIcon } from "lucide-react";
import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { TeamSwitcher } from "@/components/team-switcher";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserMenu } from "./user-menu";
import type { CustomerCustomization } from "@/utils/serverActions";

const URL_TO_MENU_ID: Record<string, string> = {
  "/": "dashboard",
  "/bi": "bi",
  "/customers": "isos",
  "/categories": "cnae_mcc",
  "/merchants": "estabelecimentos",
  "/transactions": "vendas",
  "/fechamento": "fechamento",
  "/admin/repasses": "repasses",
  "/supplier": "fornecedores",
  "/margens": "margens",
  "/consent/modules": "lgpd",
  "/config": "config",
};

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
};

type NavSection = {
  section: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    section: "Visão Geral",
    items: [
      { title: "Dashboard", url: "/", icon: ChartPie, isActive: false },
      { title: "BI", url: "/bi", icon: BarChart3, isActive: false },
    ],
  },
  {
    section: "Cadastros",
    items: [
      { title: "ISOs", url: "/customers", icon: Users, isActive: false },
      { title: "Estabelecimentos", url: "/merchants", icon: Store, isActive: false },
    ],
  },
  {
    section: "Operações",
    items: [
      { title: "Vendas", url: "/transactions", icon: DollarSign, isActive: false },
      { title: "Fechamento", url: "/fechamento", icon: Calendar, isActive: false },
      { title: "Repasses", url: "/admin/repasses", icon: Receipt, isActive: false },
    ],
  },
  {
    section: "Administração",
    items: [
      { title: "Fornecedores", url: "/supplier", icon: Truck, isActive: false },
      { title: "Margens", url: "/margens", icon: Percent, isActive: false },
      { title: "CNAE/MCC", url: "/categories", icon: Briefcase, isActive: false },
      { title: "LGPD", url: "/consent/modules", icon: Shield, isActive: false },
      { title: "Configurações", url: "/config", icon: Settings, isActive: false },
    ],
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  tenantCustomization?: CustomerCustomization | null;
  isAdmin?: boolean;
  hasMerchantsAccess?: boolean;
  isCore?: boolean;
  authorizedMenus?: string[];
  userCategoryLabel?: string;
  isSuperAdmin?: boolean;
}

export function AppSidebar({ 
  tenantCustomization, 
  isAdmin = false, 
  hasMerchantsAccess = false, 
  isCore = false, 
  authorizedMenus = [], 
  userCategoryLabel = "Usuário",
  isSuperAdmin = false,
  ...sidebarProps 
}: AppSidebarProps) {
  const { state } = useSidebar();
  
  const teams = [
    {
      name: tenantCustomization?.name || "Consolle",
      logo: tenantCustomization?.imageUrl || "/outbank-logo.png",
      plan: userCategoryLabel,
    },
  ];

  const isMenuAuthorized = (url: string): boolean => {
    if (isSuperAdmin || isAdmin) return true;
    
    const menuId = URL_TO_MENU_ID[url];
    if (!menuId) return true;
    
    if (!authorizedMenus || authorizedMenus.length === 0) {
      return menuId === "dashboard";
    }
    
    return authorizedMenus.includes(menuId);
  };

  const isItemVisible = (url: string): boolean => {
    if (!isMenuAuthorized(url)) return false;
    
    switch (url) {
      case "/config":
      case "/categories":
      case "/supplier":
      case "/consent/modules":
      case "/bi":
        return isAdmin || isSuperAdmin;
      default:
        return true;
    }
  };

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isItemVisible(item.url)),
    }))
    .filter((section) => section.items.length > 0);
  
  return (
    <Sidebar collapsible="icon" {...sidebarProps}>
      <SidebarHeader className="h-16">
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <Separator className="bg-[#2a2a2a]" />
      <SidebarContent className="pt-4">
        <NavMain sections={filteredSections} />
      </SidebarContent>
      <SidebarFooter>{state !== "collapsed" && <UserMenu />}</SidebarFooter>
    </Sidebar>
  );
}
