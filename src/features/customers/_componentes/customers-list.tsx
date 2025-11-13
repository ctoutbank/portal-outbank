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
      <div className="border rounded-lg shadow-sm bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-sm">
                Nome
                <ChevronDown className="ml-2 h-4 w-4 inline opacity-50" />
              </TableHead>

              <TableHead className="font-semibold text-sm">
                Subdomínio
              </TableHead>

              <TableHead className="font-semibold text-sm">
                Usuários
              </TableHead>

              <TableHead className="font-semibold text-sm">
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
                <TableCell className="py-3">
                  <Link
                    className="text-primary hover:underline font-medium text-sm"
                    href={"/customers/" + customer.id}
                  >
                    {customer.name}
                  </Link>
                </TableCell>
                <TableCell className="py-3">
                  {customer.subdomain ? (
                    <a
                      href={`https://${customer.subdomain}.consolle.one`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                    >
                      <span className="font-mono">{customer.subdomain}</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">--</span>
                  )}
                </TableCell>
                <TableCell className="py-3">
                  <span className="text-sm font-medium tabular-nums">
                    {customer.userCount || 0}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <StatusBadge
                    isActive={customer.isActive ?? true}
                    hasCustomization={customer.hasCustomization}
                    hasUsers={customer.userCount}
                    subdomain={customer.subdomain}
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
