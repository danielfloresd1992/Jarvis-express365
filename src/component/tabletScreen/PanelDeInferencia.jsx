import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import './PanelDeInferencia.css';
import { registroDeInferencia, TIPO, horaDelApunte, apuntesComoTexto } from '../../libs/tickets/registroDeInferencia.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  EL PANEL DEL REGISTRO DE LA INFERENCIA  (solo en desarrollo)
 *
 *  Va a la derecha de la ventana de la tablet y enseña, paso a paso, lo que hace cada
 *  lectura: la tira que se captura, la conexión con el servidor de IA, lo que se le
 *  manda, lo que contesta y los tickets que salen de esa respuesta.
 *
 *  Este archivo SOLO PINTA. Los apuntes los escribe TabletScreen en el cuaderno
 *  (libs/tickets/registroDeInferencia.js); aquí se leen y se enseñan.
 *
 *  Tiene tres piezas, de fuera a dentro:
 *
 *      PanelDeInferencia   el panel entero: plegado o abierto, cabecera y lista
 *      Apunte              una línea de la lista, que se despliega si trae detalle
 *      Detalle             los datos de un apunte, como lista «dato: valor»
 *  ───────────────────────────────────────────────────────────────────────────── */


//  Dónde se recuerda, por equipo, si el panel quedó abierto o plegado.
const CLAVE_ABIERTO = 'tablet:registro-abierto';

//  Por debajo de este ancho de ventana el panel nace plegado: en la ventana flotante
//  estrecha se comería la mitad de la pantalla de la tablet.
const ANCHO_PARA_NACER_ABIERTO = 900;

//  A cuántos píxeles del final de la lista se considera que «se está mirando el final».
const MARGEN_DEL_FINAL_PX = 40;

//  El rótulo de cada tipo de apunte, tal como se lee en su etiqueta de color.
const ROTULO_DEL_TIPO = {
    [TIPO.TABLET]: 'tablet',
    [TIPO.TIRA]: 'tira',
    [TIPO.SERVIDOR]: 'servidor',
    [TIPO.ENVIO]: 'envío',
    [TIPO.RESPUESTA]: 'respuesta',
    [TIPO.RESULTADO]: 'resultado',
    [TIPO.FALLO]: 'fallo',
};




/**
 * Lee de este equipo si el panel quedó abierto. Sin nada guardado, abierto solo si la
 * ventana es lo bastante ancha.
 */
function leerSiQuedoAbierto() {
    try {
        const guardado = localStorage.getItem(CLAVE_ABIERTO);
        if (guardado !== null) return guardado === '1';
    }
    catch { /* sin acceso al almacenamiento se decide por el ancho, como la primera vez */ }

    return window.innerWidth >= ANCHO_PARA_NACER_ABIERTO;
}




export default function PanelDeInferencia() {

    //  Los apuntes del cuaderno. 'useSyncExternalStore' vuelve a pintar este componente
    //  cada vez que el cuaderno avisa de un cambio, y solo entonces.
    const apuntes = useSyncExternalStore(registroDeInferencia.suscribir, registroDeInferencia.leer);

    const [abierto, setAbierto] = useState(leerSiQuedoAbierto);

    //  Si la lista baja sola hasta el último apunte. Se apaga al subir a mirar algo, para
    //  que un apunte nuevo no te arranque de donde estabas leyendo.
    const [sigueElFinal, setSigueElFinal] = useState(true);

    const [avisoDeCopia, setAvisoDeCopia] = useState('');

    const listaRef = useRef(null);


    //  Se recuerda si quedó abierto o plegado.
    useEffect(() => {
        try { localStorage.setItem(CLAVE_ABIERTO, abierto ? '1' : '0'); }
        catch { /* sin almacenamiento, el panel simplemente no lo recuerda */ }
    }, [abierto]);


    //  Con cada apunte nuevo, al final de la lista — si se está siguiendo el final.
    useEffect(() => {
        const lista = listaRef.current;
        if (lista && sigueElFinal) lista.scrollTop = lista.scrollHeight;
    }, [apuntes, sigueElFinal, abierto]);


    //  Al desplazar a mano: se sigue el final solo mientras se esté mirando el final.
    const alDesplazar = () => {
        const lista = listaRef.current;
        if (!lista) return;

        const hastaElFinal = lista.scrollHeight - lista.scrollTop - lista.clientHeight;
        setSigueElFinal(hastaElFinal <= MARGEN_DEL_FINAL_PX);
    };


    //  Copia todos los apuntes como texto, para pegarlos en un mensaje o un archivo.
    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(apuntesComoTexto(apuntes));
            setAvisoDeCopia('copiado');
        }
        catch { setAvisoDeCopia('no se pudo copiar'); }

        setTimeout(() => setAvisoDeCopia(''), 2000);
    };


    const fallos = apuntes.filter(apunte => apunte.tipo === TIPO.FALLO).length;


    //  PLEGADO: una pestaña estrecha que dice cuántos apuntes hay, en rojo si hay fallos.
    if (!abierto) {
        return (
            <button
                type='button'
                className='pi-pestana'
                onClick={() => setAbierto(true)}
                aria-expanded='false'
                title='Abrir el registro de la inferencia: cada paso de cada lectura, uno a uno'
            >
                <span className={`pi-pestana__cuenta ${fallos > 0 ? 'pi-pestana__cuenta--fallo' : ''}`}>{apuntes.length}</span>
                <span className='pi-pestana__rotulo'>Registro de la inferencia</span>
            </button>
        );
    }


    return (
        <aside className='pi-panel' aria-label='Registro de la inferencia'>

            <header className='pi-cabecera'>
                <h2 className='pi-cabecera__titulo'>Registro de la inferencia</h2>
                <span className='pi-cabecera__resumen'>{apuntes.length} apuntes{fallos > 0 ? ` · ${fallos} fallos` : ''}{avisoDeCopia ? ` · ${avisoDeCopia}` : ''}</span>

                <span className='pi-hueco' />

                <button
                    type='button'
                    className={`pi-boton ${sigueElFinal ? 'pi-boton--activo' : ''}`}
                    onClick={() => setSigueElFinal(sigue => !sigue)}
                    aria-pressed={sigueElFinal}
                    title='Con esto encendido la lista baja sola al último apunte. Se apaga al subir a leer algo.'
                >
                    Seguir el final
                </button>
                <button type='button' className='pi-boton' onClick={copiar} disabled={apuntes.length === 0} title='Copia todos los apuntes como texto'>Copiar</button>
                <button type='button' className='pi-boton' onClick={registroDeInferencia.vaciar} disabled={apuntes.length === 0} title='Borra los apuntes. No toca nada de la lectura.'>Limpiar</button>
                <button type='button' className='pi-boton' onClick={() => setAbierto(false)} aria-expanded='true' title='Plegar el panel'>Plegar ▸</button>
            </header>

            <div ref={listaRef} className='pi-lista' onScroll={alDesplazar}>
                {apuntes.length === 0
                    ? <p className='pi-vacio'>Todavía no hay nada apuntado. Conecta la tablet (o pulsa «Simular») con el modo IA encendido: aquí irá saliendo cada paso de cada lectura.</p>
                    : apuntes.map((apunte, i) => (
                        <Apunte
                            key={apunte.id}
                            apunte={apunte}
                            //  ¿Es el primero de su lectura? Entonces lleva la separación encima.
                            esElPrimero={apunte.lectura !== null && apunte.lectura !== apuntes[i - 1]?.lectura}
                        />
                    ))}
            </div>

        </aside>
    );
}




/**
 * Una línea del registro: hora, tipo, número de lectura y título.
 *
 * Si el apunte trae detalle es un <details>: se despliega con un clic o con la tecla
 * Intro, sin una línea de JavaScript. Si no trae, es una línea fija.
 *
 * Un FALLO nace desplegado: es justo lo que se viene a mirar.
 */
function Apunte({ apunte, esElPrimero }) {

    const clases = `pi-apunte pi-apunte--${apunte.tipo} ${esElPrimero ? 'pi-apunte--primero' : ''}`;

    const linea = (
        <>
            <span className='pi-apunte__hora'>{horaDelApunte(apunte.hora)}</span>
            <span className='pi-apunte__tipo'>{ROTULO_DEL_TIPO[apunte.tipo] ?? apunte.tipo}</span>
            {apunte.lectura !== null && <span className='pi-apunte__lectura' title={`Lectura número ${apunte.lectura}`}>#{apunte.lectura}</span>}
            <span className='pi-apunte__titulo'>{apunte.titulo}</span>
        </>
    );

    if (!apunte.detalle) return <div className={clases}><div className='pi-apunte__linea'>{linea}</div></div>;

    return (
        <details className={clases} open={apunte.tipo === TIPO.FALLO}>
            <summary>{linea}</summary>
            <Detalle datos={apunte.detalle} />
        </details>
    );
}




/**
 * Los datos de un apunte, como lista «dato: valor».
 *
 * Un valor sencillo (número, texto corto, sí/no) va en la misma línea. Uno largo o
 * compuesto —la respuesta del modelo, la lista de tickets— va en una caja con su propio
 * desplazamiento, para que un apunte enorme no empuje a todos los demás.
 */
function Detalle({ datos }) {
    return (
        <dl className='pi-detalle'>
            {Object.entries(datos).map(([dato, valor]) => (
                <FilaDelDetalle key={dato} dato={dato} valor={valor} />
            ))}
        </dl>
    );
}


function FilaDelDetalle({ dato, valor }) {

    const esCompuesto = valor !== null && typeof valor === 'object';
    const esTextoLargo = typeof valor === 'string' && (valor.length > 60 || valor.includes('\n'));

    const comoTexto = esCompuesto ? JSON.stringify(valor, null, 2)
        : valor === true ? 'sí'
            : valor === false ? 'no'
                : valor === null || valor === undefined || valor === '' ? '—'
                    : String(valor);

    return (
        <>
            <dt>{dato}</dt>
            <dd>{esCompuesto || esTextoLargo ? <pre>{comoTexto}</pre> : comoTexto}</dd>
        </>
    );
}
