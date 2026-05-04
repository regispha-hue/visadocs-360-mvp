import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractsDir = path.join(root, ".nexoritia", "contracts");

if (!fs.existsSync(contractsDir)) {
  console.error("Contracts directory not found.");
  process.exit(1);
}

let ok = true;

for (const file of fs.readdirSync(contractsDir)) {
  if (!file.endsWith(".json")) continue;
  const full = path.join(contractsDir, file);
  try {
    JSON.parse(fs.readFileSync(full, "utf8"));
    console.log("OK:", file);
  } catch (error) {
    ok = false;
    console.error("Invalid JSON:", file, error.message);
  }
}

process.exit(ok ? 0 : 1);
