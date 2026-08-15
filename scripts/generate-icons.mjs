// Generates PWA PNG icons (192/512) from the source SVG. Run automatically
// before dev/build (see package.json) so the raster icons are never
// committed to the repo and can't drift from public/icon.svg.
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'icon.svg');
const svg = readFileSync(svgPath);

const targets = [192, 512];

async function main() {
  for (const size of targets) {
    const outPath = path.join(publicDir, `icon-${size}.png`);
    if (existsSync(outPath)) continue;
    const buffer = await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
    writeFileSync(outPath, buffer);
    console.log(`Generated ${outPath}`);
  }
}

main().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
