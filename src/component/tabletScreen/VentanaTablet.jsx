import { useState, useEffect, useRef, useMemo } from 'react';
import { TabletScreen } from './TabletScreen.jsx';
import { Parrilla } from './Parrilla.jsx';
import { ParrillaProcesos } from './ParrillaProcesos.jsx';
import { useSeguimientoTickets } from '../../hook/useSeguimientoTickets.jsx';
import { limiteDeAtencion, limiteDeLimpieza } from '../../libs/limites/limitesDelLocal.js';
import { SIMULACION_DISPONIBLE } from '../../simulador/disponible.js';




/*  LA VENTANA FLOTANTE, PARTIDA EN DOS
 *
 *  Arriba el espejo de la tablet, abajo la parrilla, y un divisor que se arrastra
 *  para repartir el espacio entre las dos.
 *
 *  Lo importante de tenerlas juntas: los tickets que lee la IA viajan de arriba
 *  abajo como estado de React dentro del mismo árbol. No cruzan de ventana, no pasan
 *  por IPC, no se serializan. Un eslabón menos que se pueda romper — y funciona igual
 *  dentro de un navegador, donde no hay puente de Electron que valga.
 */




const CLAVE_DIVISION = 'tablet:division';

const DIVISION_MIN = 25;        //  % mínimo para el panel de arriba
const DIVISION_MAX = 80;        //  % máximo
const DIVISION_INICIAL = 55;

//  Mínimos en píxeles, pero acotados en porcentaje: la carcasa instalada abre hoy la
//  flotante a 400×300, y 160 + 7 + 140 no caben ahí. Sin el tope, la parrilla se
//  recortaba y el divisor no se podía mover.
const ALTO_MIN_ESPEJO = 'min(160px, 45%)';
const ALTO_MIN_PARRILLA = 'min(140px, 35%)';


/*  DE DÓNDE SALE EL LOCAL
 *
 *  Esta ventana no monta Redux —montarlo abriría una segunda sesión y un segundo
 *  socket contra el servidor—, así que el local se lee de donde la ventana principal
 *  lo deja al elegirlo. Funciona porque las dos cargan el mismo origen en la misma
 *  sesión, y comparten almacenamiento.
 *
 *  Con el NOMBRE basta: de él se deducen los límites de tiempo de la parrilla.
 *  (Los formularios de novedades conservan su propia regla, escrita dentro de cada uno.
 *  Unificarla con esta función está pendiente de aprobación.)
 */
const CLAVE_LOCAL = 'local_appExpress';


function leerLocal() {
    try { return JSON.parse(localStorage.getItem(CLAVE_LOCAL))?.[0] ?? null; }
    catch { return null; }
}


/*  Saca el nombre de la mesa de la clave de una fila.
 *
 *      'mesa-28'             → '28'
 *      'mesa-Take Out·c1·1'  → 'Take Out'
 *
 *  Lo de la cola '·c1·1' es el desempate que se le pone a los pedidos que no son de
 *  mesa, para que dos «Take Out» a la vez no se pisen. Aquí sobra: lo que se quiere es
 *  el nombre que se enseña.
 *
 *  ⚠  Y ahí está su punto flojo: esa cola depende del ORDEN en que se leyeron, así que
 *     entre una vuelta y otra el mismo «Take Out» puede cambiar de clave. Lo anotado
 *     en uno podría acabar viéndose en otro. Con mesas numeradas no pasa.
 */
function mesaDeLaClave(clave) {
    return String(clave)
        .replace(/^mesa-/, '')
        .replace(/·c\d+·\d+$/, '');
}


function leerDivision() {
    try {
        const guardada = Number(localStorage.getItem(CLAVE_DIVISION));
        if (Number.isFinite(guardada) && guardada >= DIVISION_MIN && guardada <= DIVISION_MAX) return guardada;
    }
    catch { /* sin acceso al almacenamiento: se usa el valor por defecto */ }

    return DIVISION_INICIAL;
}




/*  @param {boolean}  enPanel          true cuando esto vive dentro de un panel de la
 *                                     página en vez de en una ventana del sistema.
 *  @param {function} onCerrar         solo fuera de Electron: allí la ✕ la resuelve
 *                                     el sistema.
 *  @param {function} onArrastrarBarra ídem para mover el panel.
 *  @param {function} onReportarDemora qué hacer cuando se pide reportar una demora.
 *  @param {string}   nombreLocal      opcional. Si no viene, TabletScreen resuelve el
 *                                     local por su cuenta desde 'local_appExpress'.
 *  @param {string}   limiteAtencion   opcional. Si no viene, se deduce del nombre del
 *                                     local con limiteDeAtencion().
 */
export function VentanaTablet({ enPanel = false, onCerrar, onArrastrarBarra, onReportarDemora, nombreLocal, limiteAtencion }) {


    //  Los tickets viven AQUÍ, en el padre común: TabletScreen los escribe y las dos
    //  parrillas los leen.
    const [tickets, setTickets] = useState([]);

    //  La hora que marcaba la tablet en la última lectura. Con ella se calcula cuánto
    //  lleva vivo cada pedido — tiene que ser SU reloj, no el del equipo.
    const [horaTablet, setHoraTablet] = useState('');

    //  Qué tira de la pantalla produjo la lista de 'tickets'. El seguimiento la necesita
    //  para saber quién puede echar en falta a cada pedido. null = no hubo lectura (el
    //  arranque, o una desconexión): ahí el seguimiento no cuenta nada.
    const [tiraLeida, setTiraLeida] = useState(null);

    //  Qué parrilla se está mirando: la de mesas o la de pedidos.
    const [pestana, setPestana] = useState('rotacion');

    //  Cómo fue la última lectura: cuántos objetos trajo, cuántos se descartaron por no
    //  ser tickets y si falló. Se pinta junto a las pestañas — ver la barra de estado.
    const [lectura, setLectura] = useState(null);


    /*  EL LOCAL EN CURSO
     *
     *  Va arriba del todo porque de él cuelgan los límites de tiempo y la carta de
     *  platos, y las dos parrillas los necesitan.
     *
     *  El evento 'storage' avisa a las OTRAS ventanas del mismo origen cuando una
     *  escribe. Es justo lo que hace falta: si alguien cambia de local en la ventana
     *  principal con la flotante abierta, aquí se entera sin preguntar nada.
     */
    const [local, setLocal] = useState(leerLocal);

    useEffect(() => {
        const alCambiar = (evento) => { if (evento.key === CLAVE_LOCAL) setLocal(leerLocal()); };
        window.addEventListener('storage', alCambiar);
        return () => window.removeEventListener('storage', alCambiar);
    }, []);


    /*  LOS PEDIDOS, CON SUS TIEMPOS
     *
     *  La misma lectura, vista de otra manera. La parrilla de rotación mira MESAS; esta
     *  sigue cada PEDIDO por separado: calcula su toma de orden y sella 'Listo en
     *  tablet' cuando lo ve ponerse verde o desaparecer de la pantalla.
     *
     *  Se reinicia al cambiar de local, y saca el tipo de plato de la carta del local.
     */
    const { pedidos, censando, lecturasDelCenso, lecturasQueDuraElCenso, yaEstaban } =
        useSeguimientoTickets(tickets, horaTablet, local?._id, local?.dishes, tiraLeida);


    /*  ¿LO QUE SE ESTÁ LEYENDO ES UNA TABLET DE MENTIRA?
     *
     *  Lo dice cada entrega de TabletScreen. Con una simulación en marcha las parrillas
     *  se llenan de mesas que no existen, y hay una acción que desde aquí SALE hacia
     *  Jarvis: reportar una demora. Esa se bloquea más abajo.
     */
    const simulando = Boolean(lectura?.simulacion);


    /*  EN SIMULACIÓN, LO INFERIDO SE LE CUENTA AL SIMULADOR
     *
     *  Él sabe a qué hora entró y se despachó cada tarjeta de verdad, y pone las dos
     *  cosas lado a lado. Es una difusión a un canal que nadie más escucha; fuera de
     *  desarrollo la constante es false y este efecto no hace nada.
     */
    useEffect(() => {
        if (!SIMULACION_DISPONIBLE || !simulando) return;

        import('../../simulador/adbSimulado.js')
            .then(({ publicarInferencia }) => publicarInferencia({ pedidos, lectura, censando, yaEstaban: [...yaEstaban] }))
            .catch(() => { /* la comparación es una ayuda, no algo que pueda romper la ventana */ });
    }, [pedidos, lectura, censando, simulando, yaEstaban]);


    /*  LO QUE SE ANOTA A MANO NO SE PIERDE
     *
     *  Antes, cada fila guardaba sus horas en su propio estado. Suena razonable hasta
     *  que se piensa en qué las hace desaparecer: una mesa que termina su pedido sale
     *  de la lectura, React desmonta su fila, y con ella se van las horas que alguien
     *  acababa de anotar. Sin aviso y sin forma de recuperarlas.
     *
     *  Ahora las horas viven aquí, en un Map por clave de fila, y las filas solo las
     *  muestran. Da igual cuántas veces se monten y se desmonten.
     *
     *  Es una ref y no estado porque se escribe en cada tecla: convertirlo en estado
     *  redibujaría la parrilla entera con cada pulsación. Para que la vista sí se
     *  entere, se acompaña de un contador que cambia cuando algo se escribe.
     */
    const anotacionesRef = useRef(new Map());
    const [versionAnotaciones, forzarPintado] = useState(0);

    const leerAnotacion = (clave) => anotacionesRef.current.get(clave);

    const anotar = (clave, campo, valor) => {
        const actual = anotacionesRef.current.get(clave) ?? {};
        anotacionesRef.current.set(clave, { ...actual, [campo]: valor });
        forzarPintado(n => n + 1);
    };


    /*  Y LAS FILAS CON ANOTACIONES TAMPOCO DESAPARECEN
     *
     *  Un ticket que sale de la pantalla de la tablet deja de llegar en la lectura.
     *  Si esa fila tenía algo escrito, se queda igualmente: lo anotado pesa más que la
     *  ausencia del ticket.
     *
     *  Se le quita el ticket —ya no hay tiempo que enseñar, ni rojo que mirar— pero
     *  conserva su mesa y su clave, así que sigue siendo la misma fila.
     */
    const ticketsVisibles = useMemo(() => {
        const presentes = new Set(tickets.map(t => `mesa-${t.mesa}`));

        const huerfanas = [];

        for (const [clave, datos] of anotacionesRef.current) {

            /*  LAS FILAS LIBRES NO SON TICKETS AUSENTES
             *
             *  Y esto no es un detalle: una anotación guardada bajo 'libre-5' JAMÁS
             *  está en 'presentes' —ahí solo hay claves 'mesa-'—, así que se volvía
             *  huérfana para siempre. La parrilla la volvía a prefijar como
             *  'mesa-libre-5' y dibujaba una SEGUNDA fila que, al buscar sus datos con
             *  esa clave nueva, no encontraba nada.
             *
             *  Resultado: escribías una mesa en una fila libre y aparecía dos veces,
             *  una con lo escrito y otra en blanco.
             *
             *  Las filas libres ya se dibujan siempre por su cuenta; aquí no pintan nada.
             *
             *  Y LO MISMO VALE PARA LO ANOTADO EN LA OTRA PARRILLA. Las dos comparten este
             *  almacén, y las claves de Procesos ('pedido-tk-149') tampoco están nunca en
             *  'presentes': cada hora marcada allí hacía aparecer aquí una fila fantasma
             *  llamada «pedido-tk-149». Solo las claves 'mesa-' son filas de esta tabla.
             */
            if (!clave.startsWith('mesa-')) continue;

            if (presentes.has(clave)) continue;
            if (!Object.values(datos).some(v => v)) continue;   //  sin nada escrito, no vale la pena

            /*  LA MESA TIENE QUE SALIR DE ALGÚN SITIO
             *
             *  'datos.mesa' solo existe si alguien la escribió a mano, y lo normal es
             *  justo lo contrario: la mesa la pone la IA y el operador solo sella las
             *  horas. Así que en el caso habitual quedaba vacía, y la parrilla descarta
             *  las filas sin mesa — la fila desaparecía con sus horas dentro.
             *
             *  Cuando falta, se saca de la propia clave, que siempre la lleva.
             */
            huerfanas.push({
                mesa: datos.mesa || mesaDeLaClave(clave),
                clave: clave.replace(/^mesa-/, ''),
                ausente: true,
            });
        }

        return [...tickets, ...huerfanas];

        //  La dependencia es el contador de escrituras, NO el tamaño del Map: corregir
        //  un campo de una anotación que ya existía no cambia el tamaño, y la lista se
        //  quedaba obsoleta.
    }, [tickets, versionAnotaciones]);

    const [division, setDivision] = useState(leerDivision);
    const [dividiendo, setDividiendo] = useState(false);
    const contenedorRef = useRef(null);


    //  Los límites de ESTA parrilla salen del nombre del local. Los formularios de
    //  novedades conservan su propia regla, escrita dentro de cada uno; unificarlas con
    //  limitesDelLocal.js está pendiente de aprobación.
    //
    //  Quien nos monte puede pasarlos ya resueltos, y entonces mandan los suyos.
    const nombre = nombreLocal ?? local?.name ?? '';

    const limite = limiteAtencion ?? limiteDeAtencion(nombre);
    const limpieza = limiteDeLimpieza(nombre);


    //  Se guarda al SOLTAR, nunca durante el arrastre: mover el divisor dispara
    //  decenas de eventos por segundo y escribir en cada uno no aporta nada.
    useEffect(() => {
        if (dividiendo) return;
        try { localStorage.setItem(CLAVE_DIVISION, String(division)); }
        catch { /* es una comodidad, no un dato crítico */ }
    }, [division, dividiendo]);


    //  Los oyentes van en 'window' y no en el divisor: si estuvieran en el divisor, al
    //  mover rápido el ratón se saldría de esa franja de 7 px y el arrastre se cortaría.
    useEffect(() => {
        if (!dividiendo) return;

        const mover = (evento) => {
            const caja = contenedorRef.current?.getBoundingClientRect();
            if (!caja || caja.height === 0) return;

            const porcentaje = ((evento.clientY - caja.top) / caja.height) * 100;
            setDivision(Math.min(DIVISION_MAX, Math.max(DIVISION_MIN, porcentaje)));
        };

        const soltar = () => setDividiendo(false);

        window.addEventListener('mousemove', mover);
        window.addEventListener('mouseup', soltar);

        return () => {
            window.removeEventListener('mousemove', mover);
            window.removeEventListener('mouseup', soltar);
        };
    }, [dividiendo]);


    /*  Fuera de Electron no hay puente, así que el reporte lo resuelve quien nos
     *  envuelve. Dentro, se le pide a la ventana principal, que es la que tiene la
     *  sesión y el catálogo para abrir el formulario.
     *
     *  Devuelve false cuando no hay por dónde mandarlo —la carcasa instalada todavía no
     *  expone 'reportarDemora'— para que la fila lo diga en vez de quedarse callada.
     */
    const reportarAJarvis = onReportarDemora ?? ((datos) => {
        if (!window.electronAPI?.reportarDemora) return false;
        window.electronAPI.reportarDemora(datos);
        return true;
    });

    //  De una simulación no se reporta nada: abriría en Jarvis un formulario de verdad,
    //  con una mesa y unas horas inventadas, a un clic de enviarse. Se devuelve el
    //  motivo como texto y la fila lo enseña.
    const reportarDemora = (datos) => (simulando ? 'Es una simulación: no se reporta' : reportarAJarvis(datos));




    return (
        /*  'fixed' se mide contra la ventana y le da igual lo que hagan sus padres.
         *  Es lo que hace falta aquí: la cadena html → body → #root no siempre tiene
         *  un alto real, y un alto en porcentaje sobre un padre sin alto colapsa.
         *
         *  Dentro de un panel de la página tiene que ser 'absolute', o taparía la
         *  página entera en vez de quedarse dentro del panel.
         */
        <div
            ref={contenedorRef}
            className={`${enPanel ? 'absolute' : 'fixed'} inset-0 flex flex-col overflow-hidden bg-[#01122c] ${dividiendo ? 'select-none cursor-row-resize' : ''}`}
        >

            {/*  ARRIBA — el espejo de la tablet  */}
            <div
                className='w-full flex flex-col overflow-hidden'
                style={{ height: `${division}%`, minHeight: ALTO_MIN_ESPEJO }}
            >
                <TabletScreen
                    onTickets={(lista, hora, diagnostico) => {
                        //  DESCONEXIÓN: la parrilla de mesas se vacía, pero al seguimiento
                        //  se le dice que NO hubo lectura (tira null). Una lista vacía a
                        //  secas la tomaría por una pantalla sin tickets y daría todos los
                        //  pedidos abiertos por despachados, con la hora del desenchufe.
                        if (diagnostico?.desconexion) {
                            setTickets([]);
                            setTiraLeida(null);
                            setLectura(null);
                            return;
                        }

                        if (diagnostico) setLectura(diagnostico);

                        //  Una vuelta fallida manda null: el diagnóstico sí se guarda —es justo
                        //  cuando hace falta— pero NADA MÁS se toca. Ni los tickets, que
                        //  vaciarlos por un error de red borraría la parrilla por un tropiezo;
                        //  ni la hora, que al cambiar sola volvía a disparar el seguimiento
                        //  sobre la lista vieja como si fuera una lectura nueva.
                        if (!Array.isArray(lista)) return;

                        //  Los tres juntos: React los aplica en el mismo pintado, así que el
                        //  seguimiento recibe la lista, su hora y su tira de una sola vez.
                        setTickets(lista);
                        setTiraLeida(diagnostico?.tira ?? null);
                        if (hora) setHoraTablet(hora);
                    }}
                    onCerrar={onCerrar}
                    onArrastrarBarra={onArrastrarBarra}
                    nombreLocal={nombre}
                />
            </div>


            {/*  EL DIVISOR
                 'no-drag' porque dentro de una zona arrastrable de Electron el ratón
                 mueve la ventana en lugar de accionar lo que hay debajo. Aquí no cae
                 dentro de la barra de título, pero queda a salvo si alguien la mueve.  */}
            <div
                onMouseDown={(evento) => {
                    if (evento.button !== 0) return;   //  solo el botón izquierdo
                    evento.preventDefault();
                    setDividiendo(true);
                }}
                className='group h-[7px] w-full shrink-0 flex items-center justify-center cursor-row-resize bg-[#021a38] border-y border-[#0a3a66]'
                style={{ WebkitAppRegion: 'no-drag' }}
                title='Arrastra para repartir el espacio entre la tablet y la parrilla'
            >
                <span className='h-[3px] w-12 rounded-full bg-[#0a3a66] group-hover:bg-[#0890c0] transition-colors' />
            </div>


            {/*  ABAJO — las parrillas
                 Dos tablas de siete columnas no caben lado a lado en esta ventana, así
                 que se turnan. Las dos se quedan montadas y la que no toca se oculta:
                 desmontarla perdería el desplazamiento y lo anotado a mano en ella.  */}
            <div
                className='w-full flex-1 min-h-0 flex flex-col overflow-hidden'
                style={{ minHeight: ALTO_MIN_PARRILLA }}
            >

                <div className='shrink-0 flex items-center gap-1 px-1 pt-1 bg-[#021a38]' style={{ WebkitAppRegion: 'no-drag' }}>
                    {
                        [
                            { id: 'rotacion', texto: 'Rotación' },
                            { id: 'procesos', texto: 'Procesos' },
                        ].map(({ id, texto }) => (
                            <button
                                key={id}
                                type='button'
                                onClick={() => setPestana(id)}
                                className={`rounded-t-md border-b-2 font-semibold uppercase tracking-[0.5px] transition-colors ${pestana === id
                                    ? 'border-[#0890c0] bg-[#01122c] text-[#aecbf0]'
                                    : 'border-transparent bg-transparent text-[#33486a] hover:text-[#5e7ba0]'
                                    }`}
                                //  El tamaño va en 'style': la regla global 'button {}' de
                                //  index.css gana a las utilidades de Tailwind.
                                style={{ padding: '3px 12px', fontSize: '10px' }}
                            >
                                {texto}
                            </button>
                        ))
                    }

                    <BarraDeLectura
                        lectura={lectura}
                        censando={censando}
                        lecturasDelCenso={lecturasDelCenso}
                        lecturasQueDuraElCenso={lecturasQueDuraElCenso}
                        pedidos={pedidos.length}
                    />
                </div>

                <div className={`w-full flex-1 min-h-0 flex flex-col ${pestana === 'rotacion' ? '' : 'hidden'}`}>
                    <Parrilla
                        tickets={ticketsVisibles}
                        leerAnotacion={leerAnotacion}
                        anotar={anotar}
                        limiteAtencion={limite}
                        limiteLimpieza={limpieza}
                        onReportarDemora={reportarDemora}
                    />
                </div>

                <div className={`w-full flex-1 min-h-0 flex flex-col ${pestana === 'procesos' ? '' : 'hidden'}`}>
                    <ParrillaProcesos
                        filas={pedidos}
                        leerAnotacion={leerAnotacion}
                        anotar={anotar}
                    />
                </div>

            </div>

        </div>
    );
}




/*  ─────────────────────────────────────────────────────────────────────────────
 *  LA BARRA DE ESTADO DE LA LECTURA
 *
 *  Existe porque una parrilla vacía puede significar cuatro cosas muy distintas y
 *  todas se veían idénticas:
 *
 *      · se está censando lo que ya estaba  → es correcto, hay que esperar
 *      · no ha llegado ningún pedido nuevo  → también es correcto
 *      · el modelo contesta pero se descarta todo → el filtro está de más
 *      · la lectura falla                   → hay que mirarlo
 *
 *  Distinguirlas costaba abrir la consola del navegador, y en producción nadie la
 *  abre. Aquí se resume en una línea.
 *
 *  Va discreta a propósito: es información de fondo, no un cartel. Solo se pone en
 *  ámbar cuando de verdad hay algo que mirar.
 *  ───────────────────────────────────────────────────────────────────────────── */
function BarraDeLectura({ lectura, censando, lecturasDelCenso, lecturasQueDuraElCenso, pedidos }) {

    //  Antes de la primera respuesta no hay nada que contar y la barra estorbaría.
    if (!lectura && !censando) return null;

    const fallo = lectura?.error;

    //  'leídos' son los objetos que devolvió el modelo; 'descartados', los que no
    //  llegaron a ser un ticket por no traer cronómetro o ser una etiqueta de pantalla.
    //  Que los dos números coincidan es la señal de que el filtro se está pasando.
    const seDescartaTodo = !fallo && lectura?.leidos > 0 && lectura.descartados === lectura.leidos;

    //  El motivo viene ya en español desde TabletScreen. Se recorta para que quepa
    //  en la barra; entero va en el 'title', al pasar el ratón.
    const texto = fallo
        ? `lectura fallida: ${String(fallo).slice(0, 90)}`
        : censando
            ? `censando lo que ya estaba · ${lecturasDelCenso}/${lecturasQueDuraElCenso}`
            : [
                `${pedidos} en seguimiento`,
                `leídos ${lectura?.leidos ?? 0}`,
                lectura?.descartados ? `descartados ${lectura.descartados}` : '',

                //  Los segundos de la última lectura importan más de lo que parece: el
                //  fallo anterior fue un tiempo límite, y verlos acercarse al tope avisa
                //  antes de que la vuelta se pierda.
                lectura?.segundos ? `${lectura.segundos.toFixed(1)} s` : '',
            ].filter(Boolean).join(' · ');

    const ayuda = fallo
        ? `La última vuelta no llegó a leerse: ${fallo}. Si se repite, mira la consola.`
        : censando
            ? 'Durante el primer recorrido se apunta lo que ya estaba en pantalla para no contarlo como recién llegado. La parrilla se queda vacía a propósito.'
            : seDescartaTodo
                ? 'El modelo contestó, pero nada de lo que dijo parecía un ticket: sin cronómetro legible, o era una etiqueta de la pantalla.'
                : 'Objetos que devolvió la última lectura, y cuántos no eran tickets.';

    return (
        <span
            className={`ml-auto min-w-0 pr-2 truncate ${fallo || seDescartaTodo ? 'text-[#e0b341]' : 'text-[#5e7ba0]'}`}
            style={{ fontSize: '9px' }}
            title={ayuda}
        >
            {texto}
        </span>
    );
}
