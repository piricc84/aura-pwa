import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '../src');

console.log('🧪 AURA PWA Test Suite v3.6.0\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
  }
}

// Test 1: Check files exist
test('HTML file exists', () => {
  const file = path.join(SRC, 'index.html');
  if (!fs.existsSync(file)) throw new Error('index.html not found');
});

test('CSS file exists', () => {
  const file = path.join(SRC, 'css', 'main.css');
  if (!fs.existsSync(file)) throw new Error('main.css not found');
});

test('JavaScript file exists', () => {
  const file = path.join(SRC, 'js', 'app.js');
  if (!fs.existsSync(file)) throw new Error('app.js not found');
});

test('Service Worker exists', () => {
  const file = path.join(SRC, 'sw.js');
  if (!fs.existsSync(file)) throw new Error('sw.js not found');
});

test('Manifest exists', () => {
  const file = path.join(SRC, 'manifest.webmanifest');
  if (!fs.existsSync(file)) throw new Error('manifest not found');
});

// Test 2: Check HTML validity
test('HTML has proper DOCTYPE', () => {
  const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  if (!html.startsWith('<!DOCTYPE html>')) throw new Error('Missing DOCTYPE');
});

test('HTML has meta charset', () => {
  const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  if (!html.includes('charset=utf-8')) throw new Error('Missing charset meta');
});

test('HTML has viewport meta', () => {
  const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  if (!html.includes('viewport')) throw new Error('Missing viewport meta');
});

test('HTML has lang attribute', () => {
  const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  if (!html.includes('lang="it"')) throw new Error('Missing lang attribute');
});

test('HTML references manifest', () => {
  const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  if (!html.includes('manifest')) throw new Error('Missing manifest reference');
});

// Test 3: Check manifest validity
test('Manifest is valid JSON', () => {
  const manifest = fs.readFileSync(path.join(SRC, 'manifest.webmanifest'), 'utf8');
  JSON.parse(manifest);
});

test('Manifest has required fields', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.webmanifest'), 'utf8'));
  if (!manifest.name) throw new Error('Missing name');
  if (!manifest.display) throw new Error('Missing display');
  if (!manifest.icons || !Array.isArray(manifest.icons)) throw new Error('Missing icons');
  if (!manifest.start_url) throw new Error('Missing start_url');
});

// Test 4: Check CSS syntax
test('CSS has valid color scheme', () => {
  const css = fs.readFileSync(path.join(SRC, 'css', 'main.css'), 'utf8');
  const colorPattern = /--\w+:\s*[#a-z0-9(),.\s]+;/g;
  const colors = css.match(colorPattern) || [];
  if (colors.length === 0) throw new Error('No color variables found');
});

test('CSS has animations defined', () => {
  const css = fs.readFileSync(path.join(SRC, 'css', 'main.css'), 'utf8');
  if (!css.includes('@keyframes')) throw new Error('No animations found');
});

// Test 5: Check JavaScript syntax
test('JavaScript has valid IIFE', () => {
  const js = fs.readFileSync(path.join(SRC, 'js', 'app.js'), 'utf8');
  if (!js.includes('(()') || !js.includes('})()'  )) throw new Error('Invalid IIFE pattern');
});

test('JavaScript uses strict mode', () => {
  const js = fs.readFileSync(path.join(SRC, 'js', 'app.js'), 'utf8');
  if (!js.includes("'use strict'")) throw new Error('Missing strict mode');
});

test('JavaScript has crypto functions', () => {
  const js = fs.readFileSync(path.join(SRC, 'js', 'app.js'), 'utf8');
  if (!js.includes('crypto.subtle')) throw new Error('Missing crypto implementation');
});

test('JavaScript has audio support', () => {
  const js = fs.readFileSync(path.join(SRC, 'js', 'app.js'), 'utf8');
  if (!js.includes('AudioContext') && !js.includes('webkitAudioContext')) throw new Error('Missing audio support');
});

// Test 6: Check Service Worker
test('Service Worker has install listener', () => {
  const sw = fs.readFileSync(path.join(SRC, 'sw.js'), 'utf8');
  if (!sw.includes("addEventListener('install'")) throw new Error('Missing install listener');
});

test('Service Worker has activate listener', () => {
  const sw = fs.readFileSync(path.join(SRC, 'sw.js'), 'utf8');
  if (!sw.includes("addEventListener('activate'")) throw new Error('Missing activate listener');
});

test('Service Worker has fetch listener', () => {
  const sw = fs.readFileSync(path.join(SRC, 'sw.js'), 'utf8');
  if (!sw.includes("addEventListener('fetch'")) throw new Error('Missing fetch listener');
});

// Test 7: Performance checks
test('CSS file size reasonable', () => {
  const css = fs.readFileSync(path.join(SRC, 'css', 'main.css'), 'utf8');
  const size = css.length / 1024;
  if (size > 200) throw new Error(`CSS too large: ${size.toFixed(1)}KB`);
});

test('JavaScript file size reasonable', () => {
  const js = fs.readFileSync(path.join(SRC, 'js', 'app.js'), 'utf8');
  const size = js.length / 1024;
  if (size > 500) throw new Error(`JS too large: ${size.toFixed(1)}KB`);
});

// Test 8: Accessibility checks
test('HTML has semantic structure', () => {
  const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  if (!html.includes('<main')) throw new Error('Missing main element');
  if (!html.includes('<section') && !html.includes('role=')) throw new Error('Missing semantic structure');
});

test('HTML uses aria labels', () => {
  const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  if (!html.includes('aria-')) throw new Error('Missing ARIA labels');
});

// Print summary
console.log(`\n${passed > 0 ? '✅' : '❌'} Tests: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.log('⚠️  Some tests failed. Review the errors above.');
  process.exit(1);
} else {
  console.log('🎉 All tests passed! Ready for production.');
  process.exit(0);
}
