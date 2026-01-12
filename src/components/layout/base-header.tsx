"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ChevronRight, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "../ui/sidebar";

export type BreadcrumbItemType = {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  url?: string;
};

interface BaseHeaderProps {
  breadcrumbItems: BreadcrumbItemType[];
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  rightActions?: React.ReactNode;
}

const BaseHeader = ({
  breadcrumbItems,
  showBackButton = false,
  backHref,
  backLabel = "Voltar",
  rightActions,
}: BaseHeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header className="flex h-auto min-h-16 shrink-0 items-center justify-between gap-2 border-b border-[#2a2a2a] bg-[#171717] px-4 sm:px-6 py-3">
      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 flex-shrink-0">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6 bg-[#2a2a2a]" />
        </div>
        
        <nav className="flex items-center gap-1 sm:gap-2 text-sm min-w-0 overflow-hidden">
          <Link
            href="/"
            className="text-[#616161] hover:text-white transition flex items-center flex-shrink-0"
          >
            <Home className="w-4 h-4" />
          </Link>
          
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-4 h-4 text-[#3a3a3a] flex-shrink-0" />
              {item.url ? (
                <Link
                  href={item.url}
                  className="text-[#616161] hover:text-white transition truncate max-w-[150px] sm:max-w-none"
                >
                  {item.title}
                </Link>
              ) : (
                <span className="text-white truncate max-w-[150px] sm:max-w-none">
                  {item.title}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {rightActions}
        
        {showBackButton && (
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-sm text-[#b0b0b0] hover:text-white bg-[#212121] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-md transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default BaseHeader;
