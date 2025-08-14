import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);



export default defineConfig({
    plugins: [
        react(),
        mkcert(),

    ],
    server: {
        host: '0.0.0.0',
        https: true,
        port: 5173
    }
});