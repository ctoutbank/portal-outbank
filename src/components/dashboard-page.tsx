"use client"

import { CustomerData } from "@/app/dashboard/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CreditCard, DollarSign, TrendingDown, TrendingUp } from "lucide-react"
import { useEffect } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface DashboardProps {
  dashboardData: {
    totalEstabelecimentos: number;
    totalTransacoes: number;
    totalBruto: number;
    totalLucro: number;
    topCustomers: CustomerData[];
  }
}

// Dados padrão para uso quando os dados reais não estão disponíveis
const defaultData = {
  totalEstabelecimentos: 0,
  totalTransacoes: 0,
  totalBruto: 0,
  totalLucro: 0,
  topCustomers: []
};

// Cores para os cards de clientes
const cardColors = [
  { border: 'border-orange-500', bg: 'bg-orange-500', progress: 'bg-orange-500' },
  { border: 'border-blue-500', bg: 'bg-blue-500', progress: 'bg-blue-500' },
  { border: 'border-green-500', bg: 'bg-green-500', progress: 'bg-green-500' },
  { border: 'border-purple-500', bg: 'bg-purple-500', progress: 'bg-purple-500' },
  { border: 'border-pink-500', bg: 'bg-pink-500', progress: 'bg-pink-500' },
];

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
    topCustomers: dashboardData?.topCustomers ?? defaultData.topCustomers
  };

  // Converter os dados para o formato esperado pelo gráfico
  const chartData = data.topCustomers.map(customer => ({
    name: customer.name || "Cliente sem nome",
    bruto: customer.bruto || 0,
    lucro: customer.lucro || 0,
    crescimento: customer.crescimento || 0
  }));

  // Calcular o total bruto para percentuais
  const totalBruto = chartData.reduce((sum, item) => sum + item.bruto, 0);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold"></h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bruto total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {data.totalBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">Total bruto das transações</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {data.totalLucro.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">Total de lucro realizado</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações realizadas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTransacoes}</div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">Total de transações realizadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estabelecimentos Cadastrados</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalEstabelecimentos}</div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">Total de estabelecimentos cadastrados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gráfico de Barras</CardTitle>
          <CardDescription>
            Mostrando os principais clientes ({chartData.length})
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="flex justify-end gap-2 mb-2">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#f97d63] mr-2"></div>
              <span className="text-sm">Bruto (R$)</span>
              <span className="ml-2 font-bold">
                R$ {data.totalBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center ml-4">
              <div className="w-4 h-4 bg-[#374151] mr-2"></div>
              <span className="text-sm">Lucro (R$)</span>
              <span className="ml-2 font-bold">
                R$ {data.totalLucro.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            {chartData.length > 0 ? (
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [
                    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                    ""
                  ]}
                />
                <Bar dataKey="bruto" name="Bruto" fill="#f97d63" barSize={40} />
                <Bar dataKey="lucro" name="Lucro" fill="#374151" barSize={40} />
              </BarChart>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Não há dados disponíveis para exibir.</p>
              </div>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cards dos principais clientes */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Top 5 Clientes (ISOs)</h2>
        <p className="text-sm text-muted-foreground mb-4">Principais clientes por valor bruto</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {chartData.slice(0, 5).map((item, index) => {
            const color = cardColors[index % cardColors.length];
            const percentualBruto = totalBruto > 0 
              ? (item.bruto / totalBruto * 100).toFixed(1) 
              : "0.0";
            const percentualLucro = item.bruto > 0
              ? (item.lucro / item.bruto * 100).toFixed(1)
              : "0.0";
            // Usar o valor real de crescimento vindo da API
            const growthValue = item.crescimento;
            const isPositiveGrowth = growthValue >= 0;
                
            return (
              <Card key={index} className={`border-t-4 ${color.border} overflow-hidden`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-md truncate">{item.name}</h3>
                    <div className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mb-2 text-xs">
                    {isPositiveGrowth ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={isPositiveGrowth ? "text-green-500" : "text-red-500"}>
                      {isPositiveGrowth ? "+" : ""}{growthValue.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Valor Bruto</span>
                        <span className="font-medium">
                          R$ {item.bruto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${color.progress}`} 
                          style={{ width: `${percentualBruto}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground mt-1">{percentualBruto}%</div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Lucro</span>
                        <span className="font-medium">
                          R$ {item.lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-right text-xs text-muted-foreground mt-1">{percentualLucro}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {chartData.length === 0 && (
            <Card className="col-span-full p-6">
              <p className="text-center text-muted-foreground">Não há dados disponíveis para exibir.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Tabela de dados */}
      <Card>
        <CardHeader>
          <CardTitle>Dados dos Clientes (ISOs)</CardTitle>
          <CardDescription>Detalhamento por cliente ({chartData.length})</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-medium">Cliente</th>
                  <th className="p-2 text-left font-medium">Bruto (R$)</th>
                  <th className="p-2 text-left font-medium">Lucro (R$)</th>
                  <th className="p-2 text-left font-medium">Margem (%)</th>
                </tr>
              </thead>
              <tbody>
                {chartData.length > 0 ? (
                  chartData.map((item) => (
                    <tr key={item.name} className="border-b">
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">
                        {item.bruto.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td className="p-2">
                        {item.lucro.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td className="p-2">{item.bruto > 0 ? ((item.lucro / item.bruto) * 100).toFixed(2) : "0.00"}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      Não há dados disponíveis para exibir.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/50">
                  <td className="p-2 font-medium">Total</td>
                  <td className="p-2 font-medium">
                    {data.totalBruto.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="p-2 font-medium">
                    {data.totalLucro.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="p-2 font-medium">{data.totalBruto > 0 ? ((data.totalLucro / data.totalBruto) * 100).toFixed(2) : "0.00"}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  )
} 