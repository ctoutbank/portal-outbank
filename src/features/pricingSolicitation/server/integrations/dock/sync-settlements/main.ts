"use server";
import { getOrCreateMerchants } from "@/server/integrations/dock/sync-settlements/merchant";
import { truncateSettlementTables } from "@/server/integrations/dock/sync-settlements/truncate-table";
import { insertMerchantSettlementAndRelations } from "./merchantSettlement";
import { insertMerchantSettlementOrdersAndRelations } from "./merchantSettlementOrders";
import { insertPixMerchantSettlementOrdersAndRelations } from "./pixMerchantSettlementOrders";
import { insertSettlementAndRelations } from "./settlements";
import {
  MerchantSettlementsOrders,
  MerchantSettlementsOrdersResponse,
  MerchantSettlementsResponse,
  PixMerchantSettlementOrders,
  PixMerchantSettlementOrdersResponse,
  Settlement,
  SettlementObject,
  SettlementsResponse,
} from "./types";

async function fetchSettlements() {
  let offset = 0;
  const limit = 50;
  let hasMoreData = true;
  const allData: Settlement[] = [];

  while (hasMoreData) {
    const response = await fetch(
      `https://settlement.acquiring.dock.tech/v1/settlements?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `${process.env.DOCK_API_KEY}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    // Parse a resposta JSON e defina os tipos
    const data: SettlementsResponse = await response.json();

    // Combine os objetos retornados ao array final
    allData.push(...data.objects); // 'data.objects' é do tipo Settlement[]

    // Atualize o offset e verifique se ainda há mais dados
    offset += limit;
    hasMoreData = offset < data.meta.total_count;
  }

  return allData;
}

async function fetchMerchantSettlements() {
  let offset = 0;
  const limit = 1000;
  let hasMoreData = true;
  const allData: SettlementObject[] = [];

  while (hasMoreData) {
    const response = await fetch(
      `https://settlement.acquiring.dock.tech/v1/merchant_settlements/order?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `${process.env.DOCK_API_KEY}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    // Parse a resposta JSON e defina os tipos
    const data: MerchantSettlementsResponse = await response.json();

    // Combine os objetos retornados ao array final
    allData.push(...data.objects); // 'data.objects' é do tipo Settlement[]

    // Atualize o offset e verifique se ainda há mais dados
    offset += limit;
    hasMoreData = offset < data.meta.total_count;
  }

  return allData;
}

async function fetchMerchantSettlementsOrders() {
  let offset = 0;
  const limit = 1000;
  let hasMoreData = true;
  const allData: MerchantSettlementsOrders[] = [];

  while (hasMoreData) {
    const response = await fetch(
      `https://settlement.acquiring.dock.tech/v1/merchant_settlement_orders?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `${process.env.DOCK_API_KEY}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    // Parse a resposta JSON e defina os tipos
    const data: MerchantSettlementsOrdersResponse = await response.json();

    // Combine os objetos retornados ao array final
    allData.push(...data.objects); // 'data.objects' é do tipo Settlement[]

    // Atualize o offset e verifique se ainda há mais dados
    offset += limit;
    hasMoreData = offset < data.meta.total_count;
  }

  return allData;
}

async function fetchPixMerchantSettlementsOrders() {
  let offset = 0;
  const limit = 1000;
  let hasMoreData = true;
  const allData: PixMerchantSettlementOrders[] = [];

  while (hasMoreData) {
    const response = await fetch(
      `https://settlement.acquiring.dock.tech/v1/pix_merchant_settlement_orders?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `${process.env.DOCK_API_KEY}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    // Parse a resposta JSON e defina os tipos
    const data: PixMerchantSettlementOrdersResponse = await response.json();

    // Combine os objetos retornados ao array final
    allData.push(...data.objects); // 'data.objects' é do tipo Settlement[]

    // Atualize o offset e verifique se ainda há mais dados
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

export async function syncSettlements() {
  try {
    console.log("Truncando tabelas de settlements...");
    await truncateSettlementTables();
    console.log("Tabelas de settlements truncadas com sucesso.");

    console.log("Buscando dados da API...");

    const response = await fetchSettlements(); // Obtém a resposta inicial
    const settlements: Settlement[] = response || []; // Extraindo Settlements de 'objects'

    // Divida a lista em pedaços de 1000 itens
    const chunkedSettlement = chunkArray(settlements, 1000);
    // Envie cada pedaço para a função de insert
    for (const chunk of chunkedSettlement) {
      await insertSettlementAndRelations(chunk);
    }

    //merchant settlement
    const reponseMerchantSettlement = await fetchMerchantSettlements();
    const merchantSettlements: SettlementObject[] =
      reponseMerchantSettlement || [];
    const chunkedMerchantSettlement = chunkArray(merchantSettlements, 1000);
    const uniqueMerchantsMerchantSettlement = Array.from(
      new Map(
        merchantSettlements.map((item) => [item.merchant.slug, item.merchant])
      ).values()
    );
    console.log(
      "unique merchant settlements",
      uniqueMerchantsMerchantSettlement
    );
    const merchantsSettlements = await getOrCreateMerchants(
      uniqueMerchantsMerchantSettlement
    );
    console.log("criados e obtidos aqui settlement", merchantSettlements);
    for (const chunk of chunkedMerchantSettlement) {
      await insertMerchantSettlementAndRelations(
        chunk,
        merchantsSettlements || []
      );
    }

    //merchant settlements orders
    const responseMerchantSettlementsOrders =
      await fetchMerchantSettlementsOrders();
    const merchantSettlementsOrders: MerchantSettlementsOrders[] =
      responseMerchantSettlementsOrders || [];
    const chunkedOrders = chunkArray(merchantSettlementsOrders, 1000);
    for (const chunk of chunkedOrders) {
      await insertMerchantSettlementOrdersAndRelations(chunk);
    }

    //pix merchant settlements orders
    const responsePixMerchantSettlementsOrders =
      await fetchPixMerchantSettlementsOrders();
    const pixMerchantSettlementOrders: PixMerchantSettlementOrders[] =
      responsePixMerchantSettlementsOrders || [];
    const chunkedPixOrders = chunkArray(pixMerchantSettlementOrders, 1000);
    const uniqueMerchantPixAux = Array.from(
      new Set(pixMerchantSettlementOrders.map((item) => item.merchant))
    );
    console.log("unique pix merchant", uniqueMerchantPixAux);
    const uniqueMerchantPix = uniqueMerchantPixAux.filter(
      (pix) =>
        !uniqueMerchantsMerchantSettlement.some(
          (merchantSettlement) => merchantSettlement.slug == pix.slug
        )
    );
    const merchantsPix = await getOrCreateMerchants(
      uniqueMerchantPix
    );
    console.log("criados e obtidos aqui pix", merchantsPix);
    const merchantsUnion =
      merchantsPix && merchantsSettlements
        ? [...merchantsPix, ...merchantsSettlements]
        : merchantsPix
        ? merchantsPix
        : merchantsSettlements
        ? merchantsSettlements
        : undefined;
    console.log("unido ficou assim", merchantsUnion);
    for (const chunk of chunkedPixOrders) {
      await insertPixMerchantSettlementOrdersAndRelations(
        chunk,
        merchantsUnion || []
      );
    }
  } catch (error) {
    console.error("Erro ao processar Settlements:", error);
  } finally {
  }
}
