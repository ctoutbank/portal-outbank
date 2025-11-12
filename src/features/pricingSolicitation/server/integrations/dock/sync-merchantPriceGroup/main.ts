"use server";

import { syncMerchantPriceGroup } from "./service";

export async function fetchMerchantPriceGroups(
  slugMerchant: string,
  slugMerchantPrice: string
) {
  try {
    const response = await fetch(
      `${process.env.DOCK_API_URL_MERCHANTS}/v1/merchants/${slugMerchant}/merchant_prices/${slugMerchantPrice}/merchant_price_groups`,
      {
        headers: {
          Authorization: `Bearer ${process.env.DOCK_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    await syncMerchantPriceGroup(data);
  } catch (error) {
    console.error("Erro ao buscar e sincronizar dados:", error);
    throw error;
  }
}
