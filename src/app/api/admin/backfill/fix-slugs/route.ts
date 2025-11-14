import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { customerCustomization } from "../../../../../../drizzle/schema";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.BACKFILL_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: "BACKFILL_TOKEN not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[fix-slugs] Starting corrective backfill...");

    const recordsToFix = await db
      .select({
        id: customerCustomization.id,
        name: customerCustomization.name,
        slug: customerCustomization.slug,
      })
      .from(customerCustomization)
      .where(
        sql`${customerCustomization.slug} ~ '^[A-F0-9]{32}$' 
            AND ${customerCustomization.name} IS NOT NULL 
            AND TRIM(${customerCustomization.name}) <> ''`
      );

    console.log(`[fix-slugs] Found ${recordsToFix.length} records to fix`);

    if (recordsToFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No records need fixing",
        recordsFixed: 0,
        details: [],
      });
    }

    const results = [];
    for (const record of recordsToFix) {
      const newSlug = record.name.toLowerCase().trim();
      
      await db
        .update(customerCustomization)
        .set({ slug: newSlug })
        .where(sql`${customerCustomization.id} = ${record.id}`);

      results.push({
        id: record.id,
        name: record.name,
        oldSlug: record.slug,
        newSlug: newSlug,
      });

      console.log(`[fix-slugs] Fixed record ${record.id}: "${record.slug}" -> "${newSlug}"`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully fixed ${results.length} records`,
      recordsFixed: results.length,
      details: results,
    });
  } catch (error) {
    console.error("[fix-slugs] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to execute corrective backfill",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
