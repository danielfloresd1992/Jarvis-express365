/*  ─────────────────────────────────────────────────────────────────────────────
 *  EL REGISTRO DE LA INFERENCIA: UN CUADERNO DONDE SE APUNTA CADA PASO DE UNA LECTURA
 *
 *  Leer una tira de la pantalla son varios pasos —capturarla, preguntar al servidor de IA
 *  qué modelo tiene, mandarle la imagen, recibir su respuesta, sacar de ella los
 *  tickets— y cualquiera puede fallar. Desde fuera solo se veía el final: una parrilla
 *  que se llena o no. Este cuaderno apunta cada paso para poder verlos uno a uno en el
 *  panel lateral de la ventana de la tablet (PanelDeInferencia.jsx).
 *
 *  SOLO EXISTE EN DESARROLLO. Con la aplicación publicada el cuaderno está cerrado:
 *  'apuntar' no guarda nada y el panel ni siquiera se carga.
 *
 *  CÓMO ESTÁ HECHO. Es un almacén mínimo con el patrón de siempre: una lista, una forma
 *  de añadirle cosas y una forma de enterarse de que ha cambiado ('suscribir'). React lo
 *  lee con 'useSyncExternalStore', que pide exactamente esas dos piezas. La lista NO se
 *  modifica nunca: cada apunte crea una lista nueva. Así React sabe que hay algo nuevo
 *  con solo comparar si la lista es la misma de antes.
 *  ───────────────────────────────────────────────────────────────────────────── */


/*  ¿Está abierto el cuaderno?
 *
 *  Se mira MODE y no DEV a propósito: 'npm run dev' arranca con NODE_ENV=production, y
 *  con eso Vite pone DEV en false aunque se esté desarrollando. MODE sí dice la verdad.
 *  El '?.' es para poder importar este archivo desde Node, en las pruebas, donde
 *  'import.meta.env' no existe.
 */
export const REGISTRO_ACTIVO = import.meta.env?.MODE === 'development';


/*  Las clases de apunte. Cada una es un paso distinto de la lectura, y el panel le da
 *  un color. Van en un objeto congelado para escribir 'TIPO.ENVIO' en vez de la palabra
 *  suelta: un nombre mal escrito falla al momento en lugar de pintarse sin color.
 */
export const TIPO = Object.freeze({
    TABLET: 'tablet',            //  se conecta o se desconecta la tablet (o la simulada)
    TIRA: 'tira',                //  empieza la lectura de una tira de la pantalla
    SERVIDOR: 'servidor',        //  se habla con el servidor de IA para saber qué modelo tiene
    ENVIO: 'envio',              //  sale la imagen hacia el modelo
    RESPUESTA: 'respuesta',      //  vuelve lo que contestó el modelo, tal cual
    RESULTADO: 'resultado',      //  los tickets que se sacaron de esa respuesta
    FALLO: 'fallo',              //  algo salió mal, con su motivo
});


//  Cuántos apuntes se guardan como mucho. La ventana pasa horas abierta leyendo una tira
//  cada pocos segundos: sin tope, el cuaderno crecería hasta comerse la memoria.
const MAXIMO_DE_APUNTES = 500;




/**
 * Fabrica un cuaderno nuevo.
 *
 * Es una función y no un objeto suelto para poder crear cuadernos de prueba, abiertos
 * y con el tope que convenga, sin tocar el de verdad.
 *
 * @param {object}  [opciones]
 * @param {boolean} [opciones.activo=true]  cerrado, 'apuntar' no guarda nada
 * @param {number}  [opciones.maximo]       cuántos apuntes conserva; los más viejos se sueltan
 */
export function crearRegistro({ activo = true, maximo = MAXIMO_DE_APUNTES } = {}) {

    let apuntes = [];               //  la lista; se SUSTITUYE por otra en cada cambio
    let idSiguiente = 1;            //  un número único por apunte: es su 'key' en React
    let lecturaSiguiente = 1;       //  un número por lectura, para agrupar sus apuntes

    const oyentes = new Set();      //  las funciones a las que hay que avisar de un cambio


    //  Cambia la lista y avisa a todos los que estén mirando.
    const publicar = (nuevos) => {
        apuntes = nuevos;
        for (const avisar of oyentes) avisar();
    };


    /**
     * Añade un apunte al cuaderno.
     *
     * @param {string} tipo      uno de TIPO
     * @param {string} titulo    la frase que se lee de un vistazo
     * @param {object} [detalle] los datos del paso; el panel los enseña al desplegar
     * @param {number} [lectura] a qué lectura pertenece (lo pone 'abrirLectura')
     */
    function apuntar(tipo, titulo, detalle = null, lectura = null) {
        if (!activo) return;

        const apunte = { id: idSiguiente++, hora: new Date(), tipo, titulo, detalle, lectura };

        //  '.slice(-maximo)' se queda con los últimos: los más viejos se caen por delante.
        publicar([...apuntes, apunte].slice(-maximo));
    }


    /**
     * Empieza una lectura y devuelve una función para apuntar SUS pasos.
     *
     * Todos los apuntes hechos con esa función llevan el mismo número de lectura, y así
     * el panel puede decir «esto es de la lectura 12» aunque se crucen con otros.
     *
     * @returns {(tipo: string, titulo: string, detalle?: object) => void}
     */
    function abrirLectura() {
        const numero = lecturaSiguiente++;

        return (tipo, titulo, detalle = null) => apuntar(tipo, titulo, detalle, numero);
    }


    /**
     * Se apunta para enterarse de los cambios. Devuelve la función que da de baja.
     * Es la forma exacta que pide 'useSyncExternalStore'.
     */
    function suscribir(avisar) {
        oyentes.add(avisar);
        return () => oyentes.delete(avisar);
    }


    //  La lista tal como está ahora. Mientras no cambie, es siempre la MISMA lista.
    const leer = () => apuntes;

    //  Tira todos los apuntes. La numeración sigue: dos lecturas no repiten número.
    const vaciar = () => publicar([]);


    return { apuntar, abrirLectura, suscribir, leer, vaciar };
}




//  EL cuaderno de la aplicación: uno solo, compartido por quien apunta (TabletScreen) y
//  por quien lee (el panel). Fuera de desarrollo nace cerrado.
export const registroDeInferencia = crearRegistro({ activo: REGISTRO_ACTIVO });




/**
 * La hora de un apunte, con milésimas: 'HH:MM:SS.mmm'.
 *
 * Las milésimas importan aquí: entre preguntar por el modelo y mandar la imagen pasan
 * unas pocas, y sin ellas dos pasos seguidos parecerían simultáneos.
 *
 * @param {Date} fecha
 */
export function horaDelApunte(fecha) {
    const dos = (n) => String(n).padStart(2, '0');

    return `${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:${dos(fecha.getSeconds())}.${String(fecha.getMilliseconds()).padStart(3, '0')}`;
}


/**
 * Todos los apuntes como texto plano, para copiarlos y pegarlos en un mensaje o un
 * archivo. Una línea por apunte y, debajo, su detalle sangrado.
 *
 * @param {Array} apuntes  lo que devuelve 'leer'
 */
export function apuntesComoTexto(apuntes) {
    return apuntes.map((apunte) => {
        const cabecera = `${horaDelApunte(apunte.hora)}  [${apunte.tipo}]${apunte.lectura ? ` #${apunte.lectura}` : ''}  ${apunte.titulo}`;

        if (!apunte.detalle) return cabecera;

        const detalle = JSON.stringify(apunte.detalle, null, 2).split('\n').map(linea => `    ${linea}`).join('\n');

        return `${cabecera}\n${detalle}`;
    }).join('\n');
}
