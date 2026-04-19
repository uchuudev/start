import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

import { handleApiRequest } from './server/middleware';

const dashboardApiPlugin = (): Plugin => ({
  name: 'start-dashboard-api',
  configureServer(server) {
    server.middlewares.use('/api', (request, response) => {
      void handleApiRequest(request, response);
    });
  }
});

const loadProcessEnv = (mode: string): void => {
  const env = loadEnv(mode, process.cwd(), '');

  for (const [key, value] of Object.entries(env)) {
    process.env[key] ??= value;
  }
};

export default defineConfig(({ mode }) => {
  loadProcessEnv(mode);

  return {
    plugins: [react(), tailwindcss(), dashboardApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src')
      }
    }
  };
});
