// Resolves Playwright from the project or from a global install.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);

export function loadPlaywright() {
  try {
    return require("playwright");
  } catch {
    const root = execSync("npm root -g").toString().trim();
    return require(`${root}/playwright`);
  }
}
