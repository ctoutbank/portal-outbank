"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { useViewModeContext } from "@/contexts/ViewModeContext";
import { getSimulatedUserPermissions } from "@/app/margens/actions-new";
import type { CustomerCustomization } from "@/utils/serverActions";

interface SidebarWithViewModeProps {
  tenantCustomization?: CustomerCustomization | null;
  isAdmin: boolean;
  hasMerchantsAccess: boolean;
  isCore: boolean;
  authorizedMenus?: string[];
  userCategoryLabel?: string;
  isSuperAdmin: boolean;
}

interface SimulatedPermissions {
  authorizedMenus: string[];
  isCore: boolean;
  isExecutivo: boolean;
  isAdmin: boolean;
  category: string | null;
}

export function SidebarWithViewMode({
  tenantCustomization,
  isAdmin: serverIsAdmin,
  hasMerchantsAccess: serverHasMerchantsAccess,
  isCore: serverIsCore,
  authorizedMenus: serverAuthorizedMenus,
  userCategoryLabel: serverUserCategoryLabel,
  isSuperAdmin,
}: SidebarWithViewModeProps) {
  const viewModeContext = useViewModeContext();
  const [simulatedPerms, setSimulatedPerms] = useState<SimulatedPermissions | null>(null);
  
  const isSimulating = viewModeContext?.isSimulating ?? false;
  const simulatedUser = viewModeContext?.simulatedUser ?? null;

  useEffect(() => {
    async function fetchSimulatedPermissions() {
      if (isSimulating && simulatedUser?.id) {
        const perms = await getSimulatedUserPermissions();
        setSimulatedPerms(perms);
      } else {
        setSimulatedPerms(null);
      }
    }
    fetchSimulatedPermissions();
  }, [isSimulating, simulatedUser?.id]);

  const effectiveIsAdmin = isSimulating 
    ? (simulatedPerms?.isAdmin || false)
    : serverIsAdmin;
  
  const effectiveHasMerchantsAccess = isSimulating 
    ? (simulatedPerms?.isCore || false)
    : serverHasMerchantsAccess;
  
  const effectiveIsCore = isSimulating 
    ? (simulatedPerms?.isCore || false)
    : serverIsCore;

  const effectiveUserCategoryLabel = isSimulating 
    ? (simulatedPerms?.category || serverUserCategoryLabel)
    : serverUserCategoryLabel;

  const effectiveAuthorizedMenus = isSimulating && simulatedPerms?.authorizedMenus
    ? simulatedPerms.authorizedMenus
    : serverAuthorizedMenus;

  return (
    <AppSidebar
      variant="inset"
      tenantCustomization={tenantCustomization}
      isAdmin={effectiveIsAdmin}
      hasMerchantsAccess={effectiveHasMerchantsAccess}
      isCore={effectiveIsCore}
      authorizedMenus={effectiveAuthorizedMenus}
      userCategoryLabel={effectiveUserCategoryLabel}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
