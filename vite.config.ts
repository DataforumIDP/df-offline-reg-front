import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import svgr from 'vite-plugin-svgr'

const IS_ELECTRON = process.env.VITE_PLATFORM === 'electron'

export default defineConfig({
    plugins: [svgr(), react()],
    base: IS_ELECTRON ? './' : undefined, // Required for Electron file:// protocol
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@store': path.resolve(__dirname, './src/store'),
            '@services': path.resolve(__dirname, './src/services'),
            '@hooks': path.resolve(__dirname, './src/hooks'),
            '@types': path.resolve(__dirname, './src/types'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@styles': path.resolve(__dirname, './src/styles'),
        },
    },
    server: {
        port: 3000,
        open: !IS_ELECTRON, // Don't open browser in dev (Electron opens)
    },

    build: IS_ELECTRON
        ? {
              outDir: 'dist',
              emptyOutDir: true,
          }
        : undefined,
})
