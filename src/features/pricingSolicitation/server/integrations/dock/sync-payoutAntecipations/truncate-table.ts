import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function truncateAntecipationTables() {
  try {
    await db.execute(sql`TRUNCATE TABLE payout_antecipations CASCADE`);
  } catch (error) {
    console.error("Error truncating antecipation tables:", error);
    throw error;
  }
}
