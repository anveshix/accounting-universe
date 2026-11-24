import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    fs: { allow: ['../..'] },
    // Allow the Arena preview host (required for LIVE PREVIEW)
    // Vite 6 uses `allowedHosts` as array; earlier uses boolean — support both
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...( { allowedHosts: true } as any ),
  },
  build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 1000 },
});
