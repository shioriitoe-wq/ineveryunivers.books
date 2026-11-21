import sharp from "sharp";

const input = "src/assets/images/AEIL/aeil-main.png";
const output = "src/assets/images/AEIL/aeil-main-test.png";

const metadata = await sharp(input).metadata();

await sharp(input)
  .png({
    compressionLevel: 9,
    adaptiveFiltering: true,
    palette: false,
  })
  .toFile(output);

const fs = await import("node:fs/promises");
const original = (await fs.stat(input)).size;
const optimized = (await fs.stat(output)).size;

console.log(`Původní:    ${(original / 1024 / 1024).toFixed(2)} MB`);
console.log(`Optimaliz.:  ${(optimized / 1024 / 1024).toFixed(2)} MB`);
console.log(`Rozměry:     ${metadata.width} × ${metadata.height}`);
console.log(`Úspora:      ${((1 - optimized / original) * 100).toFixed(1)} %`);
console.log(`Testovací soubor: ${output}`);
