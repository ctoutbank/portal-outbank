"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ChevronRight, ArrowLeft } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  showBackButton = false,
  backHref,
  backLabel = "Voltar",
  actions,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className="bg-[#171717] border-b border-[#2a2a2a] px-6 py-4">
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm mb-3">
          <Link
            href="/"
            className="text-[#616161] hover:text-white transition flex items-center"
          >
            <Home className="w-4 h-4" />
          </Link>
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-[#3a3a3a]" />
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-[#616161] hover:text-white transition"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-white">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm text-[#616161] hover:text-white transition mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{backLabel}</span>
            </button>
          )}
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          {subtitle && (
            <p className="text-sm text-[#808080] mt-1">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
