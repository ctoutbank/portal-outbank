import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { customerCustomization, customers } from "../../../../../../drizzle/schema";
import { sql } from "drizzle-orm";
import { generateSlug, makeSlugUnique, isHashLikeSlug } from "@/utils/slugify";

interface BackfillResult {
  customerId: number | null;
  customerName: string;
  oldName: string;
  oldSlug: string;
  baseSlug: string;
  finalSlug: string;
  collisionCount: number;
  updated: boolean;
}

interface BackfillSummary {
  success: boolean;
  dryRun: boolean;
  totalRecords: number;
  recordsProcessed: number;
  recordsUpdated: number;
  recordsSkipped: number;
  collisions: number;
  results: BackfillResult[];
  errors: string[];
}

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

    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get("dryRun") === "true";

    console.log(`[fix-slugs-final] Starting backfill (dryRun=${dryRun})...`);

    console.log("[fix-slugs-final] Loading existing slugs...");
    const existingSlugsResult = await db
      .select({ slug: customerCustomization.slug })
      .from(customerCustomization)
      .where(sql`${customerCustomization.slug} IS NOT NULL`);

    const existingSlugs = new Set<string>(
      existingSlugsResult.map((r) => r.slug!.toLowerCase())
    );
    console.log(`[fix-slugs-final] Loaded ${existingSlugs.size} existing slugs`);

    console.log("[fix-slugs-final] Finding records to fix...");
    const recordsToFix = await db
      .select({
        ccId: customerCustomization.id,
        ccCustomerId: customerCustomization.customerId,
        ccName: customerCustomization.name,
        ccSlug: customerCustomization.slug,
        customerName: customers.name,
      })
      .from(customerCustomization)
      .leftJoin(customers, sql`${customers.id} = ${customerCustomization.customerId}`)
      .where(
        sql`${customerCustomization.slug} ~ '^[A-Fa-f0-9]{32}$' 
            OR ${customerCustomization.name} ~ '^[A-Fa-f0-9]{32}$'`
      );

    console.log(`[fix-slugs-final] Found ${recordsToFix.length} records to fix`);

    if (recordsToFix.length === 0) {
      return NextResponse.json({
        success: true,
        dryRun,
        totalRecords: 0,
        recordsProcessed: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        collisions: 0,
        results: [],
        errors: [],
        message: "No records need fixing",
      });
    }

    const results: BackfillResult[] = [];
    const errors: string[] = [];
    let recordsProcessed = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;
    let totalCollisions = 0;

    const processRecords = async (tx: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0]) => {
      for (const record of recordsToFix) {
        try {
          recordsProcessed++;

          if (!record.customerName || record.customerName.trim() === "") {
            console.log(
              `[fix-slugs-final] Skipping record ${record.ccId}: customer name is empty`
            );
            recordsSkipped++;
            errors.push(
              `Record ${record.ccId}: Customer name is empty, skipped`
            );
            continue;
          }

          const baseSlug = generateSlug(record.customerName, {
            fallbackPrefix: "iso",
            fallbackId: record.ccCustomerId ?? undefined,
          });

          const { slug: finalSlug, collisionCount } = makeSlugUnique(
            baseSlug,
            existingSlugs
          );

          existingSlugs.add(finalSlug.toLowerCase());

          if (collisionCount > 0) {
            totalCollisions++;
          }

          const needsUpdate =
            record.ccSlug !== finalSlug || record.ccName !== finalSlug;

          const result: BackfillResult = {
            customerId: record.ccCustomerId,
            customerName: record.customerName,
            oldName: record.ccName || "",
            oldSlug: record.ccSlug || "",
            baseSlug,
            finalSlug,
            collisionCount,
            updated: needsUpdate && !dryRun,
          };

          results.push(result);

          if (!dryRun && needsUpdate) {
            await tx
              .update(customerCustomization)
              .set({
                name: finalSlug,
                slug: finalSlug,
              })
              .where(sql`${customerCustomization.id} = ${record.ccId}`);

            recordsUpdated++;
            console.log(
              `[fix-slugs-final] Updated record ${record.ccId}: "${record.customerName}" -> "${finalSlug}"${
                collisionCount > 0 ? ` (collision: ${collisionCount})` : ""
              }`
            );
          } else if (needsUpdate) {
            console.log(
              `[fix-slugs-final] [DRY RUN] Would update record ${record.ccId}: "${record.customerName}" -> "${finalSlug}"${
                collisionCount > 0 ? ` (collision: ${collisionCount})` : ""
              }`
            );
          } else {
            recordsSkipped++;
            console.log(
              `[fix-slugs-final] Skipping record ${record.ccId}: already correct`
            );
          }
        } catch (error) {
          const errorMsg = `Error processing record ${record.ccId}: ${
            error instanceof Error ? error.message : String(error)
          }`;
          console.error(`[fix-slugs-final] ${errorMsg}`);
          errors.push(errorMsg);
          recordsSkipped++;
        }
      }
    };

    await processRecords(db);

    const summary: BackfillSummary = {
      success: errors.length === 0,
      dryRun,
      totalRecords: recordsToFix.length,
      recordsProcessed,
      recordsUpdated,
      recordsSkipped,
      collisions: totalCollisions,
      results,
      errors,
    };

    console.log(
      `[fix-slugs-final] Backfill complete: ${recordsUpdated} updated, ${recordsSkipped} skipped, ${totalCollisions} collisions`
    );

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error("[fix-slugs-final] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Backfill failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
