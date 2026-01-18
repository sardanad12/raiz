
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // We use JSON.stringify to ensure the values are valid JS strings in the bundle
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || ""),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || ""),
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});
