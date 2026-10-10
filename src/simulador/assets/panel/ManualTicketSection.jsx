import { memo } from 'react';
import { useManualTicket, ORDER_TYPES, DISH_TYPES } from '../../hook/useManualTicket.jsx';
import { plural } from '../../formato.js';
import Section from './Section.jsx';
import Toggle from './Toggle.jsx';


/*  LA SECCIÓN «CREAR UN TICKET A MANO»
 *
 *  El formulario para meter en la pantalla un ticket con lo que uno quiera: el pedido, la mesa, el tipo
 *  de plato y los platos, y —si se quiere— cocinarlo uno mismo.
 *
 *  Su estado y lo que hace al añadir y al crear están en hook/useManualTicket.jsx; aquí solo se pinta.
 *  El hook se usa DESDE AQUÍ y no desde el controlador: es un pedido a medio escribir, y con cada tecla
 *  repintaría el simulador entero.
 */


/*  @param {object}   engine   el motor
 *  @param {function} refresh  repinta la pantalla (useScreen)
 *  @param {string}   theme    el tema de la pantalla
 *  @param {object}   limits   los tiempos máximos, en minutos: { limiteEntradaMin, limiteFuerteMin, limitePostreMin }
 */
function ManualTicketSection({ engine, refresh, theme, limits }) {

    const form = useManualTicket({ engine, refresh, theme });

    return (
        <Section title='Crear un ticket a mano'>
            <div className='sim-tm'>

                <div className='sim-fila'>
                    <label htmlFor='sim-tm-pedido'>Pedido</label>
                    <select id='sim-tm-pedido' value={form.orderType} onChange={event => form.changeOrderType(event.target.value)}>
                        {ORDER_TYPES.map(option => <option key={option.id} value={option.id}>{option.nombre}</option>)}
                    </select>
                </div>

                {form.isTable && (
                    <div className='sim-tm__par'>
                        <label htmlFor='sim-tm-mesa' title='En blanco, una mesa que esté libre'>Mesa nº</label>
                        <input id='sim-tm-mesa' type='number' min={1} max={999} value={form.table} placeholder='libre' onChange={event => form.setTable(event.target.value)} />

                        <label htmlFor='sim-tm-numero' title='En blanco, un número nuevo. Con el número de un ticket que ya está en pantalla, esta tarjeta es OTRO curso de ese ticket: hereda su mesa y su mesero.'>Ticket #</label>
                        <input id='sim-tm-numero' type='number' min={1} max={99999} value={form.number} placeholder='nuevo' onChange={event => form.setNumber(event.target.value)} />
                    </div>
                )}

                <div className='sim-fila'>
                    <label htmlFor='sim-tm-curso'>Tipo de plato</label>
                    <select id='sim-tm-curso' value={form.course} onChange={event => form.changeCourse(event.target.value)} aria-describedby='sim-tm-maximo'>
                        {DISH_TYPES.map(type => <option key={type.nombre} value={type.curso}>{type.nombre}</option>)}
                    </select>
                    <span id='sim-tm-maximo' className='sim-tm__maximo' title='Su tiempo máximo de preparación: pasado ese tiempo desde que se dispara, cuenta como demora. Se cambia en «Tiempos máximos y demoras».'>máx. {limits[form.dishType.limite]} min</span>
                </div>

                {/*  Un formulario de verdad, para que Intro en la cantidad o en la nota añada el renglón.  */}
                <form className='sim-tm__plato' onSubmit={event => { event.preventDefault(); form.add(); }}>
                    <div className='sim-fila'>
                        <label htmlFor='sim-tm-plato'>Plato</label>
                        <select id='sim-tm-plato' value={form.chosenDish} onChange={event => form.setDish(event.target.value)}>
                            {form.groups.map(group => (group.titulo
                                ? <optgroup key={group.titulo} label={group.titulo}>{group.platos.map(dishOption => <option key={dishOption.nombre} value={dishOption.nombre}>{dishOption.nombre}</option>)}</optgroup>
                                : group.platos.map(dishOption => <option key={dishOption.nombre} value={dishOption.nombre}>{dishOption.nombre}</option>)))}
                        </select>
                    </div>

                    <div className='sim-tm__par'>
                        <label htmlFor='sim-tm-cantidad'>Cant.</label>
                        <input id='sim-tm-cantidad' type='number' min={1} max={99} value={form.quantity} onChange={event => form.setQuantity(event.target.value)} />

                        <label htmlFor='sim-tm-nota' title='Lo que el mesero escribe a mano: sale en la tarjeta debajo del plato'>Nota</label>
                        <input id='sim-tm-nota' className='sim-tm__nota' type='text' value={form.note} maxLength={40} placeholder='opcional' onChange={event => form.setNote(event.target.value)} />

                        <button type='submit' className='sim-boton sim-boton--chico' disabled={!form.chosenDish}>Añadir</button>
                    </div>
                </form>

                {form.lines.length === 0
                    ? <p className='sim-tm__vacia'>El ticket todavía no lleva ningún plato.</p>
                    : (
                        <ul className='sim-tm__lista' aria-label='Platos del ticket'>
                            {form.lines.map(line => (
                                <li key={line.id}>
                                    <span className='sim-tm__cuantos'>{line.cantidad}</span>
                                    <span className='sim-tm__nombre'>
                                        {line.nombre}
                                        {line.mods.length > 0 && <small>{line.mods.join(' · ')}</small>}
                                        {line.nota && <small><i>{line.nota}</i></small>}
                                    </span>
                                    <button type='button' className='sim-tm__quitar' onClick={() => form.removeLine(line.id)} aria-label={`Quitar ${line.nombre} del ticket`} title='Quitar del ticket'>×</button>
                                </li>
                            ))}
                        </ul>
                    )}

                <Toggle label='Lo preparo yo: la cocina automática no lo toca' value={form.cookedByHand} onChange={form.setCookedByHand} help='Encendido, a este ticket nadie le pone palomitas, ni lo despacha, ni le dispara el HOLD aunque «Cocina sola» esté en marcha: solo avanza con lo que hagas tú. Apagado, se cocina solo como cualquier otro, con su sorteo de demora.' />
                <Toggle label='Nace en pausa (HOLD)' value={form.onHold} onChange={form.setOnHold} help='La tarjeta sale retenida, como el plato fuerte de una mesa que lo mandó todo junto. Se dispara tocándola en la pantalla o con «Disparar» en su fila del registro.' />

                <div className='sim-botones' style={{ marginTop: 6 }}>
                    <button type='button' className='sim-boton sim-boton--chico sim-boton--principal' onClick={form.create} disabled={form.lines.length === 0} title={form.lines.length === 0 ? 'Añade al menos un plato' : 'Manda el ticket a la pantalla de cocina'}>
                        Crear ticket{form.lines.length > 0 && ` (${plural(form.lines.length, 'plato', 'platos')})`}
                    </button>
                </div>

                <p className={`sim-tm__aviso ${form.notice?.mal ? 'sim-aviso' : ''}`} role='status'>{form.notice?.texto}</p>

                <p className='sim-ayuda'>Para marcarlo: toca un producto en la pantalla para ponerle la palomita, o usa los botones “Listo” y “Despachar” de su fila en el registro.</p>
            </div>
        </Section>
    );
}


//  'memo': solo se repinta cuando cambia el tema o un tiempo máximo (o lo que se escribe en él), y no
//  con cada movimiento de un deslizador de otra sección. Es el formulario más pesado del panel: el
//  desplegable de platos lleva la carta entera.
export default memo(ManualTicketSection);
