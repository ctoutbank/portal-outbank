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
import { ExternalLink } from "lucide-react";
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
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden w-full">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1f1f1f] border-b border-[#2a2a2a] hover:bg-[#1f1f1f]">
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                  Nome
                </TableHead>

                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                  Subdomínio
                </TableHead>

                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                  Usuários
                </TableHead>

                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                  Módulos
                </TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Customers?.customers.map((customer) => (
                <TableRow 
                  key={customer.id}
                  className="border-b border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors"
                >
                  <TableCell className="p-4 text-[#b0b0b0] text-[13px] whitespace-nowrap">
                    <Link
                      className="text-white hover:underline font-medium"
                      href={"/customers/" + customer.id}
                    >
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell className="p-4 text-[#b0b0b0] text-[13px] whitespace-nowrap">
                    {customer.subdomain ? (
                      <a
                        href={`https://${customer.subdomain}.consolle.one`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:underline inline-flex items-center gap-1"
                      >
                        <span className="font-mono truncate max-w-[200px] text-[11px] text-[#606060]">{customer.subdomain}.consolle.one</span>
                        <ExternalLink className="h-3 w-3 opacity-60 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-[#808080]">--</span>
                    )}
                  </TableCell>
                  <TableCell className="p-4 text-[#b0b0b0] text-[13px] whitespace-nowrap">
                    <span className="text-white font-medium tabular-nums">
                      {customer.userCount || 0}
                    </span>
                  </TableCell>
                  <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                    <ModuleBadges
                      moduleSlugs={["adq", ...(customer.moduleSlugs || [])].filter((slug, index, self) => self.indexOf(slug) === index)}
                      maxVisible={3}
                      showIcon={true}
                    />
                  </TableCell>
                  <TableCell className="p-4 text-[#b0b0b0] text-[13px] whitespace-nowrap">
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
