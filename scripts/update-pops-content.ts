import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface PopContent {
  objetivo?: string;
  equipeEnvolvida?: string;
  descricao?: string;
  glossario?: string;
  literaturaConsultada?: string;
  controleAlteracoes?: any;
  registroQualidade?: string;
}

async function main() {
  const jsonPath = path.join(__dirname, "pop_contents.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const popContents: Record<string, PopContent> = JSON.parse(raw);

  console.log(`Loaded ${Object.keys(popContents).length} POPs from JSON`);

  // Get tenant
  const tenant = await prisma.tenant.findFirst({
    where: { cnpj: "12345678000199" },
  });

  if (!tenant) {
    console.error("Tenant not found!");
    process.exit(1);
  }

  console.log(`Tenant: ${tenant.nome} (${tenant.id})`);

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const [code, content] of Object.entries(popContents)) {
    try {
      // Find existing POP by code
      const existing = await prisma.pop.findFirst({
        where: {
          tenantId: tenant.id,
          codigo: code,
        },
      });

      if (!existing) {
        console.log(`  NOT FOUND in DB: ${code}`);
        notFound++;
        continue;
      }

      // Prepare update data
      const updateData: any = {};

      if (content.objetivo) {
        updateData.objetivo = content.objetivo;
      }
      if (content.descricao) {
        updateData.descricao = content.descricao;
      }
      if (content.equipeEnvolvida) {
        updateData.equipeEnvolvida = content.equipeEnvolvida;
      }
      if (content.glossario) {
        updateData.glossario = content.glossario;
      }
      if (content.literaturaConsultada) {
        updateData.literaturaConsultada = content.literaturaConsultada;
      }
      if (content.controleAlteracoes && Array.isArray(content.controleAlteracoes)) {
        updateData.controleAlteracoes = content.controleAlteracoes;
      }

      await prisma.pop.update({
        where: { id: existing.id },
        data: updateData,
      });

      updated++;
      if (updated % 20 === 0) {
        console.log(`  Updated ${updated} POPs...`);
      }
    } catch (err: any) {
      console.error(`  ERROR updating ${code}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Not found in DB: ${notFound}`);
  console.log(`  Errors: ${errors}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
