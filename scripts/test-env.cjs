#!/usr/bin/env node
// ================================================================
//  test-env.cjs — single host-normalization point for API tests.
//
//  Loads apps/api/.env.test (cwd is the api package when run via pnpm),
//  then, when running inside Docker, rewrites DB/Mongo hosts from
//  localhost → the compose service names. This mirrors resolve_db_url()
//  in scripts/db-restore.sh / db-dump.sh, so there is ONE place that
//  knows "localhost ↔ container host" — no duplicate .env.docker files.
//
//  Usage (from apps/api):
//    node ../../scripts/test-env.cjs <command> [args...]
// ================================================================

const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { spawnSync } = require("node:child_process");

const ENV_FILE = resolve(process.cwd(), ".env.test");
if (!existsSync(ENV_FILE)) {
  console.error(`❌  Test env file not found: ${ENV_FILE}`);
  process.exit(1);
}

for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!match) continue;
  const value = match[2]
    .replace(/\s+#.*$/, "")
    .trim()
    .replace(/^["']|["']$/g, "");
  process.env[match[1]] = value; // override — test env wins
}

// Inside a container the .env.test localhost hosts are unreachable; rewrite
// them to the compose service names. On the host this block is skipped.
if (existsSync("/.dockerenv")) {
  for (const key of ["DATABASE_URL", "DIRECT_URL", "MONGO_URL"]) {
    const url = process.env[key];
    if (!url) continue;
    process.env[key] = url
      .replace("@localhost", "@postgres")
      .replace("@127.0.0.1", "@postgres")
      .replace("mongodb://localhost", "mongodb://mongo")
      .replace("mongodb://127.0.0.1", "mongodb://mongo");
  }
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("Usage: node scripts/test-env.cjs <command> [args...]");
  process.exit(1);
}

const result = spawnSync(command, args, {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
