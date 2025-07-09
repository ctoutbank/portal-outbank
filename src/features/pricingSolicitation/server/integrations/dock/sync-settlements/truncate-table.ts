import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function truncateSettlementTables() {
  try {
    await db.execute(sql`TRUNCATE TABLE settlements CASCADE`);
  } catch (error) {
    console.error("Error truncating settlement tables:", error);
    throw error;
  }
}
