import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';


export default defineConfig({
    plugins: [
        tailwindcss(),
        react(),
        mkcert(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
    },
    server: {
        host: '0.0.0.0',
        https: false,
        port: 5173
    }
});