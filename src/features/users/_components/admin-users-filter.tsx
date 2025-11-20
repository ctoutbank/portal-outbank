"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
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
  const params = new URLSearchParams(searchParams?.toString() || "");
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const [email, setEmail] = useState(emailIn || "");
  const [name, setName] = useState(nameIn || "");
  const [customerId, setCustomerId] = useState(customerIdIn?.toString() || "");
  const [profileId, setProfileId] = useState(profileIdIn?.toString() || "");
  const [active, setActive] = useState(activeIn?.toString() || "");

  const handleFilter = () => {
    if (email) {
      params.set("email", email);
    } else {
      params.delete("email");
    }

    if (name) {
      params.set("name", name);
    } else {
      params.delete("name");
    }

    if (customerId) {
      params.set("customerId", customerId);
    } else {
      params.delete("customerId");
    }

    if (profileId) {
      params.set("profileId", profileId);
    } else {
      params.delete("profileId");
    }

    if (active) {
      params.set("active", active);
    } else {
      params.delete("active");
    }

    params.set("page", "1");
    startTransition(() => {
      router.replace(`/config/users?${params.toString()}`);
      setIsFiltersVisible(false);
    });
  };

  const handleClearFilters = () => {
    params.delete("email");
    params.delete("name");
    params.delete("customerId");
    params.delete("profileId");
    params.delete("active");
    params.set("page", "1");
    startTransition(() => {
      router.replace(`/config/users?${params.toString()}`);
      setEmail("");
      setName("");
      setCustomerId("");
      setProfileId("");
      setActive("");
      setIsFiltersVisible(false);
    });
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

            <div>
              <Label className="text-xs font-medium mb-1.5 block">ISO</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos os ISOs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os ISOs</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name || "Sem nome"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium mb-1.5 block">Perfil</Label>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos os perfis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os perfis</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id.toString()}>
                      {profile.name || "Sem nome"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium mb-1.5 block">Status</Label>
              <Select value={active} onValueChange={setActive}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
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
