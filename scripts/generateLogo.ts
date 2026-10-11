import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Exact vector rendition of user-uploaded Chandboom brand logo
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 460" fill="none">
  <!-- Stylized Monogram CH -->
  <g stroke="#157347" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <!-- C shape that flows into upper connector -->
    <path d="M 230 76 H 104 C 54 76, 22 110, 22 166 V 266 C 22 322, 54 356, 104 356 H 230 C 274 356, 304 326, 304 278 V 76 C 304 38, 332 18, 368 18 C 404 18, 432 38, 432 76 V 204 H 496" />
    <!-- Inner C horizontal return loop -->
    <path d="M 230 76 C 248 76, 260 88, 260 102 C 260 116, 248 128, 230 128 H 106 C 80 128, 62 146, 62 174 V 258 C 62 286, 80 304, 106 304 H 230 C 254 304, 270 286, 270 262 V 104 C 270 66, 296 46, 330 46 C 364 46, 390 66, 390 104 V 244 H 496" />
    <!-- Right vertical pillar of H -->
    <line x1="506" y1="62" x2="506" y2="340" stroke-width="28" />
  </g>

  <!-- Wordmark 'chandboom' -->
  <text x="270" y="425" text-anchor="middle" font-family="'Cairo', 'Impact', sans-serif" font-weight="900" font-size="64" letter-spacing="-1px" fill="#157347">chandboom</text>
</svg>`;

async function generateAssets() {
  const publicDir = path.resolve(process.cwd(), 'public');
  const assetsDir = path.resolve(publicDir, 'assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  const svgBuffer = Buffer.from(svgContent);

  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgContent);
  fs.writeFileSync(path.join(assetsDir, 'logo.svg'), svgContent);

  // Generate public/logo.png
  await sharp(svgBuffer)
    .resize(512, 436, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'logo.png'));

  // Generate public/assets/logo.png
  await sharp(svgBuffer)
    .resize(512, 436, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(assetsDir, 'logo.png'));

  // Favicons
  await sharp(svgBuffer)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  await sharp(svgBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Successfully generated public/logo.png, public/assets/logo.png, and favicons!');
}

generateAssets().catch(console.error);
