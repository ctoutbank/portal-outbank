import {
  GetMerchantPriceIdBySlug,
  getOrCreateMerchantPrice,
} from "./merchantPrice";

// Função para buscar todos os merchants
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

// Função para buscar preços de um merchant específico
async function fetchMerchantPrices(slugMerchant: string) {
  const response = await fetch(
    `${process.env.DOCK_API_URL_MERCHANTS}/v1/merchants/${slugMerchant}/merchant_prices`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.DOCK_API_KEY}`,
      },
    }
  );
  return await response.json();
}
console.log("fetchMerchantPrices");

// Função principal que coordena todo o processo
export async function syncMerchantPrices() {
  if (process.env.DOCK_SYNC_ENABLED !== "true") {
    console.log("Dock sync is disabled. Set DOCK_SYNC_ENABLED=true to enable.");
    return;
  }

  console.log("Iniciando syncMerchantPrices");

  try {
    console.log("Buscando merchants...");
    const response = await fetchMerchants();
    const merchants = response.objects;
    console.log("merchants", merchants);

    if (!merchants || !Array.isArray(merchants)) {
      console.error("Erro: merchants não é um array válido", merchants);
      return;
    }

    console.log(`Encontrados ${merchants.length} merchants`);

    for (const merchant of merchants) {
      try {
        console.log(`Buscando preços para merchant: ${merchant.slug}`);
        const price = await fetchMerchantPrices(merchant.slug);

        if (!price || !price.slug) {
          console.error(
            `Erro: preço não encontrado para ${merchant.slug}`,
            price
          );
          continue;
        }

        console.log(`Processando preço para merchant ${merchant.slug}`);
        await getOrCreateMerchantPrice(price, merchant.slug);
        await GetMerchantPriceIdBySlug(merchant.slug);
      } catch (error) {
        console.error(`Erro ao processar merchant ${merchant.slug}:`, error);
      }
    }

    console.log("Sincronização concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao sincronizar preços:", error);
    throw error;
  }
}
