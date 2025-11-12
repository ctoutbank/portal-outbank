import { db } from "@/db/drizzle";
import { customers } from "../../../../drizzle/schema";
import { count, eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

async function getIsos() {
  try {
    // Conta todos os ISOs (customers) ativos
    const totalResult = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.isActive, true));
    
    const total = totalResult[0]?.count || 0;
    
    // Lista os ISOs
    const isos = await db
      .select({
        id: customers.id,
        name: customers.name,
        customerId: customers.customerId,
        slug: customers.slug,
        settlementManagementType: customers.settlementManagementType,
        idParent: customers.idParent,
      })
      .from(customers)
      .where(eq(customers.isActive, true))
      .orderBy(customers.id);
    
    return {
      total: Number(total),
      isos
    };
  } catch (error) {
    console.error('Erro ao buscar ISOs:', error);
    return {
      total: 0,
      isos: []
    };
  }
}

export default async function IsosPage() {
  const { total, isos } = await getIsos();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de ISOs</h1>
          <p className="text-muted-foreground">
            Visualize todos os ISOs (Independent Sales Organizations) cadastrados
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total de ISOs Ativos</CardTitle>
          <CardDescription>
            Quantidade total de ISOs cadastrados e ativos no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">{total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de ISOs</CardTitle>
          <CardDescription>
            Detalhes de todos os ISOs cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum ISO encontrado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Tipo de Liquidação</TableHead>
                    <TableHead>ID Parent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isos.map((iso) => (
                    <TableRow key={iso.id}>
                      <TableCell className="font-mono text-xs">{iso.id}</TableCell>
                      <TableCell className="font-medium">{iso.name || '-'}</TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-muted rounded text-xs">
                          {iso.customerId || '-'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-muted rounded text-xs">
                          {iso.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        {iso.settlementManagementType ? (
                          <Badge variant="outline">
                            {iso.settlementManagementType}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {iso.idParent || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
