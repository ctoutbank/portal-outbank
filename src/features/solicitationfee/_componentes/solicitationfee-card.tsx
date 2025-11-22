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
    <Card className="w-full max-w-full overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="cnae" className="flex items-center text-sm font-medium">
              CNAE: <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="cnae"
              value={solicitationFee?.cnae || "-"}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mcc" className="text-sm font-medium">MCC:</Label>
            <Input
              id="mcc"
              value={solicitationFee?.mcc || "-"}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantidadeCnpjs" className="text-sm font-medium">
              Quantidade de CNPJs:
            </Label>
            <Input
              id="quantidadeCnpjs"
              value={solicitationFee?.cnpjQuantity?.toString() || "-"}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticketMedio" className="text-sm font-medium">
              Ticket Médio:
            </Label>
            <Input
              id="ticketMedio"
              value={solicitationFee?.averageTicket?.toString() || "-"}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpvMensal" className="text-sm font-medium">
              TPV Mensal:
            </Label>
            <Input
              id="tpvMensal"
              value={solicitationFee?.monthlyPosFee?.toString() || "-"}
              readOnly
              className="bg-muted"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}