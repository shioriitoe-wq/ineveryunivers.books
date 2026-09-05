import { readdir, writeFile, mkdir } from "node:fs/promises";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL("..", import.meta.url));
const charactersRoot = join(frontendRoot, "public", "characters");
const manifestPath = join(charactersRoot, "manifest.json");

const allowed = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".avif",
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
]);

async function collect(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "manifest.json") {
      continue;
    }

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collect(fullPath)));
    } else if (allowed.has(extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

await mkdir(charactersRoot, { recursive: true });

const files = await collect(charactersRoot);

const manifest = files
  .map((file) =>
    relative(charactersRoot, file).replaceAll("\\", "/")
  )
  .sort((a, b) => a.localeCompare(b, "cs"));

await writeFile(
  manifestPath,
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8"
);

console.log(`Character manifest: ${manifest.length} files`);