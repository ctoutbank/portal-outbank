import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { customers } from "../../../../../drizzle/schema";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { keepId } = await request.json();
    
    if (!keepId || typeof keepId !== 'number') {
      return NextResponse.json(
        { error: 'keepId é obrigatório e deve ser um número' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 Verificando ISOs antes da deleção...`);
    
    const allCustomers = await db.select().from(customers);
    console.log(`📊 Total de ISOs encontrados: ${allCustomers.length}`);
    
    const keepCustomer = allCustomers.find(c => c.id === keepId);
    if (!keepCustomer) {
      return NextResponse.json(
        { error: `ISO com ID ${keepId} não encontrado` },
        { status: 404 }
      );
    }
    
    console.log(`✅ ISO a manter: ${keepCustomer.name} (ID: ${keepCustomer.id})`);
    console.log(`\n🗑️  Deletando todos os ISOs exceto ${keepCustomer.name} (ID: ${keepId})...`);
    
    const result = await db
      .delete(customers)
      .where(sql`${customers.id} != ${keepId}`)
      .returning({ id: customers.id, name: customers.name });
    
    console.log(`\n✅ ${result.length} ISOs deletados com sucesso!`);
    console.log(`✅ ${keepCustomer.name} (ID: ${keepId}) foi mantido.`);
    
    const remainingCustomers = await db.select().from(customers);
    console.log(`\n🔍 ISOs restantes: ${remainingCustomers.length}`);
    
    return NextResponse.json({
      success: true,
      message: `${result.length} ISOs deletados com sucesso`,
      deletedCount: result.length,
      deletedISOs: result,
      remainingISOs: remainingCustomers,
      keptISO: keepCustomer
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar ISOs:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar ISOs', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
