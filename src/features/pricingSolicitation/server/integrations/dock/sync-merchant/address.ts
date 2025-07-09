"use server";
import { db } from "@/server/db";
import { and, eq } from "drizzle-orm";
import { addresses } from "../../../../../drizzle/schema";
import { Address } from "./types";

async function updateAddress(address: Address, existingId: number) {
  try {
    await db
      .update(addresses)
      .set({
        streetAddress: address.streetAddress,
        streetNumber: address.streetNumber,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
      })
      .where(eq(addresses.id, existingId));

    console.log(`Address with ID ${existingId} updated successfully.`);
    return existingId;
  } catch (error) {
    console.error(`Error updating address with ID ${existingId}:`, error);
    return null;
  }
}

export async function getAddressId(address: Address): Promise<number | null> {
  try {
    // Verificando se o endereço já existe pelos campos principais
    const existing = await db
      .select()
      .from(addresses)
      .where(
        and(
          eq(addresses.streetAddress, address.streetAddress || ""),
          eq(addresses.streetNumber, address.streetNumber || ""),
          eq(addresses.city, address.city || ""),
          eq(addresses.state, address.state || "")
        )
      );

    if (existing.length > 0) {
      // Atualiza o endereço existente e retorna o ID
      const updatedId = await updateAddress(address, existing[0].id as number);
      return updatedId;
    } else {
      const insertedId = await insertAddress(address);
      return insertedId;
    }
  } catch (error) {
    console.error("Erro ao verificar existência do endereço:", error);
    return null;
  }
}

export async function insertAddress(address: Address): Promise<number | null> {
  try {
    const result = await db
      .insert(addresses)
      .values(address)
      .returning({ id: addresses.id });

    const id = result[0].id as number;
    console.log("Endereço inserido com sucesso:", id);
    return id;
  } catch (error) {
    console.error("Erro ao inserir endereço:", error);
    return null;
  }
}
