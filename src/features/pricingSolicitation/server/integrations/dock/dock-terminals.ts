"use server";

import { Terminal } from "./dock-terminals-type";
import { Metadata } from "./dock-types";

type GetTerminalsResponse = {
  meta: Metadata;
  objects: Terminal[];
};

export async function getTerminals(offset: number): Promise<Terminal[]> {
  const url = new URL(
    `${process.env.DOCK_API_URL_TERMINALS}/v1/terminals?limit=1000&offset=${offset}`
  );

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${process.env.DOCK_API_KEY}`,
      },
    });
    if (!response.ok) {
      console.error("Error fetching terminals:", await response.json());
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: GetTerminalsResponse = await response.json();

    return data.objects;
  } catch (error) {
    console.error("Error fetching terminals:", error);
    return [];
  }
}
