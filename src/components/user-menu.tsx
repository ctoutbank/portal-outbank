// src/components/user-menu.tsx
"use client";

import { useUserCache } from "@/hooks/use-user-cache";
import { ChevronUp, LogOut, Settings, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConsentNotificationsBadge } from "@/features/consent/components/consent-notifications-badge";
import Link from "next/link";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useUserCache();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 origin-bottom-left rounded-xl bg-[#1a1a1a] p-1 shadow-lg ring-1 ring-white/10 transition-all border border-[#2a2a2a]">
          <div className="p-3">
            <div className="mb-2 flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-r from-purple-500 to-indigo-600">
                <div className="flex h-full w-full items-center justify-center text-base font-medium text-white">
                  {user.email?.[0]?.toUpperCase()}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-white">{user.email}</h3>
                <p className="text-xs text-[#808080]">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <Link
                href="/consent/modules"
                onClick={() => setIsOpen(false)}
                className="cursor-pointer flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-[#e0e0e0] transition-colors hover:bg-[#2a2a2a]"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#808080]" />
                  <span>Consentimento LGPD</span>
                </div>
                <ConsentNotificationsBadge />
              </Link>
              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className="cursor-pointer flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-[#e0e0e0] transition-colors hover:bg-[#2a2a2a]"
              >
                <Settings className="h-4 w-4 text-[#808080]" />
                <span>Meu Perfil</span>
              </Link>
            </div>
          </div>

          <div className="border-t border-[#2a2a2a] p-1">
            <button 
              onClick={() => logout()}
              className="cursor-pointer flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer flex items-center gap-2 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 shadow-sm transition-all hover:bg-[#2a2a2a]"
      >
        <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-r from-purple-500 to-indigo-600">
          <div className="flex h-full w-full items-center justify-center text-white">
            {user.email?.[0]?.toUpperCase()}
          </div>
        </div>
        <span className="hidden text-xs font-medium md:block">
          {user.email}
        </span>
        <ChevronUp
          className={`h-4 w-4 transition-transform ${
            isOpen ? "" : "rotate-180"
          }`}
        />
      </button>
    </div>
  );
}
