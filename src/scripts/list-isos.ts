import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { customers, customerCustomization, users } from '../../drizzle/schema';
import { eq, and, ne } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function listISOs() {
  console.log('📋 Listing all ISOs and their details...\n');
  
  // Get all customers with their customizations
  const allCustomers = await db
    .select({
      customerId: customers.id,
      customerName: customers.name,
      customizationId: customerCustomization.id,
      slug: customerCustomization.slug,
      customizationName: customerCustomization.name,
      imageUrl: customerCustomization.imageUrl,
      loginImageUrl: customerCustomization.loginImageUrl,
      faviconUrl: customerCustomization.faviconUrl,
    })
    .from(customers)
    .leftJoin(customerCustomization, eq(customers.id, customerCustomization.customerId));

  // Get user counts per customer
  const userCounts = await db
    .select({
      customerId: users.idCustomer,
    })
    .from(users);

  const userCountMap = new Map<number, number>();
  userCounts.forEach(u => {
    if (u.customerId) {
      userCountMap.set(u.customerId, (userCountMap.get(u.customerId) || 0) + 1);
    }
  });

  console.log('Total customers:', allCustomers.length);
  console.log('\n' + '='.repeat(80) + '\n');

  allCustomers.forEach((c, index) => {
    const userCount = userCountMap.get(c.customerId) || 0;
    const hasImages = !!(c.imageUrl || c.loginImageUrl || c.faviconUrl);
    
    console.log(`${index + 1}. Customer ID: ${c.customerId}`);
    console.log(`   Name: ${c.customerName}`);
    console.log(`   Slug: ${c.slug || 'N/A'}`);
    console.log(`   Customization ID: ${c.customizationId || 'N/A'}`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Has Images: ${hasImages ? 'Yes' : 'No'}`);
    if (hasImages) {
      console.log(`   - Logo: ${c.imageUrl ? '✓' : '✗'}`);
      console.log(`   - Login BG: ${c.loginImageUrl ? '✓' : '✗'}`);
      console.log(`   - Favicon: ${c.faviconUrl ? '✓' : '✗'}`);
    }
    console.log('');
  });

  // Identify "Banco Prisma (outbank)"
  const bancoPrisma = allCustomers.find(c => 
    c.slug === 'outbank' || c.customerName?.toLowerCase().includes('banco prisma')
  );

  if (bancoPrisma) {
    console.log('🏦 PROTECTED ISO (will NOT be deleted):');
    console.log(`   Customer ID: ${bancoPrisma.customerId}`);
    console.log(`   Name: ${bancoPrisma.customerName}`);
    console.log(`   Slug: ${bancoPrisma.slug}`);
    console.log('');
  } else {
    console.log('⚠️  WARNING: Could not identify "Banco Prisma (outbank)" - no ISO will be protected!');
    console.log('');
  }

  const toDelete = allCustomers.filter(c => c.customerId !== bancoPrisma?.customerId);
  console.log(`📊 Summary:`);
  console.log(`   Total ISOs: ${allCustomers.length}`);
  console.log(`   Protected: 1 (${bancoPrisma?.customerName})`);
  console.log(`   To Delete: ${toDelete.length}`);
  console.log(`   Total Users to Delete: ${Array.from(userCountMap.entries())
    .filter(([id]) => id !== bancoPrisma?.customerId)
    .reduce((sum, [, count]) => sum + count, 0)}`);
}

listISOs().catch(console.error);
