"use client";

import { useRouter } from "next/navigation";
import { Customerslist, deleteCustomer } from "../server/customers";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";









export default function CustomersList({Customers}:{
    Customers: Customerslist
}) {


    const router = useRouter();
    
    const handleDelete = async (id: number) => {
        const confirm = window.confirm("Tem certeza que deseja deletar este Iso?");
        if (confirm) {
            await deleteCustomer(id);
            router.refresh();
        }
    }

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
                  Ações
                  <ChevronDown className="ml-2 h-4 w-4 inline" />
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
                  
                  <TableCell>{customer.settlementManagementType || "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(customer.id)}
                    >
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
