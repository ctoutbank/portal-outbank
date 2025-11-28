"use server";

import { ConfigurationOperationsSchema } from "../schema/configuration-schema";
import {
  ConfigurationDetail,
  ConfigurationInsert,
  insertConfiguration,
  updateConfiguration,
} from "../server/merchant-configuration-crud";
import { generateSlug } from "@/lib/utils";

export async function insertConfigurationFormAction(
  data: ConfigurationOperationsSchema
) {
  const configurationInsert: ConfigurationInsert = {
    slug: data.slug || generateSlug(),
    active: data.active ?? true,
    lockCpAnticipationOrder: data.lockCpAnticipationOrder ?? false,
    lockCnpAnticipationOrder: data.lockCnpAnticipationOrder ?? false,
    url: data.url || "",
    dtinsert: (data.dtinsert || new Date()).toISOString(),
    dtupdate: (data.dtupdate || new Date()).toISOString(),
    anticipationRiskFactorCp: data.anticipationRiskFactorCp
      ? Number(data.anticipationRiskFactorCp)
      : null,
    anticipationRiskFactorCnp: data.anticipationRiskFactorCnp
      ? Number(data.anticipationRiskFactorCnp)
      : null,
    waitingPeriodCp: data.waitingPeriodCp ? Number(data.waitingPeriodCp) : null,
    waitingPeriodCnp: data.waitingPeriodCnp
      ? Number(data.waitingPeriodCnp)
      : null,
  };

  const newId = await insertConfiguration(configurationInsert);
  return newId;
}

export async function updateConfigurationFormAction(
  data: ConfigurationOperationsSchema
) {
  if (!data.id) {
    throw new Error("Cannot update configuration without an ID");
  }

  const configurationUpdate: ConfigurationDetail = {
    id: data.id,
    slug: data.slug || generateSlug(),
    active: data.active ?? true,
    lockCpAnticipationOrder: data.lockCpAnticipationOrder ?? false,
    lockCnpAnticipationOrder: data.lockCnpAnticipationOrder ?? false,
    url: data.url || "",
    dtinsert: (data.dtinsert || new Date()).toISOString(),
    dtupdate: (data.dtupdate || new Date()).toISOString(),
    anticipationRiskFactorCp: data.anticipationRiskFactorCp
      ? Number(data.anticipationRiskFactorCp)
      : null,
    anticipationRiskFactorCnp: data.anticipationRiskFactorCnp
      ? Number(data.anticipationRiskFactorCnp)
      : null,
    waitingPeriodCp: data.waitingPeriodCp ? Number(data.waitingPeriodCp) : null,
    waitingPeriodCnp: data.waitingPeriodCnp
      ? Number(data.waitingPeriodCnp)
      : null,
  };

  await updateConfiguration(configurationUpdate);
}

