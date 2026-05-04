import { spawnSync } from "node:child_process";
import fs from "node:fs";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  return result.status === 0;
}

let ok = true;

if (fs.existsSync(".nexoritia/contracts")) {
  ok = run("node", ["tools/nexoritia/validate-contracts.mjs"]) && ok;
}

if (fs.existsSync("package.json")) {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const scripts = pkg.scripts || {};
  for (const script of ["lint", "typecheck", "test", "build"]) {
    if (scripts[script]) {
      ok = run("npm", ["run", script]) && ok;
    }
  }
}

process.exit(ok ? 0 : 1);
