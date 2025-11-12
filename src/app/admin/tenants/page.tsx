import { neon } from "@neondatabase/serverless";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

async function getTenants() {
  try {
    const sql = neon(process.env.POSTGRES_URL!);
    
    // Conta registros na tabela customer_customization (tenants)
    const result = await sql`
      SELECT COUNT(*) as total FROM customer_customization
    `;
    
    const total = result[0]?.total || 0;
    
    // Lista os tenants criados
    const tenants = await sql`
      SELECT 
        id,
        slug,
        name,
        customer_id as "customerId",
        primary_color as "primaryColor",
        secondary_color as "secondaryColor",
        image_url as "imageUrl",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM customer_customization
      ORDER BY created_at DESC
    `;
    
    return {
      total: Number(total),
      tenants
    };
  } catch (error) {
    console.error('Erro ao buscar tenants:', error);
    return {
      total: 0,
      tenants: []
    };
  }
}

export default async function TenantsPage() {
  const { total, tenants } = await getTenants();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Tenants</h1>
          <p className="text-muted-foreground">Visualize todos os tenants cadastrados no sistema</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total de Tenants Criados</CardTitle>
          <CardDescription>
            Quantidade total de tenants de adquirência registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">{total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Tenants</CardTitle>
          <CardDescription>
            Detalhes de todos os tenants cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum tenant encontrado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Cor Primária</TableHead>
                    <TableHead>Logo</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant: any) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-mono text-xs">{tenant.id}</TableCell>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-muted rounded text-xs">
                          {tenant.slug}
                        </code>
                      </TableCell>
                      <TableCell>{tenant.customerId || '-'}</TableCell>
                      <TableCell>
                        {tenant.primaryColor ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded border" 
                              style={{ backgroundColor: tenant.primaryColor }}
                            />
                            <span className="text-xs">{tenant.primaryColor}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {tenant.imageUrl ? (
                          <img 
                            src={tenant.imageUrl} 
                            alt={tenant.name}
                            className="h-8 w-auto object-contain"
                          />
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tenant.createdAt 
                          ? new Date(tenant.createdAt).toLocaleString('pt-BR')
                          : '-'
                        }
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
