#!/usr/bin/env node
/**
 * Build pipeline for chandboom.ir (Vite + React + TypeScript SPA).
 *
 * 1. Replaces %VITE_*% placeholders in index.html from the environment
 *    (loaded from .env / process.env) — this is what injects the GA4
 *    Measurement ID without hardcoding it in any source file.
 * 2. Assembles dist/ with the published pre-bundled app artifact
 *    (public/assets/index-*.js|css), static site files and fonts.
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Load .env into process.env (simple KEY=VALUE parser, no dependencies)
const envFile = resolve(root, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    }
  }
}

rmSync(resolve(root, 'dist'), { recursive: true, force: true });
mkdirSync(resolve(root, 'dist/assets'), { recursive: true });

// 1. Inject %VITE_*% placeholders into index.html
let html = readFileSync(resolve(root, 'index.html'), 'utf8');
html = html.replace(/%([A-Z0-9_]+)%/g, (whole, key) => {
  const value = process.env[key];
  if (value === undefined) {
    console.warn(`[build] WARNING: %${key}% has no value in environment; leaving placeholder.`);
    return whole;
  }
  return value;
});
writeFileSync(resolve(root, 'dist/index.html'), html);

// 2. Copy static site files from repo root
for (const f of ['CNAME', '404.html', 'favicon.ico', 'favicon.png', 'logo.png', 'logo.svg', 'manifest.json', 'robots.txt', 'sitemap.xml']) {
  const src = resolve(root, f);
  if (existsSync(src)) cpSync(src, resolve(root, 'dist', f));
}

// 3. Copy public/ (pre-bundled app assets + fonts)
if (existsSync(resolve(root, 'public'))) {
  cpSync(resolve(root, 'public'), resolve(root, 'dist'), { recursive: true });
}

console.log('[build] dist assembled successfully.');
