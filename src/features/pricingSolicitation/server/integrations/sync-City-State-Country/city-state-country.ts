"use server";

import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { state, city } from "../../../../drizzle/schema";

type Region = {
  id: number;
  sigla: string;
  nome: string;
};

type UF = {
  id: number;
  sigla: string;
  nome: string;
  regiao: Region;
};

type Mesorregiao = {
  id: number;
  nome: string;
  UF: UF;
};

type Microrregiao = {
  id: number;
  nome: string;
  mesorregiao: Mesorregiao;
};

type RegiaoIntermediaria = {
  id: number;
  nome: string;
  UF: UF;
};

type RegiaoImediata = {
  id: number;
  nome: string;
  "regiao-intermediaria": RegiaoIntermediaria;
};

type City = {
  id: number;
  nome: string;
  microrregiao: Microrregiao;
  "regiao-imediata": RegiaoImediata;
};

interface SimplifiedCity {
  code: string;
  name: string;
}


async function fetchCitiesByState(stateCode: string): Promise<SimplifiedCity[]> {
  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?UF=${stateCode}`
  );

  if (!response.ok) {
    throw new Error(`Falha ao buscar dados: ${response.statusText}`);
  }

  const data: City[] = await response.json();

  console.log("data", data);

  console.log("aqui",data[0]["regiao-imediata"]["regiao-intermediaria"].UF.sigla)
  
  return data.map((cityData: City) => ({
    code: cityData["regiao-imediata"]["regiao-intermediaria"].UF.sigla,
    name: cityData.nome


  }));
  
}


async function insertCityAndRelations(citiesToInsert: SimplifiedCity[]) {
  try {
    for (const cityData of citiesToInsert) {
      const existingCity = await db
        .select()
        .from(city)
        .where(eq(city.name, cityData.name))
        ;

      if (existingCity.length > 0) {
        await db
          .update(city)
          .set({
            code: cityData.code,
            name: cityData.name,
          })
          .where(eq(city.name, cityData.name));
      } else {
        await db.insert(city).values({
          code: cityData.code,
          name: cityData.name,
        });
      }
    }
  } catch (error) {
    console.error("Erro ao inserir cidades:", error);
    throw error;
  }
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export async function main() {
  try {
    console.log("Iniciando sincronização de cidades...");

    // Limpa a tabela antes de inserir novos dados
    await db.execute(
      "TRUNCATE TABLE city;"
    );

    // Busca todos os estados usando Drizzle
    const allstate = await db.select({
      code: state.code
    }).from(state);

    let allcity: SimplifiedCity[] = [];

    // Busca as cidades para cada estado
    for (const state of allstate) {
      console.log(`Buscando cidades do estado: ${state.code}`);
      const cityFromState = await fetchCitiesByState(state.code);
      allcity = [...allcity, ...cityFromState];
    }

    // Divide em chunks de 1000 para inserção
    const chunkedcity = chunkArray(allcity, 1000);
    
    // Insere cada chunk no banco de dados
    for (const chunk of chunkedcity) {
      await insertCityAndRelations(chunk);
    }

    console.log("Sincronização de cidades concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao sincronizar cidades:", error);
  }
} 