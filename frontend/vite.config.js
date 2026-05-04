import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/cats': 'http://localhost:4000',
      '/recommendations': 'http://localhost:4000',
      '/admin': 'http://localhost:4000',
      '/health': 'http://localhost:4000',
    },
  },
});
