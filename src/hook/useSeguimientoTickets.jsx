import { useState, useEffect, useMemo } from 'react';
import { getCurrentTime } from '../component/cells/GridCells.jsx';
import { crearResolutorDeTipo } from '../libs/tickets/tipoDePlato.js';
import { createEmptyGrid, clearGrid, updateProcessGrid, getGridRows, getCensusState } from '../libs/inference/processGrid.js';



// useSeguimientoTickets = «el seguimiento de los tickets»
// El puente entre lo que lee la IA y la parrilla de PROCESOS. Es un envoltorio fino: guarda la parrilla,
// llama a updateProcessGrid con cada lectura y publica. Las REGLAS están en libs/inference/processGrid.js.
// Recibe: lectura (la lista de tickets que entrega la tablet), horaTablet ('HH:MM:SS' de la tablet),
//         reinicio (el local: cuando cambia, la parrilla se vacía), carta (establishment.dishes),
//         tiraLeida (qué tira produjo la lectura; null = no hubo lectura: el arranque o una desconexión)
//         y tirasDeLaPantalla (en cuántas tiras se corta esta pantalla: es lo que dura el censo).
// Devuelve: { pedidos, censando, lecturasDelCenso, lecturasQueDuraElCenso, yaEstaban }
function useSeguimientoTickets(lectura, horaTablet, reinicio, carta, tiraLeida = null, tirasDeLaPantalla) {

    // resolveType = «resolver el tipo de plato». Monta un índice de búsqueda: se crea una vez por carta.
    const resolveType = useMemo(() => crearResolutorDeTipo(carta), [carta]);

    // grid = «la parrilla» · setGrid = «guardar la parrilla»
    const [grid, setGrid] = useState(createEmptyGrid());


    // 1. Cambio de local: la parrilla se vacía. Va ANTES que el efecto de la lectura, para que una
    //    lectura que llegue en el mismo ciclo entre ya sobre la parrilla limpia.
    useEffect(() => {
        setGrid(currentGrid => clearGrid(currentGrid));
    }, [reinicio]);


    // 2. STEP 6 · llega una lectura: updateProcessGrid la analiza, la compara y actualiza la parrilla.
    //    'resolveType' está en las dependencias a propósito: cuando la carta termina de cargar esto vuelve
    //    a pasar con la MISMA lectura, y updateProcessGrid solo rellena los tipos que quedaron en blanco.
    useEffect(() => {
        // reading = «la lectura»
        const reading = { tickets: lectura, hora: horaTablet, tira: tiraLeida, tiras: tirasDeLaPantalla };

        // context = «el contexto»: lo que no sale de la lectura
        const context = { resolveType: resolveType, deviceTime: getCurrentTime() };

        setGrid(currentGrid => updateProcessGrid(currentGrid, reading, context));
    }, [lectura, horaTablet, resolveType, tiraLeida, tirasDeLaPantalla]);


    // 3. Lo que se publica
    // rows = «las filas para pintar»
    const rows = useMemo(() => getGridRows(grid), [grid]);

    // censusState = «el estado del censo»
    const censusState = getCensusState(grid, tirasDeLaPantalla);

    return {
        pedidos: rows,
        censando: censusState.censando,
        lecturasDelCenso: censusState.lecturasDelCenso,
        lecturasQueDuraElCenso: censusState.lecturasQueDuraElCenso,
        yaEstaban: censusState.yaEstaban,
    };
}


export { useSeguimientoTickets };
