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
        // Igual que el objetivo por defecto de Vite 3, pero con Safari 14 en
        // lugar de 13. Es el único cambio, y hace falta por una razón concreta:
        //
        // La conexión con la tablet se autentica por RSA, y la librería de ADB
        // hace esa aritmética con literales BigInt (`1n`). Safari 13 no los
        // soporta, así que esbuild abortaba la compilación con 142 errores
        // apuntando a código de la librería que nadie iba a tocar.
        //
        // Subir el listón no deja fuera a nadie de los que usan esto: las
        // estaciones corren la carcasa con Electron 22 (Chromium 108) y los
        // teléfonos van con Chrome. Safari 14 es de 2020.
        target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']
    },
    optimizeDeps: {
        // El mismo objetivo, otra vez. No es una repetición por descuido:
        // `build.target` solo manda en la compilación final, mientras que en
        // desarrollo Vite pre-empaqueta las dependencias con esbuild por su
        // cuenta y ese paso trae su propio objetivo.
        //
        // Sin esto, `npm run build` pasa pero `npm run dev` no: el
        // pre-empaquetado de @yume-chan/adb aborta con los mismos errores de
        // BigInt y la librería nunca llega al navegador.
        esbuildOptions: {
            target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']
        }
    },
    server: {
        host: '0.0.0.0',
        https: false,
        port: 5173,

        // Si el 5173 está ocupado, FALLAR en vez de escaparse al 5174.
        //
        // Por defecto Vite busca el siguiente puerto libre y lo anuncia en una
        // línea de la terminal que es facilísima de pasar por alto. El problema
        // es que jarvis_api solo autoriza `http://localhost:5173`: desde
        // cualquier otro puerto el navegador bloquea la respuesta por CORS,
        // axios se queda sin `err.response` y el formulario de inicio de sesión
        // muestra su texto de reserva —la palabra «error», a secas—, que no
        // dice nada de puertos ni de permisos.
        //
        // Y la carcasa de escritorio tampoco se entera: carga el 5173 y se
        // encuentra con que ahí no hay nadie.
        //
        // Con esto, un 5173 ocupado se ve al arrancar y se dice solo.
        strictPort: true
    }
});