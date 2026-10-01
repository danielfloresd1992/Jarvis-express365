import Icono from './Icono.jsx';


/*  LA CARCASA DE LA VENTANA DE LA TABLET
 *
 *  Todo lo que va POR ENCIMA del espejo: la barra de título con el estado y los
 *  botones, y el aviso del envío. Debajo se pinta lo que llegue en `children`, que
 *  son el espejo (TabletRender) y la barra de zoom.
 *
 *  Solo pinta. No sabe conectar, ni leer, ni enviar: lo recibe todo por props y
 *  avisa llamando a una función. Lo único que calcula son cosas que se deducen de
 *  lo que ya recibe —los colores y si hubo error—, para no pedir seis props más.
 *
 *  TODOS LOS BOTONES SON ÍCONOS. La ventana abre a 400 px y con texto no cabían:
 *  «Desconectar» empujaba la ✕ fuera del borde. Lo que hace cada uno lo dice su
 *  `title` al pasar el ratón y su `aria-label` a un lector de pantalla.
 *
 *  Su aspecto va en las clases `vt-icono` de index.css y NO en utilidades de
 *  Tailwind: la regla global `button {}` de index.css no está en ninguna capa y les
 *  gana en relleno, borde, radio y letra.
 */


/*  @param {string}   nameEstablishment      el nombre del local, arriba del todo
 *  @param {string}   statusText             cómo está la tablet
 *  @param {boolean}  connected              la tablet está conectada
 *  @param {boolean}  loadingUsbState        se está conectando ahora mismo
 *  @param {any}      sendFrameStop          'enviando', o { ok, texto }, o null
 *  @param {boolean}  simulatorIsActive      lo conectado es una tablet de mentira
 *  @param {object}   aiServer               lo que contestó el servidor de IA (STEP 0)
 *  @param {boolean}  modeIA                 la lectura de tickets está activa
 *  @param {number}   strips                 en cuántas tiras se corta la pantalla
 *  @param {number}   stripReading           qué tira se está leyendo (null: ninguna)
 *  @param {boolean}  waitingIA              se está esperando al modelo
 *  @param {string}   lastError              qué falló en la última lectura
 *  @param {boolean}  simulationAvailable    hay simulador (solo en desarrollo)
 *  @param {function} describeAiFailure      traduce el fallo del servidor a español
 */
export default function TabletContainer({
    nameEstablishment,
    statusText,
    connected,
    loadingUsbState,
    sendFrameStop,
    simulatorIsActive,


    aiServer,
    modeIA,
    strips,
    stripReading,
    waitingIA,
    lastError,
    simulationAvailable,

    onMouseEvent, //para arrastrar la ventana

    toggleModeIACallback,
    getScreenShotCallback,
    simulateCallback,
    connectTabletCallback,
    disconnectTabletCallback,
    closeCallback,

    describeAiFailure,

    children
}) {


    //  EL ESTADO DE LA IA: con qué modelo se lee, o por qué no se está leyendo.
    // aiStatusText = «el texto del estado de la IA»
    let aiStatusText = 'IA: consultando el servidor…';
    if (aiServer?.active === true) aiStatusText = `IA: ${aiServer.model}`;
    if (aiServer?.active === false) aiStatusText = describeAiFailure(aiServer);

    // aiStatusColor = «el color del estado de la IA»
    let aiStatusColor = 'text-[#8aa0bb]';
    if (aiServer?.active === false) aiStatusColor = 'text-[#f2cf6b]';


    // failed = «el último intento falló». Se deduce del texto del estado y por eso no es un prop.
    const failed = String(statusText ?? '').startsWith('Error');


    //  Una simulación se distingue DE UN VISTAZO: punto y texto en violeta, un color que
    //  la ventana no usa para nada más. Lo que sale en las parrillas es de mentira, y
    //  nadie debería tener que leer la barra para darse cuenta.
    // classPointSimulator = «la clase del punto de estado»
    const classPointSimulator = simulatorIsActive ? 'bg-[#b49cff] shadow-[0_0_0_3px_rgba(180,156,255,0.22)]'
        : connected ? 'bg-[#5fd29a] shadow-[0_0_0_3px_rgba(95,210,154,0.18)]'
            : loadingUsbState ? 'bg-[#f2b84b] shadow-[0_0_0_3px_rgba(242,184,75,0.2)]'
                : failed ? 'bg-[#ff6b7a]'
                    : 'border-2 border-[#5e7ba0]';

    // classTextStatus = «el color del texto del estado»
    const classTextStatus = simulatorIsActive ? 'text-[#cdbcff] font-semibold'
        : failed ? 'text-[#ffb3bc]'
            : loadingUsbState ? 'text-[#f2cf6b]'
                : 'text-[#8aa0bb]';




    return (
        /*  Llena a su padre, que es el panel de arriba de la ventana partida.
         *
         *  NO lleva 'fixed inset-0': eso lo sacaría del panel y taparía todo, incluida la
         *  parrilla de abajo. Lo llevaba cuando esto era una ventana para él solo.
         *
         *  Sin borde ni esquinas propias: el marco lo pone la ventana, y un segundo borde
         *  aquí dibujaría una línea doble justo encima del divisor.
         */
        <div className='relative w-full h-full min-h-0 flex flex-col overflow-hidden bg-[#01122c]'>


            {/*  LA BARRA DE TÍTULO
                 La ventana flotante no tiene marco, así que esta barra hace de barra de
                 título: 'drag' le dice a Electron que arrastrando aquí se mueve la ventana
                 entera. Los botones van en una zona 'no-drag' porque dentro de una zona
                 arrastrable dejarían de responder al clic.  */}
            <header
                className='sticky top-0 z-10 h-12 shrink-0 flex items-center gap-2.5 pl-3 pr-1.5 bg-[#021a38] border-b border-[#0a3a66] cursor-move select-none'
                style={{ WebkitAppRegion: 'drag' }}
                onMouseDown={onMouseEvent}
            >


                {/*  ── 1. EL ESTADO, A LA IZQUIERDA ──────────────────────────────  */}

                {/*  El punto lo dice de un vistazo: violeta simulación, verde conectada,
                     ámbar conectando, rojo si el último intento falló, hueco si no hay nada.  */}
                <span aria-hidden='true' className={`shrink-0 w-2.5 h-2.5 rounded-full ${classPointSimulator}`} />


                {/*  Nombre del local arriba y estado debajo, en dos líneas. En una sola, con
                     la ventana estrecha, el nombre empujaba los botones y la ✕ se salía.

                     'min-w-0' es imprescindible: sin él un hijo de flex no baja de su ancho
                     natural, así que este texto empujaría los botones fuera de la ventana en
                     lugar de recortarse con puntos suspensivos.  */}
                <span className='min-w-0 flex-1 flex flex-col gap-[3px] leading-none'>

                    <span className='min-w-0 text-[13px] font-semibold text-[#e6eef9] truncate' title={nameEstablishment}>
                        {nameEstablishment || 'Tablet'}
                    </span>

                    {/*  El estado de la tablet y, a su lado, el de la IA. El de la IA es el que
                         se recorta si no cabe: entero va en su 'title', al pasar el ratón.  */}
                    <span className='min-w-0 flex gap-1.5 text-[11px]'>
                        <span className={`shrink-0 max-w-[70%] truncate ${classTextStatus}`}>
                            {statusText}
                        </span>
                        <span className={`min-w-0 truncate ${aiStatusColor}`} title={aiStatusText}>
                            · {aiStatusText}
                        </span>
                    </span>
                </span>


                {/*  ── 2. QUÉ ESTÁ LEYENDO LA IA ─────────────────────────────────
                     Una marca por tira, encendida la que se mandó al modelo; late mientras
                     se espera su respuesta. Solo desde 560 px: más estrecho se come el
                     nombre del local, y la barra de abajo ya dice cómo fue la última.  */}
                {
                    connected && (
                        <span
                            className={`hidden min-[560px]:flex shrink-0 items-center gap-2 h-[30px] px-2.5 rounded-[9px] border bg-[#01122c] font-mono text-[11px] ${lastError && modeIA ? 'border-[#6e5a1f] text-[#f2cf6b]' : 'border-[#0a3a66] text-[#8aa0bb]'}`}
                            title={!modeIA ? 'La lectura de tickets está en pausa' : lastError ? `La última lectura falló: ${lastError}` : 'Tira de la pantalla que está leyendo la IA'}
                        >
                            <Icono nombre={modeIA ? 'ia' : 'iaPausa'} tamano={15} />
                            {
                                modeIA ?
                                    <>
                                        <span className='flex gap-[3px]'>
                                            {
                                                Array.from({ length: strips ?? 0 }, (_, i) => (
                                                    <span
                                                        key={i}
                                                        className={`w-2.5 h-1.5 rounded-full ${i === stripReading ? `bg-[#38b6e8] ${waitingIA ? '' : ''}` : 'bg-[#1c3553]'}`}
                                                    />
                                                ))
                                            }
                                        </span>
                                        <span className='text-[#dbe7f7] tabular-nums'>
                                            {stripReading === null ? '–' : `${stripReading + 1}/${strips}`}
                                        </span>
                                    </>
                                    :
                                    <span>IA en pausa</span>
                            }
                        </span>
                    )
                }


                {/*  ── 3. LOS BOTONES, A LA DERECHA ──────────────────────────────
                     Siempre en este orden: modo IA · enviar captura · simular ·
                     conectar o desconectar · cerrar. El de cerrar va el último y
                     separado por una raya, como en cualquier ventana.  */}
                <div className='flex-none flex items-center gap-1.5' style={{ WebkitAppRegion: 'no-drag' }}>


                    {/*  MODO IA
                         Activa o pausa la lectura de tickets. En pausa el espejo sigue en vivo
                         y la captura se puede enviar; solo se deja de mandar la pantalla al
                         modelo. Se ve pulsado mientras está activo.  */}
                    <button
                        type='button'
                        className={`vt-icono ${modeIA ? 'vt-icono--activo' : ''}`}
                        onClick={toggleModeIACallback}
                        aria-pressed={modeIA}
                        aria-label={modeIA ? 'Modo IA activado: pausar la lectura de tickets' : 'Modo IA en pausa: reanudar la lectura de tickets'}
                        title={modeIA ? 'Modo IA activado: la IA lee los tickets. Pulsa para pausarla.' : 'Modo IA en pausa: solo espejo. Pulsa para reanudar la lectura.'}
                    >
                        <Icono nombre={modeIA ? 'ia' : 'iaPausa'} />
                    </button>


                    {/*  ENVIAR LA CAPTURA A LA BANDEJA DE JARVIS
                         Solo con la tablet conectada: sin conexión no hay nada que mandar, y un
                         botón que solo sabe dar error es peor que no tenerlo. Mientras sube, el
                         ícono gira; al terminar bien, se vuelve una palomita verde hasta que se
                         va el aviso.  */}
                    {
                        connected && (
                            <button
                                type='button'
                                className={`vt-icono ${sendFrameStop?.ok === true ? 'vt-icono--ok' : ''}`}
                                onClick={getScreenShotCallback}
                                disabled={sendFrameStop === 'enviando'}
                                aria-label='Enviar esta captura a la bandeja de Jarvis'
                                title='Enviar esta captura a la bandeja de Jarvis'
                            >
                                {
                                    sendFrameStop === 'enviando' ? <Icono nombre='girando' />
                                        : sendFrameStop?.ok === true ? <Icono nombre='hecho' />
                                            : <Icono nombre='captura' />
                                }
                            </button>
                        )
                    }


                    {/*  SIMULAR — solo en desarrollo y solo sin tablet conectada.
                         Abre (o encuentra) el simulador de Toast y se conecta a él en vez de al
                         USB. En la versión publicada esa constante es false y esto no existe.  */}
                    {
                        simulationAvailable && !connected && (
                            <button
                                type='button'
                                className='vt-icono'
                                onClick={simulateCallback}
                                disabled={loadingUsbState}
                                aria-label='Simular una tablet de Toast'
                                title='Simular: conecta con una tablet de Toast de mentira, para probar sin USB'
                            >
                                <Icono nombre='simular' />
                            </button>
                        )
                    }


                    {/*  CONECTAR O DESCONECTAR: el mismo sitio, según cómo esté.  */}
                    {
                        connected ?
                            <button
                                type='button'
                                className='vt-icono vt-icono--peligro'
                                onClick={disconnectTabletCallback}
                                aria-label='Desconectar la tablet'
                                title='Desconectar la tablet'
                            >
                                <Icono nombre='desconectar' />
                            </button>
                            :
                            <button
                                type='button'
                                className='vt-icono vt-icono--principal'
                                onClick={connectTabletCallback}
                                disabled={loadingUsbState}
                                aria-label={loadingUsbState ? 'Conectando con la tablet' : 'Conectar la tablet por USB'}
                                title={loadingUsbState ? 'Conectando… acepta el aviso en la tablet' : 'Conectar la tablet por USB'}
                            >
                                <Icono nombre={loadingUsbState ? 'girando' : 'conectar'} />
                            </button>
                    }


                    <span aria-hidden='true' className='w-px h-6 mx-0.5 bg-[#0a3a66]' />


                    {/*  CERRAR la propia ventana flotante. Al pasar el ratón se pone roja, como
                         la ✕ de cualquier ventana de Windows.  */}
                    <button
                        type='button'
                        className='vt-icono vt-icono--fantasma'
                        onClick={closeCallback}
                        aria-label='Cerrar la ventana de la tablet'
                        title='Cerrar'
                    >
                        <Icono nombre='cerrar' />
                    </button>

                </div>

            </header>


            {/*  EL RESULTADO DEL ENVÍO
                 Va SUPERPUESTO, no dentro del flujo. En una ventana de 400×300 una banda que
                 aparece y desaparece empujaría la imagen hacia abajo y de vuelta cada vez, y
                 ese salto se nota más que el propio aviso.

                 Se coloca contra la raíz de este panel —que lleva 'relative'— justo debajo de
                 la barra de título, que mide 48 px.

                 'pointer-events-none' para que no se coma un clic sobre la imagen si el aviso
                 cae encima de algo que se quería arrastrar.  */}
            {
                sendFrameStop && sendFrameStop !== 'enviando' && (
                    <div
                        role={sendFrameStop.ok ? 'status' : 'alert'}
                        className={`absolute top-[56px] left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-md text-[11px] font-bold shadow-lg pointer-events-none flex items-center gap-1.5 max-w-[92%]
                        ${sendFrameStop.ok ? 'bg-[#0f5132] text-[#b7f7d0] border border-[#1a7a4c]' : 'bg-[#5c1a22] text-[#ffc9cf] border border-[#8a2a36]'}`}
                    >
                        <Icono nombre={sendFrameStop.ok ? 'hecho' : 'aviso'} tamano={14} />
                        <span className='truncate'>{sendFrameStop.texto}</span>
                    </div>
                )
            }


            {/*  Y debajo, el espejo de la tablet y la barra de zoom.  */}
            {children}

        </div>
    );
}
