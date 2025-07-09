"use server";

import { MerchantPriceGroupResponse } from "./types";
import { getAllMerchantPrices, getMerchantPriceIdBySlug, insertMerchantPriceGroup, insertTransactionPrices } from "./repository";
import { fetchMerchantPriceGroups } from "./main";

export async function syncAllMerchantPriceGroups() {
  try {
    const merchantPrices = await getAllMerchantPrices();
    console.log(`Iniciando sincronização para ${merchantPrices.length} merchant prices`);

    for (const merchantPrice of merchantPrices) {
      try {
        if (!merchantPrice.slugMerchant || !merchantPrice.slug) {
          console.warn(`Merchant price ${merchantPrice.name} não tem slugs necessários`);
          continue;
        }

        console.log(`Sincronizando ${merchantPrice.name} (${merchantPrice.slug})`);
        await fetchMerchantPriceGroups(merchantPrice.slugMerchant, merchantPrice.slug);
      } catch (error) {
        console.error(`Erro ao sincronizar ${merchantPrice.name}:`, error);
        continue;
      }
    }

    console.log('Sincronização completa');
    return { success: true, message: 'Sincronização completa' };
  } catch (error) {
    console.error("Erro durante a sincronização:", error);
    return { success: false, message: 'Erro durante a sincronização' };
  }
}

export async function syncMerchantPriceGroup(data: MerchantPriceGroupResponse) {
  try {
    for (const group of data.objects) {
      const idMerchantPrice = await getMerchantPriceIdBySlug(group.merchantPrice.slug);
      
      if (!idMerchantPrice) {
        console.warn(`MerchantPrice não encontrado para slug: ${group.merchantPrice.slug}`);
        continue;
      }

      const idMerchantPriceGroup = await insertMerchantPriceGroup(group, Number(idMerchantPrice));
      await insertTransactionPrices(group.listMerchantTransactionPrice, BigInt(idMerchantPriceGroup));
    }

    console.log(`Sincronização concluída. ${data.objects.length} grupos processados.`);
  } catch (error) {
    console.error("Erro durante a sincronização:", error);
    throw error;
  }
}

export async function syncSpecificMerchantPriceGroup(slugMerchant: string, slugMerchantPrice: string) {
  try {
    console.log(`Iniciando sincronização para merchant: ${slugMerchant}, price: ${slugMerchantPrice}`);
    await fetchMerchantPriceGroups(slugMerchant, slugMerchantPrice);
    return { success: true, message: 'Sincronização individual concluída com sucesso' };
  } catch (error: unknown) {
    console.error("Erro durante a sincronização individual:", error);
    if (error instanceof Error) {
      return { success: false, message: `Erro: ${error.message}` };
    }
    return { success: false, message: 'Erro desconhecido durante a sincronização' };
  }
}