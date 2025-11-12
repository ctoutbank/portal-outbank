import { db } from "@/db/drizzle";
import { customers } from "../../../../../drizzle/schema";
import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
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
    
    return NextResponse.json({
      success: true,
      total: Number(total),
      isos: isos
    });
    
  } catch (error) {
    console.error('Erro ao contar ISOs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar informações dos ISOs',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
