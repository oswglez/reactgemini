// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Asegúrate de importar 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
      // Opcionalmente, podrías añadir también para react-is:
      // 'react-is': path.resolve('./node_modules/react-is'),
    },
  },
});