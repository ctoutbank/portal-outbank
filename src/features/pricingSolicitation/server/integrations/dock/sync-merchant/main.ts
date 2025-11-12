"use server";

import { insertMerchantAndRelations } from "./merchan";

import { Merchant } from "./types";

async function fetchMerchants() {
  const response = await fetch(
    `${process.env.DOCK_API_URL_MERCHANTS}/v1/merchants?limit=40`,
    {
      headers: {
        Authorization: `Bearer ${process.env.DOCK_API_KEY}`,
      },
    }
  );
  const data = await response.json();
  console.log("api data", data);
  return data;
}

export async function syncMerchant() {
  if (process.env.DOCK_SYNC_ENABLED !== "true") {
    console.log("Dock sync is disabled. Set DOCK_SYNC_ENABLED=true to enable.");
    return;
  }

  try {
    console.log("Buscando merchants...");

    const response = await fetchMerchants(); // Obtém a resposta inicial
    const merchants: Merchant[] = response.objects || []; // Extraindo merchants de 'objects'

    console.log(`Total de merchants encontrados: ${merchants.length}`);

    // Comentando o TRUNCATE para permitir atualizações em vez de recriar tudo
    // db.execute(
    //   "TRUNCATE TABLE contacts, merchantpixaccount, merchants, addresses, categories, legal_natures, sales_agents, configurations CASCADE;"
    // );

    for (const merchant of merchants) {
      await insertMerchantAndRelations(merchant);
    }
  } catch (error) {
    console.error("Erro ao processar merchants:", error);
  } finally {
  }
}
