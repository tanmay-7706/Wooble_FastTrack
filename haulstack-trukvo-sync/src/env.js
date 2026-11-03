// Reads .env into process.env (only what isn't set already).

import { readFileSync } from "node:fs";

export function loadEnv(path = new URL("../.env", import.meta.url)) {
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}
