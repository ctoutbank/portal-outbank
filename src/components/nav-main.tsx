"use client";

import { ChevronRight, LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface Item {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
  }[];
}

interface Props {
  items: Item[];
}

export function NavMain({ items }: Props) {
  const activeUrl = usePathname();
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          // Verifica se qualquer submenu está ativo
          const isAnySubItemActive = item.items?.some(
            (subItem) => activeUrl === subItem.url
          );

          return (
            <SidebarMenuItem key={item.title}>
              {item.items ? (
                <Collapsible
                  defaultOpen={item.isActive || isAnySubItemActive}
                  className="group/collapsible"
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isAnySubItemActive}
                    >
                      {item.icon && (
                        <div className="relative flex items-center justify-center w-6 h-6 rounded-md bg-sidebar-accent/10 flex-shrink-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:inset-0 group-data-[collapsible=icon]:m-auto group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:h-6">
                          <item.icon
                            className="size-5 text-sidebar-foreground"
                            strokeWidth={2}
                          />
                        </div>
                      )}
                      <span className="font-medium group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent
                    className={cn(
                      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
                      "overflow-hidden transition-all duration-300"
                    )}
                  >
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={activeUrl == subItem.url}
                          >
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuButton
                  asChild
                  isActive={item.url === activeUrl || item.isActive}
                >
                  <a href={item.url}>
                    {item.icon && (
                      <div className="relative flex items-center justify-center w-6 h-6 rounded-md bg-sidebar-accent/10 flex-shrink-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:inset-0 group-data-[collapsible=icon]:m-auto group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:h-6">
                        <item.icon
                          className="size-5 text-sidebar-foreground"
                          strokeWidth={2}
                        />
                      </div>
                    )}
                    <span className="font-medium group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </a>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
