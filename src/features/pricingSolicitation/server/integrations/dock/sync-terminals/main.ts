import { db } from "@/server/db";
import { sql } from "drizzle-orm";
import { terminals } from "../../../../../drizzle/schema";
import { getTerminals } from "../dock-terminals";
import { Terminal } from "../dock-terminals-type";

async function getTerminalTotalCount(): Promise<number> {
  try {
    const result = await db
      .select({ count: sql<number>`count(1)` })
      .from(terminals);
    return result[0].count || 0;
  } catch (error: any) {
    console.error("Erro ao obter contagem total de terminais:", error.message);
    throw error;
  }
}

async function saveToDatabaseBatch(terminalsData: Terminal[]) {
  try {
    const values = terminalsData.map((terminal) => {
      // Convertendo as datas para objetos Date e depois para ISO string
      const dtInsert = new Date(terminal.dtInsert).toISOString();
      const dtUpdate = new Date(terminal.dtUpdate).toISOString();
      const inactivationDate = terminal.inactivationDate
        ? new Date(terminal.inactivationDate).toISOString()
        : null;

      return {
        slug: terminal.slug,
        active: terminal.active,
        dtinsert: dtInsert,
        dtupdate: dtUpdate,
        slugMerchant: terminal.slugMerchant,
        type: terminal.type || null,
        status: terminal.status || null,
        serialNumber: terminal.serialNumber,
        model: terminal.model,
        manufacturer: terminal.manufacturer,
        pinpadSerialNumber: terminal.pinpadSerialNumber || null,
        pinpadFirmware: terminal.firmwareVersion || null,
        slugCustomer: terminal.slugCustomer || null,
        pverfm: terminal.pverfm || null,
        goUpdate: terminal.goUpdate || false,
        inactivationDate: inactivationDate,
        uniqueNumberForMerchant: terminal.uniqueNumberForMerchant || null,
        logicalNumber: terminal.logicalNumber,
      };
    });

    await db
      .insert(terminals)
      .values(values)
      .onConflictDoUpdate({
        target: [terminals.slug],
        set: {
          active: sql`excluded.active`,
        },
      });
    console.log(
      `Lote de ${terminalsData.length} terminais sincronizado com sucesso.`
    );
  } catch (error: any) {
    console.error("Erro ao salvar lote no banco de dados:", error.message);
    throw error;
  }
}

export async function syncTerminals() {
  try {
    console.log("Iniciando sincronização de terminais...");

    const totalCount = await getTerminalTotalCount();
    console.log(`Total de terminais no banco: ${totalCount}`);

    const terminalsData = await getTerminals(totalCount);
    console.log(`Total de terminais obtidos da API: ${terminalsData.length}`);

    if (terminalsData.length > 0) {
      await saveToDatabaseBatch(terminalsData);
      console.log("Sincronização de terminais concluída com sucesso!");
    } else {
      console.log("Nenhum terminal encontrado para sincronizar.");
    }
  } catch (error: any) {
    console.error("Erro durante a sincronização:", error.message);
    throw error;
  }
}
