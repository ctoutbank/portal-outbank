'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Upload,
  FileText,
  Check,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  RefreshCw,
  Receipt,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface SettlementInvoice {
  id: number;
  settlementId: number;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  accessKey: string | null;
  invoiceNumber: string | null;
  invoiceValue: number | null;
  issuerCnpj: string | null;
  issuerName: string | null;
  validationStatus: string;
  validatedAt: string | null;
  validationError: string | null;
}

interface MonthlySettlement {
  id: number;
  userId: number;
  customerId: number;
  customerName: string;
  month: number;
  year: number;
  totalTransactions: number;
  totalAmount: number;
  commissionPercent: number;
  commissionValue: number;
  status: string;
  invoiceDeadline: string | null;
  paymentDeadline: string | null;
  paidAt: string | null;
  paidByUserId: number | null;
  invoice: SettlementInvoice | null;
}

interface RepasseData {
  settlements: MonthlySettlement[];
  yearSummary: {
    totalTransactions: number;
    totalAmount: number;
    totalCommission: number;
    eligibleAmount: number;
    paidAmount: number;
    pendingAmount: number;
  };
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'pending_invoice':
      return { label: 'Pendente NF', variant: 'draft' as const, icon: Clock };
    case 'validating':
      return { label: 'Validando', variant: 'info' as const, icon: RefreshCw };
    case 'eligible':
      return { label: 'Elegível', variant: 'success' as const, icon: Check };
    case 'paid':
      return { label: 'Pago', variant: 'success' as const, icon: DollarSign };
    case 'accumulated':
      return { label: 'Acumulado', variant: 'warning' as const, icon: AlertCircle };
    case 'pending_consolidation':
      return { label: 'Aguardando', variant: 'inactive' as const, icon: Clock };
    default:
      return { label: status, variant: 'inactive' as const, icon: Clock };
  }
};

export function RepasseSection() {
  const [data, setData] = useState<RepasseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/repasse?year=${selectedYear}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error loading repasse data:', error);
      toast.error('Erro ao carregar dados de repasse');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileUpload = async (settlementId: number, file: File) => {
    setUploading(settlementId);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('settlementId', settlementId.toString());

      const response = await fetch('/api/repasse/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      toast.success('Nota fiscal enviada para validação');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar nota fiscal');
    } finally {
      setUploading(null);
    }
  };

  const triggerFileInput = (settlementId: number) => {
    fileInputRefs.current[settlementId]?.click();
  };

  const allMonths = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const settlement = data?.settlements.find(s => s.month === month);
    return { month, settlement };
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32 bg-[#2a2a2a]" />
          <Skeleton className="h-10 w-10 bg-[#2a2a2a]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-48 bg-[#2a2a2a]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#616161]" />
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-32 bg-[#0a0a0a] border-[#2E2E2E] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-[#2E2E2E]">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            className="border-[#2E2E2E] text-white hover:bg-[#1a1a1a]"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {data?.yearSummary && (
          <div className="flex items-center gap-4 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#616161]">Total:</span>
              <span className="text-white font-semibold">{formatCurrency(data.yearSummary.totalCommission)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#616161]">Elegível:</span>
              <span className="text-emerald-400 font-semibold">{formatCurrency(data.yearSummary.eligibleAmount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#616161]">Pago:</span>
              <span className="text-green-400 font-semibold">{formatCurrency(data.yearSummary.paidAmount)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allMonths.map(({ month, settlement }) => {
          const currentDate = new Date();
          const isCurrentMonth = month === currentDate.getMonth() + 1 && selectedYear === currentDate.getFullYear();
          const isFutureMonth = selectedYear > currentDate.getFullYear() || 
            (selectedYear === currentDate.getFullYear() && month > currentDate.getMonth() + 1);
          
          const statusInfo = settlement ? getStatusInfo(settlement.status) : getStatusInfo('pending_consolidation');
          const StatusIcon = statusInfo.icon;
          
          const canUpload = settlement && 
            (settlement.status === 'pending_invoice' || settlement.status === 'accumulated') &&
            settlement.commissionValue >= 100;

          return (
            <Card 
              key={month} 
              className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl ${
                isCurrentMonth ? 'ring-2 ring-emerald-500/50' : ''
              } ${isFutureMonth ? 'opacity-50' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base">{MONTH_NAMES[month - 1]}</CardTitle>
                  <Badge variant={statusInfo.variant}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {settlement ? (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#808080]">Volume:</span>
                        <span className="text-white">{formatCurrency(settlement.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#808080]">Transações:</span>
                        <span className="text-white">{settlement.totalTransactions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#808080]">Comissão ({settlement.commissionPercent}%):</span>
                        <span className="text-emerald-400 font-semibold">{formatCurrency(settlement.commissionValue)}</span>
                      </div>
                    </div>

                    {settlement.invoiceDeadline && settlement.status === 'pending_invoice' && (
                      <div className="text-xs text-[#808080]">
                        Prazo NF: {new Date(settlement.invoiceDeadline).toLocaleDateString('pt-BR')}
                      </div>
                    )}

                    {settlement.invoice && (
                      <div className="flex items-center gap-2 text-xs bg-[#2a2a2a] rounded p-2">
                        <FileText className="w-4 h-4 text-[#808080]" />
                        <span className="text-[#808080] truncate flex-1">{settlement.invoice.fileName}</span>
                        {settlement.invoice.validationStatus === 'valid' && (
                          <FileCheck className="w-4 h-4 text-emerald-400" />
                        )}
                        {settlement.invoice.validationStatus === 'pending' && (
                          <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                        )}
                        {settlement.invoice.validationStatus === 'invalid' && (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    )}

                    {settlement.commissionValue < 100 && (
                      <div className="text-xs text-orange-400 bg-orange-500/10 rounded p-2">
                        Valor mínimo R$100 não atingido. Será acumulado.
                      </div>
                    )}

                    {canUpload && (
                      <>
                        <input
                          type="file"
                          accept=".pdf,.xml"
                          className="hidden"
                          ref={(el) => { fileInputRefs.current[settlement.id] = el; }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(settlement.id, file);
                          }}
                        />
                        <Button
                          onClick={() => triggerFileInput(settlement.id)}
                          variant="outline"
                          size="sm"
                          className="w-full border-[#2E2E2E] text-white hover:bg-[#2a2a2a]"
                          disabled={uploading === settlement.id}
                        >
                          {uploading === settlement.id ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {settlement.invoice ? 'Reenviar NF' : 'Enviar NF'}
                        </Button>
                      </>
                    )}

                    {settlement.status === 'paid' && settlement.paidAt && (
                      <div className="text-xs text-green-400 bg-green-500/10 rounded p-2">
                        Pago em {new Date(settlement.paidAt).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-[#616161]">
                    {isFutureMonth ? (
                      <span className="text-sm">Mês futuro</span>
                    ) : (
                      <>
                        <Receipt className="w-8 h-8 mb-2 opacity-50 text-white" />
                        <span className="text-sm">Sem dados</span>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
