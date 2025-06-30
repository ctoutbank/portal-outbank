"use client";

import { Briefcase, ChartPie, Table, Users } from "lucide-react";
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

const data = {
  teams: [
    {
      name: "Outbank",
      logo: "/outbank-logo.png",
      plan: "Empresarial",
    },
  ],
  navMain: [
    { title: "Dashboard", url: "/", icon: ChartPie, isActive: false },
    {
      title: "ISOS",
      url: "/customers",
      icon: Users,
      isActive: false,
    },
    {
      title: "Solicitações de Taxa",
      url: "/solicitationfee",
      icon: Table,
      isActive: false,
    },
    { title: "CNAE", url: "/categories", icon: Briefcase, isActive: false },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-col items-center">
        <TeamSwitcher teams={data.teams} />
        <Separator orientation="horizontal" className="bg-[#d2d2d2]" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>{state !== "collapsed" && <UserMenu />}</SidebarFooter>
    </Sidebar>
  );
}
