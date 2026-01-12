'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Receipt, 
  Calendar as CalendarIcon, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Image from 'next/image';
import { MarginsBreakdown } from '@/components/fechamento/MarginsBreakdown';
import { maskEstablishment, maskCNPJ } from '@/utils/mask-sensitive-data';
import { RepasseSection } from './repasse-section';

interface FechamentoTransaction {
  id: string;
  transactionDate: string;
  merchantName: string;
  merchantType: string;
  merchantDocument: string;
  customerName: string;
  customerId: number;
  amount: number;
  commissionPercent: number;
  profit: number;
  productType: string;
  brand: string;
  methodType: string;
  salesChannel: string;
  transactionStatus: string;
}

interface FechamentoSummary {
  totalTransactions: number;
  totalVolume: number;
  totalProfit: number;
  commissions: Array<{
    customerId: number;
    customerName: string;
    commissionPercent: number;
    transactionCount: number;
    volume: number;
    profit: number;
  }>;
}

interface FechamentoData {
  summary: FechamentoSummary;
  transactions: FechamentoTransaction[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  chartData: Array<{
    date: string;
    dayOfMonth: number;
    bruto: number;
    lucro: number;
    count: number;
  }>;
  shouldMaskData?: boolean;
}

const getMethodTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    CONTACTLESS: 'Contactless',
    CHIP: 'Chip',
    MAGNETIC: 'Magnético',
    MANUAL: 'Manual',
    ECOMMERCE: 'E-Commerce',
    POS: 'POS',
    MPOS: 'MPOS',
    TEF: 'TEF',
  };
  return labels[type?.toUpperCase()] || type || '-';
};

const getSalesChannelLabel = (channel: string) => {
  const labels: Record<string, string> = {
    PRESENCIAL: 'Presencial',
    REMOTE: 'Remoto',
    ECOMMERCE: 'E-Commerce',
    ONLINE: 'Online',
  };
  return labels[channel?.toUpperCase()] || channel || '-';
};

const translateProductType = (type: string) => {
  const labels: Record<string, string> = {
    DEBIT: 'Débito',
    CREDIT: 'Crédito',
    VOUCHER: 'Voucher',
    PIX: 'PIX',
    PREPAID_CREDIT: 'Crédito Pré-pago',
    PREPAID_DEBIT: 'Débito Pré-pago',
  };
  return labels[type?.toUpperCase()] || type || '-';
};

const translateStatus = (status: string | null) => {
  if (!status) return 'N/A';
  const statusMap: Record<string, string> = {
    CANCELED: 'Cancelada',
    EXPIRED: 'Expirada',
    PENDING: 'Pendente',
    DENIED: 'Negada',
    PRE_AUTHORIZED: 'Pré-autorizada',
    AUTHORIZED: 'Autorizada',
    APPROVED: 'Aprovada',
    REJECTED: 'Rejeitada',
    ERROR: 'Falhou',
  };
  for (const [key, value] of Object.entries(statusMap)) {
    if (status.includes(key)) return value;
  }
  return status;
};

const getStatusBadgeClass = (status: string | null) => {
  if (!status) return 'bg-[#2a2a2a] text-[#808080]';
  if (status.includes('AUTHORIZED') || status.includes('APPROVED')) {
    return 'bg-[#1a3a2a] text-[#4ade80]';
  } else if (status.includes('DENIED') || status.includes('REJECTED')) {
    return 'bg-[#3a1a1a] text-[#f87171]';
  }
  return 'bg-[#2a2a2a] text-[#808080]';
};

const getValueColorClass = (value: number, type: 'profit' | 'neutral' = 'profit'): string => {
  if (type === 'neutral') return 'text-white';
  if (value < 0) return 'text-red-500';
  if (value > 0) return 'text-emerald-400';
  return 'text-white';
};

const getMarginBadgeVariant = (value: number): 'info' | 'destructive' | 'inactive' => {
  if (value < 0) return 'destructive';
  if (value > 0) return 'info';
  return 'inactive';
};

const renderBrand = (brand: string | null) => {
  if (!brand) return '-';
  const brandUpper = brand.toUpperCase();
  const iconSize = { width: 40, height: 24 };
  
  if (brandUpper.includes('VISA')) {
    return (
      <div className="flex items-center justify-center">
        <Image src="/visa-trasso-dourado.svg" alt="Visa" width={iconSize.width} height={iconSize.height} className="object-contain" />
      </div>
    );
  }
  if (brandUpper.includes('MASTERCARD') || brandUpper.includes('MASTER')) {
    return (
      <div className="flex items-center justify-center">
        <Image src="/mastercard-modern-design.svg" alt="Mastercard" width={iconSize.width} height={iconSize.height} className="object-contain" />
      </div>
    );
  }
  if (brandUpper.includes('HIPERCARD') || brandUpper.includes('HIPER')) {
    return (
      <div className="flex items-center justify-center">
        <Image src="/hipercard.svg" alt="Hipercard" width={iconSize.width} height={iconSize.height} className="object-contain" />
      </div>
    );
  }
  if (brandUpper.includes('ELO')) {
    return (
      <div className="flex items-center justify-center">
        <Image src="/elo.svg" alt="Elo" width={iconSize.width} height={iconSize.height} className="object-contain brightness-0 invert" />
      </div>
    );
  }
  if (brandUpper.includes('AMEX') || brandUpper.includes('AMERICAN')) {
    return (
      <div className="flex items-center justify-center">
        <Image src="/american-express.svg" alt="American Express" width={iconSize.width} height={iconSize.height} className="object-contain" />
      </div>
    );
  }
  if (brandUpper.includes('CABAL')) {
    return (
      <div className="flex items-center justify-center">
        <Image src="/cabal.svg" alt="Cabal" width={iconSize.width} height={iconSize.height} className="object-contain" />
      </div>
    );
  }
  if (brandUpper.includes('PIX')) {
    return (
      <div className="flex items-center justify-center">
        <Image src="/pix.svg" alt="PIX" width={iconSize.width} height={iconSize.height} className="object-contain" />
      </div>
    );
  }
  return brand;
};

interface FechamentoClientProps {
  simulatedUserId?: number | null;
}

export function FechamentoClient({ simulatedUserId }: FechamentoClientProps = {}) {
  const [data, setData] = useState<FechamentoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customerId, setCustomerId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [activeChart, setActiveChart] = useState<'tpv' | 'lucro' | 'transacoes' | 'repasse'>('tpv');

  useEffect(() => {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateFrom(firstOfMonth.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  }, []);

  const loadData = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('dateFrom', dateFrom);
      params.set('dateTo', dateTo);
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      if (customerId) params.set('customerId', customerId);
      if (simulatedUserId) params.set('simulatedUserId', simulatedUserId.toString());

      const response = await fetch(`/api/fechamento?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error loading fechamento data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, customerId, page, pageSize, simulatedUserId]);

  useEffect(() => {
    if (dateFrom && dateTo) {
      loadData();
    }
  }, [loadData]);

  // Limites de data: 3 anos atrás até hoje (memoizado) - deve estar antes de qualquer return
  const { today, threeYearsAgo } = useMemo(() => {
    const now = new Date();
    const pastDate = new Date();
    pastDate.setFullYear(now.getFullYear() - 3);
    return { today: now, threeYearsAgo: pastDate };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setPage(1);
  };

  const handleCustomerFilter = (value: string) => {
    setCustomerId(value === 'all' ? '' : value);
    setPage(1);
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-80 bg-[#1a1a1a]" />
        <Skeleton className="h-12 bg-[#1a1a1a]" />
        <Skeleton className="h-96 bg-[#1a1a1a]" />
      </div>
    );
  }

  const chartData = data?.chartData || [];
  const total = {
    tpv: chartData.reduce((acc, curr) => acc + curr.bruto, 0),
    lucro: chartData.reduce((acc, curr) => acc + curr.lucro, 0),
    transacoes: chartData.reduce((acc, curr) => acc + curr.count, 0),
  };
  const totalDays = chartData.length;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{formatXAxisLabel(data.date)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calcular intervalo dinâmico para o eixo X baseado no número de dias
  const getXAxisInterval = (dataLength: number) => {
    if (dataLength <= 31) return 0; // Mostrar todos
    if (dataLength <= 60) return 2; // A cada 3 dias
    if (dataLength <= 90) return 4; // A cada 5 dias
    if (dataLength <= 180) return 6; // A cada 7 dias
    if (dataLength <= 365) return 14; // A cada 15 dias
    return 29; // A cada 30 dias
  };

  const xAxisInterval = getXAxisInterval(chartData.length);

  // Formatar data para exibição no eixo X
  const formatXAxisLabel = (date: string) => {
    if (!date) return '';
    const parts = date.split('-');
    if (parts.length >= 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return date;
  };

  return (
    <div className="space-y-6">
      {/* Filtros - Movidos para cima do gráfico */}
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        <div className="flex items-center gap-1 sm:gap-2">
          <Label className="text-[#616161] text-xs sm:text-sm">De:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal bg-[#0a0a0a] border-[#2E2E2E] text-white hover:bg-[#1a1a1a] text-xs sm:text-sm",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(new Date(dateFrom), "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateFrom ? new Date(dateFrom) : undefined}
                onSelect={(date) => {
                  if (date) {
                    setDateFrom(format(date, "yyyy-MM-dd"));
                    setPage(1);
                  }
                }}
                fromDate={threeYearsAgo}
                toDate={today}
                showMonthYearPicker
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Label className="text-[#616161] text-xs sm:text-sm">Até:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal bg-[#0a0a0a] border-[#2E2E2E] text-white hover:bg-[#1a1a1a] text-xs sm:text-sm",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(new Date(dateTo), "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateTo ? new Date(dateTo) : undefined}
                onSelect={(date) => {
                  if (date) {
                    setDateTo(format(date, "yyyy-MM-dd"));
                    setPage(1);
                  }
                }}
                fromDate={threeYearsAgo}
                toDate={today}
                showMonthYearPicker
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="border-[#2E2E2E] text-white hover:bg-[#1a1a1a]">
              <Filter className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#141414] border-[#2E2E2E] w-64">
            <DropdownMenuLabel className="text-[#616161]">Filtrar por ISO</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#2E2E2E]" />
            <div className="p-2">
              <Select value={customerId || 'all'} onValueChange={handleCustomerFilter}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#2E2E2E] text-white">
                  <SelectValue placeholder="Todos os ISOs" />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#2E2E2E]">
                  <SelectItem value="all">Todos os ISOs</SelectItem>
                  {data?.summary.commissions.map((comm) => (
                    <SelectItem key={comm.customerId} value={comm.customerId.toString()}>
                      {comm.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

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

      {/* Gráfico */}
      <Card className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-[#2a2a2a] p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle className="text-white text-2xl font-bold">Fechamento</CardTitle>
            <CardDescription className="text-[#808080]">
              Visualize suas comissões e lucros por transação • {totalDays} dias
            </CardDescription>
          </div>
          <div className="flex flex-wrap">
            <button
              data-active={activeChart === 'tpv'}
              className={`relative z-30 flex flex-col justify-center gap-1 border-t border-[#2a2a2a] px-4 py-3 text-left sm:border-l sm:border-t-0 sm:px-6 sm:py-4 ${
                activeChart === 'tpv' ? 'bg-[#252525]' : 'bg-[#1f1f1f] hover:bg-[#252525]'
              }`}
              onClick={() => setActiveChart('tpv')}
            >
              <span className="text-lg font-bold leading-none text-white sm:text-2xl">
                {formatCurrency(total.tpv)}
              </span>
              <span className="text-xs text-[#808080]">TPV</span>
            </button>
            <button
              data-active={activeChart === 'lucro'}
              className={`relative z-30 flex flex-col justify-center gap-1 border-t border-l border-[#2a2a2a] px-4 py-3 text-left sm:border-t-0 sm:px-6 sm:py-4 ${
                activeChart === 'lucro' ? 'bg-[#252525]' : 'bg-[#1f1f1f] hover:bg-[#252525]'
              }`}
              onClick={() => setActiveChart('lucro')}
            >
              <span className={`text-lg font-bold leading-none sm:text-2xl ${getValueColorClass(total.lucro)}`}>
                {formatCurrency(total.lucro)}
              </span>
              <span className="text-xs text-[#808080]">Lucro</span>
            </button>
            <button
              data-active={activeChart === 'transacoes'}
              className={`relative z-30 flex flex-col justify-center gap-1 border-t border-l border-[#2a2a2a] px-4 py-3 text-left sm:border-t-0 sm:px-6 sm:py-4 ${
                activeChart === 'transacoes' ? 'bg-[#252525]' : 'bg-[#1f1f1f] hover:bg-[#252525]'
              }`}
              onClick={() => setActiveChart('transacoes')}
            >
              <span className="text-lg font-bold leading-none text-[#f59e0b] sm:text-2xl">
                {total.transacoes.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs text-[#808080]">Transações</span>
            </button>
            <button
              data-active={activeChart === 'repasse'}
              className={`relative z-30 flex flex-col justify-center gap-1 border-t border-l border-[#2a2a2a] px-4 py-3 text-left sm:border-t-0 sm:px-6 sm:py-4 ${
                activeChart === 'repasse' ? 'bg-[#252525]' : 'bg-[#1f1f1f] hover:bg-[#252525]'
              }`}
              onClick={() => setActiveChart('repasse')}
            >
              <span className="text-lg font-bold leading-none text-purple-400 sm:text-2xl">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6 inline text-white" />
              </span>
              <span className="text-xs text-[#808080]">Repasse</span>
            </button>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          {activeChart === 'repasse' ? (
            <RepasseSection />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              {activeChart === 'transacoes' ? (
                <LineChart data={chartData} margin={{ left: 0, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval={xAxisInterval}
                    stroke="#808080"
                    tick={{ fill: '#808080', fontSize: 9 }}
                    tickFormatter={formatXAxisLabel}
                  />
                  <YAxis
                    stroke="#808080"
                    tick={{ fill: '#808080', fontSize: 9 }}
                    tickFormatter={(value) => value.toLocaleString('pt-BR')}
                    width={40}
                  />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-3 shadow-lg">
                            <p className="text-white font-semibold mb-2">{formatXAxisLabel(data.date)}</p>
                            <p className="text-sm text-[#f59e0b]">
                              Transações: {data.count.toLocaleString('pt-BR')}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 2 }}
                    activeDot={{ r: 4, fill: '#f59e0b' }}
                    name="Transações"
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData} margin={{ left: 0, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval={xAxisInterval}
                    stroke="#808080"
                    tick={{ fill: '#808080', fontSize: 9 }}
                    tickFormatter={formatXAxisLabel}
                  />
                  <YAxis
                    stroke="#808080"
                    tick={{ fill: '#808080', fontSize: 9 }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                      return `${value}`;
                    }}
                    width={45}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey={activeChart === 'tpv' ? 'bruto' : 'lucro'}
                    maxBarSize={12}
                    name={activeChart === 'tpv' ? 'TPV' : 'Lucro'}
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => {
                      const value = activeChart === 'tpv' ? entry.bruto : entry.lucro;
                      let color = '#3b82f6';
                      if (activeChart === 'lucro') {
                        color = value < 0 ? '#ef4444' : value > 0 ? '#10b981' : '#ffffff';
                      }
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Transações com Abas */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <Tabs defaultValue="transacoes" className="w-full">
          <div className="p-3 sm:p-4 border-b border-[#2a2a2a]">
            <TabsList className="bg-[#0a0a0a] border border-[#2E2E2E]">
              <TabsTrigger value="transacoes" className="data-[state=active]:bg-[#2E2E2E] text-white text-xs sm:text-sm px-2 sm:px-3">
                Transações
              </TabsTrigger>
              <TabsTrigger value="por-iso" className="data-[state=active]:bg-[#2E2E2E] text-white text-xs sm:text-sm px-2 sm:px-3">
                Por ISO
              </TabsTrigger>
              <TabsTrigger value="minhas-margens" className="data-[state=active]:bg-[#2E2E2E] text-white text-xs sm:text-sm px-2 sm:px-3">
                Minhas Margens
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="transacoes" className="m-0">
            <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1f1f1f] border-b border-[#2a2a2a] hover:bg-[#1f1f1f]">
                <TableHead className="text-center p-4 text-white text-xs font-medium uppercase tracking-wider">ISO</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Data</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Estabelecimento</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Canal</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Tipo</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Bandeira</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Valor</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider text-right">Margem</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider text-right">Lucro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.transactions.map((tx) => {
                const { date, time } = formatDate(tx.transactionDate);
                return (
                  <TableRow key={tx.id} className="border-b border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors">
                    <TableCell className="text-center p-4 text-[#b0b0b0] text-[13px]">
                      <Badge variant="outline" className="text-xs">
                        {tx.customerName}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-medium">{date}</span>
                        <span className="text-[11px] text-[#606060]">{time}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-medium">
                          {data?.shouldMaskData 
                            ? maskEstablishment(tx.merchantName)?.toUpperCase() 
                            : (tx.merchantName?.toUpperCase() || 'N/A')}
                        </span>
                        {tx.merchantDocument && (
                          <span className="text-[11px] text-[#606060]">
                            {data?.shouldMaskData ? maskCNPJ(tx.merchantDocument) : tx.merchantDocument}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white">{getMethodTypeLabel(tx.methodType)}</span>
                        <span className="text-[11px] text-[#606060]">{getSalesChannelLabel(tx.salesChannel)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                      {translateProductType(tx.productType)}
                    </TableCell>
                    <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                      {renderBrand(tx.brand)}
                    </TableCell>
                    <TableCell className="p-4 text-white font-semibold text-[13px]">
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-xs font-medium ${getStatusBadgeClass(tx.transactionStatus)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          tx.transactionStatus?.includes('AUTHORIZED') || tx.transactionStatus?.includes('APPROVED') 
                            ? 'bg-[#4ade80]' 
                            : tx.transactionStatus?.includes('DENIED') || tx.transactionStatus?.includes('REJECTED') 
                              ? 'bg-[#f87171]' 
                              : 'bg-[#808080]'
                        }`}></span>
                        {translateStatus(tx.transactionStatus)}
                      </span>
                    </TableCell>
                    <TableCell className="p-4 text-right">
                      <Badge variant={getMarginBadgeVariant(tx.commissionPercent)} className="text-xs">
                        {tx.commissionPercent.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className={`p-4 text-right font-medium text-[13px] ${getValueColorClass(tx.profit)}`}>
                      {formatCurrency(tx.profit)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!data?.transactions || data.transactions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-[#616161] py-8">
                    Nenhuma transação encontrada para o período selecionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-t border-[#2a2a2a] gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-[#616161] text-sm">Itens:</Label>
                  <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-20 bg-[#0a0a0a] border-[#2E2E2E] text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141414] border-[#2E2E2E]">
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {data?.pagination && data.pagination.totalItems > 0 && (
                  <span className="text-sm text-[#616161]">
                    Mostrando {((data.pagination.page - 1) * data.pagination.pageSize) + 1} - {Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.totalItems)} de {data.pagination.totalItems}
                  </span>
                )}
              </div>
              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1 || loading}
                    className="border-[#2E2E2E] text-white hover:bg-[#1a1a1a]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-white px-2">
                    Página {data.pagination.page} de {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= data.pagination.totalPages || loading}
                    className="border-[#2E2E2E] text-white hover:bg-[#1a1a1a]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="por-iso" className="m-0 p-3 sm:p-4">
            {data?.summary.commissions && data.summary.commissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {data.summary.commissions.map((comm) => (
                  <div key={comm.customerId} className="p-3 sm:p-4 bg-[#0a0a0a] rounded-lg border border-[#2E2E2E]">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-medium text-white text-sm sm:text-base truncate max-w-[70%]">{comm.customerName}</span>
                      <Badge variant={getMarginBadgeVariant(comm.commissionPercent)} className="text-xs shrink-0">
                        {comm.commissionPercent.toFixed(2)}%
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm">
                      <div className="shrink-0">
                        <span className="text-[#616161] block whitespace-nowrap">Transações</span>
                        <p className="text-white font-medium">{comm.transactionCount.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <span className="text-[#616161] block whitespace-nowrap">Volume</span>
                        <p className="text-white font-medium whitespace-nowrap">{formatCurrency(comm.volume)}</p>
                      </div>
                      <div className="shrink-0">
                        <span className="text-[#616161] block whitespace-nowrap">Lucro</span>
                        <p className={`font-medium whitespace-nowrap ${getValueColorClass(comm.profit)}`}>{formatCurrency(comm.profit)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-[#616161] py-8">
                Nenhum ISO encontrado para o período selecionado
              </div>
            )}
          </TabsContent>

          <TabsContent value="minhas-margens" className="m-0 p-3 sm:p-4">
            <MarginsBreakdown />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
