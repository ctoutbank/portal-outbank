"use client";

import { Customerslist } from "../server/customers";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ModuleBadges } from "@/components/ui/module-badge";
import { ChevronDown, ExternalLink } from "lucide-react";
import { SSOButton } from "./sso-button";
import { useEffect, useState } from "react";

export default function CustomersList({
  Customers,
}: {
  Customers: Customerslist;
}) {
  const [userAllowedCustomers, setUserAllowedCustomers] = useState<number[]>([]);

  useEffect(() => {
    // Buscar ISOs permitidos para o usuário atual
    fetch("/api/auth/user-info")
      .then((res) => res.json())
      .then((data) => {
        if (data.allowedCustomers) {
          setUserAllowedCustomers(data.allowedCustomers);
        } else if (data.idCustomer) {
          // Se for usuário normal, incluir seu ISO principal
          setUserAllowedCustomers([data.idCustomer]);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar ISOs permitidos:", error);
      });
  }, []);

  const hasAccessToCustomer = (customerId: number) => {
    // Se não há ISOs permitidos ainda, mostrar todos (será atualizado após fetch)
    if (userAllowedCustomers.length === 0) return true;
    return userAllowedCustomers.includes(customerId);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="border rounded-lg shadow-sm bg-card overflow-hidden w-full">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold text-sm whitespace-nowrap">
                  Nome
                  <ChevronDown className="ml-2 h-4 w-4 inline opacity-50" />
                </TableHead>

                <TableHead className="font-semibold text-sm whitespace-nowrap">
                  Subdomínio
                </TableHead>

                <TableHead className="font-semibold text-sm text-center whitespace-nowrap">
                  SSO
                </TableHead>

                <TableHead className="font-semibold text-sm whitespace-nowrap">
                  Usuários
                </TableHead>

                <TableHead className="font-semibold text-sm whitespace-nowrap">
                  Módulos
                </TableHead>
                <TableHead className="font-semibold text-sm whitespace-nowrap">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Customers?.customers.map((customer) => (
                <TableRow 
                  key={customer.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="py-3 whitespace-nowrap">
                    <Link
                      className="text-primary hover:underline font-medium text-sm"
                      href={"/customers/" + customer.id}
                    >
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell className="py-3 whitespace-nowrap">
                    {customer.subdomain ? (
                      <a
                        href={`https://${customer.subdomain}.consolle.one`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                      >
                        <span className="font-mono truncate max-w-[200px]">{customer.subdomain}.consolle.one</span>
                        <ExternalLink className="h-3 w-3 opacity-60 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">--</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-center whitespace-nowrap">
                    <SSOButton
                      customerId={customer.id}
                      customerSlug={customer.subdomain}
                      hasAccess={customer.subdomain ? true : false}
                    />
                  </TableCell>
                  <TableCell className="py-3 whitespace-nowrap">
                    <span className="text-sm font-medium tabular-nums">
                      {customer.userCount || 0}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <ModuleBadges
                      moduleSlugs={["adq", ...(customer.moduleSlugs || [])].filter((slug, index, self) => self.indexOf(slug) === index)}
                      maxVisible={3}
                      showIcon={true}
                    />
                  </TableCell>
                  <TableCell className="py-3 whitespace-nowrap">
                    <StatusBadge
                      isActive={customer.isActive ?? true}
                      hasCustomization={customer.hasCustomization}
                      hasUsers={customer.userCount}
                      subdomain={customer.subdomain}
                      isoStatus={customer.isoStatus}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
