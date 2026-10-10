import { useEffect } from 'react';
import { SIMULACION_DISPONIBLE } from '../../../simulador/disponible.js';



// useSimulatorFeedback = «contarle al simulador lo que se ha inferido»
// EN SIMULACIÓN, LO INFERIDO SE LE CUENTA AL SIMULADOR. Él sabe a qué hora entró y se despachó cada
// tarjeta de verdad, y pone las dos cosas lado a lado. Es una difusión a un canal que nadie más
// escucha: sin una simulación en marcha, esto no hace nada.
// Recibe: { simulating      hay una simulación en marcha
//           orders          las filas que se están siguiendo
//           diagnosis       cómo fue la última vuelta de la lectura
//           censusing       el seguimiento sigue apuntando lo que ya estaba
//           alreadyThere }  las tarjetas que apartó el censo (un Set)
function useSimulatorFeedback({ simulating, orders, diagnosis, censusing, alreadyThere }) {

    useEffect(() => {
        if (!SIMULACION_DISPONIBLE || !simulating) return;

        //  Los nombres del mensaje van en español porque son los que espera el simulador.
        import('../../../simulador/adbSimulado.js')
            .then(({ publicarInferencia }) => publicarInferencia({ pedidos: orders, lectura: diagnosis, censando: censusing, yaEstaban: [...alreadyThere] }))
            .catch(() => { /* la comparación es una ayuda, no algo que pueda romper la ventana */ });
    }, [orders, diagnosis, censusing, simulating, alreadyThere]);
}



export { useSimulatorFeedback };
