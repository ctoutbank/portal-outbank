"use client";

import { SolicitationFeeDetail } from "../server/solicitationfee";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SolicitationFeeCardProps {
  solicitationFee?: SolicitationFeeDetail;
}

export default function SolicitationFeeCard({ solicitationFee }: SolicitationFeeCardProps) {
  return (
    <Card className="w-full max-w-full">
    
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          {/* Linha de 3 em cima */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="cnae" className="flex items-center">
                CNAE: <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="cnae"
                value={solicitationFee?.cnae || "-"}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mcc">MCC:</Label>
              <Input
                id="mcc"
                value={solicitationFee?.mcc || "-"}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidadeCnpjs">Quantidade de CNPJs:</Label>
              <Input
                id="quantidadeCnpjs"
                value={solicitationFee?.cnpjQuantity?.toString() || "-"}
                readOnly
              />
            </div>
          </div>
          {/* Linha de 2 em baixo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="ticketMedio">Ticket Médio:</Label>
              <Input
                id="ticketMedio"
                value={solicitationFee?.averageTicket?.toString() || "-"}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpvMensal">TPV Mensal:</Label>
              <Input
                id="tpvMensal"
                value={solicitationFee?.monthlyPosFee?.toString() || "-"}
                readOnly
              />
            </div>
          </div>
          
          

      
        </div>
      </CardContent>
    </Card>
  );
}