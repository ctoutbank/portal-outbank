/**
 * Script para gerar merchants mockados para os ISOs
 * Total: 11.704 merchants distribuídos proporcionalmente
 */

import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://outbank_owner:UPjyn54wJgXO@ep-blue-rain-a5ord0tf-pooler.us-east-2.aws.neon.tech/outbank?sslmode=require';
const sql = neon(DATABASE_URL);

// Configuração dos ISOs com distribuição de merchants
const ISO_CONFIG = [
  { id: 129371, name: 'Coca Cola', slug: 'cocacola', slugDb: '03B01374D227551DA3DEB1DCD8E4CF66', merchantPercent: 19.3 },
  { id: 129377, name: 'Nestlé', slug: 'nestle', slugDb: 'ABDC07F56BCB99F9CAF3B19C7BF80072', merchantPercent: 14.8 },
  { id: 129379, name: 'Renner', slug: 'renner', slugDb: 'C237602EF42DE91ECC18252F99AF3B0E', merchantPercent: 11.2 },
  { id: 129376, name: 'Pernambucanas', slug: 'pernambucanas', slugDb: 'DF0687FB5629A25749F4721AB64164A3', merchantPercent: 15.7 },
  { id: 129375, name: 'Starbucks', slug: 'starbucks', slugDb: 'AB020A6B6E9B19ED656F04DA0020FD26', merchantPercent: 17.4 },
  { id: 129373, name: 'Leroy Merlin', slug: 'leroy', slugDb: 'A49FDD0A5C49627877AFC8627D849267', merchantPercent: 5.6 },
  { id: 129378, name: 'Cacau Show', slug: 'cacaushow', slugDb: '0758F1F2BB523A5778B74C9AC52283E0', merchantPercent: 8.9 },
  { id: 129372, name: 'Santa Clara', slug: 'santaclara', slugDb: '27CA99DF8121E9B501BF0A57FE898213', merchantPercent: 4.3 },
  { id: 129387, name: 'Dock', slug: 'dock', slugDb: 'C53619693EE1546FC155E44A0C83E242', merchantPercent: 2.8 },
];

const TOTAL_MERCHANTS = 11704;

// Nomes de estabelecimentos realistas por segmento
const MERCHANT_PREFIXES: Record<string, string[]> = {
  'Coca Cola': ['Distribuidora', 'Atacado', 'Varejo', 'Supermercado', 'Mercearia', 'Conveniência', 'Restaurante', 'Lanchonete', 'Bar', 'Padaria'],
  'Nestlé': ['Distribuidora', 'Atacado', 'Varejo', 'Supermercado', 'Mercearia', 'Empório', 'Doceria', 'Confeitaria', 'Café', 'Restaurante'],
  'Renner': ['Loja', 'Outlet', 'Shopping', 'Centro', 'Mega Store', 'Express', 'Pop Up', 'Quiosque'],
  'Pernambucanas': ['Loja', 'Centro', 'Shopping', 'Mega', 'Express', 'Outlet', 'Pop Up'],
  'Starbucks': ['Café', 'Coffee Shop', 'Express', 'Drive Thru', 'Quiosque', 'Reserve', 'Lounge'],
  'Leroy Merlin': ['Loja', 'Centro', 'Mega Store', 'Express', 'Outlet', 'Depósito'],
  'Cacau Show': ['Loja', 'Quiosque', 'Shopping', 'Express', 'Outlet', 'Pop Up', 'Fábrica'],
  'Santa Clara': ['Distribuidora', 'Atacado', 'Centro', 'Filial', 'Depósito', 'Express'],
  'Dock': ['Terminal', 'Centro', 'Filial', 'Hub', 'Express', 'Matriz'],
};

const CITIES = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador',
  'Fortaleza', 'Curitiba', 'Recife', 'Porto Alegre', 'Manaus',
  'Goiânia', 'Belém', 'Guarulhos', 'Campinas', 'São Luís',
  'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal', 'Campo Grande',
  'Teresina', 'São Bernardo do Campo', 'Nova Iguaçu', 'João Pessoa', 'Santo André',
  'Osasco', 'São José dos Campos', 'Ribeirão Preto', 'Uberlândia', 'Contagem',
  'Sorocaba', 'Aracaju', 'Feira de Santana', 'Cuiabá', 'Joinville',
  'Juiz de Fora', 'Londrina', 'Niterói', 'Ananindeua', 'Belford Roxo'
];

const STATES = ['SP', 'RJ', 'MG', 'DF', 'BA', 'CE', 'PR', 'PE', 'RS', 'AM', 'GO', 'PA', 'MA', 'SC', 'PB', 'ES', 'RN', 'AL', 'MT', 'MS'];

function generateCNPJ(): string {
  const randomDigits = () => Math.floor(Math.random() * 10);
  const base = Array.from({ length: 12 }, randomDigits);
  
  // Cálculo do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = base.reduce((acc, digit, i) => acc + digit * weights1[i], 0);
  let d1 = 11 - (sum1 % 11);
  d1 = d1 >= 10 ? 0 : d1;
  
  // Cálculo do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = [...base, d1].reduce((acc, digit, i) => acc + digit * weights2[i], 0);
  let d2 = 11 - (sum2 % 11);
  d2 = d2 >= 10 ? 0 : d2;
  
  return [...base, d1, d2].join('');
}

function generateMerchantName(isoName: string, index: number): string {
  const prefixes = MERCHANT_PREFIXES[isoName] || ['Loja'];
  const prefix = prefixes[index % prefixes.length];
  const city = CITIES[index % CITIES.length];
  const number = Math.floor(index / CITIES.length) + 1;
  
  return `${prefix} ${isoName} ${city} ${number.toString().padStart(3, '0')}`;
}

async function generateMerchants() {
  console.log('🏪 Iniciando geração de merchants mockados...\n');
  
  // Verificar merchants existentes para os ISOs de teste
  const existingCount = await sql`
    SELECT COUNT(*) as count FROM merchants 
    WHERE id_customer IN (129371, 129372, 129373, 129375, 129376, 129377, 129378, 129379, 129387);
  `;
  
  if (Number(existingCount[0].count) > 0) {
    console.log(`⚠️  Já existem ${existingCount[0].count} merchants para os ISOs de teste.`);
    console.log('   Deletando merchants existentes...');
    await sql`DELETE FROM merchants WHERE id_customer IN (129371, 129372, 129373, 129375, 129376, 129377, 129378, 129379, 129387);`;
    console.log('   ✓ Merchants deletados.\n');
  }
  
  let totalInserted = 0;
  
  for (const iso of ISO_CONFIG) {
    const merchantCount = Math.round(TOTAL_MERCHANTS * (iso.merchantPercent / 100));
    console.log(`📦 Gerando ${merchantCount} merchants para ${iso.name} (${iso.merchantPercent}%)...`);
    
    const merchants: any[] = [];
    
    for (let i = 0; i < merchantCount; i++) {
      const slug = uuidv4().replace(/-/g, '').substring(0, 32).toUpperCase();
      const name = generateMerchantName(iso.name, i);
      const cnpj = generateCNPJ();
      const city = CITIES[i % CITIES.length];
      const state = STATES[i % STATES.length];
      
      merchants.push({
        slug,
        name,
        id_document: cnpj,
        slug_customer: iso.slugDb,
        id_customer: iso.id,
        active: true,
        corporate_name: `${name} LTDA`,
        email: `contato${i}@${iso.slug}.mock.com`,
        area_code: String(11 + (i % 89)).padStart(2, '0'),
        number: String(90000000 + Math.floor(Math.random() * 9999999)).substring(0, 10),
        language: 'pt-BR',
        timezone: 'UTC-3',
        legal_person: i % 5 === 0 ? 'PESSOA_FISICA' : 'PESSOA_JURIDICA',
      });
    }
    
    // Inserir em lotes de 500
    const batchSize = 500;
    for (let i = 0; i < merchants.length; i += batchSize) {
      const batch = merchants.slice(i, i + batchSize);
      
      const values = batch.map(m => `(
        '${m.slug}', 
        '${m.name.replace(/'/g, "''")}', 
        '${m.id_document}', 
        '${m.slug_customer}', 
        ${m.id_customer}, 
        ${m.active},
        '${m.corporate_name.replace(/'/g, "''")}',
        '${m.email}',
        '${m.area_code}',
        '${m.number}',
        '${m.language}',
        '${m.timezone}',
        '${m.legal_person}',
        NOW(),
        NOW()
      )`).join(',\n');
      
      await sql.query(`
        INSERT INTO merchants (
          slug, name, id_document, slug_customer, id_customer, active,
          corporate_name, email, area_code, number, language, timezone, legal_person,
          dtinsert, dtupdate
        ) VALUES ${values}
      `);
      
      totalInserted += batch.length;
      process.stdout.write(`   Inseridos: ${totalInserted}/${TOTAL_MERCHANTS}\r`);
    }
    
    console.log(`   ✓ ${merchantCount} merchants inseridos para ${iso.name}`);
  }
  
  console.log(`\n✅ Total de merchants gerados: ${totalInserted}`);
  
  // Verificar contagem final
  const finalCount = await sql`
    SELECT c.name, COUNT(m.id) as count
    FROM merchants m
    JOIN customers c ON m.id_customer = c.id
    WHERE m.id_customer IN (129371, 129372, 129373, 129375, 129376, 129377, 129378, 129379, 129387)
    GROUP BY c.name
    ORDER BY count DESC;
  `;
  
  console.log('\n📊 Distribuição final:');
  finalCount.forEach(row => {
    console.log(`   ${row.name}: ${row.count} merchants`);
  });
}

generateMerchants()
  .then(() => {
    console.log('\n🎉 Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });
