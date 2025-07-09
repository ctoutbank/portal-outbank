"use server";

import {
  currentDateTimeUTC,
  parseToUTC,
  toAPIFilterUTC,
} from "@/lib/datetime-utils";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { cronJobMonitoring } from "../../../../../drizzle/schema";
import { getPayoutSyncConfig, insertPayoutAndRelations } from "./payout";
import { Payout, PayoutResponse } from "./types";

async function fetchPayout(offset: number, startDate: string, endDate: string) {
  try {
    const from = toAPIFilterUTC(startDate);
    const to = toAPIFilterUTC(endDate);

    console.log(`Buscando payouts entre ${from} e ${to}, offset: ${offset}`);

    const response = await fetch(
      `https://settlement.acquiring.dock.tech/v1/payouts/statement?transactionDate__goe=${from}&transactionDate__loe=${to}&limit=1000&offset=${offset}`,
      {
        headers: {
          Authorization: `${process.env.DOCK_API_KEY}`,
          "X-Customer": "B68046D590EB402288F90E1147B6BC9F",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.statusText}`);
    }

    const data: PayoutResponse = await response.json();
    return { data, from, to };
  } catch (error) {
    console.error("Erro em fetchPayout:", error);
    throw new Error(
      `Erro em fetchPayout: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function syncPayouts() {
  try {
    console.log("Iniciando sincronização de payouts...");

    const lastSyncedISO = (await getPayoutSyncConfig()) ?? "2024-08-14";

    const lastSynced = parseToUTC(lastSyncedISO).startOf("day");

    const nextDate = lastSynced.plus({ days: 1 });
    const today = DateTime.utc().startOf("day");

    if (nextDate > today) {
      console.log("Intervalo de data ultrapassa hoje, encerrando busca.");
      return;
    }

    let monitoringId: number | undefined;
    let offset = 0;
    while (true) {
      const [monitoring] = await db
        .insert(cronJobMonitoring)
        .values({
          jobName: "Sincronização de Payouts",
          startTime: currentDateTimeUTC(),
          status: "RUNNING",
          logMessage: `Starting sync for payouts ${lastSynced.toISODate()} -> ${nextDate.toISODate()}`,
        })
        .returning({ id: cronJobMonitoring.id });
      monitoringId = monitoring.id;

      const startFilter = toAPIFilterUTC(lastSynced);
      const endFilter = toAPIFilterUTC(nextDate);
      const result = await fetchPayout(offset, startFilter, endFilter);
      if (!result) break;

      const { data } = result;
      const payouts: Payout[] = data.objects || [];

      await insertPayoutAndRelations(
        payouts,
        nextDate.toJSDate(),
        monitoring.id
      );

      offset += payouts.length;
      if (offset >= data.meta.total_count) {
        console.log(
          `Payouts de ${startFilter} a ${endFilter} processados com sucesso.`
        );
        break;
      }
    }
    if (monitoringId) {
      console.log("Updating monitoring record", nextDate.toUTC().toISO());
      await db
        .update(cronJobMonitoring)
        .set({
          endTime: currentDateTimeUTC(),
          status: "SUCCESS",
          logMessage: `Successfully processed payouts`,
          lastSync: nextDate.toUTC().toISO(),
        })
        .where(eq(cronJobMonitoring.id, monitoringId));
    }
    console.log("Sincronização concluída.");
  } catch (error) {
    console.error("Erro ao sincronizar payouts:", error);
  }
}

