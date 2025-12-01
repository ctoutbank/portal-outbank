"use server";

import { Merchant } from "./dock-merchants-type";
import { Metadata } from "./dock-types";

type GetMerchantsResponse = {
  meta: Metadata;
  objects: Merchant[];
};

export async function getMerchants(): Promise<Merchant[]> {
  const url = new URL(`${process.env.DOCK_API_URL_MERCHANTS}/v1/merchants`);
  url.searchParams.set("limit", "50");
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${process.env.DOCK_API_KEY}`,
    },
  });
  const data: GetMerchantsResponse = await response.json();
  return data.objects;
}
