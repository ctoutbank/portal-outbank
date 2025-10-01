"use client";

import React, { useEffect, useState } from 'react';

interface ClientOnlyChartProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ClientOnlyChart({ children, fallback }: ClientOnlyChartProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback || (
      <div className="h-[320px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Carregando gráfico...</div>
      </div>
    );
  }

  return <>{children}</>;
}
