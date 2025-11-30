"use server";

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  merchants,
  addresses,
  contacts,
  categories,
  legalNatures,
  configurations,
  merchantBankAccounts,
} from "../../../../drizzle/schema";
import {
  MerchantDetail,
  AddressDetail,
  updateMerchant,
  updateAddress,
} from "./merchant-crud";
import { getContactByMerchantId } from "./merchant-contact";
import { getMerchantBankAccountById } from "./merchant-bank";
import { getConfigurationsByMerchantId } from "./merchant-configurations";
import { CategoryDetail } from "@/features/categories/server/category";

/**
 * Valida e normaliza o tipo de telefone
 * @param phoneType - Tipo de telefone (C ou P)
 * @returns "C" para celular ou "P" para fixo (padrão: "C")
 */
function validatePhoneType(phoneType: string | undefined | null): "C" | "P" {
  if (phoneType === "P") {
    return "P"; // Telefone fixo
  }
  return "C"; // Celular (valor padrão)
}

/**
 * Cria ou atualiza um merchant na API de onboarding da Dock
 * @param merchantData - Dados do merchant para serem enviados à API
 * @param addressData - Dados do endereço do merchant (opcional)
 * @param contactsData - Dados de contatos do merchant (opcional)
 * @param categoryData - Dados da categoria do merchant (opcional)
 * @param legalNatureData - Dados da natureza jurídica do merchant (opcional)
 * @param merchantBankData - Dados da conta bancária do merchant (opcional)
 * @param configurationData - Dados de configuração do merchant (opcional)
 * @returns Resposta da API com os dados do merchant criado/atualizado
 */
export async function createUpdateAPImerchantOnboarding(
  merchantData: MerchantDetail | any,
  addressData?: AddressDetail | any,
  contactsData?: any[],
  categoryData?: CategoryDetail | any,
  legalNatureData?: any,
  merchantBankData?: any,
  configurationData?: any
): Promise<any> {
  try {
    console.log("Preparando dados para envio à API de onboarding");

    // Validar variáveis de ambiente
    if (!process.env.DOCK_API_URL_MERCHANTS) {
      throw new Error("DOCK_API_URL_MERCHANTS não configurado");
    }

    if (!process.env.DOCK_API_KEY) {
      throw new Error("DOCK_API_KEY não configurado");
    }

    // Formatar o payload conforme esperado pela API
    const payload = {
      name: merchantData.name || "",
      // Garantir que documentId está no formato correto (apenas números, sem pontuação)
      documentId: (merchantData.idDocument || "").replace(/[^\d]/g, ""),
      corporateName: merchantData.corporateName || "",
      email: merchantData.email || "",
      areaCode: merchantData.areaCode || "",
      number: merchantData.number || "",
      // Garantir que phoneType seja sempre um valor válido (C ou P)
      phoneType: validatePhoneType(merchantData.phoneType),
      timezone: merchantData.timezone || "-0300",
      contacts: contactsData?.length
        ? contactsData.map((contactItem) => {
            const contact = contactItem.contacts || contactItem;
            return {
              contactName: contact.name || "",
              contactEmail: contact.email || "",
              contactDDD: contact.areaCode || "",
              contactNumber: contact.number || "",
              contactType: contact.type || "ADMINISTRATIVE",
            };
          })
        : [
            {
              contactName: "admin",
              contactEmail: "admin@example.com",
              contactDDD: "11",
              contactNumber: "999999999",
              contactType: "ADMINISTRATIVE",
            },
          ],
      address: addressData
        ? {
            streetAddress: addressData.streetAddress || "",
            streetNumber: addressData.streetNumber || "",
            complement: addressData.complement || "",
            neighborhood: addressData.neighborhood || "",
            city: addressData.city || "",
            state: addressData.state || "",
            zipCode: addressData.zipCode?.replace(/[^\d]/g, "") || "",
            country: addressData.country || "BR",
          }
        : {
            streetAddress: "Rua Exemplo",
            streetNumber: "123",
            complement: "Sala 1",
            neighborhood: "Centro",
            city: "São Paulo",
            state: "SP",
            zipCode: "01001000",
            country: "BR",
          },
      isMainOffice: merchantData.isMainOffice ?? true,
      // Garantir que legalPerson seja um valor válido
      legalPerson: "JURIDICAL", // Valor fixo conforme exemplo curl
      openingDate: merchantData.openingDate
        ? new Date(merchantData.openingDate).toISOString().split("T")[0]
        : "2023-01-01",
      openingDays: merchantData.openingDays || "0111110",
      openingHour: merchantData.openingHour || "09:00:00",
      closingHour: merchantData.closingHour || "18:00:00",
      municipalRegistration: merchantData.municipalRegistration || null,
      stateSubcription: merchantData.stateSubcription || null,
      // Garantir valores booleanos
      hasTef: merchantData.hasTef ?? true,
      hasPix: merchantData.hasPix ?? true,
      hasTop: merchantData.hasTop ?? true,
      // Garantir um valor válido para establishmentFormat
      establishmentFormat: merchantData.establishmentFormat || "EI",
      revenue: merchantData.revenue
        ? typeof merchantData.revenue === "string"
          ? parseFloat(merchantData.revenue) || 7.4
          : merchantData.revenue
        : 7.4,
      category: categoryData
        ? {
            mcc: categoryData.mcc || "5999",
            cnae: categoryData.cnae || "4789-0/04",
          }
        : {
            mcc: "5999",
            cnae: "4789-0/04",
          },
      legalNature: legalNatureData
        ? {
            code: legalNatureData.code || "206-2",
          }
        : {
            code: "206-2",
          },
      merchantBankAccount: merchantBankData
        ? {
            bankId: merchantBankData.compeCode || merchantBankData.bankId || "341",
            agencyNumber: merchantBankData.bankBranchNumber || merchantBankData.agencyNumber || "0001",
            accountNumber: merchantBankData.accountNumber || "123456",
            accountType: merchantBankData.accountType || "CHECKING",
            legalPerson: "JURIDICAL",
          }
        : {
            bankId: "341",
            agencyNumber: "0001",
            accountNumber: "123456",
            accountType: "CHECKING",
            legalPerson: "JURIDICAL",
          },
      configuration: configurationData || undefined,
    };

    console.log("Enviando dados para API:", JSON.stringify(payload, null, 2));

    // Determinar o método HTTP e URL com base na presença de slug
    const method = merchantData.slug ? "PUT" : "POST";
    const baseUrl = process.env.DOCK_API_URL_MERCHANTS;
    let url = `${baseUrl}/v1/onboarding`;

    // Se tiver slug, verificar se é válido antes de usar na URL
    if (merchantData.slug) {
      // Verificar se o slug é válido (comprimento ≤ 32)
      if (merchantData.slug.length > 32) {
        console.warn(
          `Slug inválido para merchant: ${merchantData.slug} (comprimento > 32)`
        );
        throw new Error(
          `Slug inválido para merchant: ${merchantData.slug} (comprimento > 32)`
        );
      }

      url = `${baseUrl}/v1/onboarding/${merchantData.slug}`;
    }

    console.log(`Usando método ${method} para ${url}`);

    try {
      // Enviar para a API
      const response = await fetch(url, {
        method: method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DOCK_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na API (${response.status}):`, errorText);

        // Tentar analisar o erro JSON para fornecer mais detalhes
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.errors && errorJson.errors.length > 0) {
            // Log com mais detalhes sobre o erro
            console.error(
              "Detalhes do erro:",
              JSON.stringify(errorJson.errors, null, 2)
            );

            // Mensagem de erro mais descritiva
            const errorDetails = errorJson.errors
              .map(
                (err: any) =>
                  `Campo: ${err.data || "desconhecido"}, Erro: ${
                    err.msg || "erro desconhecido"
                  }, Código: ${err.code || "sem código"}`
              )
              .join("; ");

            throw new Error(
              `Falha na API de onboarding: ${
                response.statusText || response.status
              }. Detalhes: ${errorDetails}`
            );
          }
        } catch {
          // Se não conseguir fazer parse do JSON, apenas use o texto original
        }

        throw new Error(
          `Falha na API de onboarding: ${
            response.statusText || response.status
          }. Detalhes: ${errorText}`
        );
      }

      const responseData = await response.json();
      console.log("Resposta da API de onboarding:", responseData);
      return responseData;
    } catch (error) {
      console.error("Erro ao criar/atualizar merchant na API:", error);
      throw error;
    }
  } catch (error) {
    console.error("Erro ao criar/atualizar merchant na API:", error);
    throw error;
  }
}

/**
 * Atualiza um merchant existente na base de dados local e na API da Dock
 * @param merchantData - Dados do merchant a serem atualizados
 * @param addressData - Dados do endereço a serem atualizados (opcional)
 * @returns void
 */
export async function updateMerchantWithAPI(
  merchantData: MerchantDetail,
  addressData?: AddressDetail
): Promise<void> {
  // Verificar feature flag
  const dockWriteEnabled = process.env.DOCK_WRITE_ENABLED !== "false";

  try {
    console.log(
      `Iniciando atualização de merchant ID ${merchantData.id} com integração API`
    );

    // 1. Verificar se o merchant existe
    const existingMerchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, merchantData.id))
      .limit(1);

    if (existingMerchant.length === 0) {
      throw new Error(`Merchant ID ${merchantData.id} não encontrado`);
    }

    // 2. Atualizar endereço se fornecido
    if (addressData && addressData.id) {
      await updateAddress(addressData);
    } else if (merchantData.idAddress && !addressData) {
      // Buscar endereço associado caso não tenha sido fornecido
      addressData = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, merchantData.idAddress))
        .limit(1)
        .then((res) => res[0] || undefined);
    }

    // 3. Buscar dados relacionados necessários para a API
    const categoryData = merchantData.idCategory
      ? await db
          .select()
          .from(categories)
          .where(eq(categories.id, merchantData.idCategory))
          .limit(1)
          .then((res) => res[0] || undefined)
      : undefined;

    const legalNatureData = merchantData.idLegalNature
      ? await db
          .select()
          .from(legalNatures)
          .where(eq(legalNatures.id, merchantData.idLegalNature))
          .limit(1)
          .then((res) => res[0] || undefined)
      : undefined;

    // 4. Buscar dados de contatos
    const contactsData = await getContactByMerchantId(merchantData.id);

    // 5. Buscar conta bancária se existir
    let merchantBankData = undefined;
    if (merchantData.idMerchantBankAccount) {
      const bankAccount = await getMerchantBankAccountById(
        merchantData.idMerchantBankAccount
      );
      if (bankAccount?.merchantBankAccount) {
        merchantBankData = {
          compeCode: bankAccount.merchantBankAccount.compeCode,
          bankId: bankAccount.merchantBankAccount.compeCode || "341",
          bankBranchNumber: bankAccount.merchantBankAccount.bankBranchNumber,
          agencyNumber: bankAccount.merchantBankAccount.bankBranchNumber || "0001",
          accountNumber:
            bankAccount.merchantBankAccount.accountNumber || "123456",
          accountType: bankAccount.merchantBankAccount.accountType || "CHECKING",
        };
      }
    }

    // 6. Buscar configuração se existir
    let configurationData = undefined;
    if (merchantData.idConfiguration) {
      configurationData = await getConfigurationsByMerchantId(merchantData.id);
    }

    // 7. Tentar atualizar na API (se feature flag estiver habilitada)
    let apiUpdated = false;
    if (dockWriteEnabled) {
      try {
        // Só enviar para API se tiver slug (indicando que já existe na API)
        if (merchantData.slug) {
          const apiResponse = await createUpdateAPImerchantOnboarding(
            merchantData,
            addressData,
            contactsData,
            categoryData,
            legalNatureData,
            merchantBankData,
            configurationData
          );

          if (apiResponse) {
            apiUpdated = true;

            // Atualizar dados que podem ter mudado na API
            if (apiResponse.riskAnalysisStatus) {
              merchantData.riskAnalysisStatus = apiResponse.riskAnalysisStatus;
            }
            if (apiResponse.slug && apiResponse.slug !== merchantData.slug) {
              merchantData.slug = apiResponse.slug;
            }
          }
        } else {
          console.log(
            "Merchant não possui slug, criando na API pela primeira vez"
          );

          // Criar na API como novo
          const apiResponse = await createUpdateAPImerchantOnboarding(
            merchantData,
            addressData,
            contactsData,
            categoryData,
            legalNatureData,
            merchantBankData,
            configurationData
          );

          if (apiResponse && apiResponse.slug) {
            apiUpdated = true;
            merchantData.slug = apiResponse.slug;
            // Manter slugCustomer do tenant atual (não sobrescrever)
            if (apiResponse.riskAnalysisStatus) {
              merchantData.riskAnalysisStatus = apiResponse.riskAnalysisStatus;
            }
          }
        }
      } catch (apiError) {
        console.error("Erro ao atualizar merchant na API:", apiError);
        // Continuamos com a atualização local mesmo se a API falhar
      }
    } else {
      console.log(
        "Escrita na API Dock desabilitada (DOCK_WRITE_ENABLED=false)"
      );
    }

    // 8. Atualizar merchant na base local
    // Garantir que campos de data estejam no formato correto
    const updateData = {
      ...merchantData,
      dtupdate: new Date().toISOString(),
      openingDate: merchantData.openingDate
        ? new Date(merchantData.openingDate).toISOString()
        : null,
      // Converter revenue para string conforme esperado pelo schema
      revenue:
        merchantData.revenue !== undefined && merchantData.revenue !== null
          ? merchantData.revenue.toString()
          : null,
    };

    await updateMerchant(updateData);

    if (apiUpdated) {
      console.log(
        `Merchant ID ${merchantData.id} atualizado com sucesso na API e na base local`
      );
    } else {
      console.log(
        `Merchant ID ${merchantData.id} atualizado somente na base local`
      );
    }
  } catch (error) {
    console.error("Erro ao atualizar merchant com integração API:", error);
    throw error;
  }
}

/**
 * Cria um novo merchant na base de dados local
 * Opcionalmente pode enviar para a API Dock se tiver dados completos
 * @param merchantData - Dados do merchant a ser criado
 * @param addressData - Dados do endereço do merchant (opcional)
 * @returns ID do merchant criado na base de dados local
 */
export async function createMerchantWithAPI(
  merchantData: any,
  addressData?: AddressDetail
): Promise<number> {
  try {
    console.log("Iniciando criação de merchant no banco local");

    // 1. Se tiver dados de endereço, inserir primeiro para obter o ID
    let addressId: number | undefined = undefined;
    if (addressData) {
      const { insertAddress } = await import("./merchant-crud");
      addressId = await insertAddress(addressData);
      merchantData.idAddress = addressId;
    }

    // 2. Inserir o merchant na base local
    const { insertMerchant } = await import("./merchant-crud");
    const merchantId = await insertMerchant(merchantData);

    console.log(`Merchant ID ${merchantId} criado no banco local com sucesso`);

    // 3. Opcionalmente enviar para API se tiver dados completos
    const dockWriteEnabled = process.env.DOCK_WRITE_ENABLED !== "false";
    if (dockWriteEnabled && merchantData.idMerchantBankAccount) {
      console.log("Enviando merchant para API Dock...");
      try {
        // Buscar dados relacionados
        const categoryData = merchantData.idCategory
          ? await db
              .select()
              .from(categories)
              .where(eq(categories.id, merchantData.idCategory))
              .limit(1)
              .then((res) => res[0] || undefined)
          : undefined;

        const legalNatureData = merchantData.idLegalNature
          ? await db
              .select()
              .from(legalNatures)
              .where(eq(legalNatures.id, merchantData.idLegalNature))
              .limit(1)
              .then((res) => res[0] || undefined)
          : undefined;

        const contactsData = await getContactByMerchantId(merchantId);

        let merchantBankData = undefined;
        if (merchantData.idMerchantBankAccount) {
          const bankAccount = await getMerchantBankAccountById(
            merchantData.idMerchantBankAccount
          );
          if (bankAccount?.merchantBankAccount) {
            merchantBankData = {
              compeCode: bankAccount.merchantBankAccount.compeCode,
              bankId: bankAccount.merchantBankAccount.compeCode || "341",
              bankBranchNumber: bankAccount.merchantBankAccount.bankBranchNumber,
              agencyNumber:
                bankAccount.merchantBankAccount.bankBranchNumber || "0001",
              accountNumber:
                bankAccount.merchantBankAccount.accountNumber || "123456",
              accountType:
                bankAccount.merchantBankAccount.accountType || "CHECKING",
            };
          }
        }

        const apiResponse = await createUpdateAPImerchantOnboarding(
          { ...merchantData, id: merchantId },
          addressData,
          contactsData,
          categoryData,
          legalNatureData,
          merchantBankData
        );

        if (apiResponse && apiResponse.slug) {
          // Atualizar merchant com slug retornado pela API
          await db
            .update(merchants)
            .set({
              slug: apiResponse.slug,
              riskAnalysisStatus: apiResponse.riskAnalysisStatus || null,
            })
            .where(eq(merchants.id, merchantId));

          console.log(
            `Merchant ID ${merchantId} enviado para API Dock com sucesso. Slug: ${apiResponse.slug}`
          );
        }
      } catch (apiError) {
        console.error(
          "Erro ao enviar merchant para API Dock (continua com criação local):",
          apiError
        );
      }
    } else {
      console.log(
        "Para enviar à API, complete o cadastro com os dados bancários"
      );
    }

    return merchantId;
  } catch (error) {
    console.error("Erro ao criar merchant no banco local:", error);
    throw error;
  }
}

