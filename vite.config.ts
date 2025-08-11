import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
  rollupOptions: {
      external: ['yet-another-react-lightbox']
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
