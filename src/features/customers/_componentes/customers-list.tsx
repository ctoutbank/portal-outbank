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
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

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
                  {customer.isActive ? (
                    <Badge variant="default" className="bg-green-600">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Inativo
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
