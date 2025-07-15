import React from "react";

export default function EmailTemplate({ purchaseLink, children }: { purchaseLink?: string; children?: React.ReactNode }) {
  return <div>{children || purchaseLink || "Email de exemplo"}</div>;
} 