"use client";

import { LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

interface Props {
  sections: NavSection[];
}

export function NavMain({ sections }: Props) {
  const activeUrl = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      {sections.map((section, index) => (
        <SidebarGroup key={section.section} className="py-0">
          {index > 0 && (
            <Separator className="my-2 bg-[#2a2a2a]" />
          )}
          <SidebarMenu>
            {section.items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={item.url === activeUrl || item.isActive}
                  tooltip={item.title}
                >
                  <a href={item.url}>
                    {item.icon && (
                      <div className={`relative flex items-center justify-center w-5 h-5 rounded-md bg-sidebar-accent/10 flex-shrink-0 ${isCollapsed ? "mx-auto" : ""}`}>
                        <item.icon
                          className="size-4 text-white"
                          strokeWidth={2}
                        />
                      </div>
                    )}
                    <span className="font-medium group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
