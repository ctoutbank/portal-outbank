import {
  GetMerchantPriceIdBySlug,
  getOrCreateMerchantPrice,
} from "./merchantPrice";

// Função para buscar todos os merchants
async function fetchMerchants() {
  const response = await fetch(
    "https://merchant.acquiring.dock.tech/v1/merchants?limit=40",
    {
      headers: {
        Authorization: `eyJraWQiOiJJTlRFR1JBVElPTiIsInR5cCI6IkpXVCIsImFsZyI6IkhTNTEyIn0.eyJpc3MiOiJGNDBFQTZCRTQxMUM0RkQwODVDQTBBMzJCQUVFMTlBNSIsInNpcCI6IjUwQUYxMDdFMTRERDQ2RTJCQjg5RkE5OEYxNTI2M0RBIn0.2urCljTPGjtwk6oSlGoOBfM16igLfFUNRqDg63WvzSFpB79gYf3lw1jEgVr4RCH_NU6A-5XKbuzIJtAXyETvzw`,
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
    `https://merchant.acquiring.dock.tech/v1/merchants/${slugMerchant}/merchant_prices`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `eyJraWQiOiJJTlRFR1JBVElPTiIsInR5cCI6IkpXVCIsImFsZyI6IkhTNTEyIn0.eyJpc3MiOiJGNDBFQTZCRTQxMUM0RkQwODVDQTBBMzJCQUVFMTlBNSIsInNpcCI6IjUwQUYxMDdFMTRERDQ2RTJCQjg5RkE5OEYxNTI2M0RBIn0.2urCljTPGjtwk6oSlGoOBfM16igLfFUNRqDg63WvzSFpB79gYf3lw1jEgVr4RCH_NU6A-5XKbuzIJtAXyETvzw`,
      },
    }
  );
  return await response.json();
}
console.log("fetchMerchantPrices");

// Função principal que coordena todo o processo
export async function syncMerchantPrices() {
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
