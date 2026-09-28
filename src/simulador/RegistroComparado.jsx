import { memo } from 'react';
import { RESULTADO } from './comparacion.js';
import { delta, esNumero, minSeg, plural, porCiento } from './formato.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  EL REGISTRO COMPARADO: DOS TABLAS QUE SE LEEN DE UN VISTAZO
 *
 *      1 · LO QUE GENERÓ LA SIMULACIÓN      la verdad: cada ticket con sus horas
 *      2 · LO QUE RECONOCIÓ LA INFERENCIA   lo que leyó la IA, con su resultado
 *
 *  Encima, cuatro marcadores con las cuentas que importan: cuántos tickets generó la
 *  simulación, cuántos de ellos reconoció la inferencia, qué porcentaje ACERTÓ y cuántos
 *  tickets se inventó (con sus números).
 *
 *  Antes era UNA tabla de veintiuna columnas con la verdad y lo inferido en la misma
 *  fila. Tenía todos los datos y no se leía ninguno. Lo que aquí ya no se pinta —la
 *  demora según Jarvis, a qué hora se fue cada tarjeta de la pantalla— sigue saliendo
 *  en la exportación a CSV y JSON.
 *
 *  Este archivo SOLO PINTA. Las cuentas están en comparacion.js.
 *  ───────────────────────────────────────────────────────────────────────────── */


const ROTULO_DE_ESTADO = { pausa: 'en pausa', fuego: 'en fuego', lista: 'lista', despachada: 'despachada', retirada: 'fuera' };

//  Las tarjetas que todavía le deben algo a la cocina: son las únicas con botones.
const SIN_DESPACHAR = ['pausa', 'fuego', 'lista'];

//  Qué hace cada botón, dicho como se diría delante de la tablet de Toast.
const AYUDA_DE_LAS_ACCIONES = {
    disparar: 'Dispara este curso retenido: en Toast es tocar la tarjeta que está en HOLD / EN PAUSA. Pasa a prepararse y empieza a correr su FIRE / COCINAR.',
    lista: 'Pone todas las palomitas de golpe, como si en Toast se tocaran uno a uno todos sus productos: la tarjeta cambia de color y aquí se cierra su tiempo de preparación. NO la despacha.',
    yaLista: 'Ya tiene todas las palomitas. Falta despacharla.',
    despachar: 'La despacha, como el expedidor al tocar la cabecera de la tarjeta en Toast: queda en verde con doble palomita, o desaparece si «recently fulfilled» está oculto.',
};

//  Cómo se enseña cada resultado de la tabla 2: su texto y su color.
const ASPECTO_DEL_RESULTADO = {
    [RESULTADO.ACIERTO]: { texto: '✓ acierto', clase: 'sim-resultado--bien' },
    [RESULTADO.HORA_ESTIMADA]: { texto: 'hora estimada', clase: 'sim-resultado--aviso', ayuda: 'El ticket existe, pero se le vio por primera vez ya listo: su toma de orden es una estimación.' },
    [RESULTADO.HORA_DESVIADA]: { texto: 'hora desviada', clase: 'sim-resultado--mal', ayuda: 'El ticket existe, pero su toma de orden se aparta de la verdadera más que la tolerancia.' },
    [RESULTADO.SIN_HORA]: { texto: 'sin hora', clase: 'sim-resultado--aviso', ayuda: 'El ticket existe, pero la inferencia no le sacó toma de orden.' },
    [RESULTADO.MESA_DISTINTA]: { texto: 'mesa distinta', clase: 'sim-resultado--mal', ayuda: 'El número de ticket existe, pero la inferencia lo puso en otra mesa.' },
    [RESULTADO.NO_EXISTE]: { texto: '✗ no existe', clase: 'sim-resultado--mal', ayuda: 'La simulación nunca generó este ticket: la lectura se inventó el número (o lo leyó mal).' },
};




/**
 * @param {object}   comparacion  lo que devuelve 'comparar' (comparacion.js)
 * @param {boolean}  hayInferencia  si la ventana de la tablet ya mandó algo
 * @param {number}   toleranciaS  segundos de desvío que se dan por buenos
 * @param {boolean}  parada  si no están entrando tickets (para el texto de «no hay nada»)
 * @param {function} cambiar  cambia un ajuste del simulador (aquí, la tolerancia)
 * @param {function} exportar  ('csv' | 'json') → descarga el registro entero;
 *                             ('pdf') → abre el informe de aciertos y desaciertos para imprimirlo
 * @param {function} alBorrar  quita del registro las tarjetas que ya no están en pantalla
 * @param {object}   acciones  { disparar, lista, despachar }: los botones de cada fila
 */
export const RegistroComparado = memo(function RegistroComparado({ comparacion, hayInferencia, toleranciaS, parada, cambiar, exportar, alBorrar, acciones }) {

    const { filas, reconocidos, resumen, turno } = comparacion;

    return (
        <section className='sim-registro' aria-label='Registro de la simulación'>

            <div className='sim-registro__cabeza'>
                <h2>Registro de la simulación</h2>

                <Marcadores resumen={resumen} turno={turno} hayInferencia={hayInferencia} toleranciaS={toleranciaS} />

                <div className='sim-registro__acciones'>
                    <label className='sim-etiqueta' htmlFor='sim-tolerancia' title='Cuántos segundos puede desviarse la toma de orden inferida para contarla como acierto'>Tolerancia</label>
                    <input id='sim-tolerancia' type='number' min={0} max={600} value={toleranciaS} onChange={e => cambiar({ toleranciaS: Number(e.target.value) || 0 })} />

                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => exportar('csv')} disabled={filas.length === 0} title='Todas las columnas, también las que aquí no se pintan'>Exportar CSV</button>
                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => exportar('json')} disabled={filas.length === 0}>JSON</button>
                    <button type='button' className='sim-boton sim-boton--chico' onClick={() => exportar('pdf')} disabled={filas.length === 0} title='Abre el informe de aciertos y desaciertos para guardarlo como PDF'>PDF</button>
                    <button type='button' className='sim-boton sim-boton--chico sim-boton--peligro' onClick={alBorrar} title='Quita del registro las tarjetas que ya no están en pantalla'>Limpiar</button>
                </div>
            </div>

            <div className='sim-dos-tablas'>
                <TablaDeLaSimulacion filas={filas} parada={parada} acciones={acciones} />
                <TablaDeLaInferencia reconocidos={reconocidos} resumen={resumen} hayInferencia={hayInferencia} toleranciaS={toleranciaS} />
            </div>

        </section>
    );
});




/*  ── LOS CUATRO MARCADORES ──────────────────────────────────────────────────── */

/**
 * Las cuentas que importan, en grande. Cada marcador es un número, de qué es ese número
 * y, debajo, el detalle. El color dice si va bien (verde), regular (ámbar) o mal (rojo).
 */
function Marcadores({ resumen, turno, hayInferencia, toleranciaS }) {

    const {
        generados, reconocibles, existen, inferidos, aciertos, inventados, numerosInventados, errorMedio,
        sinReconocer, numerosSinReconocer, horaDesviada, numerosHoraDesviada, horaEstimada, sinHora,
    } = resumen;

    //  Una fracción y su color. Sin nada que medir todavía no hay ni porcentaje ni color.
    const medida = (parte, total) => (total > 0 ? { texto: porCiento(parte / total), tono: parte === total ? 'bien' : parte / total >= 0.5 ? 'aviso' : 'mal' } : { texto: '—', tono: '' });

    const reconocio = medida(existen, reconocibles);
    const acerto = medida(aciertos, inferidos);

    //  Los dos fallos van al revés que los aciertos: aquí CERO es lo bueno.
    // fallo = «una fracción de fallos y su color»
    const fallo = (parte, total) => (total > 0 ? { texto: porCiento(parte / total), tono: parte === 0 ? 'bien' : parte / total <= 0.2 ? 'aviso' : 'mal' } : { texto: '—', tono: '' });

    const noVistos = fallo(sinReconocer, reconocibles);
    const horaMal = fallo(horaDesviada, existen);

    return (
        <div className='sim-marcadores'>

            <Marcador
                numero={generados}
                rotulo='generó la simulación'
                detalle={turno.disponible ? `mesa ${turno.rotacionesIniciadas} de ${turno.rotacionesDelTurno} · ${plural(turno.demoras.total, 'demora', 'demoras')}` : plural(generados, 'ticket', 'tickets')}
                ayuda='Tabla 1. Todos los tickets que ha creado la simulación, estén o no todavía en pantalla.'
            />

            <Marcador
                numero={hayInferencia ? reconocio.texto : '—'}
                tono={hayInferencia ? reconocio.tono : ''}
                rotulo='reconoció la inferencia'
                detalle={hayInferencia ? `${existen} de ${reconocibles} que pudo ver` : 'todavía no ha llegado nada de la ventana de la tablet'}
                ayuda='De los tickets que la ventana de la tablet PUDO ver, cuántos reconoció. No cuentan los que ya estaban en pantalla al conectar (se apartan a propósito) ni los que nunca llegaron a pintarse.'
            />

            <Marcador
                numero={hayInferencia ? acerto.texto : '—'}
                tono={hayInferencia ? acerto.tono : ''}
                rotulo='de aciertos'
                detalle={hayInferencia ? `${aciertos} de ${inferidos} que dio la inferencia${errorMedio !== null ? ` · error medio ${errorMedio} s` : ''}` : '—'}
                ayuda={`Tabla 2. De todo lo que dio la inferencia, cuánto está BIEN: el ticket existe, la mesa es la suya y la toma de orden cae dentro de ±${toleranciaS} s.`}
            />

            {/*  NO RECONOCIDOS: los que la lectura pudo ver y se le escaparon.  */}
            <Marcador
                numero={hayInferencia ? noVistos.texto : '—'}
                tono={hayInferencia ? noVistos.tono : ''}
                rotulo={sinReconocer === 1 ? 'ticket sin reconocer' : 'tickets sin reconocer'}
                detalle={!hayInferencia ? '—'
                    : sinReconocer > 0 ? `${sinReconocer} de ${reconocibles} · ${numerosSinReconocer.slice(0, 8).join(' ')}`
                        : `ninguno: vio los ${reconocibles} que pudo ver`}
                ayuda='Tickets que la ventana de la tablet PUDO ver y la inferencia no dio. Es el reverso de «reconoció la inferencia», puesto aparte para no tener que restar de cabeza.'
            />

            {/*  Y de los que sí vio, aquellos cuya hora no cuadra.  */}
            <Marcador
                numero={hayInferencia ? horaMal.texto : '—'}
                tono={hayInferencia ? horaMal.tono : ''}
                rotulo={horaDesviada === 1 ? 'toma de orden que no coincide' : 'tomas de orden que no coinciden'}
                detalle={!hayInferencia ? '—'
                    : horaDesviada > 0 ? `${horaDesviada} de ${existen} · ${numerosHoraDesviada.slice(0, 8).join(' ')}`
                        : existen > 0 ? `ninguna: las ${existen} caen dentro de ±${toleranciaS} s`
                            : '—'}
                ayuda={`De los tickets que la inferencia reconoció Y existen, aquellos cuya toma de orden se sale de ±${toleranciaS} s. No cuentan aquí los que se vieron ya listos (su hora es una estimación) ni los que se quedaron sin hora.`}
            />

            <Marcador
                numero={hayInferencia ? inventados : '—'}
                tono={!hayInferencia ? '' : inventados > 0 ? 'mal' : 'bien'}
                rotulo={inventados === 1 ? 'ticket que no existe' : 'tickets que no existen'}
                detalle={inventados > 0 ? numerosInventados.join(' · ') : hayInferencia ? 'la lectura no se ha inventado ninguno' : '—'}
                ayuda='Tickets que dio la inferencia y que la simulación nunca generó: números inventados o mal leídos. Salen arriba del todo en la tabla 2.'
            />

        </div>
    );
}


/**
 * Un marcador: el número en grande y, al lado, de qué es y su detalle.
 *
 * En una ventana estrecha el texto se recorta con puntos suspensivos, así que el rótulo
 * que sale al pasar el ratón lleva TODO: el número, el detalle entero y la explicación.
 */
function Marcador({ numero, rotulo, detalle, ayuda, tono = '' }) {
    return (
        <div className={`sim-marcador ${tono ? `sim-marcador--${tono}` : ''}`} title={`${numero} ${rotulo} · ${detalle}\n\n${ayuda}`}>
            <span className='sim-marcador__numero'>{numero}</span>
            <span className='sim-marcador__texto'>
                <b>{rotulo}</b>
                <span>{detalle}</span>
            </span>
        </div>
    );
}




/*  ── TABLA 1 · LO QUE GENERÓ LA SIMULACIÓN ──────────────────────────────────── */

function TablaDeLaSimulacion({ filas, parada, acciones }) {
    return (
        <div className='sim-bloque'>
            <h3 className='sim-bloque__titulo'><span className='sim-bloque__numero'>1</span> Generados por la simulación <small>{plural(filas.length, 'ticket', 'tickets')} · el más nuevo arriba</small></h3>

            <div className='sim-tabla-caja' tabIndex={0} role='region' aria-label='Tabla 1: tickets generados por la simulación'>
                {filas.length === 0
                    ? <p className='sim-vacio'>{parada ? 'Todavía no hay ningún ticket. Pulsa «Empezar a recibir tickets», encima de la pantalla, o crea uno a mano desde el panel.' : 'Aún no ha entrado ningún pedido. Entran solos, o créalos con los botones del panel.'}</p>
                    : (
                        <table className='sim-tabla'>
                            <thead>
                                <tr>
                                    <th>Mesa</th>
                                    <th>Ticket</th>
                                    <th>Tipo</th>
                                    <th>Estado</th>
                                    <th>Toma de orden</th>
                                    <th title='Primera señal en la tablet de que está listo: se completa de palomitas o se despacha'>Listo</th>
                                    <th title='Lo que tardó en prepararse (del FIRE a todas las palomitas) y, detrás, su tiempo máximo. En cursiva si sigue cocinándose'>Prep. / máx.</th>
                                    <th title='Si la preparación superó su máximo, y por cuánto'>Demora</th>
                                    <th title='¿Lo reconoció la inferencia? «ya estaba» y «no se vio» no son fallos: esos tickets no se podían reconocer'>¿Reconocido?</th>
                                    <th className='sim-acciones' title='Para toda tarjeta sin despachar: dispararla si está en pausa, marcarla lista y despacharla'>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filas.map(fila => <FilaDeLaSimulacion key={fila.verdad.id} fila={fila} acciones={acciones} />)}
                            </tbody>
                        </table>
                    )}
            </div>
        </div>
    );
}


function FilaDeLaSimulacion({ fila, acciones }) {

    const { verdad } = fila;

    //  Lo que ya no tiene columna propia va en el rótulo de la fila, al pasar el ratón.
    const masDatos = [
        verdad.productos,
        esNumero(verdad.rotacion) ? `rotación ${verdad.manual ? 'M' : ''}${verdad.rotacion}` : '',
        verdad.despachada ? `despachada ${verdad.despachada}` : '',
        verdad.retirada ? `se fue de la pantalla ${verdad.retirada}` : '',
    ].filter(Boolean).join(' · ');

    return (
        <tr className={verdad.estado === 'retirada' ? 'sim-ida' : ''} title={masDatos}>
            <td>
                <b>{verdad.mesa}</b>
                {verdad.aMano && <span className='sim-ficha sim-ficha--amano sim-ficha--pegada' title={verdad.cocinaManual ? 'Ticket creado a mano. Lo preparas tú: la cocina automática no lo toca.' : 'Ticket creado a mano. Lo lleva la cocina automática, como a cualquier otro.'}>a mano</span>}
            </td>
            <td>#{verdad.ticket}</td>
            <td>
                {verdad.tipo || '—'}
                {verdad.retenida && <span className='sim-ficha sim-ficha--hold' title='Nació retenida (HOLD): su contador de cabecera empezó a correr antes que su FIRE'>HOLD</span>}
            </td>
            <td><span className={`sim-ficha sim-ficha--${verdad.estado}`}>{ROTULO_DE_ESTADO[verdad.estado]}</span></td>
            <td className='sim-hora'>{verdad.tomaDeOrden}</td>
            <td className='sim-hora'>{verdad.listoEnTablet || '—'}</td>
            <td className={`sim-hora ${verdad.enPreparacion ? 'sim-en-curso' : ''}`}>
                {esNumero(verdad.preparacionS) ? minSeg(verdad.preparacionS) : '—'}
                <span className='sim-tenue'> / {esNumero(verdad.limiteS) ? minSeg(verdad.limiteS) : '—'}</span>
            </td>
            <td><FichaDeDemora demora={verdad.demora} excesoS={verdad.excesoS} /></td>
            <td><Reconocimiento fila={fila} /></td>
            <td className='sim-acciones'><AccionesDeLaFila verdad={verdad} acciones={acciones} /></td>
        </tr>
    );
}


/**
 * La columna «¿Reconocido?» de la tabla 1: si la inferencia dio con este ticket.
 * Distingue el NO que es un fallo («sin detectar») de los que no lo son.
 */
function Reconocimiento({ fila }) {
    if (fila.ia) return <span className='sim-bien' title={`La inferencia lo reconoció: ${fila.veredicto.texto}`}>✓ sí</span>;
    if (fila.yaEstaba) return <span className='sim-tenue' title='Ya estaba en pantalla cuando se conectó la ventana de la tablet: se aparta a propósito, no es un fallo'>ya estaba</span>;
    if (!fila.verdad.vistaEnPantalla) return <span className='sim-tenue' title='Nunca llegó a pintarse en la pantalla que se estaba viendo (quedó en otra página): nadie pudo leerlo'>no se vio</span>;
    if (!fila.reconocible) return <span className='sim-tenue'>—</span>;

    return <span className='sim-aviso' title='Estuvo en pantalla y la inferencia todavía no ha dado con él'>✗ no</span>;
}


function FichaDeDemora({ demora, excesoS }) {
    if (demora === true) return <span className='sim-ficha sim-ficha--demora'>+{minSeg(excesoS ?? 0)}</span>;
    if (demora === false) return <span className='sim-ficha sim-ficha--enplazo'>en plazo</span>;
    return '—';
}


/*  Los botones de una fila. Están en el registro y no solo en la pantalla porque en la
 *  pantalla hay que DAR con la tarjeta —que puede estar en otra página— y acertarle a un
 *  producto; aquí cada ticket tiene su fila, con su número delante.
 */
function AccionesDeLaFila({ verdad, acciones }) {
    if (!SIN_DESPACHAR.includes(verdad.estado)) return null;

    const de = `el ticket #${verdad.ticket}${verdad.curso ? ` (${verdad.curso.toLowerCase()})` : ''}`;
    const yaLista = verdad.estado === 'lista';

    return (
        <span className='sim-acciones__botones'>
            {verdad.estado === 'pausa' && <button type='button' className='sim-boton sim-boton--mini' onClick={() => acciones.disparar(verdad.id)} title={AYUDA_DE_LAS_ACCIONES.disparar} aria-label={`Disparar ${de}`}>Disparar</button>}
            <button type='button' className='sim-boton sim-boton--mini sim-boton--listo' onClick={() => acciones.lista(verdad.id)} disabled={yaLista} title={yaLista ? AYUDA_DE_LAS_ACCIONES.yaLista : AYUDA_DE_LAS_ACCIONES.lista} aria-label={`Marcar listo ${de}`}>Listo</button>
            <button type='button' className='sim-boton sim-boton--mini' onClick={() => acciones.despachar(verdad.id)} title={AYUDA_DE_LAS_ACCIONES.despachar} aria-label={`Despachar ${de}`}>Despachar</button>
        </span>
    );
}




/*  ── TABLA 2 · LO QUE RECONOCIÓ LA INFERENCIA ───────────────────────────────── */

function TablaDeLaInferencia({ reconocidos, resumen, hayInferencia, toleranciaS }) {

    const { aciertos, inferidos, inventados } = resumen;

    const cuenta = inferidos > 0
        ? `${aciertos} de ${plural(inferidos, 'acierto', 'aciertos')} (${porCiento(aciertos / inferidos)})${inventados > 0 ? ` · ${plural(inventados, 'no existe', 'no existen')}` : ''}`
        : 'nada todavía';

    return (
        <div className='sim-bloque sim-bloque--ia'>
            <h3 className='sim-bloque__titulo'><span className='sim-bloque__numero'>2</span> Reconocidos por la inferencia <small>{cuenta}</small></h3>

            <div className='sim-tabla-caja' tabIndex={0} role='region' aria-label='Tabla 2: tickets reconocidos por la inferencia'>
                {reconocidos.length === 0
                    ? <p className='sim-vacio'>{hayInferencia ? 'La ventana de la tablet está conectada, pero la inferencia todavía no ha dado ningún ticket.' : 'Conecta la ventana de la tablet (su botón «Simular»): aquí irá saliendo lo que lea la IA.'}</p>
                    : (
                        <table className='sim-tabla'>
                            <thead>
                                <tr>
                                    <th>Mesa</th>
                                    <th>Ticket</th>
                                    <th>Tipo</th>
                                    <th>Toma de orden</th>
                                    <th title='Segundos de diferencia con la toma de orden verdadera'>Dif.</th>
                                    <th>Listo en tablet</th>
                                    <th title='Segundos de diferencia con el «listo» verdadero'>Dif.</th>
                                    <th title={`Acierto = el ticket existe, su mesa es la suya y la toma de orden cae dentro de ±${toleranciaS} s`}>Resultado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reconocidos.map(fila => <FilaDeLaInferencia key={fila.ia.clave} fila={fila} toleranciaS={toleranciaS} />)}
                            </tbody>
                        </table>
                    )}
            </div>
        </div>
    );
}


function FilaDeLaInferencia({ fila, toleranciaS }) {

    const { ia, verdad, dToma, dListo, resultado } = fila;

    const aspecto = ASPECTO_DEL_RESULTADO[resultado];
    const noExiste = resultado === RESULTADO.NO_EXISTE;
    const seDesvia = dToma !== null && Math.abs(dToma) > toleranciaS;

    //  En «mesa distinta» se dice cuál era la buena, que es lo que se quiere saber.
    const ayuda = resultado === RESULTADO.MESA_DISTINTA ? `${aspecto.ayuda} En la simulación es la mesa ${verdad.mesa}.` : aspecto.ayuda;

    return (
        <tr className={noExiste ? 'sim-fila--inventada' : ''}>
            <td><b>{ia.mesa || '—'}</b></td>
            <td>#{ia.ticket || '?'}</td>
            <td>{ia.tipo || '—'}</td>
            <td className='sim-hora' title={ia.tomaOrdenAproximada ? 'Estimada: el ticket se vio por primera vez ya listo' : undefined}>{ia.tomaOrden ? `${ia.tomaOrdenAproximada ? '≈ ' : ''}${ia.tomaOrden}` : '—'}</td>
            <td className={`sim-hora ${seDesvia ? 'sim-mal' : ''}`}>{delta(dToma)}</td>
            <td className='sim-hora'>{ia.listoTablet || '—'}</td>
            <td className='sim-hora'>{delta(dListo)}</td>
            <td><span className={`sim-resultado ${aspecto.clase}`} title={ayuda}>{aspecto.texto}</span></td>
        </tr>
    );
}
