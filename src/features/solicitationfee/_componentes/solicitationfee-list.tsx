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
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="border rounded-lg shadow-sm bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-sm whitespace-nowrap">
                    CNAE/MCC
                    <ChevronDown className="ml-2 h-4 w-4 inline opacity-50" />
                  </TableHead>
                  <TableHead className="font-semibold text-sm whitespace-nowrap">
                    ISO
                    <ChevronDown className="ml-2 h-4 w-4 inline opacity-50" />
                  </TableHead>
                  <TableHead className="font-semibold text-sm whitespace-nowrap">
                    Data
                    <ChevronDown className="ml-2 h-4 w-4 inline opacity-50" />
                  </TableHead>
                  <TableHead className="font-semibold text-sm text-center whitespace-nowrap">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SolicitationFees?.solicitationFees.map((fee) => (
                  <TableRow 
                    key={fee.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="py-3">
                      <Link
                        className="text-primary hover:underline font-medium text-sm"
                        href={"/solicitationfee/" + fee.id}
                      >
                        {fee.cnae || ""}/{fee.mcc || ""}
                      </Link>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm">{fee.customerName || "-"}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm font-medium tabular-nums">
                        {new Date(fee.dtinsert).toLocaleDateString("pt-BR")}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(fee.id)}
                        className="cursor-pointer"
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
      </div>
    );
  } 