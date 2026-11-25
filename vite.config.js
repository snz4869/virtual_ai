import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { agyLocalPlugin } from './server/agyBridge.js';

export default defineConfig({
  plugins: [react(), agyLocalPlugin()],
  server: {
    port: 3000,
  },
});
