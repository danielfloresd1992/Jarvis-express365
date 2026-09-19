/*  ─────────────────────────────────────────────────────────────────────────────
 *  UN LECTOR DE MENTIRA, PARA CUANDO LA IA DE VERDAD NO ESTÁ
 *
 *  Contesta lo que contestaría un modelo que leyera bien la tira de pantalla que se le
 *  manda — y, si se le pide, con los mismos tropiezos que tiene el de verdad.
 *
 *  SOLO «VE» LO QUE VERÍA LA IA. La pantalla se lee a tiras verticales, y el prompt
 *  pide incluir únicamente los tickets cuya CABECERA se vea completa. Así que aquí
 *  una tarjeta cuenta si su cabecera cae entera dentro de la tira; un trozo
 *  «…Continued», que no tiene cabecera, no cuenta nunca. Las cuentas de dónde empieza
 *  y acaba cada tira son las MISMAS que hace recortarTira en TabletScreen.
 *
 *  CONTESTA EN EL FORMATO DEL MODELO, texto incluido: un array JSON con 'cabecera',
 *  'tipo' y 'listo', envuelto en un bloque ```json como hace el de verdad aunque se le
 *  pida que no. Así la respuesta pasa por extraerTickets y leerCabecera, y lo que se
 *  prueba es el parser real y no un atajo.
 *
 *  LOS TROPIEZOS, cada uno visto en producción:
 *      · saltarse una tarjeta que sí estaba
 *      · leer mal un dígito del número de ticket
 *      · transcribir una cabecera cortada: "6 #34 1:03" por "Table 16 #34 1:03"
 *  ───────────────────────────────────────────────────────────────────────────── */


export const RUIDO_POR_DEFECTO = {
    probSaltar: 0,
    probErrorDeDigito: 0,
    probCabeceraCortada: 0,
};


//  Los límites de una tira, en píxeles de la pantalla. Igual que en recortarTira.
export function limitesDeLaTira(ancho, tiras, solape, indice) {
    const paso = ancho / tiras;
    const margen = paso * solape;

    return {
        desde: Math.max(0, Math.floor(indice * paso - margen)),
        hasta: Math.min(ancho, Math.ceil((indice + 1) * paso + margen)),
    };
}


function cambiarUnDigito(numero, azar) {
    const digitos = String(numero).split('');
    const donde = Math.floor(azar() * digitos.length);

    let otro = digitos[donde];
    while (otro === digitos[donde]) otro = String(Math.floor(azar() * 10));
    digitos[donde] = otro;

    return digitos.join('');
}


/**
 * @param {object}   que
 * @param {object}   que.maqueta   lo que devolvió maquetar(): de aquí salen las cabeceras
 * @param {Array}    que.visibles  las tarjetas tal como se pintaron
 * @param {object}   que.tema
 * @param {number}   que.tira      índice de la tira, de izquierda a derecha
 * @param {number}   que.tiras
 * @param {number}   que.solape
 * @param {object}   [que.ruido]
 * @param {function} [que.azar]    () → [0, 1)
 * @returns {{ contenido: string, vistas: number }}
 */
export function leerTiraSimulada({ maqueta, visibles, tema, tira, tiras, solape, ruido = RUIDO_POR_DEFECTO, azar = Math.random }) {

    const { desde, hasta } = limitesDeLaTira(tema.ancho, tiras, solape, tira);

    const porId = new Map(visibles.map(t => [t.id, t]));

    const tickets = [];

    for (const cabecera of maqueta.cabeceras) {

        //  La cabecera tiene que caber ENTERA en la tira.
        if (cabecera.x < desde || cabecera.x + cabecera.ancho > hasta) continue;

        const tarjeta = porId.get(cabecera.tarjetaId);
        if (!tarjeta) continue;

        if (azar() < ruido.probSaltar) continue;

        //  El tiempo de arriba a la derecha. Si ahí hay una hora prometida ('@3:35p'),
        //  el prompt manda copiar el del FIRE.
        const tiempo = tema.horaPrometidaEnCabecera && tarjeta.horaPrometida && tarjeta.tiempoFuego
            ? tarjeta.tiempoFuego
            : tarjeta.tiempoCabecera;

        let numero = String(tarjeta.numero);
        if (azar() < ruido.probErrorDeDigito) numero = cambiarUnDigito(numero, azar);

        let mesa = tarjeta.mesa !== null ? `Table ${tarjeta.mesa} ` : '';
        if (mesa && azar() < ruido.probCabeceraCortada) {
            //  Cortada por el borde: se pierde 'Table' y el primer dígito de la mesa.
            mesa = `${String(tarjeta.mesa).slice(1)} `.trimStart();
        }

        tickets.push({
            cabecera: `${mesa}#${numero} ${tiempo}`.trim(),
            tipo: tarjeta.curso ?? tarjeta.rotulo ?? '',
            listo: tarjeta.todosHechos,
        });
    }

    return {
        vistas: tickets.length,
        contenido: '```json\n' + JSON.stringify(tickets, null, 2) + '\n```',
    };
}
