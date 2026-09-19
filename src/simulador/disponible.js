/*  ─────────────────────────────────────────────────────────────────────────────
 *  ¿ESTÁ DISPONIBLE LA SIMULACIÓN DE TOAST?
 *
 *  Solo mientras se desarrolla. El simulador es una herramienta para probar la lectura
 *  de tickets sin tener una tablet enchufada; en la aplicación publicada no pinta nada,
 *  y un botón «Simular» a la vista de un monitorista solo puede dar disgustos.
 *
 *  SE MIRA 'MODE' Y NO 'DEV', y no es un descuido. El script 'npm run dev' de este
 *  proyecto arranca Vite con NODE_ENV=production, y con eso 'import.meta.env.DEV' vale
 *  false AUNQUE se esté desarrollando. 'MODE' no depende de NODE_ENV: vale
 *  'development' con 'vite' y 'production' con 'vite build', que es justo la
 *  distinción que hace falta.
 *
 *  Como Vite sustituye este valor al compilar, en la versión publicada todo lo que
 *  cuelga de esta constante es código muerto y el empaquetador lo elimina: el
 *  simulador entero —que además se carga con import() dinámico— no llega al paquete.
 *  ───────────────────────────────────────────────────────────────────────────── */
export const SIMULACION_DISPONIBLE = import.meta.env.MODE === 'development';


//  El valor de '?view=' con el que main.jsx monta la app del simulador en lugar de Jarvis.
export const VISTA_SIMULADOR = 'toast-sim';


//  La dirección de esa app, para abrirla en una ventana aparte.
export function direccionDelSimulador() {
    return `${window.location.origin}${window.location.pathname}?view=${VISTA_SIMULADOR}`;
}
