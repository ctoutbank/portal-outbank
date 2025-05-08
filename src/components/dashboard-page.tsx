"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Building2, CreditCard, DollarSign, Download, MoreHorizontal } from "lucide-react"

export default function Dashboard() {
  const [period, setPeriod] = useState("month")

  // Dados de exemplo
  const data = [
    { name: "Cliente A", bruto: 4500, lucro: 350 },
    { name: "Cliente B", bruto: 3200, lucro: 280 },
    { name: "Cliente C", bruto: 2800, lucro: 220 },
    { name: "Cliente D", bruto: 2200, lucro: 180 },
    { name: "Cliente E", bruto: 1800, lucro: 150 },
  ]

  // Calcular totais
  const totalBruto = data.reduce((sum, item) => sum + item.bruto, 0)
  const totalLucro = data.reduce((sum, item) => sum + item.lucro, 0)
  const totalTransacoes = 121
  const totalEstabelecimentos = 15

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold"></h1>
        <div className="flex items-center gap-2">
          <Select defaultValue={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Exportar dados
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bruto total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-red-500 bg-red-100 px-1 py-0.5 rounded">-33.39%</p>
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
              R$ {totalLucro.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-red-500 bg-red-100 px-1 py-0.5 rounded">-33.39%</p>
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
            <div className="text-2xl font-bold">{totalTransacoes}</div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-red-500 bg-red-100 px-1 py-0.5 rounded">-42.92%</p>
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
            <div className="text-2xl font-bold">{totalEstabelecimentos}</div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-green-500 bg-green-100 px-1 py-0.5 rounded">0%</p>
              <p className="text-xs text-muted-foreground">Total de estabelecimentos cadastrados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bar" className="w-full">
        <TabsList>
          <TabsTrigger value="bar">Gráfico de Barras</TabsTrigger>
          <TabsTrigger value="table">Tabela</TabsTrigger>
        </TabsList>
        <TabsContent value="bar">
          <Card>
            <CardHeader>
              <CardTitle>Gráfico de Barras</CardTitle>
              <CardDescription>Mostrando os 5 principais clientes</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="flex justify-end gap-2 mb-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-[#f97d63] mr-2"></div>
                  <span className="text-sm">Bruto (R$)</span>
                  <span className="ml-2 font-bold">
                    R$ {totalBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center ml-4">
                  <div className="w-4 h-4 bg-[#374151] mr-2"></div>
                  <span className="text-sm">Lucro (R$)</span>
                  <span className="ml-2 font-bold">
                    R$ {totalLucro.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={data}
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
                  <Bar dataKey="bruto" fill="#f97d63" barSize={40} />
                  <Bar dataKey="lucro" fill="#374151" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Dados dos Clientes</CardTitle>
              <CardDescription>Detalhamento por cliente</CardDescription>
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
                    {data.map((item) => (
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
                        <td className="p-2">{((item.lucro / item.bruto) * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/50">
                      <td className="p-2 font-medium">Total</td>
                      <td className="p-2 font-medium">
                        {totalBruto.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td className="p-2 font-medium">
                        {totalLucro.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td className="p-2 font-medium">{((totalLucro / totalBruto) * 100).toFixed(2)}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
} 