import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const BASE = '/pusula/';

function rewriteHtml(filePath) {
  let html = readFileSync(filePath, 'utf8');
  const original = html;

  html = html.replace(/(href|src)="(css\/[^"]+)"/g, (_, attr, path) => `${attr}="${BASE}${path}"`);
  html = html.replace(/(href|src)="(js\/[^"]+)"/g, (_, attr, path) => `${attr}="${BASE}${path}"`);
  html = html.replace(/(href|src)="(images\/[^"]+)"/g, (_, attr, path) => `${attr}="${BASE}${path}"`);
  html = html.replace(/(href|src)="(pages\/[^"]+)"/g, (_, attr, path) => `${attr}="${BASE}${path}"`);
  html = html.replace(/(href|src)="(\.\.\/index\.html[^"]*)"/g, (_, attr, path) => {
    const hash = path.includes('#') ? path.replace('../index.html', '') : '';
    return `${attr}="${BASE}${hash}"`;
  });
  html = html.replace(/(href|src)="(\.\.\/pages\/[^"]+)"/g, (_, attr, path) => {
    const clean = path.replace('../pages/', 'pages/');
    return `${attr}="${BASE}${clean}"`;
  });
  html = html.replace(/(href|src)="(\.\.\/js\/[^"]+)"/g, (_, attr, path) => {
    const clean = path.replace('../', '');
    return `${attr}="${BASE}${clean}"`;
  });
  html = html.replace(/(href|src)="(\.\.\/images\/[^"]+)"/g, (_, attr, path) => {
    const clean = path.replace('../', '');
    return `${attr}="${BASE}${clean}"`;
  });
  html = html.replace(/(href)="(index\.html)"/g, (_, attr) => `${attr}="${BASE}"`);

  if (html !== original) {
    writeFileSync(filePath, html);
    console.log('  rewritten:', relative(DIST, filePath));
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (entry.endsWith('.html')) {
      rewriteHtml(full);
    }
  }
}

console.log('Rewriting dist HTML paths for GitHub Pages...');
walk(DIST);
console.log('Done.');
