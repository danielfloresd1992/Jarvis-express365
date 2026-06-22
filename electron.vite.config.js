import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { DEV_PORT } from './electron/config.js';


export default defineConfig({

    //  PROCESO PRINCIPAL (Node)
    main: {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: 'out/main',
            lib: { entry: 'electron/main/index.js' },
        },
    },

    //  PRELOAD (puente seguro)
    //  Forzamos CommonJS .js para que coincida con la ruta del main y cargue
    //  con el sandbox activo (un preload .mjs/ESM exigiría sandbox: false).
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: 'out/preload',
            lib: {
                entry: 'electron/preload/index.js',
                formats: ['cjs'],
            },
            rollupOptions: {
                output: { entryFileNames: 'index.js' },
            },
        },
    },

    //  RENDERER = jarvis-express (tu app React de siempre)
    renderer: {
        root: '.',
        plugins: [
            tailwindcss(),
            react(),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
            },
            extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
        server: {
            port: DEV_PORT,        //  puerto fijo en desarrollo
            strictPort: true,      //  si está ocupado, falla (no cambia de puerto)
        },
        build: {
            outDir: 'out/renderer',
            rollupOptions: {
                input: path.resolve(__dirname, 'index.html'),
            },
        },
    },
});