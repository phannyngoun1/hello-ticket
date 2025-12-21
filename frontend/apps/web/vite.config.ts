import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { tanstackRouter } from '@tanstack/router-vite-plugin'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [
        react(),
        tanstackRouter(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@truths/ui': path.resolve(__dirname, '../../packages/ui/src'),
            '@truths/utils': path.resolve(__dirname, '../../packages/utils/src'),
            '@truths/config': path.resolve(__dirname, '../../packages/config/src'),
            '@truths/account': path.resolve(__dirname, '../../packages/account/src'),
            '@truths/api': path.resolve(__dirname, '../../packages/api/src'),
            '@truths/shared': path.resolve(__dirname, '../../packages/shared/src'),
            '@truths/custom-ui': path.resolve(__dirname, '../../packages/custom-ui/src'),
            '@truths/purchasing': path.resolve(__dirname, '../../packages/purchasing/src'),
            '@truths/warehouse': path.resolve(__dirname, '../../packages/warehouse/src'),
            '@truths/ticketing': path.resolve(__dirname, '../../packages/ticketing/src'),
        },
    },
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
            '/uploads': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
    build: {
        minify: mode === 'production' ? 'terser' : false,
        terserOptions: mode === 'production' ? {
            compress: {
                drop_console: true, // Remove console.* calls
                drop_debugger: true, // Remove debugger statements
            },
        } : undefined,
    },
}))

