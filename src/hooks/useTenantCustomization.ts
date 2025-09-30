"use client";

import { useEffect, useState } from "react";
import { getCustomizationByCustomerId } from "@/utils/serverActions";
import type { CustomerCustomization } from "@/utils/serverActions";

export function useTenantCustomization(customerId?: number) {
  const [customization, setCustomization] = useState<CustomerCustomization | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerId) return;

    const loadCustomization = async () => {
      setLoading(true);
      try {
        const data = await getCustomizationByCustomerId(customerId);
        setCustomization(data);
      } catch (error) {
        console.error("Error loading tenant customization:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomization();
  }, [customerId]);

  return { customization, loading };
}
