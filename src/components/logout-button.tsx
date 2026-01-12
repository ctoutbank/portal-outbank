"use client";

import { Button } from "@/components/ui/button";
import { useUserCache } from "@/hooks/use-user-cache";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export function LogoutButton({ variant = "outline", className }: LogoutButtonProps) {
  const { logout } = useUserCache();
  
  return (
    <Button variant={variant} className={className} onClick={() => logout()}>
      Fazer Logout
    </Button>
  );
}
