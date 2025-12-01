"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { convertUTCToSaoPaulo } from "@/lib/datetime-utils";
import { getTerminalTypeLabel } from "@/lib/lookuptables/lookuptables-terminals";
import {
  getCardPaymentMethodLabel,
  getProcessingTypeLabel,
  getTransactionProductTypeLabel,
  getTransactionStatusLabel,
} from "@/lib/lookuptables/lookuptables-transactions";
import { formatCNPJ, formatCurrency } from "@/lib/utils";
import { TransactionDetail } from "../serverActions/transaction";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface TransactionDetailsProps {
  transaction: TransactionDetail;
}

export default function TransactionDetails({ transaction }: TransactionDetailsProps) {
  const router = useRouter();

  const getStatusBadgeVariant = (status: string | null) => {
    if (!status) return "secondary";

    if (status.includes("AUTHORIZED") || status.includes("APPROVED")) {
      return "success";
    } else if (status.includes("PENDING")) {
      return "pending";
    } else if (status.includes("DENIED") || status.includes("REJECTED")) {
      return "destructive";
    } else if (status.includes("CANCELED")) {
      return "outline";
    } else if (status.includes("EXPIRED")) {
      return "secondary";
    } else if (status.includes("PRE_AUTHORIZED")) {
      return "default";
    }
    return "secondary";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return convertUTCToSaoPaulo(dateStr, true);
  };

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      {/* Informações Principais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Transação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">NSU / ID</p>
              <p className="text-base font-semibold">{transaction.nsu || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={getStatusBadgeVariant(transaction.transactionStatus)}>
                {getTransactionStatusLabel(transaction.transactionStatus) || transaction.transactionStatus || "N/A"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Inserção</p>
              <p className="text-base">{formatDate(transaction.dtInsert)}</p>
            </div>
            {transaction.dtUpdate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Atualização</p>
                <p className="text-base">{formatDate(transaction.dtUpdate)}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor</p>
              <p className="text-base font-semibold text-lg">
                {formatCurrency(transaction.amount)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Moeda</p>
              <p className="text-base">{transaction.currency || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Estabelecimento */}
      <Card>
        <CardHeader>
          <CardTitle>Estabelecimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p className="text-base font-semibold">
                {transaction.merchantName?.toUpperCase() || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
              <p className="text-base">
                {transaction.merchantCNPJ ? formatCNPJ(transaction.merchantCNPJ) : "N/A"}
              </p>
            </div>
            {transaction.merchantCorporateName && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Razão Social</p>
                <p className="text-base">{transaction.merchantCorporateName}</p>
              </div>
            )}
            {transaction.customerName && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">ISO</p>
                <p className="text-base">{transaction.customerName}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações do Terminal */}
      <Card>
        <CardHeader>
          <CardTitle>Terminal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo</p>
              <p className="text-base">
                {getTerminalTypeLabel(transaction.terminalType || "") || transaction.terminalType || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Número Lógico</p>
              <p className="text-base">{transaction.terminalLogicalNumber || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo de Produto</p>
              <p className="text-base">
                {getTransactionProductTypeLabel(transaction.productType || "") || transaction.productType || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Bandeira</p>
              <p className="text-base">{transaction.brand || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Método de Processamento</p>
              <p className="text-base">
                {getCardPaymentMethodLabel(transaction.method || "") || transaction.method || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Canal de Vendas</p>
              <p className="text-base">
                {getProcessingTypeLabel(transaction.salesChannel || "") || transaction.salesChannel || "N/A"}
              </p>
            </div>
            {transaction.rrn && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">RRN</p>
                <p className="text-base">{transaction.rrn}</p>
              </div>
            )}
            {transaction.firstDigits && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Primeiros Dígitos</p>
                <p className="text-base">{transaction.firstDigits}</p>
              </div>
            )}
            {transaction.lastDigits && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Últimos Dígitos</p>
                <p className="text-base">{transaction.lastDigits}</p>
              </div>
            )}
            {transaction.productOrIssuer && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produto/Emissor</p>
                <p className="text-base">{transaction.productOrIssuer}</p>
              </div>
            )}
            {transaction.authorizerMerchantId && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID do Merchant no Autorizador</p>
                <p className="text-base">{transaction.authorizerMerchantId}</p>
              </div>
            )}
            {transaction.settlementManagementType && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo de Gestão de Liquidação</p>
                <p className="text-base">{transaction.settlementManagementType}</p>
              </div>
            )}
            {transaction.splitType && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo de Split</p>
                <p className="text-base">{transaction.splitType}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cancelamento</p>
              <p className="text-base">
                {transaction.cancelling ? "Sim" : "Não"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

