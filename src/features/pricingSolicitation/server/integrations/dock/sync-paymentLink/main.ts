"use server";
import { insertPaymentLinkAndRelations } from "./paymentLink";
import { PaymentLinkObject, PaymentLinkResponse } from "./types";

async function fetchPaymentLink() {
  let offset = 0;
  const limit = 1000;
  let hasMoreData = true;
  const allData: PaymentLinkObject[] = [];

  while (hasMoreData) {
    const response = await fetch(
      `https://serviceorder.acquiring.dock.tech/v1/external_payment_links?limit=${limit}&offset=${offset}`,
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
    const data: PaymentLinkResponse = await response.json();

    // Combine os objetos retornados ao array final
    allData.push(...data.objects);

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

// Atualiza links no banco local com dados da API
async function atualizarLinksExistentes(
  linksAPI: PaymentLinkObject[]
): Promise<number> {
  try {
    // Importar db e esquemas necessários
    const { db } = await import("@/server/db");
    const { paymentLink } = await import("../../../../../drizzle/schema");
    const { eq, inArray } = await import("drizzle-orm");

    // Pegar todos os slugs para buscar eficientemente
    const slugs = linksAPI.map((link) => link.slug);

    if (slugs.length === 0) {
      return 0;
    }

    // Buscar links existentes pelo slug
    const linksExistentes = await db
      .select({
        id: paymentLink.id,
        slug: paymentLink.slug,
        dtupdate: paymentLink.dtupdate,
      })
      .from(paymentLink)
      .where(inArray(paymentLink.slug, slugs));

    // Criar mapa para acesso rápido
    const mapLinksExistentes = new Map(
      linksExistentes.map((link) => [
        link.slug,
        { id: link.id, dtupdate: link.dtupdate },
      ])
    );

    // Contar atualizações
    let atualizacoes = 0;

    // Atualizar links que tenham sido modificados na API
    for (const linkAPI of linksAPI) {
      const linkLocal = mapLinksExistentes.get(linkAPI.slug);

      if (linkLocal) {
        // Verificar se o link foi atualizado na API após a última atualização local
        const dataAtualizacaoAPI = new Date(linkAPI.dtUpdate);
        const dataAtualizacaoLocal = linkLocal.dtupdate
          ? new Date(linkLocal.dtupdate)
          : new Date(0);

        if (dataAtualizacaoAPI > dataAtualizacaoLocal) {
          // O link foi atualizado na API depois da última atualização local
          await db
            .update(paymentLink)
            .set({
              active: linkAPI.active,
              dtupdate: new Date(linkAPI.dtUpdate).toISOString(),
              linkName: linkAPI.linkName,
              dtExpiration: new Date(linkAPI.dtExpiration).toISOString(),
              totalAmount: linkAPI.totalAmount.toString(),
              paymentLinkStatus: linkAPI.paymentLinkStatus,
              productType: linkAPI.productType,
              installments: linkAPI.installments,
              linkUrl: linkAPI.linkUrl,
            })
            .where(eq(paymentLink.id, linkLocal.id));

          atualizacoes++;
        }
      }
    }

    return atualizacoes;
  } catch (error) {
    console.error("Erro ao atualizar links existentes:", error);
    return 0; // Não interrompe o processo principal
  }
}

// Modifique a função syncPaymentLink para incluir a atualização de links existentes
export async function syncPaymentLink() {
  try {
    console.log("Iniciando sincronização completa de payment links...");

    // 1. Buscar links da API
    console.log("Buscando payment links...");
    const response = await fetchPaymentLink();
    const paymentLinks: PaymentLinkObject[] = response || [];

    // 2. Atualizar links existentes que foram modificados na API
    console.log("Atualizando links existentes modificados na API...");
    const linksAtualizadosDaAPI = await atualizarLinksExistentes(paymentLinks);
    console.log(
      `${linksAtualizadosDaAPI} links atualizados da API para o banco local`
    );

    // 3. Inserir links novos
    console.log("Inserindo novos links...");
    const chunkedPaymentLinks = chunkArray(paymentLinks, 1000);
    for (const chunk of chunkedPaymentLinks) {
      await insertPaymentLinkAndRelations(chunk);
    }

    // 4. Verificar links excluídos na API e marcá-los no banco
    console.log("Verificando links excluídos...");
    const excluidos = await marcarLinksExcluidos();
    console.log(`${excluidos} links marcados como excluídos`);

    // 5. Atualizar links modificados do banco para a API
    console.log("Atualizando links modificados na API...");
    const atualizadosParaAPI = await atualizarLinksModificados();
    console.log(`${atualizadosParaAPI} links atualizados do banco para a API`);

    return {
      novos: paymentLinks.length,
      excluidos,
      atualizadosParaAPI,
      atualizadosDaAPI: linksAtualizadosDaAPI,
    };
  } catch (error) {
    console.error("Erro na sincronização de payment links:", error);
    throw new Error("Falha na sincronização de links de pagamento");
  }
}

// Função para marcar links excluídos
async function marcarLinksExcluidos(): Promise<number> {
  try {
    // Importar db e esquemas necessários
    const { db } = await import("@/server/db");
    const { paymentLink } = await import("../../../../../drizzle/schema");
    const { and, eq, inArray, isNotNull } = await import("drizzle-orm");

    // 1. Buscar todos os links ativos no banco local
    const linksLocais = await db
      .select({
        id: paymentLink.id,
        slug: paymentLink.slug,
      })
      .from(paymentLink)
      .where(
        and(
          eq(paymentLink.active, true),
          eq(paymentLink.isDeleted, false),
          isNotNull(paymentLink.slug)
        )
      );

    if (linksLocais.length === 0) {
      return 0;
    }

    // 2. Criar conjunto com slugs existentes na API
    const linksAPI = await fetchPaymentLink();
    const slugsAPI = new Set(linksAPI.map((link) => link.slug));

    // 3. Identificar links que não existem mais na API
    const linksExcluidos: number[] = [];
    linksLocais.forEach((link) => {
      if (link.slug && !slugsAPI.has(link.slug)) {
        linksExcluidos.push(link.id);
      }
    });

    // 4. Marcar como excluídos no banco local
    if (linksExcluidos.length > 0) {
      await db
        .update(paymentLink)
        .set({
          isDeleted: true,
          active: false,
          dtupdate: new Date().toISOString(),
        })
        .where(inArray(paymentLink.id, linksExcluidos));
    }

    return linksExcluidos.length;
  } catch (error) {
    console.error("Erro na verificação de links excluídos:", error);
    return 0; // Não interrompe o processo principal
  }
}

// Função para atualizar links modificados localmente na API
async function atualizarLinksModificados(): Promise<number> {
  try {
    // Importar db e esquemas necessários
    const { db } = await import("@/server/db");
    const { paymentLink, merchants } = await import(
      "../../../../../drizzle/schema"
    );
    const { and, eq, isNotNull } = await import("drizzle-orm");

    // 1. Buscar links marcados como modificados
    const linksModificados = await db
      .select()
      .from(paymentLink)
      .where(
        and(
          eq(paymentLink.modified, true),
          eq(paymentLink.isDeleted, false),
          isNotNull(paymentLink.slug)
        )
      );

    if (linksModificados.length === 0) {
      return 0;
    }

    // 2. Atualizar cada link na API
    let contadorAtualizados = 0;

    for (const link of linksModificados) {
      try {
        // Buscar documento do comerciante
        const [merchant] = await db
          .select({ idDocument: merchants.idDocument })
          .from(merchants)
          .where(eq(merchants.id, link.idMerchant || 0));

        // Preparar dados para API
        const updateData = {
          linkName: link.linkName || "",
          totalAmount: link.totalAmount || "0",
          documentId: merchant?.idDocument || "0MerchantDock1",
          dtExpiration: link.dtExpiration || "",
          productType: link.productType || "CREDIT",
          installments: link.installments || 1,
        };

        // Enviar atualização para API
        await updateAPIPaymentLink(link.slug as string, updateData);

        // Marcar como não modificado após atualização
        await db
          .update(paymentLink)
          .set({
            modified: false,
            dtupdate: new Date().toISOString(),
          })
          .where(eq(paymentLink.id, link.id));

        contadorAtualizados++;
      } catch (error) {
        console.error(`Erro ao atualizar link ${link.id}:`, error);
        // Continuar para o próximo link
      }
    }

    return contadorAtualizados;
  } catch (error) {
    console.error("Erro na atualização de links modificados:", error);
    return 0; // Não interrompe o processo principal
  }
}

// Função para atualizar um link específico na API
async function updateAPIPaymentLink(slug: string, data: any): Promise<any> {
  const response = await fetch(
    `https://serviceorder.acquiring.hml.dock.tech/v1/external_payment_links/${slug}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `${process.env.DOCK_API_KEY}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(`Falha ao atualizar link ${slug}: ${response.statusText}`);
  }

  return await response.json();
}
