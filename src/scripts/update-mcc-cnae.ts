import { db } from "@/lib/db";
import { categories } from "../../drizzle/schema";
import { eq, isNull, or } from "drizzle-orm";
import mccCnaeMapping from "./mcc-cnae-mapping.json";

async function updateMccCnae() {
  console.log("Iniciando atualização de CNAEs na tabela categories...");
  
  const allCategories = await db
    .select({
      id: categories.id,
      mcc: categories.mcc,
      name: categories.name,
      cnae: categories.cnae,
    })
    .from(categories)
    .where(or(isNull(categories.cnae), eq(categories.cnae, "")));

  console.log(`Encontrados ${allCategories.length} MCCs sem CNAE`);
  
  let updated = 0;
  let notFound = 0;
  const notFoundMccs: string[] = [];

  for (const category of allCategories) {
    if (!category.mcc) continue;
    
    const mccCode = category.mcc.replace(/^0+/, "");
    const mapping = (mccCnaeMapping as Record<string, { cnae: string; description: string }>)[mccCode];
    
    if (mapping) {
      await db
        .update(categories)
        .set({ cnae: mapping.cnae })
        .where(eq(categories.id, category.id));
      
      console.log(`✓ MCC ${category.mcc} → CNAE ${mapping.cnae}`);
      updated++;
    } else {
      notFoundMccs.push(category.mcc);
      notFound++;
    }
  }

  console.log("\n=== Resumo ===");
  console.log(`Total processados: ${allCategories.length}`);
  console.log(`Atualizados: ${updated}`);
  console.log(`Sem mapeamento: ${notFound}`);
  
  if (notFoundMccs.length > 0) {
    console.log("\nMCCs sem mapeamento:");
    console.log(notFoundMccs.join(", "));
  }
}

updateMccCnae()
  .then(() => {
    console.log("\nAtualização concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro:", error);
    process.exit(1);
  });
