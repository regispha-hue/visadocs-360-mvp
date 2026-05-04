import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const logsDir = path.join(root, ".nexoritia", "logs");
const source = path.join(logsDir, "audit-events.jsonl");
const output = path.join(logsDir, "evidence-chain.json");

if (!fs.existsSync(source)) {
  console.error("No audit-events.jsonl found.");
  process.exit(1);
}

const lines = fs.readFileSync(source, "utf8").split("\n").filter(Boolean);
let previousHash = "";

const chain = lines.map((line, index) => {
  const hash = crypto.createHash("sha256").update(previousHash + line).digest("hex");
  previousHash = hash;
  return { index, hash };
});

fs.writeFileSync(output, JSON.stringify({ generatedAt: new Date().toISOString(), chain }, null, 2), "utf8");
console.log("Evidence chain written:", output);
