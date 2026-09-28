import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import { createRequire } from 'module';
import path from 'path';


const require = createRequire(import.meta.url);



export default defineConfig({
    plugins: [
        react(),
        mkcert(),

    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
    },
    build: {
        target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']
    },
    optimizeDeps: {
     
        esbuildOptions: {
            target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']
        }
    },
    server: {
        host: '0.0.0.0',
        https: true,
        port: 5173,

     
        strictPort: true
    }
});