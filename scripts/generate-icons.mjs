/**
 * Generates PWA and favicon images from the SVG sources in assets/.
 * Run with `npm run icons` after changing the artwork; outputs are committed.
 */
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const any = await readFile(join(root, "assets/icon.svg"));
const maskable = await readFile(join(root, "assets/icon-maskable.svg"));

const outputs = [
  { src: any, size: 192, out: "public/icons/icon-192.png" },
  { src: any, size: 512, out: "public/icons/icon-512.png" },
  { src: maskable, size: 512, out: "public/icons/icon-maskable-512.png" },
  // iOS ignores transparency and applies its own corner mask: use full-bleed art.
  { src: maskable, size: 180, out: "app/apple-icon.png" },
];

for (const { src, size, out } of outputs) {
  const target = join(root, out);
  await mkdir(dirname(target), { recursive: true });
  await sharp(src, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toFile(target);
  console.log(`✓ ${out} (${size}×${size})`);
}

// Modern browsers use the SVG favicon directly.
await copyFile(join(root, "assets/icon.svg"), join(root, "app/icon.svg"));
console.log("✓ app/icon.svg");
