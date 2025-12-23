import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '../src');
const DIST = path.join(__dirname, '../dist');

// Simple minifier for CSS
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    .trim();
}

// Simple minifier for JavaScript
function minifyJS(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,=()[\]<>+\-*/%&|^!])\s*/g, '$1')
    .trim();
}

// Create dist directory
if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST, { recursive: true });
}

// Copy index.html
let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');

// Inline CSS
const css = fs.readFileSync(path.join(SRC, 'css', 'main.css'), 'utf8');
const minifiedCSS = minifyCSS(css);
html = html.replace(
  '<link rel="stylesheet" href="css/main.css" />',
  `<style>${minifiedCSS}</style>`
);

// Inline JavaScript
const js = fs.readFileSync(path.join(SRC, 'js', 'app.js'), 'utf8');
const minifiedJS = minifyJS(js);
html = html.replace(
  '<script src="js/app.js"><\/script>',
  `<script>${minifiedJS}<\/script>`
);

// Minify HTML
html = html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/>\s+</g, '><')
  .replace(/\s{2,}/g, ' ');

fs.writeFileSync(path.join(DIST, 'index.html'), html);
console.log(`✓ Built index.html (${html.length} bytes)`);

// Copy manifest
fs.copyFileSync(path.join(SRC, 'manifest.webmanifest'), path.join(DIST, 'manifest.webmanifest'));
console.log('✓ Copied manifest.webmanifest');

// Copy service worker
const sw = fs.readFileSync(path.join(SRC, 'sw.js'), 'utf8');
const minifiedSW = minifyJS(sw);
fs.writeFileSync(path.join(DIST, 'sw.js'), minifiedSW);
console.log(`✓ Built sw.js (${minifiedSW.length} bytes)`);

// Copy icons
const iconsDir = path.join(SRC, 'icons');
const distIconsDir = path.join(DIST, 'icons');
if (!fs.existsSync(distIconsDir)) {
  fs.mkdirSync(distIconsDir, { recursive: true });
}
if (fs.existsSync(iconsDir)) {
  fs.readdirSync(iconsDir).forEach(file => {
    fs.copyFileSync(
      path.join(iconsDir, file),
      path.join(distIconsDir, file)
    );
  });
  console.log('✓ Copied icons');
}

// Create README
const readme = `# AURA 3.6.0 - Production Build

Generated: ${new Date().toISOString()}

## Files
- index.html (single-file app with inlined CSS/JS)
- manifest.webmanifest
- sw.js (service worker)
- icons/

## Installation
1. Upload to web server
2. HTTPS recommended (required for PWA features)

## iOS Installation
1. Open in Safari
2. Tap Share → Add to Home Screen

## Android Installation
1. Open in Chrome
2. Tap menu → Install app (or 'Add to Home Screen')

## Performance Notes
- Single-file HTML reduces HTTP requests
- Service worker enables offline functionality
- All data is stored locally - no server tracking
- AES-GCM encryption available for sensitive data with PIN
`;

fs.writeFileSync(path.join(DIST, 'README.md'), readme);
console.log('✓ Created README.md');

const distSize = fs.readdirSync(DIST, { recursive: true })
  .filter(f => !fs.statSync(path.join(DIST, f)).isDirectory())
  .reduce((sum, f) => sum + fs.statSync(path.join(DIST, f)).size, 0);

console.log(`\n✅ Build complete! (${(distSize / 1024).toFixed(2)} KB total)`);
