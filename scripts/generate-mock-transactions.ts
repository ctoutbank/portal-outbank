/**
 * Script para gerar transações e settlements mockados para os ISOs
 * TPV Total: R$ 7 bilhões/mês (R$ 21 bilhões em 3 meses)
 * Período: Novembro 2025, Dezembro 2025, Janeiro 2026
 */

import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://outbank_owner:UPjyn54wJgXO@ep-blue-rain-a5ord0tf-pooler.us-east-2.aws.neon.tech/outbank?sslmode=require';
const sql = neon(DATABASE_URL);

// Configuração dos ISOs com distribuição de TPV
const ISO_CONFIG = [
  { id: 129371, name: 'Coca Cola', slug: 'cocacola', slugDb: '03B01374D227551DA3DEB1DCD8E4CF66', tpvPercent: 22.7 },
  { id: 129377, name: 'Nestlé', slug: 'nestle', slugDb: 'ABDC07F56BCB99F9CAF3B19C7BF80072', tpvPercent: 18.3 },
  { id: 129379, name: 'Renner', slug: 'renner', slugDb: 'C237602EF42DE91ECC18252F99AF3B0E', tpvPercent: 13.6 },
  { id: 129376, name: 'Pernambucanas', slug: 'pernambucanas', slugDb: 'DF0687FB5629A25749F4721AB64164A3', tpvPercent: 11.2 },
  { id: 129375, name: 'Starbucks', slug: 'starbucks', slugDb: 'AB020A6B6E9B19ED656F04DA0020FD26', tpvPercent: 9.8 },
  { id: 129373, name: 'Leroy Merlin', slug: 'leroy', slugDb: 'A49FDD0A5C49627877AFC8627D849267', tpvPercent: 8.4 },
  { id: 129378, name: 'Cacau Show', slug: 'cacaushow', slugDb: '0758F1F2BB523A5778B74C9AC52283E0', tpvPercent: 6.7 },
  { id: 129372, name: 'Santa Clara', slug: 'santaclara', slugDb: '27CA99DF8121E9B501BF0A57FE898213', tpvPercent: 5.1 },
  { id: 129387, name: 'Dock', slug: 'dock', slugDb: 'C53619693EE1546FC155E44A0C83E242', tpvPercent: 4.2 },
];

// TPV mensal total: R$ 7 bilhões
const MONTHLY_TPV = 7_000_000_000;

// Ticket médio por ISO (para calcular número de transações)
const TICKET_MEDIO: Record<string, number> = {
  'Coca Cola': 487.32,
  'Nestlé': 523.18,
  'Renner': 312.47,
  'Pernambucanas': 189.63,
  'Starbucks': 47.82,
  'Leroy Merlin': 1247.89,
  'Cacau Show': 78.43,
  'Santa Clara': 892.17,
  'Dock': 2341.56,
};

// Distribuições de dados
const PRODUCT_TYPES = [
  { type: 'CREDIT', percent: 58.3 },
  { type: 'DEBIT', percent: 36.7 },
  { type: 'PIX', percent: 5.0 },
];

const BRANDS = [
  { name: 'VISA', percent: 33.8 },
  { name: 'MASTERCARD', percent: 28.4 },
  { name: 'ELO', percent: 21.6 },
  { name: 'HIPERCARD', percent: 11.3 },
  { name: 'AMEX', percent: 4.9 },
];

const STATUS_DISTRIBUTION = [
  { status: 'AUTHORIZED', percent: 94.7 },
  { status: 'DENIED', percent: 5.3 },
];

const SALES_CHANNELS = [
  { channel: 'POS', percent: 67.2 },
  { channel: 'ECOMMERCE', percent: 24.8 },
  { channel: 'MPOS', percent: 8.0 },
];

// Meses para gerar dados
const MONTHS = [
  { year: 2025, month: 11, name: 'Novembro 2025' },
  { year: 2025, month: 12, name: 'Dezembro 2025' },
  { year: 2026, month: 1, name: 'Janeiro 2026' },
];

function pickFromDistribution<T extends { percent: number }>(items: T[]): T {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const item of items) {
    cumulative += item.percent;
    if (rand <= cumulative) return item;
  }
  return items[items.length - 1];
}

function randomAmount(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function randomDate(year: number, month: number): Date {
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = Math.floor(Math.random() * daysInMonth) + 1;
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  return new Date(year, month - 1, day, hour, minute, second);
}

function formatDateForDB(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

async function getMerchantsForISO(isoId: number): Promise<Array<{ slug: string; name: string }>> {
  const result = await sql`
    SELECT slug, name FROM merchants WHERE id_customer = ${isoId} LIMIT 5000;
  `;
  return result as Array<{ slug: string; name: string }>;
}

async function generateTransactionsForISO(
  iso: typeof ISO_CONFIG[0],
  merchants: Array<{ slug: string; name: string }>,
  monthConfig: typeof MONTHS[0]
): Promise<number> {
  const isoMonthlyTPV = MONTHLY_TPV * (iso.tpvPercent / 100);
  const ticketMedio = TICKET_MEDIO[iso.name] || 500;
  const targetTransactions = Math.floor(isoMonthlyTPV / ticketMedio);
  
  // Limitar para evitar milhões de registros (escalar para ~50k por ISO por mês)
  const maxTransactionsPerMonth = 15000;
  const transactionCount = Math.min(targetTransactions, maxTransactionsPerMonth);
  
  // Ajustar valores para manter TPV proporcional
  const adjustedTicketMedio = isoMonthlyTPV / transactionCount;
  const ticketVariation = adjustedTicketMedio * 0.8; // ±80% de variação
  
  let totalTPV = 0;
  const batchSize = 1000;
  
  for (let batch = 0; batch < transactionCount; batch += batchSize) {
    const currentBatchSize = Math.min(batchSize, transactionCount - batch);
    const transactions: string[] = [];
    
    for (let i = 0; i < currentBatchSize; i++) {
      const merchant = merchants[Math.floor(Math.random() * merchants.length)];
      const productType = pickFromDistribution(PRODUCT_TYPES);
      const brand = productType.type === 'PIX' ? 'PIX' : pickFromDistribution(BRANDS).name;
      const status = pickFromDistribution(STATUS_DISTRIBUTION);
      const salesChannel = pickFromDistribution(SALES_CHANNELS);
      
      // Gerar valor com variação realista
      const baseAmount = adjustedTicketMedio + (Math.random() - 0.5) * 2 * ticketVariation;
      const amount = Math.max(12.50, Math.round(baseAmount * 100) / 100);
      
      const date = randomDate(monthConfig.year, monthConfig.month);
      const uuid = uuidv4();
      
      totalTPV += amount;
      
      transactions.push(`(
        '${uuid}',
        true,
        '${formatDateForDB(date)}',
        '${formatDateForDB(date)}',
        '${merchant.slug}',
        '${merchant.name.replace(/'/g, "''")}',
        '${iso.slugDb}',
        '${iso.name.replace(/'/g, "''")}',
        '${salesChannel.channel}',
        'BRL',
        ${amount},
        '${status.status}',
        '${productType.type}',
        '${brand}',
        false,
        'MERCHANT'
      )`);
    }
    
    if (transactions.length > 0) {
      await sql.query(`
        INSERT INTO transactions (
          slug, active, dt_insert, dt_update,
          slug_merchant, merchant_name,
          slug_customer, customer_name,
          sales_channel, currency, total_amount,
          transaction_status, product_type, brand,
          cancelling, split_type
        ) VALUES ${transactions.join(',\n')}
      `);
    }
    
    process.stdout.write(`   ${iso.name} - ${monthConfig.name}: ${Math.min(batch + batchSize, transactionCount)}/${transactionCount} transações\r`);
  }
  
  console.log(`   ✓ ${iso.name} - ${monthConfig.name}: ${transactionCount} transações (TPV: R$ ${(totalTPV / 1_000_000).toFixed(2)} mi)`);
  
  return totalTPV;
}

async function generateSettlements(iso: typeof ISO_CONFIG[0], monthlyTPV: number, monthConfig: typeof MONTHS[0]) {
  // Gerar settlements diários
  const daysInMonth = new Date(monthConfig.year, monthConfig.month, 0).getDate();
  const dailyTPV = monthlyTPV / daysInMonth;
  
  const settlements: string[] = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(monthConfig.year, monthConfig.month - 1, day);
    const dayOfWeek = date.getDay();
    
    // Variação por dia da semana (mais no fim de semana para varejo)
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 0.9;
    const dailyAmount = dailyTPV * weekendMultiplier * (0.8 + Math.random() * 0.4);
    
    const batchAmount = Math.round(dailyAmount * 100) / 100;
    const discountFee = Math.round(batchAmount * 0.0287 * 100) / 100; // ~2.87% MDR
    const netAmount = Math.round((batchAmount - discountFee) * 100) / 100;
    
    const status = day <= daysInMonth - 2 ? 'COMPLETED' : 'PENDING';
    const uuid = uuidv4();
    
    settlements.push(`(
      '${uuid}',
      '${iso.slugDb}',
      ${iso.id},
      '${date.toISOString().split('T')[0]}',
      ${batchAmount},
      ${netAmount},
      ${discountFee},
      '${status}',
      NOW(),
      NOW()
    )`);
  }
  
  if (settlements.length > 0) {
    await sql.query(`
      INSERT INTO settlements (
        slug, slug_customer, id_customer, payment_date,
        batch_amount, net_settlement_amount, discount_fee_amount,
        status, dtinsert, dtupdate
      ) VALUES ${settlements.join(',\n')}
    `);
  }
}

async function main() {
  console.log('💰 Iniciando geração de transações e settlements mockados...\n');
  console.log(`📊 Configuração:`);
  console.log(`   - TPV Mensal Total: R$ ${(MONTHLY_TPV / 1_000_000_000).toFixed(1)} bilhões`);
  console.log(`   - Período: ${MONTHS.map(m => m.name).join(', ')}`);
  console.log(`   - ISOs: ${ISO_CONFIG.length}\n`);
  
  // Limpar transações e settlements existentes dos ISOs de teste
  console.log('🧹 Limpando dados existentes dos ISOs de teste...');
  
  const isoSlugs = ISO_CONFIG.map(i => i.slugDb);
  await sql.query(`DELETE FROM transactions WHERE slug_customer = ANY($1::text[])`, [isoSlugs]);
  await sql.query(`DELETE FROM settlements WHERE slug_customer = ANY($1::text[])`, [isoSlugs]);
  console.log('   ✓ Dados antigos removidos\n');
  
  let grandTotalTPV = 0;
  
  for (const iso of ISO_CONFIG) {
    console.log(`\n🏢 Processando ${iso.name} (${iso.tpvPercent}% do TPV)...`);
    
    // Buscar merchants do ISO
    const merchants = await getMerchantsForISO(iso.id);
    
    if (merchants.length === 0) {
      console.log(`   ⚠️ Nenhum merchant encontrado para ${iso.name}. Execute generate-mock-merchants.ts primeiro.`);
      continue;
    }
    
    console.log(`   📦 ${merchants.length} merchants disponíveis`);
    
    let isoTotalTPV = 0;
    
    for (const month of MONTHS) {
      const monthTPV = await generateTransactionsForISO(iso, merchants, month);
      isoTotalTPV += monthTPV;
      
      // Gerar settlements para o mês
      await generateSettlements(iso, monthTPV, month);
    }
    
    grandTotalTPV += isoTotalTPV;
    console.log(`   📈 TPV Total ${iso.name}: R$ ${(isoTotalTPV / 1_000_000_000).toFixed(3)} bi`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Geração concluída!`);
  console.log(`   TPV Total Gerado: R$ ${(grandTotalTPV / 1_000_000_000).toFixed(2)} bilhões`);
  
  // Estatísticas finais
  const stats = await sql`
    SELECT 
      slug_customer,
      COUNT(*) as tx_count,
      SUM(total_amount) as tpv
    FROM transactions
    WHERE slug_customer = ANY(${isoSlugs}::text[])
    GROUP BY slug_customer
    ORDER BY tpv DESC;
  `;
  
  console.log('\n📊 Estatísticas por ISO:');
  for (const row of stats) {
    const isoName = ISO_CONFIG.find(i => i.slugDb === row.slug_customer)?.name || row.slug_customer;
    console.log(`   ${isoName}: ${Number(row.tx_count).toLocaleString('pt-BR')} tx | R$ ${(Number(row.tpv) / 1_000_000).toFixed(2)} mi`);
  }
}

main()
  .then(() => {
    console.log('\n🎉 Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });
