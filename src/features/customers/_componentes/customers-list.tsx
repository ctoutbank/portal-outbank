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
import { ChevronDown, ExternalLink } from "lucide-react";

export default function CustomersList({
  Customers,
}: {
  Customers: Customerslist;
}) {
  return (
    <div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Nome
                <ChevronDown className="ml-2 h-4 w-4 inline" />
              </TableHead>

              <TableHead>
                Tipo de Gerenciamento de Liquidação
                <ChevronDown className="ml-2 h-4 w-4 inline" />
              </TableHead>

              <TableHead>
                Subdomínio
              </TableHead>

              <TableHead>
                Usuários
              </TableHead>

              <TableHead>
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Customers?.customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <Link
                    className="text-primary underline"
                    href={"/customers/" + customer.id}
                  >
                    {customer.name}
                  </Link>
                </TableCell>
                <TableCell>{customer.settlementManagementType}</TableCell>
                <TableCell>
                  {customer.subdomain ? (
                    <a
                      href={`https://${customer.subdomain}.consolle.one`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {customer.subdomain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">--</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {customer.userCount || 0}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    isActive={customer.isActive ?? true}
                    hasCustomization={customer.hasCustomization}
                    hasUsers={customer.userCount}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
