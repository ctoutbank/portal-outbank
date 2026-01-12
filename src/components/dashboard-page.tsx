"use client"

import { MerchantData } from "@/app/dashboard/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CreditCard, DollarSign } from "lucide-react"
import { useEffect, useState } from "react"

interface IsoStats {
  customerId: number;
  customerName: string;
  transactionCount: number;
  volume: number;
  profit: number;
  marginPercent: number;
  merchantCount?: number;
}

interface DashboardProps {
  dashboardData: {
    totalEstabelecimentos: number;
    totalTransacoes: number;
    totalBruto: number;
    totalLucro: number;
    topMerchants: MerchantData[];
    isoBreakdown?: IsoStats[];
    lastUpdate?: Date;
  }
}

const defaultData = {
  totalEstabelecimentos: 0,
  totalTransacoes: 0,
  totalBruto: 0,
  totalLucro: 0,
  topMerchants: [],
  isoBreakdown: [] as IsoStats[],
  lastUpdate: new Date()
};

// Formatar data de forma consistente (evita erro de hidratação)
function formatLastUpdate(date?: Date) {
  if (!date) return 'Data desconhecida';
  
  const d = new Date(date);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} (UTC)`;
}

export default function Dashboard({ dashboardData = defaultData }: DashboardProps) {
  const [mounted, setMounted] = useState(false);

  // Efeito para marcar quando o componente foi montado no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Efeito para logging de debug
  useEffect(() => {
    console.log("Dashboard data received:", dashboardData);
  }, [dashboardData]);

  const data = {
    totalEstabelecimentos: dashboardData?.totalEstabelecimentos ?? defaultData.totalEstabelecimentos,
    totalTransacoes: dashboardData?.totalTransacoes ?? defaultData.totalTransacoes,
    totalBruto: dashboardData?.totalBruto ?? defaultData.totalBruto,
    totalLucro: dashboardData?.totalLucro ?? defaultData.totalLucro,
    topMerchants: dashboardData?.topMerchants ?? defaultData.topMerchants,
    isoBreakdown: dashboardData?.isoBreakdown ?? defaultData.isoBreakdown,
    lastUpdate: dashboardData?.lastUpdate ?? defaultData.lastUpdate
  };

  // Converter os dados para o formato esperado pelo gráfico
  const chartData = data.topMerchants.map(merchant => ({
    name: merchant.name || "Estabelecimento sem nome",
    bruto: merchant.bruto || 0,
    lucro: merchant.lucro || 0,
    crescimento: merchant.crescimento || 0
  }));

  // Calcular o total bruto para percentuais
  const totalBruto = chartData.reduce((sum, item) => sum + item.bruto, 0);

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 overflow-x-hidden bg-[#161616] space-y-5">
      {/* Cabeçalho com última atualização */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-[#5C5C5C]">
          Última atualização: {mounted ? formatLastUpdate(data.lastUpdate) : '...'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">TPV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.totalBruto)}
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">Total de volume processado</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Lucro</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.totalLucro)}
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">Lucro baseado na sua margem</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Transações realizadas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{data.totalTransacoes}</div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">Total de transações realizadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Estabelecimentos Cadastrados</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{data.totalEstabelecimentos}</div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">Total de estabelecimentos cadastrados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por ISO */}
      {data.isoBreakdown && data.isoBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Resumo por ISO</CardTitle>
            <CardDescription className="text-xs">
              Detalhamento de volume e lucro por ISO vinculado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {data.isoBreakdown.map((iso) => {
                const volumePercent = data.totalBruto > 0 ? (iso.volume / data.totalBruto) * 100 : 0;
                return (
                  <div 
                    key={iso.customerId} 
                    className="p-4 rounded-lg border border-[#2a2a2a]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white text-sm truncate max-w-[70%]">
                        {iso.customerName}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded border border-blue-500/50 text-blue-400 bg-blue-500/10">
                        {iso.marginPercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TPV</span>
                        <span className="text-white font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(iso.volume)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lucro</span>
                        <span className="text-white font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(iso.profit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transações</span>
                        <span className="text-white">
                          {iso.transactionCount.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ECs</span>
                        <span className="text-white">
                          {(iso.merchantCount || 0).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {data.isoBreakdown && data.isoBreakdown.length > 1 && (
                        <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">% Total do TPV</span>
                            <span className="text-white">{volumePercent.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#2a2a2a] rounded-full mt-1 overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${volumePercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
} 