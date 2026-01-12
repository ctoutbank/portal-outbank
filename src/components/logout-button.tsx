"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function LogoutButton({ 
  variant = "default", 
  size = "default",
  className 
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Logout realizado com sucesso!");
        router.push("/tenant/auth/sign-in");
        router.refresh();
      } else {
        toast.error("Erro ao fazer logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Erro ao fazer logout. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? "Saindo..." : "Sair"}
    </Button>
  );
}
