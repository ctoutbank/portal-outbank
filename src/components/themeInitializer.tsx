"use client";

import { useEffect, useState } from "react";

export default function ThemeInitializer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return null;
}
