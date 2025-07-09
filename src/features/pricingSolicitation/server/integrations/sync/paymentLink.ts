// pages/api/syncPaymentLinks.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/server/db";
import { eq, or, gte, desc } from "drizzle-orm";
import { paymentLink, syncLog } from "../../../../drizzle/schema"; // Esquemas das tabelas

//
// Tipos de dados utilizados
//

export type ShoppingItem = {
  name: string;
  quantity: string;
  amount: string;
};

export type InsertPaymentLinkAPI = {
  linkName: string;
  totalAmount: string;
  documentId: string;
  dtExpiration: string;
  productType: string;
  installments: number;
  shoppingItems: ShoppingItem[];
};

export type PaymentLinkAPI = {
  slug: string;
  active: boolean;
  dtInsert: string; // ISO string
  dtUpdate: string; // ISO string
  linkName: string;
  dtExpiration: string;
  totalAmount: string;
  slugMerchant: string;
  paymentLinkStatus: string;
  productType: string;
  installments: number;
  shoppingItems: ShoppingItem[];
  linkUrl: string;
  slugFinancialTransaction: string;
};

export type PaymentLinkRecord = PaymentLinkAPI & {
  idMerchant: number | null; 
  pixEnabled: boolean;
  isFromServer: boolean;
  modified: boolean;
  isDeleted: boolean;
};

export type Metadata = {
  limit: number;
  offset: number;
  total_count: number;
};

export type PaymentLinkResponse = {
  meta: Metadata;
  objects: PaymentLinkAPI[];
};

export type SyncLog = {
  syncType: string;
  dateTime: string;
  totalRecordsCreated: number;
  totalRecordsUpdated: number;
  totalRecordsRetrieved: number;
};

//
// Funções para integração com a API externa
//

async function InsertAPIPaymentLink(
  data: InsertPaymentLinkAPI
): Promise<PaymentLinkAPI> {
  const response = await fetch(
    `https://serviceorder.acquiring.dock.tech/v1/external_paymentLinks`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        // Substitua o token abaixo pelo token real
        Authorization:
          "eyJraWQiOiJZb3VyX1RPS0VOIiwiVHlwZSI6IkpXVCJ9.seuTokenAqui",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to save data: ${response.statusText}`);
  }
  const responseData: PaymentLinkAPI = await response.json();
  return responseData;
}

async function deleteAPIPaymentLink(slug: string): Promise<void> {
  const response = await fetch(
    `https://serviceorder.acquiring.dock.tech/v1/external_paymentLinks/${slug}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization:
          "eyJraWQiOiJZb3VyX1RPS0VOIiwiVHlwZSI6IkpXVCJ9.seuTokenAqui",
      },
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to delete Payment Link ${slug}: ${response.statusText}`
    );
  }
}

async function fetchPaymentLinks(since?: string): Promise<PaymentLinkAPI[]> {
  let offset = 0;
  const limit = 1000;
  let hasMoreData = true;
  const allData: PaymentLinkAPI[] = [];

  while (hasMoreData) {
    let url = `https://serviceorder.acquiring.dock.tech/v1/external_paymentLinks?limit=${limit}&offset=${offset}`;
    if (since) {
      url += `&dtInsert=${encodeURIComponent(since)}`;
    }
    const response = await fetch(url, {
      headers: {
        Authorization:
          "eyJraWQiOiJZb3VyX1RPS0VOIiwiVHlwZSI6IkpXVCJ9.seuTokenAqui",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const data: PaymentLinkResponse = await response.json();
    allData.push(...data.objects);
    offset += limit;
    hasMoreData = offset < data.meta.total_count;
  }
  return allData;
}


// Obtém a última data/hora de sync para o tipo "paymentLink"
async function GetLastSyncByType(syncType: string): Promise<string> {
  const [lastSync] = await db
    .select()
    .from(syncLog)
    .where(eq(syncLog.syncType, syncType))
    .orderBy(desc(syncLog.dateTime))
    .limit(1);
  return lastSync?.dateTime || "1970-01-01T00:00:00.000Z";
}

// Retorna os registros de paymentLink que precisam ser sincronizados
async function GetPaymentLinkToSync(
  lastSync: string
): Promise<PaymentLinkRecord[]> {
  const links = await db
    .select()
    .from(paymentLink)
    .where(
      or(
        eq(paymentLink.modified, true),
        eq(paymentLink.isDeleted, true),
        gte(paymentLink.dtinsert, new Date(lastSync).toISOString())
      )
    );
  return links as unknown as PaymentLinkRecord[];
}

// Insere um novo paymentLink (vem da API) no banco local
async function insertLocalPaymentLink(data: PaymentLinkAPI): Promise<void> {
  await db.insert(paymentLink).values({
    slug: data.slug,
    active: data.active,
    dtinsert: new Date(data.dtInsert).toISOString(),
    dtupdate: new Date(data.dtUpdate).toISOString(),
    linkName: data.linkName,
    dtExpiration: new Date(data.dtExpiration).toISOString(),
    totalAmount: data.totalAmount,
    idMerchant: null, 
    paymentLinkStatus: data.paymentLinkStatus,
    productType: data.productType,
    installments: data.installments,
    linkUrl: data.linkUrl,
    pixEnabled: false,
    isFromServer: true,
    modified: false,
    isDeleted: false,
    transactionSlug: null
  });
}

// Atualiza um paymentLink existente no banco local
async function updateLocalPaymentLink(data: PaymentLinkAPI): Promise<void> {
  await db
    .update(paymentLink)
    .set({
      active: data.active,
      dtinsert: new Date(data.dtInsert).toISOString(),
      dtupdate: new Date(data.dtUpdate).toISOString(),
      linkName: data.linkName,
      dtExpiration: new Date(data.dtExpiration).toISOString(),
      totalAmount: data.totalAmount,
      paymentLinkStatus: data.paymentLinkStatus,
      productType: data.productType,
      installments: Number(data.installments),
      linkUrl: data.linkUrl,
      modified: false,
    })
    .where(eq(paymentLink.slug, data.slug));
}

// Marca o registro como sincronizado (limpa a flag modified)
async function markPaymentLinkAsSynced(slug: string): Promise<void> {
  await db
    .update(paymentLink)
    .set({ modified: false })
    .where(eq(paymentLink.slug, slug));
}

// Insere um registro de log na tabela syncLog
async function insertSyncLog(log: SyncLog): Promise<void> {
  await db.insert(syncLog).values({
    syncType: log.syncType,
    dateTime: new Date(log.dateTime).toISOString(),
    totalRecordsCreated: log.totalRecordsCreated,
    totalRecordsUpdated: log.totalRecordsUpdated,
    totalRecordsRetrieved: log.totalRecordsRetrieved,
  });
}

function mapLocalToAPIData(local: PaymentLinkRecord): InsertPaymentLinkAPI {
  return {
    linkName: local.linkName,
    totalAmount: local.totalAmount,
    documentId: "", // Consulte a tabela merchant para obter o documentId
    dtExpiration: local.dtExpiration,
    productType: local.productType, // Geralmente "CREDIT"
    installments: local.installments,
    shoppingItems: [], // Adapte conforme sua necessidade
  };
}

// Atualiza o registro local com os dados retornados pela API
async function updateLocalPaymentLinkFromAPI(
  data: PaymentLinkAPI
): Promise<void> {
  await updateLocalPaymentLink(data);
}

//
// Lógica Principal de Sincronização
//

export async function syncPaymentLinks(): Promise<void> {
  console.log(`Starting payment link sync at ${new Date().toISOString()}`);
  
  // 1. Obter a última data de sync para paymentLink
  const lastSync = await GetLastSyncByType("paymentLink");
  console.log(`Last sync time: ${lastSync}`);
  
  // 2. Buscar os registros locais que precisam ser sincronizados
  const localPaymentLinks = await GetPaymentLinkToSync(lastSync);
  console.log(`Found ${localPaymentLinks.length} local payment links to sync`);
  
  // 3. Buscar os registros da API atualizados desde o último sync
  const externalPaymentLinks = await fetchPaymentLinks(lastSync);
  console.log(`Fetched ${externalPaymentLinks.length} external payment links from API`);
  
  let totalCreated = 0;
  let totalUpdated = 0;
  const totalRetrieved = externalPaymentLinks.length;
  
  // Mapas para facilitar a busca por slug
  const externalMap = new Map<string, PaymentLinkAPI>();
  externalPaymentLinks.forEach((link) => externalMap.set(link.slug, link));
  
  const localMap = new Map<string, PaymentLinkRecord>();
  localPaymentLinks.forEach((link) => localMap.set(link.slug, link));
  
  // 4. Processar os registros locais para enviar para a API externa
  for (const local of localPaymentLinks) {
    if (local.isDeleted) {
      try {
        await deleteAPIPaymentLink(local.slug);
        await markPaymentLinkAsSynced(local.slug);
        console.log(`Deleted payment link ${local.slug} from external API`);
      } catch (error: any) {
        console.error(`Error deleting payment link ${local.slug}: ${error.message}`);
      }
    } else if (local.modified) {
      try {
        const apiData = mapLocalToAPIData(local);
        const response = await InsertAPIPaymentLink(apiData);
        await updateLocalPaymentLinkFromAPI(response);
        totalUpdated++;
        console.log(`Upserted payment link ${local.slug} to external API`);
      } catch (error: any) {
        console.error(`Error upserting payment link ${local.slug}: ${error.message}`);
      }
    }
  }
  
  // 5. Processar os registros externos para atualizar/inserir no banco local
  for (const ext of externalPaymentLinks) {
    const local = localMap.get(ext.slug);
    if (!local) {
      await insertLocalPaymentLink(ext);
      totalCreated++;
      console.log(`Inserted new payment link ${ext.slug} into local DB`);
    } else {
      // Se a data de atualização da API for mais recente, atualiza o registro local
      if (new Date(ext.dtUpdate) > new Date(local.dtUpdate)) {
        await updateLocalPaymentLink(ext);
        totalUpdated++;
        console.log(`Updated local payment link ${ext.slug} from external API data`);
      }
    }
  }
  
  // 6. Inserir o log de sincronização
  const syncLog: SyncLog = {
    syncType: "paymentLink",
    dateTime: new Date().toISOString(),
    totalRecordsCreated: totalCreated,
    totalRecordsUpdated: totalUpdated,
    totalRecordsRetrieved: totalRetrieved,
  };
  await insertSyncLog(syncLog);
  console.log("Payment link sync completed successfully.");
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await syncPaymentLinks();
    res.status(200).json({
      message: "Payment link sync completed successfully.",
    });
  } catch (error: any) {
    console.error("Sync failed:", error.message);
    res.status(500).json({ error: error.message });
  }
}
