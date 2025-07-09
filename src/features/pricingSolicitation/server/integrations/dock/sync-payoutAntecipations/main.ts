"use server";

import { insertAntecipationAndRelations } from "./payoutAntecipation";
import { truncateAntecipationTables } from "./truncate-table";
import { Antecipation, AntecipationsResponse } from "./types";

async function fetchAntecipations() {
  let offset = 0;
  const limit = 1000;
  let hasMoreData = true;
  const allData: Antecipation[] = [];

  while (hasMoreData) {
    const response = await fetch(
      `https://settlement.acquiring.dock.tech/v1/payout_anticipations/statement?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `${process.env.DOCK_API_KEY}`,
          "X-Customer": "B68046D590EB402288F90E1147B6BC9F",
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data: AntecipationsResponse = await response.json();
    allData.push(...data.objects);

    offset += limit;
    hasMoreData = offset < data.meta.total_count;
  }

  return allData;
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export async function syncPayoutAntecipations() {
  try {
    console.log("Truncando tabelas de antecipações...");
    await truncateAntecipationTables();
    console.log("Tabelas de antecipações truncadas com sucesso.");

    console.log("Buscando dados da API de antecipações...");

    const response = await fetchAntecipations();
    const antecipations: Antecipation[] = response || [];

    const chunkedAntecipations = chunkArray(antecipations, 1000);
    for (const chunk of chunkedAntecipations) {
      await insertAntecipationAndRelations(chunk);
    }

    console.log("Sincronização de antecipações concluída com sucesso.");
  } catch (error) {
    console.error("Erro ao processar Antecipações:", error);
    throw error;
  }
}
