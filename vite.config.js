// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    https: false,
    cors: true,
    watch: {
      usePolling: true
    },
    allowedHosts: 'all',
  }
});