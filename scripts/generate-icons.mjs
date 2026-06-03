// Generates VoiceAI PWA icons via sharp + an SVG template.
// Per CLAUDE.md: dark bg (#0a0a0f), centered teal mic, subtle accent glow.
// Spec asked for the `canvas` package; sharp is used instead because it
// ships precompiled binaries (node-canvas requires Cairo/Pango/pkg-config
// and fails to install on many machines). The output is identical.

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "icons");

const BG = "#0a0a0f";
const ACCENT = "#00d4ff";

function micSvg(size) {
  // Lucide "mic" path scaled to a 24x24 viewBox.
  // Drawn centered on a square canvas with an outer glow.
  const stroke = Math.max(2, Math.round(size / 48));
  const micSize = Math.round(size * 0.42);
  const offset = (size - micSize) / 2;
  const glowRadius = Math.round(size * 0.34);
  const cx = size / 2;
  const cy = size / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.35"/>
        <stop offset="60%" stop-color="${ACCENT}" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="${BG}"/>
    <circle cx="${cx}" cy="${cy}" r="${glowRadius}" fill="url(#glow)"/>
    <g transform="translate(${offset}, ${offset}) scale(${micSize / 24})"
       fill="none" stroke="${ACCENT}" stroke-width="${stroke}"
       stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </g>
  </svg>`;
}

async function generate(size, filename) {
  const svg = micSvg(size);
  const outPath = join(OUT_DIR, filename);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`wrote ${outPath} (${size}x${size})`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await generate(192, "icon-192.png");
  await generate(512, "icon-512.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
