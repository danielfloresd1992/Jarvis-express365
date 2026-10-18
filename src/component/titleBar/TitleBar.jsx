import WindowControls from './WindowControls.jsx';

// ══════════════════════════════════════════════════════════════════════
// BARRA DE TÍTULO
// ══════════════════════════════════════════════════════════════════════
// La carcasa de escritorio crea la ventana con `frame: false`, o sea sin la
// barra que pone Windows. Eso no es un descuido: una barra propia se pinta con
// los colores de la aplicación en vez del gris del sistema.
//
// Pero quitarla se lleva por delante todo lo que esa barra hacía. Sin este
// componente la ventana no se puede mover, ni minimizar, ni maximizar, ni
// cerrar: queda clavada donde Electron la abrió.
//
//
// CÓMO SE ARRASTRA UNA VENTANA SIN MARCO
//
// Con `WebkitAppRegion: 'drag'`. Es una propiedad de Chromium, no del estándar,
// y le dice al sistema "esta zona es la barra de título": arrastrando aquí se
// mueve la ventana entera.
//
// El precio es que dentro de una zona arrastrable NINGÚN elemento responde al
// clic — el sistema se queda el gesto antes de que llegue a la página. Por eso
// los botones llevan `no-drag`: sin eso, minimizar, maximizar y cerrar dejarían
// de funcionar sin dar ninguna pista de por qué.
//
//
// AQUÍ ESTABA EL CONSUMO DE CPU Y MEMORIA, Y YA NO
//
// En el centro de la barra iban dos lecturas en vivo —«CPU 21 %» y «RAM 49 %
// (11.8/23.9 GB)»— con un punto que se ponía rojo al pasar del 80 %. Se quitaron
// a petición del usuario: la aplicación no hacía nada con ese dato, solo lo
// enseñaba.
//
// Lo que se fue con ellas: el estado `stats`, la suscripción a `onSystemStats`
// —que llegaba UNA VEZ POR SEGUNDO— y el umbral del aviso.
//
// OJO, QUEDA LA MITAD DE FUERA. Quien calcula y envía esas medidas es la carcasa
// de Electron, que vive en el Escritorio y no en este repositorio. Esto deja de
// ESCUCHARLAS, pero la carcasa las sigue midiendo y emitiendo cada segundo
// contra nadie. Para quitarlo del todo hay que tocar también su `main.js`.
//
//
// FUERA DE ELECTRON NO SE PINTA
//
// En un navegador no hay ventana del sistema que controlar, y `window.electronAPI`
// no existe. Se devuelve `null` en vez de una barra con tres botones muertos.
//
//
// EN HOME SE FUNDE CON LA BARRA DE NAVEGACIÓN (pedido del usuario)
//
// Allí la barra de navegación (NavBar) es a la vez la de la ventana: se arrastra
// y lleva las tres teclas (WindowControls). Mientras está montada pone la marca
// `has-app-bar` en el <html>, y con ella esta barra se oculta y su alto deja de
// contar (index.css). En las demás pantallas —el inicio de sesión, por ejemplo—
// no hay barra de navegación y esta sigue siendo la única que mueve y cierra la
// ventana.

const DRAG = { WebkitAppRegion: 'drag' };


//  El nombre por defecto es el que la gente ya conoce en las estaciones. Solo
//  se ve dentro de la aplicación de escritorio —en el navegador esta barra no
//  se pinta—, así que cambiarlo no toca la marca de la web, que sigue siendo
//  JarvisExpress en su propia cabecera.
export default function TitleBar({ appName = 'Reportes de alertas' }) {

    const api = typeof window !== 'undefined' ? window.electronAPI : null;

    if (!api?.isElectron) return null;


    return (
        <div
            style={DRAG}
            className='window-title-bar fixed top-0 left-0 w-full h-8 z-[999999] flex items-center justify-between select-none bg-jx-panel border-b border-jx-regla2 pl-3'
        >

            {/*  IZQUIERDA: ícono y nombre  */}
            <div className='flex items-center gap-2 min-w-0'>
                <img src='/logo1.PNG' alt='' className='w-[18px] h-[18px] object-contain brightness-[0.22]' draggable={false} />
                <span className='text-[12px] font-semibold tracking-[0.4px] text-jx-tinta truncate'>{appName}</span>
            </div>


            {/*  DERECHA: minimizar, maximizar y cerrar (WindowControls, que lleva el `no-drag`)  */}
            <WindowControls className='window-controls--title-bar' />

        </div>
    );
}
