import { useState, useEffect, useMemo } from 'react';
import { getCurrentTime } from '../../cells/GridCells.jsx';
import { crearResolutorDeTipo } from '../../../libs/tickets/tipoDePlato.js';
import { createEmptyGrid, clearGrid, updateProcessGrid, getGridRows, getCensusState } from '../../../libs/inference/processGrid.js';



// useProcessTracking = «el seguimiento de los pedidos»
// STEP 6 de la lectura. El puente entre lo que lee la IA y el registro de las mesas: sigue cada PEDIDO por
// separado, calcula su toma de orden y sella 'Listo en tablet' cuando lo ve ponerse listo o desaparecer.
// Es un envoltorio fino: guarda el seguimiento, llama a updateProcessGrid con cada lectura y publica.
// Las REGLAS están en libs/inference/processGrid.js.
// Recibe: { tickets        la lista de tickets que entrega la lectura (useTicketReading)
//           tabletTime     la hora de la tablet en esa lectura, 'HH:MM:SS'
//           resetKey       cuando cambia, el seguimiento se vacía: otro local, se limpió el registro, o se pasó de la tablet a la simulación
//           dishes         la carta del local (establishment.dishes): de ella sale el tipo de plato
//           fromReading }  la lista sale de una lectura. false = no hubo lectura: el arranque o una desconexión
// Devuelve: { orders, censusing, censusReadings, censusLength, alreadyThere }
//   orders          los pedidos que se siguen: useRegisterStore los mete cada uno en su mesa
//   censusing       se sigue apuntando lo que ya estaba en pantalla al conectar
//   censusReadings  cuántas lecturas lleva el censo…
//   censusLength    …y cuántas dura
//   alreadyThere    las tarjetas que apartó el censo (un Set con sus claves)
function useProcessTracking({ tickets, tabletTime, resetKey, dishes, fromReading = false }) {

    // resolveType = «resolver el tipo de plato». Monta un índice de búsqueda: se crea una vez por carta.
    const resolveType = useMemo(() => crearResolutorDeTipo(dishes), [dishes]);

    // grid = «el seguimiento» · setGrid = «guardar el seguimiento»
    const [grid, setGrid] = useState(createEmptyGrid);


    // 1. Cambio de local, o register limpiado: el seguimiento se vacía. Va ANTES que el efecto de la
    //    lectura, para que una lectura que llegue en el mismo ciclo entre ya sobre el seguimiento limpio.
    useEffect(() => {
        setGrid(currentGrid => clearGrid(currentGrid));
    }, [resetKey]);


    // 2. STEP 6 · llega una lectura: updateProcessGrid la analiza, la compara y actualiza el seguimiento.
    //    'resolveType' está en las dependencias a propósito: cuando la carta termina de cargar esto vuelve
    //    a pasar con la MISMA lectura, y updateProcessGrid solo rellena los tipos que quedaron en blanco.
    useEffect(() => {
        // reading = «la lectura»
        const reading = { tickets: tickets, hora: tabletTime, leida: fromReading };

        // context = «el contexto»: lo que no sale de la lectura
        const context = { resolveType: resolveType, deviceTime: getCurrentTime() };

        setGrid(currentGrid => updateProcessGrid(currentGrid, reading, context));
    }, [tickets, tabletTime, resolveType, fromReading]);


    // 3. Lo que se publica
    // rows = «las filas para pintar»
    const rows = useMemo(() => getGridRows(grid), [grid]);

    // censusState = «el estado del censo»
    const censusState = getCensusState(grid);

    return {
        orders: rows,
        censusing: censusState.censando,
        censusReadings: censusState.lecturasDelCenso,
        censusLength: censusState.lecturasQueDuraElCenso,
        alreadyThere: censusState.yaEstaban,
    };
}



export { useProcessTracking };
