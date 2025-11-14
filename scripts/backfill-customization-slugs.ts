import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

async function backfillCustomizationSlugs() {
  console.log("=== BACKFILL: Fixing customer_customization slugs ===\n");

  try {
    console.log("Step 1: Checking for slug mismatches...");
    const mismatches = await sql`
      SELECT 
        c.id as customer_id,
        c.name as customer_name,
        c.slug as customer_slug,
        cc.id as customization_id,
        cc.name as customization_name,
        cc.slug as customization_slug
      FROM customers c
      LEFT JOIN customer_customization cc ON cc.customer_id = c.id
      WHERE c.slug IS NOT NULL 
        AND (cc.slug IS NULL OR cc.slug = '' OR cc.slug <> c.slug)
    `;

    console.log(`Found ${mismatches.length} customizations with missing or mismatched slugs:`);
    if (mismatches.length > 0) {
      console.table(mismatches);
    }
    console.log("");

    if (mismatches.length > 0) {
      console.log("Step 2: Performing backfill...");
      const result = await sql`
        UPDATE customer_customization cc
        SET slug = c.slug
        FROM customers c
        WHERE cc.customer_id = c.id
          AND (cc.slug IS NULL OR cc.slug = '' OR cc.slug <> c.slug)
          AND c.slug IS NOT NULL
      `;

      console.log(`✅ Backfill complete! Updated ${result.length} records.`);
      console.log("");
    } else {
      console.log("✅ No backfill needed - all slugs are already correct!");
      console.log("");
    }

    console.log("Step 3: Verifying the fix...");
    const remainingMismatches = await sql`
      SELECT 
        c.id as customer_id,
        c.slug as customer_slug,
        cc.id as customization_id,
        cc.slug as customization_slug
      FROM customers c
      LEFT JOIN customer_customization cc ON cc.customer_id = c.id
      WHERE c.slug IS NOT NULL 
        AND (cc.slug IS NULL OR cc.slug = '' OR cc.slug <> c.slug)
    `;

    if (remainingMismatches.length === 0) {
      console.log("✅ Verification passed! All slugs are now synchronized.");
    } else {
      console.log(`⚠️  Warning: ${remainingMismatches.length} mismatches still remain:`);
      console.table(remainingMismatches);
    }
    console.log("");

    console.log("Step 4: Summary statistics:");
    const stats = await sql`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN c.slug IS NOT NULL THEN 1 END) as customers_with_slug,
        COUNT(cc.id) as total_customizations,
        COUNT(CASE WHEN cc.slug IS NOT NULL AND cc.slug <> '' THEN 1 END) as customizations_with_slug
      FROM customers c
      LEFT JOIN customer_customization cc ON cc.customer_id = c.id
    `;

    console.log(`Total customers: ${stats[0].total_customers}`);
    console.log(`Customers with slug: ${stats[0].customers_with_slug}`);
    console.log(`Total customizations: ${stats[0].total_customizations}`);
    console.log(`Customizations with slug: ${stats[0].customizations_with_slug}`);
    console.log("");

    console.log("=== Backfill Complete ===");
  } catch (error) {
    console.error("❌ Error during backfill:", error);
    throw error;
  }
}

backfillCustomizationSlugs().catch(console.error);
