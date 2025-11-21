"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FilterIcon } from "lucide-react";

type AdminUsersFilterProps = {
  emailIn?: string;
  nameIn?: string;
  customerIdIn?: number;
  profileIdIn?: number;
  activeIn?: boolean;
  profiles: Array<{ id: number; name: string | null; description?: string | null }>;
  customers: Array<{ id: number; name: string | null; slug?: string | null }>;
};

export function AdminUsersFilter({
  emailIn,
  nameIn,
  customerIdIn,
  profileIdIn,
  activeIn,
  profiles,
  customers,
}: AdminUsersFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  
  const [email, setEmail] = useState(emailIn || "");
  const [name, setName] = useState(nameIn || "");
  const [customerId, setCustomerId] = useState(customerIdIn?.toString() || "");
  const [profileId, setProfileId] = useState(profileIdIn?.toString() || "");
  const [active, setActive] = useState(activeIn?.toString() || "");

  // Sincronizar estados com searchParams quando a página carregar
  useEffect(() => {
    if (searchParams) {
      const emailParam = searchParams.get("email") || "";
      const nameParam = searchParams.get("name") || "";
      const customerIdParam = searchParams.get("customerId") || "";
      const profileIdParam = searchParams.get("profileId") || "";
      const activeParam = searchParams.get("active") || "";

      // Apenas atualizar se os valores mudaram para evitar loops
      if (emailParam !== email) setEmail(emailParam);
      if (nameParam !== name) setName(nameParam);
      if (customerIdParam !== customerId) setCustomerId(customerIdParam);
      if (profileIdParam !== profileId) setProfileId(profileIdParam);
      if (activeParam !== active) setActive(activeParam);
    }
  }, [searchParams]); // Removidas dependências que causavam loops

  const handleFilter = () => {
    try {
      const params = new URLSearchParams(searchParams?.toString() || "");

      // Limpar valores vazios
      if (email && email.trim()) {
        params.set("email", email.trim());
      } else {
        params.delete("email");
      }

      if (name && name.trim()) {
        params.set("name", name.trim());
      } else {
        params.delete("name");
      }

      if (customerId && customerId.trim()) {
        params.set("customerId", customerId.trim());
      } else {
        params.delete("customerId");
      }

      if (profileId && profileId.trim()) {
        params.set("profileId", profileId.trim());
      } else {
        params.delete("profileId");
      }

      if (active && active.trim()) {
        params.set("active", active.trim());
      } else {
        params.delete("active");
      }

      // Sempre resetar para página 1 quando filtrar
      params.set("page", "1");

      router.replace(`/config/users?${params.toString()}`);
      setIsFiltersVisible(false);
    } catch (error) {
      console.error("Erro ao aplicar filtros:", error);
    }
  };

  const handleClearFilters = () => {
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      
      router.replace(`/config/users?${params.toString()}`);
      
      // Limpar estados locais
      setEmail("");
      setName("");
      setCustomerId("");
      setProfileId("");
      setActive("");
      setIsFiltersVisible(false);
    } catch (error) {
      console.error("Erro ao limpar filtros:", error);
    }
  };

  const activeFiltersCount =
    (emailIn ? 1 : 0) +
    (nameIn ? 1 : 0) +
    (customerIdIn ? 1 : 0) +
    (profileIdIn ? 1 : 0) +
    (activeIn !== undefined ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleFilter();
    }
  };

  return (
    <div className="relative z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => setIsFiltersVisible(!isFiltersVisible)}
          className="flex items-center gap-2"
        >
          <FilterIcon className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            className="text-sm text-muted-foreground"
          >
            Limpar Filtros
          </Button>
        )}
      </div>
      
      {isFiltersVisible && (
        <div
          className="absolute left-0 mt-2 bg-background border rounded-lg p-4 shadow-md w-[900px] z-50"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Email</Label>
                <Input
                  placeholder="Email do usuário"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-9"
                />
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Nome</Label>
                <Input
                  placeholder="Nome do usuário"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">ISO</Label>
                <Select 
                  value={customerId || "all"} 
                  onValueChange={(value) => {
                    setCustomerId(value === "all" ? "" : value);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos os ISOs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os ISOs</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name || "Sem nome"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Status</Label>
                <Select 
                  value={active || "all"} 
                  onValueChange={(value) => {
                    setActive(value === "all" ? "" : value);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Perfil</Label>
                <Select 
                  value={profileId || "all"} 
                  onValueChange={(value) => {
                    setProfileId(value === "all" ? "" : value);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos os perfis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os perfis</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id.toString()}>
                        {profile.name || "Sem nome"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 mt-4 border-t">
            <Button onClick={handleFilter} className="flex items-center gap-2" size="sm">
              Filtrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
