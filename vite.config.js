import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api calls are proxied to the backend in dev, so no CORS setup is needed
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, proxy: { '/api': 'http://localhost:3001' } },
});
