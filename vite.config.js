import { defineConfig } from 'vite';
import { resolve } from 'path';
import { globSync } from 'glob';

// Kök dizindeki HTML dosyalarını bul
const rootHtmlFiles = globSync('*.html').reduce((entries, file) => {
  const name = file.replace('.html', '');
  entries[name] = resolve(__dirname, file);
  return entries;
}, {});

// Pages klasöründeki HTML dosyalarını bul
const pagesHtmlFiles = globSync('pages/*.html').reduce((entries, file) => {
  const name = 'pages/' + file.replace('.html', '').replace('pages/', '');
  entries[name] = resolve(__dirname, file);
  return entries;
}, {});

// Tüm HTML dosyalarını birleştir
const allHtmlFiles = { ...rootHtmlFiles, ...pagesHtmlFiles };

export default defineConfig({
  base: '/pusula/',
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: allHtmlFiles
    }
  },
  server: {
    port: 5173,
    open: '/index.html'
  }
});
