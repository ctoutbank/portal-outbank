"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Building2, CheckCircle, XCircle, Clock, CreditCard } from "lucide-react";
import type { MerchantsListResult } from "../server/merchants";

type MerchantsDashboardContentProps = {
  data: MerchantsListResult;
  isOpen: boolean;
};

export function MerchantsDashboardContent({
  data,
  isOpen,
}: MerchantsDashboardContentProps) {
  return (
    <Collapsible open={isOpen}>
      <CollapsibleContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 w-full max-w-full overflow-x-hidden">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">Total de Estabelecimentos</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">{data.totalCount}</div>
          <p className="text-xs text-muted-foreground">Total de estabelecimentos cadastrados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">Ativos</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-green-600">{data.active_count}</div>
          <p className="text-xs text-muted-foreground">Estabelecimentos ativos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">Inativos</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-red-600">{data.inactive_count}</div>
          <p className="text-xs text-muted-foreground">Estabelecimentos inativos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">KYC Pendente</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-yellow-600">{data.pending_kyc_count}</div>
          <p className="text-xs text-muted-foreground">Aguardando análise KYC</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">KYC Aprovado</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-green-600">{data.approved_kyc_count}</div>
          <p className="text-xs text-muted-foreground">KYC aprovado</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">KYC Rejeitado</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-red-600">{data.rejected_kyc_count}</div>
          <p className="text-xs text-muted-foreground">KYC rejeitado</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">Antecipação CP</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">{data.cp_anticipation_count}</div>
          <p className="text-xs text-muted-foreground">Com antecipação CP</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">Antecipação CNP</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">{data.cnp_anticipation_count}</div>
          <p className="text-xs text-muted-foreground">Com antecipação CNP</p>
        </CardContent>
      </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}

