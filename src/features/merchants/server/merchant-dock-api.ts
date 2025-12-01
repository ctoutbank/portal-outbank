"use server";

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  merchants,
  addresses,
  categories,
  legalNatures,
  contacts,
  merchantBankAccounts,
  configurations,
} from "../../../../drizzle/schema";
import {
  MerchantDetail,
  AddressDetail,
  MerchantInsert,
  insertMerchant,
  updateMerchant,
  insertAddress,
  updateAddress,
} from "./merchant-crud";
import { getContactByMerchantId } from "./merchant-contact";
import { getMerchantBankAccountById } from "./merchant-bank";
import { getConfigurationsByMerchantId } from "./merchant-configurations";

/**
 * Valida e normaliza o tipo de telefone
 * @param phoneType - Tipo de telefone (string | undefined | null)
 * @returns "C" para celular ou "P" para fixo (padrão: "C")
 */
function validatePhoneType(
  phoneType: string | undefined | null
): "C" | "P" {
  if (!phoneType) return "C";
  const normalized = phoneType.trim().toUpperCase();
  return normalized === "P" ? "P" : "C";
}

/**
 * Cria ou atualiza um merchant na API de onboarding da Dock
 * @param merchantData - Dados do merchant
 * @param addressData - Dados do endereço (opcional)
 * @param contactsData - Dados de contatos (opcional)
 * @param categoryData - Dados da categoria (opcional)
 * @param legalNatureData - Dados da natureza jurídica (opcional)
 * @param merchantBankData - Dados da conta bancária (opcional)
 * @param configurationData - Dados de configuração (opcional)
 * @returns Resposta da API com os dados do merchant criado/atualizado
 */
export async function createUpdateAPImerchantOnboarding(
  merchantData: MerchantDetail | any,
  addressData?: AddressDetail | any,
  contactsData?: any[],
  categoryData?: any,
  legalNatureData?: any,
  merchantBankData?: any,
  configurationData?: any
): Promise<any> {
  if (!process.env.DOCK_API_KEY) {
    throw new Error("DOCK_API_KEY não configurada");
  }

  if (!process.env.DOCK_API_URL_MERCHANTS) {
    throw new Error("DOCK_API_URL_MERCHANTS não configurada");
  }

  // Normalizar documentId (remover pontuação)
  const documentId = merchantData.idDocument
    ? merchantData.idDocument.replace(/\D/g, "")
    : "";

  // Normalizar zipCode (remover pontuação)
  const zipCode = addressData?.zipCode
    ? addressData.zipCode.replace(/\D/g, "")
    : "";

  // Validar phoneType
  const phoneType = validatePhoneType(merchantData.phoneType);

  // Converter revenue para número se for string
  let revenue = 0;
  if (merchantData.revenue) {
    if (typeof merchantData.revenue === "string") {
      revenue = parseFloat(merchantData.revenue) || 0;
    } else if (typeof merchantData.revenue === "number") {
      revenue = merchantData.revenue;
    }
  }

  // Formatar openingDate
  let openingDate: string | null = null;
  if (merchantData.openingDate) {
    const date = new Date(merchantData.openingDate);
    if (!isNaN(date.getTime())) {
      openingDate = date.toISOString().split("T")[0];
    }
  }

  // Montar payload
  const payload: any = {
    name: merchantData.name || "",
    documentId: documentId,
    corporateName: merchantData.corporateName || "",
    email: merchantData.email || "",
    areaCode: merchantData.areaCode || "",
    number: merchantData.number || "",
    phoneType: phoneType,
    timezone: merchantData.timezone || "-0300",
    isMainOffice: true,
    legalPerson: merchantData.legalPerson || "JURIDICAL",
    openingDate: openingDate,
    openingDays: merchantData.openingDays || "0111110",
    openingHour: merchantData.openingHour || "08:00:00",
    closingHour: merchantData.closingHour || "18:00:00",
    municipalRegistration: merchantData.municipalRegistration || null,
    stateSubcription: merchantData.stateSubcription || null,
    hasTef: merchantData.hasTef ?? false,
    hasPix: merchantData.hasPix ?? false,
    hasTop: merchantData.hasTop ?? false,
    establishmentFormat: merchantData.establishmentFormat || "EI",
    revenue: revenue,
  };

  // Adicionar endereço se fornecido
  if (addressData) {
    payload.address = {
      streetAddress: addressData.streetAddress || "",
      streetNumber: addressData.streetNumber || "",
      complement: addressData.complement || "",
      neighborhood: addressData.neighborhood || "",
      city: addressData.city || "",
      state: addressData.state || "",
      zipCode: zipCode,
      country: "BR",
    };
  }

  // Adicionar contatos se fornecidos
  if (contactsData && contactsData.length > 0) {
    payload.contacts = contactsData.map((contact: any) => ({
      contactName: contact.contactName || contact.name || "",
      contactEmail: contact.contactEmail || contact.email || "",
      contactDDD: contact.contactDDD || contact.areaCode || "",
      contactNumber: contact.contactNumber || contact.number || "",
      contactType: "ADMINISTRATIVE",
    }));
  }

  // Adicionar categoria se fornecida
  if (categoryData) {
    payload.category = {
      mcc: categoryData.mcc || "",
      cnae: categoryData.cnae || "",
    };
  }

  // Adicionar natureza jurídica se fornecida
  if (legalNatureData) {
    payload.legalNature = {
      code: legalNatureData.code || "",
    };
  }

  // Adicionar conta bancária se fornecida
  if (merchantBankData) {
    payload.merchantBankAccount = {
      bankId: merchantBankData.bankId || "",
      agencyNumber: merchantBankData.agencyNumber || "",
      accountNumber: merchantBankData.accountNumber || "",
      accountType: merchantBankData.accountType || "CHECKING",
      legalPerson: merchantData.legalPerson || "JURIDICAL",
    };
  }

  // Adicionar configuração se fornecida
  if (configurationData) {
    payload.configuration = configurationData;
  }

  // Determinar método HTTP e URL
  const method = merchantData.slug ? "PUT" : "POST";
  let url = `${process.env.DOCK_API_URL_MERCHANTS}/v1/onboarding`;
  if (merchantData.slug) {
    url = `${process.env.DOCK_API_URL_MERCHANTS}/v1/onboarding/${merchantData.slug}`;
  }

  try {
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
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        errorData.error ||
        `Erro na API Dock: ${response.status} ${response.statusText}`;

      // Se for erro de validação (422), extrair detalhes
      if (response.status === 422 && errorData.errors) {
        const validationErrors = Object.entries(errorData.errors)
          .map(([field, messages]: [string, any]) => {
            const msgArray = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgArray.join(", ")}`;
          })
          .join("; ");
        throw new Error(`Erro de validação: ${validationErrors}`);
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error: any) {
    console.error("Erro ao criar/atualizar merchant na API Dock:", error);
    throw error;
  }
}

/**
 * Atualiza um merchant existente na base de dados local e na API da Dock
 * @param merchantData - Dados do merchant a serem atualizados
 * @param addressData - Dados do endereço a serem atualizados (opcional)
 */
export async function updateMerchantWithAPI(
  merchantData: MerchantDetail,
  addressData?: AddressDetail
): Promise<void> {
  // Verificar se o merchant existe
  const existingMerchant = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, merchantData.id))
    .limit(1);

  if (existingMerchant.length === 0) {
    throw new Error(`Merchant com ID ${merchantData.id} não encontrado`);
  }

  const merchant = existingMerchant[0];

  // Atualizar endereço se fornecido
  if (addressData && merchant.idAddress) {
    await updateAddress(addressData);
  }

  // Buscar dados relacionados
  let categoryData: any = null;
  if (merchant.idCategory) {
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.id, merchant.idCategory))
      .limit(1);
    if (category[0]) {
      categoryData = {
        mcc: category[0].mcc || "",
        cnae: category[0].cnae || "",
      };
    }
  }

  let legalNatureData: any = null;
  if (merchant.idLegalNature) {
    const legalNature = await db
      .select()
      .from(legalNatures)
      .where(eq(legalNatures.id, merchant.idLegalNature))
      .limit(1);
    if (legalNature[0]) {
      legalNatureData = {
        code: legalNature[0].code || "",
      };
    }
  }

  // Buscar contatos
  const contactsData = await getContactByMerchantId(merchant.id);
  const contactsArray = contactsData.map((contact: any) => ({
    contactName: contact.contacts.contactName || "",
    contactEmail: contact.contacts.contactEmail || "",
    contactDDD: contact.contacts.contactDDD || "",
    contactNumber: contact.contacts.contactNumber || "",
    contactType: "ADMINISTRATIVE",
  }));

  // Buscar conta bancária
  let merchantBankData: any = null;
  if (merchant.idMerchantBankAccount) {
    const bankAccount = await getMerchantBankAccountById(
      merchant.idMerchantBankAccount
    );
    if (bankAccount?.merchantBankAccount) {
      merchantBankData = {
        bankId: bankAccount.merchantBankAccount.bankId || "",
        agencyNumber: bankAccount.merchantBankAccount.agencyNumber || "",
        accountNumber: bankAccount.merchantBankAccount.accountNumber || "",
        accountType: bankAccount.merchantBankAccount.accountType || "CHECKING",
      };
    }
  }

  // Buscar configuração
  let configurationData: any = null;
  if (merchant.idConfiguration) {
    const config = await getConfigurationsByMerchantId(merchant.id);
    if (config) {
      configurationData = config;
    }
  }

  // Buscar endereço completo se não foi fornecido
  let fullAddressData: AddressDetail | undefined = addressData;
  if (!fullAddressData && merchant.idAddress) {
    const address = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, merchant.idAddress))
      .limit(1);
    fullAddressData = address[0];
  }

  // Se DOCK_WRITE_ENABLED está habilitado e merchant tem slug, enviar para API
  const writeEnabled =
    process.env.DOCK_WRITE_ENABLED !== "false" &&
    process.env.DOCK_WRITE_ENABLED !== "0";

  if (writeEnabled && merchant.slug) {
    try {
      const apiResponse = await createUpdateAPImerchantOnboarding(
        merchantData,
        fullAddressData,
        contactsArray.length > 0 ? contactsArray : undefined,
        categoryData,
        legalNatureData,
        merchantBankData,
        configurationData
      );

      // Atualizar merchant com dados retornados pela API
      if (apiResponse.slug) {
        merchantData.slug = apiResponse.slug;
      }
      if (apiResponse.status) {
        // Se a API retornar status, podemos atualizar se necessário
        // merchantData.active = apiResponse.status === 'active';
      }
    } catch (error) {
      console.error(
        "Erro ao atualizar merchant na API Dock, continuando com atualização local:",
        error
      );
      // Continua com atualização local mesmo se API falhar
    }
  } else if (writeEnabled && !merchant.slug) {
    // Se não tem slug mas tem dados bancários, criar na API primeiro
    if (merchantBankData) {
      try {
        const apiResponse = await createUpdateAPImerchantOnboarding(
          merchantData,
          fullAddressData,
          contactsArray.length > 0 ? contactsArray : undefined,
          categoryData,
          legalNatureData,
          merchantBankData,
          configurationData
        );

        if (apiResponse.slug) {
          merchantData.slug = apiResponse.slug;
        }
      } catch (error) {
        console.error(
          "Erro ao criar merchant na API Dock, continuando com atualização local:",
          error
        );
      }
    }
  }

  // Atualizar merchant no banco local
  await updateMerchant(merchantData);
}

/**
 * Cria um novo merchant na base de dados local e opcionalmente envia para a API Dock
 * @param merchantData - Dados do merchant a ser criado
 * @param addressData - Dados do endereço do merchant (opcional)
 * @returns ID do merchant criado na base de dados local
 */
export async function createMerchantWithAPI(
  merchantData: MerchantInsert,
  addressData?: AddressInsert
): Promise<number> {
  // Inserir endereço se fornecido
  let addressId: number | null = null;
  if (addressData) {
    addressId = await insertAddress(addressData);
    merchantData.idAddress = addressId;
  }

  // Inserir merchant no banco local
  const merchantId = await insertMerchant(merchantData);

  // Se DOCK_WRITE_ENABLED está habilitado e tem dados bancários, enviar para API
  const writeEnabled =
    process.env.DOCK_WRITE_ENABLED !== "false" &&
    process.env.DOCK_WRITE_ENABLED !== "0";

  if (writeEnabled) {
    // Buscar dados bancários do merchant
    const merchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (merchant[0]?.idMerchantBankAccount) {
      const bankAccount = await getMerchantBankAccountById(
        merchant[0].idMerchantBankAccount
      );

      if (bankAccount?.merchantBankAccount) {
        try {
          // Buscar dados relacionados para enviar à API
          let categoryData: any = null;
          if (merchant[0].idCategory) {
            const category = await db
              .select()
              .from(categories)
              .where(eq(categories.id, merchant[0].idCategory))
              .limit(1);
            if (category[0]) {
              categoryData = {
                mcc: category[0].mcc || "",
                cnae: category[0].cnae || "",
              };
            }
          }

          let legalNatureData: any = null;
          if (merchant[0].idLegalNature) {
            const legalNature = await db
              .select()
              .from(legalNatures)
              .where(eq(legalNatures.id, merchant[0].idLegalNature))
              .limit(1);
            if (legalNature[0]) {
              legalNatureData = {
                code: legalNature[0].code || "",
              };
            }
          }

          const merchantBankData = {
            bankId: bankAccount.merchantBankAccount.bankId || "",
            agencyNumber: bankAccount.merchantBankAccount.agencyNumber || "",
            accountNumber: bankAccount.merchantBankAccount.accountNumber || "",
            accountType: bankAccount.merchantBankAccount.accountType || "CHECKING",
          };

          const fullAddressData = addressId
            ? await db
                .select()
                .from(addresses)
                .where(eq(addresses.id, addressId))
                .limit(1)
                .then((result) => result[0])
            : undefined;

          const apiResponse = await createUpdateAPImerchantOnboarding(
            merchant[0],
            fullAddressData,
            undefined,
            categoryData,
            legalNatureData,
            merchantBankData,
            undefined
          );

          // Atualizar merchant com slug retornado pela API
          if (apiResponse.slug) {
            await db
              .update(merchants)
              .set({ slug: apiResponse.slug })
              .where(eq(merchants.id, merchantId));
          }
        } catch (error) {
          console.error(
            "Erro ao criar merchant na API Dock, merchant criado apenas localmente:",
            error
          );
          // Continua mesmo se API falhar
        }
      }
    }
  }

  return merchantId;
}

