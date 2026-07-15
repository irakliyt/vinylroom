import { copyFile, mkdir, stat } from "node:fs/promises";
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
  const targetDir = path.join(outDir, route);
  const target = path.join(targetDir, "index.html");

  try {
    await stat(source);
  } catch {
    continue;
  }

  await mkdir(targetDir, { recursive: true });
  await copyFile(source, target);
}
