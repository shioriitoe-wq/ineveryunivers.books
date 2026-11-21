import sharp from "sharp";
import fs from "node:fs/promises";

const files = [
  "src/assets/images/Nezacalo-to/characterall.png",
  "src/assets/images/AEIL/aeil-character-motto.png",
];

for (const input of files) {
  const temp = `${input}.optimized.png`;

  const metadata = await sharp(input).metadata();

  await sharp(input)
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: false,
    })
    .toFile(temp);

  const originalSize = (await fs.stat(input)).size;
  const optimizedSize = (await fs.stat(temp)).size;

  const saving = (1 - optimizedSize / originalSize) * 100;

  if (optimizedSize < originalSize) {
    await fs.rename(temp, input);

    console.log(
      `✓ ${input}\n` +
      `  ${(originalSize / 1024 / 1024).toFixed(2)} MB → ` +
      `${(optimizedSize / 1024 / 1024).toFixed(2)} MB ` +
      `(${saving.toFixed(1)} % úspora)\n` +
      `  ${metadata.width} × ${metadata.height}`
    );
  } else {
    await fs.unlink(temp);

    console.log(
      `– ${input}\n` +
      `  bez změny – optimalizace nepřinesla úsporu`
    );
  }
}
