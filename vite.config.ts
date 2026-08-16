import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import pkg from './package.json';

// Injects the app version into the Service Worker's cache name so every
// release automatically busts the previous cache, without editing sw.js by hand.
function serviceWorkerVersionPlugin(): Plugin {
  const templatePath = path.resolve(__dirname, 'sw-template.js');
  const render = () => fs.readFileSync(templatePath, 'utf-8').replace(/__APP_VERSION__/g, pkg.version);

  return {
    name: 'sw-version',
    apply: () => true,
    configureServer(server) {
      server.middlewares.use('/sw.js', (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.end(render());
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: render(),
      });
    },
  };
}

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), tailwindcss(), serviceWorkerVersionPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ['recharts'],
          html2canvas: ['html2canvas-pro'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand']
        }
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'recharts', 'html2canvas-pro'],
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom', 'zustand'],
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
