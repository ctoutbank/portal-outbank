"use client";

import * as React from "react";

import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";

interface TeamSwitcherProps {
  teams: {
    name: string;
    logo: string;
    plan: string;
  }[];
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const { state } = useSidebar();
  const activeTeam = teams[0];

  if (!activeTeam) {
    return null;
  }

  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenu className="h-full">
      <SidebarMenuItem className="h-full flex items-center">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start gap-2 px-2 w-full"} py-3`}>
          <div className="relative flex aspect-square size-9 items-center justify-center rounded-lg bg-[#2a2a2a] shrink-0">
            <Image
              src={activeTeam.logo}
              alt="logo"
              width={80}
              height={80}
              className="rounded-md"
            />
          </div>
          {!isCollapsed && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-white">{activeTeam.name}</span>
              <span className="truncate text-xs text-gray-400">
                {activeTeam.plan}
              </span>
            </div>
          )}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
