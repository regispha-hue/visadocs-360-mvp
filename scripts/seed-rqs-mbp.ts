// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface DocEntry {
  codigo: string;
  titulo: string;
  tipo: string;
  categoria: string;
  popCodigo: string | null;
  conteudo: string;
}

async function main() {
  const jsonPath = path.join(__dirname, "rqs_mbp_contents.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const docs: DocEntry[] = JSON.parse(raw);

  console.log(`Loaded ${docs.length} documents from JSON`);

  // Get tenant
  const tenant = await prisma.tenant.findFirst({
    where: { cnpj: "12345678000199" },
  });

  if (!tenant) {
    console.error("Tenant not found!");
    process.exit(1);
  }

  console.log(`Tenant: ${tenant.nome} (${tenant.id})`);

  // Pre-fetch all POPs for this tenant to link RQs
  const pops = await prisma.pop.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, codigo: true },
  });
  const popMap = new Map(pops.map((p) => [p.codigo, p.id]));
  console.log(`Found ${pops.length} POPs for linking`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const doc of docs) {
    try {
      // Resolve POP link
      let popId: string | null = null;
      if (doc.popCodigo) {
        popId = popMap.get(doc.popCodigo) || null;
        if (!popId) {
          console.log(`  POP ${doc.popCodigo} not found for ${doc.codigo}`);
        }
      }

      const tipo = doc.tipo;
      const existing = await prisma.documento.findFirst({
        where: {
          tenantId: tenant.id,
          codigo: doc.codigo,
        },
      });

      if (existing) {
        await prisma.documento.update({
          where: { id: existing.id },
          data: {
            titulo: doc.titulo,
            tipo,
            categoria: doc.categoria,
            conteudo: doc.conteudo,
            popId,
          },
        });
        updated++;
      } else {
        await prisma.documento.create({
          data: {
            codigo: doc.codigo,
            titulo: doc.titulo,
            tipo,
            categoria: doc.categoria,
            conteudo: doc.conteudo,
            versao: "Rev00",
            popId,
            tenantId: tenant.id,
          },
        });
        created++;
      }

      if ((created + updated) % 20 === 0) {
        console.log(`  Processed ${created + updated} documents...`);
      }
    } catch (err: any) {
      console.error(`  ERROR ${doc.codigo}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone!`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
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




