import { copyFile, rm, stat } from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve("out");
const routes = [
  "equipment",
  "host",
  "host-guide",
  "login-callback",
  "pricing",
  "privacy",
  "terms",
  "thank-you",
];

for (const route of routes) {
  const source = path.join(outDir, `${route}.html`);
  const target = path.join(outDir, route);

  try {
    await stat(source);
  } catch {
    continue;
  }

  await rm(target, { force: true, recursive: true });
  await copyFile(source, target);
}
