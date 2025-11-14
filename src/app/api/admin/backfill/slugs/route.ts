import { customerCustomization, customers, db } from "@/lib/db";
import { eq, or, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const token = request.headers.get("X-Backfill-Token");
  const expectedToken = process.env.BACKFILL_TOKEN;

  if (!expectedToken) {
    return NextResponse.json(
      { error: "BACKFILL_TOKEN not configured in environment" },
      { status: 500 }
    );
  }

  if (!token || token !== expectedToken) {
    return NextResponse.json(
      { error: "Unauthorized - Invalid or missing X-Backfill-Token header" },
      { status: 401 }
    );
  }

  try {
    console.log("[BACKFILL] Starting slug backfill process...");

    const mismatchesBefore = await db
      .select({
        customerId: customers.id,
        customerName: customers.name,
        customerSlug: customers.slug,
        customizationId: customerCustomization.id,
        customizationName: customerCustomization.name,
        customizationSlug: customerCustomization.slug,
      })
      .from(customers)
      .leftJoin(
        customerCustomization,
        eq(customerCustomization.customerId, customers.id)
      )
      .where(
        sql`${customers.slug} IS NOT NULL 
            AND (${customerCustomization.slug} IS NULL 
                 OR ${customerCustomization.slug} = '' 
                 OR ${customerCustomization.slug} <> ${customers.slug})`
      );

    console.log(`[BACKFILL] Found ${mismatchesBefore.length} mismatches`);

    if (mismatchesBefore.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No backfill needed - all slugs are already correct",
        updatedCount: 0,
        mismatchesBefore: [],
        mismatchesAfter: [],
      });
    }

    const updateResult = await db.execute(sql`
      UPDATE customer_customization cc
      SET slug = c.slug, name = c.slug
      FROM customers c
      WHERE cc.customer_id = c.id
        AND c.slug IS NOT NULL
        AND (cc.slug IS NULL OR cc.slug = '' OR cc.slug <> c.slug)
    `);

    console.log(`[BACKFILL] Update completed`);

    const mismatchesAfter = await db
      .select({
        customerId: customers.id,
        customerSlug: customers.slug,
        customizationId: customerCustomization.id,
        customizationSlug: customerCustomization.slug,
      })
      .from(customers)
      .leftJoin(
        customerCustomization,
        eq(customerCustomization.customerId, customers.id)
      )
      .where(
        sql`${customers.slug} IS NOT NULL 
            AND (${customerCustomization.slug} IS NULL 
                 OR ${customerCustomization.slug} = '' 
                 OR ${customerCustomization.slug} <> ${customers.slug})`
      );

    console.log(`[BACKFILL] Remaining mismatches: ${mismatchesAfter.length}`);

    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN c.slug IS NOT NULL THEN 1 END) as customers_with_slug,
        COUNT(cc.id) as total_customizations,
        COUNT(CASE WHEN cc.slug IS NOT NULL AND cc.slug <> '' THEN 1 END) as customizations_with_slug
      FROM customers c
      LEFT JOIN customer_customization cc ON cc.customer_id = c.id
    `);

    const result = {
      success: true,
      message: `Backfill completed successfully`,
      updatedCount: mismatchesBefore.length - mismatchesAfter.length,
      mismatchesBefore: mismatchesBefore.slice(0, 10), // Show first 10 examples
      mismatchesAfter: mismatchesAfter.slice(0, 10), // Show first 10 remaining
      statistics: stats.rows[0],
      timestamp: new Date().toISOString(),
    };

    console.log("[BACKFILL] Result:", JSON.stringify(result, null, 2));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[BACKFILL] Error during backfill:", error);
    return NextResponse.json(
      {
        error: "Backfill failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
