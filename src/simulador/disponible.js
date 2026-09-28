/*  ─────────────────────────────────────────────────────────────────────────────
 *  ¿ESTÁ DISPONIBLE LA SIMULACIÓN DE TOAST?
 *
 *  SIEMPRE, también en la aplicación publicada. Antes era solo en desarrollo, y se
 *  cambió a petición: el simulador sirve para probar la lectura de tickets SIN una
 *  tablet enchufada, y eso hace falta precisamente donde no siempre hay una — al montar
 *  un local nuevo, al revisar un servidor de IA, o para enseñar cómo funciona.
 *
 *  LO QUE CUESTA, para que quede dicho:
 *
 *  · El simulador entero entra ahora en el paquete. No lo engorda al cargar la página
 *    porque se trae con import() dinámico y Vite lo deja en un trozo aparte: solo se
 *    descarga si alguien pulsa «Simular». Sin pulsarlo, no se pide.
 *
 *  · El botón «Simular» queda a la vista del monitorista. Sale solo con la tablet SIN
 *    conectar, y lo que conecta se distingue de un vistazo: punto y texto en violeta en
 *    la barra, un color que la ventana no usa para nada más.
 *
 *  · Y lo importante: con una simulación en marcha NO se guarda nada en el registro de
 *    las parrillas ni se reporta ninguna demora a Jarvis. Los pedidos inventados se ven
 *    en la pantalla y no salen de ahí. Eso está en VentanaTablet.jsx, en
 *    'guardarRegistro' y en 'reportarDemora'.
 *  ───────────────────────────────────────────────────────────────────────────── */
export const SIMULACION_DISPONIBLE = true;


//  El valor de '?view=' con el que main.jsx monta la app del simulador en lugar de Jarvis.
export const VISTA_SIMULADOR = 'toast-sim';


//  La dirección de esa app, para abrirla en una ventana aparte.
export function direccionDelSimulador() {
    return `${window.location.origin}${window.location.pathname}?view=${VISTA_SIMULADOR}`;
}
