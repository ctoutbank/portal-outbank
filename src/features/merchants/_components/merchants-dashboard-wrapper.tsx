"use client";

import { useState } from "react";
import { MerchantsDashboardContent } from "./merchants-dashboard-content";
import { MerchantsDashboardToggle } from "./merchants-dashboard-toggle";
import type { MerchantsListResult } from "../server/merchants";

type MerchantsDashboardWrapperProps = {
  data: MerchantsListResult;
  children: React.ReactNode;
};

export function MerchantsDashboardWrapper({
  data,
  children,
}: MerchantsDashboardWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 justify-between mb-1">
        <div className="flex items-center gap-2 flex-1">
          {children}
          <MerchantsDashboardToggle isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
        </div>
      </div>
      <div className="mt-4">
        <MerchantsDashboardContent data={data} isOpen={isOpen} />
      </div>
    </>
  );
}

