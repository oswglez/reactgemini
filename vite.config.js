// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { getEnvironmentConfig } from './src/config/env.config';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envConfig = getEnvironmentConfig(mode);
  const backendUrl = envConfig.VITE_HOTEL_API_BASE_URL;
  const ngrokHost = '9d8b-2800-a4-1554-3a00-69b8-88cc-c6e5-bd0d.ngrok-free.app';

  const isNgrok = mode === 'ngrok';
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        react: path.resolve('./node_modules/react'),
        'react-dom': path.resolve('./node_modules/react-dom'),
      },
    },
    define: {
      'import.meta.env': JSON.stringify(envConfig)
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      https: false,
      cors: true,
      hmr: {
        host: ngrokHost,
        protocol: 'wss',
        clientPort: 443
      },
      watch: {
        usePolling: true
      },
      allowedHosts: 'all',
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
          xfwd: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // Configurar headers para el proxy
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
              
              if (isNgrok) {
                proxyReq.setHeader('x-forwarded-proto', 'https');
                proxyReq.setHeader('x-forwarded-host', ngrokHost);
              }
            });
            
            proxy.on('proxyRes', (proxyRes) => {
              // Configurar CORS headers
              proxyRes.headers['access-control-allow-origin'] = '*';
              proxyRes.headers['access-control-allow-methods'] = 'GET,PUT,POST,DELETE,OPTIONS,PATCH';
              proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-Requested-With';
              proxyRes.headers['access-control-allow-credentials'] = 'true';
              
              // Eliminar headers restrictivos
              delete proxyRes.headers['x-frame-options'];
              delete proxyRes.headers['content-security-policy'];
            });
            
            proxy.on('error', (err) => {
              console.error('Proxy error:', err);
            });
          }
        }
      }
    }
  }
});