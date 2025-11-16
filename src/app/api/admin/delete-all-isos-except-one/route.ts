import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { 
  customers,
  paymentInstitution,
  settlements,
  merchantPixSettlementOrders,
  merchants,
  customerFunctions,
  users,
  merchantSettlements,
  payout,
  payoutAntecipations,
  solicitationFee,
  customerCustomization,
  userMerchants
} from "../../../../../drizzle/schema";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { keepSlug } = await request.json();
    
    if (!keepSlug || typeof keepSlug !== 'string') {
      return NextResponse.json(
        { error: 'keepSlug é obrigatório e deve ser uma string' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 Verificando ISOs antes da deleção...`);
    
    const allCustomers = await db.select().from(customers);
    console.log(`📊 Total de ISOs encontrados: ${allCustomers.length}`);
    
    const keepCustomer = allCustomers.find(c => c.slug === keepSlug);
    if (!keepCustomer) {
      return NextResponse.json(
        { error: `ISO com slug "${keepSlug}" não encontrado` },
        { status: 404 }
      );
    }
    
    const keepId = keepCustomer.id;
    
    console.log(`✅ ISO a manter: ${keepCustomer.name} (ID: ${keepCustomer.id}, slug: ${keepCustomer.slug})`);
    console.log(`\n🗑️  Deletando todos os ISOs exceto ${keepCustomer.name}...`);
    
    console.log(`\n🗑️  Deletando registros dependentes...`);
    
    const deletedCustomizations = await db
      .delete(customerCustomization)
      .where(sql`${customerCustomization.customerId} != ${keepId}`)
      .returning({ id: customerCustomization.id });
    console.log(`   ✓ ${deletedCustomizations.length} customer_customization deletados`);
    
    const deletedFunctions = await db
      .delete(customerFunctions)
      .where(sql`${customerFunctions.idCustomer} != ${keepId}`)
      .returning({ id: customerFunctions.id });
    console.log(`   ✓ ${deletedFunctions.length} customer_functions deletados`);
    
    const deletedUserMerchants = await db
      .delete(userMerchants)
      .where(sql`${userMerchants.idUser} IN (SELECT id FROM users WHERE id_customer != ${keepId})`)
      .returning({ id: userMerchants.id });
    console.log(`   ✓ ${deletedUserMerchants.length} user_merchants deletados`);
    
    const deletedUsers = await db
      .delete(users)
      .where(sql`${users.idCustomer} != ${keepId}`)
      .returning({ id: users.id });
    console.log(`   ✓ ${deletedUsers.length} users deletados`);
    
    const deletedSolicitations = await db
      .delete(solicitationFee)
      .where(sql`${solicitationFee.idCustomers} != ${keepId}`)
      .returning({ id: solicitationFee.id });
    console.log(`   ✓ ${deletedSolicitations.length} solicitation_fee deletados`);
    
    const deletedAntecipations = await db
      .delete(payoutAntecipations)
      .where(sql`${payoutAntecipations.idCustomer} != ${keepId}`)
      .returning({ id: payoutAntecipations.id });
    console.log(`   ✓ ${deletedAntecipations.length} payout_antecipations deletados`);
    
    const deletedPayouts = await db
      .delete(payout)
      .where(sql`${payout.idCustomer} != ${keepId}`)
      .returning({ id: payout.id });
    console.log(`   ✓ ${deletedPayouts.length} payout deletados`);
    
    const deletedMerchantSettlements = await db
      .delete(merchantSettlements)
      .where(sql`${merchantSettlements.idCustomer} != ${keepId}`)
      .returning({ id: merchantSettlements.id });
    console.log(`   ✓ ${deletedMerchantSettlements.length} merchant_settlements deletados`);
    
    const deletedMerchants = await db
      .delete(merchants)
      .where(sql`${merchants.idCustomer} != ${keepId}`)
      .returning({ id: merchants.id });
    console.log(`   ✓ ${deletedMerchants.length} merchants deletados`);
    
    const deletedPixOrders = await db
      .delete(merchantPixSettlementOrders)
      .where(sql`${merchantPixSettlementOrders.idCustomer} != ${keepId}`)
      .returning({ id: merchantPixSettlementOrders.id });
    console.log(`   ✓ ${deletedPixOrders.length} merchant_pix_settlement_orders deletados`);
    
    const deletedSettlements = await db
      .delete(settlements)
      .where(sql`${settlements.idCustomer} != ${keepId}`)
      .returning({ id: settlements.id });
    console.log(`   ✓ ${deletedSettlements.length} settlements deletados`);
    
    const deletedInstitutions = await db
      .delete(paymentInstitution)
      .where(sql`${paymentInstitution.idCustomerDb} != ${keepId}`)
      .returning({ id: paymentInstitution.id });
    console.log(`   ✓ ${deletedInstitutions.length} payment_institution deletados`);
    
    console.log(`\n🗑️  Deletando ISOs...`);
    const result = await db
      .delete(customers)
      .where(sql`${customers.id} != ${keepId}`)
      .returning({ id: customers.id, name: customers.name });
    
    console.log(`\n✅ ${result.length} ISOs deletados com sucesso!`);
    console.log(`✅ ${keepCustomer.name} (ID: ${keepId}, slug: ${keepSlug}) foi mantido.`);
    
    const remainingCustomers = await db.select().from(customers);
    console.log(`\n🔍 ISOs restantes: ${remainingCustomers.length}`);
    
    return NextResponse.json({
      success: true,
      message: `${result.length} ISOs deletados com sucesso`,
      deletedCount: result.length,
      deletedISOs: result,
      remainingISOs: remainingCustomers,
      keptISO: keepCustomer,
      dependentRecordsDeleted: {
        customerCustomization: deletedCustomizations.length,
        customerFunctions: deletedFunctions.length,
        userMerchants: deletedUserMerchants.length,
        users: deletedUsers.length,
        solicitationFee: deletedSolicitations.length,
        payoutAntecipations: deletedAntecipations.length,
        payout: deletedPayouts.length,
        merchantSettlements: deletedMerchantSettlements.length,
        merchants: deletedMerchants.length,
        merchantPixSettlementOrders: deletedPixOrders.length,
        settlements: deletedSettlements.length,
        paymentInstitution: deletedInstitutions.length
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar ISOs:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar ISOs', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
