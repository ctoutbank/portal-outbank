"use client";

import { useRouter } from "next/navigation";
import { SolicitationFeelist, deleteSolicitationFee } from "../server/solicitationfee";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export default function SolicitationFeeList({SolicitationFees}:{
    SolicitationFees: SolicitationFeelist
}) {
    const router = useRouter();
    
    const handleDelete = async (id: number) => {
        const confirm = window.confirm("Tem certeza que deseja deletar esta solicitação de tarifa?");
        if (confirm) {
            await deleteSolicitationFee(id);
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
                  CNAE
                  <ChevronDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead>
                  ISO
                  <ChevronDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
               
              
                <TableHead>
                  Data
                  <ChevronDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SolicitationFees?.solicitationFees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>
                    <Link
                      className="text-primary underline"
                      href={"/solicitationfee/" + fee.id}
                    >
                      {fee.cnae || ""}/{fee.mcc || ""}
                    </Link>
                  </TableCell>
                  <TableCell>{fee.customerName || "-"}</TableCell>
                  
                  <TableCell>{new Date(fee.dtinsert).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(fee.id)}
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