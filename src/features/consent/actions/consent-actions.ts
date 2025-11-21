"use server";

import { grantModuleConsent, revokeModuleConsent } from "../server/module-consent";
import { revalidatePath } from "next/cache";

export async function grantConsentAction(formData: FormData) {
  try {
    const merchantId = parseInt(formData.get("merchantId") as string);
    const moduleId = parseInt(formData.get("moduleId") as string);
    const consentText = formData.get("consentText") as string;

    if (!merchantId || !moduleId || !consentText) {
      return {
        success: false,
        error: "Dados inválidos",
      };
    }

    await grantModuleConsent({
      merchantId,
      moduleId,
      consentText,
    });

    revalidatePath("/consent/modules");
    revalidatePath("/tenant/dashboard");

    return {
      success: true,
      message: "Consentimento LGPD registrado com sucesso",
    };
  } catch (error: any) {
    console.error("Erro ao registrar consentimento:", error);
    return {
      success: false,
      error: error.message || "Erro ao registrar consentimento",
    };
  }
}

export async function revokeConsentAction(merchantId: number, moduleId: number) {
  try {
    await revokeModuleConsent(merchantId, moduleId);

    revalidatePath("/consent/modules");
    revalidatePath("/tenant/dashboard");

    return {
      success: true,
      message: "Consentimento LGPD revogado com sucesso",
    };
  } catch (error: any) {
    console.error("Erro ao revogar consentimento:", error);
    return {
      success: false,
      error: error.message || "Erro ao revogar consentimento",
    };
  }
}

