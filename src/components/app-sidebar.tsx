"use client";

import { Briefcase, ChartPie, Settings, Table, Truck, Users, Shield, Store, DollarSign, BarChart, Calendar, type LucideIcon } from "lucide-react";
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

const navMainItems: Array<{
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  children?: Array<{
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
  }>;
}> = [
  { title: "Dashboard", url: "/", icon: ChartPie, isActive: false },
  {
    title: "ISOs",
    url: "/customers",
    icon: Users,
    isActive: false,
  },
  { title: "CNAE/MCC", url: "/categories", icon: Briefcase, isActive: false },
  { title: "Estabelecimentos", url: "/merchants", icon: Store, isActive: false },
  { title: "Vendas", url: "/transactions", icon: DollarSign, isActive: false },
  { title: "Analytics", url: "/analytics", icon: BarChart, isActive: false },
  { title: "Fechamento", url: "/portal/closing", icon: Calendar, isActive: false },
  {title: "Fornecedores", url: "/supplier", icon: Truck, isActive: false},
  {
    title: "Consentimento LGPD",
    url: "/consent/modules",
    icon: Shield,
    isActive: false,
  },
  {
    title: "Configurações",
    url: "/config",
    icon: Settings,
    isActive: false,
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  tenantCustomization?: CustomerCustomization | null;
  isAdmin?: boolean;
  hasMerchantsAccess?: boolean;
}

export function AppSidebar({ tenantCustomization, isAdmin = false, hasMerchantsAccess = false, ...props }: AppSidebarProps) {
  const { state } = useSidebar();
  
  const teams = [
    {
      name: tenantCustomization?.name || "Outbank",
      logo: tenantCustomization?.imageUrl || "/outbank-logo.png",
      plan: "Empresarial",
    },
  ];

  // Filtrar itens do menu baseado em permissões
  const filteredNavItems = navMainItems
    .filter((item) => {
      // Item "ISOS" só aparece para admins
      if (item.url === "/customers") {
        return isAdmin;
      }
      // Item "Estabelecimentos" só aparece para quem tem acesso
      if (item.url === "/merchants") {
        return hasMerchantsAccess;
      }
      // Item "Configurações" só aparece para admins
      if (item.url === "/config") {
        return isAdmin;
      }
      return true;
    })
    .map((item) => {
      // Se tiver children, converter para items (para manter compatibilidade)
      if (item.children) {
        return {
          ...item,
          items: item.children.filter((child) => {
            // Subitem "Usuários" só aparece para admins
            if (child.url === "/config/users") {
              return isAdmin;
            }
            return true;
          }),
        };
      }
      return item;
    });
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-col items-center h-20 relative">
        <div className="flex-1 flex items-center justify-center">
          <TeamSwitcher teams={teams} />
        </div>
        <Separator orientation="horizontal" className="bg-[#2a2a2a] absolute bottom-0 left-0 right-0" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavItems} />
      </SidebarContent>
      <SidebarFooter>{state !== "collapsed" && <UserMenu />}</SidebarFooter>
    </Sidebar>
  );
}
