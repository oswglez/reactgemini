// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { getEnvironmentConfig } from './src/config/env.config';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envConfig = getEnvironmentConfig(mode);
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        react: path.resolve('./node_modules/react'),
        'react-dom': path.resolve('./node_modules/react-dom'),
      },
    },
    define: {
      // Inject environment variables
      'import.meta.env': JSON.stringify(envConfig)
    },
    server: {
      port: 5173,
      open: true,
      cors: true,
    },
  }
});