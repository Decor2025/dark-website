import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  ssr: {
    noExternal: ['yet-another-react-lightbox']
  },

  optimizeDeps: {
    exclude: ['lucide-react']
  }
});
