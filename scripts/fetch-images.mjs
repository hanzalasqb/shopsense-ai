// Downloads the free Unsplash photos listed in scripts/images.json (skips files that already exist).
// Runs in GitHub Actions before the demo build; the photos are committed so local builds have them too.
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

const manifest = JSON.parse(readFileSync(new URL("./images.json", import.meta.url), "utf8"));
let downloaded = 0;
for (const { file, url } of manifest) {
  if (existsSync(file)) continue;
  const res = await fetch(url, { headers: { "User-Agent": "github-actions-demo-build" } });
  if (!res.ok) { console.warn(`skip ${file}: HTTP ${res.status}`); continue; }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  downloaded++;
}
console.log(`downloaded ${downloaded} images, ${manifest.length - downloaded} already present or skipped`);
