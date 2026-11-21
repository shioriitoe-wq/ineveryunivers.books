import sharp from "sharp";
import fs from "node:fs/promises";

const files = [
  "src/assets/images/Nezacalo-to/texture.png",
  "src/assets/images/Nezacalo-to/characterall.png",
  "src/assets/images/AEIL/aeil-character-motto.png",
];

for (const input of files) {
  const temp = `${input}.test.png`;
  const metadata = await sharp(input).metadata();

  await sharp(input)
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: false,
    })
    .toFile(temp);

  const original = (await fs.stat(input)).size;
  const optimized = (await fs.stat(temp)).size;

  console.log(
    `${input}\n` +
    `  ${(original / 1024 / 1024).toFixed(2)} MB → ` +
    `${(optimized / 1024 / 1024).toFixed(2)} MB ` +
    `(${((1 - optimized / original) * 100).toFixed(1)} % úspora)\n` +
    `  ${metadata.width} × ${metadata.height}\n`
  );
}
