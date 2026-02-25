import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import svgr from 'vite-plugin-svgr'
import dotenv from 'dotenv'
dotenv.config()

export default defineConfig(({ mode }) => {
    const IS_ELECTRON = mode === 'electron' || process.env.PLATFORM === 'electron'

    console.log('Vite mode:', mode, 'PLATFORM:', process.env.PLATFORM)

    return {
        plugins: [svgr(), react()],
        base: './', // Required for Electron file:// protocol
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
    }
})
