"use client"

import { MerchantData } from "@/app/dashboard/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CreditCard, DollarSign, TrendingDown, TrendingUp } from "lucide-react"
import { useEffect } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import RefreshButton from "@/app/dashboard/refresh-button"

interface DashboardProps {
  dashboardData: {
    totalEstabelecimentos: number;
    totalTransacoes: number;
    totalBruto: number;
    totalLucro: number;
    topMerchants: MerchantData[];
    lastUpdate?: Date;
  }
}

// Dados padrão para uso quando os dados reais não estão disponíveis
const defaultData = {
  totalEstabelecimentos: 0,
  totalTransacoes: 0,
  totalBruto: 0,
  totalLucro: 0,
  topMerchants: [],
  lastUpdate: new Date()
};

// Cores para os cards de clientes
const cardColors = [
  { border: 'border-orange-500', bg: 'bg-orange-500', progress: 'bg-orange-500' },
  { border: 'border-blue-500', bg: 'bg-blue-500', progress: 'bg-blue-500' },
  { border: 'border-green-500', bg: 'bg-green-500', progress: 'bg-green-500' },
  { border: 'border-purple-500', bg: 'bg-purple-500', progress: 'bg-purple-500' },
  { border: 'border-pink-500', bg: 'bg-pink-500', progress: 'bg-pink-500' },
];

// Formatar data
function formatLastUpdate(date?: Date) {
  if (!date) return 'Data desconhecida';
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(date));
}

export default function Dashboard({ dashboardData = defaultData }: DashboardProps) {
  // Efeito para logging de debug
  useEffect(() => {
    console.log("Dashboard data received:", dashboardData);
  }, [dashboardData]);

  // Garantir que dashboardData tenha valores válidos usando defaults onde necessário
  const data = {
    totalEstabelecimentos: dashboardData?.totalEstabelecimentos ?? defaultData.totalEstabelecimentos,
    totalTransacoes: dashboardData?.totalTransacoes ?? defaultData.totalTransacoes,
    totalBruto: dashboardData?.totalBruto ?? defaultData.totalBruto,
    totalLucro: dashboardData?.totalLucro ?? defaultData.totalLucro,
    topMerchants: dashboardData?.topMerchants ?? defaultData.topMerchants,
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
    <div className="space-y-4">
      {/* Cabeçalho com última atualização e botão de refresh */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Última atualização: {formatLastUpdate(data.lastUpdate)}
        </div>
        <RefreshButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Bruto total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.totalBruto)}
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">Total bruto das transações</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Lucro total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.totalLucro)}
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">Total de lucro realizado</p>
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

      {/* Gráfico de Barras */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Top 5 Estabelecimentos</CardTitle>
          <CardDescription>
            Desempenho de faturamento bruto dos 5 maiores estabelecimentos
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name"
                  tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                />
                <YAxis 
                  tickFormatter={(value) => new Intl.NumberFormat('pt-BR', { 
                    notation: 'compact',
                    compactDisplay: 'short',
                    style: 'currency', 
                    currency: 'BRL'
                  }).format(value)}
                />
                <Tooltip 
                  formatter={(value: number) => new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(value)}
                />
                <Bar dataKey="bruto" name="Valor Bruto" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-center">
              <div className="text-gray-500">
                <p>Nenhum estabelecimento com dados suficientes encontrado.</p>
                <p className="mt-2 text-xs">Os valores totais estão disponíveis nos cards acima.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 5 Clientes Cards */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle>Top 5 Estabelecimentos</CardTitle>
          <CardDescription>
            Os 5 estabelecimentos com maior volume de vendas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.topMerchants.length > 0 ? (
            <div className="mt-4">
              {data.topMerchants.map((merchant, index) => (
                <div 
                  key={merchant.id} 
                  className="group relative hover:bg-slate-50 transition-colors p-4 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    {/* Ranking e logo */}
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold ${cardColors[index % cardColors.length].bg}`}>
                        {index + 1}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center border">
                        {merchant.crescimento >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </div>
                    
                    {/* Detalhes */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                      {/* Nome */}
                      <div className="md:col-span-2">
                        <h3 className="text-xs font-medium line-clamp-1">{merchant.name}</h3>
                      </div>
                      
                      {/* Valores */}
                      <div className="md:col-span-1">
                        <p className="text-xs text-muted-foreground">Bruto</p>
                        <p className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            maximumFractionDigits: 0
                          }).format(merchant.bruto)}
                        </p>
                      </div>
                      
                      <div className="md:col-span-1">
                        <p className="text-xs text-muted-foreground">Lucro</p>
                        <p className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            maximumFractionDigits: 0
                          }).format(merchant.lucro)}
                        </p>
                      </div>
                      
                      {/* Crescimento */}
                      <div className="md:col-span-1">
                        <p className="text-xs text-muted-foreground">Crescimento</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          merchant.crescimento >= 5 ? 'bg-green-100 text-green-800' : 
                          merchant.crescimento >= 0 ? 'bg-blue-100 text-blue-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {merchant.crescimento >= 0 ? '+' : ''}{merchant.crescimento.toFixed(1)}%
                        </span>
                      </div>
                      
                      {/* Participação */}
                      <div className="md:col-span-1 flex flex-col">
                        <div className="flex justify-between mb-1">
                          <p className="text-xs text-muted-foreground">% do Total</p>
                          <p className="text-xs font-medium">{totalBruto > 0 ? ((merchant.bruto / totalBruto) * 100).toFixed(1) : '0.0'}%</p>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${cardColors[index % cardColors.length].progress}`}
                            style={{ width: `${totalBruto > 0 ? (merchant.bruto / totalBruto) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Seta indicadora */}
                    <div className="hidden md:flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-1 rounded-full hover:bg-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">Nenhum estabelecimento com dados reais encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados detalhados dos clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Dados dos Estabelecimentos</CardTitle>
          <CardDescription>
            Detalhamento dos 5 principais estabelecimentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.topMerchants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {data.topMerchants.map((merchant, index) => (
                <div key={merchant.id} className={`p-4 rounded-lg border ${cardColors[index % cardColors.length].border}`}>
                  <div className="font-medium truncate">{merchant.name}</div>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Bruto</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(merchant.bruto)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lucro</p>
                      <p className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(merchant.lucro)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Crescimento</p>
                      <div className={`flex items-center font-medium ${merchant.crescimento >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {merchant.crescimento >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {merchant.crescimento.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">% do Total</p>
                      <p className="font-medium">
                        {totalBruto > 0 ? ((merchant.bruto / totalBruto) * 100).toFixed(1) : '0.0'}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 w-full bg-secondary rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${cardColors[index % cardColors.length].progress}`}
                      style={{ width: `${totalBruto > 0 ? (merchant.bruto / totalBruto) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">Nenhum estabelecimento com dados detalhados disponível.</p>
              <p className="mt-2 text-xs text-gray-500">Os valores totais do ISO estão disponíveis nos cards acima.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 