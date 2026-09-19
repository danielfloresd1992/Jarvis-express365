import { useState, useRef, useEffect, useMemo } from 'react';
import { getCurrentTime } from '../component/Main/cells/GridCells.jsx';
import { createDishTypeResolver } from '../libs/tickets/dishCategory.js';




/*  ─────────────────────────────────────────────────────────────────────────────
 *  QUÉ COLUMNA LLENA CADA COLOR
 *
 *  Tres colores para tres columnas. La cuarta, 'dishDelivered', NO sale de aquí: esa
 *  hora la ve el monitorista por cámara y la anota a mano, porque la pantalla de la
 *  tablet no la muestra.
 *
 *      yellow → entró el ticket        → Toma de orden
 *      red    → arrancó el contador    → Listo en tablet
 *      green  → el pedido está listo   → Listo en cocina
 *
 *  Esto es lo ÚNICO que hay que tocar si al probarlo resulta que un color significa
 *  otra cosa. Ninguna otra línea del archivo depende de estos nombres.
 *
 *  ⚠  El único que no está confirmado del todo es el ROJO: se apuntó como "cuando
 *     empezó el contador", pero si al mirar la pantalla resulta ser una alarma de
 *     tiempo excedido, entonces no es un paso del proceso y hay que poner null aquí
 *     — eso hace que ese color solo pinte la fila, sin estampar hora.
 *  ───────────────────────────────────────────────────────────────────────────── */
export const COLUMN_BY_COLOR = {
    yellow: 'orderTaken',
    red:    'readyOnTablet',
    green:  'readyInKitchen',
};


//  Una fila de la parrilla de procesos, vacía. Es también el contrato: estos son
//  todos los campos que la tabla sabe pintar.
const EMPTY_ROW = {
    id: '',
    table: '',
    ticket: '',
    dish: '',
    dishType: '',
    color: '',
    orderTaken: '',
    readyOnTablet: '',
    readyInKitchen: '',
    dishDelivered: '',
    closed: false,
    closedAt: 0,
};


/*  Cuánto puede faltar un ticket de la pantalla y seguir considerándose el mismo.
 *
 *  Por debajo de este tiempo, que falte significa que una lectura se lo saltó —pasa,
 *  el modelo no acierta siempre— y hay que reabrirlo con su historia.
 *
 *  Por encima, significa que el pedido terminó y que lo que aparece ahora con la misma
 *  identidad es otro distinto.
 *
 *  Cinco minutos porque la pantalla se recorre entera en uno: si a los cinco no ha
 *  vuelto a salir en ninguna vuelta, no está.
 */
const REOPEN_WINDOW_MS = 5 * 60 * 1000;




/*  SEGUIMIENTO DE TICKETS
 *
 *  La pantalla de la tablet no muestra horas: muestra tickets de un color. Las
 *  columnas del formato, en cambio, son horas de reloj. Este hook es el puente entre
 *  las dos cosas.
 *
 *  El modelo dice QUÉ hay en pantalla ahora mismo. Aquí se guarda de qué color estaba
 *  cada ticket la vez anterior y, cuando cambia, se estampa la hora del equipo en la
 *  columna que le toque. Es decir: la IA ve, la app cronometra.
 *
 *  Tres cosas que hace y que no son obvias:
 *
 *  · Una hora estampada NO se pisa. Si un ticket parpadea entre dos colores, la
 *    columna conserva la primera vez que pasó, que es la que vale.
 *
 *  · Un ticket que desaparece NO se borra: se marca como cerrado y se queda en la
 *    lista con sus horas. Desaparecer es justo lo que hace un pedido cuando se
 *    entrega, y borrarlo ahí tiraría el dato el momento en que está completo.
 *
 *  · El tipo de plato se recalcula mientras no haya salido nada, porque las piezas
 *    con las que se decide llegan por separado. En cuanto da un resultado, se fija.
 *
 *  @param {Array}  reading   lo último que mandó la ventana flotante
 *  @param {string} resetKey  cuando cambia, el historial se vacía. Se le pasa el
 *                            local: los tickets de un sitio no tienen nada que hacer
 *                            en la parrilla de otro.
 *  @param {Array}  dishes    establishment.dishes, para saber de qué tipo es cada pedido
 *  @returns {Array} una fila por ticket, con la forma de EMPTY_ROW
 */
export function useTicketTracking(reading, resetKey, dishes) {


    //  El resolutor monta un índice de búsqueda por dentro, así que se construye una
    //  vez por carta y no en cada lectura.
    const resolveDishType = useMemo(() => createDishTypeResolver(dishes), [dishes]);


    //  El historial vive en una ref y no en el estado: se modifica en cada lectura y
    //  lo que se publica al componente es una copia. Guardarlo en estado obligaría a
    //  clonar el mapa entero en cada vuelta sin ganar nada.
    const historyRef = useRef(new Map());

    const [rows, setRows] = useState([]);


    //  Cambio de local (o de turno): se tira el historial y se empieza de cero. Va en
    //  su propio efecto y antes que el de la lectura, para que una lectura que llegue
    //  en el mismo ciclo entre ya sobre el historial limpio.
    useEffect(() => {
        historyRef.current = new Map();
        setRows([]);
    }, [resetKey]);


    useEffect(() => {
        if (!Array.isArray(reading)) return;

        const history = historyRef.current;
        const now = getCurrentTime();
        const seenNow = new Set();


        for (const ticket of reading) {
            const id = ticket?.id;
            if (!id) continue;               //  sin identidad no se puede seguir

            seenNow.add(id);

            let row = history.get(id) ?? { ...EMPTY_ROW, id };

            /*  VOLVER A APARECER: ¿ES EL MISMO PEDIDO O UNO NUEVO?
             *
             *  Esto va ANTES de tocar nada, porque decide sobre qué fila se trabaja.
             *
             *  Reabrir sin preguntar era peligroso cuando el ticket no trae número
             *  propio, porque entonces su identidad es mesa + plato. La mesa 12 pide
             *  una hamburguesa a la una, se le estampan sus horas y el ticket se
             *  cierra; a las dos la mesa 12 pide OTRA hamburguesa y cae en la misma
             *  clave. Como las horas ya estaban puestas no se volvían a estampar, y el
             *  pedido nuevo aparecía con la hora del viejo: un dato falso con toda la
             *  pinta de bueno.
             *
             *  Si reaparece enseguida es que una lectura se lo saltó y hay que
             *  reabrirlo tal cual. Si reaparece mucho después es otro pedido: el
             *  anterior se archiva con su historia intacta y este empieza de cero,
             *  heredando solo lo que describe al pedido y no lo que le pasó.
             */
            if (row.closed && row.closedAt && (Date.now() - row.closedAt) > REOPEN_WINDOW_MS) {
                const archivedId = `${id}#${row.closedAt}`;
                history.set(archivedId, { ...row, id: archivedId });

                row = {
                    ...EMPTY_ROW,
                    id,
                    table: row.table,
                    ticket: row.ticket,
                    dish: row.dish,
                    dishType: row.dishType,
                };
            }

            row.closed = false;
            row.closedAt = 0;

            //  Los datos del ticket se refrescan siempre que la lectura traiga algo:
            //  un cuadrante puede leer mal el plato una vez y bien la siguiente, y no
            //  hay motivo para quedarse con la mala.
            if (ticket.table) row.table = ticket.table;
            if (ticket.ticket) row.ticket = ticket.ticket;
            if (ticket.dish) row.dish = ticket.dish;

            //  EL TIPO SE RESUELVE, NO SE COPIA
            //
            //  Se reintenta mientras siga vacío: la carta del local puede cargar
            //  después de la primera lectura, y el nombre del plato puede leerse bien
            //  recién en la tercera vuelta.
            //
            //  En cuanto da un resultado se queda fijo: un tipo que cambia solo,
            //  después de que el monitorista lo haya visto, es peor que uno vacío.
            if (!row.dishType) {
                row.dishType = resolveDishType({ table: row.table, dish: row.dish, hint: ticket.dishType });
            }

            //  EL CAMBIO DE COLOR ES EL EVENTO
            //
            //  Un ticket recién visto cuenta como cambio: es la primera vez que se le
            //  ve de ese color, aunque llevara rato en pantalla.
            if (ticket.color && ticket.color !== row.color) {
                row.color = ticket.color;

                const column = COLUMN_BY_COLOR[ticket.color];

                //  Se estampa solo si esa columna sigue vacía. Un ticket que va y
                //  vuelve entre dos colores no debe reescribir la hora buena.
                if (column && !row[column]) row[column] = now;
            }

            history.set(id, row);
        }


        /*  LOS QUE YA NO ESTÁN
         *
         *  Se marcan como cerrados, no se borran.
         *
         *  Ojo con esto: la lectura solo ve un cuadrante por vuelta, así que un ticket
         *  podría faltar simplemente porque le tocaba otra zona de la pantalla. Por eso
         *  el cierre se apoya en lo que manda la ventana flotante, que YA acumula los
         *  cuatro cuadrantes y manda siempre la lista completa.
         */
        for (const [id, row] of history) {
            if (seenNow.has(id) || row.closed) continue;

            row.closed = true;
            row.closedAt = Date.now();   //  para saber luego si volver a verlo es el mismo pedido
        }


        /*  LO QUE SE PUBLICA
         *
         *  Los pedidos vivos van arriba y los terminados debajo. El mapa conserva el
         *  orden en que entraron, así que sin ordenar los de primera hora se quedaban
         *  en lo alto de la lista y los que están pasando ahora acababan enterrados
         *  bajo decenas de filas apagadas — justo al revés de lo que necesita alguien
         *  que está mirando el turno.
         *
         *  Se publica una copia superficial de cada fila. Si se publicaran los mismos
         *  objetos que hay en el mapa, React no vería cambio alguno —son la misma
         *  referencia— y la tabla no se redibujaría nunca.
         */
        const abiertos = [];
        const cerrados = [];

        for (const row of history.values()) {
            (row.closed ? cerrados : abiertos).push({ ...row });
        }

        setRows([...abiertos, ...cerrados]);

        //  'resolveDishType' entra en las dependencias a propósito: cuando la carta del
        //  local termina de cargar, esto vuelve a pasar y los tipos que se quedaron en
        //  blanco se rellenan. Volver a procesar la misma lectura no estampa horas de
        //  más — el color no ha cambiado y las horas puestas no se pisan.
    }, [reading, resolveDishType]);


    return rows;
}
