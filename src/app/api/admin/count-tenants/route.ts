import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET() {
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
        created_at as "createdAt"
      FROM customer_customization
      ORDER BY created_at DESC
    `;
    
    return NextResponse.json({
      success: true,
      total: Number(total),
      tenants: tenants.map(tenant => ({
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        customerId: tenant.customerId,
        createdAt: tenant.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Erro ao contar tenants:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar informações dos tenants',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
