import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const logsDir = path.join(root, ".nexoritia", "logs");
fs.mkdirSync(logsDir, { recursive: true });

const action = process.argv[2] || "unspecified-action";
const target = process.argv[3] || "unspecified-target";

const event = {
  id: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  actor: process.env.USER || process.env.USERNAME || "unknown",
  action,
  target,
  status: "recorded",
  metadata: {}
};

fs.appendFileSync(path.join(logsDir, "audit-events.jsonl"), JSON.stringify(event) + "\n", "utf8");
console.log("Audit event recorded:", event.id);
