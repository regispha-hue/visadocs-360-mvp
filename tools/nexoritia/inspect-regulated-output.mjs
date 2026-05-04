import fs from "node:fs";

const file = process.argv[2];

if (!file || !fs.existsSync(file)) {
  console.error("Usage: node tools/nexoritia/inspect-regulated-output.mjs <file>");
  process.exit(1);
}

const text = fs.readFileSync(file, "utf8");

const checks = [
  ["has_version", /vers[aã]o|version/i.test(text)],
  ["has_status", /draft|rascunho|revis[aã]o|aprovado|approved/i.test(text)],
  ["has_review_note", /revis/i.test(text)],
  ["has_risk_note", /risco|limita[cç][aã]o|aten[cç][aã]o/i.test(text)]
];

let failed = false;

for (const [name, pass] of checks) {
  console.log(pass ? "OK" : "FAIL", name);
  if (!pass) failed = true;
}

process.exit(failed ? 1 : 0);
