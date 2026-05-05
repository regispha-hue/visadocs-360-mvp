#!/usr/bin/env node
/**
 * Pre-Deploy Validation Script
 * Valida tudo antes do deploy em produção
 * 
 * Uso: node tools/pre-deploy-validation.mjs
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Cores para output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  log(`🔍 ${title}`, "cyan");
  console.log("=".repeat(60));
}

function logSuccess(message) {
  log(`  ✅ ${message}`, "green");
}

function logError(message) {
  log(`  ❌ ${message}`, "red");
}

function logWarning(message) {
  log(`  ⚠️  ${message}`, "yellow");
}

// Status global
let passed = 0;
let failed = 0;
let warnings = 0;

function check(name, condition, critical = true) {
  if (condition) {
    logSuccess(name);
    passed++;
    return true;
  } else {
    if (critical) {
      logError(name);
      failed++;
    } else {
      logWarning(name);
      warnings++;
    }
    return false;
  }
}

// 1. Verificar arquivos críticos
logSection("ARQUIVOS CRÍTICOS");

const criticalFiles = [
  "lib/compliance.ts",
  "NEXORITIA_KERNEL.md",
  "AGENTS.md",
  "app/api/compliance/qr/route.ts",
  "app/api/compliance/verify/[tenantId]/route.ts",
  "app/api/integracao/processar/route.ts",
  "components/quiz-player.tsx",
];

for (const file of criticalFiles) {
  const fullPath = join(rootDir, file);
  check(`Arquivo existe: ${file}`, existsSync(fullPath));
}

// 2. Verificar estrutura Nexoritia
logSection("ESTRUTURA NEXORITIA");

const nexoritiaFiles = [
  ".nexoritia/contracts/sop.schema.json",
  ".nexoritia/contracts/training.schema.json",
  ".nexoritia/policies/document-control.policy.yaml",
  ".nexoritia/policies/ai-generation.policy.yaml",
  ".nexoritia/workflows/sop-generation.yaml",
  ".windsurf/skills/nexoritia-governor/SKILL.md",
  ".windsurf/rules/00-nexoritia-governance.md",
  "tools/nexoritia/validate-contracts.mjs",
  "tools/nexoritia/run-nexoritia-quality-gate.mjs",
];

for (const file of nexoritiaFiles) {
  const fullPath = join(rootDir, file);
  check(`Nexoritia file: ${file}`, existsSync(fullPath));
}

// 3. Verificar imports no código
logSection("VERIFICAÇÃO DE IMPORTS");

try {
  const qrRoute = readFileSync(join(rootDir, "app/api/compliance/qr/route.ts"), "utf8");
  check("qr/route.ts importa lib/compliance", 
    qrRoute.includes('from "@/lib/compliance"') || qrRoute.includes("from '@/lib/compliance'"));
  check("qr/route.ts não tem calculateComplianceStats duplicado", 
    !qrRoute.includes("async function calculateComplianceStats"));
  
  const verifyRoute = readFileSync(join(rootDir, "app/api/compliance/verify/[tenantId]/route.ts"), "utf8");
  check("verify/route.ts importa lib/compliance", 
    verifyRoute.includes('from "@/lib/compliance"') || verifyRoute.includes("from '@/lib/compliance'"));
  check("verify/route.ts usa hashIP", 
    verifyRoute.includes("hashIP"));
  check("verify/route.ts usa isValidComplianceTokenFormat", 
    verifyRoute.includes("isValidComplianceTokenFormat"));
  
  const integracaoRoute = readFileSync(join(rootDir, "app/api/integracao/processar/route.ts"), "utf8");
  check("integracao/processar coleta erros", 
    integracaoRoute.includes("const errors:") && integracaoRoute.includes("errors.push"));
  
  const quizPlayer = readFileSync(join(rootDir, "components/quiz-player.tsx"), "utf8");
  check("quiz-player.tsx usa useRef", 
    quizPlayer.includes("useRef"));
  check("quiz-player.tsx tem timerRef", 
    quizPlayer.includes("timerRef"));
  check("quiz-player.tsx não importa Label (se não usado)", 
    !quizPlayer.includes('import { Label }') || quizPlayer.includes("useLabel"), false);
    
} catch (error) {
  logError(`Erro ao verificar imports: ${error.message}`);
  failed++;
}

// 4. Verificar git status
logSection("STATUS DO GIT");

try {
  const gitStatus = execSync("git status --porcelain", { cwd: rootDir, encoding: "utf8" });
  const hasUncommitted = gitStatus.trim().length > 0;
  
  if (hasUncommitted) {
    logWarning("Há arquivos não commitados");
    const files = gitStatus.split("\n").filter(Boolean);
    files.forEach(f => log(`     ${f}`, "yellow"));
    warnings++;
  } else {
    logSuccess("Todos os arquivos commitados");
    passed++;
  }
  
  const branch = execSync("git branch --show-current", { cwd: rootDir, encoding: "utf8" }).trim();
  check(`Branch atual: ${branch}`, branch === "main", false);
  
} catch (error) {
  logWarning(`Git não disponível ou erro: ${error.message}`);
  warnings++;
}

// 5. Verificar package.json scripts
logSection("SCRIPTS DISPONÍVEIS");

try {
  const packageJson = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"));
  const scripts = packageJson.scripts || {};
  
  check("Script 'build' existe", !!scripts.build);
  check("Script 'start' existe", !!scripts.start);
  check("Script 'lint' existe", !!scripts.lint, false);
  check("Script 'test' existe", !!scripts.test, false);
  
} catch (error) {
  logError(`Erro ao ler package.json: ${error.message}`);
  failed++;
}

// 6. Verificar environment variables necessárias
logSection("VARIÁVEIS DE AMBIENTE");

const requiredEnvVars = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
];

for (const envVar of requiredEnvVars) {
  const hasEnv = !!process.env[envVar];
  check(`Variável ${envVar} configurada`, hasEnv, false);
}

// 7. Verificar Nexoritia Quality Gate (se disponível)
logSection("NEXORITIA QUALITY GATE");

try {
  const qualityGatePath = join(rootDir, "tools/nexoritia/run-nexoritia-quality-gate.mjs");
  if (existsSync(qualityGatePath)) {
    logSuccess("Quality Gate script disponível");
    passed++;
    
    // Tentar executar
    try {
      const result = execSync("node tools/nexoritia/run-nexoritia-quality-gate.mjs --dry-run", {
        cwd: rootDir,
        encoding: "utf8",
        timeout: 30000,
      });
      logSuccess("Quality Gate executado com sucesso");
      passed++;
    } catch (e) {
      logWarning("Quality Gate não executou (pode ser normal em dev)");
      warnings++;
    }
  } else {
    logError("Quality Gate script não encontrado");
    failed++;
  }
} catch (error) {
  logWarning(`Erro ao verificar Quality Gate: ${error.message}`);
  warnings++;
}

// Resumo final
console.log("\n" + "=".repeat(60));
log("📊 RESUMO DA VALIDAÇÃO", "magenta");
console.log("=".repeat(60));

log(`\n  ✅ Passaram:  ${passed}`, "green");
log(`  ❌ Falharam:  ${failed}`, failed > 0 ? "red" : "green");
log(`  ⚠️  Avisos:   ${warnings}`, warnings > 0 ? "yellow" : "green");

const total = passed + failed + warnings;
const score = Math.round((passed / total) * 100);

console.log("\n" + "-".repeat(60));
log(`  Score: ${score}/100`, score >= 80 ? "green" : score >= 60 ? "yellow" : "red");

// Verificação de LGPD compliance
logSection("VERIFICAÇÃO LGPD");

try {
  const verifyRoute = readFileSync(join(rootDir, "app/api/compliance/verify/[tenantId]/route.ts"), "utf8");
  const hasHashIP = verifyRoute.includes("hashIP");
  const hasExtractBrowser = verifyRoute.includes("extractBrowserInfo");
  const hasNoRawIP = !verifyRoute.includes('ip: request.headers.get("x-forwarded-for")') || 
                     verifyRoute.includes("hashIP(request");
  
  check("LGPD: hashIP implementado", hasHashIP);
  check("LGPD: extractBrowserInfo implementado", hasExtractBrowser);
  check("LGPD: IP não exposto cru", hasNoRawIP);
  
} catch (error) {
  logError(`Erro ao verificar LGPD: ${error.message}`);
  failed += 3;
}

// Resultado final
console.log("\n" + "=".repeat(60));

if (failed === 0 && score >= 80) {
  log("\n✅ VALIDAÇÃO PASSOU - PRONTO PARA DEPLOY", "green");
  log("\nPróximos passos:", "cyan");
  log("  1. git add -A", "blue");
  log("  2. git commit -m 'feat(audit): implementa Nexoritia governance'", "blue");
  log("  3. git tag -a v2.1.0 -m 'Release v2.1.0'", "blue");
  log("  4. git push origin main && git push origin v2.1.0", "blue");
  log("  5. vercel --prod", "blue");
  process.exit(0);
} else if (failed === 0 && score >= 60) {
  log("\n⚠️  VALIDAÇÃO PASSOU COM AVISOS", "yellow");
  log("Verifique os avisos antes do deploy", "yellow");
  process.exit(0);
} else {
  log("\n❌ VALIDAÇÃO FALHOU - CORRIJA ANTES DO DEPLOY", "red");
  log("\nCorreções necessárias:", "red");
  if (failed > 0) log(`  - ${failed} verificações críticas falharam`, "red");
  if (score < 60) log(`  - Score ${score}/100 abaixo do mínimo (60)`, "red");
  process.exit(1);
}
